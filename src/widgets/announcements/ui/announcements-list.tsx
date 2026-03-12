'use client';

import { useMemo, useState } from 'react';
import { Megaphone, Plus } from 'lucide-react';
import { useAnnouncements, useAnnouncementReads } from '@/entities/announcement/model/queries';
import { AnnouncementCard } from '@/entities/announcement/ui/announcement-card';
import { AnnouncementCreateForm } from '@/features/announcement-create/ui/announcement-create-form';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { LoadingState } from '@/shared/ui/loading-spinner';

export function AnnouncementsList() {
  const { user, isAdmin } = useAuth();
  const { data: announcements, isLoading, error } = useAnnouncements();
  const { data: reads } = useAnnouncementReads(user?.id ?? null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const readIds = useMemo(() => new Set((reads ?? []).map((read) => read.announcement_id)), [reads]);

  if (isLoading) {
    return <div className="min-h-[320px]"><LoadingState /></div>;
  }

  if (error) {
    return <div className="text-destructive">오류가 발생했습니다: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">공지 보드</h2>
          <p className="mt-1 text-sm text-muted-foreground">운영진 공지와 일정 변경, 긴급 알림을 한 곳에서 확인합니다.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            공지 작성
          </Button>
        )}
      </div>

      {!announcements?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              아직 등록된 공지가 없습니다
            </CardTitle>
            <CardDescription>중요 공지나 경기 관련 안내를 이곳에 정리할 수 있습니다.</CardDescription>
          </CardHeader>
          {isAdmin && (
            <CardContent>
              <Button onClick={() => setIsCreateOpen(true)}>첫 공지 작성하기</Button>
            </CardContent>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              isRead={readIds.has(announcement.id)}
            />
          ))}
        </div>
      )}

      {isAdmin && (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>새 공지 작성</DialogTitle>
              <DialogDescription>운영 공지, 일정 변경, 긴급 알림을 등록합니다.</DialogDescription>
            </DialogHeader>
            <AnnouncementCreateForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
