'use client';

import { useState } from 'react';
import { useVoteAttendance } from '@/entities/attendance/model/queries';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Check, X } from 'lucide-react';
import type { Member } from '@/shared/types/member';

interface AttendanceVoteButtonProps {
  sessionId: string;
  member: Member;
  currentVote?: 'attending' | 'absent' | null;
}

export function AttendanceVoteButton({
  sessionId,
  member,
  currentVote,
}: AttendanceVoteButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { mutate: vote, isPending } = useVoteAttendance();

  const handleVote = (status: 'attending' | 'absent') => {
    vote(
      {
        sessionId,
        memberId: member.id,
        status,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
        },
      }
    );
  };

  const getButtonVariant = () => {
    if (currentVote === 'attending') return 'default';
    if (currentVote === 'absent') return 'destructive';
    return 'outline';
  };

  const getButtonText = () => {
    if (currentVote === 'attending') return '참석';
    if (currentVote === 'absent') return '불참';
    return '미응답';
  };

  return (
    <>
      <Button
        variant={getButtonVariant()}
        size="sm"
        onClick={() => setIsDialogOpen(true)}
      >
        {getButtonText()}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{member.name} 출석 투표</DialogTitle>
            <DialogDescription>이번 주 토요일 경기 참석 여부를 선택해주세요.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="default"
              onClick={() => handleVote('attending')}
              disabled={isPending}
              className="flex-1"
            >
              <Check className="mr-2 h-4 w-4" />
              참석
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleVote('absent')}
              disabled={isPending}
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              불참
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
