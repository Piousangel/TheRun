import type { Member } from '@/shared/types/member';
import type {
  CreateVoteSessionData,
  UpdateVoteSessionData,
  VoteResponse,
  VoteSession,
} from '@/shared/types/vote';

export type VoteResponseWithMember = VoteResponse & { members: Member | null };

export interface RespondInput {
  sessionId: string;
  memberId: string;
  status: 'attending' | 'absent';
}

export interface VoteRepo {
  /** event_date 내림차순 */
  listSessions(): Promise<VoteSession[]>;
  /** is_active = true, event_date 오름차순 */
  listActiveSessions(): Promise<VoteSession[]>;
  getSession(id: string): Promise<VoteSession | null>;
  createSession(data: CreateVoteSessionData): Promise<VoteSession>;
  updateSession(id: string, data: UpdateVoteSessionData): Promise<VoteSession>;
  removeSession(id: string): Promise<void>;
  listResponses(sessionId: string): Promise<VoteResponseWithMember[]>;
  /** (session_id, member_id) 기준 upsert */
  respond(input: RespondInput): Promise<VoteResponse>;
}
