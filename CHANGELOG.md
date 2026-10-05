# Changelog

All notable changes are documented here.

## [Unreleased]

### Rebuilt — Life Ledger 3.2 interaction architecture

- Recomposed Today on a 12-column desk: the date spans the pane, habits take seven columns, mood takes five, and reflection and photos repeat that split. Review now reads summary, trend, heatmap, habit comparison, then the monthly note, with 7/30/90 changes retargeting the same chart instead of rebuilding the page. Week and Timeline move one selection highlight onto the chosen day.
- Added one shared sidebar selection pill and a `⌘K` / `Ctrl+K` command palette for views, dates, habits, focus, theme, language, and backup. Sibling disclosures stay one-open. A review badge appears only when a recent day has completions and no reflection, and it shrinks on entry. The reference video’s dock, mega menu, and neon palette were not shipped. Version `3.2.0` is shown only in Settings → About. The service-worker cache is `life-ledger-pwa-3.2.0-r1`.

### Refined — Life Ledger 3.1

- Kept the Today / Week / Timeline / Review / Habits desk and restored the calm sage-and-paper palette. The sidebar (156–240px) and inspector (280–440px) stay resizable, and the writing pane keeps the wider share. Package, Tauri, Cargo, and displayed assets are `3.1.0`. The version is shown only in Settings → About. The service-worker cache is `life-ledger-pwa-3.1.0-r1`; retiring a local window still deletes only `life-ledger-pwa-*` cache entries and leaves IndexedDB, journals, habits, and photos in place.
- Review statistics come only from local logs: a 7/30/90-day completion rate with the completed/eligible counts, current and best streaks, a line when there are at least four points, a consistency heatmap with a text table, weekday and per-habit bars, and focus minutes only when focus data exists. English uses “1 time”. Settings offers System default, English, 简体中文, and Deutsch, and the choice applies immediately.

### Redesigned — desk structure

- Rebuilt the macOS desktop as a three-pane desk: a source sidebar, a two-column Today canvas, a seven-day Week board, a manuscript Timeline, a Review canvas, and a habit library. The local Tauri window unregisters any stale service worker and deletes only `life-ledger-pwa-*` CacheStorage entries.

### Added

- Added a real native macOS WidgetKit habit widget (systemSmall/systemMedium) with an interactive `AppIntent` checkbox that marks a habit complete directly from the desktop, without opening the app, and keeps working while the app is closed.
- Bridged the local desktop app to the widget through a versioned, size-bounded JSON contract in a shared App Group container (atomic temp-file-plus-rename writes on both the Rust and Swift sides), with an idempotent, replay-safe pending-mutation queue keyed by habit id + date + desired state so a duplicate tap or intent retry can never double-toggle.
- Added a Foundation-only `WidgetSharedKit` Swift package (models, palette, mutation-queue coalescing, atomic I/O) with its own `XCTest` suite, kept separate from the Apple-SDK-only WidgetKit extension so the shared logic can be built/tested independently of Xcode.
- Added a deterministic `scripts/build-widget.sh` that assembles and (optionally, given `APPLE_DEVELOPMENT_TEAM`) signs the `.appex` and a small `WidgetReloadHelper` binary into the exact layout `tauri.conf.json`'s `bundle.macOS.files` expects, with a CI-safe unsigned path and a clear failure when a signed build is requested without the required environment variables.
- Added a concise, localized (English, Simplified Chinese, German) widget status card in Habits settings, local-desktop-only, explaining the widget and how to add it — the widget bridge never runs in the public web/PWA or the connected-cloud window, which keeps its existing zero-IPC boundary unchanged.

### Redesigned — Life Ledger 3.0, a native macOS split-view app

