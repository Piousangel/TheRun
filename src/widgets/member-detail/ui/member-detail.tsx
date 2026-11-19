"use client";

import { useState } from "react";
import Link from "next/link";
import { useMember } from "@/entities/member/model/queries";
import { MemberAvatar } from "@/entities/member/ui/member-avatar";
import { MemberStatsRadar } from "@/entities/member/ui/member-stats-radar";
import { MemberEditForm } from "@/features/member-edit/ui/member-edit-form";
import { MemberDeleteButton } from "@/features/member-delete/ui/member-delete-button";
import { InviteIssueButton } from "@/features/invite-issue/ui/invite-issue-button";
import { useAuth } from "@/providers/auth-provider";
import { usePageHeader } from "@/shared/lib/page-header/store";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { getMemberPhoneDisplay } from "@/shared/lib/utils";
import { PageHero } from "@/shared/ui/page-hero";
import { StatePanel } from "@/shared/ui/state-panel";
import { StatTile } from "@/shared/ui/stat-tile";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/drawer";
import { LoadingState } from "@/shared/ui/loading-spinner";
import { ArrowLeft, Edit, Shield, Sparkles, Users } from "lucide-react";

interface MemberDetailProps {
  memberId: string;
}

export function MemberDetail({ memberId }: MemberDetailProps) {
  const { data: member, isLoading, error } = useMember(memberId);
  const { isAdmin } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  usePageHeader({ title: member?.name });

  const handleEditSuccess = () => {
    setIsEditOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px]">
        <LoadingState />
      </div>
    );
  }

  if (error || !member) {
    return (
      <StatePanel
        icon={<Users className="h-6 w-6" />}
        title={
          error
            ? "멤버 정보를 불러오는 중 문제가 생겼습니다"
            : "이 멤버를 찾을 수 없습니다"
        }
        description={
          error
            ? error.message
            : "삭제되었거나 잘못된 링크로 접근했을 수 있습니다. 멤버 목록에서 다시 선택해주세요."
        }
        action={
          <Button asChild variant="outline">
            <Link href="/members">
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Link>
          </Button>
        }
        tone={error ? "warning" : "default"}
      />
    );
  }

  const safeMember = member;

  const attackScore = Math.round(
    (safeMember.stats.shooting + safeMember.stats.dribbling) / 2,
  );
  const buildScore = Math.round(
    (safeMember.stats.passing + safeMember.stats.stamina) / 2,
  );
  const coverScore = Math.round(
    (safeMember.stats.speed + safeMember.stats.defense) / 2,
  );

  return (
    <>
      <div className="space-y-6">
        <PageHero
          eyebrow="Member Detail"
          title={member.name}
          description={
            isAdmin
              ? "멤버 프로필과 스탯을 확인하고, 필요 시 수정과 삭제까지 바로 이어갈 수 있습니다."
              : "멤버 프로필과 스탯을 확인할 수 있으며, 수정과 삭제는 관리자만 가능합니다."
          }
          meta={
            <>
              <Badge variant="secondary">
                전화번호 {getMemberPhoneDisplay(member.phone_number)}
              </Badge>
              <Badge variant="secondary">
                권한 {isAdmin ? "관리자 보기" : "읽기 전용"}
              </Badge>
            </>
          }
          actions={
            <>
              {isAdmin ? (
                <>
                  <Button size="sm" onClick={() => setIsEditOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    수정
                  </Button>
                  <MemberDeleteButton
                    memberId={member.id}
                    memberName={member.name}
                  />
                  <InviteIssueButton memberId={member.id} />
                </>
              ) : null}
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <StatTile label="스피드" value={member.stats.speed} />
          <StatTile label="슈팅" value={member.stats.shooting} />
          <StatTile label="패스" value={member.stats.passing} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Card className="overflow-hidden border-primary/15 bg-[radial-gradient(circle_at_top,rgba(200,168,88,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,244,238,0.95))] shadow-sm">
            <CardContent className="space-y-5 pt-6">
              <div className="flex flex-col items-center space-y-4 text-center">
                <MemberAvatar
                  src={member.profile_photo}
                  alt={member.name}
                  size="lg"
                />
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Member Identity
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight">
                    {member.name}
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    {getMemberPhoneDisplay(member.phone_number)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border bg-background/80 p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Attack
                  </p>
                  <p className="mt-2 text-lg font-semibold">{attackScore}</p>
                </div>
                <div className="rounded-xl border bg-background/80 p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Build
                  </p>
                  <p className="mt-2 text-lg font-semibold">{buildScore}</p>
                </div>
                <div className="rounded-xl border bg-background/80 p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Cover
                  </p>
                  <p className="mt-2 text-lg font-semibold">{coverScore}</p>
                </div>
              </div>

              <div className="rounded-2xl border bg-background/80 p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="font-medium">플레이 요약</p>
                </div>
                <p className="mt-3 leading-6">
                  공격 전개, 빌드업, 수비 커버 밸런스를 한 번에 확인할 수 있게
                  요약했습니다. 팀 분배와 전술 보드에서 이 값들이 그대로 운영
                  판단에 연결됩니다.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>능력치</CardTitle>
            </CardHeader>
            <CardContent>
              <MemberStatsRadar member={member} />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">스피드</p>
                  <p className="text-2xl font-bold text-primary">
                    {member.stats.speed}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">슈팅</p>
                  <p className="text-2xl font-bold text-primary">
                    {member.stats.shooting}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">패스</p>
                  <p className="text-2xl font-bold text-primary">
                    {member.stats.passing}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">드리블</p>
                  <p className="text-2xl font-bold text-primary">
                    {member.stats.dribbling}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">체력</p>
                  <p className="text-2xl font-bold text-primary">
                    {member.stats.stamina}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">수비</p>
                  <p className="text-2xl font-bold text-primary">
                    {member.stats.defense}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,244,238,0.94))]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5 text-primary" />
              운영 액션
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border bg-background/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                View mode
              </p>
              <p className="mt-2 text-sm font-medium">
                {isAdmin ? "관리자 수정 가능" : "읽기 전용 프로필"}
              </p>
            </div>
            <div className="rounded-2xl border bg-background/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Flow
              </p>
              <p className="mt-2 text-sm font-medium">
                멤버 카드 → 상세 → 수정 / 삭제
              </p>
            </div>
            <div className="rounded-2xl border bg-background/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Link
              </p>
              <p className="mt-2 text-sm font-medium">
                전술 보드 / 팀 배정 기준 프로필
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <Drawer open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>멤버 정보 수정</DrawerTitle>
              <DrawerDescription>
                {member.name} 멤버의 프로필과 능력치를 현재 팀 운영 기준에 맞게
                갱신합니다.
              </DrawerDescription>
            </DrawerHeader>
            <MemberEditForm member={member} onSuccess={handleEditSuccess} />
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
