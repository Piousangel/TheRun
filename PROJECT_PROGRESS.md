# The Run Project Progress

## Current Product Direction

The Run is moving from a prototype into a real mobile-first futsal club app.

- landing page and authenticated dashboard are now split into separate routes and widgets

### Shipped foundations

- Supabase SSR auth flow with email login
- `app_profiles` identity mapping and member linking
- role-aware UI split between admin and member
- self-service vote and attendance flows
- richer landing page and club guide page
- hardened RLS for core operational tables

## In-flight work

### Landing page

- evolving toward a more editorial, campaign-like product landing
- adding AI-style soccer visuals and scroll-triggered reveal sections
- extracting reusable visual utilities into `src/app/globals.css`

### Announcements / notifications

- adding `announcements` and `announcement_reads` tables
- admin-authored notices with member read tracking
- home dashboard summary and dedicated announcements page

### Authentication

- Google social login flow added with OAuth callback route
- Naver login requires custom server-side OAuth integration because it is not a standard Supabase social provider path in this project
- login UI is being shifted from utility flow to product-quality access screen
- setup notes are tracked in `SOCIAL_AUTH_SETUP.md`

## Library / SDK notes

### Adopted now

- `sonner`: lightweight toast feedback for login, account linking, and announcement creation

### Good next candidates

- `motion` or `framer-motion`: richer scroll and section transitions on landing/detail pages
- `@vercel/analytics` or `posthog-js`: understand which screens club members actually use most
- push notification layer later via Supabase Edge Functions + Expo/Web Push if announcement delivery needs to leave the app

### Screen redesign

- introducing reusable `page hero` and `stat tile` primitives
- upgrading vote, attendance, members, matches, announcements, and account surfaces toward a consistent editorial style

## Short-term roadmap

1. Finish announcements feature and push
2. Improve landing page motion and premium visual rhythm
3. Clean remaining lint warnings across legacy match/tactical modules
4. Evaluate additional SDKs for motion, analytics, and notification delivery

## Notes for future iterations

- Keep verifying production build after every meaningful change
- Prefer atomic commits and frequent pushes while iterating
- Preserve FSD boundaries when introducing new domains
