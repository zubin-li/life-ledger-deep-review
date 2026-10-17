# Integrated desktop shell checkpoint

Fictional examples only. No user's browser, installed app, account, calendar or data was controlled or modified. No commit, push, deployment, installer or installation was produced.

## Implementation and boundaries

- Existing Tauri Overlay and OS-owned traffic lights retained. A 52px unified window row replaces the separate 38px inset and duplicate 78px toolbar gutter. Its 88px left reservation is for native controls, not HTML imitations.
- Existing sidebar toggle, persisted width/collapse preference, routing, six approved pages, original icons and data are reused. The desktop frame is rounded; web/mobile routes do not get a Mac titlebar.
- The bottom personal-space entry uses existing native Settings locally, existing dialog on the connected route. Name/avatar are device/origin-local appearance, not login, cloud profile or JSON backup data. Shared-origin Settings-window changes propagate via storage events. Different origins do not share the profile.
- PNG/JPEG/WebP only, max 5MB and 25 million decoded pixels, locally cropped to 192px JPEG. Remote URLs and SVG avatars rejected. Errors retain previous values; no photo is uploaded.
- Local/settings capabilities add drag/internal double-click maximize; the Settings window additionally gets permission to close itself so its in-app close button works. The explicitly chosen connected origin receives only the two movement actions on the `cloud` window, no filesystem or credential IPC. Grants for previously chosen origins last until app exit; no blanket remote-origin grant.
- Existing user changes and installed versions preserved. Launcher design and package version unchanged. A connected app still loads its configured server; new assets require a separate deployment, not performed here.

## Verification

- `npm run check` passed. Full `npm test`: **237 tests, 236 passed, 1 skipped, 0 failed**. The existing skipped test was not added by this change.
- Historical Day Plan CSS assertion corrected to inspect schedule rules rather than every later component in the shared stylesheet. Its horizontal-scrolling prohibition is retained. Real narrow-screen schedule long text is also asserted in three languages; Habit's intentional icon rail is no longer mistaken for Day Plan.
- Desktop contract checks: **82 passed**, including two new shell checks. These are not native GUI tests.
- Existing Rust toolchain was found outside PATH; `cargo test --manifest-path src-tauri/Cargo.toml --lib`: **30 passed**.
- `scripts/evidence/integrated-shell.mjs`: **66 layout scenarios** across six pages, EN/ZH/DE, light/dark, collapsed/expanded, 980/390px. Name/photo persistence, unsupported file rejection without overwriting the avatar, removal, native Settings handoff and same-origin Settings-window propagation passed. Three real mobile schedule long-title checks passed. **No page runtime errors.** [Results](results.json).
- `EVIDENCE_DIR=docs/integrated-shell/geometry node scripts/evidence/today-geometry.mjs`: **329 passed, 0 failed**. Existing card geometry/control hit tests retained. [Results](geometry/today-geometry-results.json).
- `git diff --check` passed. No test was removed, skipped or weakened. No new dependency installed.

## Still required before calling this a native release

Real NSWindow traffic-light placement, titlebar drag/double-click, full-screen and WebKit rendering need a macOS build check. Rust tests/browser screenshots do not establish these. Full Xcode is not selected on this machine (Command Line Tools is selected); WidgetKit/package gates were not bypassed. Live cloud sync/calendar, signing/notarization, publishing and installed-app acceptance were not performed.

Reference: [Tauri window customization](https://v2.tauri.app/learn/window-customization/) — Overlay keeps OS controls; drag regions belong on actual non-interactive targets.
