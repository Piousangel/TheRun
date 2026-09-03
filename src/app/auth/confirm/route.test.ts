// @vitest-environment node
import { NextResponse } from 'next/server';
import { GET } from '@/app/auth/confirm/route';

const verifyOtp = vi.fn();

vi.mock('@/shared/api/adapters/supabase/server', () => ({
  createSupabaseServerClient: async () => ({ auth: { verifyOtp } }),
}));

function confirmRequest(next: string) {
  return new Request(`https://therun.app/auth/confirm?token_hash=t&type=email&next=${encodeURIComponent(next)}`);
}

async function locationFor(next: string) {
  const res = (await GET(confirmRequest(next))) as NextResponse;
  return res.headers.get('location');
}

describe('GET /auth/confirm', () => {
  beforeEach(() => {
    verifyOtp.mockReset().mockResolvedValue({ error: null });
  });

  it('내부 경로는 그대로 따라간다', async () => {
    expect(await locationFor('/members')).toBe('https://therun.app/members');
  });

  it('origin에 이어 붙어 외부 호스트가 되는 next를 거부한다', async () => {
    // `${origin}${next}` 조합이라 슬래시로 시작하지 않는 값은 호스트 뒷부분을 조작한다.
    expect(await locationFor('.evil.com')).toBe('https://therun.app/dashboard');
    expect(await locationFor('@evil.com')).toBe('https://therun.app/dashboard');
  });

  it('프로토콜 상대 URL과 절대 URL을 거부한다', async () => {
    expect(await locationFor('//evil.com')).toBe('https://therun.app/dashboard');
    expect(await locationFor('/\\evil.com')).toBe('https://therun.app/dashboard');
    expect(await locationFor('https://evil.com')).toBe('https://therun.app/dashboard');
  });

  it('토큰이 없으면 로그인으로 보낸다', async () => {
    const res = (await GET(new Request('https://therun.app/auth/confirm'))) as NextResponse;
    expect(res.headers.get('location')).toBe('https://therun.app/login?error=invalid-link');
  });

  it('verifyOtp가 실패하면 로그인으로 보낸다', async () => {
    verifyOtp.mockResolvedValue({ error: new Error('nope') });
    expect(await locationFor('/members')).toBe('https://therun.app/login?error=auth-failed');
  });
});
