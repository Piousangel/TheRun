# The Run Project Progress

## Current Product Direction

The Run is moving from a prototype into a real mobile-first futsal club app.

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

## Short-term roadmap

1. Finish announcements feature and push
2. Improve landing page motion and premium visual rhythm
3. Clean remaining lint warnings across legacy match/tactical modules
4. Evaluate additional SDKs for motion, analytics, and notification delivery

## Notes for future iterations

- Keep verifying production build after every meaningful change
- Prefer atomic commits and frequent pushes while iterating
- Preserve FSD boundaries when introducing new domains
