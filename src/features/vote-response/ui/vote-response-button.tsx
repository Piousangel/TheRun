'use client';

import { useState } from 'react';
import { useVote } from '@/entities/vote/model/queries';
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

interface VoteResponseButtonProps {
  sessionId: string;
  member: Member;
  currentVote?: 'attending' | 'absent' | null;
}

export function VoteResponseButton({
  sessionId,
  member,
  currentVote,
}: VoteResponseButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { mutate: vote, isPending } = useVote();

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
    if (currentVote === 'absent') return 'destructive';
    if (currentVote === 'attending') return 'outline';
    return 'outline';
  };

  const getButtonText = () => {
    if (currentVote === 'attending') return '참석';
    if (currentVote === 'absent') return '불참';
    return '미응답';
  };

  const getButtonClassName = () => {
    if (currentVote === 'attending') {
      return 'border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:border-blue-600';
    }
    return '';
  };

  return (
    <>
      <Button
        variant={getButtonVariant()}
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        className={getButtonClassName()}
      >
        {getButtonText()}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{member.name} 투표</DialogTitle>
            <DialogDescription>참석 여부를 선택해주세요.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleVote('attending')}
              disabled={isPending}
              className="flex-1 border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:border-blue-600"
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
