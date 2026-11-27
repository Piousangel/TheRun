'use client';

import { toast } from 'sonner';
import { formatAvailableWeeks, seasonWeeks } from '@/entities/league/model/availability';
import { buildDraftView, totalStats } from '@/entities/league/model/draft';
import {
  useLeagueAvailability,
  useLeagueDraft,
  useLeagueSchedule,
  useLeagueTeams,
  useMakeDraftPick,
  useSeason,
} from '@/entities/league/model/queries';
import { useMembers } from '@/entities/member/model/queries';
import { useAuth } from '@/providers/auth-provider';
import { STAT_LABELS } from '@/shared/lib/constants';
import type { MemberStats } from '@/shared/types/member';
import { Button } from '@/shared/ui/button';

interface DraftPickFormProps {
  seasonId: string;
  memberId: string;
  /** 픽 뒤 시트·패널을 닫을 때 */
  onDone?: () => void;
}

const STAT_KEYS: (keyof MemberStats)[] = ['speed', 'shooting', 'passing', 'dribbling', 'stamina', 'defense'];

/**
 * 드래프트 선수 카드 + 픽 확정(스펙 §2.1: 실력과 참석 가능 주차를 보고 뽑는다).
 * 지금 차례인 팀의 팀장이나 운영진만 뽑을 수 있다. 그 사이 다른 탭에서 차례가 넘어갔으면 어댑터가 거부한다.
 */
export function DraftPickForm({ seasonId, memberId, onDone }: DraftPickFormProps) {
  const { user, member: me, isAdmin } = useAuth();
  const { data: season } = useSeason(seasonId);
  const { data: schedule } = useLeagueSchedule(seasonId);
  const { data: teams = [] } = useLeagueTeams(seasonId);
  const { data: draft } = useLeagueDraft(seasonId, { live: true });
  const { data: members = [] } = useMembers();
  const { data: availability = [] } = useLeagueAvailability(seasonId);
  const makePick = useMakeDraftPick();
  const player = members.find((m) => m.id === memberId);
  if (!season || !player) return null;

  const view = buildDraftView(draft, teams);
  const onClock = teams.find((t) => t.id === view.onClockTeamId) ?? null;
  const canPick = !!onClock && (isAdmin || (!!me && onClock.captain_member_id === me.id));
  const taken = view.taken.has(player.id);
  const weekCount = seasonWeeks(season, schedule?.matchdays ?? []).length;
  const weeks = formatAvailableWeeks(availability.find((a) => a.member_id === player.id), weekCount);

  const handlePick = async () => {
    if (!onClock) return;
    try {
      await makePick.mutateAsync({ season_id: seasonId, team_id: onClock.id, member_id: player.id, actor_id: user?.id ?? null });
      toast.success(`${onClock.name} · ${player.name}님을 뽑았어요.`);
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '픽을 저장하지 못했습니다.');
    }
  };

  return (
    <div className="flex flex-col gap-4" role="form" aria-label={`${player.name} 선수 카드`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-ink-dim">참석 가능 · <b className="text-ink">{weeks}</b></span>
        <span className="text-[13px] tabular-nums text-ink-dim">
          스탯 합 <b className="text-[17px] text-ink">{totalStats(player.stats)}</b>
        </span>
      </div>
      <dl className="grid grid-cols-3 gap-2">
        {STAT_KEYS.map((key) => (
          <div key={key} className="flex flex-col rounded-[12px] bg-sunken px-3 py-2">
            <dt className="text-[12px] text-ink-dim">{STAT_LABELS[key]}</dt>
            <dd className="text-[17px] font-bold tabular-nums text-ink">{player.stats[key]}</dd>
          </div>
        ))}
      </dl>
      {taken ? (
        <p className="text-sm text-ink-dim">이미 팀이 정해진 선수예요.</p>
      ) : canPick && onClock ? (
        <Button className="h-12" onClick={handlePick} disabled={makePick.isPending}>
          {makePick.isPending ? '뽑는 중...' : `${onClock.name}에 뽑기`}
        </Button>
      ) : (
        <p className="text-sm text-ink-dim">{onClock ? `지금은 ${onClock.name} 차례예요. 그 팀 팀장이나 운영진이 뽑습니다.` : '드래프트가 진행 중일 때 뽑을 수 있어요.'}</p>
      )}
    </div>
  );
}
