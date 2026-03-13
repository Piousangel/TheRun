"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDeleteVoteSession } from "@/entities/vote/model/queries";
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

interface VoteDeleteButtonProps {
  sessionId: string;
  sessionTitle: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  redirectAfterDelete?: boolean;
}

export function VoteDeleteButton({
  sessionId,
  sessionTitle,
  variant = "ghost",
  size = "sm",
  redirectAfterDelete = false,
}: VoteDeleteButtonProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { mutate: deleteVote, isPending } = useDeleteVoteSession();

  const handleDelete = () => {
    deleteVote(sessionId, {
      onSuccess: () => {
        setIsDialogOpen(false);
        toast.success("투표를 삭제했습니다.");
        if (redirectAfterDelete) {
          router.push("/votes");
        }
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={(e) => {
          e.stopPropagation();
          setIsDialogOpen(true);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>투표 삭제</DialogTitle>
            <DialogDescription>
              &quot;{sessionTitle}&quot; 투표를 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없으며, 모든 투표 응답도 함께
              삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
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
