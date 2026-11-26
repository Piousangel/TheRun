'use client';

import { useRouter } from 'next/navigation';
import { CalendarCheck, X } from 'lucide-react';
import { formatAvailableWeeks, seasonWeeks, shortDate, summarizeAvailability } from '@/entities/league/model/availability';
import { useLeagueAvailability, useLeagueSchedule, useSeason } from '@/entities/league/model/queries';
import { useMembers } from '@/entities/member/model/queries';
import { AvailabilityForm } from '@/features/league-availability/ui/availability-form';
import { useAuth } from '@/providers/auth-provider';
import { DESKTOP_QUERY, useMediaQuery } from '@/shared/lib/use-media-query';
import { useUrlState } from '@/shared/lib/use-url-state';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/shared/ui/drawer';
import { StatusBadge } from '@/shared/ui/status-badge';

interface SeasonAvailabilityProps {
  seasonId: string;
}

/**
 * 시즌 상세의 '참석 가능 주차' 섹션(스펙 §2.1, S1). 드래프트 전에 전원이 입력한다.
 * - 본인: 섹션 맨 위 '내 참석 가능 주차' 카드에서 바로 입력(두 기기 공통).
 * - 운영진: 회원을 골라 대신 입력 `?availability=<memberId>` — 모바일은 하단 시트, 데스크톱은 표 위 패널.
 * - 모바일은 주차별 인원 + 회원 목록(미입력 먼저), 데스크톱은 회원 × 주차 표.
 */
