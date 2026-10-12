# Cursor Cloud brief — Life Ledger phase 3.4 (motion + hairline assets)

Repository `zubin-li/life-ledger-deep-review`, branch `codex/macos-3-wip`. Work on this branch, commit there and push it. Do not merge main, tag, release or deploy.

Read first: `AGENTS.md`, `docs/phase-3-4-motion-plan.md` (the spec for this task — implement every Adopt/Adapt row), `docs/phase-3-3-design-contract.md` (layout is locked; do not reopen it), `THIRD_PARTY_NOTICES.md`.

## Inputs already in the repo
- `public/assets/hairline/*.svg` — 8 hairline illustrations (1px `currentColor`, `data-layer` groups), drafted by Antigravity and visually reviewed (coherence 7/10). Polish before wiring: `empty-today-done` — replace the loop on the top plate with an unambiguous check; `empty-habits` — add a clear rounded checkbox with a check on the base plate; `empty-insights` — simplify to one clean rising polyline with 3–4 dots, remove overlapping dotted connectors; `empty-week` — remove the unexplained floating circle. Keep the shared grammar (1px stroke, one accent, three `data-layer` groups, viewBox 0 0 160 120). Wire them into: Today all-done state, Journal empty, Insights empty, Week empty, Habits empty, launcher Local/Cloud cards, Focus idle panel.

## Implementation rules
Minimalism (ponytail, full): stop at the first rung that holds — 1) does it need to exist? 2) already in this codebase? (reuse `public/interaction.js`, the existing nav pill FLIP, rolling counts, context menu, toast/Undo, motion tokens) 3) stdlib/web platform? 4) native CSS? 5) installed dependency? 6) one line? 7) minimum code. No new runtime dependency, no framework, no CDN. Shared helpers go into `public/interaction.js` (UMD, testable from node like the existing palette helpers).
- Animate only transform, opacity, clip-path. Interruptible. `prefers-reduced-motion`, `html.motion-off`, and the new `html.motion-reduced` (Settings → Appearance → Motion: Full / Reduced / Off, stored in the existing settings storage — no new schema keys beyond one setting value) must all keep the end state with no travel.
- WebKit (Tauri on macOS) is the target engine: no CSS `d:` path transitions, verify `linear()` easing via `@supports` fallback.
- Every new string in zh / en / de. Keyboard parity for every pointer interaction. VoiceOver labels and `aria-live` for submit-state changes.
- Preserve storage schemas, backup/restore format, sync, photo privacy. Do not touch `src-tauri/widget/**`, `src-tauri/src/widget_bridge.rs`, `public/widget-contract.js`, `outputs/`.
- Never delete or weaken tests; test count must not drop below 164. Add the tests listed in the plan's Acceptance section.

## Gates you must run and report with real output
`npm ci && npm test && npm run check && npm run desktop:check && npm run desktop:prepare` (on Linux the Swift widget step may be skipped by the script; report exactly) and `cargo test --manifest-path src-tauri/Cargo.toml`. Playwright checks at 980/1180/1440/1600 in en/zh/de, light/dark, reduced motion: 0 page errors, no horizontal scroll. Save frame sequences or short recordings for plan items #1 #2 #5 #8 #10 under `docs/phase-3-4/`.

## Release discipline
Bump to 3.4.0 consistently (package.json, package-lock.json, tauri.conf.json, Cargo.toml/Cargo.lock, PWA cache name and asset query strings — follow `tests/release-metadata.test.mjs`). CHANGELOG under Unreleased; README.md / README.zh-CN.md / README.de-DE.md and docs/SHOWCASE* consistent; regenerate fictional desktop screenshots if visible UI changed. Lucide glyphs (ISC) only where missing, recorded in THIRD_PARTY_NOTICES.md.

## Commits
Focused Conventional Commits with bodies (result, risk, tests run). Suggested split: (1) motion helpers + tokens + setting, (2) view interactions, (3) hairline assets wiring, (4) docs/screenshots/version. Push to `codex/macos-3-wip`.

## Report
Per plan row: done / skipped + reason. Gate outputs (counts). Commit SHAs. If something could not run, say "not run" and why — never fabricate results.
