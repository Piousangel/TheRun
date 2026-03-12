'use client';

import { useAuth } from '@/providers/auth-provider';
import { Card, CardContent } from '@/shared/ui/card';
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
      <div>
        <h2 className="text-2xl font-bold">팀 나누기</h2>
        <p className="text-sm text-muted-foreground mt-1">
          수동 또는 자동으로 균형잡힌 팀을 생성합니다
        </p>
      </div>

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
