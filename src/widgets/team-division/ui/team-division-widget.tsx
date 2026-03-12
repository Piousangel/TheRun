'use client';

import { useAuth } from '@/providers/auth-provider';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent } from '@/shared/ui/card';
import { PageHero } from '@/shared/ui/page-hero';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { TeamSplitAuto } from '@/features/team-split-auto/ui/team-split-auto';
import { TeamSplitManual } from '@/features/team-split-manual/ui/team-split-manual';

export function TeamDivisionWidget() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          팀 나누기와 전술 보드는 현재 관리자 운영 화면입니다. 일반 멤버는 경기/투표/출석 흐름에 집중할 수 있도록 분리했습니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Team Division"
        title="팀 구성 보드"
        description="수동 배정과 자동 밸런싱을 오가며 경기 전 팀 구성을 빠르게 확정합니다."
        meta={<>
          <Badge variant="secondary">관리자 전용</Badge>
          <Badge variant="secondary">수동 + 자동 지원</Badge>
        </>}
      />

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">수동 배정</TabsTrigger>
          <TabsTrigger value="auto">자동 밸런싱</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-6">
          <TeamSplitManual />
        </TabsContent>

        <TabsContent value="auto" className="mt-6">
          <TeamSplitAuto />
        </TabsContent>
      </Tabs>
    </div>
  );
}
