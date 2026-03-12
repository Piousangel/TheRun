import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/shared/api/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  let next = searchParams.get('next') ?? '/dashboard';

  if (!next.startsWith('/')) {
    next = '/dashboard';
  }

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
