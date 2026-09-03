"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { getMemberPhoneDisplay } from "@/shared/lib/utils";
import { MemberAvatar } from "@/entities/member/ui/member-avatar";
import type { Member } from "@/shared/types/member";
import { ArrowRight, Sparkles } from "lucide-react";

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
    <Card className="overflow-hidden border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,244,238,0.94))] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <MemberAvatar
              src={member.profile_photo}
              alt={member.name}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-lg font-semibold">
                  {member.name}
                </h3>
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  AVG {avgStats.toFixed(0)}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {getMemberPhoneDisplay(member.phone_number)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border bg-background/80 p-2.5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Attack
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight">
                {Math.round(
                  (member.stats.shooting + member.stats.dribbling) / 2,
                )}
              </p>
            </div>
            <div className="rounded-xl border bg-background/80 p-2.5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Build
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight">
                {Math.round((member.stats.passing + member.stats.stamina) / 2)}
              </p>
            </div>
            <div className="rounded-xl border bg-background/80 p-2.5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Cover
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight">
                {Math.round((member.stats.speed + member.stats.defense) / 2)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full rounded-full"
        >
          <Link href={`/members/${member.id}`}>
            상세 보기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
