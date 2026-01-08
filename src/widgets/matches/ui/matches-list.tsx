'use client';

import { useRouter } from 'next/navigation';
import { useMatches } from '@/entities/match/model/queries';
import { useActiveVoteSessions } from '@/entities/vote/model/queries';
import { useTeamSplitStore } from '@/features/team-split-manual/model/store';
import { MatchCard } from '@/entities/match/ui/match-card';
import { MatchScheduleCard } from '@/features/match-schedule/ui/match-schedule-card';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { LoadingState } from '@/shared/ui/loading-spinner';
import { Plus, Users } from 'lucide-react';

export function MatchesList() {
  const router = useRouter();
  const { data: matches, isLoading, error } = useMatches();
  const { data: voteSessions, isLoading: isLoadingVotes } = useActiveVoteSessions();
  const { isTeamSelectionComplete, selectedVoteSessionId, teams, teamCount } = useTeamSplitStore();

  if (isLoading || isLoadingVotes) {
    return (
      <div className="min-h-[400px]">
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-destructive">오류가 발생했습니다: {error.message}</p>
      </div>
    );
  }

  const matchVotes = voteSessions?.filter(s => s.type === 'match') || [];
  const selectedVoteSession = matchVotes.find(v => v.id === selectedVoteSessionId);

  const TEAM_NAMES = ['A', 'B', 'C', 'D'] as const;
  const activeTeams = TEAM_NAMES.slice(0, teamCount).filter(t => teams[t].length > 0);
  const hasTeams = activeTeams.length >= 2;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">경기</h2>
          <p className="text-sm text-muted-foreground mt-1">
            팀을 나눈 후 경기를 시작하세요
          </p>
        </div>
      </div>

      {/* Team Selection Required Message */}
      {!isTeamSelectionComplete && (
        <Card className="border-2 border-primary/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Users className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">팀 나누기를 먼저 완료해주세요</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  "팀 나누기" 탭에서 팀을 구성하고 "팀 선택 완료하기" 버튼을 눌러주세요.
                </p>
              </div>
              <Button onClick={() => router.push('/team-division')}>
                팀 나누기로 이동
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match Schedule - Only show if team selection is complete */}
      {isTeamSelectionComplete && hasTeams && selectedVoteSession && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">일정별 경기</h3>
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
    </div>
  );
}
