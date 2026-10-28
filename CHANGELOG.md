# Changelog

All notable changes are documented here.

## [Unreleased]

## [2.0.6] - 2026-10-28

### Fixed

- **Cloud edition: photo wall photos and videos now sync across devices.** They are stored privately in your own Cloudflare R2 (the same bucket and limits as day photos); the order and the chosen focus point travel with your records. The first browser that opens 2.0.6 with photos on its wall brings them to the cloud. Wall settings (auto-play, fill or fit) sync too.
- **Weather city:** the forecast for the synced city is loaded even when the weather card is hidden, so the header chip shows the same city on every device.
- Coming back to the app window (not only the browser tab) picks up changes from other devices.

## [2.0.5] - 2026-10-28

### Fixed

- **Cloud edition: the Today layout and the weather city now sync across devices.** Card order, sizes and hidden cards, the weather city, the heatmap colours, the habit shown in the frequency card, the page order and the calendar view travel with your records, so the browser, the phone and the Mac app look the same. Coming back to the window picks up changes made on another device. The first browser to open after the update shares the choices you already made; theme, font and language stay per device. The local edition is unchanged.
- The weather chart no longer throws an error while it switches to another city.

## [2.0.4] - 2026-10-28

### Added

- **Settings → Data → Switch to sync mode / Switch to local mode.** In the browser it opens your own deployment (or the local edition) and offers a backup first; in the Mac app it brings back the start window.
- The app version is shown at the bottom of Settings (in the Mac app also the app version).

### Changed

- **Reviews are only what you write.** Removed "Write review" on the week page, "Start guided review" on Insights and the generated review template. Day, week and month stay separate: the week timeline shows only your weekly reflection, the month only your monthly reflection. Old generated drafts are kept in backups, just no longer shown.
- The monthly reflection box is taller and grows with your text, with no inner scroll bar or resize grip.
- Every dropdown (timeline month, Insights week/month, long-range phase, the Mac launcher language) now uses the same glass pill as the language and date controls on Today.
- Settings → Data now holds both **Import & export** and **Install as app**. The sidebar footer shows only your photo and name.
- "D1 cloud sync" now reads "Cloud sync".
- **Profile photo framing:** drag the photo to move it and use the slider (or scroll) to zoom, like the photo wall. The whole photo is kept, not a fixed square crop.
- **Online edition:** name and photo sync with your records, so every device shows the same. The local edition keeps them on the device.

### Mac app 3.0.0

- **Sync edition:** connect your own deployment and sign in with an email code (Cloudflare Access). Records, photos, name and profile photo are the same on the Mac, in the browser and on the phone. New **File → Sign Out of Cloud**; the start window links to a setup guide ([English](docs/macos-cloud.md), [中文](docs/macos-cloud.zh-CN.md)).
- **Settings → Switch mode** and **File → Switch Workspace…** go back to the start window to choose this Mac or your cloud.
- Backups and photo exports from the cloud window are saved to **Downloads**; the cloud window identifies as Safari so Cloudflare's and Google's sign-in pages work.
- App commands are granted per window: the cloud page can only use native confirm/alert sheets, the menu language and the mode switch, never the file dialogs.
- The start window shows the app version and uses the same glass language picker as the app.

### Fixed

- The weather card's time is now the chosen city's live local time, not the computer's. The "now" line moves on its own.

## [2.0.3] - 2026-10-27

### Added

- Photo memories in the local web edition and the Mac app: up to three photos a day, kept on the device only (never uploaded), shown in the calendar, timeline and photo card, and included in monthly `.llmedia` backups. **Clear local data** removes them.

### Changed

- Import & export moved into **Settings → Data**; the sidebar icon is gone.
- Review: the week picker names the whole Monday–Sunday week the numbers cover, sits on one line with the Week/Month switch, and every remaining dropdown has the same flat style as Settings.
- The monthly reflection uses the full card width and grows with its text instead of scrolling inside a small box.
- The mood reason field is taller.

### Fixed

- The sidebar stays in the window while you scroll on Week, Horizon, Timeline, Review and Habits; it used to scroll away and leave an empty column. Switching pages opens the new page at its top.

## [2.0.2] - 2026-10-27

### Changed

- Today's mood card drops the seven-day strip; the title stays where it was, the three choices sit in the freed space and still ask for a reason.
- The daily review card is review only (Focus keeps its own card); it no longer pages sideways, comes in medium, large and full-row sizes, has dictation, and opens in a larger window.
- The sidebar quote is light text on the dark sidebar in both themes.
- Week page: weekly review and weekly goals sit side by side at the top.
- Year, month and language pickers look the same in Safari and Chrome.
- Every card now responds to the pointer: the Today calendar, the Today header card and the three Habits summary cards lift like the others; habit filters, Timeline view switches and Review's detailed metrics show a hover state.

### Added

