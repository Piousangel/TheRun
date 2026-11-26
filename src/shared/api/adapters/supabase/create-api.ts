import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/shared/api/adapters/supabase/config';
import { withSingleActiveMatchSession } from '@/shared/api/adapters/single-active-match';
import type { AuditRepo, CheckinRepo, ClubApi, LeagueRepo } from '@/shared/api/ports';
import { ApiError, isSchemaMissingError } from '@/shared/api/ports/errors';
import type { AuthUser } from '@/shared/api/ports/auth-repo';
import type { VoteResponseWithMember } from '@/shared/api/ports/vote-repo';
import { generateInviteCode } from '@/shared/lib/invite-code';
import { normalizePhoneNumber } from '@/shared/lib/utils';
import type { Announcement, AnnouncementRead } from '@/shared/types/announcement';
import type { AppProfile } from '@/shared/types/auth';
import type { Match } from '@/shared/types/match';
import type { Member } from '@/shared/types/member';
import type { VoteResponse, VoteSession } from '@/shared/types/vote';

function createUnavailableLeagueRepo(): LeagueRepo {
  const fail = async (): Promise<never> => {
    throw new ApiError('리그 기능은 Supabase 스키마 적용 후에 사용할 수 있습니다.', 'LEAGUE_NOT_MIGRATED');
  };
  return {
    listSeasons: fail, getSeason: fail, createSeason: fail, updateSeason: fail, removeSeason: fail,
    listTeams: fail, createTeam: fail, updateTeam: fail, removeTeam: fail,
    listMatchdays: fail, listFixtures: fail, generateSchedule: fail, setFixtureStatus: fail,
    listGoals: fail, addGoal: fail, removeGoal: fail, listAppearances: fail, setLineup: fail,
    listMiniGames: fail, createMiniGame: fail, removeMiniGame: fail, setMiniGameResults: fail,
    listAvailability: fail, setAvailability: fail,
  };
}

function createUnavailableCheckinRepo(): CheckinRepo {
  const fail = async (): Promise<never> => {
    throw new ApiError('출석 체크인은 Supabase 스키마 적용 후에 사용할 수 있습니다.', 'CHECKIN_NOT_MIGRATED');
  };
  return { listByDate: fail, listByMember: fail, checkIn: fail, confirm: fail };
}

function createUnavailableAuditRepo(): AuditRepo {
  const fail = async (): Promise<never> => {
    throw new ApiError('감사 기록은 Supabase 스키마 적용 후에 사용할 수 있습니다.', 'AUDIT_NOT_MIGRATED');
  };
  return { record: fail, listFor: fail };
}

function toAuthUser(user: User | null | undefined): AuthUser | null {
  return user ? { id: user.id, email: user.email ?? null } : null;
}

/** PostgrestError의 code를 버리지 않는다 — 호출부가 실패 원인을 구분해야 한다. */
function throwIf(error: { message: string; code?: string } | null): void {
  if (error) throw new ApiError(error.message, error.code);
}

