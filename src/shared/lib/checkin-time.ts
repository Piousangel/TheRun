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
