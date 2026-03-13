"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ArrowRight, Calendar, MapPin, Trophy } from "lucide-react";
import type { Match } from "@/shared/types/match";

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const teamAScore = match.team_a.score;
  const teamBScore = match.team_b.score;
  const winner =
    teamAScore > teamBScore ? "A" : teamBScore > teamAScore ? "B" : "draw";

  return (
    <Card className="overflow-hidden border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,244,238,0.94))] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg">
              {format(new Date(match.date), "yyyy년 MM월 dd일 (EEE)", {
                locale: ko,
              })}
            </CardTitle>
          </div>
          {winner !== "draw" && (
            <Badge variant="default">
              <Trophy className="h-3 w-3 mr-1" />
              Team {winner} 승
            </Badge>
          )}
          {winner === "draw" && <Badge variant="secondary">무승부</Badge>}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {match.location}
        </div>

        <div className="rounded-[1.4rem] border bg-background/85 p-4">
          <div className="flex items-center justify-around">
            <div className="text-center flex-1">
              <p className="text-sm text-muted-foreground mb-1">Team A</p>
              <p className="text-3xl font-bold text-primary">{teamAScore}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {match.team_a.member_ids.length}명
              </p>
            </div>

            <div className="text-2xl font-bold text-muted-foreground px-4">
              vs
            </div>

            <div className="text-center flex-1">
              <p className="text-sm text-muted-foreground mb-1">Team B</p>
              <p className="text-3xl font-bold text-primary">{teamBScore}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {match.team_b.member_ids.length}명
              </p>
            </div>
          </div>
        </div>

        <Button
          asChild
          variant="outline"
          className="w-full rounded-full"
          size="sm"
        >
          <Link href={`/matches/${match.id}`}>
            상세 보기 <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
