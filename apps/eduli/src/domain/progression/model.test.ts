import { describe, expect, it } from 'vitest';

import {
  availableDifficultyBands,
  currentLevelTrainingCount,
  highestAvailableBandAtOrBelow,
  isProgressionMissionUnlocked,
  isSkillBandLearned,
  isTaskEligibleFromSkillBands,
  maxLearnedBandByMechanic,
  progressionDifficultyBand,
  tasksAtOrBelowDifficultyBand,
  tasksForDifficultyBand,
  type SkillBandProgress
} from './model';

function row(
  taskType: string,
  difficultyBand: number,
  unlockedLevel: number,
  trainingStatus: SkillBandProgress['training_status'] = 'learned'
): SkillBandProgress {
  return {
    child_id: 'child-1',
    task_type: taskType,
    difficulty_band: difficultyBand,
    training_status: trainingStatus,
    unlocked_level: unlockedLevel,
    training_attempts: 1,
    successful_tasks: 0,
    first_try_tasks: 0,
    hint_tasks: 0,
    guided_help_tasks: 0,
    learned_at: '2026-09-29T00:00:00.000Z'
  };
}

describe('progression skill bands', () => {
  it('unlocks a level mission after 3 learned units for that level', () => {
    const rows = [
      row('math:addition', 1, 1),
      row('math:subtraction', 1, 1),
      row('logic:logical_sequence', 1, 1)
    ];

    expect(currentLevelTrainingCount(rows, 1)).toBe(3);
    expect(isProgressionMissionUnlocked(rows, 1)).toBe(true);
  });

  it('does not count learned units from another progression level', () => {
    const rows = [
      row('math:addition', 1, 1),
      row('math:subtraction', 1, 1),
      row('logic:logical_sequence', 1, 2)
    ];

    expect(currentLevelTrainingCount(rows, 1)).toBe(2);
    expect(isProgressionMissionUnlocked(rows, 1)).toBe(false);
  });

  it('keeps the highest learned difficulty band per mechanic', () => {
    const rows = [
      row('math:addition', 1, 1),
      row('math:addition', 2, 2),
      row('math:addition', 3, 3, 'training')
    ];

    expect(maxLearnedBandByMechanic(rows).get('math:addition')).toBe(2);
  });

  it('keeps easier tasks eligible after learning a harder band', () => {
    const rows = [row('math:addition', 2, 2)];

    expect(
      isTaskEligibleFromSkillBands(
        {
          id: 'a1',
          category: 'math',
          subcategory: 'addition',
          renderer: 'equation_with_dots',
          correct_answer: 5,
          difficulty: 1
        },
        'math:addition',
        rows
      )
    ).toBe(true);
  });

  it('does not expose a task above the highest learned band', () => {
    const rows = [row('math:addition', 1, 1)];

    expect(
      isTaskEligibleFromSkillBands(
        {
          id: 'a2',
          category: 'math',
          subcategory: 'addition',
          renderer: 'equation_with_dots',
          correct_answer: 12,
          difficulty: 2
        },
        'math:addition',
        rows
      )
    ).toBe(false);
  });
});


describe('progression band selection', () => {
  const tasks = [
    {
      id: 'l0',
      category: 'math' as const,
      subcategory: 'addition',
      renderer: 'equation_with_dots',
      correct_answer: 3,
      difficulty: 0
    },
    {
      id: 'l1',
      category: 'math' as const,
      subcategory: 'addition',
      renderer: 'equation_with_dots',
      correct_answer: 5,
      difficulty: 1
    },
    {
      id: 'l2',
      category: 'math' as const,
      subcategory: 'addition',
      renderer: 'equation_with_dots',
      correct_answer: 12,
      difficulty: 2
    }
  ];

  it('maps progression levels directly to non-negative difficulty bands', () => {
    expect(progressionDifficultyBand(0)).toBe(0);
    expect(progressionDifficultyBand(2)).toBe(2);
    expect(progressionDifficultyBand(-3)).toBe(0);
  });

  it('detects learned state for a specific mechanic and band', () => {
    const rows = [row('math:addition', 1, 1)];

    expect(isSkillBandLearned(rows, 'math:addition', 1)).toBe(true);
    expect(isSkillBandLearned(rows, 'math:addition', 2)).toBe(false);
  });

  it('returns available bands and exact-band training tasks', () => {
    expect(availableDifficultyBands(tasks)).toEqual([0, 1, 2]);
    expect(tasksForDifficultyBand(tasks, 1).map((task) => task.id)).toEqual([
      'l1'
    ]);
  });

  it('keeps lower-band tasks available cumulatively', () => {
    expect(
      tasksAtOrBelowDifficultyBand(tasks, 1).map((task) => task.id)
    ).toEqual(['l0', 'l1']);
  });

  it('selects the highest available band without exceeding the child level', () => {
    expect(highestAvailableBandAtOrBelow(tasks, 0)).toBe(0);
    expect(highestAvailableBandAtOrBelow(tasks, 1)).toBe(1);
    expect(highestAvailableBandAtOrBelow(tasks, 4)).toBe(2);
  });

  it('returns no trainable band when Level 0 content is missing', () => {
    expect(highestAvailableBandAtOrBelow(tasks.slice(1), 0)).toBeNull();
  });
});
