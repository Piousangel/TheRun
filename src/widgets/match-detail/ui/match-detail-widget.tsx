'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useMatch, useUpdateMatch } from '@/entities/match/model/queries';
import { useMembers } from '@/entities/member/model/queries';
import { MemberAvatar } from '@/entities/member/ui/member-avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { LoadingState } from '@/shared/ui/loading-spinner';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Trophy,
  MapPin,
  Calendar,
  Users,
} from 'lucide-react';
import type { Match } from '@/shared/types/match';

interface MatchDetailWidgetProps {
  matchId: string;
}

export function MatchDetailWidget({ matchId }: MatchDetailWidgetProps) {
  const router = useRouter();
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

  // Initialize scores and timer from match data
  useEffect(() => {
    if (match) {
      setScoreA(match.team_a.score);
      setScoreB(match.team_b.score);

      if (match.status === 'in_progress' && match.start_time && match.duration) {
        const elapsed = Math.floor((Date.now() - new Date(match.start_time).getTime()) / 1000);
        const remaining = Math.max(0, match.duration - elapsed);
        setTimeInSeconds(remaining);
        setInitialTime(match.duration);
        if (remaining > 0) {
          setIsRunning(true);
        }
      } else if (match.duration) {
        setInitialTime(match.duration);
        setTimeInSeconds(match.duration);
      }
    }
  }, [match]);

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
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleMatchStart = () => {
    if (!match) return;

    const startTime = new Date().toISOString();
    updateMatch({
      id: matchId,
      data: {
        status: 'in_progress',
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

  const handleMatchFinish = () => {
    if (!match) return;

    const endTime = new Date().toISOString();
    updateMatch({
      id: matchId,
      data: {
        status: 'finished',
        end_time: endTime,
        team_a: { ...match.team_a, score: scoreA },
        team_b: { ...match.team_b, score: scoreB },
      },
    });
    setIsRunning(false);
  };

  const handleReset = () => {
    if (!match || match.status === 'in_progress') return;
    setIsRunning(false);
    setTimeInSeconds(initialTime);
  };

  const handleAddMinute = () => {
    if (!match || match.status !== 'pending') return;
    const newTime = initialTime + 60;
    setInitialTime(newTime);
    setTimeInSeconds(newTime);
  };

  const handleSubtractMinute = () => {
    if (!match || match.status !== 'pending' || initialTime <= 60) return;
    const newTime = initialTime - 60;
    setInitialTime(newTime);
    setTimeInSeconds(newTime);
  };

  const handleScoreChange = (team: 'A' | 'B', delta: number) => {
    if (!match || match.status === 'finished') return;

    if (team === 'A') {
      const newScore = Math.max(0, scoreA + delta);
      setScoreA(newScore);
      updateMatch({
        id: matchId,
        data: {
          team_a: { ...match.team_a, score: newScore },
        },
      });
    } else {
      const newScore = Math.max(0, scoreB + delta);
      setScoreB(newScore);
      updateMatch({
        id: matchId,
        data: {
          team_b: { ...match.team_b, score: newScore },
        },
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((initialTime - timeInSeconds) / initialTime) * 100;

  const getMembersByIds = (memberIds: string[]) => {
    if (!members) return [];
    return memberIds.map((id) => members.find((m) => m.id === id)).filter(Boolean);
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
      <Card>
        <CardHeader>
          <CardTitle>경기를 찾을 수 없습니다</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const teamAMembers = getMembersByIds(match.team_a.member_ids);
  const teamBMembers = getMembersByIds(match.team_b.member_ids);
  const winner =
    match.status === 'finished'
      ? scoreA > scoreB
        ? 'A'
        : scoreB > scoreA
        ? 'B'
        : 'draw'
      : null;

  return (
    <div className="space-y-6">
      {/* Match Info */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <CardTitle>
                  {format(new Date(match.date), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}
                </CardTitle>
                {match.status === 'pending' && <Badge variant="secondary">대기</Badge>}
                {match.status === 'in_progress' && <Badge variant="default">진행중</Badge>}
                {match.status === 'finished' && <Badge variant="outline">종료</Badge>}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {match.location}
              </div>
            </div>
            {winner && (
              <Badge variant="default" className="text-lg">
                <Trophy className="h-4 w-4 mr-1" />
                {winner === 'draw' ? '무승부' : `Team ${winner} 승`}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

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

            {match.status === 'pending' && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSubtractMinute}
                  disabled={initialTime <= 60}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                  {Math.floor(initialTime / 60)}분 설정
                </span>
                <Button variant="outline" size="icon" onClick={handleAddMinute}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex gap-2 justify-center">
              {match.status === 'pending' && (
                <Button onClick={handleMatchStart} size="lg" className="flex-1 max-w-[200px]">
                  <Play className="mr-2 h-5 w-5" />
                  경기 시작
                </Button>
              )}
              {match.status === 'in_progress' && (
                <>
                  <Button onClick={handleMatchPause} size="lg" className="flex-1 max-w-[200px]">
                    <Pause className="mr-2 h-5 w-5" />
                    일시정지
                  </Button>
                  <Button
                    onClick={handleMatchFinish}
                    size="lg"
                    variant="destructive"
                    className="flex-1 max-w-[200px]"
                  >
                    경기 종료
                  </Button>
                </>
              )}
              {match.status !== 'finished' && (
                <Button onClick={handleReset} variant="outline" size="lg">
                  <RotateCcw className="h-5 w-5" />
                </Button>
              )}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              {timeInSeconds === 0 && '⏰ 경기 종료!'}
              {isRunning && timeInSeconds > 0 && '⚽ 경기 진행 중'}
              {!isRunning && timeInSeconds > 0 && timeInSeconds < initialTime && '⏸️ 일시정지'}
              {!isRunning && timeInSeconds === initialTime && match.status === 'pending' && '⏱️ 준비'}
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
                  onClick={() => handleScoreChange('A', -1)}
                  disabled={match.status === 'finished' || scoreA === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="text-5xl font-bold text-primary w-20 text-center">{scoreA}</div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleScoreChange('A', 1)}
                  disabled={match.status === 'finished'}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="text-3xl font-bold text-muted-foreground px-4">vs</div>

            <div className="text-center flex-1">
              <p className="text-sm text-muted-foreground mb-2">Team B</p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleScoreChange('B', -1)}
                  disabled={match.status === 'finished' || scoreB === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="text-5xl font-bold text-primary w-20 text-center">{scoreB}</div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleScoreChange('B', 1)}
                  disabled={match.status === 'finished'}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Match Summary (Only show when finished) */}
      {match.status === 'finished' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              경기 기록
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground mb-1">경기 시간</p>
                <p className="text-lg font-bold">
                  {match.duration ? `${Math.floor(match.duration / 60)}분` : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">최종 스코어</p>
                <p className="text-2xl font-bold text-primary">
                  {scoreA} : {scoreB}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">결과</p>
                <p className="text-lg font-bold">
                  {winner === 'draw' ? '무승부' : `Team ${winner} 승리`}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Team A 출전</p>
                <p className="text-base font-medium">{teamAMembers.length}명</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Team B 출전</p>
                <p className="text-base font-medium">{teamBMembers.length}명</p>
              </div>
            </div>

            {match.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">메모</p>
                  <p className="text-sm">{match.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Team Rosters */}
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
              {teamAMembers.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-lg"
                >
                  <MemberAvatar src={member.profile_photo} alt={member.name} size="sm" />
                  <span className="text-sm font-medium">{member.name}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href={`/team-division/A`}>
                <Button variant="outline" className="w-full">
                  전술 보드
                </Button>
              </Link>
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
              {teamBMembers.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-lg"
                >
                  <MemberAvatar src={member.profile_photo} alt={member.name} size="sm" />
                  <span className="text-sm font-medium">{member.name}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href={`/team-division/B`}>
                <Button variant="outline" className="w-full">
                  전술 보드
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
