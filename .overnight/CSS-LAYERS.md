# CSS layering (2.1.0)

Load order in `index.html`:

1. `styles.css` — shell, sidebar, habits base
2. `pages-858.css` — page layouts
3. `vendor/widget-ui.css`
4. `today-cards.css`
5. `v202.css` — 2.0 polish slice
6. `pages-polish.css` — week/timeline empty-state art (loaded before final override layer)
7. **`v210.css`** — bookkeeping UI + all overnight 2.1 Goal 2 polish (formerly `v211`–`v232`, merged batch 4 round 3); **must remain last** in `index.html`

New overnight CSS should append to **`v210.css`** (with a dated section comment) unless a change is large enough to warrant a post-release split in 2.2.

Section markers inside `v210.css` retain `/* ========== merged from v2xx-….css ========== */` comments for grep and tests.

**Deferred (REVIEW #4):** scattered `@media (prefers-reduced-motion: no-preference)` blocks were merged in owner pass r8 (`.overnight/merge-no-preference-motion.mjs`); `html.motion-reduced` hooks remain inline where needed. Bulk `:is()` merge of `html.motion-reduced` rules (r13 experiment) **increases** byte size — do not use.

**Headless ports (5291–5299, never 5290):** fakecloud / browser tests **5298**; weather compare **5299**; overnight capture **5297** typical.
