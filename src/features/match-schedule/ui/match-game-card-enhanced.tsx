'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { useTeamSplitStore } from '@/features/team-split-manual/model/store';
import { useCreateMatch, useUpdateMatch } from '@/entities/match/model/queries';
import { useMatchProgressStore } from '@/features/match-schedule/model/match-progress-store';
import { Play, Pause, Square, Plus, Minus, Trash2, ChevronRight } from 'lucide-react';
import type { Match } from '@/shared/types/match';

interface MatchGameCardEnhancedProps {
  matchNumber: number;
  voteSessionId: string;
  voteTitle: string;
  eventDate: string;
  onDelete?: () => void;
}

type TeamName = 'A' | 'B' | 'C' | 'D';

export function MatchGameCardEnhanced({
  matchNumber,
  voteSessionId,
  voteTitle,
  eventDate,
  onDelete
}: MatchGameCardEnhancedProps) {
  const router = useRouter();
  const { teams, teamCount } = useTeamSplitStore();
  const { mutate: createMatch } = useCreateMatch();
  const { mutate: updateMatch } = useUpdateMatch();

  const matchProgressStore = useMatchProgressStore();
  const {
    matchId: storedMatchId,
    matchNumber: storedMatchNumber,
    status: matchStatus,
    scoreA: storedScoreA,
    scoreB: storedScoreB,
    startMatch,
    pauseMatch,
    resumeMatch,
    finishMatch,
    updateScore: updateStoredScore,
    getRemainingSeconds,
    getElapsedSeconds,
  } = matchProgressStore;

  const [selectedTeamA, setSelectedTeamA] = useState<TeamName | null>(null);
  const [selectedTeamB, setSelectedTeamB] = useState<TeamName | null>(null);
  const [createdMatch, setCreatedMatch] = useState<Match | null>(null);
  const [matchDurationMinutes, setMatchDurationMinutes] = useState(10);

  // Timer display - updated every second
  const [displayTime, setDisplayTime] = useState(10 * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Score state
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  const TEAM_NAMES: TeamName[] = ['A', 'B', 'C', 'D'];
  const activeTeams = TEAM_NAMES.slice(0, teamCount).filter(t => teams[t].length > 0);

  // Restore match state on component mount
  useEffect(() => {
    if (storedMatchNumber === matchNumber && matchStatus !== 'pending') {
      // This is the currently active match, restore state
      setDisplayTime(getRemainingSeconds());
      setScoreA(storedScoreA);
      setScoreB(storedScoreB);

      // Restore team selections from store (parse "Team A" -> "A")
      const teamALetter = matchProgressStore.teamAName?.replace('Team ', '') as TeamName;
      const teamBLetter = matchProgressStore.teamBName?.replace('Team ', '') as TeamName;
      if (teamALetter && teamBLetter) {
        setSelectedTeamA(teamALetter);
        setSelectedTeamB(teamBLetter);
      }

      // Restore match duration
      const durationMins = Math.floor(matchProgressStore.durationSeconds / 60);
      setMatchDurationMinutes(durationMins);

      // Create a minimal match object for database updates
      if (storedMatchId) {
        setCreatedMatch({ id: storedMatchId } as Match);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update display time every second when match is in progress
  useEffect(() => {
    if (matchStatus === 'in_progress' && storedMatchNumber === matchNumber) {
      intervalRef.current = setInterval(() => {
        const remaining = getRemainingSeconds();
        setDisplayTime(remaining);

        // Auto-finish when time runs out
        if (remaining <= 0) {
          handleMatchFinish();
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [matchStatus, storedMatchNumber, matchNumber, getRemainingSeconds, handleMatchFinish]);

  // Update time when duration changes (only for pending matches)
  const handleDurationChange = (minutes: string) => {
    const mins = parseInt(minutes);
    setMatchDurationMinutes(mins);
    setDisplayTime(mins * 60);
  };

  const handleCreateMatch = () => {
    if (!selectedTeamA || !selectedTeamB) return;

    const teamAMembers = teams[selectedTeamA];
    const teamBMembers = teams[selectedTeamB];

    createMatch(
      {
        date: eventDate,
        location: '풋살장',
        team_a: {
          name: `Team ${selectedTeamA}`,
          member_ids: teamAMembers.map(m => m.id),
          score: 0,
          players: teamAMembers.map(m => ({
            member_id: m.id,
            goals: 0,
            assists: 0,
            saves: 0,
            is_mvp: false,
          })),
          goalkeeper_id: null,
          manager_id: null,
          substitutions: [],
          goals_detail: [],
        },
        team_b: {
          name: `Team ${selectedTeamB}`,
          member_ids: teamBMembers.map(m => m.id),
          score: 0,
          players: teamBMembers.map(m => ({
            member_id: m.id,
            goals: 0,
            assists: 0,
            saves: 0,
            is_mvp: false,
          })),
          goalkeeper_id: null,
          manager_id: null,
          substitutions: [],
          goals_detail: [],
        },
        vote_session_id: voteSessionId || undefined,
        match_number: matchNumber,
        status: 'pending',
        duration: matchDurationMinutes * 60,
      },
      {
        onSuccess: (match) => {
          setCreatedMatch(match);
        },
      }
    );
  };

  const handleMatchStart = () => {
    if (!createdMatch) {
      handleCreateMatch();
      return;
    }

    if (!selectedTeamA || !selectedTeamB) return;

    // Start match in store
    startMatch(
      createdMatch.id,
      matchNumber,
      `Team ${selectedTeamA}`,
      `Team ${selectedTeamB}`,
      matchDurationMinutes
    );

    // Update database
    const startTime = new Date().toISOString();
    updateMatch({
      id: createdMatch.id,
      data: {
        status: 'in_progress',
        start_time: startTime,
        team_a: { ...createdMatch.team_a, score: scoreA },
        team_b: { ...createdMatch.team_b, score: scoreB },
      },
    });
  };

  const handleMatchPause = () => {
    if (matchStatus === 'in_progress') {
      pauseMatch();
    }
  };

  const handleMatchResume = () => {
    resumeMatch();
  };

  const handleMatchFinish = useCallback(() => {
    if (!createdMatch) return;

    // Finish match in store
    finishMatch();

    // Update database
    const endTime = new Date().toISOString();
    updateMatch({
      id: createdMatch.id,
      data: {
        status: 'finished',
        end_time: endTime,
        team_a: { ...createdMatch.team_a, score: scoreA },
        team_b: { ...createdMatch.team_b, score: scoreB },
      },
    });
  }, [createdMatch, finishMatch, updateMatch, scoreA, scoreB]);

  const handleScoreChange = (team: 'A' | 'B', delta: number) => {
    if (matchStatus === 'finished') return;

    let newScoreA = scoreA;
    let newScoreB = scoreB;

    if (team === 'A') {
      newScoreA = Math.max(0, scoreA + delta);
      setScoreA(newScoreA);
    } else {
      newScoreB = Math.max(0, scoreB + delta);
      setScoreB(newScoreB);
    }

    // Update store
    updateStoredScore(newScoreA, newScoreB);

    // Update database (use storedMatchId if available, fallback to createdMatch)
    const matchId = storedMatchId || createdMatch?.id;
    if (matchId && createdMatch) {
      updateMatch({
        id: matchId,
        data: {
          team_a: { ...createdMatch.team_a, score: newScoreA },
          team_b: { ...createdMatch.team_b, score: newScoreB },
        },
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if this is the current active match
  const isActiveMatch = storedMatchNumber === matchNumber;
  const displayStatus = isActiveMatch ? matchStatus : (createdMatch?.status || 'pending');
  const isPaused = matchProgressStore.pausedAt !== null;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{matchNumber}경기</CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary">{new Date(eventDate).toLocaleDateString('ko-KR')}</Badge>
            {displayStatus === 'pending' && <Badge variant="outline">대기</Badge>}
            {displayStatus === 'in_progress' && !isPaused && <Badge variant="default">진행중</Badge>}
            {displayStatus === 'in_progress' && isPaused && <Badge variant="secondary">일시정지</Badge>}
            {displayStatus === 'finished' && <Badge variant="secondary">종료</Badge>}
            {onDelete && !createdMatch && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Match Duration Selection */}
        {!createdMatch && (
          <div className="space-y-2">
            <label className="text-sm font-medium">경기 시간</label>
            <Select
              value={matchDurationMinutes.toString()}
              onValueChange={handleDurationChange}
              disabled={!!createdMatch}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 20 }, (_, i) => i + 1).map((minutes) => (
                  <SelectItem key={minutes} value={minutes.toString()}>
                    {minutes}분
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Team Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Team A</label>
            <Select
              value={selectedTeamA || ''}
              onValueChange={(v) => setSelectedTeamA(v as TeamName)}
              disabled={!!createdMatch}
            >
              <SelectTrigger>
                <SelectValue placeholder="팀 선택" />
              </SelectTrigger>
              <SelectContent>
                {activeTeams.map((team) => (
                  <SelectItem key={team} value={team} disabled={team === selectedTeamB}>
                    Team {team} ({teams[team].length}명)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Team B</label>
            <Select
              value={selectedTeamB || ''}
              onValueChange={(v) => setSelectedTeamB(v as TeamName)}
              disabled={!!createdMatch}
            >
              <SelectTrigger>
                <SelectValue placeholder="팀 선택" />
              </SelectTrigger>
              <SelectContent>
                {activeTeams.map((team) => (
                  <SelectItem key={team} value={team} disabled={team === selectedTeamA}>
                    Team {team} ({teams[team].length}명)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Match Display with Timer and Score */}
        {selectedTeamA && selectedTeamB && (
          <>
            {/* Match Finished Result Screen */}
            {displayStatus === 'finished' && (
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 space-y-4">
                <div className="text-center">
                  <div className="inline-block px-4 py-2 bg-primary/20 rounded-full mb-4">
                    <p className="text-sm font-bold text-primary">경기 종료</p>
                  </div>
                  <div className="text-2xl font-bold mb-2">
                    {scoreA > scoreB && `🏆 Team ${selectedTeamA} 승리!`}
                    {scoreB > scoreA && `🏆 Team ${selectedTeamB} 승리!`}
                    {scoreA === scoreB && '⚖️ 무승부'}
                  </div>
                  <div className="text-4xl font-bold text-primary flex items-center justify-center gap-4 mb-4">
                    <span>{scoreA}</span>
                    <span className="text-2xl text-muted-foreground">:</span>
                    <span>{scoreB}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-3 bg-background/50 rounded-lg">
                      <p className="text-muted-foreground mb-1">Team {selectedTeamA}</p>
                      <p className="font-bold">{teams[selectedTeamA].length}명</p>
                    </div>
                    <div className="text-center p-3 bg-background/50 rounded-lg">
                      <p className="text-muted-foreground mb-1">Team {selectedTeamB}</p>
                      <p className="font-bold">{teams[selectedTeamB].length}명</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>경기 시간: {matchDurationMinutes}분</p>
                      <p>경기 일시: {new Date(eventDate).toLocaleString('ko-KR')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timer */}
            {displayStatus !== 'finished' && (
              <>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {formatTime(displayTime)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {displayStatus === 'in_progress' && !isPaused && '⚽ 경기 진행 중'}
                    {displayStatus === 'in_progress' && isPaused && '⏸️ 일시정지'}
                    {displayStatus === 'pending' && '⏱️ 경기 대기'}
                  </div>
                </div>

                <div className="flex gap-2 justify-center">
                  {displayStatus === 'pending' && (
                    <Button onClick={handleMatchStart} size="sm" className="flex-1">
                      <Play className="mr-2 h-4 w-4" />
                      경기 시작
                    </Button>
                  )}
                  {displayStatus === 'in_progress' && !isPaused && (
                    <>
                      <Button onClick={handleMatchPause} size="sm" variant="outline">
                        <Pause className="h-4 w-4" />
                      </Button>
                      <Button onClick={handleMatchFinish} size="sm" variant="destructive">
                        <Square className="mr-2 h-4 w-4" />
                        종료
                      </Button>
                    </>
                  )}
                  {displayStatus === 'in_progress' && isPaused && (
                    <>
                      <Button onClick={handleMatchResume} size="sm" variant="default">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button onClick={handleMatchFinish} size="sm" variant="destructive">
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
                <p className="text-xs font-medium text-muted-foreground">경기 스코어</p>
              </div>
              <div className="flex items-center justify-center gap-3">
                {/* Team A Score */}
                <div className="text-center flex-1 max-w-[140px]">
                  <p className="text-xs font-semibold mb-1">Team {selectedTeamA}</p>
                  <p className="text-[10px] text-muted-foreground mb-2">({teams[selectedTeamA].length}명)</p>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 rounded-full shrink-0"
                      onClick={() => handleScoreChange('A', -1)}
                      disabled={displayStatus === 'finished' || scoreA === 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <div className="bg-background rounded-lg px-3 py-2 min-w-[50px] shadow-sm border-2 border-primary/20">
                      <div className="text-3xl font-bold text-primary">{scoreA}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 rounded-full shrink-0"
                      onClick={() => handleScoreChange('A', 1)}
                      disabled={displayStatus === 'finished'}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* VS Divider */}
                <div className="text-lg font-bold text-muted-foreground px-1">VS</div>

                {/* Team B Score */}
                <div className="text-center flex-1 max-w-[140px]">
                  <p className="text-xs font-semibold mb-1">Team {selectedTeamB}</p>
                  <p className="text-[10px] text-muted-foreground mb-2">({teams[selectedTeamB].length}명)</p>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 rounded-full shrink-0"
                      onClick={() => handleScoreChange('B', -1)}
                      disabled={displayStatus === 'finished' || scoreB === 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <div className="bg-background rounded-lg px-3 py-2 min-w-[50px] shadow-sm border-2 border-primary/20">
                      <div className="text-3xl font-bold text-primary">{scoreB}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 rounded-full shrink-0"
                      onClick={() => handleScoreChange('B', 1)}
                      disabled={displayStatus === 'finished'}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Tactics Board Links */}
            <div className="space-y-2">
              <label className="text-sm font-medium">전술 보드 보기</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/team-division/${selectedTeamA}`)}
                >
                  Team {selectedTeamA}
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/team-division/${selectedTeamB}`)}
                >
                  Team {selectedTeamB}
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
