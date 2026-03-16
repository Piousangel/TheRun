"use client";

import { useMemo, useState } from "react";
import { Shield, ShieldCheck, UserCog, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  useAdminProfiles,
  useUpdateAppProfileRole,
} from "@/entities/auth/model/queries";
import { useAuth } from "@/providers/auth-provider";
import type { Member } from "@/shared/types/member";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { LoadingState } from "@/shared/ui/loading-spinner";
import { StatePanel } from "@/shared/ui/state-panel";
import { StatTile } from "@/shared/ui/stat-tile";
import { cn } from "@/shared/lib/utils";

interface RoleManagementPanelProps {
  members: Member[];
}

const roleLabel = {
  superadmin: "슈퍼관리자",
  admin: "관리자",
  member: "일반 멤버",
} as const;

export function RoleManagementPanel({ members }: RoleManagementPanelProps) {
  const { user, isSuperAdmin } = useAuth();
  const { data: profiles, isLoading, error } = useAdminProfiles(isSuperAdmin);
  const { mutate: updateRole, isPending } = useUpdateAppProfileRole(user?.id ?? null);
  const [pendingProfileId, setPendingProfileId] = useState<string | null>(null);

  const memberNameById = useMemo(
    () => new Map(members.map((member) => [member.id, member.name])),
    [members],
  );

  const manageableProfiles = useMemo(
    () =>
      (profiles ?? []).filter(
        (profile) => profile.role !== "superadmin" && profile.id !== user?.id,
      ),
    [profiles, user?.id],
  );

  if (!isSuperAdmin) {
    return null;
  }

  const adminCount = (profiles ?? []).filter((profile) => profile.role === "admin").length;
  const superadminCount = (profiles ?? []).filter((profile) => profile.role === "superadmin").length;

  const handleRoleChange = (
    profileId: string,
    nextRole: "member" | "admin",
  ) => {
    setPendingProfileId(profileId);
    updateRole(
      { profileId, role: nextRole },
      {
        onSuccess: () => {
          toast.success("권한이 업데이트되었습니다.");
          setPendingProfileId(null);
        },
        onError: (mutationError) => {
          toast.error(mutationError.message);
          setPendingProfileId(null);
        },
      },
    );
  };

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Superadmin Control</Badge>
          <Badge variant="secondary">권한 운영</Badge>
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">운영 권한 관리</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            실제 운영 권한을 가진 계정을 한 화면에서 정리합니다. 슈퍼관리자는
            잠금 상태로 유지하고, 나머지 계정만 관리자/멤버 권한으로 조정합니다.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          label="전체 계정"
          value={profiles?.length ?? 0}
          icon={<UserRound className="h-5 w-5" />}
        />
        <StatTile
          label="운영 계정"
          value={adminCount + superadminCount}
          icon={<ShieldCheck className="h-5 w-5" />}
          tone="success"
        />
        <StatTile
          label="권한 변경 가능"
          value={manageableProfiles.length}
          icon={<UserCog className="h-5 w-5" />}
          tone="muted"
        />
      </div>

      {isLoading ? (
        <div className="min-h-[200px] rounded-[1.5rem] border border-border/70 bg-background/80 p-6">
          <LoadingState />
        </div>
      ) : error ? (
        <StatePanel
          icon={<Shield className="h-6 w-6" />}
          title="권한 목록을 불러오는 중 문제가 생겼습니다"
          description={`계정 권한 데이터를 읽지 못했습니다. 잠시 후 다시 시도해주세요. (${error.message})`}
          tone="warning"
        />
      ) : !(profiles?.length) ? (
        <StatePanel
          icon={<UserCog className="h-6 w-6" />}
          title="관리 가능한 계정이 아직 없습니다"
          description="소셜 로그인 또는 일반 로그인으로 계정이 생성되면 이곳에서 역할 상태를 확인할 수 있습니다."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {profiles.map((profile) => {
            const isSelf = profile.id === user?.id;
            const isLocked = profile.role === "superadmin" || isSelf;
            const linkedMemberName = profile.member_id
              ? memberNameById.get(profile.member_id) ?? "연결된 멤버"
              : null;
            const isRowPending = isPending && pendingProfileId === profile.id;

            return (
              <Card
                key={profile.id}
                className={cn(
                  "border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,244,238,0.94))] shadow-sm",
                  profile.role === "superadmin" &&
                    "border-primary/20 bg-[radial-gradient(circle_at_top,rgba(200,168,88,0.14),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.99),rgba(250,247,240,0.98))]",
                )}
              >
                <CardHeader className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{roleLabel[profile.role]}</Badge>
                        {linkedMemberName ? (
                          <Badge variant="secondary">연결 {linkedMemberName}</Badge>
                        ) : (
                          <Badge variant="secondary">멤버 미연결</Badge>
                        )}
                        <Badge variant="secondary">
                          {isLocked ? "잠금" : "관리 가능"}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg leading-6">
                        {profile.email ?? "이메일 없음"}
                      </CardTitle>
                    </div>

                    <div className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
                      {profile.role === "superadmin"
                        ? "Root"
                        : profile.role === "admin"
                          ? "Ops"
                          : "Member"}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border bg-background/80 p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        현재 역할
                      </p>
                      <p className="mt-2 text-sm font-medium">{roleLabel[profile.role]}</p>
                    </div>
                    <div className="rounded-2xl border bg-background/80 p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        편집 상태
                      </p>
                      <p className="mt-2 text-sm font-medium">
                        {profile.role === "superadmin"
                          ? "고정 계정"
                          : isSelf
                            ? "내 계정 잠금"
                            : "권한 조정 가능"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={profile.role === "member" ? "default" : "outline"}
                      className="rounded-full"
                      disabled={isLocked || isRowPending}
                      onClick={() => handleRoleChange(profile.id, "member")}
                    >
                      {isRowPending && profile.role !== "member"
                        ? "변경 중..."
                        : "멤버 권한"}
                    </Button>
                    <Button
                      type="button"
                      variant={profile.role === "admin" ? "default" : "outline"}
                      className="rounded-full"
                      disabled={isLocked || isRowPending}
                      onClick={() => handleRoleChange(profile.id, "admin")}
                    >
                      {isRowPending && profile.role !== "admin"
                        ? "변경 중..."
                        : "관리자 권한"}
                    </Button>
                  </div>

                  <p className="text-sm leading-6 text-muted-foreground">
                    {profile.role === "superadmin"
                      ? "슈퍼관리자 계정은 이 화면에서 변경하지 않습니다. 최고 권한은 별도 운영 절차로만 유지합니다."
                      : isSelf
                        ? "현재 로그인 중인 내 계정은 여기서 변경하지 않도록 잠금 처리했습니다."
                        : "권한을 바꾸면 멤버 관리, 투표 생성, 공지 작성 등 운영 화면 접근 범위가 즉시 달라집니다."}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
