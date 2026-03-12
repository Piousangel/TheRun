"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/drawer";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { MemberAvatar } from "@/entities/member/ui/member-avatar";
import type { Member } from "@/shared/types/member";

interface SaveRecordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  teamMembers: Member[];
  currentMinute: number;
  onSave: (goalkeeperIds: string[]) => void;
}

export function SaveRecordDialog({
  isOpen,
  onClose,
  teamName,
  teamMembers,
  currentMinute,
  onSave,
}: SaveRecordDialogProps) {
  const [selectedGoalkeepers, setSelectedGoalkeepers] = useState<string[]>([]);

  const handleToggleGoalkeeper = (memberId: string) => {
    setSelectedGoalkeepers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  };

  const handleSave = () => {
    if (selectedGoalkeepers.length === 0) return;

    onSave(selectedGoalkeepers);

    // Reset form
    setSelectedGoalkeepers([]);
    onClose();
  };

  const handleCancel = () => {
    setSelectedGoalkeepers([]);
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>🧤 선방 기록 - {teamName}</DrawerTitle>
          <DrawerDescription>
            선방을 기록한 골키퍼를 선택하세요 ({currentMinute}분)
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-2">
          <Label>골키퍼 선택 (다중 선택 가능)</Label>
          <div className="grid grid-cols-1 gap-2">
            {teamMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => handleToggleGoalkeeper(member.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  selectedGoalkeepers.includes(member.id)
                    ? "border-primary bg-primary/10"
                    : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <MemberAvatar
                  src={member.profile_photo}
                  alt={member.name}
                  size="sm"
                />
                <span className="font-medium">{member.name}</span>
                {selectedGoalkeepers.includes(member.id) && (
                  <span className="ml-auto text-primary font-bold">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <DrawerFooter className="sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={handleCancel}>
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={selectedGoalkeepers.length === 0}
          >
            저장 (+{selectedGoalkeepers.length})
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
