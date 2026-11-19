import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const SESSION_COOKIE = 'therun-session';
const protectedRoutes = ['/dashboard', '/attendance', '/votes', '/matches', '/members', '/team-division', '/me', '/announcements', '/strategy', '/more', '/club-guide', '/join'];
const authRoutes = ['/login'];

function matches(path: string, routes: string[]) {
  return routes.some((route) => path === route || path.startsWith(`${route}/`));
}

/** 로컬 어댑터는 데모 세션 쿠키만 본다. Supabase 어댑터는 SSR 클라이언트로 사용자를 확인한다. */
export async function isAuthenticatedRequest(request: NextRequest, response: NextResponse): Promise<boolean> {
  if (process.env.NEXT_PUBLIC_DATA_ADAPTER !== 'supabase') {
    return Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  }

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  return Boolean(data.user);
}

/**
 * `isAuthenticatedRequest`의 supabase 분기는 갱신된 세션 쿠키를 `response`에 씌운다.
 * 리다이렉트할 때 그 응답을 그냥 버리면 브라우저의 리프레시 토큰은 서버에서 이미 소비됐는데
 * 새 토큰은 전달되지 않아 다음 요청에서 세션이 끊긴다. 그래서 리다이렉트 응답으로 쿠키를 옮긴다.
 */
function carryCookies(from: NextResponse, to: NextResponse): NextResponse {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  return to;
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;
  const isAuthenticated = await isAuthenticatedRequest(request, response);

  if (!isAuthenticated && matches(path, protectedRoutes)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.search = '';
    redirectUrl.searchParams.set('next', path);
    return carryCookies(response, NextResponse.redirect(redirectUrl));
  }

  if (isAuthenticated && matches(path, authRoutes)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    redirectUrl.search = '';
    return carryCookies(response, NextResponse.redirect(redirectUrl));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
