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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { LoadingState } from '@/shared/ui/loading-spinner';
import { Calendar, Clock, Users, UserX } from 'lucide-react';

export function AttendanceWidget() {
  const { data: session, isLoading: sessionLoading } = useCurrentAttendanceSession();
  const { data: votes, isLoading: votesLoading } = useAttendanceVotes(session?.id || '');
  const { data: members } = useMembers();

  const isExpired = session ? isPast(new Date(session.deadline)) : false;

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
            <Users className="h-5 w-5 text-primary" />
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

        {/* 참석자 목록 */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            참석 ({attending.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {attending.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 bg-primary/5 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <MemberAvatar src={member.profile_photo} alt={member.name} size="sm" />
                  <span className="text-sm font-medium">{member.name}</span>
                </div>
                {!isExpired && (
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
                  {!isExpired && (
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
                  <AttendanceVoteButton
                    sessionId={session.id}
                    member={member}
                    currentVote={null}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
