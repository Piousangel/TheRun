"use client";

import { useMemo, type ReactNode } from "react";
import { format, isPast } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { useVoteResponses } from "@/entities/vote/model/queries";
import { useMembers } from "@/entities/member/model/queries";
import { ArrowRight, Calendar, Clock, Users, UserX } from "lucide-react";
import type { VoteSession } from "@/shared/types/vote";

interface VoteCardProps {
  session: VoteSession;
  onVoteClick: () => void;
  actions?: ReactNode;
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

export function VoteCard({ session, onVoteClick, actions }: VoteCardProps) {
  const { data: responses } = useVoteResponses(session.id);
  const { data: members } = useMembers();

  const isExpired = isPast(new Date(session.deadline));

  const { attending, absent, noResponse } = useMemo(() => {
    if (!responses || !members) {
      return { attending: 0, absent: 0, noResponse: members?.length || 0 };
    }

    const attending = responses.filter((r) => r.status === "attending").length;
    const absent = responses.filter((r) => r.status === "absent").length;
    const noResponse = members.length - attending - absent;

    return { attending, absent, noResponse };
  }, [responses, members]);

  return (
    <Card className="overflow-hidden border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,244,238,0.94))] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{voteTypeIcons[session.type]}</span>
              <Badge variant="outline">{voteTypeLabels[session.type]}</Badge>
              {isExpired ? (
                <Badge variant="destructive">마감</Badge>
              ) : (
                <Badge variant="default">진행 중</Badge>
              )}
            </div>
            <CardTitle>{session.title}</CardTitle>
            {session.description && (
              <CardDescription className="mt-1">
                {session.description}
              </CardDescription>
            )}
          </div>
          {actions}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2 text-sm">
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

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-blue-200/60 bg-blue-500/10 p-3">
            <Users className="h-4 w-4 text-blue-500" />
            <p className="mt-2 text-lg font-bold">{attending}</p>
            <p className="text-xs text-muted-foreground">참석</p>
          </div>
          <div className="rounded-xl border border-destructive/15 bg-destructive/10 p-3">
            <UserX className="h-4 w-4 text-destructive" />
            <p className="mt-2 text-lg font-bold">{absent}</p>
            <p className="text-xs text-muted-foreground">불참</p>
          </div>
          <div className="rounded-xl border bg-background/80 p-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="mt-2 text-lg font-bold">{noResponse}</p>
            <p className="text-xs text-muted-foreground">미응답</p>
          </div>
        </div>

        <Button
          onClick={onVoteClick}
          className="w-full rounded-full"
          variant={isExpired ? "outline" : "default"}
        >
          {isExpired ? "결과 보기" : "투표하기"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
