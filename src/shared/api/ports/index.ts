import type { AnnouncementRepo } from '@/shared/api/ports/announcement-repo';
import type { AuditRepo } from '@/shared/api/ports/audit-repo';
import type { AuthRepo } from '@/shared/api/ports/auth-repo';
import type { ChatRepo } from '@/shared/api/ports/chat-repo';
import type { CheckinRepo } from '@/shared/api/ports/checkin-repo';
import type { LeagueRepo } from '@/shared/api/ports/league-repo';
import type { MatchRepo } from '@/shared/api/ports/match-repo';
import type { MemberRepo } from '@/shared/api/ports/member-repo';
import type { VoteRepo } from '@/shared/api/ports/vote-repo';

export interface ClubApi {
  members: MemberRepo;
  votes: VoteRepo;
  matches: MatchRepo;
  announcements: AnnouncementRepo;
  auth: AuthRepo;
  league: LeagueRepo;
  checkins: CheckinRepo;
  audit: AuditRepo;
  chat: ChatRepo;
}

export type { AnnouncementRepo, AuditRepo, AuthRepo, ChatRepo, CheckinRepo, LeagueRepo, MatchRepo, MemberRepo, VoteRepo };
export type { AuthUser, DemoAccountKey } from '@/shared/api/ports/auth-repo';
export { DEMO_ACCOUNTS } from '@/shared/api/ports/auth-repo';
export type { RespondInput, VoteResponseWithMember } from '@/shared/api/ports/vote-repo';
