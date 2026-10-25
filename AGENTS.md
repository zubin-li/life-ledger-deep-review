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

- Before any Web Today change, read `/Users/ashan/Documents/Codex/ll-361-blank-fix/.hermes/requirements/REQUIREMENTS.md` (the single requirements ledger, every row cites the user's words). New user feedback is added there first; every delivery reports the whole table, not only the latest item.
