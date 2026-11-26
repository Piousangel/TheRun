import type { CheckinStatus } from '@/shared/types/checkin';

/** 체크인 버튼이 열리는 구간(KST)과 정시 기준 (스펙 §3). */
export const CHECKIN_OPEN = '05:30';
export const CHECKIN_ON_TIME_UNTIL = '06:30';
export const CHECKIN_CLOSE = '08:00';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** UTC 시각을 KST 기준 { date: YYYY-MM-DD, minutes: 0..1439 }로 바꾼다. */
function toKst(at: Date): { date: string; minutes: number } {
  const kst = new Date(at.getTime() + KST_OFFSET_MS);
  return { date: kst.toISOString().slice(0, 10), minutes: kst.getUTCHours() * 60 + kst.getUTCMinutes() };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** 경기일 당일 05:30~08:00(KST)에만 true. 홈의 "도착했어요" 버튼 노출 조건. */
export function isCheckinWindowOpen(date: string, now: Date): boolean {
  const kst = toKst(now);
  return kst.date === date && kst.minutes >= toMinutes(CHECKIN_OPEN) && kst.minutes <= toMinutes(CHECKIN_CLOSE);
}

/** 06:30:59까지(분 단위로 06:30 이하)면 정시, 그 뒤면 지각. */
export function classifyCheckin(checkedInAt: Date): Exclude<CheckinStatus, 'absent'> {
  return toKst(checkedInAt).minutes <= toMinutes(CHECKIN_ON_TIME_UNTIL) ? 'on_time' : 'late';
}

/** 오늘 날짜(KST) YYYY-MM-DD. 지난 경기일만 출석 집계에 넣을 때 쓴다. */
export function kstToday(now: Date): string {
  return toKst(now).date;
}

/** ISO 시각의 KST 날짜 YYYY-MM-DD. 투표 세션 event_date를 경기일로 바꿀 때 쓴다. */
export function kstDateOf(isoAt: string): string {
  return toKst(new Date(isoAt)).date;
}

/** ISO 시각의 KST 시:분 "HH:mm". 체크인 시각 표시용. */
export function kstTimeOf(isoAt: string): string {
  const { minutes } = toKst(new Date(isoAt));
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
