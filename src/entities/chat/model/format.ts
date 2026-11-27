import { kstDateOf } from '@/shared/lib/checkin-time';
import type { ChatMessage } from '@/shared/types/chat';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** "11월 28일 (토)" — KST 날짜 구분선 */
export function chatDayLabel(kstDate: string): string {
  const [y, m, d] = kstDate.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${m}월 ${d}일 (${weekday})`;
}

/** 채널 목록의 마지막 메시지 시각: 오늘이면 "HH:mm", 아니면 "M.D" */
export function chatListTime(isoAt: string, now: Date, timeOf: (iso: string) => string): string {
  const day = kstDateOf(isoAt);
  if (day === kstDateOf(now.toISOString())) return timeOf(isoAt);
  return `${Number(day.slice(5, 7))}.${Number(day.slice(8, 10))}`;
}

/** 같은 사람이 5분 안에 이어 쓴 메시지는 이름·아바타를 다시 그리지 않는다(같은 날일 때만). */
export function isContinuation(prev: ChatMessage | undefined, cur: ChatMessage): boolean {
  if (!prev || prev.author_member_id !== cur.author_member_id) return false;
  if (kstDateOf(prev.created_at) !== kstDateOf(cur.created_at)) return false;
  return new Date(cur.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60 * 1000;
}

/** 안 읽음 배지 문구 */
export function unreadLabel(count: number): string {
  return count > 99 ? '99+' : String(count);
}
