"use client";

import { useMemo } from "react";
import { format, isPast } from "date-fns";
import { ko } from "date-fns/locale";
import {
  useVoteSession,
  useVoteResponses,
} from "@/entities/vote/model/queries";
import { useMembers } from "@/entities/member/model/queries";
import { VoteResponseButton } from "@/features/vote-response/ui/vote-response-button";
import { VoteDeleteButton } from "@/features/vote-delete/ui/vote-delete-button";
import { MemberAvatar } from "@/entities/member/ui/member-avatar";
import { useAuth } from "@/providers/auth-provider";
import { usePageHeader } from "@/shared/lib/page-header/store";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { PageHero } from "@/shared/ui/page-hero";
import { StatePanel } from "@/shared/ui/state-panel";
import { StatTile } from "@/shared/ui/stat-tile";
import { Separator } from "@/shared/ui/separator";
import { LoadingState } from "@/shared/ui/loading-spinner";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Users,
  UserX,
  Vote,
} from "lucide-react";

interface VoteDetailProps {
  sessionId: string;
}

const voteTypeIcons = {
  match: "⚽",
  dining: "🍴",
  outing: "🎉",
  other: "📌",
};

const voteTypeLabels = {
  match: "경기",
  dining: "회식",
  outing: "야유회",
  other: "기타",
};

export function VoteDetail({ sessionId }: VoteDetailProps) {
  const { isAdmin, member: currentMember, user } = useAuth();
  const { data: session, isLoading: sessionLoading } =
    useVoteSession(sessionId);
  const { data: responses, isLoading: responsesLoading } =
    useVoteResponses(sessionId);
  const { data: members } = useMembers();
  usePageHeader({ title: session?.title });

  const isExpired = session ? isPast(new Date(session.deadline)) : false;
  const currentMemberVote = currentMember
    ? (responses?.find((response) => response.member_id === currentMember.id)
        ?.status ?? null)
    : null;

  const { attending, absent, noResponse } = useMemo(() => {
    if (!responses || !members) {
      return { attending: [], absent: [], noResponse: members || [] };
    }

    const voteMap = new Map(responses.map((r) => [r.member_id, r.status]));

    const attending = members.filter((m) => voteMap.get(m.id) === "attending");
    const absent = members.filter((m) => voteMap.get(m.id) === "absent");
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
      <StatePanel
        icon={<Vote className="h-6 w-6" />}
        title="이 투표를 불러올 수 없습니다"
        description="이미 종료 후 정리되었거나 삭제된 투표일 수 있습니다. 목록 화면으로 돌아가 현재 진행 중인 투표를 다시 확인해보세요."
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
        eyebrow="Vote Detail"
        title={session.title}
        description={
          session.description ??
          "참석/불참 여부를 확인하고, 관리자라면 응답 현황을 기반으로 운영 결정을 빠르게 내릴 수 있습니다."
        }
        meta={
          <>
            <Badge variant="outline">
              {voteTypeIcons[session.type]} {voteTypeLabels[session.type]}
            </Badge>
            {isExpired ? (
              <Badge variant="destructive">마감</Badge>
            ) : (
              <Badge variant="default">진행 중</Badge>
            )}
          </>
        }
        actions={
          isAdmin ? (
            <VoteDeleteButton
              sessionId={session.id}
              sessionTitle={session.title}
              redirectAfterDelete={true}
            />
          ) : undefined
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
                    응답 현황을 한 번에 확인합니다
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

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] border bg-background/80 p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Event time
                  </p>
                  <div className="mt-3 flex items-start gap-2 text-sm text-foreground">
                    <Calendar className="mt-0.5 h-4 w-4 text-primary" />
                    <span>
                      {format(
                        new Date(session.event_date),
                        "yyyy년 MM월 dd일 (EEE) HH:mm",
                        { locale: ko },
                      )}
                    </span>
                  </div>
                </div>
                <div className="rounded-[1.2rem] border bg-background/80 p-4">
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
            </div>

            <div className="rounded-[1.5rem] border bg-muted/25 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.26em] text-muted-foreground">
                    My response
                  </p>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight">
                    내 기준으로 바로 처리
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
                      ? "내 계정에 연결된 멤버 기준으로 바로 응답할 수 있습니다."
                      : "내 계정에서 멤버 연결을 먼저 완료하면 본인 응답 흐름을 사용할 수 있습니다."
                    : "로그인 후 내 계정에서 멤버를 연결하면 본인 응답 흐름을 사용할 수 있습니다."}
                </p>
              </div>

              {currentMember ? (
                <div className="mt-4">
                  <VoteResponseButton
                    sessionId={session.id}
                    member={currentMember}
                    currentVote={currentMemberVote}
                  />
                </div>
              ) : null}

              <div className="mt-4 rounded-[1.2rem] border border-dashed bg-background/70 p-4 text-sm text-muted-foreground">
                관리자는 아래 멤버 리스트에서 개별 응답을 바로 조정할 수 있고,
                멤버는 본인 응답만 간단히 처리하도록 분리했습니다.
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              이벤트:{" "}
              {format(
                new Date(session.event_date),
                "yyyy년 MM월 dd일 (EEE) HH:mm",
                { locale: ko },
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              마감:{" "}
              {format(new Date(session.deadline), "MM월 dd일 (EEE) HH:mm", {
                locale: ko,
              })}
            </div>
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
