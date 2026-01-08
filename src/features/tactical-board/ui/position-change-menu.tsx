'use client';

import { useEffect, useRef } from 'react';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import type { PositionRole } from '@/shared/types/formation';

interface PositionChangeMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  currentRole: PositionRole;
  onSelectRole: (role: PositionRole) => void;
  onClose: () => void;
}

const ROLE_LABELS: Record<PositionRole, string> = {
  GK: '골키퍼 (GK)',
  DF: '수비수 (DF)',
  MF: '미드필더 (MF)',
  FW: '공격수 (FW)',
  SUB: '후보',
};

const ROLE_COLORS: Record<PositionRole, string> = {
  GK: 'bg-yellow-500',
  DF: 'bg-blue-500',
  MF: 'bg-green-500',
  FW: 'bg-red-500',
  SUB: 'bg-gray-400',
};

export function PositionChangeMenu({
  isOpen,
  position,
  currentRole,
  onSelectRole,
  onClose,
}: PositionChangeMenuProps) {
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

  const roles: PositionRole[] = ['GK', 'DF', 'MF', 'FW'];

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
        <div className="p-2 space-y-1 min-w-[160px]">
          <div className="text-xs font-semibold text-muted-foreground px-2 py-1">
            포지션 변경
          </div>
          {roles.map((role) => (
            <Button
              key={role}
              variant={role === currentRole ? 'default' : 'ghost'}
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                onSelectRole(role);
                onClose();
              }}
            >
              <div className={`w-4 h-4 rounded-full ${ROLE_COLORS[role]} mr-2`} />
              {ROLE_LABELS[role]}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
