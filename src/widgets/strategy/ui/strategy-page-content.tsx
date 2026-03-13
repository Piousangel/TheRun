"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, Shield, Sparkles, Users } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useTeamSplitStore } from "@/features/team-split-manual/model/store";
import { TeamSplitAuto } from "@/features/team-split-auto/ui/team-split-auto";
import { TeamSplitManual } from "@/features/team-split-manual/ui/team-split-manual";
import { TacticalBoardWidget } from "@/widgets/tactical-board/ui/tactical-board-widget";
import { Badge } from "@/shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { PageHero } from "@/shared/ui/page-hero";
import { StatePanel } from "@/shared/ui/state-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

type TeamCode = "A" | "B" | "C" | "D";
type TeamTab = "division" | TeamCode;

function normalizeTab(value: string | null): TeamTab {
  if (!value) {
    return "division";
  }

  const normalized = value.toUpperCase();

  if (normalized === "DIVISION") {
    return "division";
  }

  if (["A", "B", "C", "D"].includes(normalized)) {
    return normalized as TeamTab;
  }

  return "division";
}

interface StrategyPageContentProps {
  initialTeam?: string;
}

export function StrategyPageContent({ initialTeam }: StrategyPageContentProps) {
  const { isAdmin } = useAuth();
  const { teams, teamCount } = useTeamSplitStore();
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TeamTab>(() => normalizeTab(initialTeam ?? null));

  const availableTeams = useMemo<TeamCode[]>(() => {
    const labels: TeamCode[] = ["A", "B", "C", "D"];

    return labels.filter((team) => {
      const index = labels.indexOf(team) + 1;
      return index <= teamCount && teams[team]?.length > 0;
    });
  }, [teamCount, teams]);

  useEffect(() => {
    const requestedTab = normalizeTab(initialTeam ?? null);
    const fallbackTab = availableTeams[0] ?? "division";
    const nextTab =
      requestedTab === "division" || availableTeams.includes(requestedTab)
        ? requestedTab
        : fallbackTab;
    setActiveTab(nextTab);
  }, [availableTeams, initialTeam]);

  if (!isAdmin) {
    return (
      <StatePanel
        icon={<Shield className="h-6 w-6" />}
        title="전략 워크스페이스는 관리자 전용입니다"
        description="팀 분배, 전술 보드, 경기 전 포지션 전략은 운영자만 열 수 있습니다. 일반 멤버는 경기와 응답 흐름에 집중할 수 있도록 분리했습니다."
        tone="warning"
      />
    );
  }

  const handleTabChange = (value: string) => {
    const nextTab = normalizeTab(value);
    setActiveTab(nextTab);

    if (nextTab === "division") {
      router.replace(pathname, { scroll: false });
      return;
    }

    router.replace(`${pathname}?team=${nextTab}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Strategy Workspace"
        title="팀 구성과 전술 흐름을 한 화면에 모았습니다"
        description="팀 나누기, 전술 보드, 경기 전 운영 판단을 분절된 화면 대신 하나의 전략 워크스페이스로 정리했습니다. 팀 구성이 끝나면 바로 각 팀 전술 보드로 내려가 포지션까지 이어서 맞출 수 있습니다."
        meta={
          <>
            <Badge variant="secondary">관리자 전용</Badge>
            <Badge variant="secondary">수동 + 자동 배정</Badge>
            <Badge variant="secondary">팀별 전술 보드</Badge>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/15 bg-[linear-gradient(160deg,rgba(200,168,88,0.08),rgba(255,255,255,0.98))]">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-[0.18em] text-primary">
              Current split
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {teamCount} teams
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              현재 구성된 팀 수 기준으로 전술 탭이 자동 정리됩니다.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Ready boards
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {availableTeams.length}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              멤버가 배정된 팀만 전술 보드를 바로 열 수 있습니다.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Flow
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              Split → Tactics
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              팀 나누기 이후 포지션 전략까지 끊기지 않도록 한 흐름으로
              연결했습니다.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            전략 작업 흐름
          </CardTitle>
          <CardDescription>
            먼저 팀 분배를 정리하고, 그 다음 팀별 전술 탭에서 포지션과 후보 교체
            흐름을 맞추는 방식으로 운영합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-muted/40 p-2 md:grid-cols-5">
              <TabsTrigger value="division" className="rounded-xl py-2">
                팀 나누기
              </TabsTrigger>
              {availableTeams.map((team) => (
                <TabsTrigger
                  key={team}
                  value={team}
                  className="rounded-xl py-2"
                >
                  Team {team}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="division" className="mt-6 space-y-6">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-4 w-4 text-primary" />팀 배정 원칙
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      - 먼저 자동 밸런싱으로 초안을 만들고, 필요하면 수동으로
                      미세 조정합니다.
                    </p>
                    <p>
                      - 배정이 끝난 팀만 아래 전술 탭에 노출되어 경기 전 흐름이
                      자연스럽게 이어집니다.
                    </p>
                    <p>
                      - 전략 탭은 실제 경기 운영 직전에 빠르게 확인하는 용도로
                      밀도를 낮게 유지합니다.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-primary/15 bg-[linear-gradient(160deg,rgba(200,168,88,0.08),rgba(255,255,255,0.98))]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="h-4 w-4 text-primary" />
                      운영 팁
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      - 후보 선수가 생기면 전술 보드에서 바로 교체 흐름까지
                      확인하세요.
                    </p>
                    <p>
                      - 팀 수가 바뀌면 전략 탭 구성도 자동으로 재정렬됩니다.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/40 p-1">
                  <TabsTrigger value="manual" className="rounded-xl py-2">
                    수동 배정
                  </TabsTrigger>
                  <TabsTrigger value="auto" className="rounded-xl py-2">
                    자동 밸런싱
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="manual" className="mt-6">
                  <TeamSplitManual />
                </TabsContent>
                <TabsContent value="auto" className="mt-6">
                  <TeamSplitAuto />
                </TabsContent>
              </Tabs>
            </TabsContent>

            {availableTeams.map((team) => (
              <TabsContent key={team} value={team} className="mt-6">
                <TacticalBoardWidget teamName={team} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
