# Contributing

Thanks for helping improve Life Ledger.

## Where to start

- Choose a scoped task from [`good first issue`](https://github.com/zubin-li/life-ledger-deep-review/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) or [`help wanted`](https://github.com/zubin-li/life-ledger-deep-review/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22).
- Use [Discussions](https://github.com/zubin-li/life-ledger-deep-review/discussions) for questions, early ideas, design feedback, and architecture tradeoffs.
- Use an Issue when the problem and desired outcome are concrete enough to track.
- Comment before starting a large change so contributors do not duplicate work.

Code is not the only useful contribution. Product feedback, UX, privacy review, accessibility, localization, documentation, and cross-browser testing are all welcome.

Before submitting layout, theme, or interaction changes, run through the [Accessibility & Cross-Browser Smoke-Check Guide](docs/accessibility-and-browser-checks.md).

## Before opening a change

1. Search existing issues and discussions.
2. Keep privacy and local-first behavior intact.
3. Avoid adding trackers, hosted dependencies, or mandatory accounts.
4. Keep English, Chinese, and German interface strings aligned.
5. Document every user-facing feature in all three README files in the same change; keep small fixes out of the homepage changelog unless they materially affect usage.
6. Never put real journal text, calendar details, email addresses, access tokens, or personal photos in an Issue, Discussion, test fixture, or screenshot.

## Local workflow

```bash
npm install
npm run dev
npm test
```

Create a focused branch, add tests where practical, and open a pull request describing the user problem and the behavior before and after the change.

## Commit messages

Keep each commit focused on one logical change. Use a concise Conventional Commit-style subject followed by a body that records the result, important behavior, and verification:

```text
feat(calendar): link Today workspace to the selected date

- Synchronize mood, habits, schedule, and reflection with the chosen day
- Keep future habit and mood controls read-only
- Refresh calendar context after date changes

Tests: 59 passed
```

Use `feat`, `fix`, `refactor`, `style`, `docs`, `test`, or `chore` as appropriate. A small visual adjustment does not need an artificially separate release, but its commit must still explain what changed.

## Release checklist

For every stable release:

1. Move completed entries from `Unreleased` into a dated version in `CHANGELOG.md`.
2. Update the package version, PWA cache name, and asset query versions together.
3. Update user-facing feature documentation in English, Simplified Chinese, and German.
4. Add `.github/releases/vX.Y.Z.md` with a readable summary, upgrade notes, privacy considerations, and rollback information.
5. Run the complete test suite before tagging.
6. Push the annotated tag and verify the GitHub Release, CI, GitHub Pages, and production deployment.

## Design principles

- Calm before crowded.
- Useful summaries before decorative metrics.
- Data ownership before platform lock-in.
- Progressive disclosure before long explanatory copy.
- Keyboard, mobile, light mode, and dark mode are first-class experiences.
