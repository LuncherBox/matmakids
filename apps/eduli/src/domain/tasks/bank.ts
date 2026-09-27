import tasksJson from '../../../assets/tasks.json';
import type { Task } from '../../types/tasks';

export const taskBank = tasksJson as Task[];

export function taskMechanicId(task: Task) {
  return `${task.category}:${task.subcategory || task.renderer || 'unknown'}`;
}

export function activeTasks() {
  return taskBank.filter(
    (task) => task.status === 'published' && task.active !== false
  );
}

export function tasksForCategory(category: string) {
  return activeTasks().filter((task) => task.category === category);
}

export function tasksForMechanic(mechanicId: string) {
  return activeTasks().filter((task) => taskMechanicId(task) === mechanicId);
}

export function shuffled<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export function tasksByIds(ids: string[]) {
  const byId = new Map(taskBank.map((task) => [task.id, task]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as Task[];
}
