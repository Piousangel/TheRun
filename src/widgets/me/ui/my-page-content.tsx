"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Link2,
  LogOut,
  PencilLine,
  Phone,
  Shield,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { AccountMemberEditForm } from "@/features/account-member-edit/ui/account-member-edit-form";
import { useMembers } from "@/entities/member/model/queries";
import {
  useClaimableMembers,
  useLinkMemberProfile,
  useUnlinkMemberProfile,
} from "@/entities/auth/model/queries";
import { useAuth } from "@/providers/auth-provider";
import { getApi } from "@/shared/api/client";
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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/drawer";
import {
  MASKED_MEMBER_PHONE_NUMBER,
  getErrorMessage,
  getMemberPhoneDisplay,
  normalizePhoneNumber,
} from "@/shared/lib/utils";
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
  const isLegacyClaimFlow = false;
  const selectedMember = useMemo(
    () =>
      availableMembers.find((availableMember) => availableMember.id === selectedMemberId) ??
      null,
    [availableMembers, selectedMemberId],
  );

  useEffect(() => {
    if (selectedMemberId && !selectedMember) {
      setSelectedMemberId("");
    }
  }, [selectedMember, selectedMemberId]);

  const handleLogout = async () => {
    await getApi().auth.signOut();
  };

  const handleLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    try {
      await linkMutation.mutateAsync({
        memberId: selectedMemberId,
        phoneNumber:
          normalizePhoneNumber(phoneNumber) ||
          (isLegacyClaimFlow
            ? availableMembers.find(({ id }) => id === selectedMemberId)
                ?.phone_number ?? ""
            : ""),
      });
      setMessage("내 멤버 연결이 완료되었습니다.");
      toast.success("내 멤버 연결이 완료되었습니다.");
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "멤버 연결에 실패했습니다.",
      );
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
      const errorMessage = getErrorMessage(error, "연결 해제에 실패했습니다.");
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
          {!profile?.member_id ? (
            <Button asChild className="h-12 w-full rounded-full">
              <Link href="/join">초대 코드로 연결하기</Link>
            </Button>
          ) : null}
          {profile?.member_id && !member ? (
            <div className="space-y-4 rounded-[1.6rem] border border-amber-200 bg-[linear-gradient(180deg,rgba(255,250,238,0.95),rgba(255,255,255,1))] p-4 shadow-[0_18px_44px_rgba(120,53,15,0.08)]">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold tracking-tight text-foreground">
                      멤버 연결 정보 복구 필요
                    </p>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                      Recovery
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    프로필에는 멤버가 연결되어 있지만 실제 멤버 데이터를 불러오지
                    못했습니다. 연결을 해제한 뒤 다시 연결하면 정상 흐름으로
                    복구됩니다.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-full"
                onClick={handleUnlink}
                disabled={unlinkMutation.isPending}
              >
                {unlinkMutation.isPending
                  ? "해제 중..."
                  : "연결 해제 후 다시 시도"}
              </Button>
            </div>
          ) : member ? (
            <div className="space-y-4 rounded-[1.6rem] border border-primary/15 bg-[linear-gradient(180deg,rgba(255,249,238,0.95),rgba(255,255,255,1))] p-4 shadow-[0_20px_46px_rgba(15,23,42,0.06)]">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold tracking-tight text-foreground">
                      현재 연결된 멤버
                    </p>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      READY
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    지금은 이 멤버 기준으로 투표, 출석, 공지 읽음 흐름이 정리됩니다.
                  </p>
                </div>
              </div>

              <div className="rounded-[1.3rem] border border-border/70 bg-white/90 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {member.name}
                      </p>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-[0.16em]">
                        LINKED
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {getMemberPhoneDisplay(member.phone_number)}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full rounded-full"
                onClick={handleUnlink}
                disabled={unlinkMutation.isPending}
              >
                {unlinkMutation.isPending ? "해제 중..." : "연결 해제"}
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleLink}>
              <div className="rounded-[1.6rem] border border-primary/15 bg-[linear-gradient(180deg,rgba(255,249,238,0.9),rgba(255,255,255,1))] p-4 shadow-[0_20px_45px_rgba(15,23,42,0.05)]">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    Link Flow
                  </Badge>
                  <Badge variant="secondary">모바일 최적화</Badge>
                  {isLegacyClaimFlow ? (
                    <Badge variant="secondary">Legacy check</Badge>
                  ) : null}
                </div>
                <div className="mt-3 space-y-1">
                  <p className="text-base font-semibold tracking-tight text-foreground">
                    내 이름을 고르고 바로 연결 흐름을 마무리하세요.
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    선택 정보가 아래에 바로 정리되고, 구버전 서버일 때만 전화번호 확인 단계를 함께 사용합니다.
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-[1.5rem] border border-border/70 bg-white/90 p-4 shadow-[0_16px_38px_rgba(15,23,42,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Label htmlFor="member" className="text-sm font-semibold text-foreground">
                      내 이름 선택
                    </Label>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      목록에는 지금 연결 가능한 멤버만 우선 보여줍니다.
                    </p>
                  </div>
                  <div className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    Step 01
                  </div>
                </div>

                <Select
                  value={selectedMemberId}
                  onValueChange={(value) => {
                    setSelectedMemberId(value);

                    if (!isLegacyClaimFlow) {
                      return;
                    }

                    const selectedMember = availableMembers.find(
                      (availableMember) => availableMember.id === value,
                      );

                      setPhoneNumber(selectedMember?.phone_number ?? "");
                    }}
                >
                  <SelectTrigger
                    id="member"
                    className="h-14 rounded-[1.25rem] border-primary/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,247,239,0.95))] px-4 text-left shadow-[0_16px_34px_rgba(15,23,42,0.06)]"
                  >
                    <SelectValue placeholder="멤버를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {availableMembers.map((availableMember) => (
                      <SelectItem
                        key={availableMember.id}
                        value={availableMember.id}
                      >
                        {availableMember.name} · #{availableMember.id.slice(0, 6)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="rounded-[1.25rem] border border-dashed border-border/70 bg-muted/20 p-3">
                  {selectedMember ? (
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                        <UserRound className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {selectedMember.name}
                          </p>
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-[0.16em]">
                            #{selectedMember.id.slice(0, 6)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {isLegacyClaimFlow
                            ? "구버전 확인 흐름에서는 아래 전화번호 필드가 자동으로 채워집니다."
                            : "이 멤버를 현재 로그인 계정과 연결합니다."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      멤버를 먼저 선택하면 연결 대상 정보가 여기 표시됩니다.
                    </p>
                  )}
                </div>

                <p className="text-xs leading-5 text-muted-foreground">
                  {claimableMembers
                    ? "이미 다른 계정에 연결된 멤버는 목록에서 자동으로 숨깁니다."
                    : "서버가 구버전 연결 방식일 수 있어 전체 멤버를 보여주고 있습니다."}
                </p>
              </div>

              <div className="space-y-3 rounded-[1.5rem] border border-border/70 bg-white/90 p-4 shadow-[0_16px_38px_rgba(15,23,42,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Label
                      htmlFor="legacy_phone_number"
                      className="flex items-center gap-2 text-sm font-semibold text-foreground"
                    >
                      <Phone className="h-4 w-4 text-primary" />
                      전화번호 확인
                    </Label>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      구버전 서버일 때만 실제 확인에 사용되고, 최신 서버에서는 연결 보조 정보 역할만 합니다.
                    </p>
                  </div>
                  <div className="rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Step 02
                  </div>
                </div>

                <Input
                  id="legacy_phone_number"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={13}
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  onBlur={(event) =>
                    setPhoneNumber(normalizePhoneNumber(event.target.value))
                  }
                  className="h-14 rounded-[1.25rem] border-primary/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,247,239,0.95))] shadow-[0_16px_34px_rgba(15,23,42,0.06)]"
                  placeholder="000-0000-0000 또는 010-1234-5678"
                />

                <div className="rounded-[1.2rem] border border-primary/10 bg-primary/[0.06] p-3 text-xs leading-5 text-muted-foreground">
                  {isLegacyClaimFlow ? (
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <p>
                        구버전 서버에서는 선택한 멤버의 등록 번호로 자동 채우고,
                        맞지 않으면 {MASKED_MEMBER_PHONE_NUMBER}도 한 번 더
                        확인합니다.
                      </p>
                    </div>
                  ) : (
                    <p>
                      최신 서버에서는 필수가 아니지만, 이전 RPC 환경에서는 이 값으로
                      한 번 더 확인할 수 있습니다.
                    </p>
                  )}
                </div>
              </div>

              {message && (
                <div
                  className={`rounded-[1.2rem] border px-4 py-3 text-sm leading-6 ${message.includes("완료") ? "border-primary/20 bg-primary/5 text-primary" : "border-destructive/20 bg-destructive/5 text-destructive"}`}
                >
                  {message}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="h-12 w-full rounded-full"
                disabled={
                  !selectedMember ||
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
        <Drawer open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DrawerContent className="max-h-[88vh]">
            <DrawerHeader>
              <DrawerTitle>내 멤버 정보 수정</DrawerTitle>
              <DrawerDescription>
                로그인한 계정에 연결된 내 멤버의 이름과 전화번호를 직접
                수정합니다.
              </DrawerDescription>
            </DrawerHeader>
            <AccountMemberEditForm
              member={member}
              userId={user.id}
              onSuccess={() => {
                setIsEditOpen(false);
                toast.success("내 멤버 정보를 저장했습니다.");
              }}
            />
          </DrawerContent>
        </Drawer>
      ) : null}
    </div>
  );
}
