import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/shared/api/adapters/supabase/server';
import { safeInternalPath } from '@/shared/lib/navigation';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  // 콜백 라우트와 같은 싱크다. `${origin}${next}` 조합이라 검증이 없으면 `.evil.com`·`@evil.com`
  // 같은 값이 호스트를 통째로 바꾼다.
  const next = safeInternalPath(searchParams.get('next'));

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/login?error=invalid-link`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth-failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
