import { describe, expect, it } from 'vitest';

import { fitGridCellSize, taskContentWidth } from './layout';

describe('task responsive layout', () => {
  it('fits task content inside a 320px phone viewport', () => {
    const width = taskContentWidth(320);

    expect(width).toBe(228);
    expect(fitGridCellSize(4, width, 62)).toBe(57);
    expect(fitGridCellSize(5, width, 52)).toBe(45);
  });

  it('keeps preferred cell sizes when there is enough room', () => {
    const width = taskContentWidth(430);

    expect(fitGridCellSize(4, width, 62)).toBe(62);
    expect(fitGridCellSize(5, width, 52)).toBe(52);
  });

  it('caps desktop task content instead of stretching grids', () => {
    expect(taskContentWidth(1200)).toBe(320);
  });
});
