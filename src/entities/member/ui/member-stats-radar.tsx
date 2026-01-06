'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import type { Member } from '@/shared/types/member';
import { STAT_LABELS } from '@/shared/lib/constants';

interface MemberStatsRadarProps {
  member: Member;
}

export function MemberStatsRadar({ member }: MemberStatsRadarProps) {
  const data = [
    {
      stat: STAT_LABELS.speed,
      value: member.stats.speed,
      fullMark: 100,
    },
    {
      stat: STAT_LABELS.shooting,
      value: member.stats.shooting,
      fullMark: 100,
    },
    {
      stat: STAT_LABELS.passing,
      value: member.stats.passing,
      fullMark: 100,
    },
    {
      stat: STAT_LABELS.dribbling,
      value: member.stats.dribbling,
      fullMark: 100,
    },
    {
      stat: STAT_LABELS.stamina,
      value: member.stats.stamina,
      fullMark: 100,
    },
    {
      stat: STAT_LABELS.defense,
      value: member.stats.defense,
      fullMark: 100,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis
          dataKey="stat"
          tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
        />
        <Radar
          name={member.name}
          dataKey="value"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.6}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
