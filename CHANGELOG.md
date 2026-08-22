# Changelog

All notable changes are documented here.

## Unreleased

## [1.1.0] - 2026-08-22

### Added

- A polished **Quick record** entry inside Daily Reflection for self-hosted Cloudflare deployments.
- Browser recording with pause, cancel, a ten-minute maximum, and responsive mobile/desktop states.
- Cloudflare Workers AI transcription followed by multilingual AI refinement into an editable daily-reflection draft.
- Original-transcript review, explicit confirmation, and append-only journal saving so existing reflections are never silently overwritten.
- Per-account limits of three requests and 20 recorded minutes per UTC day to keep personal free-tier usage predictable.

### Privacy and safety

- Raw audio is processed transiently and never stored in local state, D1, synchronization payloads, backups, or logs.
- The voice endpoint remains protected by the existing Cloudflare Access identity and is unavailable in local-only and CloudBase editions.
- Microphone permission is restricted to the app's own origin.
- Voice processing errors leave the existing journal unchanged and preserve a retry path whenever the in-memory recording is still available.

## [1.0.0] - 2026-08-20

Life Ledger 1.0 is the first stable release. It keeps the complete local-only experience free of accounts and central storage while preserving optional self-hosted synchronization.

### Added

- A zero-setup, HTTPS local-only PWA publishing path for GitHub Pages.
- Versioned JSON backups with validation, preview, complete restore, partial merge, earlier-export compatibility, and an undo safety copy.
- Best-effort persistent browser storage requests after local saves.
- English, Simplified Chinese, and German desktop/mobile product showcases.
- Tencent CloudBase deployment for mainland China, including email OTP authentication, creator-only document synchronization, maintained CLI configuration, and bilingual setup/cost documentation.
- A reproducible CloudBase build and one-command CLI deployment path that never includes browser-local demo data.
- A local-first focus timer with named topics, daily totals, weekly summaries, and a monthly heatmap.
- Flexible checklist or measured habits, effective-dated goal versions, optional notes, reliable ordering, and a paged mobile carousel.
- A structured product roadmap for printable reports, optional AI-assisted reflection, voice check-ins, photos, and contextual data.

### Fixed

- PWA upgrades now fetch core UI files network-first and use versioned asset URLs, preventing a new backup button from being paired with an older cached script.
- Mobile backup and restore now uses the same compact control rhythm and line-icon language as reminders and installation.
- Static HTTPS hosts no longer assume a Cloudflare API exists; deployment mode is now explicit.
- Blob download URLs remain available long enough for Safari and installed PWAs to save exports reliably.
- Simplified Chinese day-strip labels now use clear weekday abbreviations such as `周二` instead of truncating every label to `星`.
- Mobile bottom navigation now stays aligned to a stable safe-area inset while the page scrolls.
- Habit schedules and selected times now remain consistent between Today and Habit Settings.

### Compatibility notes

- Existing local and synchronized records continue to load without migration.
- JSON exports from earlier beta releases remain supported by the restore flow.
- Concurrent offline edits currently use latest-write-wins synchronization.
- Reminder delivery continues to depend on operating-system and browser PWA support.

## [0.1.0-beta.1] - 2026-08-12

### Added

- Daily habits, goals, mood, journal, and event notes.
- Weekly planning, outputs, and review archive.
- Monthly review, habit comparison dashboard, and trend charts.
- English, Simplified Chinese, and German interfaces.
- Light, dark, and system themes.
- Installable PWA, reminders while supported, and scoped JSON export.
- Optional self-hosted synchronization with Cloudflare Workers, Access, and D1.
- One-click Cloudflare deployment configuration.
- Zero-configuration local use by opening `public/index.html` directly.

### Known beta limitations

- Concurrent offline edits use latest-write-wins synchronization.
- Browser notification reliability depends on operating-system and browser PWA support.
