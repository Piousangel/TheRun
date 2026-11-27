'use client';

import { useMemo } from 'react';
import { useAuth } from '@/providers/auth-provider';
import type { ChatViewer } from '@/shared/types/chat';

/** 채팅을 읽고 쓰는 나. 회원과 연결되지 않은 계정이면 null(채팅 불가). */
export function useChatViewer(): ChatViewer | null {
  const { member, isAdmin } = useAuth();
  return useMemo(() => (member ? { member_id: member.id, is_admin: isAdmin } : null), [member, isAdmin]);
}
