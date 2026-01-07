'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MemberAvatar } from '@/entities/member/ui/member-avatar';
import { GripVertical } from 'lucide-react';
import type { Member } from '@/shared/types/member';

interface DraggableMemberProps {
  member: Member;
  isDragging?: boolean;
}

export function DraggableMember({ member, isDragging = false }: DraggableMemberProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({
    id: member.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const totalStats = Object.values(member.stats).reduce((a, b) => a + b, 0);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-card border rounded-lg cursor-grab active:cursor-grabbing touch-none ${
        isDragging ? 'shadow-lg' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <MemberAvatar src={member.profile_photo} alt={member.name} size="sm" />
      <div className="flex-1">
        <p className="font-medium">{member.name}</p>
        <p className="text-xs text-muted-foreground">종합 {totalStats}</p>
      </div>
    </div>
  );
}
