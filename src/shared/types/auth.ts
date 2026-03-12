export type AppRole = 'admin' | 'member';

export interface AppProfile {
  id: string;
  email: string | null;
  role: AppRole;
  member_id: string | null;
  created_at: string;
  updated_at: string;
}
