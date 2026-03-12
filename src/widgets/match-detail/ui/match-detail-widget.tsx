"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useMatch, useUpdateMatch } from "@/entities/match/model/queries";
import { useMembers } from "@/entities/member/model/queries";
import { MemberAvatar } from "@/entities/member/ui/member-avatar";
import { GoalRecordDialog } from "@/features/match-record/ui/goal-record-dialog";
import { SaveRecordDialog } from "@/features/match-record/ui/save-record-dialog";
import { SubstitutionDialog } from "@/features/match-record/ui/substitution-dialog";
import { MatchStatistics } from "@/features/match-record/ui/match-statistics";
import { MVPSelectionDialog } from "@/features/match-record/ui/mvp-selection-dialog";
import { useAuth } from "@/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { PageHero } from "@/shared/ui/page-hero";
import { StatePanel } from "@/shared/ui/state-panel";
import { StatTile } from "@/shared/ui/stat-tile";
import { Separator } from "@/shared/ui/separator";
import { LoadingState } from "@/shared/ui/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Trophy,
  Calendar,
  Users,
  Target,
  Hand,
  ArrowLeftRight,
} from "lucide-react";
import type {
  GoalRecord,
  SubstitutionRecord,
  PlayerMatchRecord,
} from "@/shared/types/match";
import type { Member } from "@/shared/types/member";

interface MatchDetailWidgetProps {
  matchId: string;
}

