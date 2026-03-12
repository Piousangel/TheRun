'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateVoteSession } from '@/entities/vote/model/queries';
import { voteCreateSchema, type VoteCreateFormData } from '../model/schema';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { format, addDays, nextSaturday, setHours, setMinutes, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface VoteCreateFormProps {
  onSuccess: () => void;
}

const voteTypeLabels = {
  match: '⚽ 경기',
  dining: '🍴 회식',
  outing: '🎉 야유회',
  other: '📌 기타',
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
      title: '',
      description: '',
      type: 'match',
      event_date: format(nextSaturday(new Date()), "yyyy-MM-dd'T'HH:mm"),
      deadline: format(
        setMinutes(setHours(addDays(new Date(), 1), 23), 59),
        "yyyy-MM-dd'T'HH:mm"
      ),
    },
  });

  const selectedType = watch('type');
  const selectedEventDate = watch('event_date');
  const selectedDeadline = watch('deadline');

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
        onSuccess,
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="type">투표 유형</Label>
        <Select
          value={selectedType}
          onValueChange={(value) => setValue('type', value as VoteCreateFormData['type'])}
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
        {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="예: 이번 주 토요일 경기"
          disabled={isPending}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">설명 (선택)</Label>
        <Input
          id="description"
          {...register('description')}
          placeholder="추가 설명이 필요하면 입력해주세요"
          disabled={isPending}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="event_date">이벤트 날짜 및 시간</Label>
        <Input
          id="event_date"
          type="datetime-local"
          {...register('event_date')}
          disabled={isPending}
        />
        {selectedEventDate && (
          <p className="text-xs text-muted-foreground">
            📅 {format(parseISO(selectedEventDate), 'yyyy년 MM월 dd일 (EEEE) HH:mm', { locale: ko })}
          </p>
        )}
        {errors.event_date && (
          <p className="text-sm text-destructive">{errors.event_date.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="deadline">투표 마감 시간</Label>
        <Input
          id="deadline"
          type="datetime-local"
          {...register('deadline')}
          disabled={isPending}
        />
        {selectedDeadline && (
          <p className="text-xs text-muted-foreground">
            📅 {format(parseISO(selectedDeadline), 'MM월 dd일 (EEEE) HH:mm', { locale: ko })}
          </p>
        )}
        {errors.deadline && (
          <p className="text-sm text-destructive">{errors.deadline.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          💡 팁: 경기는 보통 금요일 자정에 마감됩니다
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? '생성 중...' : '투표 생성'}
      </Button>
    </form>
  );
}
