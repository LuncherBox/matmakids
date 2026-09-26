import type { Task } from '../../types/tasks';

const COMMAND_LABELS: Record<string, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→'
};

export function taskQuestion(task: Task) {
  const content = task.content ?? {};

  switch (task.renderer) {
    case 'equation_with_dots':
    case 'missing_number_equation':
      return `${content.expression ?? ''} = ?`.replace(' = ? = ?', ' = ?');

    case 'number_sequence':
      return (content.items ?? [])
        .map((item: unknown) => (item == null ? '?' : String(item)))
        .join('   ');

    case 'number_comparison':
      return `Która liczba jest większa: ${content.left} czy ${content.right}?`;

    case 'visual_sequence':
      return (content.items ?? [])
        .map((item: unknown) => (item == null ? '?' : String(item)))
        .join('   ');

    case 'command_pattern':
      return (content.commands ?? [])
        .map((item: string | null) => (item == null ? '?' : COMMAND_LABELS[item] ?? item))
        .join('   ');

    case 'command_grid_plan':
      return 'Która droga prowadzi do celu?';

    default:
      return task.prompt || task.name || 'Wybierz poprawną odpowiedź.';
  }
}

export function taskInstruction(task: Task) {
  switch (task.renderer) {
    case 'equation_with_dots':
      return 'Policz i wybierz wynik.';
    case 'missing_number_equation':
      return 'Znajdź brakującą liczbę.';
    case 'number_sequence':
    case 'visual_sequence':
    case 'command_pattern':
      return 'Co powinno być dalej?';
    case 'number_comparison':
      return 'Wybierz większą liczbę.';
    case 'command_grid_plan':
      return 'Wybierz poprawną trasę.';
    default:
      return task.prompt || 'Wybierz odpowiedź.';
  }
}

export function displayOption(option: string | number) {
  if (typeof option === 'string' && COMMAND_LABELS[option]) {
    return COMMAND_LABELS[option];
  }

  return String(option);
}
