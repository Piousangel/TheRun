"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { useUpdateMember } from "@/entities/member/model/queries";
import { getApi } from "@/shared/api/client";
import { memberEditSchema, type MemberEditFormData } from "../model/schema";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Slider } from "@/shared/ui/slider";
import { STAT_LABELS } from "@/shared/lib/constants";
import type { Member } from "@/shared/types/member";

interface MemberEditFormProps {
  member: Member;
  onSuccess: () => void;
}

export function MemberEditForm({ member, onSuccess }: MemberEditFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { mutate: updateMember, isPending } = useUpdateMember();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<MemberEditFormData>({
    resolver: zodResolver(memberEditSchema),
    defaultValues: {
      name: member.name,
      phone_number: member.phone_number,
      stats: member.stats,
    },
  });

  const stats = watch("stats");

  const handleFormSubmit = async (data: MemberEditFormData) => {
    setIsUploading(true);
    let photoUrl = member.profile_photo || "";

    try {
      if (data.profile_photo) {
        photoUrl = await getApi().members.uploadPhoto(data.profile_photo, member.id);
      }

      updateMember(
        {
          id: member.id,
          data: {
            name: data.name,
            phone_number: data.phone_number,
            profile_photo: photoUrl || undefined,
            stats: data.stats,
          },
        },
        {
          onSuccess: () => {
            onSuccess();
          },
        },
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "멤버 수정에 실패했습니다.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="rounded-2xl border bg-[linear-gradient(160deg,rgba(200,168,88,0.08),rgba(255,255,255,0.98))] p-4 text-sm text-muted-foreground">
        이름, 연락처, 능력치를 지금 운영 흐름에 맞게 갱신합니다. 사진이 바뀌면
        바로 전체 명단과 전술 보드에 반영됩니다.
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="홍길동"
          disabled={isPending || isUploading}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone_number">전화번호</Label>
        <Input
          id="phone_number"
          {...register("phone_number")}
          placeholder="010-1234-5678"
          disabled={isPending || isUploading}
        />
        {errors.phone_number && (
          <p className="text-sm text-destructive">
            {errors.phone_number.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile_photo">프로필 사진 변경 (선택)</Label>
        <Input
          id="profile_photo"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setValue("profile_photo", file);
            }
          }}
          disabled={isPending || isUploading}
        />
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">능력치</h3>

        {(Object.keys(member.stats) as Array<keyof typeof member.stats>).map(
          (statKey) => (
            <div key={statKey} className="space-y-2">
              <div className="flex justify-between">
                <Label>{STAT_LABELS[statKey]}</Label>
                <span className="text-sm text-muted-foreground">
                  {stats[statKey]}
                </span>
              </div>
              <Slider
                value={[stats[statKey]]}
                onValueChange={(value) =>
                  setValue(`stats.${statKey}`, value[0])
                }
                min={0}
                max={100}
                step={1}
                disabled={isPending || isUploading}
              />
            </div>
          ),
        )}
      </div>

      <Button
        type="submit"
        className="w-full rounded-full"
        disabled={isPending || isUploading}
      >
        {isPending || isUploading ? "저장 중..." : "변경 사항 저장"}
      </Button>
    </form>
  );
}
