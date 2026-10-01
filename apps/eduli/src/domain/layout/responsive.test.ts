import { describe, expect, it } from 'vitest';

import {
  isCompactPhone,
  responsiveHeadingSize,
  screenHorizontalPadding
} from './responsive';

describe('responsive screen helpers', () => {
  it('treats 320-360px phones as compact', () => {
    expect(isCompactPhone(320)).toBe(true);
    expect(isCompactPhone(360)).toBe(true);
    expect(isCompactPhone(361)).toBe(false);
  });

  it('reduces horizontal padding on compact phones', () => {
    expect(screenHorizontalPadding(320)).toBe(16);
    expect(screenHorizontalPadding(390)).toBe(24);
  });

  it('selects a smaller heading size only on compact phones', () => {
    expect(responsiveHeadingSize(320, 42, 34)).toBe(34);
    expect(responsiveHeadingSize(430, 42, 34)).toBe(42);
  });
});
