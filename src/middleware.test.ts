// @vitest-environment node
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

const supabaseStub = vi.hoisted(() => ({
  user: null as { id: string } | null,
  /** getUser() 호출 때 세션이 갱신되는 상황을 흉내낸다(setAll로 새 쿠키를 응답에 씌운다). */
  refreshedCookie: { name: 'sb-therun-auth-token', value: 'refreshed', options: { path: '/' } },
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: (_url: string, _key: string, options: { cookies: { setAll: (c: unknown[]) => void } }) => ({
    auth: {
      async getUser() {
        options.cookies.setAll([supabaseStub.refreshedCookie]);
        return { data: { user: supabaseStub.user } };
      },
    },
  }),
}));

function request(path: string, cookie?: string) {
  const headers = new Headers();
  if (cookie) headers.set('cookie', cookie);
  return new NextRequest(new URL(`http://localhost${path}`), { headers });
}

describe('middleware (local adapter)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_DATA_ADAPTER = 'local';
  });

  it('세션 쿠키가 없으면 보호 라우트를 /login?next=로 보낸다', async () => {
    const res = await middleware(request('/dashboard'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/login?next=%2Fdashboard');
  });

  it('세션 쿠키가 있으면 통과한다', async () => {
    const res = await middleware(request('/dashboard', 'therun-session=u-member'));
    expect(res.status).toBe(200);
  });

  it('로그인 상태로 /login에 오면 /dashboard로 보낸다', async () => {
    const res = await middleware(request('/login', 'therun-session=u-member'));
    expect(res.headers.get('location')).toBe('http://localhost/dashboard');
  });

  it('루트(/)는 쿠키 없이 통과한다(페이지가 /dashboard로 보낸다)', async () => {
    expect((await middleware(request('/'))).status).toBe(200);
  });

  it('/more와 /club-guide는 로그인이 필요하다', async () => {
    for (const path of ['/more', '/club-guide']) {
      const res = await middleware(request(path));
      expect(res.headers.get('location')).toBe(`http://localhost/login?next=${encodeURIComponent(path)}`);
    }
  });
});

describe('middleware (supabase adapter)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_DATA_ADAPTER = 'supabase';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
    supabaseStub.user = null;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_DATA_ADAPTER = 'local';
  });

  it('통과 응답에는 갱신된 세션 쿠키가 실린다', async () => {
    supabaseStub.user = { id: 'u-1' };
    const res = await middleware(request('/dashboard'));
    expect(res.status).toBe(200);
    expect(res.cookies.get('sb-therun-auth-token')?.value).toBe('refreshed');
  });

  it('보호 라우트 → /login 리다이렉트에도 갱신된 세션 쿠키가 실린다', async () => {
    supabaseStub.user = null;
    const res = await middleware(request('/dashboard'));
    expect(res.headers.get('location')).toBe('http://localhost/login?next=%2Fdashboard');
    expect(res.cookies.get('sb-therun-auth-token')?.value).toBe('refreshed');
  });

  it('인증됨 → /dashboard 리다이렉트에도 갱신된 세션 쿠키가 실린다', async () => {
    supabaseStub.user = { id: 'u-1' };
    const res = await middleware(request('/login'));
    expect(res.headers.get('location')).toBe('http://localhost/dashboard');
    expect(res.cookies.get('sb-therun-auth-token')?.value).toBe('refreshed');
  });
});
