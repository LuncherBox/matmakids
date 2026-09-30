export type MemoryPhase = 'memorize' | 'answer';

export type MemoryResumeState = {
  phase: MemoryPhase;
  hideAt: number;
  delayMs: number;
};

export function resolveMemoryResumeState(input: {
  storedPhase?: MemoryPhase;
  storedHideAt?: number;
  displaySeconds: number;
  now: number;
}): MemoryResumeState {
  const validStoredHideAt =
    typeof input.storedHideAt === 'number' &&
    Number.isFinite(input.storedHideAt);

  const hideAt = validStoredHideAt
    ? input.storedHideAt!
    : input.now + Math.max(0, input.displaySeconds) * 1000;

  if (input.storedPhase === 'answer' || hideAt <= input.now) {
    return {
      phase: 'answer',
      hideAt,
      delayMs: 0
    };
  }

  return {
    phase: 'memorize',
    hideAt,
    delayMs: Math.max(0, hideAt - input.now)
  };
}
