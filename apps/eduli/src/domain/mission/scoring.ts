export type MissionTaskState = {
  attempts: number;
  hadError: boolean;
  usedHint: boolean;
  usedGuidedHelp: boolean;
  gobiPoint: number;
};

export function initialMissionTaskState(): MissionTaskState {
  return {
    attempts: 0,
    hadError: false,
    usedHint: false,
    usedGuidedHelp: false,
    gobiPoint: 0
  };
}

export function scoreMissionSuccess(state: MissionTaskState) {
  const correctFirstTry = !state.hadError && state.attempts === 1;
  const childPoints = state.usedHint || state.hadError ? 1 : 2;

  return {
    correctFirstTry,
    childPoints,
    gobiPoints: state.gobiPoint
  };
}

export function registerFirstMissionError(state: MissionTaskState) {
  if (state.hadError) return state;

  return {
    ...state,
    hadError: true,
    gobiPoint: state.usedHint ? state.gobiPoint : 1
  };
}

export function useMissionHint(state: MissionTaskState, gobiLevel: number) {
  if (state.usedHint) return state;

  return {
    ...state,
    usedHint: true,
    gobiPoint: gobiLevel >= 2 ? 1 : state.gobiPoint
  };
}
