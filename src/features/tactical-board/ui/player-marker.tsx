'use client';

import { useRef, useState, useEffect, useCallback, TouchEvent, MouseEvent } from 'react';
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
  onClick?: () => void;
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
  id,
  member,
  x,
  y,
  role,
  onPositionChange,
  containerRef,
  onClick,
  isSelected = false,
}: PlayerMarkerProps) {
  const markerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;

      setStartPos({ x: clientX, y: clientY });
      setIsDragging(true);
      const rect = containerRef.current.getBoundingClientRect();

      dragStartPos.current = {
        x: clientX,
        y: clientY,
        initialX: x,
        initialY: y,
      };
    },
    [x, y, containerRef]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = clientX - dragStartPos.current.x;
      const deltaY = clientY - dragStartPos.current.y;

      const deltaXPercent = (deltaX / rect.width) * 100;
      const deltaYPercent = (deltaY / rect.height) * 100;

      let newX = dragStartPos.current.initialX + deltaXPercent;
      let newY = dragStartPos.current.initialY + deltaYPercent;

      // Constrain to field bounds
      newX = Math.max(5, Math.min(95, newX));
      newY = Math.max(5, Math.min(95, newY));

      onPositionChange(id, newX, newY);
    },
    [isDragging, id, onPositionChange, containerRef]
  );

  const handleEnd = useCallback(
    (clientX?: number, clientY?: number) => {
      const wasDragging = isDragging;
      setIsDragging(false);

      // Check if it was a click (not a drag)
      if (onClick && startPos && clientX !== undefined && clientY !== undefined) {
        const distance = Math.sqrt(
          Math.pow(clientX - startPos.x, 2) + Math.pow(clientY - startPos.y, 2)
        );
        if (distance < 5) {
          onClick();
        }
      }

      setStartPos(null);
    },
    [isDragging, onClick, startPos]
  );

  // Mouse events
  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = useCallback(
    (e: globalThis.MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    },
    [handleMove]
  );

  const handleMouseUp = useCallback(
    (e: globalThis.MouseEvent) => {
      handleEnd(e.clientX, e.clientY);
    },
    [handleEnd]
  );

  // Touch events
  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = useCallback(
    (e: globalThis.TouchEvent) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    },
    [handleMove]
  );

  const handleTouchEnd = useCallback(
    (e: globalThis.TouchEvent) => {
      const touch = e.changedTouches[0];
      handleEnd(touch?.clientX, touch?.clientY);
    },
    [handleEnd]
  );

  // Add/remove global event listeners
  useEffect(() => {
    if (typeof window !== 'undefined' && isDragging) {
      const onMouseMove = (e: globalThis.MouseEvent) => handleMouseMove(e);
      const onMouseUp = (e: globalThis.MouseEvent) => handleMouseUp(e);
      const onTouchMove = (e: globalThis.TouchEvent) => handleTouchMove(e);
      const onTouchEnd = (e: globalThis.TouchEvent) => handleTouchEnd(e);

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);

      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div
      ref={markerRef}
      className={`absolute cursor-pointer transition-all ${
        isDragging ? 'opacity-80 z-50 cursor-grabbing' : 'opacity-100 z-10 cursor-grab'
      } ${isSelected ? 'ring-4 ring-primary ring-offset-2 rounded-full' : ''}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
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
