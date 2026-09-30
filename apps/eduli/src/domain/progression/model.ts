import type { Task } from '../../types/tasks';

export const MISSION_UNLOCK_SKILL_BANDS = 3;

export type SkillBandProgress = {
  child_id: string;
  task_type: string;
  difficulty_band: number;
  training_status: 'new' | 'training' | 'learned';
  unlocked_level: number | null;
  training_attempts: number;
  successful_tasks: number;
  first_try_tasks: number;
  hint_tasks: number;
  guided_help_tasks: number;
  learned_at: string | null;
};

export function taskDifficultyBand(task: Task) {
  const raw = Number(
    (task as Task & { difficulty?: number }).difficulty ??
      task.level ??
      1
  );

  if (!Number.isFinite(raw)) return 1;
  return Math.max(0, Math.round(raw));
}

export function skillBandKey(taskType: string, difficultyBand: number) {
  return `${taskType}::${difficultyBand}`;
}

export function learnedBandsForLevel(
  rows: SkillBandProgress[],
  progressionLevel: number
) {
  return rows.filter(
    (row) =>
      row.training_status === 'learned' &&
      row.unlocked_level === progressionLevel
  );
}

export function currentLevelTrainingCount(
  rows: SkillBandProgress[],
  progressionLevel: number
) {
  return new Set(
    learnedBandsForLevel(rows, progressionLevel).map((row) =>
      skillBandKey(row.task_type, row.difficulty_band)
    )
  ).size;
}

export function isProgressionMissionUnlocked(
  rows: SkillBandProgress[],
  progressionLevel: number
) {
  return (
    currentLevelTrainingCount(rows, progressionLevel) >=
    MISSION_UNLOCK_SKILL_BANDS
  );
}

export function maxLearnedBandByMechanic(rows: SkillBandProgress[]) {
  const result = new Map<string, number>();

  rows
    .filter((row) => row.training_status === 'learned')
    .forEach((row) => {
      const previous = result.get(row.task_type) ?? -1;
      if (row.difficulty_band > previous) {
        result.set(row.task_type, row.difficulty_band);
      }
    });

  return result;
}

export function isTaskEligibleFromSkillBands(
  task: Task,
  taskType: string,
  learnedRows: SkillBandProgress[]
) {
  const maxByMechanic = maxLearnedBandByMechanic(learnedRows);
  const maxBand = maxByMechanic.get(taskType);

  if (maxBand == null) return false;

  return taskDifficultyBand(task) <= maxBand;
}


export function progressionDifficultyBand(progressionLevel: number) {
  if (!Number.isFinite(progressionLevel)) return 0;
  return Math.max(0, Math.round(progressionLevel));
}

export function isSkillBandLearned(
  rows: SkillBandProgress[],
  taskType: string,
  difficultyBand: number
) {
  return rows.some(
    (row) =>
      row.task_type === taskType &&
      row.difficulty_band === difficultyBand &&
      row.training_status === 'learned'
  );
}

export function learnedDifficultyBands(
  rows: SkillBandProgress[],
  taskType: string
) {
  return rows
    .filter(
      (row) =>
        row.task_type === taskType &&
        row.training_status === 'learned'
    )
    .map((row) => row.difficulty_band)
    .sort((a, b) => a - b);
}

export function availableDifficultyBands(tasks: Task[]) {
  return [...new Set(tasks.map(taskDifficultyBand))].sort((a, b) => a - b);
}

export function tasksForDifficultyBand(
  tasks: Task[],
  difficultyBand: number
) {
  return tasks.filter(
    (task) => taskDifficultyBand(task) === difficultyBand
  );
}

export function tasksAtOrBelowDifficultyBand(
  tasks: Task[],
  difficultyBand: number
) {
  return tasks.filter(
    (task) => taskDifficultyBand(task) <= difficultyBand
  );
}
