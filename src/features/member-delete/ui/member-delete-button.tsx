"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDeleteMember } from "@/entities/member/model/queries";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Trash2 } from "lucide-react";

interface MemberDeleteButtonProps {
  memberId: string;
  memberName: string;
}

export function MemberDeleteButton({
  memberId,
  memberName,
}: MemberDeleteButtonProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { mutate: deleteMember, isPending } = useDeleteMember();
  const router = useRouter();

  const handleDelete = () => {
    deleteMember(memberId, {
      onSuccess: () => {
        setIsConfirmOpen(false);
        toast.success("멤버를 삭제했습니다.");
        router.push("/members");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsConfirmOpen(true)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        삭제
      </Button>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>멤버 삭제 확인</DialogTitle>
            <DialogDescription>
              정말로 <strong>{memberName}</strong> 멤버를 삭제하시겠습니까? 이
              작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
