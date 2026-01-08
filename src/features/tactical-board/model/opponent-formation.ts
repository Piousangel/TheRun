import type { PositionRole } from '@/shared/types/formation';

// Opponent positions (mirrored on the opposite side)
export interface OpponentPosition {
  x: number;
  y: number;
  role: PositionRole;
}

// Generate opponent positions based on player count (mirrored vertically)
export const generateOpponentFormation = (playerCount: number): OpponentPosition[] => {
  const formations: Record<number, OpponentPosition[]> = {
    4: [
      { x: 50, y: 10, role: 'GK' },    // Opponent Goalkeeper (top)
      { x: 25, y: 35, role: 'DF' },    // Left Defender
      { x: 75, y: 35, role: 'DF' },    // Right Defender
      { x: 50, y: 70, role: 'FW' },    // Striker
    ],
    5: [
      { x: 50, y: 10, role: 'GK' },
      { x: 25, y: 35, role: 'DF' },
      { x: 75, y: 35, role: 'DF' },
      { x: 50, y: 55, role: 'MF' },
      { x: 50, y: 75, role: 'FW' },
    ],
    6: [
      { x: 50, y: 10, role: 'GK' },
      { x: 25, y: 30, role: 'DF' },
      { x: 50, y: 30, role: 'DF' },
      { x: 75, y: 30, role: 'DF' },
      { x: 50, y: 55, role: 'MF' },
      { x: 50, y: 75, role: 'FW' },
    ],
    7: [
      { x: 50, y: 10, role: 'GK' },
      { x: 25, y: 30, role: 'DF' },
      { x: 50, y: 30, role: 'DF' },
      { x: 75, y: 30, role: 'DF' },
      { x: 50, y: 55, role: 'MF' },
      { x: 30, y: 75, role: 'FW' },
      { x: 70, y: 75, role: 'FW' },
    ],
    8: [
      { x: 50, y: 10, role: 'GK' },
      { x: 25, y: 30, role: 'DF' },
      { x: 50, y: 30, role: 'DF' },
      { x: 75, y: 30, role: 'DF' },
      { x: 35, y: 50, role: 'MF' },
      { x: 65, y: 50, role: 'MF' },
      { x: 30, y: 75, role: 'FW' },
      { x: 70, y: 75, role: 'FW' },
    ],
  };

  return formations[playerCount] || formations[6];
};
