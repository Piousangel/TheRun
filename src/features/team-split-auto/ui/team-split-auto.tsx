'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import { useMembers } from '@/entities/member/model/queries';
import { useTeamSplitStore } from '@/features/team-split-manual/model/store';
import { autoBalanceMultipleTeams, calculateTeamStats } from '@/features/team-split-auto/model/algorithm';
import { DraggableMember } from '@/features/team-split-manual/ui/draggable-member';
import { DroppableTeam } from '@/features/team-split-manual/ui/droppable-team';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Shuffle } from 'lucide-react';
import type { Member } from '@/shared/types/member';

type TeamName = 'A' | 'B' | 'C' | 'D';
const TEAM_NAMES: TeamName[] = ['A', 'B', 'C', 'D'];

export function TeamSplitAuto() {
  const router = useRouter();
  const { data: members, isLoading } = useMembers();
  const { teamCount, teams, setTeamCount, moveToTeam, moveToAvailable, reset } = useTeamSplitStore();
  const [activeMember, setActiveMember] = useState<Member | null>(null);

  const handleAutoBalance = () => {
    if (!members) return;

    const balancedTeams = autoBalanceMultipleTeams(members, teamCount);

    // Reset first
    reset(members);

    // Assign to teams
    balancedTeams.forEach((teamMembers, index) => {
      const teamName = TEAM_NAMES[index];
      teamMembers.forEach(member => {
        moveToTeam(member, teamName);
      });
    });
  };

  const handleTeamCountChange = (value: string) => {
    const count = parseInt(value);
    setTeamCount(count);
  };

  const handleTeamClick = (teamName: TeamName) => {
    if (teams[teamName].length > 0) {
      router.push(`/team-division/${teamName}`);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const memberId = event.active.id as string;
    const allMembers = Object.values(teams).flat();
    const member = allMembers.find((m) => m.id === memberId);
    setActiveMember(member || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveMember(null);

    if (!over) return;

    const memberId = active.id as string;
    const targetContainer = over.id as string;

    const allMembers = Object.values(teams).flat();
    const member = allMembers.find((m) => m.id === memberId);
    if (!member) return;

    let fromTeam: TeamName | null = null;

    for (const teamName of TEAM_NAMES) {
      if (teams[teamName].some((m) => m.id === memberId)) {
        fromTeam = teamName;
        break;
      }
    }

    if (TEAM_NAMES.includes(targetContainer as TeamName) && fromTeam) {
      const targetTeam = targetContainer as TeamName;
      if (fromTeam !== targetTeam) {
        moveToAvailable(member, fromTeam);
        moveToTeam(member, targetTeam);
      }
    }
  };

  const teamStats = useMemo(() => {
    const stats: Record<TeamName, ReturnType<typeof calculateTeamStats> | null> = {
      A: teams.A.length > 0 ? calculateTeamStats(teams.A) : null,
      B: teams.B.length > 0 ? calculateTeamStats(teams.B) : null,
      C: teams.C.length > 0 ? calculateTeamStats(teams.C) : null,
      D: teams.D.length > 0 ? calculateTeamStats(teams.D) : null,
    };
    return stats;
  }, [teams]);

  const activeTeams = TEAM_NAMES.slice(0, teamCount);
  const hasTeams = activeTeams.some(t => teams[t].length > 0);

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
    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-semibold">자동 밸런싱</h3>
            <p className="text-sm text-muted-foreground mt-1">
              능력치 기반으로 자동으로 균형잡힌 팀을 생성합니다
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={teamCount.toString()} onValueChange={handleTeamCountChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2팀</SelectItem>
                <SelectItem value="3">3팀</SelectItem>
                <SelectItem value="4">4팀</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAutoBalance}>
              <Shuffle className="mr-2 h-4 w-4" />
              자동 밸런싱
            </Button>
          </div>
        </div>

        {!hasTeams ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                "자동 밸런싱" 버튼을 클릭하여 팀을 나눠보세요
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {activeTeams.map((teamName) => (
                <DroppableTeam
                  key={teamName}
                  id={teamName}
                  title={`Team ${teamName}`}
                  count={teams[teamName].length}
                  stats={teamStats[teamName]}
                  onClick={() => handleTeamClick(teamName)}
                  isClickable={teams[teamName].length > 0}
                >
                  <SortableContext items={teams[teamName].map((m) => m.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {teams[teamName].map((member) => (
                        <DraggableMember key={member.id} member={member} />
                      ))}
                    </div>
                  </SortableContext>
                </DroppableTeam>
              ))}
            </div>

            {/* Team Balance Analysis */}
            {activeTeams.filter(t => teams[t].length > 0).length >= 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>팀 밸런스 분석</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {activeTeams.map((teamName) => {
                      const stats = teamStats[teamName];
                      if (!stats) return null;
                      return (
                        <div key={teamName} className="text-center">
                          <p className="text-sm text-muted-foreground">Team {teamName} 종합</p>
                          <p className="text-2xl font-bold text-primary">
                            {stats.totalScore.toFixed(1)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <DragOverlay>
        {activeMember ? <DraggableMember member={activeMember} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
