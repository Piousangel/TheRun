import type { Member, MemberStats } from '@/shared/types/member';
import type { TeamStats } from '@/shared/types/team';

export function calculateMemberTotalStats(stats: MemberStats): number {
  return (
    stats.speed +
    stats.shooting +
    stats.passing +
    stats.dribbling +
    stats.stamina +
    stats.defense
  );
}

export function calculateTeamStats(members: Member[]): TeamStats {
  if (members.length === 0) {
    return {
      avgSpeed: 0,
      avgShooting: 0,
      avgPassing: 0,
      avgDribbling: 0,
      avgStamina: 0,
      avgDefense: 0,
      totalScore: 0,
    };
  }

  const totals = members.reduce(
    (acc, member) => ({
      speed: acc.speed + member.stats.speed,
      shooting: acc.shooting + member.stats.shooting,
      passing: acc.passing + member.stats.passing,
      dribbling: acc.dribbling + member.stats.dribbling,
      stamina: acc.stamina + member.stats.stamina,
      defense: acc.defense + member.stats.defense,
    }),
    { speed: 0, shooting: 0, passing: 0, dribbling: 0, stamina: 0, defense: 0 }
  );

  const count = members.length;
  const avgSpeed = totals.speed / count;
  const avgShooting = totals.shooting / count;
  const avgPassing = totals.passing / count;
  const avgDribbling = totals.dribbling / count;
  const avgStamina = totals.stamina / count;
  const avgDefense = totals.defense / count;

  const totalScore =
    avgSpeed + avgShooting + avgPassing + avgDribbling + avgStamina + avgDefense;

  return {
    avgSpeed,
    avgShooting,
    avgPassing,
    avgDribbling,
    avgStamina,
    avgDefense,
    totalScore,
  };
}

export function autoBalanceTeams(members: Member[]): {
  teamA: Member[];
  teamB: Member[];
} {
  if (members.length < 2) {
    return { teamA: members, teamB: [] };
  }

  // Sort members by total stats (descending)
  const sortedMembers = [...members].sort((a, b) => {
    const totalA = calculateMemberTotalStats(a.stats);
    const totalB = calculateMemberTotalStats(b.stats);
    return totalB - totalA;
  });

  const teamA: Member[] = [];
  const teamB: Member[] = [];

  // Distribute players to balance teams
  sortedMembers.forEach((member, index) => {
    const teamATotal = calculateTeamStats(teamA).totalScore;
    const teamBTotal = calculateTeamStats(teamB).totalScore;

    // Alternate starting with strongest players, then balance by total
    if (teamA.length === teamB.length) {
      if (teamATotal <= teamBTotal) {
        teamA.push(member);
      } else {
        teamB.push(member);
      }
    } else if (teamA.length < teamB.length) {
      teamA.push(member);
    } else {
      teamB.push(member);
    }
  });

  return { teamA, teamB };
}
