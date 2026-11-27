import { flattenPages } from '@/entities/chat/model/queries';
import type { ChatMessage } from '@/shared/types/chat';

const msg = (id: string): ChatMessage => ({
  id, channel_id: 'club', author_member_id: 'm1', body: id, client_msg_id: id, reply_to_id: null,
  created_at: '2026-11-28T00:00:00.000Z', deleted_at: null, deleted_by: null,
});

describe('flattenPages', () => {
  it('최신 페이지가 앞에 오는 페이지 목록을 시간순 한 줄로 편다', () => {
    expect(flattenPages([[msg('c'), msg('d')], [msg('a'), msg('b')]]).map((m) => m.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('재조회로 페이지 경계가 밀려 겹친 메시지는 한 번만 나온다', () => {
    expect(flattenPages([[msg('c'), msg('d')], [msg('b'), msg('c')]]).map((m) => m.id)).toEqual(['b', 'c', 'd']);
  });
});
