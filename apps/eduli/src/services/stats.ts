import { supabase } from '../lib/supabase';

export type CategoryStats = {
  category: string;
  total: number;
  correctFirstTry: number;
  accuracy: number;
};

export type ChildStats = {
  completedMissions: number;
  totalPoints: number;
  totalTasks: number;
  correctFirstTry: number;
  mistakes: number;
  hintsUsed: number;
  guidedHelpUsed: number;
  firstTryAccuracy: number;
  categories: CategoryStats[];
};

export async function getChildStats(childId: string): Promise<ChildStats> {
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id, status, mistake_count, child_points')
    .eq('child_id', childId)
    .order('created_at', { ascending: false });

  if (sessionsError) throw sessionsError;

  const completedMissions = (sessions ?? []).filter(
    (session) => session.status === 'completed'
  ).length;
  const totalPoints = (sessions ?? []).reduce(
    (sum, session) => sum + Number(session.child_points ?? 0),
    0
  );

  const sessionIds = (sessions ?? []).map((session) => session.id);

  if (!sessionIds.length) {
    return {
      completedMissions: 0,
      totalPoints: 0,
      totalTasks: 0,
      correctFirstTry: 0,
      mistakes: 0,
      hintsUsed: 0,
      guidedHelpUsed: 0,
      firstTryAccuracy: 0,
      categories: []
    };
  }

  const { data: answers, error: answersError } = await supabase
    .from('session_answers')
    .select('category, correct_first_try, used_hint, used_guided_help, attempts')
    .in('session_id', sessionIds);

  if (answersError) throw answersError;

  const rows = answers ?? [];
  const totalTasks = rows.length;
  const correctFirstTry = rows.filter((row) => row.correct_first_try).length;
  const mistakes = rows.reduce(
    (sum, row) => sum + Math.max(0, Number(row.attempts ?? 1) - 1),
    0
  );
  const hintsUsed = rows.filter((row) => row.used_hint).length;
  const guidedHelpUsed = rows.filter((row) => row.used_guided_help).length;

  const byCategory = new Map<string, { total: number; correctFirstTry: number }>();

  rows.forEach((row) => {
    const category = row.category || 'other';
    const current = byCategory.get(category) ?? { total: 0, correctFirstTry: 0 };
    current.total += 1;
    if (row.correct_first_try) current.correctFirstTry += 1;
    byCategory.set(category, current);
  });

  const categories = [...byCategory.entries()]
    .map(([category, value]) => ({
      category,
      total: value.total,
      correctFirstTry: value.correctFirstTry,
      accuracy: value.total
        ? Math.round((value.correctFirstTry / value.total) * 100)
        : 0
    }))
    .sort((a, b) => b.total - a.total);

  return {
    completedMissions,
    totalPoints,
    totalTasks,
    correctFirstTry,
    mistakes,
    hintsUsed,
    guidedHelpUsed,
    firstTryAccuracy: totalTasks
      ? Math.round((correctFirstTry / totalTasks) * 100)
      : 0,
    categories
  };
}
