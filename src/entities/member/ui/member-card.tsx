'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { MemberAvatar } from './member-avatar';
import type { Member } from '@/shared/types/member';

interface MemberCardProps {
  member: Member;
}

export function MemberCard({ member }: MemberCardProps) {
  const avgStats =
    (member.stats.speed +
      member.stats.shooting +
      member.stats.passing +
      member.stats.dribbling +
      member.stats.stamina +
      member.stats.defense) /
    6;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-3">
          <MemberAvatar src={member.profile_photo} alt={member.name} size="md" />
          <div className="text-center">
            <h3 className="font-semibold text-lg">{member.name}</h3>
            <p className="text-sm text-muted-foreground">{member.phone_number}</p>
          </div>
          <Badge variant="secondary">평균 능력치: {avgStats.toFixed(0)}</Badge>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link href={`/members/${member.id}`}>
          <Button variant="outline" size="sm">
            상세 보기
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
