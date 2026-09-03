import type { AnnouncementRepo } from '@/shared/api/ports/announcement-repo';
import type { AuthRepo } from '@/shared/api/ports/auth-repo';
import type { MatchRepo } from '@/shared/api/ports/match-repo';
import type { MemberRepo } from '@/shared/api/ports/member-repo';
import type { VoteRepo } from '@/shared/api/ports/vote-repo';

export interface ClubApi {
  members: MemberRepo;
  votes: VoteRepo;
  matches: MatchRepo;
  announcements: AnnouncementRepo;
  auth: AuthRepo;
}

export type { AnnouncementRepo, AuthRepo, MatchRepo, MemberRepo, VoteRepo };
export type { AuthUser, DemoAccountKey } from '@/shared/api/ports/auth-repo';
export { DEMO_ACCOUNTS } from '@/shared/api/ports/auth-repo';
export type { RespondInput, VoteResponseWithMember } from '@/shared/api/ports/vote-repo';
