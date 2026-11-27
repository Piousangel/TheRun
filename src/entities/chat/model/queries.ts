import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatKeys } from '@/entities/chat/model/keys';
import { getApi } from '@/shared/api/client';
import type { ChatMessage, ChatViewer, SendChatMessageInput } from '@/shared/types/chat';

export { chatKeys };

/**
 * 데모(로컬 어댑터)의 '실시간'은 짧은 재조회다. 같은 기기의 다른 탭이 쓴 메시지가 2초 안에 보인다.
 * Supabase 전환 때 Realtime 구독(postgres_changes)으로 바꾸고 이 간격은 끊김 대비 백필로만 남긴다.
 */
export const CHAT_POLL_MS = 2000;
const CHANNELS_POLL_MS = 5000;
const PAGE_SIZE = 30;

/** 내 채널 목록. viewer가 없으면(로그인 전·미연결) 요청하지 않는다. */
export function useChatChannels(viewer: ChatViewer | null) {
  return useQuery({
    queryKey: chatKeys.channels(viewer?.member_id ?? ''),
    queryFn: () => getApi().chat.listChannels(viewer as ChatViewer),
    enabled: !!viewer,
    refetchInterval: CHANNELS_POLL_MS,
  });
}

/** 한 채널의 메시지. 첫 페이지가 최신, '이전 메시지 더 보기'가 다음 페이지를 붙인다. */
export function useChatMessages(viewer: ChatViewer | null, channelId: string | null) {
  const query = useInfiniteQuery({
    queryKey: chatKeys.messages(channelId ?? '', viewer?.member_id ?? ''),
    queryFn: ({ pageParam }) => getApi().chat.listMessages(viewer as ChatViewer, channelId as string, { before: pageParam, limit: PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.has_more ? last.messages[0]?.id : undefined),
    enabled: !!viewer && !!channelId,
    refetchInterval: CHAT_POLL_MS,
  });
  return { ...query, messages: flattenPages(query.data?.pages.map((p) => p.messages) ?? []) };
}

/** 페이지(최신 → 과거)를 시간순 한 줄로. 재조회 중 페이지 경계가 밀려도 같은 메시지가 두 번 나오지 않게 id로 거른다. */
export function flattenPages(pages: ChatMessage[][]): ChatMessage[] {
  const seen = new Set<string>();
  const out: ChatMessage[] = [];
  for (const page of [...pages].reverse()) {
    for (const m of page) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      out.push(m);
    }
  }
  return out;
}

export function useSendChatMessage(viewer: ChatViewer | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SendChatMessageInput) => {
      if (!viewer) throw new Error('회원 연결 후에 채팅할 수 있어요.');
      return getApi().chat.sendMessage(viewer, input);
    },
    onSuccess: (_row, input) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(input.channel_id, viewer?.member_id ?? '') });
      queryClient.invalidateQueries({ queryKey: chatKeys.channels(viewer?.member_id ?? '') });
    },
  });
}

/** 채널을 열어 둔 동안 최신 메시지까지 읽음으로 남긴다. */
export function useMarkChatRead(viewer: ChatViewer | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => getApi().chat.markRead(viewer as ChatViewer, channelId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.channels(viewer?.member_id ?? '') }),
  });
}
