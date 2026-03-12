"use client";

import { useState } from "react";
import Link from "next/link";
import { useMember } from "@/entities/member/model/queries";
import { MemberAvatar } from "@/entities/member/ui/member-avatar";
import { MemberStatsRadar } from "@/entities/member/ui/member-stats-radar";
import { MemberEditForm } from "@/features/member-edit/ui/member-edit-form";
import { MemberDeleteButton } from "@/features/member-delete/ui/member-delete-button";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { getMemberPhoneDisplay } from "@/shared/lib/utils";
import { PageHero } from "@/shared/ui/page-hero";
import { StatePanel } from "@/shared/ui/state-panel";
import { StatTile } from "@/shared/ui/stat-tile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { LoadingState } from "@/shared/ui/loading-spinner";
import { ArrowLeft, Edit, Users } from "lucide-react";

interface MemberDetailProps {
  memberId: string;
}

export function MemberDetail({ memberId }: MemberDetailProps) {
  const { data: member, isLoading, error } = useMember(memberId);
  const { isAdmin } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);

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
              <Button asChild variant="outline" size="sm">
                <Link href="/members">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  목록으로
                </Link>
              </Button>
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

        <Card className="overflow-hidden border-primary/15 bg-[linear-gradient(160deg,rgba(200,168,88,0.08),rgba(255,255,255,0.98))]">
          <CardHeader>
            <CardTitle>멤버 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4 text-center">
              <MemberAvatar
                src={member.profile_photo}
                alt={member.name}
                size="lg"
              />
              <div>
                <h2 className="text-2xl font-bold">{member.name}</h2>
                <p className="text-muted-foreground">
                  {getMemberPhoneDisplay(member.phone_number)}
                </p>
              </div>
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

      {isAdmin && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>멤버 정보 수정</DialogTitle>
              <DialogDescription>
                {member.name} 멤버의 프로필과 능력치를 현재 팀 운영 기준에 맞게
                갱신합니다.
              </DialogDescription>
            </DialogHeader>
            <MemberEditForm member={member} onSuccess={handleEditSuccess} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
