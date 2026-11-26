'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import { buildRoster, matchDays, pickRosterDate, ROSTER_STATUS_LABEL, type RosterRow, type RosterStatus } from '@/entities/checkin/model/match-day';
import { useCheckinsByDate, useConfirmCheckins } from '@/entities/checkin/model/queries';
import { MemberAvatar } from '@/entities/member/ui/member-avatar';
import { useMembers } from '@/entities/member/model/queries';
import { useVoteResponses, useVoteSessions } from '@/entities/vote/model/queries';
import { useAuth } from '@/providers/auth-provider';
import { kstTimeOf, kstToday } from '@/shared/lib/checkin-time';
import { DESKTOP_QUERY, useMediaQuery } from '@/shared/lib/use-media-query';
import { useUrlState } from '@/shared/lib/use-url-state';
import { cn } from '@/shared/lib/utils';
import type { CheckinStatus } from '@/shared/types/checkin';
import { Button } from '@/shared/ui/button';
import { CardSkeleton } from '@/shared/ui/card-skeleton';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/shared/ui/drawer';
import { EmptyState, ErrorState } from '@/shared/ui/empty-state';
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge';

const STATUS_TONE: Record<RosterStatus, StatusTone> = { on_time: 'green', late: 'amber', absent: 'red', pending: 'gray' };
const CONFIRM_OPTIONS: CheckinStatus[] = ['on_time', 'late', 'absent'];

/**
 * 경기일 체크인 명단(스펙 §3 v1: 본인 체크인 + 운영진 확정). 참석 투표자 ∪ 체크인한 사람.
 * - `?date=YYYY-MM-DD`(replace): 경기일. 없으면 오늘 → 최근 지난 경기일 → 다음 경기일.
 * - 모바일: 행을 누르면 `?member=<id>`(push) 시트에서 정시·지각·결석. 하단에 '미확인 결석 처리'.
 * - 데스크톱: 표 + 행마다 정시·지각·결석 버튼(Tab으로 이동, Enter/Space로 확정), 위에 일괄 처리.
 * 멤버는 읽기만 한다.
 */
