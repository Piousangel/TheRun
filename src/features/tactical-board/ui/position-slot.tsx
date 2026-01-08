'use client';

import type { PositionRole } from '@/shared/types/formation';

interface PositionSlotProps {
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  role: PositionRole;
  isEmpty: boolean;
  onClick?: () => void;
}

const ROLE_COLORS = {
  GK: 'bg-yellow-500',
  DF: 'bg-blue-500',
  MF: 'bg-green-500',
  FW: 'bg-red-500',
  SUB: 'bg-gray-400',
};

const ROLE_BORDER_COLORS = {
  GK: 'border-yellow-500',
  DF: 'border-blue-500',
  MF: 'border-green-500',
  FW: 'border-red-500',
  SUB: 'border-gray-400',
};

export function PositionSlot({ x, y, role, isEmpty, onClick }: PositionSlotProps) {
  if (!isEmpty) return null; // Only render empty slots

  return (
    <div
      className="absolute z-0 cursor-pointer"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={onClick}
    >
      <div
        className={`w-12 h-12 rounded-full border-2 border-dashed ${ROLE_BORDER_COLORS[role]} opacity-40 hover:opacity-60 transition-opacity flex items-center justify-center bg-white/10`}
      >
        <span className="text-xs font-bold text-gray-500">{role}</span>
      </div>
    </div>
  );
}
