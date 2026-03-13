"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useMember } from "@/entities/member/model/queries";
import { useAuthProfile } from "@/entities/auth/model/queries";
import { supabase } from "@/shared/api/supabase/config";
import type { AppProfile } from "@/shared/types/auth";
import type { Member } from "@/shared/types/member";

interface AuthContextValue {
  user: User | null;
  profile: AppProfile | null;
  member: Member | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLinked: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (isMounted) {
        setUser(currentUser ?? null);
        setIsAuthLoading(false);
      }
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const profileQuery = useAuthProfile(user);
  const memberQuery = useMember(profileQuery.data?.member_id ?? "");

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile: profileQuery.data ?? null,
      member: memberQuery.data ?? null,
      isLoading:
        isAuthLoading || profileQuery.isLoading || memberQuery.isLoading,
      isAdmin: ["admin", "superadmin"].includes(profileQuery.data?.role ?? ""),
      isSuperAdmin: profileQuery.data?.role === "superadmin",
      isLinked: !!profileQuery.data?.member_id,
    }),
    [
      isAuthLoading,
      memberQuery.data,
      memberQuery.isLoading,
      profileQuery.data,
      profileQuery.isLoading,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
