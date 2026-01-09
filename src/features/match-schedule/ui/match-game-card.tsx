"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Badge } from "@/shared/ui/badge";
import { useTeamSplitStore } from "@/features/team-split-manual/model/store";
import { Play, Trash2 } from "lucide-react";

interface MatchGameCardProps {
  matchNumber: number;
  voteSessionId: string;
  voteTitle: string;
  eventDate: string;
  onDelete?: () => void;
}

type TeamName = "A" | "B" | "C" | "D";

export function MatchGameCard({
  matchNumber,
  voteSessionId,
  voteTitle,
  eventDate,
  onDelete,
}: MatchGameCardProps) {
  const router = useRouter();
  const { teams, teamCount } = useTeamSplitStore();
  const [selectedTeamA, setSelectedTeamA] = useState<TeamName | null>(null);
  const [selectedTeamB, setSelectedTeamB] = useState<TeamName | null>(null);
  const [selectedTacticsTeam, setSelectedTacticsTeam] =
    useState<TeamName | null>(null);

  const TEAM_NAMES: TeamName[] = ["A", "B", "C", "D"];
  const activeTeams = TEAM_NAMES.slice(0, teamCount).filter(
    (t) => teams[t].length > 0
  );

  const handleGoToTactics = () => {
    if (selectedTacticsTeam) {
      router.push(`/team-division/${selectedTacticsTeam}`);
    }
  };

  const canGoToTactics =
    selectedTacticsTeam && teams[selectedTacticsTeam]?.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{matchNumber}경기</CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {new Date(eventDate).toLocaleDateString("ko-KR")}
            </Badge>
            {onDelete && (
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
            <label className="text-sm font-medium">1 Team</label>
            <Select
              value={selectedTeamA || ""}
              onValueChange={(v) => setSelectedTeamA(v as TeamName)}
            >
              <SelectTrigger>
                <SelectValue placeholder="팀 선택" />
              </SelectTrigger>
              <SelectContent>
                {activeTeams.map((team) => (
                  <SelectItem
                    key={team}
                    value={team}
                    disabled={team === selectedTeamB}
                  >
                    Team {team} ({teams[team].length}명)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">2 Team</label>
            <Select
              value={selectedTeamB || ""}
              onValueChange={(v) => setSelectedTeamB(v as TeamName)}
            >
              <SelectTrigger>
                <SelectValue placeholder="팀 선택" />
              </SelectTrigger>
              <SelectContent>
                {activeTeams.map((team) => (
                  <SelectItem
                    key={team}
                    value={team}
                    disabled={team === selectedTeamA}
                  >
                    Team {team} ({teams[team].length}명)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Match Display */}
        {selectedTeamA && selectedTeamB && (
          <div className="flex items-center justify-center gap-4 py-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                Team {selectedTeamA}
              </div>
              <div className="text-sm text-muted-foreground">
                {teams[selectedTeamA].length}명
              </div>
            </div>
            <div className="text-2xl font-bold text-muted-foreground">vs</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                Team {selectedTeamB}
              </div>
              <div className="text-sm text-muted-foreground">
                {teams[selectedTeamB].length}명
              </div>
            </div>
          </div>
        )}

        {/* Tactics Board Selection */}
        {selectedTeamA && selectedTeamB && (
          <div className="space-y-3">
            <label className="text-sm font-medium">전술 보드 보기</label>
            <div className="flex gap-2">
              <Select
                value={selectedTacticsTeam || ""}
                onValueChange={(v) => setSelectedTacticsTeam(v as TeamName)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="팀 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={selectedTeamA}>
                    Team {selectedTeamA} 전술 보드
                  </SelectItem>
                  <SelectItem value={selectedTeamB}>
                    Team {selectedTeamB} 전술 보드
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleGoToTactics}
                disabled={!canGoToTactics}
                className="w-auto"
              >
                <Play className="mr-2 h-4 w-4" />
                전술 보드 이동
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
