'use client';

import { useMatches } from '@/entities/match/model/queries';
import { MatchCard } from '@/entities/match/ui/match-card';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';

export function MatchesList() {
  const { data: matches, isLoading, error } = useMatches();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-destructive">오류가 발생했습니다: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">경기 기록</h2>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          경기 추가 (준비 중)
        </Button>
      </div>

      {matches && matches.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">아직 등록된 경기가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches?.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
