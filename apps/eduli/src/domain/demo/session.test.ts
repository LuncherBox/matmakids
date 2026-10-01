import { describe, expect, it } from 'vitest';

import type { Task } from '../../types/tasks';
import { buildBalancedDemoTasks } from './session';

function makeTask(id: string, category: Task['category']): Task {
  return {
    id,
    category,
    renderer: 'number_sequence',
    correct_answer: 1
  };
}

describe('balanced public demo', () => {
  it('builds the intended 4/4/2 category mix', () => {
    const tasks = [
      ...Array.from({ length: 6 }, (_, index) => makeTask(`m${index}`, 'math')),
      ...Array.from({ length: 6 }, (_, index) => makeTask(`l${index}`, 'logic')),
      ...Array.from({ length: 4 }, (_, index) => makeTask(`c${index}`, 'coding')),
      ...Array.from({ length: 4 }, (_, index) => makeTask(`p${index}`, 'memory'))
    ];

    const selected = buildBalancedDemoTasks(tasks);

    expect(selected).toHaveLength(10);
    expect(selected.filter((item) => item.category === 'math')).toHaveLength(4);
    expect(selected.filter((item) => item.category === 'logic')).toHaveLength(4);
    expect(selected.filter((item) => item.category === 'coding')).toHaveLength(2);
    expect(selected.some((item) => item.category === 'memory')).toBe(false);
  });

  it('does not duplicate tasks when each category has enough candidates', () => {
    const tasks = [
      ...Array.from({ length: 4 }, (_, index) => makeTask(`m${index}`, 'math')),
      ...Array.from({ length: 4 }, (_, index) => makeTask(`l${index}`, 'logic')),
      ...Array.from({ length: 2 }, (_, index) => makeTask(`c${index}`, 'coding'))
    ];

    const selected = buildBalancedDemoTasks(tasks);

    expect(new Set(selected.map((item) => item.id)).size).toBe(10);
  });
});
