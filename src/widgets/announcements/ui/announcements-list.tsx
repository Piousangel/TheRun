"use client";

import { useMemo, useState } from "react";
import { Megaphone, Plus } from "lucide-react";
import {
  useAnnouncements,
  useAnnouncementReads,
} from "@/entities/announcement/model/queries";
import { AnnouncementCard } from "@/entities/announcement/ui/announcement-card";
import { AnnouncementCreateForm } from "@/features/announcement-create/ui/announcement-create-form";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { LoadingState } from "@/shared/ui/loading-spinner";
import { PageHero } from "@/shared/ui/page-hero";
import { StatePanel } from "@/shared/ui/state-panel";
import { StatTile } from "@/shared/ui/stat-tile";
import { Badge } from "@/shared/ui/badge";

export function AnnouncementsList() {
  const { user, isAdmin } = useAuth();
  const { data: announcements, isLoading, error } = useAnnouncements();
  const { data: reads } = useAnnouncementReads(user?.id ?? null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const readIds = useMemo(
    () => new Set((reads ?? []).map((read) => read.announcement_id)),
    [reads],
  );
  const unreadCount = (announcements ?? []).filter(
    (announcement) => !readIds.has(announcement.id),
  ).length;

  if (isLoading) {
    return (
      <div className="min-h-[320px]">
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <StatePanel
        icon={<Megaphone className="h-6 w-6" />}
        title="공지 보드를 불러오는 중 문제가 생겼습니다"
        description={`잠시 후 다시 시도해주세요. 문제가 계속되면 네트워크 상태나 공지 데이터 설정을 확인해보세요. (${error.message})`}
        tone="warning"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Announcements"
        title="공지 보드"
        description="운영진 공지, 일정 변경, 긴급 안내를 한곳에 모아 멤버가 바로 확인할 수 있게 정리했습니다."
        meta={
          <>
            <Badge variant="secondary">
              전체 공지 {announcements?.length ?? 0}개
            </Badge>
            <Badge variant="secondary">읽지 않음 {unreadCount}개</Badge>
            <Badge variant="secondary">
              권한 {isAdmin ? "작성 가능" : "읽기 중심"}
            </Badge>
          </>
        }
        actions={
          isAdmin ? (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              공지 작성
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          label="전체 공지"
          value={announcements?.length ?? 0}
          icon={<Megaphone className="h-5 w-5" />}
        />
        <StatTile
          label="읽지 않음"
          value={unreadCount}
          icon={<Megaphone className="h-5 w-5" />}
          tone={unreadCount > 0 ? "danger" : "success"}
        />
        <StatTile
          label="고정 공지"
          value={
            (announcements ?? []).filter(
              (announcement) => announcement.is_pinned,
            ).length
          }
          icon={<Megaphone className="h-5 w-5" />}
          tone="muted"
        />
      </div>

      {!announcements?.length ? (
        <StatePanel
          icon={<Megaphone className="h-6 w-6" />}
          title="첫 공지를 아직 올리지 않았습니다"
          description={
            isAdmin
              ? "이번 주 일정 변경, 경기 안내, 긴급 공지를 먼저 올려두면 멤버가 홈과 공지 보드에서 바로 확인할 수 있습니다."
              : "운영진이 공지를 올리면 이곳에서 읽음 상태와 함께 바로 확인할 수 있습니다."
          }
          action={
            isAdmin ? (
              <Button onClick={() => setIsCreateOpen(true)}>
                첫 공지 작성하기
              </Button>
            ) : undefined
          }
        />
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
              <DialogDescription>
                운영 공지, 일정 변경, 긴급 알림을 제품 수준의 톤으로 정리해
                멤버에게 전달합니다.
              </DialogDescription>
            </DialogHeader>
            <AnnouncementCreateForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
