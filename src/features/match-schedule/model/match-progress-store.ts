import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MatchProgressState {
  matchId: string | null;
  matchNumber: number | null;
  teamAName: string | null;
  teamBName: string | null;
  scoreA: number;
  scoreB: number;
  status: 'pending' | 'in_progress' | 'finished';
  startTimestamp: number | null; // Unix timestamp when match started
  durationSeconds: number; // Total match duration in seconds
  pausedAt: number | null; // Unix timestamp when paused
  totalPausedTime: number; // Total paused time in seconds
}

interface MatchProgressStore extends MatchProgressState {
  startMatch: (
    matchId: string,
    matchNumber: number,
    teamAName: string,
    teamBName: string,
    durationMinutes: number
  ) => void;
  pauseMatch: () => void;
  resumeMatch: () => void;
  finishMatch: () => void;
  updateScore: (scoreA: number, scoreB: number) => void;
  resetMatch: () => void;
  getElapsedSeconds: () => number;
  getRemainingSeconds: () => number;
}

const initialState: MatchProgressState = {
  matchId: null,
  matchNumber: null,
  teamAName: null,
  teamBName: null,
  scoreA: 0,
  scoreB: 0,
  status: 'pending',
  startTimestamp: null,
  durationSeconds: 0,
  pausedAt: null,
  totalPausedTime: 0,
};

export const useMatchProgressStore = create<MatchProgressStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      startMatch: (matchId, matchNumber, teamAName, teamBName, durationMinutes) => {
        set({
          matchId,
          matchNumber,
          teamAName,
          teamBName,
          status: 'in_progress',
          startTimestamp: Date.now(),
          durationSeconds: durationMinutes * 60,
          pausedAt: null,
          totalPausedTime: 0,
        });
      },

      pauseMatch: () => {
        const state = get();
        if (state.status === 'in_progress' && !state.pausedAt) {
          set({ pausedAt: Date.now() });
        }
      },

      resumeMatch: () => {
        const state = get();
        if (state.pausedAt) {
          const pauseDuration = Date.now() - state.pausedAt;
          set({
            pausedAt: null,
            totalPausedTime: state.totalPausedTime + pauseDuration,
          });
        }
      },

      finishMatch: () => {
        set({ status: 'finished', pausedAt: null });
      },

      updateScore: (scoreA, scoreB) => {
        set({ scoreA, scoreB });
      },

      resetMatch: () => {
        set(initialState);
      },

      getElapsedSeconds: () => {
        const state = get();
        if (!state.startTimestamp || state.status === 'pending') return 0;

        const now = Date.now();
        const rawElapsed = now - state.startTimestamp;

        // Calculate paused time
        let pausedTime = state.totalPausedTime;
        if (state.pausedAt) {
          pausedTime += now - state.pausedAt;
        }

        const elapsedSeconds = Math.floor((rawElapsed - pausedTime) / 1000);
        return Math.max(0, elapsedSeconds);
      },

      getRemainingSeconds: () => {
        const state = get();
        const elapsed = get().getElapsedSeconds();
        const remaining = state.durationSeconds - elapsed;
        return Math.max(0, remaining);
      },
    }),
    {
      name: 'match-progress-storage',
    }
  )
);
