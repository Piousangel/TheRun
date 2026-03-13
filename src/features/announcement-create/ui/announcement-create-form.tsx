"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useCreateAnnouncement } from "@/entities/announcement/model/queries";
import {
  announcementCreateSchema,
  type AnnouncementCreateFormData,
} from "../model/schema";
import { Button } from "@/shared/ui/button";
import { FormSection } from "@/shared/ui/form-section";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

interface AnnouncementCreateFormProps {
  onSuccess: () => void;
}

const categoryLabels = {
  general: "일반",
  match: "경기",
  schedule: "일정",
  urgent: "긴급",
} as const;

export function AnnouncementCreateForm({
  onSuccess,
}: AnnouncementCreateFormProps) {
  const { mutate: createAnnouncement, isPending } = useCreateAnnouncement();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AnnouncementCreateFormData>({
    resolver: zodResolver(announcementCreateSchema),
    defaultValues: {
      title: "",
      body: "",
      category: "general",
      is_pinned: false,
    },
  });

  const category = watch("category");
  const isPinned = watch("is_pinned");

  const onSubmit = (data: AnnouncementCreateFormData) => {
    createAnnouncement(data, {
      onSuccess: () => {
        toast.success("공지 등록이 완료되었습니다.");
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormSection
        title="공지 정보"
        description="공지의 성격과 제목을 먼저 정리합니다."
      >
        <div className="space-y-2">
          <Label htmlFor="title">제목</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="예: 이번 주 토요일 운동 시간 변경"
            disabled={isPending}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">카테고리</Label>
          <Select
            value={category}
            onValueChange={(value) =>
              setValue(
                "category",
                value as AnnouncementCreateFormData["category"],
              )
            }
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="카테고리를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-destructive">
              {errors.category.message}
            </p>
          )}
        </div>
      </FormSection>

      <FormSection
        title="공지 본문"
        description="멤버가 바로 이해할 수 있도록 핵심만 간결하게 적습니다."
      >
        <div className="space-y-2">
          <Label htmlFor="body">내용</Label>
          <Textarea
            id="body"
            {...register("body")}
            placeholder="공지 내용을 입력하세요"
            disabled={isPending}
          />
          {errors.body && (
            <p className="text-sm text-destructive">{errors.body.message}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setValue("is_pinned", !isPinned)}
          disabled={isPending}
          className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all ${
            isPinned
              ? "border-primary/20 bg-primary/10 shadow-sm"
              : "bg-muted/30 hover:bg-muted/50"
          }`}
        >
          <div>
            <p className="text-sm font-medium">중요 공지로 상단 고정</p>
            <p className="mt-1 text-xs text-muted-foreground">
              긴급하거나 꼭 읽어야 하는 공지를 위에 고정합니다.
            </p>
          </div>
          <div
            className={`h-6 w-11 rounded-full border transition-all ${isPinned ? "border-primary/30 bg-primary/20" : "border-border bg-background"}`}
          >
            <div
              className={`h-5 w-5 rounded-full bg-white shadow transition-all ${isPinned ? "translate-x-5" : "translate-x-0"}`}
            />
          </div>
        </button>
      </FormSection>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "공지 저장 중..." : "공지 등록"}
      </Button>
    </form>
  );
}
