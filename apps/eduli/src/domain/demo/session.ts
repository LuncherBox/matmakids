import type { Task } from '../../types/tasks';
import { shuffled } from '../tasks/bank';

export type DemoMix = {
  math: number;
  logic: number;
  coding: number;
};

export const DEFAULT_DEMO_MIX: DemoMix = {
  math: 4,
  logic: 4,
  coding: 2
};

export function buildBalancedDemoTasks(
  tasks: Task[],
  mix: DemoMix = DEFAULT_DEMO_MIX
) {
  const selected: Task[] = [];

  (Object.keys(mix) as Array<keyof DemoMix>).forEach((category) => {
    const pool = tasks.filter((task) => task.category === category);
    selected.push(...shuffled(pool).slice(0, mix[category]));
  });

  return shuffled(selected);
}
