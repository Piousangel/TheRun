/** 채팅 v1 (스펙 2026-11-15-owner-brief §4, D-11). 클럽 전체 채널 1개 + 리그 팀별 채널(팀원만). */

export type ChatChannelKind = 'club' | 'team';

/** 클럽 채널 id는 고정, 팀 채널은 `team:<league_team_id>`로 리그 팀에서 파생한다(시즌마다 자동 생성). */
export const CLUB_CHANNEL_ID = 'club';

export interface ChatChannel {
  id: string;
  kind: ChatChannelKind;
  name: string;
  /** 팀 채널: 시즌 이름(목록 부제) */
  subtitle: string | null;
  team_id: string | null;
  /** 팀 색(팀 채널 아이콘) */
  color: string | null;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  author_member_id: string;
  /** 지운 메시지는 빈 문자열 */
  body: string;
  /** 클라이언트가 만든 id. 같은 값으로 다시 보내면 새로 만들지 않는다(재전송·에코 중복 방지) */
  client_msg_id: string;
  reply_to_id: string | null;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface ChatChannelSummary {
  channel: ChatChannel;
  /** 내 마지막 읽음 이후 다른 사람이 쓴 메시지 수(지운 것 제외) */
  unread: number;
  last_message: ChatMessage | null;
}

export interface ChatMessagePage {
  /** 오래된 것 → 최신 순 */
  messages: ChatMessage[];
  /** 이 페이지보다 오래된 메시지가 더 있는가 */
  has_more: boolean;
}

/** 채팅을 읽고 쓰는 사람. Supabase에서는 세션·RLS가 정하고, 로컬 어댑터는 이 값으로 권한을 판정한다. */
export interface ChatViewer {
  member_id: string;
  is_admin: boolean;
}

export interface SendChatMessageInput {
  channel_id: string;
  body: string;
  client_msg_id: string;
  reply_to_id?: string | null;
}

export interface ChatRead {
  /** `<channel_id>:<member_id>` */
  id: string;
  channel_id: string;
  member_id: string;
  last_read_at: string;
}

export const CHAT_MESSAGE_MAX = 1000;
