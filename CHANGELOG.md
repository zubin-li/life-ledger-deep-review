# Changelog

All notable changes are documented here.

## Unreleased

### Added

- A zero-setup, HTTPS local-only PWA publishing path for GitHub Pages.
- Versioned JSON backups with validation, preview, complete restore, partial merge, earlier-export compatibility, and an undo safety copy.
- Best-effort persistent browser storage requests after local saves.
- English and Simplified Chinese desktop/mobile product showcases.
- Tencent CloudBase deployment for mainland China, including email OTP authentication, creator-only document synchronization, maintained CLI configuration, and bilingual setup/cost documentation.
- A reproducible CloudBase build and one-command CLI deployment path that never includes browser-local demo data.

### Fixed

- PWA upgrades now fetch core UI files network-first and use versioned asset URLs, preventing a new backup button from being paired with an older cached script.
- Mobile backup and restore now uses the same compact control rhythm and line-icon language as reminders and installation.
- Static HTTPS hosts no longer assume a Cloudflare API exists; deployment mode is now explicit.
- Blob download URLs remain available long enough for Safari and installed PWAs to save exports reliably.
- Simplified Chinese day-strip labels now use clear weekday abbreviations such as `周二` instead of truncating every label to `星`.

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