- Replaced the dashboard/card architecture on desktop widths (≥980px, the packaged window's minimum) with a native-style adaptive split view: an edge-attached navigation sidebar (primary views plus a short, toggleable habits list), a unified toolbar (title, centered date/period navigation, search, inspector toggle), a main list pane, and a hideable per-view inspector that collapses before the sidebar on narrow windows. The giant quote hero, completion donut, habit-card carousel, weekly banner photo, Review KPI card wall, decorative sidebar quote/storage/status blocks, and the web-style global control strip were removed from the desktop markup, not hidden with CSS. Narrow/mobile layouts keep their existing structure.
- Phase 2 rebuilds the desktop information architecture around the work, not another visual pass. Today keeps the habit list and now continues into the day’s mood, reflection, and a local photo strip in the same pane. Week opens with a one-line planning summary. Timeline can filter to photos or notes, and the selected day owns a real photo editor. Habits shows a 28-day streak grid in the inspector. Review stays an editorial document.
- Photos are local-first. On this device they are stored in IndexedDB (`life-ledger-photos`), with add, drag-and-drop, caption, reorder, replace, remove-with-undo, and a preview dialog from Today, the journal dialog, and Timeline. JPEG, PNG, WebP, HEIC, and HEIF are accepted; other files, empty placeholders, decode failures, and the three-photo day limit report an error. A deployed Cloudflare workspace still uses the existing photo API. Month photo backups (`.llmedia`) restore locally as well as in the cloud.
- Today is now a Things-style list: precise date header, vertical habit rows with a circular completion control, one trailing status, collapsible "Completed" and "Not in today's score" groups, and Undo. Focus and day context stay in the inspector; mood, reflection, and photos continue in the main pane.
- Week is a seven-day agenda (per-day completion, mood, note excerpt) with a focused weekly-goals checklist and the weekly reflection editor in the inspector. The week/longer-term switch sits in that section header. Timeline follows Day One: compact month calendar plus entry list, with the selected day's mood, note, photos, events, and completed habits as a list in the detail pane. Review is a document: a one-line status, the monthly reflection, then a short completion trend. Per-habit scores and focus-by-topic live in the inspector; opening detailed metrics shows rows and a compact focus summary rather than score cards. Habits is a continuous reorderable table with active switches and a grouped detail editor in the inspector; deletion offers Undo, and habit rows have a keyboard-accessible context menu. Today uses a section-sized header and the list fills the pane.
- Added a genuine Tauri macOS application menu (App, File, Edit, View, Window, Help) routed to the web layer: Cmd+, Settings, Cmd+N new habit, Cmd+Shift+E export, Cmd+F search, Cmd+1–5 views, Cmd+B sidebar, Cmd+Option+0 inspector, Cmd+T / Cmd+[ / Cmd+] date navigation. Settings opens in a separate auxiliary window with its own minimal capability instead of being a primary page.
- The desktop launcher now remembers the last workspace (Local or validated Connected Cloud URL) and reopens it directly; "Switch Workspace…" in the File menu returns to the chooser. Local/cloud separation and cloud URL validation are unchanged.
- Motion is purposeful and short: 200ms habit check fill/stroke, 160ms directional date change, 180ms inspector transitions, 120ms popovers; all disabled under `prefers-reduced-motion`.
- Data, LocalStorage keys, backup/restore format, Cloudflare/CloudBase sync, calendar, voice reflection, photo privacy, three languages, and theme selection are unchanged. The WidgetKit extension, widget bridge, and `public/widget-contract.js` were not touched.
- Bumped to 3.0.0 (branch preview; the release-metadata test requires a bare `x.y.z`, so `3.0.0-rc.1` was not used) across `package.json`, `package-lock.json`, `src-tauri/tauri.conf.json`, `Cargo.toml`/`Cargo.lock`, the PWA cache name, and asset query strings. Regenerated the fictional English, Simplified Chinese, and German desktop screenshots.

### Redesigned — Life Ledger 2.0, a calm instrument panel

- Rebuilt the entire main-app design system (result): a light edge-attached sidebar (flat surface, border divider, no floating dark glass card), an integrated toolbar under the titlebar-safe inset, a system-font type scale (11/12/13/15/22–28, tabular figures), a 4px spacing scale, and a 6/8/10/12/14px radius scale that replaces the previous 17–30px "card soup" — gratuitous pill radii, decorative gradients/rings, and translucent glass blur are gone from inline surfaces; shadows are now reserved for floating popovers, dialogs, the day drawer, and the toast/celebration overlays.
- Redesigned all five views (Today, Week, Timeline, Review, Habits/Settings) to the same system: Today's hero card is a quiet flat ink panel instead of a glossy gradient banner; the habit carousel and daily-planning cards use borders and selection states instead of shadows; Week's goal list and writing panel are flat bordered surfaces; Timeline is a denser, left-aligned entry rail instead of a centered blog-style column with a 52px display headline; Review's score cards, charts, and comparison dashboards match the new token system; Habits/Settings rows use the same flat list treatment. Behavior, data, and every existing interaction are unchanged.
- Replaced every remaining structural glyph/emoji icon (▦ ✓ ⋮ ↗ ⌁ in the sidebar nav, plus ☀ ☂ ⌄ ＋ × ← → ✓ across mood pickers, dialog close buttons, disclosure chevrons, carousel/day/week/month navigation, and the toast/celebration/habit-completion checkmarks) with a coherent local inline SVG icon system (`currentColor`, consistent stroke, no network font/icon dependency), reusing the app's existing mood-icon paths where applicable.
- Removed the continuous `pointermove`-driven card tilt/glow effect (`apple-tilt`/`pointer-aura`) and the permanent noise-grain overlay — both were decorative, parallax-like flourishes that ran regardless of user intent and did not fit a restrained native motion system; hover/press feedback is now immediate background/border changes only.
- Converted the voice-reflection input-level meter from an idle `height`-animating keyframe loop plus JS-set pixel heights to a `transform: scaleY()`-based meter (JS now writes a scale ratio instead of a pixel height), and fixed the only other layout-property transition in the stylesheet (habit-carousel/daily-tool pagination dots animated `width`); both now animate `transform` only, matching the "never animate width/height/top/left" motion rule with no visible behavior change.
- Retuned the shared motion system to the spec's micro/normal/macro bands (120/200/260ms) via `--duration-micro/normal/macro` tokens (aliased to the existing `--duration-fast/base/slow/exit` names so no existing rule had to change its variable reference), fixed the one remaining implicit `transition: all` (`.danger-button`) to explicit properties, and kept `prefers-reduced-motion` and the desktop `motion-off` class working unchanged.
- Independently retuned the dark theme to a quieter graphite palette (sage accent instead of a generic SaaS blue) and removed its own glossy shadows/gradients on the same inline surfaces, so light and dark stay deliberately distinct without diverging in structure.
- Bumped to version 2.0.0 across `package.json`, `package-lock.json`, `src-tauri/tauri.conf.json`, the PWA cache name and every versioned asset query string in `public/index.html`/`public/sw.js`. The WidgetKit target/extension, app-group entitlement, widget bridge contract (`public/widget-contract.js`), and widget build/sign/test scripts were not touched.
- Tests performed: `npm run check` (syntax + existing `node --test` suites) and the full risk/limitations of that run are recorded in this release's notes; see `docs/macos-desktop.md` for the native-shell behavior this redesign builds on, which is unchanged.

### Improved

- Refined the macOS Tauri shell to feel native rather than a website in a window: real traffic lights in a transparent/overlay titlebar, an edge-attached sidebar with full-bleed content instead of embedded-card framing, and an unobtrusive Local Mac / Connected Cloud status label in English, Simplified Chinese, and German.
- Added desktop-only keyboard shortcuts (Cmd+1–5 for the five main views, Cmd+B to toggle the sidebar, Cmd+, for Habits Settings, Cmd+Shift+E for backup/export) that skip editable fields, preserve focus, and leave the public web/PWA's shortcuts untouched.
- Added a shared, restrained motion system (150–300ms, transform/opacity only, no `transition: all`) that suppresses motion for keyboard-triggered actions while keeping mouse-driven navigation and dialogs subtly animated, and that continues to respect `prefers-reduced-motion`.
- Redesigned the desktop launcher as a compact native workspace chooser with inline SVG icons, explicit Local/Cloud choice, busy/disabled/error states, and Enter-to-submit on the cloud URL field, while keeping its localized copy, saved-URL affordance, and strict cloud URL validation unchanged.
- Remembered each desktop window's position and size across launches using only the existing Tauri/stdlib dependency set (no new crate or plugin).
- The launcher now hides automatically when a local or cloud window opens, and reappears when that window closes; reopening an already-open mode reuses and focuses its window instead of duplicating it.

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
