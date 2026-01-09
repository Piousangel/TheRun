"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Label } from "@/shared/ui/label";
import { MemberAvatar } from "@/entities/member/ui/member-avatar";
import { ArrowLeftRight } from "lucide-react";
import type { Member } from "@/shared/types/member";
import type { SubstitutionRecord } from "@/shared/types/match";

interface SubstitutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  teamMembers: Member[];
  currentMinute: number;
  onSave: (substitution: Omit<SubstitutionRecord, "timestamp">) => void;
}

export function SubstitutionDialog({
  isOpen,
  onClose,
  teamName,
  teamMembers,
  currentMinute,
  onSave,
}: SubstitutionDialogProps) {
  const [playerOutId, setPlayerOutId] = useState<string>("");
  const [playerInId, setPlayerInId] = useState<string>("");

  const handleSave = () => {
    if (!playerOutId || !playerInId || playerOutId === playerInId) return;

    onSave({
      minute: currentMinute,
      player_out_id: playerOutId,
      player_in_id: playerInId,
    });

    // Reset form
    setPlayerOutId("");
    setPlayerInId("");
    onClose();
  };

  const handleCancel = () => {
    setPlayerOutId("");
    setPlayerInId("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🔄 교체 기록 - {teamName}</DialogTitle>
          <DialogDescription>
            교체될 선수와 투입될 선수를 선택하세요 ({currentMinute}분)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Player Out */}
          <div className="space-y-2">
            <Label>아웃 (교체될 선수) *</Label>
            <Select value={playerOutId} onValueChange={setPlayerOutId}>
              <SelectTrigger>
                <SelectValue placeholder="교체될 선수 선택" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem
                    key={member.id}
                    value={member.id}
                    disabled={member.id === playerInId}
                  >
                    <div className="flex items-center gap-2">
                      <MemberAvatar
                        src={member.profile_photo}
                        alt={member.name}
                        size="sm"
                      />
                      {member.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center">
            <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
          </div>

          {/* Player In */}
          <div className="space-y-2">
            <Label>인 (투입될 선수) *</Label>
            <Select value={playerInId} onValueChange={setPlayerInId}>
              <SelectTrigger>
                <SelectValue placeholder="투입될 선수 선택" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem
                    key={member.id}
                    value={member.id}
                    disabled={member.id === playerOutId}
                  >
                    <div className="flex items-center gap-2">
                      <MemberAvatar
                        src={member.profile_photo}
                        alt={member.name}
                        size="sm"
                      />
                      {member.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={!playerOutId || !playerInId || playerOutId === playerInId}
          >
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
