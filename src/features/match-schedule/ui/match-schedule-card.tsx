'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { MatchGameCard } from './match-game-card';
import { Plus, Calendar } from 'lucide-react';
import type { VoteSession } from '@/shared/types/vote';

interface MatchScheduleCardProps {
  voteSession: VoteSession;
}

export function MatchScheduleCard({ voteSession }: MatchScheduleCardProps) {
  const [matchCount, setMatchCount] = useState(1);

  const handleAddMatch = () => {
    setMatchCount(prev => prev + 1);
  };

  const handleDeleteMatch = (matchNumber: number) => {
    setMatchCount(prev => Math.max(1, prev - 1));
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {voteSession.title}
            </CardTitle>
            {voteSession.description && (
              <p className="text-sm text-muted-foreground">{voteSession.description}</p>
            )}
          </div>
          <Badge variant="default">
            {new Date(voteSession.event_date).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Match Games */}
        <div className="space-y-4">
          {Array.from({ length: matchCount }, (_, i) => (
            <MatchGameCard
              key={i}
              matchNumber={i + 1}
              voteSessionId={voteSession.id}
              voteTitle={voteSession.title}
              eventDate={voteSession.event_date}
              onDelete={matchCount > 1 ? () => handleDeleteMatch(i + 1) : undefined}
            />
          ))}
        </div>

        {/* Add Match Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleAddMatch}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            경기 추가
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
