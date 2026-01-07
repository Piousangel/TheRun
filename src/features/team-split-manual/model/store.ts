import { create } from 'zustand';
import type { Member } from '@/shared/types/member';

type TeamName = 'A' | 'B' | 'C' | 'D';

interface TeamSplitState {
  teamCount: number;
  availableMembers: Member[];
  teams: Record<TeamName, Member[]>;
  setTeamCount: (count: number) => void;
  setAvailableMembers: (members: Member[]) => void;
  moveToTeam: (member: Member, teamName: TeamName) => void;
  moveToAvailable: (member: Member, fromTeam: TeamName) => void;
  reset: (allMembers: Member[]) => void;
}

export const useTeamSplitStore = create<TeamSplitState>((set) => ({
  teamCount: 2,
  availableMembers: [],
  teams: {
    A: [],
    B: [],
    C: [],
    D: [],
  },

  setTeamCount: (count) => set({ teamCount: count }),

  setAvailableMembers: (members) => set({ availableMembers: members }),

  moveToTeam: (member, teamName) => set((state) => ({
    availableMembers: state.availableMembers.filter((m) => m.id !== member.id),
    teams: {
      ...state.teams,
      [teamName]: [...state.teams[teamName], member],
    },
  })),

  moveToAvailable: (member, fromTeam) => set((state) => ({
    availableMembers: [...state.availableMembers, member],
    teams: {
      ...state.teams,
      [fromTeam]: state.teams[fromTeam].filter((m) => m.id !== member.id),
    },
  })),

  reset: (allMembers) => set({
    availableMembers: allMembers,
    teams: {
      A: [],
      B: [],
      C: [],
      D: [],
    },
  }),
}));
