import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/shared/api/adapters/supabase/server';
import { safeInternalPath } from '@/shared/lib/navigation';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // startsWith('/')만으로는 //evil.com 같은 프로토콜 상대 URL이 통과한다.
  const next = safeInternalPath(searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth-failed`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth-failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
