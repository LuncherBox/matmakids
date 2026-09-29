import { describe, expect, it } from 'vitest';

import {
  currentLevelTrainingCount,
  isProgressionMissionUnlocked,
  isTaskEligibleFromSkillBands,
  maxLearnedBandByMechanic,
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
