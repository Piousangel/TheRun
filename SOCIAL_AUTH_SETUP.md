# Social Auth Setup

## Current state

- Google social login flow is wired in the app.
- Naver login is not fully wired yet because it needs custom OAuth handling and server-side secrets.

## Google setup

### Supabase Dashboard

1. Go to `Authentication > Providers > Google`
2. Enable Google provider
3. Set Google Client ID / Client Secret
4. Ensure the callback URL registered in Google matches the Supabase callback URL

### Common failure

If the app shows:

- `Unsupported provider: provider is not enabled`

that means the app code is calling Google correctly, but the Google provider is still disabled in the Supabase project dashboard.

### Google Cloud

- Authorized JavaScript origin: your app origin (for local dev, `http://localhost:3000`)
- Authorized redirect URI: your Supabase auth callback URL

## Naver setup

Naver is not treated as a standard drop-in provider in this project flow.

### Required secrets

- `NAVER_CLIENT_ID`
- `NAVER_CLIENT_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

### Why these are needed

- Naver OAuth token exchange requires the Naver client credentials on the server.
- Supabase custom user/session bridging requires secure server-side access.

### Implementation direction

1. Start route builds the Naver authorize URL
2. Callback route exchanges code for Naver token on the server
3. Server fetches Naver profile
4. Server creates or syncs a Supabase user
5. App establishes Supabase session and redirects back to `/me` or requested `next`

## Recommended rollout order

1. Finish Google provider dashboard setup and verify login flow
2. Add Naver secrets to secure server environment
3. Implement Naver callback bridge
4. Replace the placeholder Naver button with the live flow
