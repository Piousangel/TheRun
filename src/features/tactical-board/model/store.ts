import { create } from 'zustand';
import type { PlayerPosition } from '@/shared/types/formation';

interface TacticalBoardState {
  positions: PlayerPosition[];
  selectedPlayerId: string | null;
  playerCount: number;
  setPositions: (positions: PlayerPosition[]) => void;
  updatePosition: (id: string, x: number, y: number) => void;
  setSelectedPlayer: (id: string | null) => void;
  swapPlayers: (id1: string, id2: string) => void;
  setPlayerCount: (count: number) => void;
  reset: () => void;
}

export const useTacticalBoardStore = create<TacticalBoardState>((set) => ({
  positions: [],
  selectedPlayerId: null,
  playerCount: 6,

  setPositions: (positions) => set({ positions }),

  updatePosition: (id, x, y) => set((state) => ({
    positions: state.positions.map((pos) =>
      pos.id === id ? { ...pos, x, y } : pos
    ),
  })),

  setSelectedPlayer: (id) => set({ selectedPlayerId: id }),

  swapPlayers: (id1, id2) => set((state) => {
    const pos1 = state.positions.find((p) => p.id === id1);
    const pos2 = state.positions.find((p) => p.id === id2);

    if (!pos1 || !pos2) return state;

    return {
      positions: state.positions.map((pos) => {
        if (pos.id === id1) {
          return { ...pos, memberId: pos2.memberId };
        }
        if (pos.id === id2) {
          return { ...pos, memberId: pos1.memberId };
        }
        return pos;
      }),
    };
  }),

  setPlayerCount: (count) => set({ playerCount: count }),

  reset: () => set({ positions: [], selectedPlayerId: null, playerCount: 6 }),
}));
