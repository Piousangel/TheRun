"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  CornerUpLeft,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
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
  initialSource?: string;
  initialMatchId?: string;
}

export function StrategyPageContent({
  initialTeam,
  initialSource,
  initialMatchId,
}: StrategyPageContentProps) {
  const { isAdmin } = useAuth();
  const { teams, teamCount } = useTeamSplitStore();
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TeamTab>(() =>
    normalizeTab(initialTeam ?? null),
  );

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

      {initialSource === "match" ? (
        <Card className="border-primary/20 bg-[linear-gradient(160deg,rgba(200,168,88,0.1),rgba(255,255,255,0.98))]">
          <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary">
                Context linked
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight">
                경기 운영 화면에서 바로 전략으로 넘어왔습니다
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                현재 경기 흐름을 놓치지 않도록, 이 전략 보드는 매치 운영과
                이어진 맥락으로 열렸습니다.
              </p>
            </div>
            {initialMatchId ? (
              <Link
                href={`/matches/${initialMatchId}`}
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/85 px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/35 hover:bg-primary/5"
              >
                <CornerUpLeft className="h-4 w-4 text-primary" />
                경기 운영으로 돌아가기
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="overflow-hidden border-primary/15 bg-[radial-gradient(circle_at_top,rgba(200,168,88,0.14),transparent_34%),linear-gradient(180deg,rgba(18,18,20,0.98),rgba(28,28,31,0.96))] text-white shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-primary" />
              전략 허브
            </CardTitle>
            <CardDescription className="text-white/68">
              팀 분배부터 팀별 전술 보드 진입까지 경기 전 운영 동선을 하나의
              공간으로 묶었습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">
                Step 01
              </p>
              <p className="mt-3 text-base font-semibold">팀 배정 확정</p>
              <p className="mt-2 text-sm leading-6 text-white/64">
                자동 밸런싱으로 초안을 만들고 수동 배정으로 마무리합니다.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">
                Step 02
              </p>
              <p className="mt-3 text-base font-semibold">포지션 전략 점검</p>
              <p className="mt-2 text-sm leading-6 text-white/64">
                팀별 전술 탭에서 롱프레스 이동과 역할 변경으로 포지션을
                다듬습니다.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">
                Step 03
              </p>
              <p className="mt-3 text-base font-semibold">경기 운영 연결</p>
              <p className="mt-2 text-sm leading-6 text-white/64">
                정리된 팀 구성을 곧바로 경기 상세 운영 화면과 연결합니다.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/15 bg-[linear-gradient(160deg,rgba(200,168,88,0.08),rgba(255,255,255,0.98))]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary" />
              빠른 팀 진입
            </CardTitle>
            <CardDescription>
              지금 바로 전략을 다듬을 수 있는 팀만 빠르게 열 수 있게
              정리했습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableTeams.length > 0 ? (
              availableTeams.map((team) => (
                <Link
                  key={team}
                  href={`/strategy?team=${team}`}
                  className="flex items-center justify-between rounded-2xl border bg-background/85 px-4 py-4 transition-all hover:border-primary/25 hover:bg-primary/5"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      Team {team} 전술 보드
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      배정된 멤버 {teams[team]?.length ?? 0}명 · 바로 포지션
                      정렬
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary" />
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed bg-background/75 px-4 py-5 text-sm text-muted-foreground">
                아직 멤버가 배정된 팀이 없습니다. 먼저 팀 나누기 탭에서 배정을
                완료해주세요.
              </div>
            )}
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
