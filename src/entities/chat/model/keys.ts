/** 채팅 쿼리 키 팩토리 */
export const chatKeys = {
  all: ['chat'] as const,
  /** 내 채널 목록(안 읽음 수·마지막 메시지 포함). 보는 사람마다 다르다 */
  channels: (memberId: string) => [...chatKeys.all, 'channels', memberId] as const,
  messageLists: () => [...chatKeys.all, 'messages'] as const,
  /** 한 채널의 메시지 페이지들(무한 스크롤) */
  messages: (channelId: string, memberId: string) => [...chatKeys.messageLists(), channelId, memberId] as const,
};
