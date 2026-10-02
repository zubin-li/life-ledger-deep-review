import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const libRs = readFileSync(new URL("../src-tauri/src/lib.rs", import.meta.url), "utf8");
const appJs = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const defaultCapability = JSON.parse(readFileSync(new URL("../src-tauri/capabilities/default.json", import.meta.url), "utf8"));
const localCapability = JSON.parse(readFileSync(new URL("../src-tauri/capabilities/local-only.json", import.meta.url), "utf8"));

test("opening a local or cloud window hides the launcher, and closing one restores it", () => {
  assert.match(libRs, /fn hide_launcher\(app: &AppHandle\)/);
  assert.match(libRs, /watch_window_lifecycle\(&app, &window, true\)/g);
  // Only local/cloud windows get restore_launcher_on_close = true; the launcher itself must not.
  assert.match(libRs, /watch_window_lifecycle\(app\.handle\(\), &window, false\)/);
  assert.match(libRs, /WindowEvent::Destroyed => \{/);
  assert.match(libRs, /if restore_launcher_on_close \{/);
});

test("existing local/cloud windows are reused and focused instead of duplicated", () => {
  assert.match(libRs, /if let Some\(window\) = app\.get_webview_window\("local"\) \{/);
  assert.match(libRs, /if let Some\(window\) = app\.get_webview_window\("cloud"\) \{/);
});

test("cloud window has neither the default nor local-only capability, so it gets no Tauri IPC privilege", () => {
  assert.deepEqual(defaultCapability.windows, ["launcher"]);
  assert.deepEqual(localCapability.windows, ["local"]);
  assert.ok(!defaultCapability.windows.includes("cloud"));
  assert.ok(!localCapability.windows.includes("cloud"));
  assert.match(libRs, /WebviewUrl::External\(normalized\)/);
});

test("the desktop=tauri-cloud query flag preserves the URL's existing query and hash", () => {
  assert.match(libRs, /fn with_desktop_cloud_flag\(mut url: Url\) -> Url \{/);
  assert.match(libRs, /url\.query_pairs_mut\(\)\.append_pair\("desktop", "tauri-cloud"\);/);
  assert.match(libRs, /desktop_cloud_flag_preserves_existing_query_and_hash/);
});

test("the tauri-cloud literal that the Rust shell appends matches the literal the frontend checks for", () => {
  assert.match(libRs, /"desktop", "tauri-cloud"/);
  assert.match(appJs, /desktopMode === "tauri-cloud"/);
});

test("macOS-only overlay titlebar APIs are cfg-gated so non-macOS builds still compile", () => {
  const macosBlocks = libRs.match(/#\[cfg\(target_os = "macos"\)\]\s*\{\s*builder = builder\.title_bar_style\(tauri::TitleBarStyle::Overlay\)\.hidden_title\(true\);\s*\}/g) || [];
  assert.equal(macosBlocks.length, 4, "expected one cfg-gated overlay titlebar block per window (launcher, local, cloud, settings)");
});

test("window position/size persistence uses only existing dependencies (no new crate) and rejects corrupt state", () => {
  assert.doesNotMatch(libRs, /serde_json/);
  assert.match(libRs, /fn parse_window_state\(contents: &str\) -> Option<\(f64, f64, f64, f64\)>/);
  assert.match(libRs, /window_state_round_trips_valid_values/);
  assert.match(libRs, /window_state_rejects_malformed_or_nonsensical_values/);
});

// The two tests below are a supplemental source-level guard only. The actual correctness
// proof for physical->logical conversion and debounced/coalesced writes lives in lib.rs's own
// #[cfg(test)] unit tests (physical_to_logical_*, commit_if_current_*, take_pending_geometry_*),
// which exercise the real conversion math and generation-based coalescing without needing a
// live window or a real OS event loop.

test("window geometry is saved and restored in logical (DPI-independent) units, not raw physical pixels", () => {
  assert.match(libRs, /fn physical_to_logical\(position: PhysicalPosition<i32>, size: PhysicalSize<u32>, scale_factor: f64\)/);
  assert.match(libRs, /tracked_window\.scale_factor\(\)/);
  assert.match(libRs, /physical_to_logical\(position, size, scale_factor\)/);
  // Restoring must feed the same logical units straight into position()/inner_size(), with no
  // second, undocumented unit conversion at the call site.
  assert.match(libRs, /builder\.position\(x, y\)\.inner_size\(width\.max\(980\.0\), height\.max\(700\.0\)\)/);
});

test("Moved/Resized events never synchronously touch the filesystem; writes are debounced off the hot path", () => {
  const start = libRs.indexOf("fn watch_window_lifecycle(");
  const end = libRs.indexOf("\nfn hide_launcher(", start);
  const lifecycle = libRs.slice(start, end);
  assert.ok(lifecycle.length > 0);
  // The event-delivery arm only queues a debounced write; it must not call fs::write directly.
  const movedArm = lifecycle.slice(lifecycle.indexOf("WindowEvent::Moved"), lifecycle.indexOf("WindowEvent::Destroyed"));
  assert.doesNotMatch(movedArm, /fs::write/);
  assert.doesNotMatch(movedArm, /create_dir_all/);
  assert.match(movedArm, /queue_window_state_write/);
  assert.match(libRs, /const WINDOW_STATE_DEBOUNCE: Duration = Duration::from_millis\(300\);/);
  assert.match(libRs, /thread::spawn\(move \|\| \{\s*thread::sleep\(WINDOW_STATE_DEBOUNCE\);/);
  // Directory setup is cached once (OnceLock), not re-run from the write path.
  assert.match(libRs, /static WINDOW_STATE_DIR: OnceLock<Option<PathBuf>> = OnceLock::new\(\);/);
  // The debounce thread only closes over plain data, never the WebviewWindow — so it cannot
  // keep the native window alive.
  const spawnStart = libRs.indexOf("thread::spawn(move || {");
  const spawnEnd = libRs.indexOf("});", spawnStart);
  const spawnBody = libRs.slice(spawnStart, spawnEnd);
  assert.doesNotMatch(spawnBody, /tracked_window/);
  assert.doesNotMatch(spawnBody, /WebviewWindow/);
});
