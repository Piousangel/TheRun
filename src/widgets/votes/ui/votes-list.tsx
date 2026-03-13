"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useActiveVoteSessions } from "@/entities/vote/model/queries";
import { VoteCard } from "@/entities/vote/ui/vote-card";
import { VoteCreateForm } from "@/features/vote-create/ui/vote-create-form";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/shared/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { LoadingState } from "@/shared/ui/loading-spinner";
import { PageHero } from "@/shared/ui/page-hero";
import { StatePanel } from "@/shared/ui/state-panel";
import { StatTile } from "@/shared/ui/stat-tile";
import { Badge } from "@/shared/ui/badge";
import { CalendarClock, Plus, Vote as VoteIcon } from "lucide-react";

export function VotesList() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { data: sessions, isLoading, error } = useActiveVoteSessions();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
  };

  const handleVoteClick = (sessionId: string) => {
    router.push(`/votes/${sessionId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px]">
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <StatePanel
        icon={<VoteIcon className="h-6 w-6" />}
        title="투표 운영 보드를 불러오는 중 문제가 생겼습니다"
        description={`잠시 후 다시 시도해주세요. 세션 데이터를 읽는 중 오류가 발생했습니다. (${error.message})`}
        tone="warning"
      />
    );
  }

  const matchVotes = sessions?.filter((s) => s.type === "match") || [];
  const otherVotes = sessions?.filter((s) => s.type !== "match") || [];

  return (
    <>
      <div className="space-y-6">
        <PageHero
          eyebrow="Votes"
          title="투표 운영 보드"
          description="경기와 기타 이벤트 응답을 한 곳에서 관리하고, 마감 전 필요한 액션을 빠르게 확인합니다."
          meta={
            <>
              <Badge variant="secondary">경기 투표 {matchVotes.length}개</Badge>
              <Badge variant="secondary">기타 투표 {otherVotes.length}개</Badge>
              <Badge variant="secondary">
                관리자 생성 권한 {isAdmin ? "활성" : "비활성"}
              </Badge>
            </>
          }
          actions={
            isAdmin ? (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                투표 생성
              </Button>
            ) : undefined
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <StatTile
            label="활성 경기 투표"
            value={matchVotes.length}
            icon={<VoteIcon className="h-5 w-5" />}
          />
          <StatTile
            label="기타 이벤트"
            value={otherVotes.length}
            icon={<CalendarClock className="h-5 w-5" />}
          />
          <StatTile
            label="총 진행 수"
            value={sessions?.length ?? 0}
            icon={<VoteIcon className="h-5 w-5" />}
            tone="muted"
          />
        </div>

        <Tabs defaultValue="match" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="match">
              ⚽ 경기 ({matchVotes.length})
            </TabsTrigger>
            <TabsTrigger value="other">
              📌 기타 ({otherVotes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="match" className="mt-6">
            {matchVotes.length === 0 ? (
              <StatePanel
                icon={<VoteIcon className="h-6 w-6" />}
                title="열려 있는 경기 투표가 없습니다"
                description={
                  isAdmin
                    ? "경기 운영을 시작하기 전에 이번 주 경기 참석 여부 투표를 열어두면 팀 구성과 출석 흐름이 쉬워집니다."
                    : "운영진이 경기 투표를 열면 이곳에서 바로 응답할 수 있습니다."
                }
                action={
                  isAdmin ? (
                    <Button onClick={() => setIsCreateOpen(true)}>
                      첫 투표 만들기
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchVotes.map((session) => (
                  <VoteCard
                    key={session.id}
                    session={session}
                    onVoteClick={() => handleVoteClick(session.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="other" className="mt-6">
            {otherVotes.length === 0 ? (
              <StatePanel
                icon={<CalendarClock className="h-6 w-6" />}
                title="진행 중인 기타 투표가 없습니다"
                description={
                  isAdmin
                    ? "회식, 야유회, 번개 같은 비경기 이벤트도 같은 투표 흐름으로 운영할 수 있습니다."
                    : "운영진이 새 이벤트 투표를 열면 이곳에서 바로 확인할 수 있습니다."
                }
                action={
                  isAdmin ? (
                    <Button onClick={() => setIsCreateOpen(true)}>
                      첫 투표 만들기
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherVotes.map((session) => (
                  <VoteCard
                    key={session.id}
                    session={session}
                    onVoteClick={() => handleVoteClick(session.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {isAdmin && (
        <Drawer open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>새 투표 생성</DrawerTitle>
              <DrawerDescription>
                경기, 회식, 번개 같은 이벤트를 같은 운영 흐름 안에서 관리할 수
                있게 만듭니다.
              </DrawerDescription>
            </DrawerHeader>
            <VoteCreateForm onSuccess={handleCreateSuccess} />
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
