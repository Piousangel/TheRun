'use client';

import { useMemo } from 'react';
import { format, isPast } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  useCurrentAttendanceSession,
  useAttendanceVotes,
} from '@/entities/attendance/model/queries';
import { useMembers } from '@/entities/member/model/queries';
import { AttendanceVoteButton } from '@/features/attendance-vote/ui/attendance-vote-button';
import { MemberAvatar } from '@/entities/member/ui/member-avatar';
import { useAuth } from '@/providers/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { LoadingState } from '@/shared/ui/loading-spinner';
import { Calendar, Clock, Users, UserX } from 'lucide-react';

export function AttendanceWidget() {
  const { isAdmin, member: currentMember, user } = useAuth();
  const { data: session, isLoading: sessionLoading } = useCurrentAttendanceSession();
  const { data: votes, isLoading: votesLoading } = useAttendanceVotes(session?.id || '');
  const { data: members } = useMembers();

  const isExpired = session ? isPast(new Date(session.deadline)) : false;
  const currentMemberVote = currentMember
    ? votes?.find((vote) => vote.member_id === currentMember.id)?.status ?? null
    : null;

  const { attending, absent, noResponse } = useMemo(() => {
    if (!votes || !members) {
      return { attending: [], absent: [], noResponse: members || [] };
    }

    const voteMap = new Map(votes.map((v) => [v.member_id, v.status]));

    const attending = members.filter((m) => voteMap.get(m.id) === 'attending');
    const absent = members.filter((m) => voteMap.get(m.id) === 'absent');
    const noResponse = members.filter((m) => !voteMap.has(m.id));

    return { attending, absent, noResponse };
  }, [votes, members]);

  if (sessionLoading || votesLoading) {
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
          <CardTitle>출석 투표</CardTitle>
          <CardDescription>현재 진행 중인 출석 투표가 없습니다.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              출석 투표
            </CardTitle>
            <CardDescription className="mt-2">
              경기일: {format(new Date(session.match_date), 'yyyy년 MM월 dd일 (EEE)', { locale: ko })}
            </CardDescription>
          </div>
          {isExpired ? (
            <Badge variant="destructive">마감</Badge>
          ) : (
            <Badge variant="default">진행 중</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          마감: {format(new Date(session.deadline), 'MM월 dd일 (EEE) HH:mm', { locale: ko })}
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
                    ? '내 계정에 연결된 멤버 기준으로 이번 주 출석을 바로 표시할 수 있습니다.'
                    : '내 계정에서 멤버 연결을 완료하면 본인 출석 응답이 활성화됩니다.'
                  : '로그인 후 내 계정에서 멤버를 연결하면 본인 출석 응답이 활성화됩니다.'}
              </p>
            </div>
            {currentMember ? (
              <AttendanceVoteButton
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
                  <AttendanceVoteButton
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
                    <AttendanceVoteButton
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
                    <AttendanceVoteButton
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
  );
}
