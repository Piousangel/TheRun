'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useCreateMember } from '@/entities/member/model/queries';
import { uploadProfilePhoto } from '@/shared/api/supabase/storage';
import { memberCreateSchema, type MemberCreateFormData } from '../model/schema';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Slider } from '@/shared/ui/slider';
import { STAT_LABELS, DEFAULT_STATS } from '@/shared/lib/constants';

interface MemberCreateFormProps {
  onSuccess: () => void;
}

export function MemberCreateForm({ onSuccess }: MemberCreateFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { mutate: createMember, isPending } = useCreateMember();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<MemberCreateFormData>({
    resolver: zodResolver(memberCreateSchema),
    defaultValues: {
      name: '',
      phone_number: '',
      stats: DEFAULT_STATS,
    },
  });

  const stats = watch('stats');

  const handleFormSubmit = async (data: MemberCreateFormData) => {
    setIsUploading(true);
    let photoUrl = '';

    try {
      if (data.profile_photo) {
        const tempId = crypto.randomUUID();
        photoUrl = await uploadProfilePhoto(data.profile_photo, tempId);
      }

      createMember(
        {
          name: data.name,
          phone_number: data.phone_number,
          profile_photo: photoUrl || undefined,
          stats: data.stats,
        },
        {
          onSuccess: () => {
            onSuccess();
          },
        }
      );
    } catch (error) {
      console.error('Failed to upload photo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          {...register('name')}
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
          {...register('phone_number')}
          placeholder="010-1234-5678"
          disabled={isPending || isUploading}
        />
        {errors.phone_number && (
          <p className="text-sm text-destructive">{errors.phone_number.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile_photo">프로필 사진 (선택)</Label>
        <Input
          id="profile_photo"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setValue('profile_photo', file);
            }
          }}
          disabled={isPending || isUploading}
        />
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">능력치</h3>

        {(Object.keys(DEFAULT_STATS) as Array<keyof typeof DEFAULT_STATS>).map((statKey) => (
          <div key={statKey} className="space-y-2">
            <div className="flex justify-between">
              <Label>{STAT_LABELS[statKey]}</Label>
              <span className="text-sm text-muted-foreground">{stats[statKey]}</span>
            </div>
            <Slider
              value={[stats[statKey]]}
              onValueChange={(value) => setValue(`stats.${statKey}`, value[0])}
              min={0}
              max={100}
              step={1}
              disabled={isPending || isUploading}
            />
          </div>
        ))}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || isUploading}
      >
        {isPending || isUploading ? '저장 중...' : '멤버 추가'}
      </Button>
    </form>
  );
}
