'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { MemberAvatar } from '@/entities/member/ui/member-avatar';
import { Trophy, Target, Users as UsersIcon, Hand } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import type { Member } from '@/shared/types/member';
import type { PlayerMatchRecord } from '@/shared/types/match';

interface MVPSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  teamAName: string;
  teamBName: string;
  teamAMembers: Member[];
  teamBMembers: Member[];
  teamARecords: PlayerMatchRecord[];
  teamBRecords: PlayerMatchRecord[];
  onSave: (teamAMvpId: string | null, teamBMvpId: string | null) => void;
}

export function MVPSelectionDialog({
  isOpen,
  onClose,
  teamAName,
  teamBName,
  teamAMembers,
  teamBMembers,
  teamARecords,
  teamBRecords,
  onSave,
}: MVPSelectionDialogProps) {
  const [teamAMvpId, setTeamAMvpId] = useState<string | null>(
    teamARecords.find((r) => r.is_mvp)?.member_id || null
  );
  const [teamBMvpId, setTeamBMvpId] = useState<string | null>(
    teamBRecords.find((r) => r.is_mvp)?.member_id || null
  );

  const handleSave = () => {
    onSave(teamAMvpId, teamBMvpId);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const getMemberById = (members: Member[], memberId: string) => {
    return members.find((m) => m.id === memberId);
  };

  const getRecordById = (records: PlayerMatchRecord[], memberId: string) => {
    return records.find((r) => r.member_id === memberId);
  };

  const renderPlayerCard = (
    member: Member,
    record: PlayerMatchRecord,
    isSelected: boolean,
    onSelect: () => void
  ) => (
    <button
      key={member.id}
      onClick={onSelect}
      className={`w-full p-3 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-primary bg-primary/10'
          : 'border-muted hover:border-muted-foreground/50 bg-muted/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <MemberAvatar src={member.profile_photo} alt={member.name} size="md" />
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold">{member.name}</span>
            {isSelected && <Trophy className="h-4 w-4 text-primary" />}
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {record.goals > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Target className="h-3 w-3 mr-1" />
                {record.goals}골
              </Badge>
            )}
            {record.assists > 0 && (
              <Badge variant="secondary" className="text-xs">
                <UsersIcon className="h-3 w-3 mr-1" />
                {record.assists}도움
              </Badge>
            )}
            {record.saves > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Hand className="h-3 w-3 mr-1" />
                {record.saves}선방
              </Badge>
            )}
            {record.goals === 0 && record.assists === 0 && record.saves === 0 && (
              <span className="text-muted-foreground">기록 없음</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            MVP 선정
          </DialogTitle>
          <DialogDescription>각 팀에서 MVP를 선정하세요 (선택 사항)</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team A MVP Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{teamAName}</h3>
              {teamAMvpId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTeamAMvpId(null)}
                  className="text-xs"
                >
                  선택 해제
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {teamAMembers.map((member) => {
                const record = getRecordById(teamARecords, member.id);
                if (!record) return null;
                return renderPlayerCard(
                  member,
                  record,
                  teamAMvpId === member.id,
                  () => setTeamAMvpId(member.id)
                );
              })}
            </div>
          </div>

          {/* Team B MVP Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{teamBName}</h3>
              {teamBMvpId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTeamBMvpId(null)}
                  className="text-xs"
                >
                  선택 해제
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {teamBMembers.map((member) => {
                const record = getRecordById(teamBRecords, member.id);
                if (!record) return null;
                return renderPlayerCard(
                  member,
                  record,
                  teamBMvpId === member.id,
                  () => setTeamBMvpId(member.id)
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            취소
          </Button>
          <Button onClick={handleSave}>
            <Trophy className="mr-2 h-4 w-4" />
            MVP 선정 완료
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
