# Cursor Cloud brief — Life Ledger 3.5 system polish

Repository `zubin-li/life-ledger-deep-review`, branch `codex/macos-3-wip` (draft PR #12), baseline `f82b133e2b3c0cc3c347b4cd293123a8f08ef87d` (3.4.0). Commit and push to this branch only. Do not merge main, tag, create a GitHub Release or deploy.

Read first: `AGENTS.md`, `THIRD_PARTY_NOTICES.md`, `docs/phase-3-4-motion-plan.md`, `docs/phase-3-3-design-contract.md`, `docs/design-dna-macos-v4.md`, `public/interaction.js`, `public/assets/hairline/`.

## Owner feedback on 3.4.0 (the problem to solve)
The direction is right: minimal, hairline line art and small motion stay. But 3.4 is not fully polished. Some illustrations and layouts are unreasonable (composition, proportion, alignment, placeholder feel). Old vs new still reads as "a few images were added". Many buttons lack clear, user-friendly behavioral feedback. 3.5 must be visibly the next version in information hierarchy, closed interaction loops, feedback quality and motion continuity, while keeping the 3.4 base. Adding more pictures is not the goal.

## Step 1 — audit first, commit it before implementation
Create `docs/phase-3-5-polish-audit.md` from the real running build (screenshots you capture yourself, not from memory):
- Per surface: Today, Week, Journal (timeline/photos/calendar), Insights, Habits (list + editor), Settings window, Focus (toolbar chip, panel, mini-player), search + ⌘K command palette, "+" create popover, context menus, toasts/Undo, dialogs/sheets, launcher (Local/Cloud), empty states.
- Problems found, each with screenshot reference and severity.
- References studied (mature open-source desktop products, e.g. Things-like patterns, Day One-like patterns, Apple HIG; open-source examples such as Zed, Obsidian, Logseq, AFFiNE, Excalidraw, Raycast extensions UI). Learn patterns only; copy no code or assets unless the license is MIT/Apache-2.0/ISC/BSD/CC0/OFL and it is recorded in `THIRD_PARTY_NOTICES.md`. GPL/AGPL/unknown: reference only.
- Adopt / reject decisions with one-line reasons.
- Control behavior matrix, one row per clickable control: surface | control | purpose | immediate feedback | disabled | loading | success | failure | undo (if applicable) | keyboard path | focus-visible | reduced-motion/off behavior | decision (keep / fix / remove as duplicate or no-op). Every control must end with a clear purpose. Remove controls with no behavior or duplicate behavior.
Commit: `docs(desktop): audit Life Ledger 3.5 polish` with a meaningful body.

## Step 2 — implement (focused commits)
1. Interaction closure: implement every "fix" row of the matrix. Every action gives immediate feedback; async actions show busy→success/failure; destructive or state-changing actions (habit completion, deletion, import, reorder) offer Undo where reasonable; disabled states explain why (tooltip/inline hint); keyboard paths and visible focus everywhere. Settings changes confirm in place.
2. Hairline illustration system: turn the scattered 8 SVGs into one documented system (`docs/hairline-system.md`: grid 160×120, 1px currentColor stroke, single accent, 3 layers, composition rules, size tokens for inline/empty/hero). First fix the existing ones whose composition, proportion, alignment or empty space is wrong. Then add small situational illustrations only where they guide or express something real: first run/onboarding, all-done/completion, empty photos/journal, insights not enough data, Focus idle/complete, import/export/backup success, search no results, offline/sync issue. Allow wit and small delightful details tied to meaning (e.g. the plant in Today-done grows slightly with streak length), but restrained and readable. Illustrations may reflect data state (e.g. number of filled day bars equals days completed this week). No count padding.
3. One motion language: navigation, expand/collapse, list reorder, habit complete/undo, Focus start/pause/finish, save/export, search, tab/segment, photo↔journal switch. Continuous, interruptible, spatially coherent, no jank (transform/opacity/clip-path only). Settings → Motion Full / Reduced / Off must cover every new and existing animation (add a test that enumerates animated selectors and asserts each is neutralized under `html.motion-off` and travel-free under `html.motion-reduced` and `prefers-reduced-motion`). Reject 3D, mouse tracking, showy hover, mobile-style full-screen menus.
4. A few genuine Mac touches: content shifts subtly with state (e.g. Today header copy and illustration change across morning/evening and done/not-done), a restrained completion celebration when all of today's habits are done (one-shot, ≤600ms, no confetti flood, respects motion setting), clear whitespace and hierarchy. Never hurt information density, accessibility or local-first behavior.
5. Visible hierarchy: tighten section headers, spacing scale and type ramp so each view has one clear primary area, one secondary area and quiet chrome.

Constraints: vanilla JS, no new runtime dependency, no CDN, local assets only, data/schema/backup/sync/photo-privacy compatibility unchanged, all strings in zh/en/de, macOS desktop first (≥980px), narrow widths must still work. Do not touch `src-tauri/widget/**`, `src-tauri/src/widget_bridge.rs`, `public/widget-contract.js`. Never delete or weaken tests; JS test count must stay ≥172.

## Step 3 — evidence and verification (all in the cloud environment)
- `npm ci && npm test && npm run check && npm run desktop:check`, `cargo test --manifest-path src-tauri/Cargo.toml`. Report real counts.
- Playwright on the desktop build (`?desktop=tauri-local`, fictional demo data only): widths 980/1180/1440/1600 × en/de/zh × light/dark; 0 page errors, no horizontal scroll. Save the summary JSON.
- Before/after contact sheets: build `f82b133` and the new head, same views/widths/languages, side by side, saved to `docs/phase-3-5/before-after-*.png`.
- At least one interaction video (Playwright `recordVideo`, ≤60s, fictional data) showing: habit complete → completed group → Undo, all-done celebration, search expand, "+" popover, Focus start/pause/finish, save success, Journal timeline↔photos, Motion set to Off. Save to `docs/phase-3-5/interaction.webm` (keep under 8 MB).
- Version 3.5.0 everywhere required by `tests/release-metadata.test.mjs` (package, lockfile, Tauri, Cargo, PWA cache/asset versions, changelog). Update `CHANGELOG.md` Unreleased, README.md / README.zh-CN.md / README.de-DE.md, docs/SHOWCASE* and fictional desktop screenshots.
- Push, then confirm GitHub Actions `CI` and `macOS Desktop Verification` are green on the final SHA, and that the macOS run uploaded the DMG artifact. If anything fails, fix and push again.

## Final report (no fabrication)
Final SHA; CI and macOS run URLs with conclusions; DMG artifact name/URL; evidence paths; per-matrix-row done/removed/skipped with reason; real remaining limits. Anything not run is written as "not run" with the reason.
