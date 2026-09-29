# macOS desktop MVP (Tauri v2)

This optional desktop shell packages the existing Life Ledger frontend for macOS.

The ready-to-install Apple Silicon package is published on the repository's [latest release](https://github.com/zubin-li/life-ledger-deep-review/releases/latest). It supports M1, M2, M3, and M4 Macs running macOS 12 or later.

## Build

```bash
npm install
npm run desktop:prepare
npm run desktop:build
```

Build outputs are generated under `src-tauri/target/release/bundle/macos/` (`.app`) and `src-tauri/target/release/bundle/dmg/` (`.dmg`).

## Use modes

- **Local on this Mac**: opens bundled `public/index.html` with local-first storage and no account.
- **Connected cloud**: opens your own deployed Life Ledger URL in a separate window.

Connected URL policy:

- HTTPS required for normal deployments.
- HTTP allowed only for `localhost` or `127.0.0.1` development URLs.
- URLs with credentials, malformed URLs, and `javascript:`, `data:`, `file:` schemes are rejected.

## Desktop widget

The local desktop app can also publish today's habits to a real native macOS WidgetKit widget,
with an interactive checkbox that works even when the app is closed. This is a separate,
local-only feature — see [docs/macos-widget.md](macos-widget.md) for the full architecture,
security boundary, and build steps.

## Native-feel presentation

Local and cloud windows detect their mode from a `desktop=tauri-local` or `desktop=tauri-cloud` query parameter, applied to `<html data-desktop>` before first paint so there is no flash of the web layout. In this mode:

- The sidebar attaches to the window edge (no embedded-card framing) and the main content area goes full-bleed, with a safe top inset for the transparent/overlay titlebar and its real traffic lights.
- PWA install prompts and other browser-only affordances stay hidden.
- An unobtrusive **Local Mac** / **Connected Cloud** status label is shown, localized in English, Simplified Chinese, and German.
- The public web/PWA is completely unaffected: without the `desktop` query parameter, appearance and behavior are unchanged.

## Keyboard shortcuts

Outside editable fields (inputs, textareas, selects, `contenteditable`), the desktop shell adds:

| Shortcut | Action |
| --- | --- |
| Cmd+1 – Cmd+5 | Today / Week / Timeline / Review / Habits |
| Cmd+B | Toggle the sidebar |
| Cmd+, | Open Habits Settings |
| Cmd+Shift+E | Open backup/export |

These shortcuts are wired up only when the desktop query parameter is present, so they never change behavior in the public web/PWA. Keyboard-triggered actions skip routine motion (view fades, dialog entrance, sidebar-icon rotation); mouse-driven navigation keeps its existing subtle motion. All UI motion respects `prefers-reduced-motion` and never uses `transition: all` or animates layout properties (width/height/top/left) for routine interactions.

## Window chrome and lifecycle

- The launcher, local, and cloud windows use a transparent/overlay titlebar on macOS (real decorations and traffic lights are preserved) via the public Tauri v2 `title_bar_style`/`hidden_title` APIs, cfg-gated to `target_os = "macos"` so other platforms still build normally.
- Opening a local or cloud window hides the launcher; closing that window shows the launcher again. Reopening a mode that is already open reuses and focuses its existing window instead of opening a duplicate.
- Window position and size are remembered per window (launcher, local, cloud) across launches, using only the existing Tauri/stdlib dependency set — a small flat text file per window under the app's data directory, with no new crate or plugin added. Only sane, positive dimensions are restored; corrupt or partial state falls back to the built-in default size.

## Launcher

The launcher is a compact native workspace chooser (not a generic two-card web layout), with inline SVG icons, an explicit choice between **Local** and **Cloud**, and a short privacy note on where each mode's data lives. It never auto-opens or silently picks a mode for you — both actions require an explicit click or Enter-submit on the cloud URL field. Opening a window shows a busy/disabled state on its button; a failed open surfaces an inline error distinct from URL-validation errors. English, Simplified Chinese, German, the saved-URL affordance, and strict cloud URL validation are unchanged.

## Backup behavior

In the Tauri local window, JSON backup export/import uses native macOS file dialogs:

- Export writes the same JSON backup data you already get in browser mode.
- Import reads selected JSON and runs the existing validation/preview/restore flow.
- Canceling a file dialog is treated as cancellation, not an error.

Choosing an iCloud Drive folder in the save/open dialog is supported as **file backup**. This is not real-time sync, conflict resolution, or automatic two-way merge.

Browser/PWA behavior outside Tauri is unchanged and still uses the existing download/file-input flow.

## Unsigned app note

This MVP build is unsigned and not notarized by default. If Gatekeeper blocks launch:

1. Open **System Settings → Privacy & Security**.
2. Find the blocked app notice and choose **Open Anyway**.
3. Confirm launch.

## GitHub-hosted Apple Silicon verification

Contributors and release preparation should use the GitHub-hosted `macos-14` workflow at `.github/workflows/macos-desktop.yml` for desktop verification and artifact builds, instead of relying on personal local machines.