export function createSupabaseApi(): ClubApi {
  const supabase = getSupabaseClient();
  return {
    members: {
      async list() {
        const { data, error } = await supabase.from('members').select('*').order('created_at', { ascending: false });
        throwIf(error);
        return (data ?? []) as Member[];
      },
      async get(id) {
        const { data, error } = await supabase.from('members').select('*').eq('id', id).maybeSingle();
        throwIf(error);
        return (data as Member | null) ?? null;
      },
      async create(input) {
        const { data, error } = await supabase.from('members').insert(input).select().single();
        throwIf(error);
        return data as Member;
      },
      async update(id, input) {
        const { data, error } = await supabase.from('members').update(input).eq('id', id).select().single();
        throwIf(error);
        return data as Member;
      },
      async remove(id) {
        const { error } = await supabase.from('members').delete().eq('id', id);
        throwIf(error);
      },
      async uploadPhoto(file, memberId) {
        const fileExt = file.name.split('.').pop();
        const filePath = `profiles/${memberId}-${Date.now()}.${fileExt}`;
        const { error } = await supabase.storage.from('member-photos').upload(filePath, file, { cacheControl: '3600', upsert: false });
        throwIf(error);
        return supabase.storage.from('member-photos').getPublicUrl(filePath).data.publicUrl;
      },
    },

    votes: withSingleActiveMatchSession({
      async listSessions() {
        const { data, error } = await supabase.from('vote_sessions').select('*').order('event_date', { ascending: false });
        throwIf(error);
        return (data ?? []) as VoteSession[];
      },
      async listActiveSessions() {
        const { data, error } = await supabase.from('vote_sessions').select('*').eq('is_active', true).order('event_date', { ascending: true });
        throwIf(error);
        return (data ?? []) as VoteSession[];
      },
      async getSession(id) {
        const { data, error } = await supabase.from('vote_sessions').select('*').eq('id', id).maybeSingle();
        throwIf(error);
        return (data as VoteSession | null) ?? null;
      },
      async createSession(input) {
        const { data, error } = await supabase.from('vote_sessions').insert({ ...input, is_active: true }).select().single();
        throwIf(error);
        return data as VoteSession;
      },
      async updateSession(id, input) {
        const { data, error } = await supabase.from('vote_sessions').update(input).eq('id', id).select().single();
        throwIf(error);
        return data as VoteSession;
      },
      async removeSession(id) {
        const { error } = await supabase.from('vote_sessions').delete().eq('id', id);
        throwIf(error);
      },
      async listResponses(sessionId) {
        const { data, error } = await supabase.from('vote_responses').select('*, members(*)').eq('session_id', sessionId);
        throwIf(error);
        return (data ?? []) as VoteResponseWithMember[];
      },
      async respond({ sessionId, memberId, status }) {
        const { data, error } = await supabase
          .from('vote_responses')
          .upsert({ session_id: sessionId, member_id: memberId, status }, { onConflict: 'session_id,member_id' })
          .select()
          .single();
        throwIf(error);
        return data as VoteResponse;
      },
    }),

    matches: {
      async list() {
        const { data, error } = await supabase.from('matches').select('*').order('date', { ascending: false });
        throwIf(error);
        return (data ?? []) as Match[];
      },
      async get(id) {
        const { data, error } = await supabase.from('matches').select('*').eq('id', id).maybeSingle();
        throwIf(error);
        return (data as Match | null) ?? null;
      },
      async create(input) {
        const { data, error } = await supabase
          .from('matches')
          .insert({ ...input, status: input.status ?? 'pending', start_time: input.start_time ?? null, end_time: input.end_time ?? null, duration: input.duration ?? null })
          .select()
          .single();
        throwIf(error);
        return data as Match;
      },
      async update(id, input) {
        const { data, error } = await supabase.from('matches').update(input).eq('id', id).select().single();
        throwIf(error);
        return data as Match;
      },
      async remove(id) {
        const { error } = await supabase.from('matches').delete().eq('id', id);
        throwIf(error);
      },
    },

    announcements: {
      // 공지 마이그레이션이 배포되지 않은 프로젝트에서는 읽기가 빈 화면으로 폴백한다(쓰기는 그대로 실패).
      async list() {
        const { data, error } = await supabase.from('announcements').select('*').order('is_pinned', { ascending: false }).order('publish_at', { ascending: false });
        if (isSchemaMissingError(error)) return [];
        throwIf(error);
        return (data ?? []) as Announcement[];
      },
      async get(id) {
        const { data, error } = await supabase.from('announcements').select('*').eq('id', id).maybeSingle();
        if (isSchemaMissingError(error)) return null;
        throwIf(error);
        return (data as Announcement | null) ?? null;
      },
      async create(input) {
        // 포트 계약: created_by = 현재 로그인 사용자 id.
        const { data: session } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from('announcements')
          .insert({ ...input, publish_at: input.publish_at ?? new Date().toISOString(), created_by: session.user?.id ?? null })
          .select('*')
          .single();
        throwIf(error);
        return data as Announcement;
      },
      async update(id, input) {
        const { data, error } = await supabase.from('announcements').update(input).eq('id', id).select('*').single();
        throwIf(error);
        return data as Announcement;
      },
      async remove(id) {
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        throwIf(error);
      },
      async listReads(userId) {
        const { data, error } = await supabase.from('announcement_reads').select('*').eq('user_id', userId);
        if (isSchemaMissingError(error)) return [];
        throwIf(error);
        return (data ?? []) as AnnouncementRead[];
      },
      async markRead(announcementId, userId) {
        const { data, error } = await supabase
          .from('announcement_reads')
          .upsert({ announcement_id: announcementId, user_id: userId }, { onConflict: 'announcement_id,user_id' })
          .select('*')
          .single();
        throwIf(error);
        return data as AnnouncementRead;
      },
    },

    // 리그 스키마 마이그레이션(S0)이 적용되기 전까지는 호출하면 명확히 실패한다.
    league: createUnavailableLeagueRepo(),
    checkins: createUnavailableCheckinRepo(),
    audit: createUnavailableAuditRepo(),

    auth: {
      async getUser() {
        const { data } = await supabase.auth.getUser();
        return toAuthUser(data.user);
      },
      onAuthStateChange(listener) {
        const { data } = supabase.auth.onAuthStateChange((_event, session) => listener(toAuthUser(session?.user)));
        return () => data.subscription.unsubscribe();
      },
      async signInWithOAuth(provider, redirectTo) {
        const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
        throwIf(error);
        return { url: data?.url ?? null };
      },
      async signInAsDemo() {
        throw new Error('데모 로그인은 로컬 어댑터에서만 사용할 수 있습니다.');
      },
      async signOut() {
        await supabase.auth.signOut();
      },
      async ensureProfile(user) {
        const { data: existing, error: selectError } = await supabase.from('app_profiles').select('*').eq('id', user.id).maybeSingle();
        throwIf(selectError);
        if (existing) return existing as AppProfile;
        const { data, error } = await supabase.from('app_profiles').insert({ id: user.id, email: user.email }).select('*').single();
        if (error) {
          const { data: retried } = await supabase.from('app_profiles').select('*').eq('id', user.id).maybeSingle();
          if (retried) return retried as AppProfile;
          throw new ApiError(error.message, error.code);
        }
        return data as AppProfile;
      },
      async listProfiles() {
        const { data, error } = await supabase.from('app_profiles').select('*').order('role', { ascending: false }).order('email', { ascending: true });
        throwIf(error);
        return (data ?? []) as AppProfile[];
      },
      async setProfileRole(targetProfileId, role) {
        const { data, error } = await supabase.rpc('set_app_profile_role', { target_profile_id: targetProfileId, next_role: role });
        throwIf(error);
        return data as AppProfile;
      },
      async linkMyMember(memberId) {
        const { data, error } = await supabase.rpc('link_my_member', { target_member_id: memberId });
        throwIf(error);
        return data as AppProfile;
      },
      async unlinkMyMember() {
        const { data, error } = await supabase.rpc('unlink_my_member');
        throwIf(error);
        return data as AppProfile;
      },
      async listClaimableMembers() {
        const { data, error } = await supabase.rpc('get_claimable_members');
        throwIf(error);
        return (data ?? []) as Member[];
      },
      async issueInviteCode(memberId) {
        const code = generateInviteCode();
        const { data, error } = await supabase.rpc('issue_invite_code', { p_member_id: memberId, p_code: code });
        throwIf(error);
        return { code, expiresAt: String(data) };
      },
      async redeemInviteCode(code) {
        const { error } = await supabase.rpc('redeem_invite_code', { p_code: code });
        throwIf(error);
        const user = toAuthUser((await supabase.auth.getUser()).data.user);
        if (!user) throw new Error('로그인이 필요합니다.');
        const { data, error: profileError } = await supabase.from('app_profiles').select('*').eq('id', user.id).single();
        throwIf(profileError);
        return data as AppProfile;
      },
      async updateMyMemberProfile({ name, phoneNumber }) {
        const { data, error } = await supabase.rpc('update_my_member_profile', { input_name: name.trim(), input_phone: normalizePhoneNumber(phoneNumber) });
        throwIf(error);
        return data as Member;
      },
    },
  };
}
