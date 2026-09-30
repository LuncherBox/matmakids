import { describe, expect, it } from 'vitest';

import { resolveMemoryResumeState } from './memory';

describe('resolveMemoryResumeState', () => {
  it('creates a fresh memorize deadline', () => {
    expect(
      resolveMemoryResumeState({
        displaySeconds: 3,
        now: 1_000
      })
    ).toEqual({
      phase: 'memorize',
      hideAt: 4_000,
      delayMs: 3_000
    });
  });

  it('preserves only the remaining memorize time after resume', () => {
    expect(
      resolveMemoryResumeState({
        storedPhase: 'memorize',
        storedHideAt: 4_000,
        displaySeconds: 3,
        now: 2_500
      })
    ).toEqual({
      phase: 'memorize',
      hideAt: 4_000,
      delayMs: 1_500
    });
  });

  it('goes directly to answer when the stored deadline has passed', () => {
    expect(
      resolveMemoryResumeState({
        storedPhase: 'memorize',
        storedHideAt: 4_000,
        displaySeconds: 3,
        now: 4_500
      })
    ).toEqual({
      phase: 'answer',
      hideAt: 4_000,
      delayMs: 0
    });
  });

  it('keeps answer phase after resume', () => {
    expect(
      resolveMemoryResumeState({
        storedPhase: 'answer',
        storedHideAt: 4_000,
        displaySeconds: 3,
        now: 2_000
      })
    ).toEqual({
      phase: 'answer',
      hideAt: 4_000,
      delayMs: 0
    });
  });
});
