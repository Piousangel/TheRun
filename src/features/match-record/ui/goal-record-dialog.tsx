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
import type { Member } from "@/shared/types/member";
import type { GoalRecord } from "@/shared/types/match";

interface GoalRecordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  teamMembers: Member[];
  currentMinute: number;
  onSave: (goal: Omit<GoalRecord, "timestamp">) => void;
}

export function GoalRecordDialog({
  isOpen,
  onClose,
  teamName,
  teamMembers,
  currentMinute,
  onSave,
}: GoalRecordDialogProps) {
  const [scorerId, setScorerId] = useState<string>("");
  const [assistId, setAssistId] = useState<string>("none");

  const handleSave = () => {
    if (!scorerId) return;

    onSave({
      minute: currentMinute,
      scorer_id: scorerId,
      assist_id: assistId === "none" ? null : assistId,
    });

    // Reset form
    setScorerId("");
    setAssistId("none");
    onClose();
  };

  const handleCancel = () => {
    setScorerId("");
    setAssistId("none");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>⚽ 골 기록 - {teamName}</DialogTitle>
          <DialogDescription>
            득점자와 어시스트를 선택하세요 ({currentMinute}분)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scorer Selection */}
          <div className="space-y-2">
            <Label>득점자 *</Label>
            <Select value={scorerId} onValueChange={setScorerId}>
              <SelectTrigger>
                <SelectValue placeholder="득점자 선택" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
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

          {/* Assist Selection */}
          <div className="space-y-2">
            <Label>어시스트 (선택)</Label>
            <Select value={assistId} onValueChange={setAssistId}>
              <SelectTrigger>
                <SelectValue placeholder="어시스트 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">없음</SelectItem>
                {teamMembers
                  .filter((m) => m.id !== scorerId)
                  .map((member) => (
                    <SelectItem key={member.id} value={member.id}>
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
          <Button onClick={handleSave} disabled={!scorerId}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
