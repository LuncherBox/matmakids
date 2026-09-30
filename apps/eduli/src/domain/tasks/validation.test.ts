import { describe, expect, it } from 'vitest';

import {
  findVisualSearchMatches,
  isGridPatternCorrect,
  isOptionAnswerCorrect,
  isSudokuAnswerCorrect,
  isSymbolCodeCorrect,
  isVisualSearchSelectionCorrect
} from './validation';

describe('task renderer validation', () => {
  it('compares grid patterns position by position', () => {
    expect(
      isGridPatternCorrect(['y', 'w', 'b'], ['y', 'w', 'b'])
    ).toBe(true);
    expect(
      isGridPatternCorrect(['y', 'w', 'b'], ['y', 'b', 'w'])
    ).toBe(false);
    expect(
      isGridPatternCorrect(['y', 'w'], ['y', 'w', 'b'])
    ).toBe(false);
  });

  it('validates every sudoku blank against its expected value', () => {
    expect(isSudokuAnswerCorrect([2, 1], { 0: 2, 1: 1 })).toBe(true);
    expect(isSudokuAnswerCorrect([2, 1], { 0: 2, 1: 3 })).toBe(false);
    expect(isSudokuAnswerCorrect([2, 1], { 0: 2 })).toBe(false);
  });

  it('finds horizontal visual-search matches without wrapping rows', () => {
    const grid = [
      2, 6, 4,
      8, 2, 6,
      2, 6, 9
    ];

    expect(findVisualSearchMatches(grid, 3, 3, [2, 6])).toEqual([
      [0, 1],
      [4, 5],
      [6, 7]
    ]);
    expect(findVisualSearchMatches(grid, 3, 3, [6, 8])).toEqual([]);
  });

  it('accepts any valid visual-search occurrence and ignores tap order', () => {
    const matches = [
      [0, 1],
      [6, 7]
    ];

    expect(isVisualSearchSelectionCorrect([7, 6], matches)).toBe(true);
    expect(isVisualSearchSelectionCorrect([1, 6], matches)).toBe(false);
  });

  it('validates symbol codes case-insensitively', () => {
    expect(isSymbolCodeCorrect(['k', 'O', 't'], 'KOT')).toBe(true);
    expect(isSymbolCodeCorrect(['K', 'O', 'D'], 'KOT')).toBe(false);
  });

  it('normalizes scalar option answers through string comparison', () => {
    expect(isOptionAnswerCorrect(7, '7')).toBe(true);
    expect(isOptionAnswerCorrect('8', 7)).toBe(false);
    expect(isOptionAnswerCorrect(null, 7)).toBe(false);
  });
});
