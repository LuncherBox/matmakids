import { describe, expect, it } from 'vitest';

import { safeReturnPath } from './navigation';

describe('safeReturnPath', () => {
  it('keeps internal app paths', () => {
    expect(safeReturnPath('/children/abc/home')).toBe('/children/abc/home');
    expect(safeReturnPath('/demo')).toBe('/demo');
  });

  it('rejects external and protocol-relative targets', () => {
    expect(safeReturnPath('https://example.com')).toBe('/');
    expect(safeReturnPath('//example.com')).toBe('/');
    expect(safeReturnPath('javascript://alert(1)')).toBe('/');
  });

  it('uses the first query value and defaults to home', () => {
    expect(safeReturnPath(['/children/a', '/children/b'])).toBe('/children/a');
    expect(safeReturnPath(undefined)).toBe('/');
  });
});
