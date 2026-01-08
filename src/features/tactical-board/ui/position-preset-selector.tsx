'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { getPositionPresets } from '@/features/tactical-board/model/position-presets';
import type { PositionRole } from '@/shared/types/formation';
import type { Member } from '@/shared/types/member';
import { X } from 'lucide-react';

interface PositionPresetSelectorProps {
  member: Member;
  role: PositionRole;
  currentX: number;
  currentY: number;
  onSelectPreset: (x: number, y: number) => void;
  onClose: () => void;
}

export function PositionPresetSelector({
  member,
  role,
  currentX,
  currentY,
  onSelectPreset,
  onClose,
}: PositionPresetSelectorProps) {
  const presets = getPositionPresets(role);

  if (presets.length === 0) {
    return null;
  }

  const roleNames: Record<PositionRole, string> = {
    GK: '골키퍼',
    DF: '수비수',
    MF: '미드필더',
    FW: '공격수',
    SUB: '후보',
  };

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            {member.name} - {roleNames[role]} 위치 선택
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant={
                Math.abs(preset.x - currentX) < 5 && Math.abs(preset.y - currentY) < 5
                  ? 'default'
                  : 'outline'
              }
              onClick={() => {
                onSelectPreset(preset.x, preset.y);
                onClose();
              }}
              className="h-auto py-3"
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
