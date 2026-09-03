'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuthProfile } from '@/entities/auth/model/queries';
import { useMember } from '@/entities/member/model/queries';
import { getApi } from '@/shared/api/client';
import type { AuthUser } from '@/shared/api/ports/auth-repo';
import type { AppProfile } from '@/shared/types/auth';
import type { Member } from '@/shared/types/member';

interface AuthContextValue {
  user: AuthUser | null;
  profile: AppProfile | null;
  member: Member | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLinked: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const auth = getApi().auth;

    auth.getUser().then((currentUser) => {
      if (!isMounted) return;
      setUser(currentUser);
      setIsAuthLoading(false);
    });

    const unsubscribe = auth.onAuthStateChange((nextUser) => {
      setUser(nextUser);
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const profileQuery = useAuthProfile(user);
  const memberQuery = useMember(profileQuery.data?.member_id ?? '');

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile: profileQuery.data ?? null,
      member: memberQuery.data ?? null,
      isLoading: isAuthLoading || profileQuery.isLoading || memberQuery.isLoading,
      isAdmin: ['admin', 'superadmin'].includes(profileQuery.data?.role ?? ''),
      isSuperAdmin: profileQuery.data?.role === 'superadmin',
      isLinked: !!profileQuery.data?.member_id,
    }),
    [isAuthLoading, memberQuery.data, memberQuery.isLoading, profileQuery.data, profileQuery.isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
