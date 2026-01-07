import type { PlayerPosition } from '@/shared/types/formation';

// Default formation presets for different player counts
export const DEFAULT_FORMATIONS: Record<number, Omit<PlayerPosition, 'id' | 'memberId'>[]> = {
  4: [
    { x: 50, y: 90, role: 'GK' },    // Goalkeeper
    { x: 25, y: 65, role: 'DF' },    // Left Defender
    { x: 75, y: 65, role: 'DF' },    // Right Defender
    { x: 50, y: 30, role: 'FW' },    // Striker
  ],
  5: [
    { x: 50, y: 90, role: 'GK' },    // Goalkeeper
    { x: 25, y: 65, role: 'DF' },    // Left Defender
    { x: 75, y: 65, role: 'DF' },    // Right Defender
    { x: 50, y: 45, role: 'MF' },    // Midfielder
    { x: 50, y: 25, role: 'FW' },    // Striker
  ],
  6: [
    { x: 50, y: 90, role: 'GK' },    // Goalkeeper
    { x: 25, y: 70, role: 'DF' },    // Left Defender
    { x: 50, y: 70, role: 'DF' },    // Center Defender
    { x: 75, y: 70, role: 'DF' },    // Right Defender
    { x: 50, y: 45, role: 'MF' },    // Midfielder
    { x: 50, y: 25, role: 'FW' },    // Striker
  ],
  7: [
    { x: 50, y: 90, role: 'GK' },    // Goalkeeper
    { x: 25, y: 70, role: 'DF' },    // Left Defender
    { x: 50, y: 70, role: 'DF' },    // Center Defender
    { x: 75, y: 70, role: 'DF' },    // Right Defender
    { x: 50, y: 45, role: 'MF' },    // Center Midfielder
    { x: 30, y: 25, role: 'FW' },    // Left Forward
    { x: 70, y: 25, role: 'FW' },    // Right Forward
  ],
  8: [
    { x: 50, y: 90, role: 'GK' },    // Goalkeeper
    { x: 25, y: 70, role: 'DF' },    // Left Defender
    { x: 50, y: 70, role: 'DF' },    // Center Defender
    { x: 75, y: 70, role: 'DF' },    // Right Defender
    { x: 35, y: 50, role: 'MF' },    // Left Midfielder
    { x: 65, y: 50, role: 'MF' },    // Right Midfielder
    { x: 30, y: 25, role: 'FW' },    // Left Forward
    { x: 70, y: 25, role: 'FW' },    // Right Forward
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

export const generateDefaultFormation = (
  teamMembers: { id: string }[],
  playerCount: number
): PlayerPosition[] => {
  const baseFormation = DEFAULT_FORMATIONS[playerCount] || DEFAULT_FORMATIONS[6];
  const positions: PlayerPosition[] = [];

  // Assign players to field positions
  baseFormation.forEach((pos, index) => {
    const member = teamMembers[index];
    positions.push({
      id: `pos-${index}`,
      memberId: member?.id || null,
      ...pos,
    });
  });

  // Add substitutes
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
