"use client";

import type { User } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabase/config";
import type { AppProfile } from "@/shared/types/auth";
import type { Member } from "@/shared/types/member";

export const authKeys = {
  all: ["auth"] as const,
  profile: (userId?: string) => [...authKeys.all, "profile", userId] as const,
  linkedMemberIds: () => [...authKeys.all, "linked-member-ids"] as const,
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

  const { data, error } = await supabase
    .from("app_profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      role: isSocialAdmin ? "admin" : "member",
    })
    .select("*")
    .single();

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
    mutationFn: async ({ memberId }: { memberId: string }) => {
      if (!userId) {
        throw new Error("로그인이 필요합니다.");
      }

      const { data, error } = await supabase.rpc("link_my_member", {
        target_member_id: memberId,
      });

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
      queryClient.invalidateQueries({ queryKey: authKeys.linkedMemberIds() });
    },
  });
}

export function useLinkedMemberIds(userId: string | null) {
  return useQuery({
    queryKey: authKeys.linkedMemberIds(),
    queryFn: async () => {
      if (!userId) {
        return [] as string[];
      }

      const { data, error } = await supabase
        .from("app_profiles")
        .select("member_id")
        .not("member_id", "is", null);

      if (error) {
        throw error;
      }

      return (data ?? [])
        .map((profile) => profile.member_id)
        .filter((memberId): memberId is string => typeof memberId === "string");
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
      queryClient.invalidateQueries({ queryKey: authKeys.linkedMemberIds() });
    },
  });
}
