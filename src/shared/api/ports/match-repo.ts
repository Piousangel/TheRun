import type { CreateMatchData, Match, UpdateMatchData } from '@/shared/types/match';

export interface MatchRepo {
  /** date 내림차순 */
  list(): Promise<Match[]>;
  get(id: string): Promise<Match | null>;
  create(data: CreateMatchData): Promise<Match>;
  update(id: string, data: UpdateMatchData): Promise<Match>;
  remove(id: string): Promise<void>;
}
