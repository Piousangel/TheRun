'use client';

import { Fragment, useEffect, useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import { MessagesSquare } from 'lucide-react';
import { chatDayLabel, chatListTime, isContinuation, unreadLabel } from '@/entities/chat/model/format';
import { useChatChannels, useChatMessages, useMarkChatRead } from '@/entities/chat/model/queries';
import { MemberAvatar } from '@/entities/member/ui/member-avatar';
import { useMembers } from '@/entities/member/model/queries';
import { useChatViewer } from '@/features/chat-send/model/use-chat-viewer';
import { ChatComposer } from '@/features/chat-send/ui/chat-composer';
import { useAuth } from '@/providers/auth-provider';
import { kstDateOf, kstTimeOf } from '@/shared/lib/checkin-time';
import { usePageHeader } from '@/shared/lib/page-header/store';
import { DESKTOP_QUERY, useMediaQuery } from '@/shared/lib/use-media-query';
import { useUrlState } from '@/shared/lib/use-url-state';
import { cn } from '@/shared/lib/utils';
import { CLUB_CHANNEL_ID, type ChatChannel, type ChatChannelSummary, type ChatMessage } from '@/shared/types/chat';
import { Button } from '@/shared/ui/button';
import { CardSkeleton } from '@/shared/ui/card-skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/empty-state';

/**
 * 채팅 v1 (스펙 §4, D-11). `/chat?channel=<id>`가 열린 채널이다(push — 뒤로가기로 목록에 돌아온다).
 * - 모바일: 채널 목록 → 대화 화면(한 번에 하나). 상단바 제목이 채널 이름, 뒤로는 목록. 입력창은 탭바 위에 고정.
 * - 데스크톱: 왼쪽 채널 목록 + 오른쪽 대화 2단. `?channel=`이 없으면 클럽 채널을 연다.
 * 데모는 2초 재조회로 다른 탭의 메시지를 받는다(Supabase 전환 때 Realtime).
 */
export function ChatWidget() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const { isLoading: authLoading } = useAuth();
  const viewer = useChatViewer();
  const [channelParam] = useUrlState('channel');
  const { data: channels, isLoading, error, refetch } = useChatChannels(viewer);

  if (authLoading || isDesktop === null) return <CardSkeleton count={3} />;
  if (!viewer) {
    return (
      <EmptyState
        title="회원 연결 후 채팅할 수 있어요"
        description="운영진에게 받은 초대 코드로 회원을 연결해 주세요."
        action={
          <Button asChild>
            <Link href="/join">초대 코드 입력</Link>
          </Button>
        }
      />
    );
  }
  if (isLoading) return <CardSkeleton count={3} />;
  if (error || !channels) return <ErrorState title="채팅을 불러오지 못했어요" description={error?.message} onRetry={() => refetch()} />;

  const activeId = channelParam ?? (isDesktop ? CLUB_CHANNEL_ID : null);
  const active = activeId ? (channels.find((c) => c.channel.id === activeId)?.channel ?? null) : null;
  const missing = !!activeId && !active;

  if (isDesktop) {
    return (
      <div className="grid h-[calc(100dvh-52px-48px)] grid-cols-[300px_1fr] overflow-hidden rounded-2xl border border-border bg-background">
        <aside aria-label="채널" className="flex min-h-0 flex-col border-r border-border">
          <h1 className="px-4 pb-2 pt-4 text-lg font-semibold text-ink">채팅</h1>
          <ChannelList channels={channels} activeId={activeId} />
        </aside>
        <section aria-label="대화" className="flex min-h-0 flex-col">
          {missing ? <MissingChannel /> : active && <Conversation key={active.id} channel={active} isDesktop />}
        </section>
      </div>
    );
  }

  if (missing) return <MissingChannel />;
  if (active) return <Conversation key={active.id} channel={active} isDesktop={false} />;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessagesSquare className="h-6 w-6 text-brand-dark" aria-hidden />
        <h1 className="text-2xl font-semibold text-ink">채팅</h1>
      </div>
      <ChannelList channels={channels} activeId={null} />
    </div>
  );
}

function MissingChannel() {
  return (
    <EmptyState
      title="채널을 찾을 수 없어요"
      description="팀 채널은 그 팀원만 볼 수 있어요."
      action={
        <Button asChild variant="outline">
          <Link href="/chat">채널 목록</Link>
        </Button>
      }
    />
  );
}

