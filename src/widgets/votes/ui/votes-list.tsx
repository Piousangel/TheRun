'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveVoteSessions } from '@/entities/vote/model/queries';
import { VoteCard } from '@/entities/vote/ui/vote-card';
import { VoteCreateForm } from '@/features/vote-create/ui/vote-create-form';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Plus } from 'lucide-react';

export function VotesList() {
  const router = useRouter();
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

  const matchVotes = sessions?.filter((s) => s.type === 'match') || [];
  const otherVotes = sessions?.filter((s) => s.type !== 'match') || [];

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">투표 관리</h2>
            <p className="text-sm text-muted-foreground mt-1">
              경기, 회식, 야유회 등 다양한 투표를 만들고 관리하세요
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            투표 생성
          </Button>
        </div>

        <Tabs defaultValue="match" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="match">⚽ 경기 ({matchVotes.length})</TabsTrigger>
            <TabsTrigger value="other">📌 기타 ({otherVotes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="match" className="mt-6">
            {matchVotes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">진행 중인 경기 투표가 없습니다.</p>
                <Button onClick={() => setIsCreateOpen(true)}>첫 투표 만들기</Button>
              </div>
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
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">진행 중인 기타 투표가 없습니다.</p>
                <Button onClick={() => setIsCreateOpen(true)}>첫 투표 만들기</Button>
              </div>
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

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 투표 생성</DialogTitle>
            <DialogDescription>
              경기, 회식, 야유회 등 다양한 이벤트 투표를 만들 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <VoteCreateForm onSuccess={handleCreateSuccess} />
        </DialogContent>
      </Dialog>
    </>
  );
}
