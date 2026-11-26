'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ClipboardCheck, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { matchDays, ROSTER_STATUS_LABEL } from '@/entities/checkin/model/match-day';
import { useCheckIn, useCheckinsByDate } from '@/entities/checkin/model/queries';
import { useVoteSessions } from '@/entities/vote/model/queries';
import { useAuth } from '@/providers/auth-provider';
import { CHECKIN_CLOSE, CHECKIN_ON_TIME_UNTIL, isCheckinWindowOpen, kstTimeOf, kstToday } from '@/shared/lib/checkin-time';
import { Button } from '@/shared/ui/button';
import { StatusBadge } from '@/shared/ui/status-badge';

/** 30초마다 현재 시각. 서버 렌더·첫 하이드레이션에서는 null(시각 의존 UI를 그리지 않는다). */
function useNow(intervalMs = 30_000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * 홈 최상단 "도착했어요" (스펙 §3 v1). 경기 투표가 있는 날 05:30~08:00(KST)에만 뜬다.
 * 06:30까지 누르면 정시, 그 뒤면 지각. 운영진은 여기서 체크인 명단으로 바로 간다.
 * 모바일: 카드 아래 전체 폭 버튼(엄지). 데스크톱: 한 줄 배너, 버튼은 오른쪽.
 */
export function CheckinCard() {
  const now = useNow();
  const { member, isAdmin } = useAuth();
  const { data: sessions } = useVoteSessions();
  const today = now ? kstToday(now) : null;
  const isMatchDay = !!today && matchDays(sessions ?? []).some((d) => d.date === today);
  const { data: checkins } = useCheckinsByDate(isMatchDay ? today : null);
  const checkIn = useCheckIn();

  if (!now || !today || !isMatchDay) return null;
  const mine = member ? checkins?.find((c) => c.member_id === member.id) : undefined;
  const open = isCheckinWindowOpen(today, now);
  if (!open && !mine) return null;

  const handleCheckIn = async () => {
    if (!member) return;
    try {
      const row = await checkIn.mutateAsync({ date: today, member_id: member.id });
      toast.success(row.status === 'on_time' ? '정시 체크인 완료' : '체크인 완료(지각)');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '체크인하지 못했어요');
    }
  };

  return (
    <section
      aria-label="오늘 경기 체크인"
      className="rounded-2xl border border-primary/25 bg-brand-soft/60 p-4 md:flex md:items-center md:justify-between md:gap-6 md:px-6"
    >
      <div className="flex items-start gap-3">
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-dark" aria-hidden />
        <div>
          <h2 className="text-base font-semibold text-ink">오늘 경기 체크인</h2>
          {mine ? (
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-dim">
              <CheckCircle2 className="h-4 w-4 text-brand-dark" aria-hidden />
              <span>{mine.checked_in_at ? `${kstTimeOf(mine.checked_in_at)} 체크인` : '운영진 확정'}</span>
              <StatusBadge tone={mine.status === 'on_time' ? 'green' : mine.status === 'late' ? 'amber' : 'red'}>
                {ROSTER_STATUS_LABEL[mine.status]}
              </StatusBadge>
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-dim">
              {CHECKIN_ON_TIME_UNTIL}까지 누르면 정시, {CHECKIN_CLOSE}에 닫혀요.
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2 md:mt-0 md:flex-row md:items-center">
        {!mine && member && (
          <Button size="lg" className="w-full md:w-auto" onClick={handleCheckIn} disabled={checkIn.isPending}>
            도착했어요
          </Button>
        )}
        {!member && (
          <Button asChild variant="outline" className="w-full md:w-auto">
            <Link href="/me">멤버 연결 후 체크인</Link>
          </Button>
        )}
        {isAdmin && (
          <Button asChild variant="outline" className="w-full md:w-auto">
            <Link href={`/attendance/checkin?date=${today}`}>
              <ClipboardCheck aria-hidden />
              체크인 명단
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
}
