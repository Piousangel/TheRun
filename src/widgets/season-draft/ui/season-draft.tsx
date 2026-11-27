'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Crown, Users, X } from 'lucide-react';
import { formatAvailableWeeks, seasonWeeks } from '@/entities/league/model/availability';
import { buildDraftView, totalStats } from '@/entities/league/model/draft';
import {
  DRAFT_SYNC_MS,
  useLeagueAvailability,
  useLeagueDraft,
  useLeagueSchedule,
  useLeagueTeams,
  useSeason,
} from '@/entities/league/model/queries';
import { useMembers } from '@/entities/member/model/queries';
import { DraftControls } from '@/features/league-draft/ui/draft-controls';
import { DraftPickForm } from '@/features/league-draft/ui/draft-pick-form';
import { useAuth } from '@/providers/auth-provider';
import { STAT_LABELS } from '@/shared/lib/constants';
import { DESKTOP_QUERY, useMediaQuery } from '@/shared/lib/use-media-query';
import { useUrlState } from '@/shared/lib/use-url-state';
import { cn } from '@/shared/lib/utils';
import type { MemberStats } from '@/shared/types/member';
import { Button } from '@/shared/ui/button';
import { CardSkeleton } from '@/shared/ui/card-skeleton';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/shared/ui/drawer';
import { EmptyState, ErrorState } from '@/shared/ui/empty-state';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { StatusBadge } from '@/shared/ui/status-badge';

interface SeasonDraftProps {
  seasonId: string;
}

type DraftTab = 'pool' | 'teams';
const TAB_OPTIONS = [
  { value: 'pool', label: '선수' },
  { value: 'teams', label: '팀' },
] as const;
const STAT_KEYS: (keyof MemberStats)[] = ['speed', 'shooting', 'passing', 'dribbling', 'stamina', 'defense'];

/**
 * 팀장 실시간 스네이크 드래프트(스펙 §2.1, S1). 경로 `/seasons/<id>/draft`.
 * - 선수 카드: `?pick=<memberId>` — 모바일은 하단 시트, 데스크톱은 보드 위 패널. 차례인 팀장·운영진은 여기서 뽑는다.
 * - 모바일: '지금 차례' 배너 + `?tab=pool|teams`(선수 목록 / 팀 명단). 내가 팀장이면 내 차례인지 맨 위에 크게.
 * - 데스크톱: 왼쪽 선수 표(스탯 6종·합·참석 주차), 오른쪽 팀별 보드.
 * - 데모 모드에서는 DRAFT_SYNC_MS마다 다시 읽어 다른 탭의 픽을 반영한다(Supabase 전환 시 Realtime).
 */
