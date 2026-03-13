"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { ko } from "date-fns/locale";
import { ArrowRight, BellRing, Pin, Siren, Trash2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import {
  useDeleteAnnouncement,
  useMarkAnnouncementRead,
} from "@/entities/announcement/model/queries";
import type { Announcement } from "@/shared/types/announcement";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";

interface AnnouncementCardProps {
  announcement: Announcement;
  isRead: boolean;
}

const categoryLabel = {
  general: "일반",
  match: "경기",
  schedule: "일정",
  urgent: "긴급",
} as const;

export function AnnouncementCard({
  announcement,
  isRead,
}: AnnouncementCardProps) {
  const { user, isAdmin } = useAuth();
  const { mutate: markRead, isPending: isMarking } = useMarkAnnouncementRead(
    user?.id ?? null,
  );
  const { mutate: deleteAnnouncement, isPending: isDeleting } =
    useDeleteAnnouncement();

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,244,238,0.94))] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        !isRead &&
          "border-primary/30 bg-[radial-gradient(circle_at_top,rgba(200,168,88,0.14),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,247,240,0.98))]",
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {categoryLabel[announcement.category]}
              </Badge>
              {announcement.is_pinned && (
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                  <Pin className="mr-1 h-3 w-3" />
                  고정
                </Badge>
              )}
              {!isRead && (
                <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                  <BellRing className="mr-1 h-3 w-3" />
                  읽지 않음
                </Badge>
              )}
              {announcement.category === "urgent" && (
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                  <Siren className="mr-1 h-3 w-3" />
                  긴급
                </Badge>
              )}
            </div>
            <div>
              <CardTitle className="text-xl leading-7">
                {announcement.title}
              </CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatDistanceToNowStrict(new Date(announcement.publish_at), {
                  addSuffix: true,
                  locale: ko,
                })}
              </p>
            </div>
          </div>

          {isAdmin && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => deleteAnnouncement(announcement.id)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
          {announcement.body}
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border bg-background/80 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Tone
            </p>
            <p className="mt-2 text-sm font-medium">
              {announcement.category === "urgent"
                ? "즉시 확인 필요"
                : "운영 공지 흐름"}
            </p>
          </div>
          <div className="rounded-2xl border bg-background/80 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Status
            </p>
            <p className="mt-2 text-sm font-medium">
              {isRead ? "이미 읽음" : "아직 확인 전"}
            </p>
          </div>
        </div>

        {!isRead && user && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => markRead(announcement.id)}
            disabled={isMarking}
          >
            {isMarking ? "처리 중..." : "읽음 처리"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
