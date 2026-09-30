export function isOptionAnswerCorrect(
  selected: string | number | null,
  correctAnswer: string | number
) {
  return selected != null && String(selected) === String(correctAnswer);
}

export function isGridPatternCorrect(
  expected: Array<string | number>,
  actual: Array<string | number>
) {
  return (
    expected.length === actual.length &&
    expected.every(
      (value, index) => String(actual[index]) === String(value)
    )
  );
}

export function isSudokuAnswerCorrect(
  correct: Array<string | number>,
  values: Record<number, number>
) {
  return (
    correct.length > 0 &&
    correct.every(
      (value, index) => values[index] === Number(value)
    )
  );
}

export function findVisualSearchMatches(
  grid: Array<string | number>,
  rows: number,
  columns: number,
  target: Array<string | number>
) {
  const matches: number[][] = [];

  if (
    !target.length ||
    rows <= 0 ||
    columns <= 0 ||
    grid.length < rows * columns ||
    target.length > columns
  ) {
    return matches;
  }

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col <= columns - target.length; col += 1) {
      const indexes = target.map(
        (_, offset) => row * columns + col + offset
      );

      const isMatch = indexes.every(
        (index, offset) =>
          String(grid[index]) === String(target[offset])
      );

      if (isMatch) matches.push(indexes);
    }
  }

  return matches;
}

export function isVisualSearchSelectionCorrect(
  selectedCells: number[],
  validMatches: number[][]
) {
  const actual = [...selectedCells].sort((a, b) => a - b);

  return validMatches.some((match) => {
    const expected = [...match].sort((a, b) => a - b);

    return (
      actual.length === expected.length &&
      actual.every((value, index) => value === expected[index])
    );
  });
}

export function isSymbolCodeCorrect(
  letters: string[],
  correctAnswer: string | number
) {
  return (
    letters.length > 0 &&
    letters.join('').toUpperCase() ===
      String(correctAnswer).toUpperCase()
  );
}
