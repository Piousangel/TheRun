'use client';

import { useDroppable } from '@dnd-kit/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { Users, ArrowRight } from 'lucide-react';
import { ReactNode } from 'react';

interface DroppableTeamProps {
  id: string;
  title: string;
  count: number;
  stats?: {
    totalScore: number;
    avgSpeed: number;
    avgShooting: number;
    avgPassing: number;
  } | null;
  children: ReactNode;
  onClick?: () => void;
  isClickable?: boolean;
}

export function DroppableTeam({ id, title, count, stats, children, onClick, isClickable = false }: DroppableTeamProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <Card className={`transition-colors ${isOver ? 'border-primary bg-primary/5' : ''} ${isClickable ? 'cursor-pointer hover:border-primary' : ''}`}>
      <CardHeader onClick={isClickable ? onClick : undefined}>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{count}명</Badge>
            {isClickable && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
        {stats && (
          <CardDescription>
            평균 능력치: {stats.totalScore.toFixed(1)}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div ref={setNodeRef} className="min-h-[200px]">
          {children}
        </div>

        {stats && (
          <>
            <Separator className="my-4" />
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <p className="text-muted-foreground">스피드</p>
                <p className="font-semibold">{stats.avgSpeed.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">슈팅</p>
                <p className="font-semibold">{stats.avgShooting.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">패스</p>
                <p className="font-semibold">{stats.avgPassing.toFixed(0)}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
