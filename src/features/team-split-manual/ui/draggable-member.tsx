'use client';

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MemberAvatar } from '@/entities/member/ui/member-avatar';
import { Badge } from '@/shared/ui/badge';
import { GripVertical } from 'lucide-react';
import type { Member } from '@/shared/types/member';

interface DraggableMemberProps {
  member: Member;
  isDragging?: boolean;
  voteStatus?: 'attending' | 'absent' | 'no-response';
  onLongPress?: (e: React.MouseEvent | React.TouchEvent) => void;
}

export function DraggableMember({
  member,
  isDragging = false,
  voteStatus,
  onLongPress
}: DraggableMemberProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({
    id: member.id,
  });

  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef({ x: 0, y: 0 });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const totalStats = Object.values(member.stats).reduce((a, b) => a + b, 0);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onLongPress) {
      onLongPress(e);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };

    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true);
      if (onLongPress) {
        onLongPress(e);
      }
    }, 500); // 500ms for long press
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

    // Cancel long press if finger moves too much
    if (deltaX > 10 || deltaY > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      setIsLongPressing(false);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsLongPressing(false);
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const getVoteStatusBadge = () => {
    if (!voteStatus || voteStatus === 'no-response') return null;

    return (
      <Badge
        variant={voteStatus === 'attending' ? 'default' : 'destructive'}
        className="text-xs"
      >
        {voteStatus === 'attending' ? '참석' : '불참'}
      </Badge>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-card border rounded-lg cursor-grab active:cursor-grabbing touch-none ${
        isDragging ? 'shadow-lg' : ''
      } ${isLongPressing ? 'ring-2 ring-primary' : ''}`}
      {...attributes}
      {...listeners}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <MemberAvatar src={member.profile_photo} alt={member.name} size="sm" />
      <div className="flex-1">
        <p className="font-medium">{member.name}</p>
        <p className="text-xs text-muted-foreground">종합 {totalStats}</p>
      </div>
      {getVoteStatusBadge()}
    </div>
  );
}
