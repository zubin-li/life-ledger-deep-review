#!/usr/bin/env bash
# Builds the native macOS WidgetKit extension and the tiny widget-reload helper, then assembles
# them into the exact layout tauri.conf.json's bundle.macOS.files expects:
#   src-tauri/widget/build/PlugIns/LifeLedgerWidgetExtension.appex
#   src-tauri/widget/build/Resources/life-ledger-widget-reload
#
# This script has two independent halves:
#   1. WidgetSharedKit (Foundation-only): `swift build` / `swift test` run on ANY platform with a
#      Swift toolchain, including Linux CI — this is the CI-safe unsigned compile/check path.
#   2. LifeLedgerWidgetExtension + WidgetReloadHelper (WidgetKit/SwiftUI/AppIntents): these only
#      exist in the Apple SDK, so they can only be compiled on macOS with Xcode/Command Line
#      Tools installed. On any other host this script skips half 2 with a clear message and a
#      zero exit code — it is not a failure to lack an Apple toolchain, only to have one and hit
#      a real build error.
#
# Required environment variables for a *signed, distributable* build:
#   APPLE_DEVELOPMENT_TEAM   Your Apple Developer Team ID (e.g. "ABCDE12345").
#   APP_GROUP_ID             App Group identifier shared by the app and the extension
#                            (default: group.app.zubinli.lifeledger). Must be a `group.`-prefixed,
#                            Developer-Portal-registered id, OR the unprovisioned macOS-only form
#                            "<TeamID>.<name>" (see docs/macos-widget.md for both options).
#
# Without APPLE_DEVELOPMENT_TEAM this script still produces a real, runnable, *unsigned* .appex
# and helper binary (useful for local iteration and for the CI compile-check gate). Pass
# --require-signing to make a missing team a hard failure instead of an unsigned build.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
WIDGET_DIR="${ROOT_DIR}/src-tauri/widget"
BUILD_DIR="${WIDGET_DIR}/build"
CONFIGURATION="${WIDGET_BUILD_CONFIGURATION:-release}"

REQUIRE_SIGNING=0
for arg in "$@"; do
  case "$arg" in
    --require-signing) REQUIRE_SIGNING=1 ;;
    *) echo "build-widget.sh: unknown argument '$arg'" >&2; exit 64 ;;
  esac
done

APP_GROUP_ID="${APP_GROUP_ID:-group.app.zubinli.lifeledger}"
APPLE_DEVELOPMENT_TEAM="${APPLE_DEVELOPMENT_TEAM:-}"

log() { printf '[build-widget] %s\n' "$1"; }

log "Running the Swift static sanity check (brace/paren balance only, not a compiler)…"
node "${SCRIPT_DIR}/swift-static-sanity-check.mjs"

log "App Group id: ${APP_GROUP_ID}"
if [ -n "$APPLE_DEVELOPMENT_TEAM" ]; then
  log "Apple Development Team: ${APPLE_DEVELOPMENT_TEAM} (signed build)"
else
  log "APPLE_DEVELOPMENT_TEAM not set: producing an UNSIGNED build"
  if [ "$REQUIRE_SIGNING" -eq 1 ]; then
    echo "[build-widget] ERROR: --require-signing was passed but APPLE_DEVELOPMENT_TEAM is not set." >&2
    echo "[build-widget] Set APPLE_DEVELOPMENT_TEAM=<your Apple Developer Team ID> and re-run." >&2
    exit 1
  fi
fi

if ! command -v swift >/dev/null 2>&1; then
  log "No 'swift' toolchain found on PATH. Nothing can be compiled or checked here."
  log "This is expected in most non-macOS CI/sandbox environments; it is not a build failure."
  exit 0
fi

log "swift toolchain: $(swift --version 2>&1 | head -n1)"

# --- Half 1: WidgetSharedKit (Foundation-only, cross-platform-capable) --------------------------
log "Building WidgetSharedKit (Foundation-only; runs on any platform with Swift)…"
(cd "${WIDGET_DIR}/WidgetSharedKit" && swift build -c "$CONFIGURATION")
log "Testing WidgetSharedKit…"
(cd "${WIDGET_DIR}/WidgetSharedKit" && swift test)
log "WidgetSharedKit: build + test OK."

# --- Half 2: the Apple-SDK-only WidgetKit extension + reload helper -----------------------------
if [ "$(uname -s)" != "Darwin" ]; then
  log "Not running on macOS: skipping the WidgetKit extension and reload helper."
  log "WidgetKit/SwiftUI/AppIntents only exist in the Apple SDK; they cannot compile elsewhere."
  log "This is expected outside macOS; it is not a build failure."
  exit 0