- Settings → Quotes: automatic, or your own list (one stays, several rotate daily).
- Settings → Page order for Today, Week, Horizon, Timeline and Review.
- Weather shows a default city until one is chosen: Berlin for Germany, London for the UK, Beijing for Chinese.

### Fixed

- The sidebar name and photo can be edited again (click your name). The editor was lost in a rollback on 2026-10-18; name and photo stay on this device only.

### Changed

- Replaced the local sample's personal-looking German-study storyline and occupation label with three culturally distinct fictional everyday calendars for Simplified Chinese, British English, and German.

### Documentation

- Clarified that the complete Cloudflare edition includes a private R2 photo bucket and that first-time R2 activation creates a pay-as-you-go subscription even when current usage remains inside the included allowances.
- Added copy-ready English and Chinese Codex deployment prompts that inventory and reuse existing resources, separate core/R2/Google setup into evidence gates, and require same-tab OAuth plus API and D1 verification before reporting success.
- Distinguished first-time R2 activation from an existing deployment and required agents to list and reuse an existing photo bucket instead of attempting to create a duplicate.
- Added a German deployment-agent runbook, linked all three languages from every README, and routed repository-aware agents to the correct guide. The runbooks now provision D1 and R2 before the first complete deployment instead of attempting an impossible binding order.

## [2.0.1] - 2026-10-24

### Fixed

- Browsers that had used 1.x froze on the first 2.0 visit: the new service worker waited for a page reload that could only start after it finished activating. Pages now reload onto the new release after activation.
- The local edition shows the three-month sample to every visitor again, as intended for 2.0. Records a visitor made earlier in that browser are kept in a backup and can be brought back with **Settings → Restore earlier records**.

## [2.0.0] - 2026-10-24

### Added

- Today card workspace: weather, mood, daily foundations, habit heatmap, focus, recent rhythm, month, photo wall, day calendar and more as cards with **Edit cards** (add, remove, drag, resize, configure) and a card library; layouts are saved.
- Local edition opens with a deterministic three-month fictional sample (habits, mood, notes, weekly and monthly reviews, long-term plans, bundled illustrative photos); **Settings → Clear local data** and **Load sample data**.
- `docs/DESIGN.md` design family for cards and pages.

### Changed

- Redesigned Week, Horizon, Timeline, Review and Habit settings in one design family with shared motion; monthly review lives only in Review.
- Appearance and font moved into Settings; Apple system fonts by default.
- Language switching updates every page, dialog, menu option, accessibility label and the sample data immediately.
- One asset version (`?v=2.0.0`) for every script and stylesheet and a matching service-worker cache, so installed PWAs update cleanly.

### Safety

- Existing local records are never replaced automatically; only empty workspaces and older sample data are refreshed. Sample data and clearing controls never run in the cloud edition.

## [1.3.0] - 2026-09-26

### Added

- Added a first macOS Tauri v2 desktop MVP shell with a localized launcher that separates **Local on this Mac** from **Connected cloud** and keeps remote windows outside local IPC permissions.
- Added native macOS JSON backup save/open dialogs for the local desktop window as a progressive enhancement, while preserving browser/PWA download and file-input behavior unchanged.
- Added desktop build scripts (`desktop:prepare`, `desktop:dev`, `desktop:check`, `desktop:build`), Tauri capability checks, cloud URL validation tests, and desktop documentation.

### Security and compatibility

- Restricted connected cloud windows to normal HTTPS URLs (plus localhost development) and kept them outside the native IPC capability list.
- Limited native JSON imports to 10 MiB and preserved the existing validated backup preview and restore flow.
- Added a GitHub-hosted Apple Silicon verification workflow that tests and builds unsigned `.app` and `.dmg` artifacts without using a contributor's Mac.

## [1.2.1] - 2026-09-20

### Improved

- Improved Quick record with higher-fidelity capture, a real microphone-level meter, and a quiet-input warning in English, Simplified Chinese, and German.
- Added bounded personal vocabulary context from active habits, focus topics, weekly goals, and active long-term items to improve recognition of specific activities and project names.
- Made AI cleanup preserve concrete terms and correct likely speech-recognition errors only when the surrounding context is strong, without adding another inference call or storing audio.

### Documentation and community

- Reworked the English, Simplified Chinese, and German README introductions around a concise product promise, an immediate product preview, and clear paths to try or contribute.
- Added current Timeline desktop and mobile product images in English, Simplified Chinese, and German, plus a maintenance check that keeps this visible feature represented in every showcase.
- Opened public roadmap issues for cross-platform apps, deterministic PDF reports, privacy-preserving AI, editable AI report drafts, frontend modularization, and accessibility checks.
- Added GitHub Discussions, support guidance, a pull request template, and contributor routing for early ideas, self-hosting questions, and scoped implementation work.

### Fixed

- Removed the duplicate Timeline heading and localized the singular one-photo summary in all three interface languages.

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
