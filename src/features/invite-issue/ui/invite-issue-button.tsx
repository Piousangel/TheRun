"use client";

import { Copy, KeyRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useIssueInviteCode } from "@/entities/auth/model/queries";
import { Button } from "@/shared/ui/button";

interface InviteIssueButtonProps {
  memberId: string;
}

export function InviteIssueButton({ memberId }: InviteIssueButtonProps) {
  const mutation = useIssueInviteCode();
  const [issued, setIssued] = useState<{ code: string; expiresAt: string } | null>(null);

  const handleIssue = async () => {
    try {
      setIssued(await mutation.mutateAsync(memberId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "코드를 만들지 못했습니다.");
    }
  };

  const handleCopy = async () => {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.code);
      toast.success("코드를 복사했어요.");
    } catch {
      toast.error("복사하지 못했습니다. 코드를 직접 선택해 복사하세요.");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" onClick={handleIssue} disabled={mutation.isPending}>
        <KeyRound className="mr-2 h-4 w-4" />
        {mutation.isPending ? "만드는 중..." : "초대 코드 만들기"}
      </Button>
      {issued ? (
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
          <code data-testid="issued-invite-code" className="font-mono text-sm font-semibold tracking-widest select-all">
            {issued.code}
          </code>
          <span className="text-xs text-muted-foreground">
            {new Date(issued.expiresAt).toLocaleDateString("ko-KR")}까지
          </span>
          <Button size="icon" variant="ghost" className="h-11 w-11" onClick={handleCopy} aria-label="코드 복사">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
