"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useVoteAttendance } from "@/entities/attendance/model/queries";
import { Button } from "@/shared/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/drawer";
import { Check, X } from "lucide-react";
import type { Member } from "@/shared/types/member";

interface AttendanceVoteButtonProps {
  sessionId: string;
  member: Member;
  currentVote?: "attending" | "absent" | null;
}

export function AttendanceVoteButton({
  sessionId,
  member,
  currentVote,
}: AttendanceVoteButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { mutate: vote, isPending } = useVoteAttendance();

  const handleVote = (status: "attending" | "absent") => {
    vote(
      {
        sessionId,
        memberId: member.id,
        status,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          toast.success(
            status === "attending"
              ? "출석으로 응답했습니다."
              : "불참으로 응답했습니다.",
          );
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  const getButtonVariant = () => {
    if (currentVote === "absent") return "destructive";
    if (currentVote === "attending") return "outline";
    return "outline";
  };

  const getButtonText = () => {
    if (currentVote === "attending") return "참석";
    if (currentVote === "absent") return "불참";
    return "미응답";
  };

  const getButtonClassName = () => {
    if (currentVote === "attending") {
      return "border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:border-blue-600";
    }
    return "";
  };

  return (
    <>
      <Button
        variant={getButtonVariant()}
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        className={getButtonClassName()}
      >
        {getButtonText()}
      </Button>

      <Drawer open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{member.name} 출석 투표</DrawerTitle>
            <DrawerDescription>
              이번 주 토요일 경기 참석 여부를 선택해주세요.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="sm:flex-row">
            <Button
              variant="outline"
              onClick={() => handleVote("attending")}
              disabled={isPending}
              className="flex-1 border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:border-blue-600"
            >
              <Check className="mr-2 h-4 w-4" />
              참석
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleVote("absent")}
              disabled={isPending}
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              불참
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
