'use client';

import type { PositionRole } from '@/shared/types/formation';

interface OpponentMarkerProps {
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  role: PositionRole;
}

const ROLE_COLORS = {
  GK: 'bg-gray-500',
  DF: 'bg-gray-500',
  MF: 'bg-gray-500',
  FW: 'bg-gray-500',
  SUB: 'bg-gray-400',
};

export function OpponentMarker({ x, y, role }: OpponentMarkerProps) {
  return (
    <div
      className="absolute opacity-40 pointer-events-none z-0"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className={`w-10 h-10 rounded-full border-2 border-dashed border-gray-400 ${ROLE_COLORS[role]} flex items-center justify-center`}
      >
        <span className="text-white text-xs font-bold">{role}</span>
      </div>
    </div>
  );
}
