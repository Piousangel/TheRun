'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { TeamSplitAuto } from '@/features/team-split-auto/ui/team-split-auto';
import { TeamSplitManual } from '@/features/team-split-manual/ui/team-split-manual';

export function TeamDivisionWidget() {
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
