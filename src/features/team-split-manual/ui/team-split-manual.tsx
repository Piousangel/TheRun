'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMembers } from '@/entities/member/model/queries';
import { useActiveVoteSessions, useVoteResponses } from '@/entities/vote/model/queries';
import { useTeamSplitStore } from '@/features/team-split-manual/model/store';
import { calculateTeamStats } from '@/features/team-split-auto/model/algorithm';
import { DraggableMember } from './draggable-member';
import { DroppableTeam } from './droppable-team';
import { MemberContextMenu } from './member-context-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { LoadingState } from '@/shared/ui/loading-spinner';
import { RefreshCw, Vote, Check, PlusCircle } from 'lucide-react';
import type { Member } from '@/shared/types/member';

type TeamName = 'A' | 'B' | 'C' | 'D';

const TEAM_NAMES: TeamName[] = ['A', 'B', 'C', 'D'];

export function TeamSplitManual() {
  const router = useRouter();
  const { data: members, isLoading } = useMembers();
  const { data: voteSessions } = useActiveVoteSessions();
  const [selectedVoteId, setSelectedVoteId] = useState<string | null>(null);
  const { data: voteResponses } = useVoteResponses(selectedVoteId || '');
  const { teamCount, availableMembers, teams, isTeamSelectionComplete, setTeamCount, setAvailableMembers, moveToTeam, moveToAvailable, reset, setSelectedVoteSessionId, completeTeamSelection, clearTeamSelection } = useTeamSplitStore();
  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'attending'>('all');
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    member: Member | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    member: null,
  });

  // Get member vote status
  const getMemberVoteStatus = (memberId: string): 'attending' | 'absent' | 'no-response' => {
    if (!voteResponses || !selectedVoteId) return 'no-response';
    const response = voteResponses.find(r => r.member_id === memberId);
    if (!response) return 'no-response';
    return response.status === 'attending' ? 'attending' : 'absent';
  };

  // Filter members based on vote status
  const filteredMembers = useMemo(() => {
    if (!members) return [];
    if (filterMode === 'all') return members;

    // Only show attending members
    return members.filter(m => getMemberVoteStatus(m.id) === 'attending');
  }, [members, filterMode, voteResponses, selectedVoteId]);

  useEffect(() => {
    if (filteredMembers.length > 0 && availableMembers.length === 0 && Object.values(teams).every(t => t.length === 0)) {
      setAvailableMembers(filteredMembers);
    }
  }, [filteredMembers, availableMembers, teams, setAvailableMembers]);

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
    if (filteredMembers) {
      reset(filteredMembers);
    }
  };

  const handleTeamCountChange = (value: string) => {
    const count = parseInt(value);
    setTeamCount(count);
    // Reset teams when count changes
    if (filteredMembers) {
      reset(filteredMembers);
    }
  };

  const handleLoadFromVote = () => {
    if (filteredMembers) {
      reset(filteredMembers);
    }
  };

  const handleVoteChange = (value: string) => {
    const voteId = value === 'none' ? null : value;
    setSelectedVoteId(voteId);
    setSelectedVoteSessionId(voteId);
    setFilterMode('all');
  };

  const handleCompleteTeamSelection = () => {
    completeTeamSelection();
    router.push('/matches');
  };

  const handleMemberLongPress = (member: Member, e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setContextMenu({
      isOpen: true,
      position: { x: clientX, y: clientY },
      member,
    });
  };

  const handleContextMenuTeamSelect = (teamName: TeamName) => {
    if (!contextMenu.member) return;

    // Check if member is in available or already in a team
    const isInAvailable = availableMembers.some(m => m.id === contextMenu.member!.id);

    if (isInAvailable) {
      moveToTeam(contextMenu.member, teamName);
    } else {
      // Member is in another team, move back to available first
      for (const tn of TEAM_NAMES) {
        if (teams[tn].some(m => m.id === contextMenu.member!.id)) {
          moveToAvailable(contextMenu.member, tn);
          break;
        }
      }
      // Then move to new team
      moveToTeam(contextMenu.member, teamName);
    }

    setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, member: null });
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

  // Check if at least 2 teams have members
  const canCompleteTeamSelection = activeTeams.filter(t => teams[t].length > 0).length >= 2;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <LoadingState />
        </CardContent>
      </Card>
    );
  }

  const matchVotes = voteSessions?.filter(s => s.type === 'match') || [];

  return (
    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* New Team Division Button - Show when team selection is complete */}
        {isTeamSelectionComplete && (
          <Card className="border-2 border-primary">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">팀 선택이 완료되었습니다</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    경기 탭에서 경기를 시작하거나, 새로운 팀을 나눌 수 있습니다.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full max-w-md mx-auto">
                  <Button onClick={() => router.push('/matches')} size="lg" className="w-full">
                    경기 시작하러 가기
                  </Button>
                  <Button onClick={clearTeamSelection} variant="outline" size="lg" className="w-full">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    새로운 팀 나누기
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vote Integration Section */}
        {matchVotes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-5 w-5 text-primary" />
                투표 연동
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={selectedVoteId || 'none'} onValueChange={handleVoteChange}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="투표 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">투표 없음 (전체 멤버)</SelectItem>
                    {matchVotes.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedVoteId && (
                  <Select value={filterMode} onValueChange={(v) => setFilterMode(v as 'all' | 'attending')}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 보기</SelectItem>
                      <SelectItem value="attending">참석만 보기</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Button onClick={handleLoadFromVote} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  불러오기
                </Button>
              </div>
              {selectedVoteId && (
                <div className="flex gap-2 text-sm">
                  <Badge variant="default">
                    참석: {filteredMembers.filter(m => getMemberVoteStatus(m.id) === 'attending').length}
                  </Badge>
                  <Badge variant="destructive">
                    불참: {members?.filter(m => getMemberVoteStatus(m.id) === 'absent').length || 0}
                  </Badge>
                  <Badge variant="secondary">
                    미응답: {members?.filter(m => getMemberVoteStatus(m.id) === 'no-response').length || 0}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
                  <DraggableMember
                    key={member.id}
                    member={member}
                    voteStatus={selectedVoteId ? getMemberVoteStatus(member.id) : undefined}
                    onLongPress={(e) => handleMemberLongPress(member, e)}
                  />
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
            >
              <SortableContext items={teams[teamName].map((m) => m.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {teams[teamName].map((member) => (
                    <DraggableMember
                      key={member.id}
                      member={member}
                      voteStatus={selectedVoteId ? getMemberVoteStatus(member.id) : undefined}
                      onLongPress={(e) => handleMemberLongPress(member, e)}
                    />
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

        {/* Complete Team Selection Button */}
        {canCompleteTeamSelection && (
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleCompleteTeamSelection}
              className="w-full sm:w-auto"
            >
              <Check className="mr-2 h-5 w-5" />
              팀 선택 완료하기
            </Button>
          </div>
        )}
      </div>

      <DragOverlay>
        {activeMember ? <DraggableMember member={activeMember} isDragging /> : null}
      </DragOverlay>

      {/* Context Menu */}
      <MemberContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        availableTeams={activeTeams}
        onSelectTeam={handleContextMenuTeamSelect}
        onClose={() => setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, member: null })}
      />
    </DndContext>
  );
}
