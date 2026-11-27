import { chatDayLabel, chatListTime, isContinuation, unreadLabel } from '@/entities/chat/model/format';
import { kstTimeOf } from '@/shared/lib/checkin-time';
import type { ChatMessage } from '@/shared/types/chat';

const msg = (author: string, at: string): ChatMessage => ({
  id: at, channel_id: 'club', author_member_id: author, body: '', client_msg_id: at, reply_to_id: null,
  created_at: new Date(at).toISOString(), deleted_at: null, deleted_by: null,
});

describe('chat format', () => {
  it('KST 날짜 구분선', () => {
    expect(chatDayLabel('2026-11-28')).toBe('11월 28일 (토)');
    expect(chatDayLabel('2026-12-01')).toBe('12월 1일 (화)');
  });

  it('목록 시각: 오늘은 시:분, 다른 날은 월.일 (KST 기준)', () => {
    const now = new Date('2026-11-28T09:00:00+09:00');
    expect(chatListTime('2026-11-28T06:05:00+09:00', now, kstTimeOf)).toBe('06:05');
    expect(chatListTime('2026-11-27T23:59:00+09:00', now, kstTimeOf)).toBe('11.27');
  });

  it('같은 사람 5분 안 연속 메시지만 이어 붙인다', () => {
    const a = msg('m1', '2026-11-28T06:00:00+09:00');
    expect(isContinuation(a, msg('m1', '2026-11-28T06:04:00+09:00'))).toBe(true);
    expect(isContinuation(a, msg('m1', '2026-11-28T06:06:00+09:00'))).toBe(false);
    expect(isContinuation(a, msg('m2', '2026-11-28T06:01:00+09:00'))).toBe(false);
    expect(isContinuation(undefined, a)).toBe(false);
    expect(isContinuation(msg('m1', '2026-11-27T23:59:00+09:00'), msg('m1', '2026-11-28T00:01:00+09:00'))).toBe(false);
  });

  it('안 읽음 99 초과는 99+', () => {
    expect(unreadLabel(3)).toBe('3');
    expect(unreadLabel(120)).toBe('99+');
  });
});
