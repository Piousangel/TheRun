'use client';

import { Dices, Flag, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFinishDraft, useLeagueDraft, useLeagueTeams, useStartDraft, useUndoDraftPick } from '@/entities/league/model/queries';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/shared/ui/button';

interface DraftControlsProps {
  seasonId: string;
}

/**
 * 운영진 드래프트 조작: 순서 추첨·시작(픽 전에는 다시 추첨 가능), 마지막 픽 되돌리기, 드래프트 끝내기.
 * 모든 조작은 시즌 변경 이력에 남는다.
 */
export function DraftControls({ seasonId }: DraftControlsProps) {
  const { user, isAdmin } = useAuth();
  const { data: draft } = useLeagueDraft(seasonId, { live: true });
  const { data: teams = [] } = useLeagueTeams(seasonId);
  const startDraft = useStartDraft();
  const undoPick = useUndoDraftPick();
  const finishDraft = useFinishDraft();
  if (!isAdmin || draft?.status === 'done') return null;

  const pending = startDraft.isPending || undoPick.isPending || finishDraft.isPending;
  const actorId = user?.id ?? null;

  const handleStart = async () => {
    try {
      const started = await startDraft.mutateAsync({ season_id: seasonId, actor_id: actorId });
      const names = started.order.map((id) => teams.find((t) => t.id === id)?.name ?? '?').join(' → ');
      toast.success(`순서를 추첨했어요: ${names}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '드래프트를 시작하지 못했습니다.');
    }
  };

  const handleUndo = async () => {
    try {
      await undoPick.mutateAsync({ seasonId, actorId });
      toast.success('마지막 픽을 되돌렸어요.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '픽을 되돌리지 못했습니다.');
    }
  };

  const handleFinish = async () => {
    if (!window.confirm('드래프트를 끝낼까요? 끝낸 뒤에는 픽을 바꿀 수 없어요.')) return;
    try {
      await finishDraft.mutateAsync({ seasonId, actorId });
      toast.success('드래프트를 끝냈어요.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '드래프트를 끝내지 못했습니다.');
    }
  };

  const noPicks = !draft || draft.picks.length === 0;

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="드래프트 운영">
      {noPicks && (
        <Button className="h-11" onClick={handleStart} disabled={pending || teams.length < 2}>
          <Dices className="mr-1.5 h-4 w-4" aria-hidden />
          {draft ? '순서 다시 추첨' : '순서 추첨하고 시작'}
        </Button>
      )}
      {draft && !noPicks && (
        <Button variant="outline" className="h-11" onClick={handleUndo} disabled={pending}>
          <Undo2 className="mr-1.5 h-4 w-4" aria-hidden />
          마지막 픽 되돌리기
        </Button>
      )}
      {draft && (
        <Button variant="outline" className="h-11" onClick={handleFinish} disabled={pending}>
          <Flag className="mr-1.5 h-4 w-4" aria-hidden />
          드래프트 끝내기
        </Button>
      )}
    </div>
  );
}
