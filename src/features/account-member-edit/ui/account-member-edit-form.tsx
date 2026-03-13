"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useUpdateMyMemberProfile } from "@/entities/auth/model/queries";
import { Button } from "@/shared/ui/button";
import { FormSection } from "@/shared/ui/form-section";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import type { Member } from "@/shared/types/member";
import {
  accountMemberEditSchema,
  type AccountMemberEditFormData,
} from "../model/schema";

interface AccountMemberEditFormProps {
  member: Member;
  userId: string;
  onSuccess: () => void;
}

export function AccountMemberEditForm({
  member,
  userId,
  onSuccess,
}: AccountMemberEditFormProps) {
  const { mutate: updateMyMemberProfile, isPending } =
    useUpdateMyMemberProfile(userId);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountMemberEditFormData>({
    resolver: zodResolver(accountMemberEditSchema),
    defaultValues: {
      name: member.name,
      phone_number: member.phone_number,
    },
  });

  const handleFormSubmit = (data: AccountMemberEditFormData) => {
    updateMyMemberProfile(
      {
        name: data.name,
        phoneNumber: data.phone_number,
      },
      {
        onSuccess: () => {
          onSuccess();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <FormSection
        title="내 멤버 정보"
        description="연결된 내 멤버의 이름과 연락처를 바로 수정합니다."
      >
        <div className="space-y-2">
          <Label htmlFor="account_name">이름</Label>
          <Input
            id="account_name"
            {...register("name")}
            placeholder="홍길동"
            disabled={isPending}
          />
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="account_phone_number">전화번호</Label>
          <Input
            id="account_phone_number"
            {...register("phone_number")}
            placeholder="010-1234-5678"
            disabled={isPending}
          />
          {errors.phone_number ? (
            <p className="text-sm text-destructive">
              {errors.phone_number.message}
            </p>
          ) : null}
        </div>
      </FormSection>

      <Button
        type="submit"
        className="w-full rounded-full"
        disabled={isPending}
      >
        {isPending ? "저장 중..." : "내 정보 저장"}
      </Button>
    </form>
  );
}
