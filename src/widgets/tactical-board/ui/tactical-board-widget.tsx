'use client';

import { useRef, useEffect } from 'react';
import { useTeamSplitStore } from '@/features/team-split-manual/model/store';
import { useTacticalBoardStore } from '@/features/tactical-board/model/store';
import { generateDefaultFormation } from '@/features/tactical-board/model/formations';
import { SoccerField } from '@/entities/field/ui/soccer-field';
import { PlayerMarker } from '@/features/tactical-board/ui/player-marker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { RotateCcw, Users } from 'lucide-react';

interface TacticalBoardWidgetProps {
  teamName: string;
}

type TeamName = 'A' | 'B' | 'C' | 'D';

export function TacticalBoardWidget({ teamName }: TacticalBoardWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { teams } = useTeamSplitStore();
  const { positions, playerCount, setPositions, updatePosition, setPlayerCount } = useTacticalBoardStore();

  const teamMembers = teams[teamName as TeamName] || [];

  // Initialize formation when component mounts or team changes
  useEffect(() => {
    if (teamMembers.length > 0 && positions.length === 0) {
      const defaultPositions = generateDefaultFormation(teamMembers, playerCount);
      setPositions(defaultPositions);
    }
  }, [teamMembers, positions, playerCount, setPositions]);

  const handlePlayerCountChange = (value: string) => {
    const count = parseInt(value);
    setPlayerCount(count);
    // Regenerate formation with new player count
    const newPositions = generateDefaultFormation(teamMembers, count);
    setPositions(newPositions);
  };

  const handleReset = () => {
    const defaultPositions = generateDefaultFormation(teamMembers, playerCount);
    setPositions(defaultPositions);
  };

  const getMemberById = (memberId: string | null) => {
    if (!memberId) return null;
    return teamMembers.find((m) => m.id === memberId) || null;
  };

  const fieldPlayers = positions.filter((p) => p.role !== 'SUB');
  const substitutes = positions.filter((p) => p.role === 'SUB');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Team {teamName} 전술 보드
              </CardTitle>
              <CardDescription className="mt-1">
                선수를 드래그하여 포지션을 조정하세요
              </CardDescription>
            </div>
            <Badge variant="secondary">{teamMembers.length}명</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={playerCount.toString()} onValueChange={handlePlayerCountChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4명 (4v4)</SelectItem>
                <SelectItem value="5">5명 (5v5)</SelectItem>
                <SelectItem value="6">6명 (6v6)</SelectItem>
                <SelectItem value="7">7명 (7v7)</SelectItem>
                <SelectItem value="8">8명 (8v8)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tactical Board */}
      <div ref={containerRef} className="relative">
        <SoccerField>
          {/* Field players */}
          {fieldPlayers.map((position) => {
            const member = getMemberById(position.memberId);
            return (
              <PlayerMarker
                key={position.id}
                id={position.id}
                member={member}
                x={position.x}
                y={position.y}
                role={position.role}
                onPositionChange={updatePosition}
                containerRef={containerRef}
              />
            );
          })}
        </SoccerField>
      </div>

      {/* Substitutes */}
      {substitutes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">후보 선수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {substitutes.map((position) => {
                const member = getMemberById(position.memberId);
                return member ? (
                  <div
                    key={position.id}
                    className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                      SUB
                    </div>
                    <span className="text-sm font-medium">{member.name}</span>
                  </div>
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">포지션 범례</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-yellow-500 border-2 border-white" />
              <span className="text-sm">GK (골키퍼)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white" />
              <span className="text-sm">DF (수비수)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 border-2 border-white" />
              <span className="text-sm">MF (미드필더)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-500 border-2 border-white" />
              <span className="text-sm">FW (공격수)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white" />
              <span className="text-sm">SUB (후보)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
