# Launch Blockers

## Current blockers before release

### 1. Google social login provider is disabled in Supabase

Observed error:

- `Unsupported provider: provider is not enabled`

Meaning:

- the app is requesting Google OAuth correctly
- the current Supabase project has not enabled the Google provider yet

Required action:

1. Open `Authentication > Providers > Google` in Supabase
2. Enable Google provider
3. Configure Google Client ID / Client Secret
4. Verify redirect URI matches the deployed domain callback

### 2. Naver login is not live yet

Reason:

- requires custom OAuth bridge and secure server-side secrets

### 3. Final UX polish still in progress

- dashboard hierarchy is improving but not yet final
- some operational screens still need deeper visual refinement
