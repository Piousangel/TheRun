'use client';

import { useState, useMemo } from 'react';
import { useMembers } from '@/entities/member/model/queries';
import { MemberAvatar } from '@/entities/member/ui/member-avatar';
import { autoBalanceTeams, calculateTeamStats } from '@/features/team-split-auto/model/algorithm';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { Shuffle, Users } from 'lucide-react';
import type { Member } from '@/shared/types/member';

export function TeamSplitAuto() {
  const { data: members, isLoading } = useMembers();
  const [teamA, setTeamA] = useState<Member[]>([]);
  const [teamB, setTeamB] = useState<Member[]>([]);

  const handleAutoBalance = () => {
    if (!members) return;

    const { teamA: newTeamA, teamB: newTeamB } = autoBalanceTeams(members);
    setTeamA(newTeamA);
    setTeamB(newTeamB);
  };

  const teamAStats = useMemo(() => teamA.length > 0 ? calculateTeamStats(teamA) : null, [teamA]);
  const teamBStats = useMemo(() => teamB.length > 0 ? calculateTeamStats(teamB) : null, [teamB]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">로딩 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">자동 밸런싱</h3>
          <p className="text-sm text-muted-foreground mt-1">
            능력치 기반으로 자동으로 균형잡힌 팀을 생성합니다
          </p>
        </div>
        <Button onClick={handleAutoBalance}>
          <Shuffle className="mr-2 h-4 w-4" />
          자동 밸런싱
        </Button>
      </div>

      {teamA.length === 0 && teamB.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              "자동 밸런싱" 버튼을 클릭하여 팀을 나눠보세요
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team A */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Team A
                </CardTitle>
                <Badge variant="secondary">{teamA.length}명</Badge>
              </div>
              <CardDescription>
                평균 능력치: {teamAStats?.totalScore.toFixed(1) || 0}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teamA.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 bg-primary/5 rounded-lg"
                  >
                    <MemberAvatar src={member.profile_photo} alt={member.name} size="sm" />
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        종합 {Object.values(member.stats).reduce((a, b) => a + b, 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {teamAStats && (
                <>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <p className="text-muted-foreground">스피드</p>
                      <p className="font-semibold">{teamAStats.avgSpeed.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">슈팅</p>
                      <p className="font-semibold">{teamAStats.avgShooting.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">패스</p>
                      <p className="font-semibold">{teamAStats.avgPassing.toFixed(0)}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Team B */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Team B
                </CardTitle>
                <Badge variant="secondary">{teamB.length}명</Badge>
              </div>
              <CardDescription>
                평균 능력치: {teamBStats?.totalScore.toFixed(1) || 0}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teamB.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 bg-primary/5 rounded-lg"
                  >
                    <MemberAvatar src={member.profile_photo} alt={member.name} size="sm" />
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        종합 {Object.values(member.stats).reduce((a, b) => a + b, 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {teamBStats && (
                <>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <p className="text-muted-foreground">스피드</p>
                      <p className="font-semibold">{teamBStats.avgSpeed.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">슈팅</p>
                      <p className="font-semibold">{teamBStats.avgShooting.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">패스</p>
                      <p className="font-semibold">{teamBStats.avgPassing.toFixed(0)}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {teamAStats && teamBStats && (
        <Card>
          <CardHeader>
            <CardTitle>팀 밸런스 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Team A 종합</p>
                <p className="text-3xl font-bold text-primary">
                  {teamAStats.totalScore.toFixed(1)}
                </p>
              </div>
              <div className="text-muted-foreground text-xl">vs</div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Team B 종합</p>
                <p className="text-3xl font-bold text-primary">
                  {teamBStats.totalScore.toFixed(1)}
                </p>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              능력치 차이: {Math.abs(teamAStats.totalScore - teamBStats.totalScore).toFixed(1)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
