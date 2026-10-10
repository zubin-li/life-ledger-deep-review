# macOS desktop widget (WidgetKit)

A real native macOS WidgetKit widget — not a floating Tauri/webview window — that shows today's
active habits and completion progress on the desktop, with `systemSmall` and `systemMedium`
sizes, and lets you check a habit off directly in the widget via a native `Button`/`AppIntent`,
without opening the app.

This feature is **local-desktop-only**. It has no effect on the public web/PWA, and no effect on
the connected-cloud Tauri window.

## Architecture decision

Two options were evaluated before writing any widget code, per current upstream guidance:

- **Apple, current guidance (fetched from developer.apple.com and its own JSON-doc endpoints
  during implementation):** interactive widgets adopt the `AppIntent` protocol, minimum
  iOS17/macOS14; returning from `perform()` triggers an automatic timeline reload for
  intent-originated changes; a `Toggle`/`Button` should update its appearance *optimistically*
  before the intent's own work finishes; App Groups on macOS support either a Developer-Portal
  `group.`-prefixed identifier (needs a provisioning profile) or an **unprovisioned**
  `<TeamID>.<name>` identifier (macOS-only, no web registration, not supported on other Apple
  platforms).
- **Tauri v2 (fetched from the `tauri-apps/tauri-docs` `v2` branch — `v2.tauri.app` itself is
  blocked by this environment's egress policy, so the GitHub source was used instead):
  `bundle.macOS.files` maps an arbitrary destination path under `Contents/` to a source file/dir,
  and `bundle.macOS.entitlements` points at the app's entitlements plist. There is no
  Tauri-native concept of "embed an app extension" beyond that — the `.appex` still has to be
  built and assembled by hand and just placed at `PlugIns/<name>.appex` via `files`.
- **`tauri-plugin-widgets` (evaluated at its current pinned `0.5` release, per its GitHub README):
  it ships a generic JSON-declarative-IR renderer that turns one config blob into native SwiftUI
  (Apple), Jetpack Glance (Android) or HTML (desktop windows) — i.e. *you don't write the SwiftUI
  yourself*. Its README does not document App Group write semantics, atomic-write/mutation-queue
  behavior, or confirm whether its declarative IR supports a custom interactive `AppIntent` with
  our exact idempotency contract (a specific habit id + date + desired boolean state, replay-safe).
  Given that uncertainty against this feature's precise interactive/atomic/idempotency
  requirements, and that it would not remove the "still need Xcode to compile Swift" limitation
  either way, **the decision was to implement the native Swift WidgetKit extension directly**,
  not this plugin. This is recorded here as the requested decision-with-sources; it should be
  re-evaluated if a future pinned release documents these guarantees explicitly.

## The three pieces

```
src-tauri/widget/
  WidgetSharedKit/            Foundation-only Swift package (models, palette, mutation-queue
                              coalescing, atomic group-container I/O, optimistic merge).
                              No WidgetKit/SwiftUI/AppIntents import — this is what makes it
                              buildable/testable with a plain `swift build`/`swift test` on any
                              platform with a Swift toolchain, unlike the other two.
  LifeLedgerWidgetExtension/  The actual WidgetKit extension: TimelineProvider, the
                              ToggleHabitIntent AppIntent, and the systemSmall/systemMedium
                              SwiftUI views. Apple-SDK-only; only compiles on macOS with Xcode.
  WidgetReloadHelper/         A tiny separate executable the Rust app spawns as a subprocess to
                              call WidgetCenter.reloadTimelines() after publishing new data from
                              outside an intent (see "Why a helper binary" below).
```

Plus, on the app side:

- `src-tauri/src/widget_bridge.rs` — the three Tauri commands, contract validation, atomic
  writes, App Group container resolution.
- `public/widget-contract.js` — the pure, DOM-free snapshot-building and mutation-reconciliation
  logic, shared between the browser (via `window.LifeLedgerWidgetContract`) and
  `tests/widget-contract.test.mjs` (real executed-logic tests, not source-string assertions).
- `public/app.js` — orchestration only: builds a snapshot from real app state, calls the Tauri
  bridge, applies incoming mutations through the existing `toggleHabit`/`saveState`/`renderAll`
  path, and drives a small status card in the Habits view.

## The versioned JSON contract

One schema (`schemaVersion: 1`), three independent implementations kept in sync by hand and
cross-checked by tests on all three sides:

| | Rust | Swift | JS |
|---|---|---|---|
| Types | `src-tauri/src/widget_bridge.rs` | `WidgetSharedKit/Sources/WidgetSharedKit/Models.swift` | `public/widget-contract.js` |
| Field names | camelCase via `#[serde(rename = ...)]` | camelCase (matches `Codable` defaults) | camelCase (native) |

**`snapshot.json`** (app → widget, canonical; the widget extension never writes this file):

```jsonc
{
  "schemaVersion": 1,
  "date": "2026-09-29",          // local calendar date, matches the app's own isoDate()
  "timezone": "Asia/Shanghai",   // IANA identifier, informational only
  "revision": 42,                // bumped by the app on every publish
  "updatedAt": 1758000000000,    // unix ms
  "completedCount": 3,
  "totalCount": 5,
  "habits": [                    // bounded to 8 rows (WIDGET_MAX_HABITS)
    { "id": "exercise", "name": "Exercise", "icon": "running", "color": "coral",
      "done": true, "countsTowardDaily": true }
  ]
}
```

**`pending-mutations.json`** (widget → app; the app only ever removes entries it has applied,
never writes new ones):

```jsonc
{
  "schemaVersion": 1,
  "mutations": [
    { "mutationId": "exercise#2026-09-29#true", "habitId": "exercise", "date": "2026-09-29",
      "desiredDone": true, "createdAt": 1758000012345 }
  ]
}
```

Both files live in `~/Library/Group Containers/<APP_GROUP_ID>/`. Rust resolves that path itself
(see "Why the App Group path is hardcoded" below) rather than through any Swift/Foundation call.

### What is deliberately never in this contract

Habit **notes**, **mood/mood-reason text**, the daily **journal note**, account identifiers, and
cloud credentials. This is enforced structurally, not just by convention: `WidgetHabit`/
`WidgetSnapshot` (all three languages) simply have no field that could hold them, Rust validates
every string field's length/charset/allowlist at the trust boundary, and
`tests/widget-contract.test.mjs` and `WidgetSharedKitTests` both assert the exact field set.

## Idempotency and conflict semantics

The widget never says "toggle this habit" — it always says "the desired state for (habit, date)
is `X`". That single design choice is what makes repeated execution safe:

1. **Deterministic mutation id.** `mutationId = "{habitId}#{date}#{desiredDone}"` (identical in
   Rust's `mutation_id_for`, Swift's `mutationId(habitId:date:desiredDone:)`, and JS's
   `widgetMutationId`). The same tap, or a system retry of the same intent call, always produces
   the same id.
2. **Last-write-wins coalescing.** `ToggleHabitIntent.perform()` upserts into
   `pending-mutations.json` keyed by `(habitId, date)`, replacing any earlier pending entry for
   that pair rather than appending. Five rapid taps produce one pending entry, not five.
3. **Optimistic local overlay.** The `TimelineProvider` overlays `pending-mutations.json` onto
   `snapshot.json` (`EffectiveSnapshot.merge`) before rendering, so the tap looks instant even
   though the app might not be running.
4. **App-side idempotency check.** `planMutationApplication` (in `widget-contract.js`, mirrored
   conceptually by the same check inline in `app.js`) only calls `toggleHabit()` when the
   *current* logged state differs from the desired one. A mutation that's already satisfied is
   still acknowledged (removed from the queue) but never re-applied.
5. **Conflict resolution rule: last writer wins, at (habit, date) granularity.** If the widget and
   the in-app UI both change the same habit for the same day before a reconciliation cycle runs,
   whichever the app processes on its next reconciliation pass (startup, resume, visibility, or
   the 20s interval) becomes canonical, and the app immediately republishes `snapshot.json` after
   applying — so the widget's optimistic overlay for that (habit, date) becomes empty and it
   converges to the same value on its next reload. There is no field-level merge because there is
   nothing to merge: completion is a single boolean per (habit, date), not free text.
6. **App-closed behavior.** The widget keeps working from whatever `snapshot.json` + any pending
   overlay it can already see; the pending mutations that don't get applied yet aren't lost — they
   sit in `pending-mutations.json` (App Group container, survives app-not-running) until the app
   is next opened, at which point `initWidgetBridge`'s `DOMContentLoaded` reconciliation call
   applies all of them and republishes.

## Security boundary

- The three bridge commands (`publish_widget_snapshot`, `read_pending_widget_mutations`,
  `ack_widget_mutations`) are registered exactly like the pre-existing `save_backup_json`/
  `open_backup_json` commands — added to the same `invoke_handler!` list, exposed to the page only
  via the **local** window's `initialization_script` (see `open_local_window` in `lib.rs`). The
  **cloud** window has no capability entry at all (unchanged, pre-existing architecture) and
  therefore no `window.__TAURI__` access whatsoever — it cannot reach these commands no matter
  what its (arbitrary, remote) page content tries to call. Nothing about this feature changes
  that boundary or grants the cloud window any new privilege.
- If a cloud window happens to be open at the same time as local widget activity, nothing here
  touches it: the widget bridge only ever reads/writes the local App Group container and the
  local browser-side `state`/`localStorage`. A cloud deployment only receives widget-originated
  changes later, through the *existing*, unmodified cloud-sync path (`pushCloudState`/
  `pullCloudState`), the same way any other local edit would sync — this feature does not add a
  second sync path or talk to any cloud endpoint itself.
- Rust validates every field crossing the boundary (`widget_bridge.rs`): schema version, date
  format/range, id charset/length, color against a fixed 6-value allowlist, name length, and an
  explicit serialized-byte-size ceiling for both files (32 KiB / 16 KiB) — independent of the
  structural list-length bounds. No command accepts a caller-supplied filesystem path; the
  container path is always resolved server-side from `APP_GROUP_ID`.
- Writes are atomic everywhere: temp file in the same directory, then `rename()` — identical
  pattern in Rust (`atomic_write_json`) and Swift (`GroupContainer.writeAtomically`), so a crash
  or a concurrent reader never observes a half-written file.

## Why the App Group container path is hardcoded in Rust

`FileManager.containerURL(forSecurityApplicationGroupIdentifier:)` is a Swift/Foundation API with
no supported Rust FFI. macOS places App Group containers at the stable, long-documented path
`~/Library/Group Containers/<group-id>/` — the same location that API resolves to. Rust
constructs that path directly (`widget_group_dir` in `widget_bridge.rs`) instead. The tradeoff:
this is not an Apple-guaranteed-stable-forever API contract, just a very long-standing, widely
relied-upon implementation detail. If Apple ever changed it, `widget_group_dir` is the one place
to update.

## Why a separate reload-helper binary

`WidgetCenter.shared.reloadTimelines(ofKind:)` is the call needed after the *app* (not an intent)
changes data, since WidgetKit's automatic reload-after-`perform()` only covers intent-originated
changes. It's a Swift/WidgetKit API with no Rust FFI. Rather than inventing an unverified
Objective-C-runtime bridge from Rust, `nudge_widget_reload` spawns a tiny prebuilt Swift
executable (`WidgetReloadHelper`) as a subprocess — a standard, safe, well-understood integration
pattern. It's best-effort: if the helper binary is missing or fails, the widget still becomes
consistent on its own periodic timeline refresh (every 30 minutes, `Provider.swift`) or the next
time its own `AppIntent` runs.

## Build

```bash
# Local iteration (unsigned, safe on any machine):
npm run desktop:widget:build

# Signed, distributable (needs a real Apple Developer Team + a registered/matching App Group):
APP_GROUP_ID=group.app.zubinli.lifeledger APPLE_DEVELOPMENT_TEAM=YOURTEAMID \
  npm run desktop:widget:build

# Fail loudly instead of silently producing an unsigned build:
APPLE_DEVELOPMENT_TEAM= npm run desktop:widget:build -- --require-signing   # exits 1 with a clear message
```

`npm run desktop:prepare` (and therefore `desktop:dev`/`desktop:build`) already runs this script.
On any machine without a Swift toolchain it prints a clear "skipped" message and exits `0` — it
does not fail `desktop:prepare` there. On macOS with Xcode installed it does a real build.

`scripts/build-widget.sh` also always runs `scripts/swift-static-sanity-check.mjs` first — a
brace/paren-balance pass over every `.swift` file. It is explicitly **not** a compiler and proves
nothing about correctness; it exists only because no Swift toolchain could be installed in the
environment this feature was implemented in (see "Verification limits" below).

## One-time Xcode / App Group provisioning (do this once, on a real Mac, before a signed build)

1. In an Apple Developer account, either:
   - register an App Group `group.<your-reverse-dns>` (e.g. `group.app.zubinli.lifeledger`) in
     the Developer Portal, and let Xcode's "Automatically manage signing" + `REGISTER_APP_GROUPS`
     obtain the updated provisioning profiles; **or**
   - use the **unprovisioned** macOS-only form `<YourTeamID>.<name>` — no Developer Portal
     registration needed, but it does not work on iOS/iPadOS/tvOS/visionOS/watchOS (irrelevant
     here since this widget is macOS-only).
2. Set `APP_GROUP_ID` to that exact identifier and `APPLE_DEVELOPMENT_TEAM` to your Team ID when
   running `npm run desktop:widget:build` (or export them for `desktop:build`/`desktop:dev` too).
   Both entitlements files (`src-tauri/Entitlements.plist` and
   `src-tauri/widget/LifeLedgerWidgetExtension/LifeLedgerWidgetExtension.entitlements`) must
   resolve to the **same** identifier or the app and the extension will silently talk to two
   different, non-communicating containers.
3. Sign the `.appex` with an entitlements file that includes that App Group *and*
   `com.apple.security.app-sandbox` (already in the extension's entitlements template) — app
   extensions must be sandboxed regardless of whether the host app is. The main app's
   entitlements intentionally do **not** set `app-sandbox` (see the comment in
   `src-tauri/Entitlements.plist` for why).
4. Sign order matters: sign the `.appex` first, embed it under `Contents/PlugIns/`, then sign the
   outer `.app` bundle last (Tauri's own build/signing step does the outer signing; run
   `desktop:widget:build` before it, which `desktop:prepare` already does).

## Verification limits (read before trusting any "it builds" claim)

**No Swift or Xcode toolchain was available in the environment this feature was implemented in,
and none could be installed** — three independent avenues were tried and all failed for
documented reasons:

- `swift`/`swiftc`/`xcodebuild` are not present, and there is no OS-level Swift package.
- `apt-get install`-ing a Swift toolchain isn't an option (Ubuntu's own repos don't carry one);
  downloading the official Linux toolchain from `download.swift.org` is explicitly blocked by
  this environment's outbound proxy policy (`connect_rejected`, confirmed via the proxy's own
  status endpoint), not merely a transient network failure.
- A container-based Swift toolchain (the official `swift` Docker image) was also considered, but
  no Docker daemon is reachable here (`docker info` fails to find `/var/run/docker.sock`).

**What this means concretely:**

- `WidgetSharedKit` (Foundation-only) has a real `Package.swift` and a real `XCTest` suite
  (`WidgetSharedKitTests`, ~20 cases covering model coding, mutation-queue coalescing, the
  optimistic-merge math, and atomic-write behavior against a real temp directory) that **would**
  run with a plain `swift test` — this was written and reviewed as if it will be compiled, but it
  has not actually been compiled or run here.
- `LifeLedgerWidgetExtension` and `WidgetReloadHelper` (WidgetKit/SwiftUI/AppIntents) cannot be
  compiled on any platform other than macOS with Xcode, with or without this environment's
  specific restrictions — this is inherent to those frameworks, not a limitation of this sandbox
  alone.
- The only checks actually run against the Swift code here are: `scripts/swift-static-sanity-check.mjs`
  (brace/paren balance — passed, 21/21 files) and the cross-language contract/packaging assertions
  in `tests/widget-packaging.test.mjs` and `tests/widget-contract.test.mjs` (source structure and
  real executed JS logic — both passed).
- The existing `.github/workflows/macos-desktop.yml` (GitHub-hosted `macos-14`, already includes
  Xcode) already runs `npm run desktop:prepare`, which now transitively runs
  `scripts/build-widget.sh` with a real Swift toolchain present. **That CI run — the next time
  this branch is pushed and the workflow triggers — is the first point at which any of the
  WidgetKit-specific Swift code actually gets compiled for real.** Treat that as the true
  first build signal, not anything claimed in this document or in chat.

## Real-Mac smoke checklist (do this after a real build succeeds)

1. `npm run desktop:widget:build` with `APP_GROUP_ID`/`APPLE_DEVELOPMENT_TEAM` set, then
   `npm run desktop:build`.
2. Launch the built `.app`, open **Local on this Mac**.
3. Right-click the Desktop → **Edit Widgets** → search "Life Ledger" → add the small and the
   medium widget.
4. Confirm the medium widget shows today's date, a completed/total count that matches the app,
   and up to 8 habit rows.
5. Tap an unfinished habit's row in the widget. Confirm: (a) it visually flips to done
   immediately, without opening the app; (b) opening the app shows the same habit already
   checked off in the Today view, with no duplicate toggle; (c) tapping the same row again
   within a second or two does not double-toggle back and forth erratically.
6. Quit the app entirely, tap a habit in the widget, relaunch the app, and confirm the change is
   present (the pending-mutation queue survived the app being closed).
7. Toggle Appearance between light and dark and confirm both widget sizes remain legible with
   correct contrast/vibrancy.
8. Turn on **Reduce Motion** and **larger text** (Accessibility settings) and confirm the widget
   still lays out without clipped/overlapping text.
9. Turn on VoiceOver, focus the widget, and confirm each habit row announces its name and
   completed/not-completed state, and confirm the small widget's ring announces the same summary
   the app's own progress indicator shows.
10. Confirm no habit note, mood reason, or daily journal text ever appears anywhere in the widget,
    at any size, in any state.
