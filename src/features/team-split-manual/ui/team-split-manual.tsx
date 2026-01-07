'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMembers } from '@/entities/member/model/queries';
import { useTeamSplitStore } from '@/features/team-split-manual/model/store';
import { calculateTeamStats } from '@/features/team-split-auto/model/algorithm';
import { DraggableMember } from './draggable-member';
import { DroppableTeam } from './droppable-team';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { RefreshCw } from 'lucide-react';
import type { Member } from '@/shared/types/member';

type TeamName = 'A' | 'B' | 'C' | 'D';

const TEAM_NAMES: TeamName[] = ['A', 'B', 'C', 'D'];

export function TeamSplitManual() {
  const router = useRouter();
  const { data: members, isLoading } = useMembers();
  const { teamCount, availableMembers, teams, setTeamCount, setAvailableMembers, moveToTeam, moveToAvailable, reset } = useTeamSplitStore();
  const [activeMember, setActiveMember] = useState<Member | null>(null);

  useEffect(() => {
    if (members && availableMembers.length === 0 && Object.values(teams).every(t => t.length === 0)) {
      setAvailableMembers(members);
    }
  }, [members, availableMembers, teams, setAvailableMembers]);

  const handleDragStart = (event: DragStartEvent) => {
    const memberId = event.active.id as string;
    const allMembers = [availableMembers, ...Object.values(teams)].flat();
    const member = allMembers.find((m) => m.id === memberId);
    setActiveMember(member || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveMember(null);

    if (!over) return;

    const memberId = active.id as string;
    const targetContainer = over.id as string;

    const allMembers = [availableMembers, ...Object.values(teams)].flat();
    const member = allMembers.find((m) => m.id === memberId);
    if (!member) return;

    const isInAvailable = availableMembers.some((m) => m.id === memberId);
    let fromTeam: TeamName | null = null;

    for (const teamName of TEAM_NAMES) {
      if (teams[teamName].some((m) => m.id === memberId)) {
        fromTeam = teamName;
        break;
      }
    }

    if (targetContainer === 'available') {
      if (fromTeam) {
        moveToAvailable(member, fromTeam);
      }
    } else if (TEAM_NAMES.includes(targetContainer as TeamName)) {
      const targetTeam = targetContainer as TeamName;
      if (isInAvailable) {
        moveToTeam(member, targetTeam);
      } else if (fromTeam && fromTeam !== targetTeam) {
        moveToAvailable(member, fromTeam);
        moveToTeam(member, targetTeam);
      }
    }
  };

  const handleReset = () => {
    if (members) {
      reset(members);
    }
  };

  const handleTeamCountChange = (value: string) => {
    const count = parseInt(value);
    setTeamCount(count);
    // Reset teams when count changes
    if (members) {
      reset(members);
    }
  };

  const handleTeamClick = (teamName: TeamName) => {
    if (teams[teamName].length > 0) {
      router.push(`/team-division/${teamName}`);
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
            <h2 className="text-2xl font-bold">수동 팀 분배</h2>
            <p className="text-sm text-muted-foreground mt-1">
              드래그하여 팀에 멤버를 배치하세요
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
            <Button onClick={handleReset} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              초기화
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Available Members */}
          <DroppableTeam id="available" title="대기 멤버" count={availableMembers.length}>
            <SortableContext items={availableMembers.map((m) => m.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {availableMembers.map((member) => (
                  <DraggableMember key={member.id} member={member} />
                ))}
              </div>
            </SortableContext>
          </DroppableTeam>

          {/* Teams */}
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
      </div>

      <DragOverlay>
        {activeMember ? <DraggableMember member={activeMember} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
