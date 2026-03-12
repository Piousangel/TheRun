# Product Refinement Loop

This file exists to keep product improvement continuous, explicit, and reusable.

## Core questions to ask repeatedly

### Product value

- Why would a real club member come back to this screen every week?
- What is missing for real weekly operations?
- What causes hesitation, confusion, or extra clicks?

### UX clarity

- Is the current screen answering the user's first question fast enough?
- Does the page show context before actions?
- Are the primary actions obvious without reading every card?

### UI quality

- Does this screen feel like part of the same product system?
- Are spacing, hierarchy, and surfaces consistent with the design system?
- Are there too many one-off visual treatments?

### Reusability

- Can this pattern become a shared primitive?
- Should this live in `shared/ui` or remain local?
- Would the next project benefit from this abstraction?

## Current active gaps

1. Naver login is not finished because it needs custom server-side OAuth secrets.
2. Some complex operational screens still need deeper visual polish beyond top-level summaries.
3. Announcement delivery is in-app only; external notification delivery is not added yet.
4. Some empty states and setup-dependent states still read like engineering notes rather than polished product copy.

## Current iteration strategy

1. Fix structural flow problems first
2. Extract reusable primitives second
3. Normalize major screens third
4. Add feature depth only after the product shell feels coherent

## Definition of a strong screen

A strong screen should:

- explain where the user is
- explain what matters now
- expose the most important action clearly
- degrade gracefully when data is missing
- look coherent on both mobile and desktop

## Immediate next improvements

- keep refining dashboard information density
- normalize empty states and setup states
- elevate form screens with better grouping and visual rhythm
- finish social-auth rollout with real provider configuration

## Applied reference translation

- dashboard structure is being pushed toward Mobbin/Pageflows-style task-first weekly overview
- empty/setup states are being normalized into reusable state panels instead of raw status copy
- dialogs and forms are being reworked to feel closer to mature design-system products rather than default component-library shells
