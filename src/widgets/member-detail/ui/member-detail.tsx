'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMember } from '@/entities/member/model/queries';
import { MemberAvatar } from '@/entities/member/ui/member-avatar';
import { MemberStatsRadar } from '@/entities/member/ui/member-stats-radar';
import { MemberEditForm } from '@/features/member-edit/ui/member-edit-form';
import { MemberDeleteButton } from '@/features/member-delete/ui/member-delete-button';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { ArrowLeft, Edit } from 'lucide-react';

interface MemberDetailProps {
  memberId: string;
}

export function MemberDetail({ memberId }: MemberDetailProps) {
  const { data: member, isLoading, error } = useMember(memberId);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleEditSuccess = () => {
    setIsEditOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] space-y-4">
        <p className="text-destructive">
          {error ? `오류가 발생했습니다: ${error.message}` : '멤버를 찾을 수 없습니다.'}
        </p>
        <Link href="/members">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Link href="/members">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setIsEditOpen(true)}
            >
              <Edit className="mr-2 h-4 w-4" />
              수정
            </Button>
            <MemberDeleteButton memberId={member.id} memberName={member.name} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>멤버 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4 text-center">
              <MemberAvatar src={member.profile_photo} alt={member.name} size="lg" />
              <div>
                <h2 className="text-2xl font-bold">{member.name}</h2>
                <p className="text-muted-foreground">{member.phone_number}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>능력치</CardTitle>
          </CardHeader>
          <CardContent>
            <MemberStatsRadar member={member} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">스피드</p>
                <p className="text-2xl font-bold text-primary">{member.stats.speed}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">슈팅</p>
                <p className="text-2xl font-bold text-primary">{member.stats.shooting}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">패스</p>
                <p className="text-2xl font-bold text-primary">{member.stats.passing}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">드리블</p>
                <p className="text-2xl font-bold text-primary">{member.stats.dribbling}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">체력</p>
                <p className="text-2xl font-bold text-primary">{member.stats.stamina}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">수비</p>
                <p className="text-2xl font-bold text-primary">{member.stats.defense}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>멤버 정보 수정</DialogTitle>
            <DialogDescription>
              {member.name} 멤버의 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <MemberEditForm member={member} onSuccess={handleEditSuccess} />
        </DialogContent>
      </Dialog>
    </>
  );
}
