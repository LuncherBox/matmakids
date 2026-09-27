import type { MissionTaskState } from './scoring';

const STORAGE_KEY = 'eduli_active_mission_v2';

export type MissionTotalsSnapshot = {
  correctFirstTry: number;
  mistakes: number;
  childPoints: number;
  gobiPoints: number;
};

export type MissionSnapshot = {
  childId: string;
  sessionId: string;
  taskIds: string[];
  index: number;
  totals: MissionTotalsSnapshot;
  taskState: MissionTaskState;
  visualHelpVisible: boolean;
};

export function saveMissionSnapshot(snapshot: MissionSnapshot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.error('Could not save active mission snapshot.', error);
  }
}

export function readMissionSnapshot(childId: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const snapshot = JSON.parse(raw) as MissionSnapshot;
    if (snapshot.childId !== childId) return null;

    return snapshot;
  } catch (error) {
    console.error('Could not read active mission snapshot.', error);
    clearMissionSnapshot();
    return null;
  }
}

export function clearMissionSnapshot() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Could not clear active mission snapshot.', error);
  }
}