function ChannelList({ channels, activeId }: { channels: ChatChannelSummary[]; activeId: string | null }) {
  const [, setChannel] = useUrlState('channel');
  const { data: members } = useMembers();
  const now = new Date();
  const nameOf = (id: string) => members?.find((m) => m.id === id)?.name ?? '';
  const teamCount = channels.filter((c) => c.channel.kind === 'team').length;

  const handleOpen = (id: string) => setChannel(id);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto md:px-2 md:pb-2">
      <ul aria-label="채널 목록" className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-background md:divide-y-0 md:rounded-none md:border-0">
        {channels.map(({ channel, unread, last_message: last }) => {
          const preview = last ? (last.deleted_at ? '삭제된 메시지' : `${nameOf(last.author_member_id)}: ${last.body}`) : '아직 메시지가 없어요';
          return (
            <li key={channel.id}>
              <button
                type="button"
                aria-current={channel.id === activeId ? 'page' : undefined}
                aria-label={`${channel.name}${unread > 0 ? `, 안 읽음 ${unread}` : ''}`}
                onClick={() => handleOpen(channel.id)}
                className={cn(
                  'flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:rounded-xl md:px-3',
                  channel.id === activeId && 'md:bg-accent',
                )}
              >
                <ChannelIcon channel={channel} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-semibold text-ink">{channel.name}</span>
                    {channel.subtitle && <span className="shrink-0 truncate text-xs text-ink-faint">{channel.subtitle}</span>}
                    {last && <span className="ml-auto shrink-0 text-xs tabular-nums text-ink-faint">{chatListTime(last.created_at, now, kstTimeOf)}</span>}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <span className={cn('truncate text-[13px]', unread > 0 ? 'font-medium text-ink' : 'text-ink-dim')}>{preview}</span>
                    {unread > 0 && (
                      <span aria-hidden className="ml-auto shrink-0 rounded-full bg-signal-red-fg px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
                        {unreadLabel(unread)}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {teamCount === 0 && <p className="px-4 pt-3 text-xs text-ink-faint">리그 팀이 정해지면(팀장·드래프트) 팀 채널이 자동으로 생겨요.</p>}
    </div>
  );
}

function ChannelIcon({ channel }: { channel: ChatChannel }) {
  if (channel.kind === 'club') {
    return (
      <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-brand-dark">
        <MessagesSquare className="h-5 w-5" />
      </span>
    );
  }
  return (
    <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: channel.color ?? '#64748b' }}>
      {channel.name.slice(0, 1)}
    </span>
  );
}

function Conversation({ channel, isDesktop }: { channel: ChatChannel; isDesktop: boolean }) {
  const viewer = useChatViewer();
  // 모바일 상단바: 채널 이름 + 뒤로 = 채널 목록. 데스크톱은 패널 머리글이 있어 셸 제목을 그대로 둔다
  usePageHeader(isDesktop ? {} : { title: channel.name, subtitle: channel.kind === 'club' ? '클럽 전체' : `${channel.subtitle ?? ''} · 팀원만`, backHref: '/chat' });
  const { data: members } = useMembers();
  const { messages, isLoading, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } = useChatMessages(viewer, channel.id);
  const markRead = useMarkChatRead(viewer);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevFirst = useRef<string | null>(null);
  const prevLast = useRef<string | null>(null);
  const heightBeforeOlder = useRef<number | null>(null);

  const lastId = messages.at(-1)?.id ?? null;
  const firstId = messages[0]?.id ?? null;
  const markReadMutate = markRead.mutate;

  // 열어 둔 채널은 새 메시지가 올 때마다 읽음으로 남긴다
  useEffect(() => {
    if (!isLoading) markReadMutate(channel.id);
  }, [channel.id, lastId, isLoading, markReadMutate]);

  /** 데스크톱은 대화 패널 안 스크롤, 모바일은 문서 스크롤(셸 스크롤 모델) */
  const scroller = () => {
    if (isDesktop) {
      const el = scrollRef.current;
      return el ? { height: el.scrollHeight, top: el.scrollTop, view: el.clientHeight, to: (y: number) => el.scrollTo({ top: y }) } : null;
    }
    const doc = document.documentElement;
    return { height: doc.scrollHeight, top: window.scrollY, view: window.innerHeight, to: (y: number) => window.scrollTo({ top: y }) };
  };

  useLayoutEffect(() => {
    const s = scroller();
    if (!s) return;
    // 이전 메시지를 붙였으면 보던 자리를 지킨다
    if (heightBeforeOlder.current !== null && firstId !== prevFirst.current) {
      s.to(s.top + (s.height - heightBeforeOlder.current));
      heightBeforeOlder.current = null;
    } else if (lastId !== prevLast.current) {
      // 처음 열 때, 내가 보냈을 때, 바닥 근처에서 보고 있을 때만 맨 아래로(위를 읽는 중이면 끌어내리지 않는다)
      const mine = messages.at(-1)?.author_member_id === viewer?.member_id;
      const nearBottom = s.height - (s.top + s.view) < 160;
      if (prevLast.current === null || mine || nearBottom) s.to(s.height);
    }
    prevFirst.current = firstId;
    prevLast.current = lastId;
  });

  const handleOlder = () => {
    heightBeforeOlder.current = scroller()?.height ?? null;
    void fetchNextPage();
  };

  const nameOf = (id: string) => members?.find((m) => m.id === id)?.name ?? '알 수 없음';
  const photoOf = (id: string) => members?.find((m) => m.id === id)?.profile_photo ?? null;

  return (
    <article aria-labelledby="chat-channel-title" className={cn('flex flex-col', isDesktop ? 'min-h-0 flex-1' : 'pb-[76px]')}>
      <header className={cn('flex items-center gap-2 border-b border-border bg-background', isDesktop ? 'h-14 shrink-0 px-5' : 'sr-only')}>
        <ChannelIcon channel={channel} />
        <div className="min-w-0">
          <h2 id="chat-channel-title" className="truncate text-base font-semibold text-ink">
            {channel.name}
          </h2>
          <p className="truncate text-xs text-ink-dim">{channel.kind === 'club' ? '클럽 전체' : `${channel.subtitle ?? ''} 팀 채널 · 팀원만`}</p>
        </div>
      </header>

      <div ref={scrollRef} className={cn(isDesktop && 'min-h-0 flex-1 overflow-y-auto px-5 py-3')}>
        {isLoading ? (
          <CardSkeleton count={2} />
        ) : error ? (
          <ErrorState title="메시지를 불러오지 못했어요" description={error.message} onRetry={() => refetch()} />
        ) : messages.length === 0 ? (
          <EmptyState title="첫 메시지를 남겨 보세요" description={channel.kind === 'club' ? '클럽 전체가 보는 채널이에요.' : '우리 팀만 보는 채널이에요.'} />
        ) : (
          <ol aria-label="메시지" className="space-y-1">
            {hasNextPage && (
              <li className="flex justify-center py-2">
                <Button variant="outline" size="sm" onClick={handleOlder} disabled={isFetchingNextPage}>
                  이전 메시지 더 보기
                </Button>
              </li>
            )}
            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const newDay = !prev || kstDateOf(prev.created_at) !== kstDateOf(m.created_at);
              return (
                <Fragment key={m.id}>
                  {newDay && (
                    <li aria-hidden className="py-3 text-center text-xs text-ink-faint">
                      {chatDayLabel(kstDateOf(m.created_at))}
                    </li>
                  )}
                  <MessageRow
                    message={m}
                    mine={m.author_member_id === viewer?.member_id}
                    continued={!newDay && isContinuation(prev, m)}
                    name={nameOf(m.author_member_id)}
                    photo={photoOf(m.author_member_id)}
                    replyTo={m.reply_to_id ? (messages.find((x) => x.id === m.reply_to_id) ?? null) : null}
                    replyAuthor={nameOf(messages.find((x) => x.id === m.reply_to_id)?.author_member_id ?? '')}
                  />
                </Fragment>
              );
            })}
          </ol>
        )}
      </div>

      <div
        className={cn(
          'border-t border-border bg-background/95 px-3 py-2 backdrop-blur',
          isDesktop ? 'shrink-0 px-5 py-3' : 'fixed inset-x-0 bottom-[calc(var(--tabbar-h)+1px+env(safe-area-inset-bottom))] z-30',
        )}
      >
        <ChatComposer channelId={channel.id} channelName={channel.name} />
      </div>
    </article>
  );
}

