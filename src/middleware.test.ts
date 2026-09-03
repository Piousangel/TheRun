// @vitest-environment node
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

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

  it('공개 라우트는 쿠키 없이 통과한다', async () => {
    expect((await middleware(request('/'))).status).toBe(200);
    expect((await middleware(request('/club-guide'))).status).toBe(200);
  });
});
