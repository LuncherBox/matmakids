import 'expo-sqlite/localStorage/install';

import type { MissionTaskState } from '../domain/mission/scoring';

export type MissionSnapshot = {
  childId: string;
  sessionId: string;
  taskIds: string[];
  index: number;
  totals: {
    correctFirstTry: number;
    mistakes: number;
    childPoints: number;
    gobiPoints: number;
  };
  taskState: MissionTaskState;
};

const KEY = 'eduli_active_mission_v2';

export function saveMissionSnapshot(snapshot: MissionSnapshot) {
  localStorage.setItem(KEY, JSON.stringify(snapshot));
}

export function readMissionSnapshot(childId: string): MissionSnapshot | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as MissionSnapshot;
    if (parsed.childId !== childId) return null;

    return parsed;
  } catch {
    clearMissionSnapshot();
    return null;
  }
}

export function clearMissionSnapshot() {
  localStorage.removeItem(KEY);
}
