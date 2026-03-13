"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { MatchGameCardEnhanced } from "./match-game-card-enhanced";
import { ArrowRight, Calendar, Plus, Sparkles } from "lucide-react";
import type { VoteSession } from "@/shared/types/vote";

interface MatchScheduleCardProps {
  voteSession?: VoteSession;
}

export function MatchScheduleCard({ voteSession }: MatchScheduleCardProps) {
  const [matchCount, setMatchCount] = useState(1);

  const handleAddMatch = () => {
    setMatchCount((prev) => prev + 1);
  };

  const handleDeleteMatch = () => {
    setMatchCount((prev) => Math.max(1, prev - 1));
  };

  const today = new Date().toISOString();
  const title = voteSession?.title || "일반 경기";
  const description = voteSession?.description;
  const eventDate = voteSession?.event_date || today;
  const voteSessionId = voteSession?.id || null;

  return (
    <Card className="overflow-hidden border-primary/15 bg-[radial-gradient(circle_at_top,rgba(200,168,88,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,244,237,0.96))] shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            {description && (
              <p className="text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">
              {new Date(eventDate).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Badge>
            <Badge variant="secondary">경기 {matchCount}개</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border bg-background/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Event
            </p>
            <p className="mt-3 text-base font-semibold">{title}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              경기 생성 흐름과 팀 구성이 이 카드 안에서 이어집니다.
            </p>
          </div>
          <div className="rounded-2xl border bg-background/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Schedule
            </p>
            <p className="mt-3 text-base font-semibold">
              {new Date(eventDate).toLocaleDateString("ko-KR")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              각 경기는 아래 카드에서 개별 팀/전술 흐름으로 연결됩니다.
            </p>
          </div>
          <div className="rounded-2xl border bg-[linear-gradient(160deg,rgba(200,168,88,0.08),rgba(255,255,255,0.98))] p-4">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <p className="text-xs font-medium uppercase tracking-[0.18em]">
                Flow
              </p>
            </div>
            <p className="mt-3 text-base font-semibold">
              Split → Strategy → Match
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              팀 구성과 전략을 정리한 뒤 실제 경기 운영으로 자연스럽게
              이어갑니다.
            </p>
          </div>
        </div>

        {/* Match Games */}
        <div className="space-y-4">
          {Array.from({ length: matchCount }, (_, i) => (
            <MatchGameCardEnhanced
              key={i}
              matchNumber={i + 1}
              voteSessionId={voteSessionId || ""}
              eventDate={eventDate}
              onDelete={matchCount > 1 ? handleDeleteMatch : undefined}
            />
          ))}
        </div>

        {/* Add Match Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleAddMatch}
            className="w-full rounded-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            경기 추가
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
