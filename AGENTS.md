# Repository release discipline

- Keep each commit focused on one logical change. Do not create extra commits only to make the history look busier.
- Every commit must have a concise Conventional Commit-style subject and a meaningful body covering the result, relevant behavior or risk, and tests performed.
- Record completed work under `Unreleased` in `CHANGELOG.md`. Small layout changes belong in the changelog only when they materially affect use.
- New user-facing features must be documented consistently in `README.md`, `README.zh-CN.md`, and `README.de-DE.md`.
- Before a stable release, align the package version, lockfile, PWA cache and asset versions, changelog version, and `.github/releases/vX.Y.Z.md`.
- A release is complete only after tests pass and the tag, GitHub Release, GitHub Pages, and production deployment have been verified.
