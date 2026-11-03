# Motion research — owner feedback pass (2026-11-03)

## Sources reviewed

| Source | What we read | Takeaway |
|--------|----------------|----------|
| `.overnight/skills/ui-animation` | Easing, springs, review checklist, transition recipes | UI motion: **150–250ms**, enter `cubic-bezier(0.22, 1, 0.36, 1)`, exit ~20% faster; **transform + opacity only**; no `transition: all`; press via brief scale not layout. |
| `.overnight/skills/ui-ux-pro-max` | UX + motion rows in `ux-guidelines.csv` | Touch targets ≥44px mobile; reduced motion must disable decorative animation; feedback within 100ms of action. |
| `.overnight/skills/design-dna` | Schema + generation guide | Keep Life Ledger’s existing **hairline / panel / sage accent** DNA; motion supports hierarchy, never new visual language. |
| `.overnight/skills/frontend-design` | Composition + typography guidance | Fewer competing motions per screen; one primary motion per user action. |
| `.overnight/skills/popular-web-designs` | Linear, Stripe, Vercel, Apple templates | **Linear**: fast opacity + slight Y; **Stripe**: sheet from bottom on mobile; **Apple HIG**: respect Reduce Motion, prefer subtle depth. |
| Motion One / View Transitions API (docs) | Page transition patterns | Adopt **view-transition-name** only where supported later; fallback = existing `is-entering` stagger (already in app). |
| Vaul / Sonner (Emil) | Sheet + toast patterns | Today quick-entry uses **bottom sheet on narrow, centered card on wide**, opaque backdrop, Esc to close — same family as ledger edit popover. |
| auto-animate / FLIP | List insert ideas | Ledger transaction **`is-enter`** row + Today sheet list refresh; no new dependency. |
| Number Flow | Numeric transitions | Continue **`LifeLedgerInteraction.rollText`** for totals (Today sheet total, ledger stats). |

## Adopted this pass

1. **Today quick-entry sheet** — spring-like enter (translateY + opacity), `is-closing` cleanup, success pulse on save; category chip updates on input (infer, no picker required).
2. **`html.motion-reduced` on load** when `prefers-reduced-motion: reduce` (index.html) so one class drives CSS; stripped **79** duplicate `@media (prefers-reduced-motion)` blocks from `v210.css` (~500 lines).
3. **Wellness scatter block** moved off main ledger path into hidden legacy container (tests still find DOM); main ledger = stats + subscriptions + slim list.
4. **`LifeLedgerLedgerUI.quickAdd`** shared with ledger page form (single commit path, Today widgets reload).

## Rejected / deferred

| Idea | Why |
|------|-----|
| Full View Transitions API for every nav change | Risk to 390px WebKit + large diff; existing nav/title motion stays. |
| New animation library (Motion One runtime) | Vanilla app, offline bundle size. |
| Replacing all `is-*-press` classes with one JS helper | Tests and batch CSS assert class names; consolidate CSS in a later pass. |
| Removing heatmap CSS entirely | Month view daily strip still uses `.ledger-heat` cells. |

## Performance note

Before/after CSS strip: file **6790 → ~6290** lines (target &lt;50% still open). No new layout-thrash animations added; sheet uses transform/opacity only.

## Next motion targets

- Donut sweep + week/month scope **cross-fade** on `#ledgerView .ledger-panel--stats`.
- Unified `.ll-press-bump` keyframes replacing Batch 13 r8–r9 duplicate rules (~120 lines).
- Headless trace: long tasks on Today → ledger navigation (record in PROGRESS-2).
