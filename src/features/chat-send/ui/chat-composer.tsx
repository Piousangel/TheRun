'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import { SendHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { useSendChatMessage } from '@/entities/chat/model/queries';
import { useChatViewer } from '@/features/chat-send/model/use-chat-viewer';
import { newId } from '@/shared/lib/id';
import { cn } from '@/shared/lib/utils';
import { CHAT_MESSAGE_MAX } from '@/shared/types/chat';

interface ChatComposerProps {
  channelId: string;
  channelName: string;
  className?: string;
}

/**
 * 메시지 입력창. Enter = 보내기, Shift+Enter = 줄바꿈.
 * 한글 입력 중(IME 조합)의 Enter는 글자 확정이라 보내지 않는다 — 안 막으면 마지막 글자가 다음 메시지로 넘어간다.
 * 실패하면 입력한 글을 지우지 않는다. 재시도는 같은 client_msg_id로 보내 중복이 생기지 않는다.
 */
export function ChatComposer({ channelId, channelName, className }: ChatComposerProps) {
  const viewer = useChatViewer();
  const send = useSendChatMessage(viewer);
  const [text, setText] = useState('');
  const pendingId = useRef<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const trimmed = text.trim();

  const handleSend = async () => {
    if (!trimmed || send.isPending) return;
    pendingId.current ??= newId();
    try {
      await send.mutateAsync({ channel_id: channelId, body: trimmed, client_msg_id: pendingId.current });
      pendingId.current = null;
      setText('');
      inputRef.current?.focus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '보내지 못했어요. 다시 눌러 주세요.');
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void handleSend();
  };

  const handleChange = (value: string) => {
    // 글을 고치면 다른 메시지다
    pendingId.current = null;
    setText(value);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleSend();
      }}
      className={cn('flex items-end gap-2', className)}
    >
      <label htmlFor="chat-input" className="sr-only">
        {channelName}에 메시지 입력
      </label>
      <textarea
        id="chat-input"
        ref={inputRef}
        rows={1}
        value={text}
        maxLength={CHAT_MESSAGE_MAX}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="메시지 보내기"
        className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-[15px] leading-6 [field-sizing:content] placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <button
        type="submit"
        aria-label="보내기"
        disabled={!trimmed || send.isPending}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
      >
        <SendHorizontal className="h-5 w-5" aria-hidden />
      </button>
    </form>
  );
}
