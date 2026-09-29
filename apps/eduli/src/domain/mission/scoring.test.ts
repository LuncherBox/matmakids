import { describe, expect, it } from 'vitest';

import {
  initialMissionTaskState,
  registerFirstMissionError,
  scoreMissionSuccess,
  useMissionHint
} from './scoring';

describe('mission scoring', () => {
  it('awards 2:0 for first-try correct without hint', () => {
    const state = { ...initialMissionTaskState(), attempts: 1 };
    expect(scoreMissionSuccess(state)).toEqual({
      correctFirstTry: true,
      childPoints: 2,
      gobiPoints: 0
    });
  });

  it('awards 1 child point after the first mistake and 1 Gobi point', () => {
    const afterError = registerFirstMissionError({
      ...initialMissionTaskState(),
      attempts: 1
    });

    const result = scoreMissionSuccess({
      ...afterError,
      attempts: 2
    });

    expect(result).toEqual({
      correctFirstTry: false,
      childPoints: 1,
      gobiPoints: 1
    });
  });

  it('starter hint spends one potential child point without giving Gobi a point', () => {
    const hinted = useMissionHint(initialMissionTaskState(), 1);

    expect(
      scoreMissionSuccess({
        ...hinted,
        attempts: 1
      })
    ).toEqual({
      correctFirstTry: true,
      childPoints: 1,
      gobiPoints: 0
    });
  });

  it('advanced Gobi receives a point when a hint is used', () => {
    const hinted = useMissionHint(initialMissionTaskState(), 2);

    expect(
      scoreMissionSuccess({
        ...hinted,
        attempts: 1
      })
    ).toEqual({
      correctFirstTry: true,
      childPoints: 1,
      gobiPoints: 1
    });
  });

  it('does not add another Gobi point after repeated mistakes', () => {
    const first = registerFirstMissionError(initialMissionTaskState());
    const second = registerFirstMissionError(first);

    expect(second.gobiPoint).toBe(1);
  });
});
