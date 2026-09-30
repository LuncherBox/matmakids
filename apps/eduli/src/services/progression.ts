import {
  currentLevelTrainingCount,
  isProgressionMissionUnlocked,
  type SkillBandProgress
} from '../domain/progression/model';
import { supabase } from '../lib/supabase';
import { getMechanicProgress } from './progress';

export type ProgressionState = {
  schemaReady: boolean;
  progressionLevel: number | null;
  learnedUnits: number;
  missionUnlocked: boolean;
};

export type SkillBandState = {
  schemaReady: boolean;
  progressionLevel: number | null;
  rows: SkillBandProgress[];
};

function missingProgressionSchema(
  error: { code?: string; message?: string } | null
) {
  if (!error) return false;

  return (
    error.code === '42703' ||
    error.code === '42P01' ||
    /progression_level|child_skill_band_progress/i.test(error.message ?? '')
  );
}

export async function getProgressionState(
  childId: string
): Promise<ProgressionState> {
  const { data: child, error: childError } = await supabase
    .from('children')
    .select('progression_level')
    .eq('id', childId)
    .single();

  if (childError) {
    if (missingProgressionSchema(childError)) {
      return getLegacyProgressionState(childId);
    }

    throw childError;
  }

  const progressionLevel = child.progression_level ?? null;

  const { data, error } = await supabase
    .from('child_skill_band_progress')
    .select(
      'child_id, task_type, difficulty_band, training_status, unlocked_level, training_attempts, successful_tasks, first_try_tasks, hint_tasks, guided_help_tasks, learned_at'
    )
    .eq('child_id', childId);

  if (error) {
    if (missingProgressionSchema(error)) {
      return getLegacyProgressionState(childId);
    }

    throw error;
  }

  const rows = (data ?? []) as SkillBandProgress[];

  if (progressionLevel == null) {
    const legacy = await getLegacyProgressionState(childId);

    return {
      schemaReady: true,
      progressionLevel: null,
      learnedUnits: legacy.learnedUnits,
      missionUnlocked: legacy.missionUnlocked
    };
  }

  return {
    schemaReady: true,
    progressionLevel,
    learnedUnits: currentLevelTrainingCount(rows, progressionLevel),
    missionUnlocked: isProgressionMissionUnlocked(rows, progressionLevel)
  };
}

async function getLegacyProgressionState(
  childId: string
): Promise<ProgressionState> {
  const rows = await getMechanicProgress(childId);
  const learnedUnits = new Set(
    rows
      .filter((row) => row.training_status === 'learned')
      .map((row) => row.task_type)
  ).size;

  return {
    schemaReady: false,
    progressionLevel: null,
    learnedUnits,
    missionUnlocked: learnedUnits >= 3
  };
}


export async function getSkillBandState(
  childId: string
): Promise<SkillBandState> {
  const { data: child, error: childError } = await supabase
    .from('children')
    .select('progression_level')
    .eq('id', childId)
    .single();

  if (childError) {
    if (missingProgressionSchema(childError)) {
      return {
        schemaReady: false,
        progressionLevel: null,
        rows: []
      };
    }

    throw childError;
  }

  const { data, error } = await supabase
    .from('child_skill_band_progress')
    .select(
      'child_id, task_type, difficulty_band, training_status, unlocked_level, training_attempts, successful_tasks, first_try_tasks, hint_tasks, guided_help_tasks, learned_at'
    )
    .eq('child_id', childId);

  if (error) {
    if (missingProgressionSchema(error)) {
      return {
        schemaReady: false,
        progressionLevel: child.progression_level ?? null,
        rows: []
      };
    }

    throw error;
  }

  return {
    schemaReady: true,
    progressionLevel: child.progression_level ?? null,
    rows: (data ?? []) as SkillBandProgress[]
  };
}

export async function markSkillBandLearned(input: {
  childId: string;
  taskType: string;
  difficultyBand: number;
  progressionLevel: number;
}) {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('child_skill_band_progress')
    .upsert(
      {
        child_id: input.childId,
        task_type: input.taskType,
        difficulty_band: input.difficultyBand,
        training_status: 'learned',
        unlocked_level: input.progressionLevel,
        training_attempts: 1,
        learned_at: now,
        updated_at: now
      },
      {
        onConflict: 'child_id,task_type,difficulty_band'
      }
    );

  if (error) {
    if (missingProgressionSchema(error)) return false;
    throw error;
  }

  return true;
}


export async function recordSkillBandTaskResult(input: {
  childId: string;
  taskType: string;
  difficultyBand: number;
  correctFirstTry: boolean;
  usedHint: boolean;
  usedGuidedHelp: boolean;
}) {
  const { data, error: readError } = await supabase
    .from('child_skill_band_progress')
    .select(
      'successful_tasks, first_try_tasks, hint_tasks, guided_help_tasks'
    )
    .eq('child_id', input.childId)
    .eq('task_type', input.taskType)
    .eq('difficulty_band', input.difficultyBand)
    .maybeSingle();

  if (readError) {
    if (missingProgressionSchema(readError)) return false;
    throw readError;
  }

  if (!data) return false;

  const { error } = await supabase
    .from('child_skill_band_progress')
    .update({
      successful_tasks: Number(data.successful_tasks ?? 0) + 1,
      first_try_tasks:
        Number(data.first_try_tasks ?? 0) +
        (input.correctFirstTry ? 1 : 0),
      hint_tasks:
        Number(data.hint_tasks ?? 0) + (input.usedHint ? 1 : 0),
      guided_help_tasks:
        Number(data.guided_help_tasks ?? 0) +
        (input.usedGuidedHelp ? 1 : 0),
      updated_at: new Date().toISOString()
    })
    .eq('child_id', input.childId)
    .eq('task_type', input.taskType)
    .eq('difficulty_band', input.difficultyBand);

  if (error) {
    if (missingProgressionSchema(error)) return false;
    throw error;
  }

  return true;
}
