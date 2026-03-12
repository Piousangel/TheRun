"use client";

import { useRouter } from "next/navigation";
import { useMatches } from "@/entities/match/model/queries";
import { useActiveVoteSessions } from "@/entities/vote/model/queries";
import { useTeamSplitStore } from "@/features/team-split-manual/model/store";
import { MatchCard } from "@/entities/match/ui/match-card";
import { MatchScheduleCard } from "@/features/match-schedule/ui/match-schedule-card";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { LoadingState } from "@/shared/ui/loading-spinner";
import { PageHero } from "@/shared/ui/page-hero";
import { StatePanel } from "@/shared/ui/state-panel";
import { StatTile } from "@/shared/ui/stat-tile";
import { Badge } from "@/shared/ui/badge";
import { Trophy, Users } from "lucide-react";

export function MatchesList() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { data: matches, isLoading, error } = useMatches();
  const { data: voteSessions, isLoading: isLoadingVotes } =
    useActiveVoteSessions();
  const { isTeamSelectionComplete, selectedVoteSessionId, teams, teamCount } =
    useTeamSplitStore();

  if (isLoading || isLoadingVotes) {
    return (
      <div className="min-h-[400px]">
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <StatePanel
        icon={<Trophy className="h-6 w-6" />}
        title="경기 허브를 불러오는 중 문제가 생겼습니다"
        description={`경기 목록이나 활성 투표 데이터를 읽는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요. (${error.message})`}
        tone="warning"
      />
    );
  }

  const matchVotes = voteSessions?.filter((s) => s.type === "match") || [];
  const selectedVoteSession = matchVotes.find(
    (v) => v.id === selectedVoteSessionId,
  );

  const TEAM_NAMES = ["A", "B", "C", "D"] as const;
  const activeTeams = TEAM_NAMES.slice(0, teamCount).filter(
    (t) => teams[t].length > 0,
  );
  const hasTeams = activeTeams.length >= 2;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Matches"
        title="경기 운영 허브"
        description="팀 구성부터 경기 생성, 기록 확인까지 한 주기 안에서 이어서 관리합니다."
        meta={
          <>
            <Badge variant="secondary">
              저장된 경기 {matches?.length ?? 0}개
            </Badge>
            <Badge variant="secondary">
              활성 경기 투표 {matchVotes.length}개
            </Badge>
            <Badge variant="secondary">
              운영 모드 {isAdmin ? "관리자" : "멤버 보기"}
            </Badge>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          label="저장 경기"
          value={matches?.length ?? 0}
          icon={<Trophy className="h-5 w-5" />}
        />
        <StatTile
          label="활성 팀 수"
          value={activeTeams.length}
          icon={<Users className="h-5 w-5" />}
          tone={activeTeams.length >= 2 ? "success" : "muted"}
        />
        <StatTile
          label="팀 선택 완료"
          value={isTeamSelectionComplete ? "READY" : "PENDING"}
          icon={<Users className="h-5 w-5" />}
          tone={isTeamSelectionComplete ? "success" : "danger"}
        />
      </div>

      {/* Team Selection Required Message */}
      {isAdmin && !isTeamSelectionComplete && (
        <Card className="border-2 border-primary/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Users className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  팀 나누기를 먼저 완료해주세요
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  &quot;팀 나누기&quot; 탭에서 팀을 구성하고 &quot;팀 선택
                  완료하기&quot; 버튼을 눌러주세요.
                </p>
              </div>
              <Button onClick={() => router.push("/team-division")}>
                팀 나누기로 이동
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match Schedule - Only show if team selection is complete */}
      {isAdmin && isTeamSelectionComplete && hasTeams && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">경기 스케줄</h3>
          </div>
          <MatchScheduleCard voteSession={selectedVoteSession} />
        </div>
      )}

      {/* Past Matches */}
      {matches && matches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">지난 경기 기록</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {!isAdmin && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            팀 편성, 경기 생성, 실시간 운영은 관리자 화면에서 진행됩니다. 일반
            멤버는 지난 경기 결과와 상세 기록을 확인할 수 있습니다.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
