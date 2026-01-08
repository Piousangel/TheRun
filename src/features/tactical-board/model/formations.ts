import type { PlayerPosition, PositionRole } from '@/shared/types/formation';

// Position slot interface - fixed positions on the field
export interface PositionSlot {
  id: string;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  role: PositionRole;
  memberId: string | null; // null if slot is empty
}

// Fixed 10 position slots - always the same regardless of player count
// 1 GK + 3 DF + 3 MF + 3 FW = 10 total slots
export const FIXED_POSITION_SLOTS: Omit<PositionSlot, 'id' | 'memberId'>[] = [
  // GK
  { x: 50, y: 90, role: 'GK' },

  // Defenders (3 slots: Left, Center, Right)
  { x: 25, y: 70, role: 'DF' },  // Left DF
  { x: 50, y: 70, role: 'DF' },  // Center DF
  { x: 75, y: 70, role: 'DF' },  // Right DF

  // Midfielders (3 slots: Left, Center, Right)
  { x: 25, y: 50, role: 'MF' },  // Left MF
  { x: 50, y: 50, role: 'MF' },  // Center MF
  { x: 75, y: 50, role: 'MF' },  // Right MF

  // Forwards (3 slots: Left, Center, Right)
  { x: 25, y: 25, role: 'FW' },  // Left FW
  { x: 50, y: 25, role: 'FW' },  // Center FW
  { x: 75, y: 25, role: 'FW' },  // Right FW
];

// Legacy - for backward compatibility
export const POSITION_SLOTS_BY_COUNT: Record<number, Omit<PositionSlot, 'id' | 'memberId'>[]> = {
  4: FIXED_POSITION_SLOTS,
  5: FIXED_POSITION_SLOTS,
  6: FIXED_POSITION_SLOTS,
  7: FIXED_POSITION_SLOTS,
  8: FIXED_POSITION_SLOTS,
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

// Generate formation with fixed 10 position slots
// Only first `playerCount` members are assigned to field positions
// Remaining members become substitutes
export const generateDefaultFormation = (
  teamMembers: { id: string }[],
  playerCount: number
): PlayerPosition[] => {
  const positions: PlayerPosition[] = [];

  // Create all 10 fixed position slots
  FIXED_POSITION_SLOTS.forEach((slot, index) => {
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