export function CheckinRoster() {
  const { isAdmin, user } = useAuth();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const { data: sessions, isLoading: sessionsLoading, error: sessionsError, refetch } = useVoteSessions();
  const { data: members } = useMembers();
  const [dateParam, setDateParam] = useUrlState('date', 'replace');
  const [memberParam, setMemberParam] = useUrlState('member');
  const [bulkArmed, setBulkArmed] = useState(false);
  const confirm = useConfirmCheckins();

  const days = matchDays(sessions ?? []);
  const today = kstToday(new Date());
  const date = dateParam && days.some((d) => d.date === dateParam) ? dateParam : pickRosterDate(days.map((d) => d.date), today);
  const session = days.find((d) => d.date === date)?.session ?? null;
  const { data: responses } = useVoteResponses(session?.id ?? '');
  const { data: checkins, isLoading: checkinsLoading } = useCheckinsByDate(date);

  if (sessionsLoading) return <CardSkeleton count={2} />;
  if (sessionsError) return <ErrorState title="경기일을 불러오지 못했어요" description={sessionsError.message} onRetry={() => refetch()} />;

  const nameOf = (id: string) => members?.find((m) => m.id === id)?.name ?? '?';
  const photoOf = (id: string) => members?.find((m) => m.id === id)?.profile_photo ?? null;
  const attendingIds = (responses ?? []).filter((r) => r.status === 'attending').map((r) => r.member_id);
  const rows = date ? buildRoster(attendingIds, checkins ?? [], nameOf) : [];
  const count = (s: RosterStatus) => rows.filter((r) => r.status === s).length;
  const pending = rows.filter((r) => r.status === 'pending');
  const canEdit = isAdmin && !!user && !!date && date <= today;
  const selected = memberParam ? (rows.find((r) => r.member_id === memberParam) ?? null) : null;

  const handleConfirm = async (memberIds: string[], status: CheckinStatus) => {
    if (!date || !user) return;
    try {
      await confirm.mutateAsync(memberIds.map((member_id) => ({ date, member_id, status, actor_id: user.id })));
      toast.success(memberIds.length > 1 ? `${memberIds.length}명 ${ROSTER_STATUS_LABEL[status]} 확정` : `${nameOf(memberIds[0])} ${ROSTER_STATUS_LABEL[status]} 확정`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '확정하지 못했어요');
    }
  };

  const handleSheetConfirm = async (status: CheckinStatus) => {
    if (!selected) return;
    await handleConfirm([selected.member_id], status);
    setMemberParam(null);
  };

  const handleBulk = async () => {
    if (!bulkArmed) {
      setBulkArmed(true);
      return;
    }
    setBulkArmed(false);
    await handleConfirm(pending.map((r) => r.member_id), 'absent');
  };

  const dateLabel = (d: string) => `${Number(d.slice(5, 7))}.${Number(d.slice(8, 10))}${d === today ? ' 오늘' : ''}`;

  const bulkButton = canEdit && pending.length > 0 && (
    <Button variant={bulkArmed ? 'destructive' : 'outline'} onClick={handleBulk} disabled={confirm.isPending} className="w-full md:w-auto">
      {bulkArmed ? `미확인 ${pending.length}명 결석 확정` : `미확인 ${pending.length}명 결석 처리`}
    </Button>
  );

  return (
    <article aria-labelledby="checkin-roster-title" className={cn('space-y-5', canEdit && pending.length > 0 && 'pb-24 md:pb-0')}>
      <header className="space-y-3">
        <Link href="/attendance" className="inline-flex min-h-[44px] items-center gap-1 text-sm text-ink-dim hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          출석
        </Link>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-brand-dark" aria-hidden />
          <h1 id="checkin-roster-title" className="text-2xl font-semibold text-ink">
            체크인 명단
          </h1>
        </div>
        <p className="text-sm text-ink-dim">06:30까지 체크인하면 정시, 그 뒤면 지각. 참석 투표했는데 체크인이 없으면 운영진이 결석으로 확정합니다.</p>
        {days.length > 0 && (
          <div role="group" aria-label="경기일" className="flex gap-2 overflow-x-auto pb-1">
            {days.slice(0, 8).map((d) => (
              <button
                key={d.date}
                type="button"
                aria-pressed={d.date === date}
                onClick={() => setDateParam(d.date)}
                className={cn(
                  'min-h-[44px] shrink-0 rounded-full border px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  d.date === date ? 'border-primary bg-primary text-primary-foreground' : 'bg-background text-ink-dim hover:text-ink',
                )}
              >
                {dateLabel(d.date)}
              </button>
            ))}
          </div>
        )}
      </header>

      {!date ? (
        <EmptyState title="경기일이 없어요" description="경기 투표를 열면 그 날짜로 체크인 명단이 생깁니다." />
      ) : checkinsLoading ? (
        <CardSkeleton count={2} />
      ) : (
        <>
          <dl aria-label="체크인 집계" className="grid grid-cols-4 gap-2">
            {(['on_time', 'late', 'absent', 'pending'] as const).map((s) => (
              <div key={s} className="rounded-xl border bg-background p-3 text-center">
                <dt className="text-xs text-ink-dim">{ROSTER_STATUS_LABEL[s]}</dt>
                <dd className="mt-1 text-xl font-semibold text-ink">{count(s)}</dd>
              </div>
            ))}
          </dl>

          {rows.length === 0 ? (
            <EmptyState title="아직 명단이 없어요" description="참석 투표나 체크인이 생기면 여기에 보입니다." />
          ) : isDesktop ? (
            <section aria-label="체크인 표" className="space-y-3">
              {bulkButton && <div className="flex justify-end">{bulkButton}</div>}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-ink-dim">
                    <th className="py-2 font-medium">이름</th>
                    <th className="py-2 font-medium">투표</th>
                    <th className="py-2 font-medium">체크인</th>
                    <th className="py-2 font-medium">상태</th>
                    {canEdit && <th className="py-2 text-right font-medium">확정</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.member_id} aria-label={nameOf(r.member_id)} className="border-b last:border-0">
                      <td className="py-2">
                        <span className="flex items-center gap-2">
                          <MemberAvatar src={photoOf(r.member_id)} alt={nameOf(r.member_id)} size="sm" />
                          <span className="font-medium text-ink">{nameOf(r.member_id)}</span>
                        </span>
                      </td>
                      <td className="py-2 text-ink-dim">{r.voted ? '참석' : '—'}</td>
                      <td className="py-2 tabular-nums text-ink-dim">{r.checked_in_at ? kstTimeOf(r.checked_in_at) : '—'}</td>
                      <td className="py-2">
                        <StatusCell row={r} />
                      </td>
                      {canEdit && (
                        <td className="py-2">
                          <div role="group" aria-label={`${nameOf(r.member_id)} 확정`} className="flex justify-end gap-1">
                            {CONFIRM_OPTIONS.map((s) => (
                              <Button
                                key={s}
                                size="sm"
                                variant={r.status === s ? 'default' : 'outline'}
                                aria-pressed={r.status === s}
                                disabled={confirm.isPending}
                                onClick={() => handleConfirm([r.member_id], s)}
                              >
                                {ROSTER_STATUS_LABEL[s]}
                              </Button>
                            ))}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : isDesktop === false ? (
            <ul aria-label="체크인 목록" className="divide-y rounded-xl border bg-background">
              {rows.map((r) => {
                const content = (
                  <>
                    <MemberAvatar src={photoOf(r.member_id)} alt={nameOf(r.member_id)} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-ink">{nameOf(r.member_id)}</span>
                      <span className="block text-xs text-ink-dim">
                        {r.checked_in_at ? `${kstTimeOf(r.checked_in_at)} 체크인` : r.voted ? '참석 투표' : '투표 없음'}
                      </span>
                    </span>
                    <StatusCell row={r} />
                  </>
                );
                return (
                  <li key={r.member_id}>
                    {canEdit ? (
                      <button
                        type="button"
                        aria-label={`${nameOf(r.member_id)} ${ROSTER_STATUS_LABEL[r.status]}`}
                        onClick={() => setMemberParam(r.member_id)}
                        className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {content}
                        <ChevronRight className="h-4 w-4 text-ink-faint" aria-hidden />
                      </button>
                    ) : (
                      <div className="flex min-h-[56px] items-center gap-3 px-4">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : null}

          {isDesktop === false && bulkButton && (
            <div className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+1px+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">{bulkButton}</div>
          )}
        </>
      )}

      {isDesktop === false && (
        <Drawer open={canEdit && !!selected} onOpenChange={(open) => (open ? undefined : setMemberParam(null))}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{selected ? `${nameOf(selected.member_id)} 확정` : '확정'}</DrawerTitle>
              <DrawerDescription>
                {selected?.checked_in_at ? `${kstTimeOf(selected.checked_in_at)} 본인 체크인` : '본인 체크인 없음'}
              </DrawerDescription>
            </DrawerHeader>
            <div className="grid grid-cols-3 gap-2 px-4 pb-6">
              {CONFIRM_OPTIONS.map((s) => (
                <Button
                  key={s}
                  size="lg"
                  variant={selected?.status === s ? 'default' : 'outline'}
                  aria-pressed={selected?.status === s}
                  disabled={confirm.isPending}
                  onClick={() => handleSheetConfirm(s)}
                >
                  {ROSTER_STATUS_LABEL[s]}
                </Button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </article>
  );
}

function StatusCell({ row }: { row: RosterRow }) {
  return (
    <span className="inline-flex items-center gap-1">
      <StatusBadge tone={STATUS_TONE[row.status]}>{ROSTER_STATUS_LABEL[row.status]}</StatusBadge>
      {row.confirmed && <span className="text-xs text-ink-faint">운영진</span>}
    </span>
  );
}
