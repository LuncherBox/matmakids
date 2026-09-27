import { supabase } from '../lib/supabase';

export type CategoryStats = {
  category: string;
  total: number;
  correctFirstTry: number;
  accuracy: number;
};

export type MechanicStats = {
  taskType: string;
  total: number;
  correctFirstTry: number;
  accuracy: number;
};

export type MissionHistoryItem = {
  id: string;
  date: string;
  childPoints: number;
  gobiPoints: number;
  winner: string | null;
};

export type ChildStats = {
  completedMissions: number;
  totalPoints: number;
  activeDays: number;
  streak: number;
  recentMissions: MissionHistoryItem[];
  totalTasks: number;
  correctFirstTry: number;
  mistakes: number;
  hintsUsed: number;
  guidedHelpUsed: number;
  firstTryAccuracy: number;
  categories: CategoryStats[];
  mechanics: MechanicStats[];
};

export async function getChildStats(childId: string): Promise<ChildStats> {
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id, status, mistake_count, child_points, gobi_points, winner, started_at, completed_at')
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

  const activeDateKeys = [...new Set(
    (sessions ?? [])
      .map((session) => session.completed_at ?? session.started_at)
      .filter(Boolean)
      .map((value) => new Date(value).toISOString().slice(0, 10))
  )].sort().reverse();

  const activeDays = activeDateKeys.length;

  let streak = 0;
  if (activeDateKeys.length) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const latest = new Date(`${activeDateKeys[0]}T00:00:00`);
    const diffFromToday = Math.round((today.getTime() - latest.getTime()) / 86400000);

    if (diffFromToday <= 1) {
      let expected = latest;

      for (const key of activeDateKeys) {
        const current = new Date(`${key}T00:00:00`);
        if (current.getTime() !== expected.getTime()) break;

        streak += 1;
        expected = new Date(expected.getTime() - 86400000);
      }
    }
  }

  const recentMissions = (sessions ?? [])
    .filter((session) => session.status === 'completed')
    .slice(0, 10)
    .map((session) => ({
      id: session.id,
      date: session.completed_at ?? session.started_at,
      childPoints: Number(session.child_points ?? 0),
      gobiPoints: Number(session.gobi_points ?? 0),
      winner: session.winner ?? null
    }));

  const sessionIds = (sessions ?? []).map((session) => session.id);

  if (!sessionIds.length) {
    return {
      completedMissions: 0,
      totalPoints: 0,
      activeDays,
      streak,
      recentMissions,
      totalTasks: 0,
      correctFirstTry: 0,
      mistakes: 0,
      hintsUsed: 0,
      guidedHelpUsed: 0,
      firstTryAccuracy: 0,
      categories: [],
      mechanics: []
    };
  }

  const { data: answers, error: answersError } = await supabase
    .from('session_answers')
    .select('category, task_type, correct_first_try, used_hint, used_guided_help, attempts')
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

  const byMechanic = new Map<string, { total: number; correctFirstTry: number }>();

  rows.forEach((row) => {
    const taskType = row.task_type || 'other';
    const current = byMechanic.get(taskType) ?? { total: 0, correctFirstTry: 0 };
    current.total += 1;
    if (row.correct_first_try) current.correctFirstTry += 1;
    byMechanic.set(taskType, current);
  });

  const mechanics = [...byMechanic.entries()]
    .map(([taskType, value]) => ({
      taskType,
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
    activeDays,
    streak,
    recentMissions,
    totalTasks,
    correctFirstTry,
    mistakes,
    hintsUsed,
    guidedHelpUsed,
    firstTryAccuracy: totalTasks
      ? Math.round((correctFirstTry / totalTasks) * 100)
      : 0,
    categories,
    mechanics
  };
}
