# Repository release discipline

- Keep each commit focused on one logical change. Do not create extra commits only to make the history look busier.
- Every commit must have a concise Conventional Commit-style subject and a meaningful body covering the result, relevant behavior or risk, and tests performed.
- Record completed work under `Unreleased` in `CHANGELOG.md`. Small layout changes belong in the changelog only when they materially affect use.
- New user-facing features must be documented consistently in `README.md`, `README.zh-CN.md`, and `README.de-DE.md`.
- When a visible feature changes, update the fictional English, Simplified Chinese, and German desktop/mobile screenshots and the matching `docs/SHOWCASE*` pages in the same change. Product images must never contain real personal data.
- Before a stable release, align the package version, lockfile, PWA cache and asset versions, changelog version, and `.github/releases/vX.Y.Z.md`.
- A release is complete only after tests pass and the tag, GitHub Release, GitHub Pages, and production deployment have been verified.

## Local development

Node.js 22 matches CI. `npm ci` installs from the lockfile, `npm test` runs the syntax checks and Node test suite, and `npx wrangler deploy --dry-run` bundles the Worker without publishing.

The Worker declares an AI binding, so a plain `wrangler dev` opens a remote Cloudflare session. In a non-interactive shell that session exits unless `CLOUDFLARE_API_TOKEN` is set. Local UI and D1 work does not need that token:

```bash
npx wrangler d1 migrations apply DB --local </dev/null
npx wrangler dev --local --ip 0.0.0.0 --port 8787 --show-interactive-dev-session=false
```

The app listens on port 8787. Habits, mood, and journal entries stay in the browser. `/api/state` returns 503 until Cloudflare Access (`TEAM_DOMAIN` and `POLICY_AUD`) is configured. Voice review and Google Calendar need a real Cloudflare deployment. The optional Tauri desktop shell targets Apple Silicon macOS and is not part of the Linux environment.
