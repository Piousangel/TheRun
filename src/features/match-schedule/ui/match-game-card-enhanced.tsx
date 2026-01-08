'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { useTeamSplitStore } from '@/features/team-split-manual/model/store';
import { useCreateMatch, useUpdateMatch } from '@/entities/match/model/queries';
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

  const [selectedTeamA, setSelectedTeamA] = useState<TeamName | null>(null);
  const [selectedTeamB, setSelectedTeamB] = useState<TeamName | null>(null);
  const [createdMatch, setCreatedMatch] = useState<Match | null>(null);

  // Timer state
  const [timeInSeconds, setTimeInSeconds] = useState(10 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [initialTime] = useState(10 * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Score state
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  const TEAM_NAMES: TeamName[] = ['A', 'B', 'C', 'D'];
  const activeTeams = TEAM_NAMES.slice(0, teamCount).filter(t => teams[t].length > 0);

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
  }, [isRunning]);

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
            is_mvp: false,
          })),
        },
        team_b: {
          name: `Team ${selectedTeamB}`,
          member_ids: teamBMembers.map(m => m.id),
          score: 0,
          players: teamBMembers.map(m => ({
            member_id: m.id,
            goals: 0,
            assists: 0,
            is_mvp: false,
          })),
        },
        vote_session_id: voteSessionId || undefined,
        match_number: matchNumber,
        status: 'pending',
        duration: initialTime,
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
    }

    const startTime = new Date().toISOString();
    if (createdMatch) {
      updateMatch({
        id: createdMatch.id,
        data: {
          status: 'in_progress',
          start_time: startTime,
          team_a: { ...createdMatch.team_a, score: scoreA },
          team_b: { ...createdMatch.team_b, score: scoreB },
        },
      });
    }
    setIsRunning(true);
  };

  const handleMatchPause = () => {
    setIsRunning(false);
  };

  const handleMatchFinish = () => {
    if (!createdMatch) return;

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
    setIsRunning(false);
  };

  const handleScoreChange = (team: 'A' | 'B', delta: number) => {
    if (createdMatch?.status === 'finished') return;

    if (team === 'A') {
      const newScore = Math.max(0, scoreA + delta);
      setScoreA(newScore);
      if (createdMatch) {
        updateMatch({
          id: createdMatch.id,
          data: {
            team_a: { ...createdMatch.team_a, score: newScore },
          },
        });
      }
    } else {
      const newScore = Math.max(0, scoreB + delta);
      setScoreB(newScore);
      if (createdMatch) {
        updateMatch({
          id: createdMatch.id,
          data: {
            team_b: { ...createdMatch.team_b, score: newScore },
          },
        });
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const matchStatus = createdMatch?.status || 'pending';

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{matchNumber}경기</CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary">{new Date(eventDate).toLocaleDateString('ko-KR')}</Badge>
            {matchStatus === 'pending' && <Badge variant="outline">대기</Badge>}
            {matchStatus === 'in_progress' && <Badge variant="default">진행중</Badge>}
            {matchStatus === 'finished' && <Badge variant="secondary">종료</Badge>}
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
            {/* Timer */}
            {matchStatus !== 'finished' && (
              <>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {formatTime(timeInSeconds)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isRunning && '⚽ 경기 진행 중'}
                    {!isRunning && matchStatus === 'pending' && '⏱️ 경기 대기'}
                    {!isRunning && matchStatus === 'in_progress' && '⏸️ 일시정지'}
                  </div>
                </div>

                <div className="flex gap-2 justify-center">
                  {matchStatus === 'pending' && (
                    <Button onClick={handleMatchStart} size="sm" className="flex-1">
                      <Play className="mr-2 h-4 w-4" />
                      경기 시작
                    </Button>
                  )}
                  {matchStatus === 'in_progress' && (
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
                </div>

                <Separator />
              </>
            )}

            {/* Score */}
            <div className="flex items-center justify-around">
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground mb-1">Team {selectedTeamA} ({teams[selectedTeamA].length}명)</p>
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleScoreChange('A', -1)}
                    disabled={matchStatus === 'finished' || scoreA === 0}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <div className="text-3xl font-bold text-primary w-12 text-center">{scoreA}</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleScoreChange('A', 1)}
                    disabled={matchStatus === 'finished'}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="text-xl font-bold text-muted-foreground px-2">vs</div>

              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground mb-1">Team {selectedTeamB} ({teams[selectedTeamB].length}명)</p>
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleScoreChange('B', -1)}
                    disabled={matchStatus === 'finished' || scoreB === 0}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <div className="text-3xl font-bold text-primary w-12 text-center">{scoreB}</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleScoreChange('B', 1)}
                    disabled={matchStatus === 'finished'}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
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
