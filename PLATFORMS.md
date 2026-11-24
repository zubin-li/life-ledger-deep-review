# Platforms: one brain, three faces

Life Ledger ships as a web PWA, a macOS app and an Android app from **one repository and one `main`**.
Read this before any change that touches more than one platform, and before any platform-specific redesign.

## Branching

- One `main`. Work happens on short-lived feature branches merged by PR; every PR runs CI, macOS Desktop Verification and Android cloud build, which proves a change on one platform did not break the others.
- No long-lived per-platform branches. A shared fix must exist exactly once.
- Merging to `main` does not release every platform:
  - Web (local-only PWA on GitHub Pages) deploys automatically when `public/**` changes on `main`.
  - macOS and Android release from tags (`v*` today; `android-v*` once Android ships separately).

## The brain (shared core — must stay identical everywhere)

- Data model and storage keys, ledger/money calculations (`ledger-core.js`), habit and review metrics, long-range goals.
- Backup format: `BACKUP_SCHEMA_VERSION` in `public/app.js`. Bump it for any format change; older builds refuse newer backups (`unsupported-backup-version`) instead of silently dropping fields. Keep that test green.
- Media backup format (`media-backup.js`), i18n keys and meanings.

Rules:
- Calculations and data mutations live only in the shared core. Platform code renders, routes and calls native APIs; it never re-implements a rule or a total.
- A core change must pass all three PR checks.

## The faces (may differ per platform)

- Onboarding and first-run guidance, navigation layout, screen layout, gestures and shortcuts, native integrations (Android SAF picker, back button, edge-to-edge insets; macOS shell, traffic lights, updater).
- Today: platform differences are runtime flags on `<html>` (`data-desktop`, `data-desktop-app`, `data-android-app`) plus media queries, and native code in `src-tauri/src/desktop`, `src-tauri/src/mobile`, `src-tauri/android`, `desktop/`.
- When a screen's design truly diverges (e.g. a separate Android onboarding), move only that screen into a platform-specific module; leave the rest shared. No up-front restructuring.

## Platform roles (guides how faces diverge)

- Android: fast capture — open, record, check off in seconds.
- macOS: review, analysis, long writing on a big screen.
- Web: try-out and showcase without installation.
