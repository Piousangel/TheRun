import type { Collection } from '@/shared/api/adapters/collection/collection';
import { newId } from '@/shared/lib/id';
import type { MatchRepo } from '@/shared/api/ports/match-repo';
import type { Match } from '@/shared/types/match';

export function createCollectionMatchRepo(matches: Collection<Match>, now: () => Date): MatchRepo {
  return {
    async list() {
      return (await matches.all()).sort((a, b) => b.date.localeCompare(a.date));
    },
    get(id) {
      return matches.get(id);
    },
    async create(data) {
      const at = now().toISOString();
      return matches.insert({
        id: newId(),
        date: data.date,
        location: data.location,
        team_a: data.team_a,
        team_b: data.team_b,
        notes: data.notes ?? null,
        vote_session_id: data.vote_session_id ?? null,
        match_number: data.match_number ?? null,
        status: data.status ?? 'pending',
        start_time: data.start_time ?? null,
        end_time: data.end_time ?? null,
        duration: data.duration ?? null,
        created_at: at,
        updated_at: at,
      });
    },
    update(id, data) {
      return matches.update(id, { ...data, updated_at: now().toISOString() });
    },
    remove(id) {
      return matches.remove(id);
    },
  };
}