export function SeasonAvailability({ seasonId }: SeasonAvailabilityProps) {
  const router = useRouter();
  const { isAdmin, member } = useAuth();
  const { data: season } = useSeason(seasonId);
  const { data: schedule } = useLeagueSchedule(seasonId);
  const { data: rows = [] } = useLeagueAvailability(seasonId);
  const { data: members = [] } = useMembers();
  const [editParam, setEditParam] = useUrlState('availability');
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  if (!season) return null;

  const editable = season.status !== 'done';
  const weeks = seasonWeeks(season, schedule?.matchdays ?? []);
  const byMember = new Map(rows.map((r) => [r.member_id, r]));
  const summary = summarizeAvailability(rows, members.map((m) => m.id), weeks.map((w) => w.week));
  // 미입력 먼저, 그다음 이름순 — 운영진이 누구에게 물어봐야 하는지 바로 보이게.
  const roster = [...members].sort(
    (a, b) => Number(byMember.has(a.id)) - Number(byMember.has(b.id)) || a.name.localeCompare(b.name, 'ko'),
  );
  const editing = isAdmin && editable && editParam ? (members.find((m) => m.id === editParam) ?? null) : null;

  const handleClose = () => {
    if (window.history.length > 1) router.back();
    else setEditParam(null);
  };

  const editForm = editing ? (
    <AvailabilityForm key={editing.id} seasonId={season.id} memberId={editing.id} label={editing.name} onDone={handleClose} />
  ) : null;

  return (
    <section className="flex flex-col gap-3" aria-labelledby="season-availability">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="season-availability" className="flex items-center gap-2 text-[17px] font-bold text-ink">
          <CalendarCheck className="h-4 w-4" aria-hidden />
          참석 가능 주차
        </h3>
        <span className="text-[13px] tabular-nums text-ink-dim" aria-label="입력 현황">
          입력 {summary.entered}/{members.length}명
        </span>
      </div>
      <p className="text-[13px] text-ink-dim">드래프트 전에 모두 입력해요. 팀장이 선수를 뽑을 때 이 주차를 봅니다.</p>

      {member && editable && (
        <div className="flex flex-col gap-3 rounded-[14px] border border-brand/40 bg-sunken/40 p-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-[15px] font-bold text-ink">내 참석 가능 주차</h4>
            <StatusBadge tone={byMember.has(member.id) ? 'green' : 'amber'}>
              {byMember.has(member.id) ? '입력함' : '미입력'}
            </StatusBadge>
          </div>
          <AvailabilityForm seasonId={season.id} memberId={member.id} label="내" />
        </div>
      )}

      <ul className="flex flex-wrap gap-2" aria-label="주차별 참석 가능 인원">
        {summary.perWeek.map(({ week, count }) => (
          <li key={week} className="rounded-full bg-sunken px-3 py-1 text-[13px] tabular-nums text-ink">
            {week}주차 <span className="text-ink-dim">{shortDate(weeks[week - 1]?.date ?? '')}</span> · <b>{count}명</b>
          </li>
        ))}
      </ul>

      {isDesktop && editForm && (
        <div className="flex flex-col gap-4 rounded-[14px] border border-brand/40 bg-sunken/40 p-5" aria-labelledby="availability-panel-title">
          <div className="flex items-center justify-between gap-3">
            <h4 id="availability-panel-title" className="text-[15px] font-bold text-ink">
              {editing?.name} 참석 가능 주차
            </h4>
            <Button variant="ghost" size="icon" className="h-11 w-11" onClick={handleClose} aria-label="참석 가능 주차 편집 닫기">
              <X className="h-4 w-4" />
            </Button>
          </div>
          {editForm}
        </div>
      )}

      {members.length === 0 ? null : isDesktop ? (
        <div className="max-h-[480px] overflow-auto rounded-[14px] border border-border">
          <table className="w-full text-sm tabular-nums" aria-label="회원별 참석 가능 주차">
            <thead className="sticky top-0 bg-sunken text-[12px] text-ink-dim">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium">회원</th>
                {weeks.map((w) => (
                  <th key={w.week} scope="col" className="px-2 py-2 text-center font-medium">
                    {w.week}주차
                    <span className="block text-[11px] font-normal">{shortDate(w.date)}</span>
                  </th>
                ))}
                <th scope="col" className="px-3 py-2 text-right font-medium">가능</th>
                {isAdmin && editable && <th scope="col" className="w-20 px-3 py-2"><span className="sr-only">수정</span></th>}
              </tr>
            </thead>
            <tbody>
              {roster.map((m) => {
                const row = byMember.get(m.id);
                return (
                  <tr key={m.id} className={cn('border-t border-border', m.id === editParam && 'bg-brand/5')}>
                    <th scope="row" className="px-3 py-2 text-left font-semibold text-ink">
                      {m.name}
                      {!row && <span className="ml-2 text-[11px] font-medium text-signal-red-fg">미입력</span>}
                    </th>
                    {weeks.map((w) => (
                      <td key={w.week} className="px-2 py-2 text-center">
                        {row ? (row.weeks.includes(w.week) ? <span aria-label="가능" className="font-bold text-ink">✓</span> : <span aria-label="불가" className="text-ink-dim">–</span>) : null}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right text-ink-dim">{row ? `${row.weeks.length}/${weeks.length}` : '-'}</td>
                    {isAdmin && editable && (
                      <td className="px-3 py-1.5 text-right">
                        <Button variant="ghost" className="h-9" onClick={() => setEditParam(m.id)} aria-label={`${m.name} 참석 가능 주차 수정`}>
                          수정
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-[14px] border border-border" aria-label="회원별 참석 가능 주차">
          {roster.map((m) => {
            const row = byMember.get(m.id);
            const body = (
              <>
                <span className="min-w-0 flex-1 truncate font-semibold text-ink">{m.name}</span>
                <span className={cn('shrink-0 text-[13px] tabular-nums', row ? 'text-ink' : 'font-semibold text-signal-red-fg')}>
                  {formatAvailableWeeks(row, weeks.length)}
                </span>
              </>
            );
            return (
              <li key={m.id}>
                {isAdmin && editable ? (
                  <button
                    type="button"
                    onClick={() => setEditParam(m.id)}
                    aria-label={`${m.name} 참석 가능 주차 수정`}
                    className="flex min-h-[48px] w-full items-center gap-3 px-3 text-left text-sm outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {body}
                  </button>
                ) : (
                  <div className="flex min-h-[44px] items-center gap-3 px-3 text-sm">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {isDesktop === false && (
        <Drawer open={!!editForm} onOpenChange={(open) => (open ? undefined : handleClose())}>
          <DrawerContent className="max-h-[92vh]">
            <DrawerHeader>
              <DrawerTitle>{editing?.name} 참석 가능 주차</DrawerTitle>
              <DrawerDescription>운영진이 대신 입력합니다. 변경은 시즌 이력에 남아요.</DrawerDescription>
            </DrawerHeader>
            {editForm}
          </DrawerContent>
        </Drawer>
      )}
    </section>
  );
}