export function MatchDetailWidget({ matchId }: MatchDetailWidgetProps) {
  const { isAdmin } = useAuth();
  const { data: match, isLoading } = useMatch(matchId);
  const { data: members } = useMembers();
  const { mutate: updateMatch } = useUpdateMatch();

  // Timer state
  const [timeInSeconds, setTimeInSeconds] = useState(10 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [initialTime, setInitialTime] = useState(10 * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Score state
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  // Dialog states
  const [goalDialogOpen, setGoalDialogOpen] = useState<{
    team: "A" | "B";
  } | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState<{
    team: "A" | "B";
  } | null>(null);
  const [substitutionDialogOpen, setSubstitutionDialogOpen] = useState<{
    team: "A" | "B";
  } | null>(null);
  const [mvpDialogOpen, setMvpDialogOpen] = useState(false);

  // Track if timer was manually started
  const timerStartedRef = useRef(false);

  // Initialize scores and timer from match data
  useEffect(() => {
    if (match) {
      setScoreA(match.team_a.score);
      setScoreB(match.team_b.score);

      if (
        match.status === "in_progress" &&
        match.start_time &&
        match.duration
      ) {
        const elapsed = Math.floor(
          (Date.now() - new Date(match.start_time).getTime()) / 1000,
        );
        const remaining = Math.max(0, match.duration - elapsed);
        setTimeInSeconds(remaining);
        setInitialTime(match.duration);
        if (remaining > 0 && !timerStartedRef.current) {
          timerStartedRef.current = true;
          setIsRunning(true);
        }
      } else if (match.duration) {
        setInitialTime(match.duration);
        setTimeInSeconds(match.duration);
      }

      if (match.status === "finished") {
        timerStartedRef.current = false;
        setIsRunning(false);
      }
    }
  }, [match]);

  const getCurrentMinute = () => {
    return Math.floor((initialTime - timeInSeconds) / 60);
  };

  const handleMatchStart = () => {
    if (!match) return;

    const startTime = new Date().toISOString();
    // Initialize player records for all team members
    const initializePlayerRecords = (
      memberIds: string[],
    ): PlayerMatchRecord[] => {
      return memberIds.map((id) => ({
        member_id: id,
        goals: 0,
        assists: 0,
        saves: 0,
        is_mvp: false,
      }));
    };

    // Start the timer immediately
    timerStartedRef.current = true;
    setIsRunning(true);

    updateMatch({
      id: matchId,
      data: {
        status: "in_progress",
        start_time: startTime,
        duration: initialTime,
        team_a: {
          ...match.team_a,
          score: scoreA,
          players:
            match.team_a.players?.length > 0
              ? match.team_a.players
              : initializePlayerRecords(match.team_a.member_ids),
          goals_detail: match.team_a.goals_detail || [],
          substitutions: match.team_a.substitutions || [],
        },
        team_b: {
          ...match.team_b,
          score: scoreB,
          players:
            match.team_b.players?.length > 0
              ? match.team_b.players
              : initializePlayerRecords(match.team_b.member_ids),
          goals_detail: match.team_b.goals_detail || [],
          substitutions: match.team_b.substitutions || [],
        },
      },
    });
  };

  const handleMatchPause = () => {
    setIsRunning(false);
  };

  const handleMatchFinish = useCallback(() => {
    if (!match) return;

    const endTime = new Date().toISOString();
    updateMatch({
      id: matchId,
      data: {
        status: "finished",
        end_time: endTime,
        team_a: { ...match.team_a, score: scoreA },
        team_b: { ...match.team_b, score: scoreB },
      },
    });
    setIsRunning(false);
  }, [match, matchId, scoreA, scoreB, updateMatch]);

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeInSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (match) {
              handleMatchFinish();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [handleMatchFinish, isRunning, match]);

  const handleReset = () => {
    if (!match || match.status === "in_progress") return;
    setIsRunning(false);
    setTimeInSeconds(initialTime);
  };

  const handleAddMinute = () => {
    if (!match || match.status !== "pending") return;
    const newTime = initialTime + 60;
    setInitialTime(newTime);
    setTimeInSeconds(newTime);
  };

  const handleSubtractMinute = () => {
    if (!match || match.status !== "pending" || initialTime <= 60) return;
    const newTime = initialTime - 60;
    setInitialTime(newTime);
    setTimeInSeconds(newTime);
  };

  const handleScoreChange = (team: "A" | "B", delta: number) => {
    if (!match || match.status === "finished") return;

    if (team === "A") {
      const newScore = Math.max(0, scoreA + delta);
      setScoreA(newScore);
      updateMatch({
        id: matchId,
        data: {
          team_a: { ...match.team_a, score: newScore },
        },
      });
      // Auto-open goal dialog when score increases
      if (delta > 0 && match.status === "in_progress") {
        setGoalDialogOpen({ team: "A" });
      }
    } else {
      const newScore = Math.max(0, scoreB + delta);
      setScoreB(newScore);
      updateMatch({
        id: matchId,
        data: {
          team_b: { ...match.team_b, score: newScore },
        },
      });
      // Auto-open goal dialog when score increases
      if (delta > 0 && match.status === "in_progress") {
        setGoalDialogOpen({ team: "B" });
      }
    }
  };

  const handleGoalSave = (
    team: "A" | "B",
    goal: Omit<GoalRecord, "timestamp">,
  ) => {
    if (!match) return;

    const teamData = team === "A" ? match.team_a : match.team_b;
    const newGoal: GoalRecord = {
      ...goal,
      timestamp: new Date().toISOString(),
    };

    // Update goals_detail
    const updatedGoalsDetail = [...(teamData.goals_detail || []), newGoal];

    // Update player records
    const updatedPlayers = (teamData.players || []).map((p) => {
      if (p.member_id === goal.scorer_id) {
        return { ...p, goals: p.goals + 1 };
      }
      if (goal.assist_id && p.member_id === goal.assist_id) {
        return { ...p, assists: p.assists + 1 };
      }
      return p;
    });

    // Don't update score here - it's already updated in handleScoreChange
    // Just save the goal details and player records
    updateMatch({
      id: matchId,
      data: {
        [team === "A" ? "team_a" : "team_b"]: {
          ...teamData,
          goals_detail: updatedGoalsDetail,
          players: updatedPlayers,
        },
      },
    });
  };

  const handleSaveSave = (team: "A" | "B", goalkeeperIds: string[]) => {
    if (!match) return;

    const teamData = team === "A" ? match.team_a : match.team_b;

    // Update player records - add 1 save to each selected goalkeeper
    const updatedPlayers = (teamData.players || []).map((p) => {
      if (goalkeeperIds.includes(p.member_id)) {
        return { ...p, saves: p.saves + 1 };
      }
      return p;
    });

    updateMatch({
      id: matchId,
      data: {
        [team === "A" ? "team_a" : "team_b"]: {
          ...teamData,
          players: updatedPlayers,
        },
      },
    });
  };

  const handleSubstitutionSave = (
    team: "A" | "B",
    substitution: Omit<SubstitutionRecord, "timestamp">,
  ) => {
    if (!match) return;

    const teamData = team === "A" ? match.team_a : match.team_b;
    const newSubstitution: SubstitutionRecord = {
      ...substitution,
      timestamp: new Date().toISOString(),
    };

    const updatedSubstitutions = [
      ...(teamData.substitutions || []),
      newSubstitution,
    ];

    updateMatch({
      id: matchId,
      data: {
        [team === "A" ? "team_a" : "team_b"]: {
          ...teamData,
          substitutions: updatedSubstitutions,
        },
      },
    });
  };

  const handleMVPSave = (
    teamAMvpId: string | null,
    teamBMvpId: string | null,
  ) => {
    if (!match) return;

    // Update Team A players
    const updatedTeamAPlayers = (match.team_a.players || []).map((p) => ({
      ...p,
      is_mvp: p.member_id === teamAMvpId,
    }));

    // Update Team B players
    const updatedTeamBPlayers = (match.team_b.players || []).map((p) => ({
      ...p,
      is_mvp: p.member_id === teamBMvpId,
    }));

    updateMatch({
      id: matchId,
      data: {
        team_a: {
          ...match.team_a,
          players: updatedTeamAPlayers,
        },
        team_b: {
          ...match.team_b,
          players: updatedTeamBPlayers,
        },
      },
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((initialTime - timeInSeconds) / initialTime) * 100;

  const getMembersByIds = (memberIds: string[]) => {
    if (!members) return [];
    return memberIds
      .map((id) => members.find((m) => m.id === id))
      .filter(Boolean) as Member[];
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px]">
        <LoadingState />
      </div>
    );
  }

  if (!match) {
    return (
      <StatePanel
        icon={<Trophy className="h-6 w-6" />}
        title="이 경기 정보를 불러올 수 없습니다"
        description="이미 정리되었거나 잘못된 링크일 수 있습니다. 경기 목록으로 돌아가 현재 기록된 경기를 다시 선택해주세요."
        action={
          <Button asChild variant="outline">
            <Link href="/matches">경기 목록으로</Link>
          </Button>
        }
      />
    );
  }

  const teamAMembers = getMembersByIds(match.team_a.member_ids);
  const teamBMembers = getMembersByIds(match.team_b.member_ids);
  const winner =
    match.status === "finished"
      ? scoreA > scoreB
        ? "A"
        : scoreB > scoreA
          ? "B"
          : "draw"
      : null;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Match Detail"
        title={format(new Date(match.date), "yyyy년 MM월 dd일 (EEEE)", {
          locale: ko,
        })}
        description={`${match.location} 경기의 타이머, 스코어, 교체, 상세 기록을 하나의 운영 화면에서 관리합니다.`}
        meta={
          <>
            {match.status === "pending" && (
              <Badge variant="secondary">대기</Badge>
            )}
            {match.status === "in_progress" && (
              <Badge variant="default">진행중</Badge>
            )}
            {match.status === "finished" && (
              <Badge variant="outline">종료</Badge>
            )}
            {winner && (
              <Badge variant="secondary">
                {winner === "draw" ? "무승부" : `Team ${winner} 승`}
              </Badge>
            )}
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          label="현재 스코어"
          value={`${scoreA} : ${scoreB}`}
          icon={<Trophy className="h-5 w-5" />}
        />
        <StatTile
          label="남은 시간"
          value={formatTime(timeInSeconds)}
          icon={<Calendar className="h-5 w-5" />}
          tone={match.status === "in_progress" ? "success" : "muted"}
        />
        <StatTile
          label="참가 인원"
          value={teamAMembers.length + teamBMembers.length}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <Card className="border-primary/15 bg-[linear-gradient(160deg,rgba(200,168,88,0.1),rgba(255,255,255,0.96))]">
        <CardContent className="grid gap-3 pt-6 md:grid-cols-4">
          <div className="rounded-2xl border bg-background/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              경기 상태
            </p>
            <p className="mt-3 text-base font-semibold">
              {match.status === "pending"
                ? "시작 전 준비"
                : match.status === "in_progress"
                  ? "실시간 운영 중"
                  : "기록 검토 단계"}
            </p>
          </div>
          <div className="rounded-2xl border bg-background/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              우선 액션
            </p>
            <p className="mt-3 text-base font-semibold">
              {match.status === "pending"
                ? "시간 설정 후 경기 시작"
                : match.status === "in_progress"
                  ? "스코어와 기록 입력"
                  : "저장된 기록 검토"}
            </p>
          </div>
          <div className="rounded-2xl border bg-background/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              전술 연동
            </p>
            <p className="mt-3 text-base font-semibold">
              팀별 전술 보드로 즉시 이동 가능
            </p>
          </div>
          <div className="rounded-2xl border bg-background/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              권한
            </p>
            <p className="mt-3 text-base font-semibold">
              {isAdmin ? "기록 수정 가능" : "기록 조회 전용"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Team Rosters - Moved above Timer for better accessibility */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team A */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Team A ({teamAMembers.length}명)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {teamAMembers.map((member: Member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-lg"
                >
                  <MemberAvatar
                    src={member.profile_photo}
                    alt={member.name}
                    size="sm"
                  />
                  <span className="text-sm font-medium">{member.name}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href={`/team-division/A`}>전술 보드</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Team B */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Team B ({teamBMembers.length}명)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {teamBMembers.map((member: Member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-lg"
                >
                  <MemberAvatar
                    src={member.profile_photo}
                    alt={member.name}
                    size="sm"
                  />
                  <span className="text-sm font-medium">{member.name}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href={`/team-division/B`}>전술 보드</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timer & Score */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">경기 타이머 & 스코어</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timer */}
          <div className="space-y-4">
            <div className="text-6xl font-bold text-center text-primary">
              {formatTime(timeInSeconds)}
            </div>

            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>

            {match.status === "pending" && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSubtractMinute}
                  disabled={!isAdmin || initialTime <= 60}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                  {Math.floor(initialTime / 60)}분 설정
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleAddMinute}
                  disabled={!isAdmin}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex gap-2 justify-center">
              {match.status === "pending" && (
                <Button
                  onClick={handleMatchStart}
                  size="lg"
                  className="flex-1 max-w-[200px]"
                  disabled={!isAdmin}
                >
                  <Play className="mr-2 h-5 w-5" />
                  경기 시작
                </Button>
              )}
              {match.status === "in_progress" && (
                <>
                  <Button
                    onClick={handleMatchPause}
                    size="lg"
                    className="flex-1 max-w-[200px]"
                    disabled={!isAdmin}
                  >
                    <Pause className="mr-2 h-5 w-5" />
                    일시정지
                  </Button>
                  <Button
                    onClick={handleMatchFinish}
                    size="lg"
                    variant="destructive"
                    className="flex-1 max-w-[200px]"
                    disabled={!isAdmin}
                  >
                    경기 종료
                  </Button>
                </>
              )}
              {match.status !== "finished" && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="lg"
                  disabled={!isAdmin}
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              )}
            </div>

            {!isAdmin && (
              <p className="text-center text-sm text-muted-foreground">
                실시간 경기 운영과 기록 수정은 관리자만 할 수 있습니다.
              </p>
            )}

            <div className="text-center text-sm text-muted-foreground">
              {timeInSeconds === 0 && "⏰ 경기 종료!"}
              {isRunning &&
                timeInSeconds > 0 &&
                `⚽ 경기 진행 중 (${getCurrentMinute()}분)`}
              {!isRunning &&
                timeInSeconds > 0 &&
                timeInSeconds < initialTime &&
                "⏸️ 일시정지"}
              {!isRunning &&
                timeInSeconds === initialTime &&
                match.status === "pending" &&
                "⏱️ 준비"}
            </div>
          </div>

          <Separator />

          {/* Score */}
          <div className="flex items-center justify-around">
            <div className="text-center flex-1">
              <p className="text-sm text-muted-foreground mb-2">Team A</p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleScoreChange("A", -1)}
                  disabled={
                    !isAdmin || match.status === "finished" || scoreA === 0
                  }
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="text-5xl font-bold text-primary w-20 text-center">
                  {scoreA}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleScoreChange("A", 1)}
                  disabled={!isAdmin || match.status === "finished"}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="text-3xl font-bold text-muted-foreground px-4">
              vs
            </div>

            <div className="text-center flex-1">
              <p className="text-sm text-muted-foreground mb-2">Team B</p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleScoreChange("B", -1)}
                  disabled={
                    !isAdmin || match.status === "finished" || scoreB === 0
                  }
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="text-5xl font-bold text-primary w-20 text-center">
                  {scoreB}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleScoreChange("B", 1)}
                  disabled={!isAdmin || match.status === "finished"}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Match Recording Buttons */}
          {match.status === "in_progress" && isAdmin && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-semibold text-center">경기 기록</p>
                <div className="grid grid-cols-2 gap-4">
                  {/* Team A Records */}
                  <div className="space-y-2">
                    <p className="text-xs text-center text-muted-foreground font-medium">
                      Team A
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setGoalDialogOpen({ team: "A" })}
                    >
                      <Target className="mr-2 h-4 w-4" />골 기록
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSaveDialogOpen({ team: "A" })}
                    >
                      <Hand className="mr-2 h-4 w-4" />
                      선방 기록
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSubstitutionDialogOpen({ team: "A" })}
                    >
                      <ArrowLeftRight className="mr-2 h-4 w-4" />
                      교체
                    </Button>
                  </div>

                  {/* Team B Records */}
                  <div className="space-y-2">
                    <p className="text-xs text-center text-muted-foreground font-medium">
                      Team B
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setGoalDialogOpen({ team: "B" })}
                    >
                      <Target className="mr-2 h-4 w-4" />골 기록
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSaveDialogOpen({ team: "B" })}
                    >
                      <Hand className="mr-2 h-4 w-4" />
                      선방 기록
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSubstitutionDialogOpen({ team: "B" })}
                    >
                      <ArrowLeftRight className="mr-2 h-4 w-4" />
                      교체
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Match Details - Goals, Saves, Substitutions */}
      {(match.team_a.goals_detail?.length > 0 ||
        match.team_b.goals_detail?.length > 0 ||
        match.team_a.substitutions?.length > 0 ||
        match.team_b.substitutions?.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>경기 상세 기록</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="goals">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="goals">골 기록</TabsTrigger>
                <TabsTrigger value="substitutions">교체 기록</TabsTrigger>
              </TabsList>

              <TabsContent value="goals" className="space-y-4 mt-4">
                {/* Team A Goals */}
                {match.team_a.goals_detail &&
                  match.team_a.goals_detail.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Team A 득점</h3>
                      <div className="space-y-2">
                        {match.team_a.goals_detail.map((goal, index) => {
                          const scorer = members?.find(
                            (m) => m.id === goal.scorer_id,
                          );
                          const assister = goal.assist_id
                            ? members?.find((m) => m.id === goal.assist_id)
                            : null;
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-blue-50 rounded"
                            >
                              <Badge variant="outline">{`${goal.minute}'`}</Badge>
                              <Target className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">
                                {scorer?.name || "알 수 없음"}
                              </span>
                              {assister && (
                                <>
                                  <span className="text-xs text-muted-foreground">
                                    →
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    어시스트: {assister.name}
                                  </span>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* Team B Goals */}
                {match.team_b.goals_detail &&
                  match.team_b.goals_detail.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Team B 득점</h3>
                      <div className="space-y-2">
                        {match.team_b.goals_detail.map((goal, index) => {
                          const scorer = members?.find(
                            (m) => m.id === goal.scorer_id,
                          );
                          const assister = goal.assist_id
                            ? members?.find((m) => m.id === goal.assist_id)
                            : null;
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-red-50 rounded"
                            >
                              <Badge variant="outline">{`${goal.minute}'`}</Badge>
                              <Target className="h-4 w-4 text-red-600" />
                              <span className="font-medium">
                                {scorer?.name || "알 수 없음"}
                              </span>
                              {assister && (
                                <>
                                  <span className="text-xs text-muted-foreground">
                                    →
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    어시스트: {assister.name}
                                  </span>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {!match.team_a.goals_detail?.length &&
                  !match.team_b.goals_detail?.length && (
                    <p className="text-center text-muted-foreground py-4">
                      골 기록이 없습니다
                    </p>
                  )}
              </TabsContent>

              <TabsContent value="substitutions" className="space-y-4 mt-4">
                {/* Team A Substitutions */}
                {match.team_a.substitutions &&
                  match.team_a.substitutions.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Team A 교체</h3>
                      <div className="space-y-2">
                        {match.team_a.substitutions.map((sub, index) => {
                          const playerOut = members?.find(
                            (m) => m.id === sub.player_out_id,
                          );
                          const playerIn = members?.find(
                            (m) => m.id === sub.player_in_id,
                          );
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-muted/50 rounded"
                            >
                              <Badge variant="outline">{`${sub.minute}'`}</Badge>
                              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                <span className="text-red-600">
                                  {playerOut?.name || "알 수 없음"}
                                </span>
                                {" → "}
                                <span className="text-green-600">
                                  {playerIn?.name || "알 수 없음"}
                                </span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* Team B Substitutions */}
                {match.team_b.substitutions &&
                  match.team_b.substitutions.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Team B 교체</h3>
                      <div className="space-y-2">
                        {match.team_b.substitutions.map((sub, index) => {
                          const playerOut = members?.find(
                            (m) => m.id === sub.player_out_id,
                          );
                          const playerIn = members?.find(
                            (m) => m.id === sub.player_in_id,
                          );
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-muted/50 rounded"
                            >
                              <Badge variant="outline">{`${sub.minute}'`}</Badge>
                              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                <span className="text-red-600">
                                  {playerOut?.name || "알 수 없음"}
                                </span>
                                {" → "}
                                <span className="text-green-600">
                                  {playerIn?.name || "알 수 없음"}
                                </span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {!match.team_a.substitutions?.length &&
                  !match.team_b.substitutions?.length && (
                    <p className="text-center text-muted-foreground py-4">
                      교체 기록이 없습니다
                    </p>
                  )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* MVP Selection Button */}
      {match.status === "finished" && isAdmin && (
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={() => setMvpDialogOpen(true)}
              size="lg"
              className="w-full"
              variant="default"
            >
              <Trophy className="mr-2 h-5 w-5" />
              MVP 선정하기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Player Statistics */}
      {match.status === "finished" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MatchStatistics
            teamName="Team A"
            teamMembers={teamAMembers}
            playerRecords={match.team_a.players || []}
          />
          <MatchStatistics
            teamName="Team B"
            teamMembers={teamBMembers}
            playerRecords={match.team_b.players || []}
          />
        </div>
      )}

      {/* Dialogs */}
      {goalDialogOpen && isAdmin && (
        <GoalRecordDialog
          isOpen={true}
          onClose={() => setGoalDialogOpen(null)}
          teamName={`Team ${goalDialogOpen.team}`}
          teamMembers={
            goalDialogOpen.team === "A" ? teamAMembers : teamBMembers
          }
          currentMinute={getCurrentMinute()}
          onSave={(goal) => handleGoalSave(goalDialogOpen.team, goal)}
        />
      )}

      {saveDialogOpen && isAdmin && (
        <SaveRecordDialog
          isOpen={true}
          onClose={() => setSaveDialogOpen(null)}
          teamName={`Team ${saveDialogOpen.team}`}
          teamMembers={
            saveDialogOpen.team === "A" ? teamAMembers : teamBMembers
          }
          currentMinute={getCurrentMinute()}
          onSave={(goalkeeperIds) =>
            handleSaveSave(saveDialogOpen.team, goalkeeperIds)
          }
        />
      )}

      {substitutionDialogOpen && isAdmin && (
        <SubstitutionDialog
          isOpen={true}
          onClose={() => setSubstitutionDialogOpen(null)}
          teamName={`Team ${substitutionDialogOpen.team}`}
          teamMembers={
            substitutionDialogOpen.team === "A" ? teamAMembers : teamBMembers
          }
          currentMinute={getCurrentMinute()}
          onSave={(substitution) =>
            handleSubstitutionSave(substitutionDialogOpen.team, substitution)
          }
        />
      )}

      {mvpDialogOpen && isAdmin && (
        <MVPSelectionDialog
          isOpen={true}
          onClose={() => setMvpDialogOpen(false)}
          teamAName="Team A"
          teamBName="Team B"
          teamAMembers={teamAMembers}
          teamBMembers={teamBMembers}
          teamARecords={match.team_a.players || []}
          teamBRecords={match.team_b.players || []}
          onSave={handleMVPSave}
        />
      )}
    </div>
  );
}