export function SeasonDraft({ seasonId }: SeasonDraftProps) {
  const router = useRouter();
  const { member: me, isAdmin } = useAuth();
  const { data: season, isLoading, error, refetch } = useSeason(seasonId);
  const { data: teams = [] } = useLeagueTeams(seasonId);
  const { data: schedule } = useLeagueSchedule(seasonId);
  const { data: draft, isLoading: draftLoading } = useLeagueDraft(seasonId, { live: true });
  const { data: availability = [] } = useLeagueAvailability(seasonId);
  const { data: members = [] } = useMembers();
  const [pickParam, setPickParam] = useUrlState('pick');
  const [tabParam, setTabParam] = useUrlState('tab', 'replace');
  const isDesktop = useMediaQuery(DESKTOP_QUERY);

  if (isLoading || draftLoading) return <CardSkeleton count={2} />;
  if (error || !season) return <ErrorState title="시즌을 불러오지 못했어요" description={error?.message} onRetry={() => refetch()} />;

  const tab: DraftTab = tabParam === 'teams' ? 'teams' : 'pool';
  const view = buildDraftView(draft, teams);
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? '?';
  const onClock = view.onClockTeamId ? (teamById.get(view.onClockTeamId) ?? null) : null;
  const myTeam = me ? (teams.find((t) => t.captain_member_id === me.id) ?? null) : null;
  const myTurn = !!onClock && !!myTeam && onClock.id === myTeam.id;
  const weekCount = seasonWeeks(season, schedule?.matchdays ?? []).length;
  const weeksOf = (id: string) => formatAvailableWeeks(availability.find((a) => a.member_id === id), weekCount);
  const pool = members
    .filter((m) => !view.taken.has(m.id))
    .sort((a, b) => totalStats(b.stats) - totalStats(a.stats) || a.name.localeCompare(b.name, 'ko'));
  const picked = pickParam ? (members.find((m) => m.id === pickParam) ?? null) : null;
  const pickNoOf = new Map((draft?.picks ?? []).map((p) => [p.member_id, p.pick_no]));

  const handleClosePick = () => {
    if (window.history.length > 1) router.back();
    else setPickParam(null);
  };

  const pickForm = picked ? <DraftPickForm key={picked.id} seasonId={season.id} memberId={picked.id} onDone={handleClosePick} /> : null;

  const header = (
    <header className="flex flex-col gap-3">
      <Link href={`/seasons/${season.id}`} className="flex min-h-[44px] items-center gap-1 self-start text-sm text-ink-dim hover:text-ink">
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {season.name}
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[22px] font-bold text-ink">드래프트</h2>
        <StatusBadge tone={!draft ? 'gray' : draft.status === 'open' ? 'amber' : 'green'}>
          {!draft ? '시작 전' : draft.status === 'open' ? '진행 중' : '완료'}
        </StatusBadge>
        {draft && <span className="text-[13px] tabular-nums text-ink-dim">{draft.picks.length}픽 · 남은 선수 {pool.length}명</span>}
      </div>
      <DraftControls seasonId={season.id} />
    </header>
  );

  if (teams.length < 2) {
    return (
      <article className="flex flex-col gap-6" aria-label="드래프트">
        {header}
        <EmptyState icon={Users} title="팀이 2개 이상 필요해요" description="시즌 상세에서 팀과 팀장을 먼저 정하세요." />
      </article>
    );
  }

  const clockBanner = (
    <section
      aria-label="지금 차례"
      aria-live="polite"
      className={cn('flex flex-col gap-2 rounded-[14px] border p-4', myTurn ? 'border-brand bg-brand/10' : 'border-border bg-sunken/40')}
    >
      {onClock ? (
        <>
          <p className="text-[13px] tabular-nums text-ink-dim">
            {view.round}라운드 · {view.nextPickNo}번째 픽
          </p>
          <p className="flex items-center gap-2 text-[19px] font-bold text-ink">
            <span aria-hidden className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: onClock.color }} />
            {myTurn ? `내 차례예요 · ${onClock.name}` : `${onClock.name} 차례`}
          </p>
          {view.upcoming.length > 0 && (
            <p className="text-[13px] text-ink-dim">다음: {view.upcoming.map((id) => teamById.get(id)?.name ?? '?').join(' → ')}</p>
          )}
        </>
      ) : draft?.status === 'done' ? (
        <p className="text-[15px] font-semibold text-ink">드래프트가 끝났어요. 팀 명단을 확인하세요.</p>
      ) : (
        <p className="text-[15px] text-ink">{isAdmin ? '순서를 추첨하면 드래프트가 시작돼요.' : '운영진이 순서를 추첨하면 드래프트가 시작돼요.'}</p>
      )}
      <p className="text-[12px] text-ink-dim">다른 기기의 픽은 {DRAFT_SYNC_MS / 1000}초 안에 반영돼요.</p>
    </section>
  );

  const teamBoard = (
    <ul className={cn('grid gap-3', isDesktop ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1')} aria-label="팀별 명단">
      {(draft?.order ?? teams.map((t) => t.id)).map((teamId) => {
        const team = teamById.get(teamId);
        if (!team) return null;
        const roster = view.rosters[team.id] ?? [];
        return (
          <li
            key={team.id}
            aria-label={`${team.name} 명단`}
            className={cn('flex flex-col gap-2 rounded-[14px] border p-3', team.id === view.onClockTeamId ? 'border-brand' : 'border-border')}
          >
            <div className="flex items-center gap-2">
              <span aria-hidden className="h-3.5 w-3.5 rounded-full border border-border" style={{ backgroundColor: team.color }} />
              <span className="font-bold text-ink">{team.name}</span>
              <span className="ml-auto text-[12px] tabular-nums text-ink-dim">{roster.length}명</span>
            </div>
            <ol className="flex flex-col gap-1 text-sm">
              {roster.map((id) => (
                <li key={id} className="flex items-center gap-2 text-ink">
                  {id === team.captain_member_id ? (
                    <Crown className="h-3.5 w-3.5 text-brand" aria-label="팀장" />
                  ) : (
                    <span className="w-6 text-[12px] tabular-nums text-ink-dim">#{pickNoOf.get(id)}</span>
                  )}
                  {memberName(id)}
                </li>
              ))}
              {roster.length === 0 && <li className="text-[13px] text-ink-dim">아직 없음</li>}
            </ol>
          </li>
        );
      })}
    </ul>
  );

  if (isDesktop) {
    return (
      <article className="flex flex-col gap-6" aria-label="드래프트">
        {header}
        {clockBanner}
        {pickForm && (
          <section className="flex flex-col gap-3 rounded-[14px] border border-brand/40 bg-sunken/40 p-5" aria-labelledby="pick-panel-title">
            <div className="flex items-center justify-between gap-3">
              <h3 id="pick-panel-title" className="text-[17px] font-bold text-ink">
                {picked?.name}
              </h3>
              <Button variant="ghost" size="icon" className="h-11 w-11" onClick={handleClosePick} aria-label="선수 카드 닫기">
                <X className="h-4 w-4" />
              </Button>
            </div>
            {pickForm}
          </section>
        )}
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(280px,380px)] gap-6">
          <section className="flex flex-col gap-3" aria-labelledby="draft-pool">
            <h3 id="draft-pool" className="text-[17px] font-bold text-ink">
              남은 선수 ({pool.length})
            </h3>
            <div className="max-h-[640px] overflow-auto rounded-[14px] border border-border">
              <table className="w-full text-sm tabular-nums" aria-label="남은 선수">
                <thead className="sticky top-0 bg-sunken text-[12px] text-ink-dim">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left font-medium">선수</th>
                    {STAT_KEYS.map((k) => (
                      <th key={k} scope="col" className="px-2 py-2 text-right font-medium">{STAT_LABELS[k]}</th>
                    ))}
                    <th scope="col" className="px-2 py-2 text-right font-medium">합</th>
                    <th scope="col" className="px-3 py-2 text-left font-medium">참석 주차</th>
                  </tr>
                </thead>
                <tbody>
                  {pool.map((m) => (
                    <tr key={m.id} className={cn('border-t border-border', m.id === pickParam && 'bg-brand/5')}>
                      <th scope="row" className="px-3 py-1 text-left">
                        <button
                          type="button"
                          onClick={() => setPickParam(m.id)}
                          aria-label={`${m.name} 선수 카드`}
                          className="min-h-[36px] rounded font-semibold text-ink underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {m.name}
                        </button>
                      </th>
                      {STAT_KEYS.map((k) => (
                        <td key={k} className="px-2 py-1 text-right text-ink">{m.stats[k]}</td>
                      ))}
                      <td className="px-2 py-1 text-right font-bold text-ink">{totalStats(m.stats)}</td>
                      <td className="px-3 py-1 text-ink-dim">{weeksOf(m.id)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="flex flex-col gap-3" aria-labelledby="draft-board">
            <h3 id="draft-board" className="text-[17px] font-bold text-ink">팀 보드</h3>
            {teamBoard}
          </section>
        </div>
      </article>
    );
  }

  return (
    <article className="flex flex-col gap-4" aria-label="드래프트">
      {header}
      {clockBanner}
      <SegmentedControl ariaLabel="드래프트 보기" value={tab} onChange={(v) => setTabParam(v === 'pool' ? null : v)} options={TAB_OPTIONS} />
      {tab === 'pool' ? (
        <ul className="flex flex-col divide-y divide-border rounded-[14px] border border-border" aria-label="남은 선수">
          {pool.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setPickParam(m.id)}
                aria-label={`${m.name} 선수 카드`}
                className="flex min-h-[56px] w-full items-center gap-3 px-3 text-left outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-semibold text-ink">{m.name}</span>
                  <span className="truncate text-[12px] text-ink-dim">참석 {weeksOf(m.id)}</span>
                </span>
                <span className="shrink-0 text-[15px] font-bold tabular-nums text-ink">{totalStats(m.stats)}</span>
              </button>
            </li>
          ))}
          {pool.length === 0 && <li className="px-3 py-4 text-sm text-ink-dim">남은 선수가 없어요.</li>}
        </ul>
      ) : (
        teamBoard
      )}
      {isDesktop === false && (
        <Drawer open={!!pickForm} onOpenChange={(open) => (open ? undefined : handleClosePick())}>
          <DrawerContent className="max-h-[92vh]">
            <DrawerHeader>
              <DrawerTitle>{picked?.name}</DrawerTitle>
              <DrawerDescription>{onClock ? `${view.nextPickNo}번째 픽 · ${onClock.name} 차례` : '선수 카드'}</DrawerDescription>
            </DrawerHeader>
            {pickForm}
          </DrawerContent>
        </Drawer>
      )}
    </article>
  );
}
