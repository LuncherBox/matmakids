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
