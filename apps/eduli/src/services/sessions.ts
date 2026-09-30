import { supabase } from '../lib/supabase';

export async function startMissionSession(
  childId: string,
  taskCount: number,
  gobiLevel: number,
  learningLevel?: number | null
) {
  const session = {
    child_id: childId,
    status: 'started',
    task_count: taskCount,
    correct_first_try_count: 0,
    mistake_count: 0,
    child_points: 0,
    gobi_points: 0,
    mode: 'mixed',
    category: null,
    gobi_level: gobiLevel,
    ...(learningLevel == null ? {} : { learning_level: learningLevel })
  };

  const { data, error } = await supabase
    .from('sessions')
    .insert(session)
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function saveMissionAnswer(input: {
  sessionId: string;
  taskId: string;
  taskType: string;
  category: string;
  attempts: number;
  correctFirstTry: boolean;
  usedHint: boolean;
  usedGuidedHelp: boolean;
  pointsChild: number;
  pointsGobi: number;
}) {
  const { data: existing, error: readError } = await supabase
    .from('session_answers')
    .select('id')
    .eq('session_id', input.sessionId)
    .eq('task_id', input.taskId)
    .limit(1);

  if (readError) throw readError;
  if (existing?.length) return false;

  const { error } = await supabase.from('session_answers').insert({
    session_id: input.sessionId,
    task_id: input.taskId,
    task_type: input.taskType,
    category: input.category,
    attempts: input.attempts,
    correct_first_try: input.correctFirstTry,
    used_hint: input.usedHint,
    used_guided_help: input.usedGuidedHelp,
    points_child: input.pointsChild,
    points_gobi: input.pointsGobi
  });

  if (error) throw error;
  return true;
}

export async function updateMissionTotals(input: {
  sessionId: string;
  correctFirstTry: number;
  mistakes: number;
  childPoints: number;
  gobiPoints: number;
}) {
  const { error } = await supabase
    .from('sessions')
    .update({
      correct_first_try_count: input.correctFirstTry,
      mistake_count: input.mistakes,
      child_points: input.childPoints,
      gobi_points: input.gobiPoints
    })
    .eq('id', input.sessionId);

  if (error) throw error;
}

export async function finishMission(input: {
  sessionId: string;
  correctFirstTry: number;
  mistakes: number;
  childPoints: number;
  gobiPoints: number;
}) {
  const winner =
    input.childPoints > input.gobiPoints
      ? 'child'
      : input.gobiPoints > input.childPoints
        ? 'gobi'
        : 'draw';

  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      correct_first_try_count: input.correctFirstTry,
      mistake_count: input.mistakes,
      child_points: input.childPoints,
      gobi_points: input.gobiPoints,
      winner
    })
    .eq('id', input.sessionId);

  if (error) throw error;
  return winner;
}

export async function abandonMission(
  sessionId: string,
  totals: {
    correctFirstTry: number;
    mistakes: number;
    childPoints: number;
    gobiPoints: number;
  }
) {
  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'abandoned',
      completed_at: new Date().toISOString(),
      correct_first_try_count: totals.correctFirstTry,
      mistake_count: totals.mistakes,
      child_points: totals.childPoints,
      gobi_points: totals.gobiPoints,
      winner: null
    })
    .eq('id', sessionId);

  if (error) throw error;
}

export async function recalculateMissionTotals(sessionId: string) {
  const { data, error } = await supabase
    .from('session_answers')
    .select('attempts, correct_first_try, points_child, points_gobi')
    .eq('session_id', sessionId);

  if (error) throw error;

  const rows = data ?? [];

  return {
    correctFirstTry: rows.filter((row) => row.correct_first_try).length,
    mistakes: rows.filter((row) => Number(row.attempts ?? 1) > 1).length,
    childPoints: rows.reduce(
      (sum, row) => sum + Number(row.points_child ?? 0),
      0
    ),
    gobiPoints: rows.reduce(
      (sum, row) => sum + Number(row.points_gobi ?? 0),
      0
    )
  };
}

export async function getRecentTaskIds(
  childId: string,
  recentSessionLimit = 3
): Promise<Set<string>> {
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
    .limit(recentSessionLimit);

  if (sessionsError) throw sessionsError;

  const sessionIds = (sessions ?? []).map((session) => session.id);
  if (!sessionIds.length) return new Set();

  const { data: answers, error: answersError } = await supabase
    .from('session_answers')
    .select('task_id')
    .in('session_id', sessionIds);

  if (answersError) throw answersError;

  return new Set(
    (answers ?? [])
      .map((answer) => answer.task_id)
      .filter(Boolean)
  );
}


export async function isMissionSessionActive(
  sessionId: string,
  childId: string
) {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, child_id, status')
    .eq('id', sessionId)
    .eq('child_id', childId)
    .maybeSingle();

  if (error) throw error;

  return Boolean(data && data.status === 'started');
}
