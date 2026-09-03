# Changelog

All notable changes are documented here.

## [Unreleased]

No unreleased changes yet.

## [1.2.0] - 2026-09-03

### Added

- Read-only Google Calendar context inside the daily workspace, including calendar selection, recurring-event filtering, and support for connecting up to two Google accounts.
- Mood-colored month cells with an optional habit-completion heatmap and compact calendar-event counts.
- Private Cloudflare R2 photo memories inside the mood flow, limited to three compressed photos per day.
- A chronological Timeline that combines mood, mood reasons, journal context, and photo memories.
- Compact long-term items in the desktop sidebar without introducing a second source of truth.
- Portable monthly `.llmedia` export and idempotent restore for records and compressed photos.

### Changed

- Reworked Today into a calmer daily workspace where schedule and reflection share an equal layout.
- Moved Focus into the Daily Reflection carousel so the primary page stays focused when the timer is not in use.
- Linked the Today workspace to the selected calendar date: hero progress, mood, habits, schedule, and reflection now move together.
- Removed the redundant flexible-goals panel and excluded retired daily goals from review evidence.
- Updated all three README languages with Google Calendar, photo-memory, Timeline, and backup guidance.

### Privacy and safety

- Photos are re-encoded in the browser, never published through an R2 public URL, and remain behind the existing Cloudflare Access identity.
- Media metadata and objects stay outside the whole-state JSON payload; local-only and CloudBase editions do not expose photo upload.
- Deployment-wide storage and monthly R2-operation ceilings keep application traffic well below the published Standard free allowances.
- Google Calendar access is read-only; credentials remain server-side and calendar events are not treated as completed habits or goals.

### Fixed

- Made macOS Photos-library selection resilient to temporary and zero-byte picker files while avoiding unnecessary HEIC conversion.
- Added native decoding and a bundled fallback for HEIC/HEIF, with format verification, JPEG fallback, and progressive resizing before upload.
- Improved photo errors for incomplete iCloud downloads, expired sessions, network failures, and temporary storage failures.
- Added responsive one-, two-, and three-photo Timeline compositions so portrait images no longer render as narrow strips.
- Made the mood-and-photo dialog scroll correctly in Android Firefox without forcing the mobile keyboard open.
- Kept Quick record visible in the reflection carousel and available for today and past entries while future dates remain locked.
- Replaced crowded event-dot clusters with one compact calendar/count badge.

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
