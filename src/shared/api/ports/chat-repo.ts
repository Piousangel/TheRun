import type { ChatChannelSummary, ChatMessage, ChatMessagePage, ChatViewer, SendChatMessageInput } from '@/shared/types/chat';

export interface ChatRepo {
  /**
   * 내가 볼 수 있는 채널. 클럽 채널이 맨 위, 그 뒤 팀 채널(진행 중·준비 중 시즌에서 내가 팀장이거나 드래프트로 뽑힌 팀).
   * 운영진은 모더레이션을 위해 진행 중·준비 중 시즌의 팀 채널을 모두 본다.
   */
  listChannels(viewer: ChatViewer): Promise<ChatChannelSummary[]>;
  /** 최신 `limit`개(기본 30). `before`(메시지 id)를 주면 그보다 오래된 것. 권한이 없는 채널은 거부한다. */
  listMessages(viewer: ChatViewer, channelId: string, opts?: { before?: string; limit?: number }): Promise<ChatMessagePage>;
  /** 보내기. 같은 작성자의 같은 `client_msg_id`면 기존 메시지를 돌려준다(멱등). 빈 글·1000자 초과는 거부 */
  sendMessage(viewer: ChatViewer, input: SendChatMessageInput): Promise<ChatMessage>;
  /** 지우기(작성자 또는 운영진). 본문을 비우고 deleted_at을 남긴다. 감사 로그에 남는다 */
  deleteMessage(viewer: ChatViewer, messageId: string): Promise<ChatMessage>;
  /** 이 채널을 지금까지 읽었다(안 읽음 수 계산 기준) */
  markRead(viewer: ChatViewer, channelId: string): Promise<void>;
}
