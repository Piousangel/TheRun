"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { UserRound, Shield, Link2, LogOut, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { AccountMemberEditForm } from "@/features/account-member-edit/ui/account-member-edit-form";
import { useMembers } from "@/entities/member/model/queries";
import {
  useClaimableMembers,
  useLinkMemberProfile,
  useUnlinkMemberProfile,
} from "@/entities/auth/model/queries";
import { useAuth } from "@/providers/auth-provider";
import { supabase } from "@/shared/api/supabase/config";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
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
import { getMemberPhoneDisplay } from "@/shared/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Input } from "@/shared/ui/input";

export function MyPageContent() {
  const { user, profile, member, isAdmin, isSuperAdmin, isLinked, isLoading } =
    useAuth();
  const { data: members } = useMembers();
  const { data: claimableMembers, isLoading: isClaimableMembersLoading } =
    useClaimableMembers(user?.id ?? null);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const linkMutation = useLinkMemberProfile(user?.id ?? null);
  const unlinkMutation = useUnlinkMemberProfile(user?.id ?? null);

  const availableMembers = useMemo(
    () => claimableMembers ?? members ?? [],
    [claimableMembers, members],
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    try {
      await linkMutation.mutateAsync({
        memberId: selectedMemberId,
        phoneNumber,
      });
      setMessage("내 멤버 연결이 완료되었습니다.");
      toast.success("내 멤버 연결이 완료되었습니다.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "멤버 연결에 실패했습니다.";
      setMessage(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleUnlink = async () => {
    setMessage(null);

    try {
      await unlinkMutation.mutateAsync();
      setSelectedMemberId("");
      setMessage("멤버 연결을 해제했습니다.");
      toast.success("멤버 연결을 해제했습니다.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "연결 해제에 실패했습니다.";
      setMessage(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        내 정보를 불러오는 중...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <StatePanel
          icon={<UserRound className="h-6 w-6" />}
          title="내 계정을 먼저 열어주세요"
          description="로그인 후 내 멤버와 연결하면 투표와 출석을 본인 기준으로 처리할 수 있고, 공지 읽음 상태도 개인별로 관리됩니다."
          action={
            <Button asChild>
              <Link href="/login">로그인하러 가기</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="My Account"
        title="내 계정"
        description="로그인 상태, 역할, 멤버 연결 여부를 확인하고 내 응답 흐름을 사용할 준비를 마칩니다."
        meta={
          <>
            <Badge variant="secondary">
              역할{" "}
              {isSuperAdmin ? "슈퍼관리자" : isAdmin ? "관리자" : "일반 멤버"}
            </Badge>
            <Badge variant="secondary">연결 {isLinked ? "완료" : "필요"}</Badge>
          </>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {member ? (
              <Button variant="outline" onClick={() => setIsEditOpen(true)}>
                <PencilLine className="mr-2 h-4 w-4" />내 멤버 정보 수정
              </Button>
            ) : null}
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          label="계정 상태"
          value={user.email ? "ACTIVE" : "NONE"}
          icon={<UserRound className="h-5 w-5" />}
        />
        <StatTile
          label="권한"
          value={isSuperAdmin ? "SUPER" : isAdmin ? "ADMIN" : "MEMBER"}
          icon={<Shield className="h-5 w-5" />}
          tone={isAdmin ? "success" : "muted"}
        />
        <StatTile
          label="멤버 연결"
          value={isLinked ? "READY" : "PENDING"}
          icon={<Link2 className="h-5 w-5" />}
          tone={isLinked ? "success" : "danger"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" />
              로그인 계정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">이메일:</span>{" "}
              {profile?.email ?? user.email ?? "없음"}
            </p>
            <p>
              <span className="text-muted-foreground">역할:</span>{" "}
              {isSuperAdmin ? "슈퍼관리자" : isAdmin ? "관리자" : "일반 멤버"}
            </p>
            <p>
              <span className="text-muted-foreground">멤버 연결:</span>{" "}
              {isLinked ? "완료" : "필요"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              현재 상태
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>- 일반 멤버는 본인 응답 중심으로 투표/출석하게 됩니다.</p>
            <p>
              - 관리자는 멤버/투표/운영 화면의 생성 및 삭제 작업을 계속 볼 수
              있습니다.
            </p>
            <p>
              - 다음 단계에서 DB 권한을 더 강하게 적용해 UI와 데이터 권한을
              일치시킬 예정입니다.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />내 멤버 연결
          </CardTitle>
          <CardDescription>
            로그인 후에는 전화번호 대조 없이 본인 멤버를 연결하고, 이후 내
            정보는 계정 화면에서 직접 갱신할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile?.member_id && !member ? (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <div>
                <p className="font-semibold">멤버 연결 정보 복구 필요</p>
                <p className="text-sm text-muted-foreground">
                  프로필에는 멤버가 연결되어 있지만 멤버 데이터를 불러오지
                  못했습니다. 연결을 해제한 뒤 다시 연결해주세요.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleUnlink}
                disabled={unlinkMutation.isPending}
              >
                {unlinkMutation.isPending
                  ? "해제 중..."
                  : "연결 해제 후 다시 시도"}
              </Button>
            </div>
          ) : member ? (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <div>
                <p className="font-semibold">현재 연결된 멤버</p>
                <p className="text-sm text-muted-foreground">
                  {member.name} · {getMemberPhoneDisplay(member.phone_number)}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleUnlink}
                disabled={unlinkMutation.isPending}
              >
                {unlinkMutation.isPending ? "해제 중..." : "연결 해제"}
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleLink}>
              <div className="space-y-2">
                <Label htmlFor="member">내 이름 선택</Label>
                <Select
                  value={selectedMemberId}
                  onValueChange={setSelectedMemberId}
                >
                  <SelectTrigger id="member">
                    <SelectValue placeholder="멤버를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="z-[120] max-h-72">
                    {availableMembers.map((availableMember) => (
                      <SelectItem
                        key={availableMember.id}
                        value={availableMember.id}
                      >
                        {availableMember.name} · #
                        {availableMember.id.slice(0, 6)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {claimableMembers
                    ? "이미 다른 계정에 연결된 멤버는 목록에서 자동으로 숨깁니다."
                    : "서버가 구버전 연결 방식일 수 있어 전체 멤버를 보여주고 있습니다."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="legacy_phone_number">
                  전화번호 확인 (구버전 서버 대비)
                </Label>
                <Input
                  id="legacy_phone_number"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="000-0000-0000 또는 010-1234-5678"
                />
                <p className="text-xs text-muted-foreground">
                  최신 서버에서는 필요 없지만, 아직 이전 RPC를 쓰는 환경에서는
                  이 값으로 다시 시도합니다.
                </p>
              </div>

              {message && (
                <p
                  className={`text-sm ${message.includes("완료") ? "text-primary" : "text-destructive"}`}
                >
                  {message}
                </p>
              )}

              <Button
                type="submit"
                disabled={
                  !selectedMemberId ||
                  linkMutation.isPending ||
                  isClaimableMembersLoading
                }
              >
                {isClaimableMembersLoading
                  ? "목록 불러오는 중..."
                  : linkMutation.isPending
                    ? "연결 중..."
                    : "내 멤버 연결하기"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {member && user ? (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>내 멤버 정보 수정</DialogTitle>
              <DialogDescription>
                로그인한 계정에 연결된 내 멤버의 이름과 전화번호를 직접
                수정합니다.
              </DialogDescription>
            </DialogHeader>
            <AccountMemberEditForm
              member={member}
              userId={user.id}
              onSuccess={() => {
                setIsEditOpen(false);
                toast.success("내 멤버 정보를 저장했습니다.");
              }}
            />
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
