'use client';

import { useEffect, useRef } from 'react';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Users, UserMinus } from 'lucide-react';

type TeamName = 'A' | 'B' | 'C' | 'D';

interface MemberContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  availableTeams: TeamName[];
  onSelectTeam: (teamName: TeamName) => void;
  onSelectAvailable?: () => void;
  onClose: () => void;
  showAvailableOption?: boolean;
}

export function MemberContextMenu({
  isOpen,
  position,
  availableTeams,
  onSelectTeam,
  onSelectAvailable,
  onClose,
  showAvailableOption = false,
}: MemberContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ pointerEvents: 'none' }}
    >
      <Card
        ref={menuRef}
        className="absolute shadow-lg border-2 border-primary"
        style={{
          top: position.y,
          left: position.x,
          pointerEvents: 'auto',
        }}
      >
        <div className="p-2 space-y-1 min-w-[140px]">
          <div className="text-xs font-semibold text-muted-foreground px-2 py-1">
            {showAvailableOption ? '이동하기' : '팀 선택'}
          </div>
          {showAvailableOption && onSelectAvailable && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                onSelectAvailable();
                onClose();
              }}
            >
              <UserMinus className="mr-2 h-4 w-4" />
              대기 멤버로
            </Button>
          )}
          {availableTeams.map((teamName) => (
            <Button
              key={teamName}
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                onSelectTeam(teamName);
                onClose();
              }}
            >
              <Users className="mr-2 h-4 w-4" />
              Team {teamName}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
