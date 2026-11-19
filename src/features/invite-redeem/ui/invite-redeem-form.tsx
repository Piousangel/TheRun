"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useRedeemInviteCode } from "@/entities/auth/model/queries";
import { useAuth } from "@/providers/auth-provider";
import { isPlausibleInviteCode } from "@/shared/lib/invite-code";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function InviteRedeemForm() {
  const router = useRouter();
  const { user, isLinked, member, isLoading } = useAuth();
  const mutation = useRedeemInviteCode(user?.id ?? null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!isPlausibleInviteCode(code)) {
      setError("RUN-XXXX-XXXX 형식의 코드를 입력해주세요.");
      return;
    }
    try {
      await mutation.mutateAsync(code);
      toast.success("멤버 연결이 완료됐어요.");
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "연결 중 문제가 발생했습니다.");
    }
  };

  if (!isLoading && isLinked) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm leading-6 text-muted-foreground">
          이미 <strong className="text-foreground">{member?.name ?? "멤버"}</strong>님으로 연결되어 있어요.
        </p>
        <Button className="h-12 w-full rounded-full" onClick={() => router.replace("/dashboard")}>
          홈으로 가기
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="invite-code">초대 코드</Label>
        <Input
          id="invite-code"
          name="invite-code"
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          placeholder="RUN-XXXX-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="h-12 text-center font-mono text-base tracking-widest"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "invite-code-error" : undefined}
        />
        {error ? (
          <p id="invite-code-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : (
          <p className="text-xs leading-5 text-muted-foreground">
            운영진이 알려준 코드를 입력하세요. 7일 안에 한 번만 쓸 수 있어요.
          </p>
        )}
      </div>
      <Button type="submit" className="h-12 w-full rounded-full" disabled={mutation.isPending || !user}>
        {mutation.isPending ? "확인 중..." : "멤버 연결하기"}
      </Button>
    </form>
  );
}
