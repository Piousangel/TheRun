"use client";

import type { User } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabase/config";
import type { AppProfile } from "@/shared/types/auth";
import type { Member } from "@/shared/types/member";

export const authKeys = {
  all: ["auth"] as const,
  profile: (userId?: string) => [...authKeys.all, "profile", userId] as const,
  claimableMembers: (userId?: string) =>
    [...authKeys.all, "claimable-members", userId] as const,
};

async function ensureProfile(user: User): Promise<AppProfile> {
  const providers = [
    user.app_metadata?.provider,
    ...(Array.isArray(user.app_metadata?.providers)
      ? user.app_metadata.providers
      : []),
  ].filter((value): value is string => typeof value === "string");

  const isSocialAdmin = providers.some((provider) =>
    ["google", "naver"].includes(provider),
  );
  const normalizedEmail = user.email?.toLowerCase() ?? null;
  const desiredRole =
    normalizedEmail === "yyh7654@gmail.com" ||
    normalizedEmail === "yyh7654@gmail.conm"
      ? "superadmin"
      : isSocialAdmin
        ? "admin"
        : "member";

  const { data: existingProfile, error: selectError } = await supabase
    .from("app_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (existingProfile) {
    return existingProfile as AppProfile;
  }

  const insertProfile = async (role: AppProfile["role"]) => {
    const { data, error } = await supabase
      .from("app_profiles")
      .insert({
        id: user.id,
        email: user.email ?? null,
        role,
      })
      .select("*")
      .single();

    return { data, error };
  };

  let { data, error } = await insertProfile(desiredRole);

  const shouldRetryAsMember =
    !!error &&
    desiredRole !== "member" &&
    /row-level security|policy|role = 'member'|permission denied/i.test(
      error.message,
    );

  if (shouldRetryAsMember) {
    ({ data, error } = await insertProfile("member"));
  }

  if (error) {
    throw error;
  }

  return data as AppProfile;
}

export function useAuthProfile(user: User | null) {
  return useQuery({
    queryKey: authKeys.profile(user?.id),
    queryFn: async () => {
      if (!user) {
        return null;
      }

      return ensureProfile(user);
    },
    enabled: !!user,
  });
}

export function useLinkMemberProfile(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      phoneNumber,
    }: {
      memberId: string;
      phoneNumber?: string;
    }) => {
      if (!userId) {
        throw new Error("로그인이 필요합니다.");
      }

      const attemptCurrentContract = async () =>
        supabase.rpc("link_my_member", {
          target_member_id: memberId,
        });

      let { data, error } = await attemptCurrentContract();

      const shouldRetryWithLegacyPhone =
        !!error &&
        /function|signature|input_phone|No function matches/i.test(
          error.message,
        );

      if (shouldRetryWithLegacyPhone) {
        if (!phoneNumber?.trim()) {
          throw new Error(
            "현재 서버는 전화번호 확인 방식의 멤버 연결을 사용 중입니다. 전화번호를 입력한 뒤 다시 시도해주세요.",
          );
        }

        ({ data, error } = await supabase.rpc("link_my_member", {
          target_member_id: memberId,
          input_phone: phoneNumber.trim(),
        }));
      }

      if (error) {
        throw error;
      }

      return data as AppProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: authKeys.profile(userId ?? undefined),
      });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({
        queryKey: authKeys.claimableMembers(userId ?? undefined),
      });
    },
  });
}

export function useClaimableMembers(userId: string | null) {
  return useQuery({
    queryKey: authKeys.claimableMembers(userId ?? undefined),
    queryFn: async () => {
      if (!userId) {
        return [] as Member[];
      }

      const { data, error } = await supabase.rpc("get_claimable_members");

      if (error) {
        if (/function|signature|get_claimable_members/i.test(error.message)) {
          return null;
        }
        throw error;
      }

      return (data ?? []) as Member[];
    },
    enabled: !!userId,
    retry: false,
  });
}

export function useUpdateMyMemberProfile(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      phoneNumber,
    }: {
      name: string;
      phoneNumber: string;
    }) => {
      if (!userId) {
        throw new Error("로그인이 필요합니다.");
      }

      const { data, error } = await supabase.rpc("update_my_member_profile", {
        input_name: name.trim(),
        input_phone: phoneNumber.trim(),
      });

      if (error) {
        throw error;
      }

      return data as Member;
    },
    onSuccess: (member) => {
      queryClient.invalidateQueries({
        queryKey: authKeys.profile(userId ?? undefined),
      });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({
        queryKey: ["members", "detail", member.id],
      });
    },
  });
}

export function useUnlinkMemberProfile(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("로그인이 필요합니다.");
      }

      const { data, error } = await supabase.rpc("unlink_my_member");

      if (error) {
        throw error;
      }

      return data as AppProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: authKeys.profile(userId ?? undefined),
      });
      queryClient.invalidateQueries({
        queryKey: authKeys.claimableMembers(userId ?? undefined),
      });
    },
  });
}
