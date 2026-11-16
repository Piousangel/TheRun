import { createCollectionAnnouncementRepo } from '@/shared/api/adapters/collection/announcement-repo';
import { createCollectionAuditRepo } from '@/shared/api/adapters/collection/audit-repo';
import { createCollectionAuthRepo } from '@/shared/api/adapters/collection/auth-repo';
import { createCollectionCheckinRepo } from '@/shared/api/adapters/collection/checkin-repo';
import { Collection } from '@/shared/api/adapters/collection/collection';
import { createCollectionLeagueRepo } from '@/shared/api/adapters/collection/league-repo';
import { createCollectionMatchRepo } from '@/shared/api/adapters/collection/match-repo';
import { createCollectionMemberRepo } from '@/shared/api/adapters/collection/member-repo';
import { buildSeed } from '@/shared/api/adapters/collection/seed';
import type { CollectionStorage, SessionStore } from '@/shared/api/adapters/collection/storage';
import { createCollectionVoteRepo } from '@/shared/api/adapters/collection/vote-repo';
import type { ClubApi } from '@/shared/api/ports';

interface Deps {
  storage: CollectionStorage;
  session: SessionStore;
  now?: () => Date;
}

export function createCollectionApi({ storage, session, now = () => new Date() }: Deps): ClubApi {
  // 시드는 컬렉션이 처음 읽힐 때 한 번만 계산되도록 지연한다.
  let seedCache: ReturnType<typeof buildSeed> | null = null;
  const seed = () => (seedCache ??= buildSeed(now()));

  const users = new Collection(storage, 'users', () => seed().users);
  const profiles = new Collection(storage, 'app_profiles', () => seed().profiles);
  const members = new Collection(storage, 'members', () => seed().members);
  const voteSessions = new Collection(storage, 'vote_sessions', () => seed().voteSessions);
  const voteResponses = new Collection(storage, 'vote_responses', () => seed().voteResponses);
  const matches = new Collection(storage, 'matches', () => seed().matches);
  const announcements = new Collection(storage, 'announcements', () => seed().announcements);
  const reads = new Collection(storage, 'announcement_reads', () => seed().announcementReads);

  const league = createCollectionLeagueRepo({
    seasons: new Collection(storage, 'league_seasons', () => []),
    teams: new Collection(storage, 'league_teams', () => []),
    matchdays: new Collection(storage, 'league_matchdays', () => []),
    fixtures: new Collection(storage, 'league_fixtures', () => []),
    now,
  });

  const audit = createCollectionAuditRepo(new Collection(storage, 'audit_logs', () => []), now);
  const checkins = createCollectionCheckinRepo({ checkins: new Collection(storage, 'checkins', () => []), audit, now });

  return {
    members: createCollectionMemberRepo(members, now),
    votes: createCollectionVoteRepo({ sessions: voteSessions, responses: voteResponses, members, now }),
    matches: createCollectionMatchRepo(matches, now),
    announcements: createCollectionAnnouncementRepo({ announcements, reads, currentUserId: () => session.get(), now }),
    auth: createCollectionAuthRepo({ users, profiles, members, session, now }),
    league,
    checkins,
    audit,
  };
}
