"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useCreateVoteSession } from "@/entities/vote/model/queries";
import { voteCreateSchema, type VoteCreateFormData } from "@/features/vote-create/model/schema";
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
import {
  format,
  addDays,
  nextSaturday,
  setHours,
  setMinutes,
  parseISO,
} from "date-fns";
import { ko } from "date-fns/locale";
import { Textarea } from "@/shared/ui/textarea";

interface VoteCreateFormProps {
  onSuccess: () => void;
}

const voteTypeLabels = {
  match: "⚽ 경기",
  dining: "🍴 회식",
  outing: "🎉 야유회",
  other: "📌 기타",
};

export function VoteCreateForm({ onSuccess }: VoteCreateFormProps) {
  const { mutate: createVote, isPending } = useCreateVoteSession();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<VoteCreateFormData>({
    resolver: zodResolver(voteCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "match",
      event_date: format(nextSaturday(new Date()), "yyyy-MM-dd'T'HH:mm"),
      deadline: format(
        setMinutes(setHours(addDays(new Date(), 1), 23), 59),
        "yyyy-MM-dd'T'HH:mm",
      ),
    },
  });

  const selectedType = watch("type");
  const selectedEventDate = watch("event_date");
  const selectedDeadline = watch("deadline");

  const handleFormSubmit = (data: VoteCreateFormData) => {
    createVote(
      {
        title: data.title,
        description: data.description || undefined,
        type: data.type,
        event_date: data.event_date,
        deadline: data.deadline,
      },
      {
        onSuccess: () => {
          toast.success("투표 생성이 완료되었습니다.");
          onSuccess();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border bg-background/80 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Type
          </p>
          <p className="mt-3 text-base font-semibold">
            {voteTypeLabels[selectedType]}
          </p>
        </div>
        <div className="rounded-2xl border bg-background/80 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Event
          </p>
          <p className="mt-3 text-sm font-semibold">
            {selectedEventDate
              ? format(parseISO(selectedEventDate), "MM월 dd일 HH:mm", {
                  locale: ko,
                })
              : "미정"}
          </p>
        </div>
        <div className="rounded-2xl border bg-[linear-gradient(160deg,rgba(200,168,88,0.08),rgba(255,255,255,0.98))] p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Deadline
          </p>
          <p className="mt-3 text-sm font-semibold">
            {selectedDeadline
              ? format(parseISO(selectedDeadline), "MM월 dd일 HH:mm", {
                  locale: ko,
                })
              : "미정"}
          </p>
        </div>
      </div>

      <FormSection
        title="투표 기본 정보"
        description="무슨 투표인지와 멤버가 이해할 제목/설명을 먼저 만듭니다."
      >
        <div className="space-y-2">
          <Label htmlFor="type">투표 유형</Label>
          <Select
            value={selectedType}
            onValueChange={(value) =>
              setValue("type", value as VoteCreateFormData["type"])
            }
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="투표 유형 선택" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(voteTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-destructive">{errors.type.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">제목</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="예: 이번 주 토요일 경기"
            disabled={isPending}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">설명 (선택)</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="집합 시간, 준비물, 참고사항이 있으면 적어주세요"
            disabled={isPending}
            className="min-h-[110px]"
          />
          {errors.description && (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>
      </FormSection>

      <FormSection
        title="일정 설정"
        description="이벤트 시간과 응답 마감 시간을 분리해서 정합니다."
      >
        <div className="space-y-2">
          <Label htmlFor="event_date">이벤트 날짜 및 시간</Label>
          <Input
            id="event_date"
            type="datetime-local"
            {...register("event_date")}
            disabled={isPending}
          />
          {selectedEventDate && (
            <p className="text-xs text-muted-foreground">
              📅{" "}
              {format(
                parseISO(selectedEventDate),
                "yyyy년 MM월 dd일 (EEEE) HH:mm",
                { locale: ko },
              )}
            </p>
          )}
          {errors.event_date && (
            <p className="text-sm text-destructive">
              {errors.event_date.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="deadline">투표 마감 시간</Label>
          <Input
            id="deadline"
            type="datetime-local"
            {...register("deadline")}
            disabled={isPending}
          />
          {selectedDeadline && (
            <p className="text-xs text-muted-foreground">
              📅{" "}
              {format(parseISO(selectedDeadline), "MM월 dd일 (EEEE) HH:mm", {
                locale: ko,
              })}
            </p>
          )}
          {errors.deadline && (
            <p className="text-sm text-destructive">
              {errors.deadline.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            💡 팁: 경기는 보통 금요일 자정에 마감됩니다
          </p>
        </div>
      </FormSection>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "생성 중..." : "투표 생성"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        생성 후에는 공지/전략/경기 흐름과 바로 연결할 수 있습니다.
      </p>
    </form>
  );
}
