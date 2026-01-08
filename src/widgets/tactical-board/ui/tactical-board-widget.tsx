'use client';

import { useRef, useEffect, useState } from 'react';
import { useTeamSplitStore } from '@/features/team-split-manual/model/store';
import { useTacticalBoardStore } from '@/features/tactical-board/model/store';
import { generateDefaultFormation } from '@/features/tactical-board/model/formations';
import { generateOpponentFormation } from '@/features/tactical-board/model/opponent-formation';
import { SoccerField } from '@/entities/field/ui/soccer-field';
import { PlayerMarker } from '@/features/tactical-board/ui/player-marker';
import { OpponentMarker } from '@/features/tactical-board/ui/opponent-marker';
import { PositionSlot } from '@/features/tactical-board/ui/position-slot';
import { PositionChangeMenu } from '@/features/tactical-board/ui/position-change-menu';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { RotateCcw, Users, ArrowLeftRight } from 'lucide-react';
import type { PlayerPosition, PositionRole } from '@/shared/types/formation';

interface TacticalBoardWidgetProps {
  teamName: string;
}

type TeamName = 'A' | 'B' | 'C' | 'D';

export function TacticalBoardWidget({ teamName }: TacticalBoardWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { teams } = useTeamSplitStore();
  const { positions, playerCount, setPositions, updatePositionRole, setPlayerCount, swapPlayers } = useTacticalBoardStore();
  const [showOpponents, setShowOpponents] = useState(true);
  const [substituteToSwap, setSubstituteToSwap] = useState<PlayerPosition | null>(null);
  const [positionMenu, setPositionMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    playerPosition: PlayerPosition | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    playerPosition: null,
  });

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

  const handlePlayerClick = (position: PlayerPosition, e: React.MouseEvent) => {
    if (substituteToSwap) {
      // Swap substitute with this field player
      swapPlayers(substituteToSwap.id, position.id);
      setSubstituteToSwap(null);
    } else if (position.role !== 'SUB') {
      // Show position change menu for field players only
      setPositionMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        playerPosition: position,
      });
    }
  };

  const handlePositionRoleChange = (role: PositionRole) => {
    if (positionMenu.playerPosition) {
      updatePositionRole(positionMenu.playerPosition.id, role);
    }
  };

  const handleSubstituteClick = (subPosition: PlayerPosition) => {
    if (substituteToSwap && substituteToSwap.id === subPosition.id) {
      // Cancel selection
      setSubstituteToSwap(null);
    } else {
      // Select this substitute for swapping
      setSubstituteToSwap(subPosition);
    }
  };

  const handleEmptySlotClick = (position: PlayerPosition) => {
    if (substituteToSwap) {
      // Move substitute to this empty slot
      swapPlayers(substituteToSwap.id, position.id);
      setSubstituteToSwap(null);
    }
  };

  const fieldPlayers = positions.filter((p) => p.role !== 'SUB');
  const substitutes = positions.filter((p) => p.role === 'SUB');
  const opponentPositions = generateOpponentFormation(playerCount);

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
                선수를 클릭하여 포지션 변경 (GK, DF, MF, FW)
              </CardDescription>
            </div>
            <Badge variant="secondary">{teamMembers.length}명</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
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
            <Button
              onClick={() => setShowOpponents(!showOpponents)}
              variant={showOpponents ? 'default' : 'outline'}
            >
              {showOpponents ? '상대팀 숨기기' : '상대팀 보기'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tactical Board */}
      <div ref={containerRef} className="relative">
        <SoccerField>
          {/* Opponent markers */}
          {showOpponents && opponentPositions.map((pos, index) => (
            <OpponentMarker
              key={`opponent-${index}`}
              x={pos.x}
              y={pos.y}
              role={pos.role}
            />
          ))}

          {/* Position slots (show all slots, including empty ones) */}
          {fieldPlayers.map((position) => (
            <PositionSlot
              key={`slot-${position.id}`}
              x={position.x}
              y={position.y}
              role={position.role}
              isEmpty={!position.memberId}
              onClick={() => handleEmptySlotClick(position)}
            />
          ))}

          {/* Field players (only render if slot has a player) */}
          {fieldPlayers.map((position) => {
            const member = getMemberById(position.memberId);
            if (!member) return null; // Skip empty slots

            return (
              <PlayerMarker
                key={position.id}
                id={position.id}
                member={member}
                x={position.x}
                y={position.y}
                role={position.role}
                onPositionChange={() => {}} // No drag functionality
                containerRef={containerRef}
                onClick={(e) => handlePlayerClick(position, e)}
                isSelected={substituteToSwap ? true : false}
              />
            );
          })}
        </SoccerField>
      </div>

      {/* Substitutes */}
      {substitutes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              후보 선수 ({substitutes.length}명)
            </CardTitle>
            <CardDescription>
              {substituteToSwap
                ? '교체할 필드 선수를 선택하세요'
                : '후보 선수를 클릭 후 필드 선수를 클릭하여 교체하세요'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {substitutes.map((position) => {
                const member = getMemberById(position.memberId);
                return member ? (
                  <button
                    key={position.id}
                    onClick={() => handleSubstituteClick(position)}
                    className={`flex items-center gap-2 p-2 rounded-lg hover:bg-muted/80 transition-colors cursor-pointer ${
                      substituteToSwap?.id === position.id
                        ? 'bg-primary/20 border-2 border-primary'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                      SUB
                    </div>
                    <span className="text-sm font-medium">{member.name}</span>
                    <ArrowLeftRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </button>
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">범례</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-yellow-500 border-2 border-white" />
              <span className="text-sm">우리팀 GK</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white" />
              <span className="text-sm">우리팀 DF</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 border-2 border-white" />
              <span className="text-sm">우리팀 MF</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-500 border-2 border-white" />
              <span className="text-sm">우리팀 FW</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-500 border-2 border-dashed border-gray-400 opacity-40" />
              <span className="text-sm">상대팀</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white" />
              <span className="text-sm">후보</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Position Change Menu */}
      <PositionChangeMenu
        isOpen={positionMenu.isOpen}
        position={positionMenu.position}
        currentRole={positionMenu.playerPosition?.role || 'DF'}
        onSelectRole={handlePositionRoleChange}
        onClose={() => setPositionMenu({ isOpen: false, position: { x: 0, y: 0 }, playerPosition: null })}
      />
    </div>
  );
}
