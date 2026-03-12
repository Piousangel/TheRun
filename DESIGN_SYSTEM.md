# Design System Notes

## Product flow

The application is now being organized into a clearer product flow:

1. `/` = landing page
2. `/login` = authentication entry
3. `/dashboard` = authenticated app hub

This keeps marketing and product usage separate.

### Widget split

- landing widget: `src/widgets/home/ui/home-page-content.tsx`
- dashboard widget: `src/widgets/dashboard/ui/app-dashboard-content.tsx`

Keep these separated even when the visual language overlaps.

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

### `AppPageLayout`

Location: `src/shared/ui/app-page-layout.tsx`

Use for:

- authenticated route pages
- list screens
- dashboard-adjacent app surfaces

Goal:

- remove repeated `main + max-width + padding` wrappers
- keep app routes visually consistent
- centralize spacing rules for future projects

### `StatePanel`

Location: `src/shared/ui/state-panel.tsx`

Use for:

- empty list states
- setup required states
- role-based guidance states
- warning or soft-block states

Goal:

- replace raw “없습니다 / 필요합니다” messages with product-quality guidance
- always explain the next best action

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

## Motion layer

- `motion` is now the preferred animation library.
- `RevealSection` should be the default section-entry pattern for landing and content reveal moments.
- Prefer subtle vertical lift + fade + slight blur removal over flashy transforms.
- Keep motion meaningful: page sections, hero reveals, key dashboard modules.

## UI direction rules

- Prefer bold typography over decorative clutter.
- Keep gold/black/stone palette consistent.
- Use a small number of strong surfaces repeatedly instead of many ad-hoc cards.
- Every operational screen should open with context first, actions second.
- Mobile layouts must survive crowded navigation and dense operator workflows.

## Form system rules

- Inputs, selects, and textareas should feel like part of the same product family.
- Prefer rounded-xl or rounded-2xl controls over legacy rounded-md controls.
- Default field height should support touch-first usage.
- Placeholder copy should guide real task completion, not just describe field type.
- Form screens should group fields into clear chunks instead of long flat stacks when complexity grows.

## Reuse guidance for future projects

- Start by reusing `AuthShell`, `PageHero`, and `StatTile`.
- Use `StatePanel` whenever a screen would otherwise show a plain empty paragraph.
- Reuse the flow split: landing -> auth -> app hub.
- Reuse the editorial utility classes before introducing new color systems.
- Only add new surface variants if an existing primitive cannot reasonably fit.
