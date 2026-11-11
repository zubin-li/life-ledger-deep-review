# Brief: port the local demo workspace onto the approved web base

## Context
Repo worktree: this directory (branch `codex/web-local-demo-port`, based on commit `780b6a1` = the approved live web version).
On 2026-10-12 a "local demo workspace" feature was built on another branch whose base is only 3 commits after `780b6a1` (base `f4daf2a`), but it was never merged. Its full uncommitted diff and new files are staged in `.port/`:
- `.port/demo.diff` — diff of `CHANGELOG.md, package.json, public/app.js, public/index.html, public/styles.css, public/sw.js, tests/desktop-shortcuts.test.mjs` against `f4daf2a`.
- `.port/demo-workspace.js` → goes to `public/demo-workspace.js`
- `.port/demo-memories/*.svg` → goes to `public/assets/demo-memories/`
- `.port/demo-workspace.test.mjs` → goes to `tests/demo-workspace.test.mjs`

What the feature does (user requirement, 2026-10-12): in the pure local/GitHub-Pages version, a first-time visitor sees ~90 days of beautiful fictional data (habits, moods, journal, focus, weekly/monthly reviews, timeline photos) plus a notice bar with a button "清除示例并开始使用 / Clear the example and start"; after clearing it never re-seeds; imported backups are never overwritten; deployed (cloud) mode never seeds.

## Task
1. Apply the demo feature onto this base. Try `git apply --3way .port/demo.diff` first; resolve conflicts by hand where the base differs. Copy the three new file groups.
2. Version strings: this base uses `?v=1.3.0` asset queries and its own cache name in `public/sw.js`. Keep the base's version numbers (do NOT bump to 2.0.0); only add the demo entries. Do not touch `package.json` version. CHANGELOG: one line under `Unreleased`.
3. Do not change anything unrelated (no restyling, no refactors). `public/app.js` changes must be limited to the demo hooks from the diff.
4. Do not commit, push, or deploy.

## Acceptance (run these yourself, paste the real output)
- `npm test` → 0 failures (baseline before your change: run it first and report the count).
- `node --check public/demo-workspace.js`
- Headless check (Playwright is installed in `node_modules`): serve `public/` (e.g. `npx http-server`-free: write a 20-line node static server under `.port/serve.mjs`), open `/?mode=local&lang=zh&preview=local` in a fresh context, and print: (a) `#demoWorkspaceNotice` visible, (b) number of `state.logs` days with a mood in localStorage key `life-ledger-v1` (expect > 50), (c) click `#clearDemoWorkspace`, reload, notice hidden and logs empty-ish. Paste the printed JSON.

## Rules
- ponytail: smallest diff that reproduces the feature. No new dependencies.
- No fabrication: if a step fails, say so with the error text.
- Final message: list of files changed + the three acceptance outputs.
