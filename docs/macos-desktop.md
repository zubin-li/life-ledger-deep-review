# Life Ledger for Mac 3.0 (Tauri v2)

The Mac app packages the Life Ledger frontend for macOS: use it on this Mac only, or connect your own cloud deployment and sync with your other devices.

Download: [Mac 3.0.0 release](https://github.com/zubin-li/life-ledger-deep-review/releases/tag/mac-v3.0.0) (`Life-Ledger-3.0.0-mac-arm64.zip`, Apple Silicon: M1–M4, macOS 12 or later). The quickest setup is in [Mac online edition](macos-cloud.md) · [中文](macos-cloud.zh-CN.md).

## Build

```bash
npm install
npm run desktop:prepare
npm run desktop:build
```

Build outputs are generated under `src-tauri/target/release/bundle/macos/` (`.app`) and `src-tauri/target/release/bundle/dmg/` (`.dmg`).

## Use modes

- **Local on this Mac**: opens bundled `public/index.html` with local-first storage and no account.
- **Connected cloud**: opens your own deployed Life Ledger URL in a separate window. Sign-in is by email and a one-time code (Cloudflare Access); setup: [Mac online edition](macos-cloud.md) · [中文](macos-cloud.zh-CN.md).

Connected URL policy:

- HTTPS required for normal deployments.
- HTTP allowed only for `localhost` or `127.0.0.1` development URLs.
- URLs with credentials, malformed URLs, and `javascript:`, `data:`, `file:` schemes are rejected.

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
