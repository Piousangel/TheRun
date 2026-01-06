export interface MemberStats {
  speed: number;
  shooting: number;
  passing: number;
  dribbling: number;
  stamina: number;
  defense: number;
}

export interface Member {
  id: string;
  name: string;
  phone_number: string;
  profile_photo: string | null;
  stats: MemberStats;
  created_at: string;
  updated_at: string;
}

export interface CreateMemberData {
  name: string;
  phone_number: string;
  profile_photo?: string;
  stats: MemberStats;
}

export interface UpdateMemberData {
  name?: string;
  phone_number?: string;
  profile_photo?: string;
  stats?: MemberStats;
}
