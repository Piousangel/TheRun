'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useCreateAnnouncement } from '@/entities/announcement/model/queries';
import { announcementCreateSchema, type AnnouncementCreateFormData } from '../model/schema';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';

interface AnnouncementCreateFormProps {
  onSuccess: () => void;
}

const categoryLabels = {
  general: '일반',
  match: '경기',
  schedule: '일정',
  urgent: '긴급',
} as const;

export function AnnouncementCreateForm({ onSuccess }: AnnouncementCreateFormProps) {
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
      title: '',
      body: '',
      category: 'general',
      is_pinned: false,
    },
  });

  const category = watch('category');
  const isPinned = watch('is_pinned');

  const onSubmit = (data: AnnouncementCreateFormData) => {
    createAnnouncement(data, {
      onSuccess: () => {
        toast.success('공지 등록이 완료되었습니다.');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">제목</Label>
        <Input id="title" {...register('title')} placeholder="예: 이번 주 토요일 운동 시간 변경" disabled={isPending} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">카테고리</Label>
        <Select value={category} onValueChange={(value) => setValue('category', value as AnnouncementCreateFormData['category'])}>
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">내용</Label>
        <Textarea id="body" {...register('body')} placeholder="공지 내용을 입력하세요" disabled={isPending} />
        {errors.body && <p className="text-sm text-destructive">{errors.body.message}</p>}
      </div>

      <label className="flex items-center gap-3 rounded-xl border p-3 text-sm">
        <input
          type="checkbox"
          checked={isPinned}
          onChange={(event) => setValue('is_pinned', event.target.checked)}
          disabled={isPending}
        />
        중요 공지로 상단 고정
      </label>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? '공지 저장 중...' : '공지 등록'}
      </Button>
    </form>
  );
}
