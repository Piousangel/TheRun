import { createBrowserClient } from '@supabase/ssr';

// ReturnType<typeof createBrowserClient> loses its default generic params on this overloaded
// function, which breaks contextual typing on supabase.auth.onAuthStateChange callbacks.
// Pinning the generics here keeps the lazy-init pattern without touching the ClubApi port.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BrowserClient = ReturnType<typeof createBrowserClient<any, 'public'>>;

let client: BrowserClient | null = null;

/** NEXT_PUBLIC_DATA_ADAPTER=supabase일 때만 호출된다. 로컬 모드에서는 env가 없어도 import가 안전해야 하므로 지연 생성한다. */
export function getSupabaseClient(): BrowserClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다.');
  }
  client = createBrowserClient(url, anonKey);
  return client;
}
