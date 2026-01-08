import type { PlayerPosition, PositionRole } from '@/shared/types/formation';

// Position slot interface - fixed positions on the field
export interface PositionSlot {
  id: string;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  role: PositionRole;
  memberId: string | null; // null if slot is empty
}

// Position slots for different player counts - TOTAL 10 SLOTS (1 GK + 9 field positions)
// Players can be moved between these slots
export const POSITION_SLOTS_BY_COUNT: Record<number, Omit<PositionSlot, 'id' | 'memberId'>[]> = {
  4: [
    // 1 GK + 6 slots (total 7 for 4v4)
    { x: 50, y: 90, role: 'GK' },    // GK
    { x: 25, y: 70, role: 'DF' },    // DF1
    { x: 75, y: 70, role: 'DF' },    // DF2
    { x: 35, y: 50, role: 'MF' },    // MF1
    { x: 65, y: 50, role: 'MF' },    // MF2
    { x: 35, y: 25, role: 'FW' },    // FW1
    { x: 65, y: 25, role: 'FW' },    // FW2
  ],
  5: [
    // 1 GK + 8 slots (total 9 for 5v5)
    { x: 50, y: 90, role: 'GK' },    // GK
    { x: 25, y: 70, role: 'DF' },    // DF1
    { x: 50, y: 70, role: 'DF' },    // DF2
    { x: 75, y: 70, role: 'DF' },    // DF3
    { x: 35, y: 50, role: 'MF' },    // MF1
    { x: 65, y: 50, role: 'MF' },    // MF2
    { x: 35, y: 25, role: 'FW' },    // FW1
    { x: 65, y: 25, role: 'FW' },    // FW2
    { x: 50, y: 20, role: 'FW' },    // FW3
  ],
  6: [
    // 1 GK + 9 slots (total 10 for 6v6)
    { x: 50, y: 90, role: 'GK' },    // GK
    { x: 25, y: 70, role: 'DF' },    // DF1
    { x: 50, y: 70, role: 'DF' },    // DF2
    { x: 75, y: 70, role: 'DF' },    // DF3
    { x: 25, y: 50, role: 'MF' },    // MF1
    { x: 50, y: 50, role: 'MF' },    // MF2
    { x: 75, y: 50, role: 'MF' },    // MF3
    { x: 30, y: 25, role: 'FW' },    // FW1
    { x: 50, y: 25, role: 'FW' },    // FW2
    { x: 70, y: 25, role: 'FW' },    // FW3
  ],
  7: [
    // 1 GK + 11 slots (total 12 for 7v7)
    { x: 50, y: 90, role: 'GK' },    // GK
    { x: 20, y: 72, role: 'DF' },    // DF1
    { x: 40, y: 72, role: 'DF' },    // DF2
    { x: 60, y: 72, role: 'DF' },    // DF3
    { x: 80, y: 72, role: 'DF' },    // DF4
    { x: 25, y: 50, role: 'MF' },    // MF1
    { x: 50, y: 50, role: 'MF' },    // MF2
    { x: 75, y: 50, role: 'MF' },    // MF3
    { x: 25, y: 25, role: 'FW' },    // FW1
    { x: 50, y: 25, role: 'FW' },    // FW2
    { x: 75, y: 25, role: 'FW' },    // FW3
    { x: 50, y: 15, role: 'FW' },    // FW4
  ],
  8: [
    // 1 GK + 13 slots (total 14 for 8v8)
    { x: 50, y: 90, role: 'GK' },    // GK
    { x: 20, y: 72, role: 'DF' },    // DF1
    { x: 40, y: 72, role: 'DF' },    // DF2
    { x: 60, y: 72, role: 'DF' },    // DF3
    { x: 80, y: 72, role: 'DF' },    // DF4
    { x: 20, y: 50, role: 'MF' },    // MF1
    { x: 35, y: 50, role: 'MF' },    // MF2
    { x: 50, y: 50, role: 'MF' },    // MF3
    { x: 65, y: 50, role: 'MF' },    // MF4
    { x: 80, y: 50, role: 'MF' },    // MF5
    { x: 25, y: 25, role: 'FW' },    // FW1
    { x: 50, y: 25, role: 'FW' },    // FW2
    { x: 75, y: 25, role: 'FW' },    // FW3
    { x: 50, y: 15, role: 'FW' },    // FW4
  ],
};

// Substitute positions (bench area)
export const getSubstitutePositions = (count: number): Omit<PlayerPosition, 'id' | 'memberId'>[] => {
  const subs: Omit<PlayerPosition, 'id' | 'memberId'>[] = [];
  const startX = 10;
  const spacing = 15;

  for (let i = 0; i < count; i++) {
    subs.push({
      x: startX + (i * spacing),
      y: 5, // Top bench area
      role: 'SUB',
    });
  }

  return subs;
};

// Generate formation with position slots
// Only first `playerCount` members are assigned to field positions
// Remaining members become substitutes
export const generateDefaultFormation = (
  teamMembers: { id: string }[],
  playerCount: number
): PlayerPosition[] => {
  const positionSlots = POSITION_SLOTS_BY_COUNT[playerCount] || POSITION_SLOTS_BY_COUNT[6];
  const positions: PlayerPosition[] = [];

  // Create all position slots
  positionSlots.forEach((slot, index) => {
    // Only assign first `playerCount` members to slots (including GK)
    const member = index < playerCount ? teamMembers[index] : null;
    positions.push({
      id: `slot-${index}`,
      memberId: member?.id || null,
      x: slot.x,
      y: slot.y,
      role: slot.role,
    });
  });

  // Add substitutes from remaining members
  const remainingMembers = teamMembers.slice(playerCount);
  const subPositions = getSubstitutePositions(remainingMembers.length);

  subPositions.forEach((pos, index) => {
    const member = remainingMembers[index];
    positions.push({
      id: `sub-${index}`,
      memberId: member?.id || null,
      ...pos,
    });
  });

  return positions;
};
