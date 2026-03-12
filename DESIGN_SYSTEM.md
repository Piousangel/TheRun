# Design System Notes

## Product flow

The application is now being organized into a clearer product flow:

1. `/` = landing page
2. `/login` = authentication entry
3. `/dashboard` = authenticated app hub

This keeps marketing and product usage separate.

## Core UI primitives

### `PageHero`

Location: `src/shared/ui/page-hero.tsx`

Use for:

- tab landing headers
- detail page intros
- section-level product summaries

Provides:

- eyebrow label
- title + description hierarchy
- action area
- meta badge area

### `StatTile`

Location: `src/shared/ui/stat-tile.tsx`

Use for:

- page-level quick metrics
- readiness and status snapshots
- admin/operator overviews

Tone variants:

- `default`
- `success`
- `danger`
- `muted`

### `AuthShell`

Location: `src/shared/ui/auth-shell.tsx`

Use for:

- login pages
- onboarding steps
- account access screens

Goal:

- keep auth screens visually distinct from in-app screens
- make future social login pages reusable across projects

## Visual utilities

Defined in `src/app/globals.css`.

Important classes:

- `editorial-hero`
- `editorial-grid`
- `editorial-glow-gold`
- `editorial-glow-white`
- `glass-panel`
- `glass-panel-soft`
- `editorial-preview`
- `editorial-highlight`
- `metric-chip`
- `section-surface`

These utilities are the current visual vocabulary for premium landing and dashboard surfaces.

## UI direction rules

- Prefer bold typography over decorative clutter.
- Keep gold/black/stone palette consistent.
- Use a small number of strong surfaces repeatedly instead of many ad-hoc cards.
- Every operational screen should open with context first, actions second.
- Mobile layouts must survive crowded navigation and dense operator workflows.

## Reuse guidance for future projects

- Start by reusing `AuthShell`, `PageHero`, and `StatTile`.
- Reuse the flow split: landing -> auth -> app hub.
- Reuse the editorial utility classes before introducing new color systems.
- Only add new surface variants if an existing primitive cannot reasonably fit.
