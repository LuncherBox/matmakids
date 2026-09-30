import { describe, expect, it } from 'vitest';

import type { Task } from '../../types/tasks';
import {
  canShowMissionHint,
  isMemoryRenderer,
  taskGuidedHelp,
  taskLevelOneHint
} from './help';

function task(renderer: string, subcategory?: string): Task {
  return {
    id: 'test',
    category: renderer.includes('memory') ? 'memory' : 'logic',
    renderer,
    subcategory,
    correct_answer: 1
  };
}

describe('task help', () => {
  it('provides a Level 1 hint and guided help for every current renderer', () => {
    const renderers = [
      'equation_with_dots',
      'missing_number_equation',
      'number_sequence',
      'number_comparison',
      'visual_sequence',
      'command_pattern',
      'command_grid_plan',
      'sudoku_grid',
      'color_grid_copy',
      'visual_search',
      'symbol_code',
      'binary_grid_copy',
      'image_memory',
      'location_memory_grid',
      'sequence_memory',
      'number_memory',
      'pair_memory'
    ];

    for (const renderer of renderers) {
      expect(taskLevelOneHint(task(renderer)).length).toBeGreaterThan(10);
      expect(taskGuidedHelp(task(renderer)).length).toBeGreaterThan(10);
    }
  });

  it('keeps memory hints hidden until answer phase', () => {
    const memoryTask = task('image_memory');

    expect(isMemoryRenderer(memoryTask.renderer)).toBe(true);
    expect(canShowMissionHint(memoryTask, 'memorize')).toBe(false);
    expect(canShowMissionHint(memoryTask, 'answer')).toBe(true);
  });

  it('allows hints immediately for non-memory renderers', () => {
    expect(canShowMissionHint(task('sudoku_grid'))).toBe(true);
  });

  it('uses subtraction-specific math guidance', () => {
    const subtraction = task('equation_with_dots', 'subtraction');

    expect(taskLevelOneHint(subtraction)).toContain('Skreśl');
    expect(taskGuidedHelp(subtraction)).toContain('odejmujesz');
  });
});
