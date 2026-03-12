'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { UserRound, Shield, Link2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useMembers } from '@/entities/member/model/queries';
import { useLinkMemberProfile, useUnlinkMemberProfile } from '@/entities/auth/model/queries';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/shared/api/supabase/config';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { PageHero } from '@/shared/ui/page-hero';
import { StatTile } from '@/shared/ui/stat-tile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

export function MyPageContent() {
  const { user, profile, member, isAdmin, isLinked, isLoading } = useAuth();
  const { data: members } = useMembers();
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const linkMutation = useLinkMemberProfile(user?.id ?? null);
  const unlinkMutation = useUnlinkMemberProfile(user?.id ?? null);

  const availableMembers = useMemo(() => members ?? [], [members]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    try {
      await linkMutation.mutateAsync({
        memberId: selectedMemberId,
        phoneNumber,
      });
      setMessage('내 멤버 연결이 완료되었습니다.');
      toast.success('내 멤버 연결이 완료되었습니다.');
      setPhoneNumber('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '멤버 연결에 실패했습니다.';
      setMessage(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleUnlink = async () => {
    setMessage(null);

    try {
      await unlinkMutation.mutateAsync();
      setSelectedMemberId('');
      setMessage('멤버 연결을 해제했습니다.');
      toast.success('멤버 연결을 해제했습니다.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '연결 해제에 실패했습니다.';
      setMessage(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return <div className="py-10 text-center text-sm text-muted-foreground">내 정보를 불러오는 중...</div>;
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">내 계정</h1>
          <p className="text-sm text-muted-foreground">로그인 후 내 멤버와 연결하면 개인 투표/출석 흐름을 사용할 수 있습니다.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>로그인이 필요합니다</CardTitle>
            <CardDescription>이메일 링크 로그인을 사용하면 바로 내 계정으로 들어올 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button>로그인하러 가기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="My Account"
        title="내 계정"
        description="로그인 상태, 역할, 멤버 연결 여부를 확인하고 내 응답 흐름을 사용할 준비를 마칩니다."
        meta={<>
          <Badge variant="secondary">역할 {isAdmin ? '관리자' : '일반 멤버'}</Badge>
          <Badge variant="secondary">연결 {isLinked ? '완료' : '필요'}</Badge>
        </>}
        actions={
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile label="계정 상태" value={user.email ? 'ACTIVE' : 'NONE'} icon={<UserRound className="h-5 w-5" />} />
        <StatTile label="권한" value={isAdmin ? 'ADMIN' : 'MEMBER'} icon={<Shield className="h-5 w-5" />} tone={isAdmin ? 'success' : 'muted'} />
        <StatTile label="멤버 연결" value={isLinked ? 'READY' : 'PENDING'} icon={<Link2 className="h-5 w-5" />} tone={isLinked ? 'success' : 'danger'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" />
              로그인 계정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">이메일:</span> {profile?.email ?? user.email ?? '없음'}</p>
            <p><span className="text-muted-foreground">역할:</span> {isAdmin ? '관리자' : '일반 멤버'}</p>
            <p><span className="text-muted-foreground">멤버 연결:</span> {isLinked ? '완료' : '필요'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              현재 상태
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>- 일반 멤버는 본인 응답 중심으로 투표/출석하게 됩니다.</p>
            <p>- 관리자는 멤버/투표/운영 화면의 생성 및 삭제 작업을 계속 볼 수 있습니다.</p>
            <p>- 다음 단계에서 DB 권한을 더 강하게 적용해 UI와 데이터 권한을 일치시킬 예정입니다.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            내 멤버 연결
          </CardTitle>
          <CardDescription>처음 한 번만 연결하면 투표/출석에서 내 이름으로 바로 동작합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {member ? (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <div>
                <p className="font-semibold">현재 연결된 멤버</p>
                <p className="text-sm text-muted-foreground">{member.name} · {member.phone_number}</p>
              </div>
              <Button variant="outline" onClick={handleUnlink} disabled={unlinkMutation.isPending}>
                {unlinkMutation.isPending ? '해제 중...' : '연결 해제'}
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleLink}>
              <div className="space-y-2">
                <Label htmlFor="member">내 이름 선택</Label>
                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                  <SelectTrigger id="member">
                    <SelectValue placeholder="멤버를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map((availableMember) => (
                      <SelectItem key={availableMember.id} value={availableMember.id}>
                        {availableMember.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">전화번호 확인</Label>
                <Input
                  id="phone_number"
                  placeholder="010-1234-5678"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  disabled={linkMutation.isPending}
                />
              </div>

              {message && (
                <p className={`text-sm ${message.includes('완료') ? 'text-primary' : 'text-destructive'}`}>
                  {message}
                </p>
              )}

              <Button type="submit" disabled={!selectedMemberId || !phoneNumber.trim() || linkMutation.isPending}>
                {linkMutation.isPending ? '연결 중...' : '내 멤버 연결하기'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
