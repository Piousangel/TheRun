"use client";

import type { User } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabase/config";
import type { AppProfile } from "@/shared/types/auth";
import type { Member } from "@/shared/types/member";

export const authKeys = {
  all: ["auth"] as const,
  profile: (userId?: string) => [...authKeys.all, "profile", userId] as const,
};

async function ensureProfile(user: User): Promise<AppProfile> {
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
    },
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
    },
  });
}
