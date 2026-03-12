"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { MemberAvatar } from "@/entities/member/ui/member-avatar";
import { Badge } from "@/shared/ui/badge";
import { StatePanel } from "@/shared/ui/state-panel";
import { Trophy, Target, Users as UsersIcon, Hand } from "lucide-react";
import type { Member } from "@/shared/types/member";
import type { PlayerMatchRecord } from "@/shared/types/match";

interface MatchStatisticsProps {
  teamName: string;
  teamMembers: Member[];
  playerRecords: PlayerMatchRecord[];
}

export function MatchStatistics({
  teamName,
  teamMembers,
  playerRecords,
}: MatchStatisticsProps) {
  const getMemberById = (memberId: string) => {
    return teamMembers.find((m) => m.id === memberId);
  };

  const sortedByGoals = [...playerRecords]
    .filter((p) => p.goals > 0)
    .sort((a, b) => b.goals - a.goals);

  const sortedByAssists = [...playerRecords]
    .filter((p) => p.assists > 0)
    .sort((a, b) => b.assists - a.assists);

  const sortedBySaves = [...playerRecords]
    .filter((p) => p.saves > 0)
    .sort((a, b) => b.saves - a.saves);

  const mvpPlayer = playerRecords.find((p) => p.is_mvp);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {teamName} 개인 기록
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* MVP */}
          {mvpPlayer && (
            <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-primary" />
                <div className="flex items-center gap-2 flex-1">
                  {getMemberById(mvpPlayer.member_id) && (
                    <>
                      <MemberAvatar
                        src={getMemberById(mvpPlayer.member_id)!.profile_photo}
                        alt={getMemberById(mvpPlayer.member_id)!.name}
                        size="sm"
                      />
                      <div>
                        <p className="font-bold text-lg">
                          {getMemberById(mvpPlayer.member_id)!.name}
                        </p>
                        <p className="text-sm text-muted-foreground">MVP</p>
                      </div>
                    </>
                  )}
                </div>
                <Badge variant="default" className="text-lg px-3 py-1">
                  ⭐ MVP
                </Badge>
              </div>
            </div>
          )}

          {/* Goals */}
          {sortedByGoals.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">득점 순위</h3>
              </div>
              <div className="space-y-2">
                {sortedByGoals.map((record, index) => {
                  const member = getMemberById(record.member_id);
                  if (!member) return null;
                  return (
                    <div
                      key={record.member_id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-muted-foreground w-6">
                          {index + 1}위
                        </span>
                        <MemberAvatar
                          src={member.profile_photo}
                          alt={member.name}
                          size="sm"
                        />
                        <span className="text-sm font-medium">
                          {member.name}
                        </span>
                      </div>
                      <Badge variant="secondary">⚽ {record.goals}골</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assists */}
          {sortedByAssists.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">어시스트 순위</h3>
              </div>
              <div className="space-y-2">
                {sortedByAssists.map((record, index) => {
                  const member = getMemberById(record.member_id);
                  if (!member) return null;
                  return (
                    <div
                      key={record.member_id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-muted-foreground w-6">
                          {index + 1}위
                        </span>
                        <MemberAvatar
                          src={member.profile_photo}
                          alt={member.name}
                          size="sm"
                        />
                        <span className="text-sm font-medium">
                          {member.name}
                        </span>
                      </div>
                      <Badge variant="secondary">🎯 {record.assists}도움</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Saves */}
          {sortedBySaves.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Hand className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">선방 순위</h3>
              </div>
              <div className="space-y-2">
                {sortedBySaves.map((record, index) => {
                  const member = getMemberById(record.member_id);
                  if (!member) return null;
                  return (
                    <div
                      key={record.member_id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-muted-foreground w-6">
                          {index + 1}위
                        </span>
                        <MemberAvatar
                          src={member.profile_photo}
                          alt={member.name}
                          size="sm"
                        />
                        <span className="text-sm font-medium">
                          {member.name}
                        </span>
                      </div>
                      <Badge variant="secondary">🧤 {record.saves}선방</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {sortedByGoals.length === 0 &&
            sortedByAssists.length === 0 &&
            sortedBySaves.length === 0 &&
            !mvpPlayer && (
              <StatePanel
                title="아직 저장된 개인 기록이 없습니다"
                description="득점, 어시스트, 선방, MVP가 저장되면 이곳에서 팀별 개인 기록을 바로 확인할 수 있습니다."
                tone="muted"
              />
            )}
        </CardContent>
      </Card>
    </div>
  );
}
