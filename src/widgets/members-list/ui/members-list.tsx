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
import { PageHero } from '@/shared/ui/page-hero';
import { StatePanel } from '@/shared/ui/state-panel';
import { StatTile } from '@/shared/ui/stat-tile';
import { Badge } from '@/shared/ui/badge';
import { Plus, Users, ShieldCheck } from 'lucide-react';

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
        <PageHero
          eyebrow="Members"
          title="클럽 멤버 디렉토리"
          description={isAdmin ? '프로필, 전화번호, 스탯 정보를 관리하고 신규 멤버를 바로 등록할 수 있습니다.' : '멤버 조회는 가능하지만 생성/수정/삭제는 관리자만 가능합니다.'}
          meta={<>
            <Badge variant="secondary">총 멤버 {members?.length ?? 0}명</Badge>
            <Badge variant="secondary">권한 {isAdmin ? '관리자' : '일반 멤버'}</Badge>
          </>}
          actions={isAdmin ? (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              멤버 추가
            </Button>
          ) : undefined}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <StatTile label="등록 멤버" value={members?.length ?? 0} icon={<Users className="h-5 w-5" />} />
          <StatTile label="관리 가능 여부" value={isAdmin ? 'YES' : 'READ'} icon={<ShieldCheck className="h-5 w-5" />} tone={isAdmin ? 'success' : 'muted'} />
          <StatTile label="프로필 운영" value={isAdmin ? '편집 가능' : '조회 전용'} icon={<Users className="h-5 w-5" />} tone="muted" />
        </div>

        {members && members.length === 0 ? (
          <StatePanel
            icon={<Users className="h-6 w-6" />}
            title="등록된 멤버가 아직 없습니다"
            description={isAdmin ? '멤버를 먼저 등록해야 투표, 출석, 팀 나누기, 경기 기록 흐름이 자연스럽게 연결됩니다.' : '운영진이 멤버를 등록하면 이곳에서 프로필과 스탯을 확인할 수 있습니다.'}
            action={isAdmin ? <Button onClick={() => setIsCreateOpen(true)}>첫 멤버 추가하기</Button> : undefined}
          />
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
