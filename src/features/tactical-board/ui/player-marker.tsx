'use client';

import { useRef, MouseEvent as ReactMouseEvent } from 'react';
import { MemberAvatar } from '@/entities/member/ui/member-avatar';
import type { Member } from '@/shared/types/member';
import type { PositionRole } from '@/shared/types/formation';

interface PlayerMarkerProps {
  id: string;
  member: Member | null;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  role: PositionRole;
  onPositionChange: (id: string, x: number, y: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onClick?: (e: React.MouseEvent) => void;
  isSelected?: boolean;
}

const ROLE_COLORS = {
  GK: 'bg-yellow-500',
  DF: 'bg-blue-500',
  MF: 'bg-green-500',
  FW: 'bg-red-500',
  SUB: 'bg-gray-400',
};

export function PlayerMarker({
  member,
  x,
  y,
  role,
  onClick,
  isSelected = false,
}: PlayerMarkerProps) {
  const markerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: ReactMouseEvent) => {
    // Prevent event bubbling
    e.stopPropagation();

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div
      ref={markerRef}
      className={`absolute cursor-pointer transition-all opacity-100 z-10 ${
        isSelected ? 'ring-4 ring-primary ring-offset-2 rounded-full' : ''
      }`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={handleClick}
    >
      <div className="relative">
        {/* Player avatar/marker */}
        {member ? (
          <div className="flex flex-col items-center gap-1">
            <div className="rounded-full border-2 border-white shadow-lg">
              <MemberAvatar
                src={member.profile_photo}
                alt={member.name}
                size="sm"
                bgColor={ROLE_COLORS[role]}
              />
            </div>
            <div className="bg-black/70 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
              {member.name}
            </div>
          </div>
        ) : (
          <div
            className={`w-10 h-10 rounded-full border-2 border-white shadow-lg ${ROLE_COLORS[role]} flex items-center justify-center`}
          >
            <span className="text-white text-xs font-bold">{role}</span>
          </div>
        )}
      </div>
    </div>
  );
}
