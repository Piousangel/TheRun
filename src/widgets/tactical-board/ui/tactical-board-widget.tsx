"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { useTeamSplitStore } from "@/features/team-split-manual/model/store";
import { useTacticalBoardStore } from "@/features/tactical-board/model/store";
import { generateDefaultFormation } from "@/features/tactical-board/model/formations";
import { generateOpponentFormation } from "@/features/tactical-board/model/opponent-formation";
import { SoccerField } from "@/entities/field/ui/soccer-field";
import { PlayerMarker } from "@/features/tactical-board/ui/player-marker";
import { OpponentMarker } from "@/features/tactical-board/ui/opponent-marker";
import { PositionSlot } from "@/features/tactical-board/ui/position-slot";
import { PositionChangeMenu } from "@/features/tactical-board/ui/position-change-menu";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Badge } from "@/shared/ui/badge";
import { RotateCcw, Users, ArrowLeftRight } from "lucide-react";
import type { PlayerPosition, PositionRole } from "@/shared/types/formation";

interface TacticalBoardWidgetProps {
  teamName: string;
}

type TeamName = "A" | "B" | "C" | "D";

export function TacticalBoardWidget({ teamName }: TacticalBoardWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { teams } = useTeamSplitStore();
  const { positions, playerCount, setPositions, setPlayerCount, swapPlayers } =
    useTacticalBoardStore();
  const [showOpponents, setShowOpponents] = useState(true);
  const [substituteToSwap, setSubstituteToSwap] =
    useState<PlayerPosition | null>(null);
  const [movingFieldPlayer, setMovingFieldPlayer] =
    useState<PlayerPosition | null>(null);
  const [positionMenu, setPositionMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    playerPositionId: string | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    playerPositionId: null,
  });

  const teamMembers = useMemo(
    () => teams[teamName as TeamName] || [],
    [teamName, teams],
  );

  // Initialize formation when component mounts or team changes
  useEffect(() => {
    if (teamMembers.length > 0 && positions.length === 0) {
      const defaultPositions = generateDefaultFormation(
        teamMembers,
        playerCount,
      );
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
    if (movingFieldPlayer) {
      if (movingFieldPlayer.id === position.id) {
        setMovingFieldPlayer(null);
        return;
      }

      swapPlayers(movingFieldPlayer.id, position.id);
      setMovingFieldPlayer(null);
      setPositionMenu({
        isOpen: false,
        position: { x: 0, y: 0 },
        playerPositionId: null,
      });
      return;
    }

    if (substituteToSwap) {
      // Swap substitute with this field player
      swapPlayers(substituteToSwap.id, position.id);
      setSubstituteToSwap(null);
      setPositionMenu({
        isOpen: false,
        position: { x: 0, y: 0 },
        playerPositionId: null,
      });
    } else if (position.role !== "SUB") {
      // Show position change menu for field players only
      setPositionMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        playerPositionId: position.id,
      });
    }
  };

  const handleFieldPlayerLongPress = (position: PlayerPosition) => {
    if (position.role === "SUB") return;

    setSubstituteToSwap(null);
    setPositionMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
      playerPositionId: null,
    });
    setMovingFieldPlayer(position);
  };

  const handlePositionRoleChange = (role: PositionRole) => {
    const currentPosition = positions.find(
      (position) => position.id === positionMenu.playerPositionId,
    );

    if (!currentPosition) {
      setPositionMenu({
        isOpen: false,
        position: { x: 0, y: 0 },
        playerPositionId: null,
      });
      return;
    }

    // If same role, just close menu
    if (currentPosition.role === role) {
      setPositionMenu({
        isOpen: false,
        position: { x: 0, y: 0 },
        playerPositionId: null,
      });
      return;
    }

    const targetSlots = positions.filter(
      (p) => p.role === role && p.role !== "SUB",
    );

    const emptySlot = targetSlots.find((p) => !p.memberId);

    if (emptySlot) {
      const updatedPositions = positions.map((p) => {
        if (p.id === currentPosition.id) {
          return {
            ...p,
            memberId: null,
          };
        }
        if (p.id === emptySlot.id) {
          return {
            ...p,
            memberId: currentPosition.memberId,
          };
        }
        return p;
      });
      setPositions(updatedPositions);
    } else {
      const occupiedSlot = targetSlots[0];
      if (occupiedSlot) {
        const updatedPositions = positions.map((p) => {
          if (p.id === currentPosition.id) {
            return {
              ...p,
              memberId: occupiedSlot.memberId,
            };
          }
          if (p.id === occupiedSlot.id) {
            return {
              ...p,
              memberId: currentPosition.memberId,
            };
          }
          return p;
        });
        setPositions(updatedPositions);
      }
    }

    setPositionMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
      playerPositionId: null,
    });
  };

  const handleSubstituteClick = (subPosition: PlayerPosition) => {
    setMovingFieldPlayer(null);
    setPositionMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
      playerPositionId: null,
    });
    if (substituteToSwap && substituteToSwap.id === subPosition.id) {
      // Cancel selection
      setSubstituteToSwap(null);
    } else {
      // Select this substitute for swapping
      setSubstituteToSwap(subPosition);
    }
  };

  const handleEmptySlotClick = (position: PlayerPosition) => {
    if (movingFieldPlayer) {
      if (movingFieldPlayer.id !== position.id) {
        swapPlayers(movingFieldPlayer.id, position.id);
      }
      setMovingFieldPlayer(null);
      setPositionMenu({
        isOpen: false,
        position: { x: 0, y: 0 },
        playerPositionId: null,
      });
      return;
    }

    if (substituteToSwap) {
      // Move substitute to this empty slot
      swapPlayers(substituteToSwap.id, position.id);
      setSubstituteToSwap(null);
    }
  };

  const fieldPlayers = positions.filter((p) => p.role !== "SUB");
  const substitutes = positions.filter((p) => p.role === "SUB");
  const opponentPositions = generateOpponentFormation(playerCount);
  const activeMenuPosition = positions.find(
    (position) => position.id === positionMenu.playerPositionId,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/15 bg-[linear-gradient(160deg,rgba(200,168,88,0.08),rgba(255,255,255,0.98))]">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Team {teamName} 전술 보드
              </CardTitle>
              <CardDescription className="mt-1">
                탭하면 포지션 변경, 길게 누르면 원하는 고정 슬롯으로 이동합니다.
              </CardDescription>
            </div>
            <Badge variant="secondary">{teamMembers.length}명</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Interaction
              </p>
              <p className="mt-3 text-base font-semibold">
                {movingFieldPlayer
                  ? "이동 모드 활성화"
                  : substituteToSwap
                    ? "교체 모드 활성화"
                    : "탭 / 롱프레스 지원"}
              </p>
            </div>
            <div className="rounded-2xl border bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Formation
              </p>
              <p className="mt-3 text-base font-semibold">
                {playerCount}v{playerCount} 기준
              </p>
            </div>
            <div className="rounded-2xl border bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Board state
              </p>
              <p className="mt-3 text-base font-semibold">
                {showOpponents ? "상대팀 표시 중" : "우리팀만 집중"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select
              value={playerCount.toString()}
              onValueChange={handlePlayerCountChange}
            >
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
              variant={showOpponents ? "default" : "outline"}
            >
              {showOpponents ? "상대팀 숨기기" : "상대팀 보기"}
            </Button>
            {movingFieldPlayer ? (
              <Button
                onClick={() => {
                  setMovingFieldPlayer(null);
                  setPositionMenu({
                    isOpen: false,
                    position: { x: 0, y: 0 },
                    playerPositionId: null,
                  });
                }}
                variant="outline"
              >
                이동 취소
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Tactical Board */}
      <div ref={containerRef} className="relative">
        <SoccerField>
          {/* Opponent markers */}
          {showOpponents &&
            opponentPositions.map((pos, index) => (
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
              isVisible={movingFieldPlayer !== null || !position.memberId}
              isActive={movingFieldPlayer?.id === position.id}
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
                onLongPress={() => handleFieldPlayerLongPress(position)}
                isSelected={movingFieldPlayer?.id === position.id}
                isMoveMode={movingFieldPlayer?.id === position.id}
              />
            );
          })}
        </SoccerField>
      </div>

      {/* Substitutes */}
      {substitutes.length > 0 && (
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg">
              후보 선수 ({substitutes.length}명)
            </CardTitle>
            <CardDescription>
              {movingFieldPlayer
                ? "이동할 고정 슬롯이나 다른 필드 선수를 선택하세요"
                : substituteToSwap
                  ? "교체할 필드 선수를 선택하세요"
                  : "후보 선수를 클릭 후 필드 선수를 클릭하여 교체하세요"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {substitutes.map((position) => {
                const member = getMemberById(position.memberId);
                return member ? (
                  <button
                    key={position.id}
                    onClick={() => handleSubstituteClick(position)}
                    className={`flex items-center gap-2 rounded-2xl border p-3 transition-all cursor-pointer ${
                      substituteToSwap?.id === position.id
                        ? "border-primary bg-primary/15 shadow-[0_12px_30px_rgba(200,168,88,0.16)]"
                        : "border-border/70 bg-muted/60 hover:bg-muted/80"
                    }`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-slate-300 to-slate-500 text-xs font-bold text-white shadow-md">
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
      <Card className="border-border/70 bg-muted/20">
        <CardHeader>
          <CardTitle className="text-lg">범례</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-amber-300 to-yellow-500" />
              <span className="text-sm">우리팀 GK</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-sky-300 to-blue-500" />
              <span className="text-sm">우리팀 DF</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-emerald-300 to-green-500" />
              <span className="text-sm">우리팀 MF</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-rose-300 to-red-500" />
              <span className="text-sm">우리팀 FW</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full border-2 border-dashed border-gray-300 bg-white/10 opacity-70" />
              <span className="text-sm">상대팀</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-slate-300 to-slate-500" />
              <span className="text-sm">후보</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Position Change Menu */}
      <PositionChangeMenu
        isOpen={positionMenu.isOpen}
        position={positionMenu.position}
        currentRole={activeMenuPosition?.role || "DF"}
        onSelectRole={handlePositionRoleChange}
        onClose={() =>
          setPositionMenu({
            isOpen: false,
            position: { x: 0, y: 0 },
            playerPositionId: null,
          })
        }
      />
    </div>
  );
}
