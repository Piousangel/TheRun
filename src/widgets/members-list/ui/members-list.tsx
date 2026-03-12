'use client';

import { useState } from 'react';
import { useMembers } from '@/entities/member/model/queries';
import { MemberCard } from '@/entities/member/ui/member-card';
import { MemberCreateForm } from '@/features/member-create/ui/member-create-form';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { LoadingState } from '@/shared/ui/loading-spinner';
import { Plus } from 'lucide-react';

export function MembersList() {
  const { data: members, isLoading, error } = useMembers();
  const { isAdmin } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
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
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-destructive">오류가 발생했습니다: {error.message}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold">멤버 목록</h2>
            {!isAdmin && (
              <p className="text-sm text-muted-foreground mt-1">멤버 조회는 가능하지만 생성/수정/삭제는 관리자만 할 수 있습니다.</p>
            )}
          </div>
          {isAdmin && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              멤버 추가
            </Button>
          )}
        </div>

        {members && members.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">아직 등록된 멤버가 없습니다.</p>
            {isAdmin && <Button onClick={() => setIsCreateOpen(true)}>첫 멤버 추가하기</Button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {members?.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>

      {isAdmin && (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>새 멤버 추가</DialogTitle>
              <DialogDescription>
                새로운 팀 멤버를 등록합니다.
              </DialogDescription>
            </DialogHeader>
            <MemberCreateForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
