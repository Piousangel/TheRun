"use client";

import { useMemo } from "react";
import { format, isPast } from "date-fns";
import { ko } from "date-fns/locale";
import {
  useCurrentAttendanceSession,
  useAttendanceVotes,
} from "@/entities/attendance/model/queries";
import { useMembers } from "@/entities/member/model/queries";
import { AttendanceVoteButton } from "@/features/attendance-vote/ui/attendance-vote-button";
import { MemberAvatar } from "@/entities/member/ui/member-avatar";
import { useAuth } from "@/providers/auth-provider";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { PageHero } from "@/shared/ui/page-hero";
import { StatePanel } from "@/shared/ui/state-panel";
import { StatTile } from "@/shared/ui/stat-tile";
import { Separator } from "@/shared/ui/separator";
import { LoadingState } from "@/shared/ui/loading-spinner";
import { CheckCircle2, Clock, Users, UserX } from "lucide-react";

export function AttendanceWidget() {
  const { isAdmin, member: currentMember, user } = useAuth();
  const { data: session, isLoading: sessionLoading } =
    useCurrentAttendanceSession();
  const { data: votes, isLoading: votesLoading } = useAttendanceVotes(
    session?.id || "",
  );
  const { data: members } = useMembers();

  const isExpired = session ? isPast(new Date(session.deadline)) : false;
  const currentMemberVote = currentMember
    ? (votes?.find((vote) => vote.member_id === currentMember.id)?.status ??
      null)
    : null;

  const { attending, absent, noResponse } = useMemo(() => {
    if (!votes || !members) {
      return { attending: [], absent: [], noResponse: members || [] };
    }

    const voteMap = new Map(votes.map((v) => [v.member_id, v.status]));

    const attending = members.filter((m) => voteMap.get(m.id) === "attending");
    const absent = members.filter((m) => voteMap.get(m.id) === "absent");
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
      <StatePanel
        icon={<Clock className="h-6 w-6" />}
        title="열려 있는 출석 보드가 없습니다"
        description={
          isAdmin
            ? "경기일이 정해졌다면 출석 세션을 먼저 열어 멤버가 참석 여부를 남길 수 있게 해주세요."
            : "운영진이 출석 세션을 열면 이곳에서 바로 응답하고 현재 인원도 함께 확인할 수 있습니다."
        }
      />
    );
  }

  const responseSummary = [
    {
      label: "참석",
      value: attending.length,
      icon: <Users className="h-4 w-4 text-blue-500" />,
      tone: "bg-blue-500/10 text-blue-700 border-blue-200/70",
    },
    {
      label: "불참",
      value: absent.length,
      icon: <UserX className="h-4 w-4 text-destructive" />,
      tone: "bg-destructive/5 text-destructive border-destructive/15",
    },
    {
      label: "미응답",
      value: noResponse.length,
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
      tone: "bg-muted/60 text-foreground border-border",
    },
  ];

  const myResponseLabel =
    currentMemberVote === "attending"
      ? "참석으로 응답 완료"
      : currentMemberVote === "absent"
        ? "불참으로 응답 완료"
        : "아직 응답하지 않음";

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Attendance"
        title="출석 응답 보드"
        description={`경기일: ${format(new Date(session.match_date), "yyyy년 MM월 dd일 (EEE)", { locale: ko })}`}
        meta={
          <>
            {isExpired ? (
              <Badge variant="destructive">마감</Badge>
            ) : (
              <Badge variant="default">진행 중</Badge>
            )}
            <Badge variant="secondary">
              마감{" "}
              {format(new Date(session.deadline), "MM월 dd일 (EEE) HH:mm", {
                locale: ko,
              })}
            </Badge>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          label="참석"
          value={attending.length}
          icon={<Users className="h-5 w-5" />}
          tone="success"
        />
        <StatTile
          label="불참"
          value={absent.length}
          icon={<UserX className="h-5 w-5" />}
          tone="danger"
        />
        <StatTile
          label="미응답"
          value={noResponse.length}
          icon={<Users className="h-5 w-5" />}
          tone="muted"
        />
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="rounded-[1.5rem] border border-primary/12 bg-[linear-gradient(160deg,rgba(200,168,88,0.08),rgba(255,255,255,0.98))] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.26em] text-primary/80">
                    Session overview
                  </p>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight">
                    이번 주 출석 상태를 빠르게 읽습니다
                  </h3>
                </div>
                <div className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
                  {isExpired ? "Closed" : "Live"}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {responseSummary.map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-[1.25rem] border px-4 py-4 ${item.tone}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.icon}
                    </div>
                    <p className="mt-4 text-3xl font-semibold tracking-tight">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[1.2rem] border bg-background/80 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Deadline
                </p>
                <div className="mt-3 flex items-start gap-2 text-sm text-foreground">
                  <Clock className="mt-0.5 h-4 w-4 text-primary" />
                  <span>
                    {format(
                      new Date(session.deadline),
                      "MM월 dd일 (EEE) HH:mm",
                      { locale: ko },
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border bg-muted/25 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.26em] text-muted-foreground">
                    My attendance
                  </p>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight">
                    내 기준으로 빠르게 응답
                  </h3>
                </div>
                {currentMemberVote ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : null}
              </div>

              <div className="mt-5 rounded-[1.2rem] border bg-background px-4 py-4">
                <p className="text-sm font-medium text-foreground">
                  {myResponseLabel}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {user
                    ? currentMember
                      ? "내 계정에 연결된 멤버 기준으로 이번 주 출석을 바로 표시할 수 있습니다."
                      : "내 계정에서 멤버 연결을 완료하면 본인 출석 응답이 활성화됩니다."
                    : "로그인 후 내 계정에서 멤버를 연결하면 본인 출석 응답이 활성화됩니다."}
                </p>
              </div>

              {currentMember ? (
                <div className="mt-4">
                  <AttendanceVoteButton
                    sessionId={session.id}
                    member={currentMember}
                    currentVote={currentMemberVote}
                  />
                </div>
              ) : null}

              <div className="mt-4 rounded-[1.2rem] border border-dashed bg-background/70 p-4 text-sm text-muted-foreground">
                관리자는 아래 멤버 리스트에서 응답을 정리하고, 멤버는 본인 출석
                여부만 빠르게 처리할 수 있도록 분리했습니다.
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            마감:{" "}
            {format(new Date(session.deadline), "MM월 dd일 (EEE) HH:mm", {
              locale: ko,
            })}
          </div>

          {/* 참석자 목록 */}
          <div>
            <h4 className="mb-3 flex items-center gap-2 font-semibold">
              <Users className="h-4 w-4 text-blue-500" />
              참석 ({attending.length})
            </h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {attending.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-[1rem] border border-blue-200/60 bg-blue-500/10 p-3"
                >
                  <div className="flex items-center gap-2">
                    <MemberAvatar
                      src={member.profile_photo}
                      alt={member.name}
                      size="sm"
                    />
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
              <h4 className="mb-3 flex items-center gap-2 font-semibold">
                <UserX className="h-4 w-4 text-destructive" />
                불참 ({absent.length})
              </h4>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {absent.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-[1rem] border border-destructive/10 bg-destructive/5 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <MemberAvatar
                        src={member.profile_photo}
                        alt={member.name}
                        size="sm"
                      />
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
              <h4 className="mb-3 flex items-center gap-2 font-semibold">
                <Users className="h-4 w-4 text-muted-foreground" />
                미응답 ({noResponse.length})
              </h4>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {noResponse.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-[1rem] border bg-muted/50 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <MemberAvatar
                        src={member.profile_photo}
                        alt={member.name}
                        size="sm"
                      />
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
    </div>
  );
}