fi

if ! xcrun --sdk macosx --find swiftc >/dev/null 2>&1; then
  log "macOS detected but no Xcode / Command Line Tools found (xcrun can't locate the SDK)."
  log "Install Xcode or 'xcode-select --install' to build the WidgetKit extension."
  exit 0
fi

rm -rf "$BUILD_DIR"
mkdir -p "${BUILD_DIR}/PlugIns" "${BUILD_DIR}/Resources" "${BUILD_DIR}/_plists"

substitute_group_id() {
  # $1 = source plist template, $2 = destination path
  sed "s/__APP_GROUP_ID__/${APP_GROUP_ID}/g" "$1" > "$2"
}

log "Building LifeLedgerWidgetExtension (WidgetKit/SwiftUI/AppIntents)…"
(cd "${WIDGET_DIR}/LifeLedgerWidgetExtension" && swift build -c "$CONFIGURATION")
EXTENSION_BIN="${WIDGET_DIR}/LifeLedgerWidgetExtension/.build/${CONFIGURATION}/LifeLedgerWidgetExtension"
if [ ! -f "$EXTENSION_BIN" ]; then
  echo "[build-widget] ERROR: expected build product not found at ${EXTENSION_BIN}" >&2
  exit 1
fi

log "Building WidgetReloadHelper…"
(cd "${WIDGET_DIR}/WidgetReloadHelper" && swift build -c "$CONFIGURATION")
HELPER_BIN="${WIDGET_DIR}/WidgetReloadHelper/.build/${CONFIGURATION}/WidgetReloadHelper"
if [ ! -f "$HELPER_BIN" ]; then
  echo "[build-widget] ERROR: expected build product not found at ${HELPER_BIN}" >&2
  exit 1
fi

log "Assembling LifeLedgerWidgetExtension.appex…"
APPEX="${BUILD_DIR}/PlugIns/LifeLedgerWidgetExtension.appex"
mkdir -p "${APPEX}/Contents/MacOS"
cp "$EXTENSION_BIN" "${APPEX}/Contents/MacOS/LifeLedgerWidgetExtension"
chmod +x "${APPEX}/Contents/MacOS/LifeLedgerWidgetExtension"
substitute_group_id "${WIDGET_DIR}/LifeLedgerWidgetExtension/Info.plist" "${APPEX}/Contents/Info.plist"
substitute_group_id "${WIDGET_DIR}/LifeLedgerWidgetExtension/LifeLedgerWidgetExtension.entitlements" "${BUILD_DIR}/_plists/LifeLedgerWidgetExtension.entitlements"

cp "$HELPER_BIN" "${BUILD_DIR}/Resources/life-ledger-widget-reload"
chmod +x "${BUILD_DIR}/Resources/life-ledger-widget-reload"

substitute_group_id "${ROOT_DIR}/src-tauri/Entitlements.plist" "${BUILD_DIR}/_plists/App.entitlements"
log "Substituted App Group id into a build/_plists copy of the app entitlements template."
log "(src-tauri/Entitlements.plist itself is left untouched — point Tauri's"
log " bundle.macOS.entitlements at build/_plists/App.entitlements, or substitute in place"
log " during your own release process; see docs/macos-widget.md.)"

if [ -n "$APPLE_DEVELOPMENT_TEAM" ]; then
  if ! command -v codesign >/dev/null 2>&1; then
    echo "[build-widget] ERROR: APPLE_DEVELOPMENT_TEAM is set but 'codesign' was not found." >&2
    exit 1
  fi
  log "Signing the .appex with entitlements (inner component first, per Apple's signing order)…"
  codesign --force --deep --timestamp=none \
    --sign "$APPLE_DEVELOPMENT_TEAM" \
    --entitlements "${BUILD_DIR}/_plists/LifeLedgerWidgetExtension.entitlements" \
    "$APPEX"
  log "Signed. The outer .app bundle must be (re-)signed AFTER this .appex is embedded under"
  log "Contents/PlugIns/ — Tauri's own bundling/signing step does that; do not sign the .app"
  log "bundle before the .appex is in place, or the outer signature will be invalidated by the"
  log "later embed."
else
  log "Unsigned .appex produced. It will not launch as a real widget until it is signed with a"
  log "team that has App Groups + WidgetKit Extension capabilities enabled (see"
  log "docs/macos-widget.md for the one-time Xcode/App Group provisioning steps)."
fi

log "Done."
log "  Extension: ${APPEX}"
log "  Reload helper: ${BUILD_DIR}/Resources/life-ledger-widget-reload"
log "  Entitlements (app, substituted): ${BUILD_DIR}/_plists/App.entitlements"