interface MessageRowProps {
  message: ChatMessage;
  mine: boolean;
  continued: boolean;
  name: string;
  photo: string | null;
  replyTo: ChatMessage | null;
  replyAuthor: string;
}

function MessageRow({ message: m, mine, continued, name, photo, replyTo, replyAuthor }: MessageRowProps) {
  const deleted = !!m.deleted_at;
  const time = kstTimeOf(m.created_at);
  return (
    <li aria-label={`${mine ? '나' : name} ${time}`} className={cn('flex gap-2', mine ? 'justify-end' : 'justify-start', !continued && 'pt-2')}>
      {!mine && <span className="w-8 shrink-0">{!continued && <MemberAvatar src={photo} alt={name} size="sm" />}</span>}
      <div className={cn('flex max-w-[78%] flex-col md:max-w-[60%]', mine ? 'items-end' : 'items-start')}>
        {!mine && !continued && <span className="mb-0.5 text-xs font-medium text-ink-dim">{name}</span>}
        <div className={cn('flex items-end gap-1.5', mine && 'flex-row-reverse')}>
          <div
            className={cn(
              'whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px] leading-6',
              deleted ? 'border border-dashed border-border bg-background italic text-ink-faint' : mine ? 'bg-primary text-primary-foreground' : 'bg-sunken text-ink',
            )}
          >
            {replyTo && !deleted && (
              <span className={cn('mb-1 block border-l-2 pl-2 text-xs', mine ? 'border-primary-foreground/50 opacity-80' : 'border-border text-ink-dim')}>
                {replyAuthor}: {replyTo.deleted_at ? '삭제된 메시지' : replyTo.body}
              </span>
            )}
            {deleted ? '삭제된 메시지예요' : m.body}
          </div>
          <time dateTime={m.created_at} className="shrink-0 text-[11px] tabular-nums text-ink-faint">
            {time}
          </time>
        </div>
      </div>
    </li>
  );
}
