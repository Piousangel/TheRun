'use client';

import { useMemo } from 'react';
import { format, isPast } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useVoteSession, useVoteResponses } from '@/entities/vote/model/queries';
import { useMembers } from '@/entities/member/model/queries';
import { VoteResponseButton } from '@/features/vote-response/ui/vote-response-button';
import { VoteDeleteButton } from '@/features/vote-delete/ui/vote-delete-button';
import { MemberAvatar } from '@/entities/member/ui/member-avatar';
import { useAuth } from '@/providers/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { PageHero } from '@/shared/ui/page-hero';
import { StatTile } from '@/shared/ui/stat-tile';
import { Separator } from '@/shared/ui/separator';
import { LoadingState } from '@/shared/ui/loading-spinner';
import { Calendar, Clock, Users, UserX } from 'lucide-react';

interface VoteDetailProps {
  sessionId: string;
}

const voteTypeIcons = {
  match: '⚽',
  dining: '🍴',
  outing: '🎉',
  other: '📌',
};

const voteTypeLabels = {
  match: '경기',
  dining: '회식',
  outing: '야유회',
  other: '기타',
};

export function VoteDetail({ sessionId }: VoteDetailProps) {
  const { isAdmin, member: currentMember, user } = useAuth();
  const { data: session, isLoading: sessionLoading } = useVoteSession(sessionId);
  const { data: responses, isLoading: responsesLoading } = useVoteResponses(sessionId);
  const { data: members } = useMembers();

  const isExpired = session ? isPast(new Date(session.deadline)) : false;
  const currentMemberVote = currentMember
    ? responses?.find((response) => response.member_id === currentMember.id)?.status ?? null
    : null;

  const { attending, absent, noResponse } = useMemo(() => {
    if (!responses || !members) {
      return { attending: [], absent: [], noResponse: members || [] };
    }

    const voteMap = new Map(responses.map((r) => [r.member_id, r.status]));

    const attending = members.filter((m) => voteMap.get(m.id) === 'attending');
    const absent = members.filter((m) => voteMap.get(m.id) === 'absent');
    const noResponse = members.filter((m) => !voteMap.has(m.id));

    return { attending, absent, noResponse };
  }, [responses, members]);

  if (sessionLoading || responsesLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <LoadingState />
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>투표를 찾을 수 없습니다</CardTitle>
          <CardDescription>존재하지 않거나 삭제된 투표입니다.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Vote Detail"
        title={session.title}
        description={session.description ?? '참석/불참 여부를 확인하고, 관리자라면 응답 현황을 기반으로 운영 결정을 빠르게 내릴 수 있습니다.'}
        meta={<>
          <Badge variant="outline">{voteTypeIcons[session.type]} {voteTypeLabels[session.type]}</Badge>
          {isExpired ? <Badge variant="destructive">마감</Badge> : <Badge variant="default">진행 중</Badge>}
        </>}
        actions={isAdmin ? (
          <VoteDeleteButton sessionId={session.id} sessionTitle={session.title} redirectAfterDelete={true} />
        ) : undefined}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile label="참석" value={attending.length} icon={<Users className="h-5 w-5" />} tone="success" />
        <StatTile label="불참" value={absent.length} icon={<UserX className="h-5 w-5" />} tone="danger" />
        <StatTile label="미응답" value={noResponse.length} icon={<Users className="h-5 w-5" />} tone="muted" />
      </div>

      <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            이벤트: {format(new Date(session.event_date), 'yyyy년 MM월 dd일 (EEE) HH:mm', { locale: ko })}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            마감: {format(new Date(session.deadline), 'MM월 dd일 (EEE) HH:mm', { locale: ko })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{attending.length}</p>
              <p className="text-xs text-muted-foreground">참석</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-2xl font-bold">{absent.length}</p>
              <p className="text-xs text-muted-foreground">불참</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{noResponse.length}</p>
              <p className="text-xs text-muted-foreground">미응답</p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="font-semibold">내 응답</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {user
                  ? currentMember
                    ? '내 계정에 연결된 멤버 기준으로 바로 응답할 수 있습니다.'
                    : '내 계정에서 멤버 연결을 먼저 완료하면 본인 응답 흐름을 사용할 수 있습니다.'
                  : '로그인 후 내 계정에서 멤버를 연결하면 본인 응답 흐름을 사용할 수 있습니다.'}
              </p>
            </div>
            {currentMember ? (
              <VoteResponseButton
                sessionId={session.id}
                member={currentMember}
                currentVote={currentMemberVote}
              />
            ) : null}
          </div>
        </div>

        {/* 참석자 목록 */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            참석 ({attending.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {attending.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 bg-blue-500/10 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <MemberAvatar src={member.profile_photo} alt={member.name} size="sm" />
                  <span className="text-sm font-medium">{member.name}</span>
                </div>
                {!isExpired && isAdmin && (
                  <VoteResponseButton
                    sessionId={session.id}
                    member={member}
                    currentVote="attending"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 불참자 목록 */}
        {absent.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <UserX className="h-4 w-4 text-destructive" />
              불참 ({absent.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {absent.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 bg-destructive/5 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <MemberAvatar src={member.profile_photo} alt={member.name} size="sm" />
                    <span className="text-sm font-medium">{member.name}</span>
                  </div>
                  {!isExpired && isAdmin && (
                    <VoteResponseButton
                      sessionId={session.id}
                      member={member}
                      currentVote="absent"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 미응답자 목록 */}
        {noResponse.length > 0 && !isExpired && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              미응답 ({noResponse.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {noResponse.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <MemberAvatar src={member.profile_photo} alt={member.name} size="sm" />
                    <span className="text-sm font-medium">{member.name}</span>
                  </div>
                  {isAdmin && (
                    <VoteResponseButton
                      sessionId={session.id}
                      member={member}
                      currentVote={null}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
