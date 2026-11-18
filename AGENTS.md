# Repository release discipline

- Keep each commit focused on one logical change. Do not create extra commits only to make the history look busier.
- Every commit must have a concise Conventional Commit-style subject and a meaningful body covering the result, relevant behavior or risk, and tests performed.
- Record completed work under `Unreleased` in `CHANGELOG.md`. Small layout changes belong in the changelog only when they materially affect use.
- New user-facing features must be documented consistently in `README.md`, `README.zh-CN.md`, and `README.de-DE.md`.
- When a visible feature changes, update the fictional English, Simplified Chinese, and German desktop/mobile screenshots and the matching `docs/SHOWCASE*` pages in the same change. Product images must never contain real personal data.
- Before a stable release, align the package version, lockfile, PWA cache and asset versions, changelog version, and `.github/releases/vX.Y.Z.md`.
- A release is complete only after tests pass and the tag, GitHub Release, GitHub Pages, and production deployment have been verified.

# Deployment-agent routing

- When a user asks to deploy or upgrade this repository, follow the language-matched runbook: `docs/deploy-with-codex.md`, `docs/deploy-with-codex.zh-CN.md`, or `docs/deploy-with-codex.de-DE.md`.
- Treat the complete Cloudflare edition as Worker + D1 + Workers AI + Access + private R2 photos, with read-only Google Calendar as an explicit opt-in. Existing cloud resources and personal data must be reused and preserved.
- Provision or bind D1 and R2 before the first full deployment. Never remove `PHOTOS` merely to make deployment pass, and never duplicate an existing database, bucket, Worker, Pages project, or OAuth client.
- Only account-owner actions may pause the workflow: login, persistent authorization, R2 billing acceptance, Google security consent, or destructive data changes. Everything else should proceed through evidence-based acceptance checks.

# Web Today requirements

- Before any Web Today change, read `.hermes/requirements/REQUIREMENTS.md` in the single working copy `/Users/ashan/Developer/life-ledger` (the single requirements ledger, every row cites the user's words). New user feedback is added there first; every delivery reports the whole table, not only the latest item.

# Testing without disturbing the owner

- Tests run silently. Use headless browsers (Playwright WebKit for the Mac app's engine), GitHub Actions, or an isolated app copy with its own bundle id (`*.updatertest`, `*.preview`) and its own data folder.
- Never open visible windows, take keyboard focus or input-method state, or launch, quit, replace or reconfigure the owner's installed `Life Ledger.app` while testing. Installing or updating the owner's app happens only when they ask, and then the owner opens it.
- Native AppKit/WebKit probes must not create on-screen or key windows; prefer Playwright WebKit with the Mac shell injected (`desktop/mac/shell.js` + `shell.css`) for Mac-only UI checks.
- Every feature change ships for BOTH web and the Mac app as equals (owner rule 2026-11-16): acceptance must include the Mac-shell browser tests and `npm run desktop:check` passing, Mac-specific interactions (shortcuts, month nav, traffic lights, sheet behavior) verified against the new UI, and performance/smoothness on the Mac WebKit shell considered — never web-only validation. A release is complete only when the `v*` tag pipeline has published the Mac bundles and the `mac-updates` feed serves the new version.

# Git safety

- Commit and push every completed local change to the current feature branch immediately; work must never exist only on this machine. Never commit to or push `main`, merge, rebase, force-push, rewrite history, tag or release without explicit user authorization.

# Keep it simple (owner rule 2026-11-18)

- One working copy only: `/Users/ashan/Developer/life-ledger`. Use short-lived branches there; do not create extra clones or worktrees.
- One agent session works on this repo at a time. Check `gh pr list` first; if another change is open, finish or hand it over before starting a new one.
- Small text, data, or style changes: edit, run `npm test`, open one PR, merge when CI is green. No multi-model reviews, review panels, or extra watchdog scripts for them.
