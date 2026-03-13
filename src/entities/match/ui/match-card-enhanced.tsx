"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useUpdateMatch } from "@/entities/match/model/queries";
import { useAuth } from "@/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import {
  Trophy,
  MapPin,
  Calendar,
  Play,
  Pause,
  Square,
  Plus,
  Minus,
  ChevronRight,
} from "lucide-react";
import type { Match } from "@/shared/types/match";

interface MatchCardEnhancedProps {
  match: Match;
}

export function MatchCardEnhanced({ match }: MatchCardEnhancedProps) {
  const { isAdmin } = useAuth();
  const { mutate: updateMatch } = useUpdateMatch();

  // Timer state
  const [timeInSeconds, setTimeInSeconds] = useState(10 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [initialTime] = useState(10 * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Score state
  const [scoreA, setScoreA] = useState(match.team_a.score);
  const [scoreB, setScoreB] = useState(match.team_b.score);

  // Initialize from match data
  useEffect(() => {
    setScoreA(match.team_a.score);
    setScoreB(match.team_b.score);

    if (match.status === "in_progress" && match.start_time && match.duration) {
      const elapsed = Math.floor(
        (Date.now() - new Date(match.start_time).getTime()) / 1000,
      );
      const remaining = Math.max(0, match.duration - elapsed);
      setTimeInSeconds(remaining);
      if (remaining > 0) {
        setIsRunning(true);
      }
    } else if (match.duration) {
      setTimeInSeconds(match.duration);
    }
  }, [match]);

  const handleMatchStart = () => {
    const startTime = new Date().toISOString();
    updateMatch({
      id: match.id,
      data: {
        status: "in_progress",
        start_time: startTime,
        duration: initialTime,
        team_a: { ...match.team_a, score: scoreA },
        team_b: { ...match.team_b, score: scoreB },
      },
    });
    setIsRunning(true);
  };

  const handleMatchPause = () => {
    setIsRunning(false);
  };

  const handleMatchFinish = useCallback(() => {
    const endTime = new Date().toISOString();
    updateMatch({
      id: match.id,
      data: {
        status: "finished",
        end_time: endTime,
        team_a: { ...match.team_a, score: scoreA },
        team_b: { ...match.team_b, score: scoreB },
      },
    });
    setIsRunning(false);
  }, [match.id, match.team_a, match.team_b, scoreA, scoreB, updateMatch]);

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeInSeconds((prev) => {
          if (prev <= 0) {
            setIsRunning(false);
            handleMatchFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [handleMatchFinish, isRunning]);

  const handleScoreChange = (team: "A" | "B", delta: number) => {
    if (match.status === "finished") return;

    if (team === "A") {
      const newScore = Math.max(0, scoreA + delta);
      setScoreA(newScore);
      updateMatch({
        id: match.id,
        data: {
          team_a: { ...match.team_a, score: newScore },
        },
      });
    } else {
      const newScore = Math.max(0, scoreB + delta);
      setScoreB(newScore);
      updateMatch({
        id: match.id,
        data: {
          team_b: { ...match.team_b, score: newScore },
        },
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const winner =
    match.status === "finished"
      ? scoreA > scoreB
        ? "A"
        : scoreB > scoreA
          ? "B"
          : "draw"
      : null;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">
              {format(new Date(match.date), "yyyy년 MM월 dd일 (EEE)", {
                locale: ko,
              })}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            {match.status === "pending" && (
              <Badge variant="secondary">대기</Badge>
            )}
            {match.status === "in_progress" && (
              <Badge variant="default">진행중</Badge>
            )}
            {match.status === "finished" && winner && (
              <Badge variant="default">
                <Trophy className="h-3 w-3 mr-1" />
                {winner === "draw" ? "무승부" : `Team ${winner} 승`}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {match.location}
        </div>

        {/* Timer (only show when pending or in progress) */}
        {match.status !== "finished" && (
          <>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {formatTime(timeInSeconds)}
              </div>
              <div className="text-xs text-muted-foreground">
                {isRunning && "⚽ 경기 진행 중"}
                {!isRunning && match.status === "pending" && "⏱️ 경기 대기"}
                {!isRunning && match.status === "in_progress" && "⏸️ 일시정지"}
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              {match.status === "pending" && (
                <Button
                  onClick={handleMatchStart}
                  size="sm"
                  className="flex-1"
                  disabled={!isAdmin}
                >
                  <Play className="mr-2 h-4 w-4" />
                  경기 시작
                </Button>
              )}
              {match.status === "in_progress" && (
                <>
                  <Button
                    onClick={handleMatchPause}
                    size="sm"
                    variant="outline"
                    disabled={!isAdmin}
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleMatchFinish}
                    size="sm"
                    variant="destructive"
                    disabled={!isAdmin}
                  >
                    <Square className="mr-2 h-4 w-4" />
                    종료
                  </Button>
                </>
              )}
            </div>

            <Separator />
          </>
        )}

        {/* Score Board */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4">
          <div className="text-center mb-2">
            <p className="text-xs font-medium text-muted-foreground">
              경기 스코어
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            {/* Team A Score */}
            <div className="text-center flex-1 max-w-[140px]">
              <p className="text-xs font-semibold mb-1">Team A</p>
              <p className="text-[10px] text-muted-foreground mb-2">
                ({match.team_a.member_ids.length}명)
              </p>
              <div className="flex items-center justify-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 rounded-full shrink-0"
                  onClick={() => handleScoreChange("A", -1)}
                  disabled={
                    !isAdmin || match.status === "finished" || scoreA === 0
                  }
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <div className="bg-background rounded-lg px-3 py-2 min-w-[50px] shadow-sm border-2 border-primary/20">
                  <div className="text-3xl font-bold text-primary">
                    {scoreA}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 rounded-full shrink-0"
                  onClick={() => handleScoreChange("A", 1)}
                  disabled={!isAdmin || match.status === "finished"}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* VS Divider */}
            <div className="text-lg font-bold text-muted-foreground px-1">
              VS
            </div>

            {/* Team B Score */}
            <div className="text-center flex-1 max-w-[140px]">
              <p className="text-xs font-semibold mb-1">Team B</p>
              <p className="text-[10px] text-muted-foreground mb-2">
                ({match.team_b.member_ids.length}명)
              </p>
              <div className="flex items-center justify-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 rounded-full shrink-0"
                  onClick={() => handleScoreChange("B", -1)}
                  disabled={
                    !isAdmin || match.status === "finished" || scoreB === 0
                  }
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <div className="bg-background rounded-lg px-3 py-2 min-w-[50px] shadow-sm border-2 border-primary/20">
                  <div className="text-3xl font-bold text-primary">
                    {scoreB}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 rounded-full shrink-0"
                  onClick={() => handleScoreChange("B", 1)}
                  disabled={!isAdmin || match.status === "finished"}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Board Link */}
        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={`/strategy?team=A&from=match`}>
              Team A 전술
              <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={`/strategy?team=B&from=match`}>
              Team B 전술
              <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>

        {!isAdmin && match.status !== "finished" && (
          <p className="text-center text-xs text-muted-foreground">
            실시간 경기 운영은 관리자 계정에서만 가능합니다.
          </p>
        )}

        <Button asChild variant="ghost" className="w-full" size="sm">
          <Link href={`/matches/${match.id}`}>
            상세 보기
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
