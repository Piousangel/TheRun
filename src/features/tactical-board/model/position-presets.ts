import type { PositionRole } from '@/shared/types/formation';

export interface PositionPreset {
  label: string;
  x: number;
  y: number;
}

// Position presets for each role
export const POSITION_PRESETS: Record<PositionRole, PositionPreset[]> = {
  GK: [
    { label: '왼쪽', x: 35, y: 90 },
    { label: '중앙', x: 50, y: 90 },
    { label: '오른쪽', x: 65, y: 90 },
  ],
  DF: [
    { label: '왼쪽', x: 25, y: 70 },
    { label: '중앙', x: 50, y: 70 },
    { label: '오른쪽', x: 75, y: 70 },
  ],
  MF: [
    { label: '왼쪽', x: 30, y: 50 },
    { label: '중앙 왼쪽', x: 40, y: 50 },
    { label: '중앙', x: 50, y: 50 },
    { label: '중앙 오른쪽', x: 60, y: 50 },
    { label: '오른쪽', x: 70, y: 50 },
  ],
  FW: [
    { label: '왼쪽', x: 30, y: 25 },
    { label: '중앙 왼쪽', x: 40, y: 25 },
    { label: '중앙', x: 50, y: 25 },
    { label: '중앙 오른쪽', x: 60, y: 25 },
    { label: '오른쪽', x: 70, y: 25 },
  ],
  SUB: [],
};

export const getPositionPresets = (role: PositionRole): PositionPreset[] => {
  return POSITION_PRESETS[role] || [];
};
