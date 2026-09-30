import type { Task } from '../../types/tasks';

const MEMORY_RENDERERS = new Set([
  'image_memory',
  'location_memory_grid',
  'sequence_memory',
  'number_memory',
  'pair_memory'
]);

export function isMemoryRenderer(renderer: string) {
  return MEMORY_RENDERERS.has(renderer);
}

export function canShowMissionHint(
  task: Task,
  memoryPhase?: 'memorize' | 'answer'
) {
  if (!isMemoryRenderer(task.renderer)) return true;
  return memoryPhase === 'answer';
}

export function taskLevelOneHint(task: Task) {
  switch (task.renderer) {
    case 'equation_with_dots':
      return task.subcategory === 'subtraction'
        ? 'Skreśl odejmowane kropki i policz te, które zostały.'
        : 'Policz pierwszą grupę kropek, potem dołóż drugą.';

    case 'missing_number_equation':
      return 'Spójrz na wynik i pomyśl, jakiej liczby brakuje.';

    case 'number_sequence':
      return 'Sprawdź, jak zmieniają się kolejne liczby.';

    case 'number_comparison':
      return 'Porównaj obie liczby. Większa leży dalej podczas liczenia.';

    case 'visual_sequence':
      return 'Poszukaj fragmentu, który się powtarza.';

    case 'command_pattern':
      return 'Sprawdź, jaki układ strzałek się powtarza.';

    case 'command_grid_plan':
      return 'Zacznij w zaznaczonym polu i wykonuj ruchy po kolei.';

    case 'sudoku_grid':
      return 'W każdym wierszu i kolumnie każda liczba może wystąpić tylko raz.';

    case 'color_grid_copy':
      return 'Porównuj oba wzory pole po polu, zaczynając od lewego górnego rogu.';

    case 'visual_search':
      return 'Najpierw znajdź pierwszy element wzoru, potem sprawdź jego sąsiada.';

    case 'symbol_code':
      return 'Czytaj kod znak po znaku i za każdym razem sprawdzaj legendę.';

    case 'binary_grid_copy':
      return 'Porównuj kratki po kolei. Zwróć uwagę, które pola są wypełnione.';

    case 'image_memory':
      return 'Przypomnij sobie zestaw obrazków i wybierz ten, który do niego nie pasuje.';

    case 'location_memory_grid':
      return 'Przypomnij sobie położenie obrazka względem rogów i środka planszy.';

    case 'sequence_memory':
    case 'number_memory':
      return 'Odtwórz w myślach zapamiętaną kolejność od początku.';

    case 'pair_memory':
      return 'Przypomnij sobie pary po kolei i znajdź tę z pytania.';

    default:
      return 'Spójrz jeszcze raz na zadanie i wykonaj je krok po kroku.';
  }
}

export function taskGuidedHelp(task: Task) {
  switch (task.renderer) {
    case 'equation_with_dots':
      return task.subcategory === 'subtraction'
        ? 'Dotknij dokładnie tyle kropek, ile odejmujesz. Potem policz nieprzekreślone.'
        : 'Policz wszystkie kropki z obu grup razem.';

    case 'missing_number_equation':
      return 'Zacznij od znanej liczby i licz dalej aż dojdziesz do wyniku. Ile kroków zrobiłeś?';

    case 'number_sequence':
      return 'Porównaj dwie sąsiednie liczby i znajdź zmianę. Zastosuj tę samą zmianę przy pustym miejscu.';

    case 'number_comparison':
      return 'Jeśli trudno porównać liczby od razu, policz do każdej z nich. Ta osiągnięta później jest większa.';

    case 'visual_sequence':
      return 'Podziel ciąg na małe powtarzające się fragmenty. Sprawdź, czego brakuje w ostatnim fragmencie.';

    case 'command_pattern':
      return 'Podziel strzałki na powtarzające się grupy. Ostatnia grupa powinna wyglądać tak samo jak wcześniejsze.';

    case 'command_grid_plan':
      return 'Sprawdź każdą odpowiedź osobno. Przesuwaj się od startu krok po kroku i zobacz, która kończy się na celu.';

    case 'sudoku_grid':
      return 'Wybierz jedno puste pole. Sprawdź liczby już obecne w jego wierszu i kolumnie. Wpisz liczbę, której tam brakuje.';

    case 'color_grid_copy':
      return 'Zacznij od pierwszej kratki i porównuj kolejne pola w tej samej kolejności. Popraw tylko te, które różnią się od wzoru.';

    case 'visual_search':
      return 'Nie szukaj całego wzoru naraz. Znajdź pierwszy element, a potem sprawdź sąsiednie pole w tym samym kierunku.';

    case 'symbol_code':
      return 'Weź pierwszy symbol kodu, znajdź go w legendzie i wpisz jego literę. Potem zrób to samo z kolejnymi.';

    case 'binary_grid_copy':
      return 'Przejdź po planszy rząd po rzędzie. Dla każdej kratki sprawdź osobno, czy we wzorze jest pusta czy wypełniona.';

    case 'image_memory':
      return 'Przypomnij sobie każdy pokazany obrazek po kolei. Porównaj tę listę z odpowiedziami i znajdź nowy element.';

    case 'location_memory_grid':
      return 'Wyobraź sobie planszę tak, jak wyglądała przed chwilą. Najpierw ustal rząd, potem kolumnę zapamiętanego obrazka.';

    case 'sequence_memory':
    case 'number_memory':
      return 'Odtwórz zapamiętany ciąg od pierwszego elementu. Zatrzymaj się na pozycji, o którą pyta zadanie.';

    case 'pair_memory':
      return 'Najpierw przypomnij sobie element z pytania. Potem odtwórz, z czym był połączony podczas zapamiętywania.';

    default:
      return 'Spróbuj jeszcze raz wolniej. Podziel zadanie na mniejsze kroki i sprawdzaj je po kolei.';
  }
}
