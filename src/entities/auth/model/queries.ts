"use client";

import type { User } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabase/config";
import {
  MASKED_MEMBER_PHONE_NUMBER,
  normalizePhoneNumber,
} from "@/shared/lib/utils";
import { memberKeys } from "@/entities/member/model/queries";
import type { AppProfile } from "@/shared/types/auth";
import type { Member } from "@/shared/types/member";

export const authKeys = {
  all: ["auth"] as const,
  profile: (userId?: string) => [...authKeys.all, "profile", userId] as const,
  adminProfiles: () => [...authKeys.all, "admin-profiles"] as const,
  claimableMembers: (userId?: string) =>
    [...authKeys.all, "claimable-members", userId] as const,
};

interface RpcErrorLike {
  code?: string;
  details?: string | null;
  hint?: string | null;
  message: string;
}

function isRpcErrorLike(error: unknown): error is RpcErrorLike {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  );
}

function isRpcContractError(error: unknown, functionName?: string) {
  if (!isRpcErrorLike(error)) {
    return false;
  }

  if (["PGRST202", "PGRST203", "42883"].includes(error.code ?? "")) {
    return true;
  }

  const functionPattern = functionName
    ? `${functionName}|${functionName.replace(/_/g, " ")}`
    : "";

  return new RegExp(
    [
      "function",
      "signature",
      "No function matches",
      "Could not find the function",
      "Could not choose the best candidate",
      functionPattern,
      "input_phone",
    ]
      .filter(Boolean)
      .join("|"),
    "i",
  ).test(error.message);
}

function getLinkMemberErrorMessage(error: unknown) {
  if (!isRpcErrorLike(error)) {
    return "멤버 연결에 실패했습니다.";
  }

  if (error.code === "PGRST203") {
    return "서버의 멤버 연결 함수가 중복되어 연결에 실패했습니다. 관리자에게 최신 마이그레이션 정리를 요청해주세요.";
  }

  if (error.code === "PGRST202" || error.code === "42883") {
    return "서버의 멤버 연결 함수 구성이 오래되어 연결에 실패했습니다. 관리자에게 최신 마이그레이션 적용을 요청해주세요.";
  }

  return error.message;
}

function getRoleManagementErrorMessage(error: unknown) {
  if (!isRpcErrorLike(error)) {
    return "역할 변경에 실패했습니다.";
  }

  return error.message;
}

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

  const insertProfile = async () => {
    const { data, error } = await supabase
      .from("app_profiles")
      .insert({
        id: user.id,
        email: user.email ?? null,
      })
      .select("*")
      .single();

    return { data, error };
  };

  const { data, error } = await insertProfile();

  if (error) {
    const { data: retriedProfile, error: retrySelectError } = await supabase
      .from("app_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!retrySelectError && retriedProfile) {
      return retriedProfile as AppProfile;
    }
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

export function useAdminProfiles(enabled: boolean) {
  return useQuery({
    queryKey: authKeys.adminProfiles(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_profiles")
        .select("*")
        .order("role", { ascending: false })
        .order("email", { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []) as AppProfile[];
    },
    enabled,
  });
}

export function useUpdateAppProfileRole(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      profileId,
      role,
    }: {
      profileId: string;
      role: Extract<AppProfile["role"], "member" | "admin">;
    }) => {
      if (!userId) {
        throw new Error("로그인이 필요합니다.");
      }

      const { data, error } = await supabase.rpc("set_app_profile_role", {
        target_profile_id: profileId,
        next_role: role,
      });

      if (error) {
        throw new Error(getRoleManagementErrorMessage(error));
      }

      return data as AppProfile;
    },
    onSuccess: (profile) => {
      queryClient.invalidateQueries({ queryKey: authKeys.adminProfiles() });
      queryClient.invalidateQueries({
        queryKey: authKeys.profile(profile.id),
      });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
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

      const attemptLegacyContract = async (inputPhone: string) =>
        supabase.rpc("link_my_member", {
          target_member_id: memberId,
          input_phone: inputPhone,
        });

      const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber ?? "");

      let { data, error } = await attemptCurrentContract();

      const shouldRetryWithLegacyPhone = isRpcContractError(
        error,
        "link_my_member",
      );

      if (shouldRetryWithLegacyPhone) {
        if (!normalizedPhoneNumber) {
          throw new Error(
            "현재 서버는 전화번호 확인 방식의 멤버 연결을 사용 중입니다. 전화번호를 입력한 뒤 다시 시도해주세요.",
          );
        }

        ({ data, error } = await attemptLegacyContract(normalizedPhoneNumber));

        const shouldRetryWithMaskedPhone =
          !!error &&
          /전화번호가 일치하지 않습니다/.test(error.message) &&
          normalizedPhoneNumber !== MASKED_MEMBER_PHONE_NUMBER;

        if (shouldRetryWithMaskedPhone) {
          ({ data, error } = await attemptLegacyContract(
            MASKED_MEMBER_PHONE_NUMBER,
          ));
        }
      }

      if (error) {
        throw new Error(getLinkMemberErrorMessage(error));
      }

      return data as AppProfile;
    },
    onSuccess: (profile) => {
      queryClient.invalidateQueries({
        queryKey: authKeys.profile(userId ?? undefined),
      });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: memberKeys.details() });
      if (profile.member_id) {
        queryClient.invalidateQueries({
          queryKey: memberKeys.detail(profile.member_id),
        });
      }
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
        if (isRpcContractError(error, "get_claimable_members")) {
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
        input_phone: normalizePhoneNumber(phoneNumber),
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
