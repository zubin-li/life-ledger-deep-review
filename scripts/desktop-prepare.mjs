import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "desktop-dist");
const desktop = resolve(root, "desktop");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(resolve(root, "public"), dist, { recursive: true });
await cp(resolve(desktop, "launcher.html"), resolve(dist, "launcher.html"));
await cp(resolve(desktop, "launcher.css"), resolve(dist, "launcher.css"));
await cp(resolve(desktop, "launcher.js"), resolve(dist, "launcher.js"));
await cp(resolve(desktop, "launcher-i18n.js"), resolve(dist, "launcher-i18n.js"));
await cp(resolve(desktop, "url-validation.js"), resolve(dist, "url-validation.js"));

await mkdir(resolve(root, "src-tauri", "icons"), { recursive: true });
await execFileAsync("npx", ["tauri", "icon", resolve(root, "public/assets/app-icon.svg"), "--output", resolve(root, "src-tauri/icons")], { cwd: root });

// Builds the WidgetKit extension when a Swift/Xcode toolchain is available (macOS only); on any
// other host it exits 0 after a clear "skipped" message, so this never breaks desktop:prepare
// itself — see scripts/build-widget.sh for the full CI-safe/unsigned-build contract.
await execFileAsync("bash", [resolve(root, "scripts/build-widget.sh")], { cwd: root }).then(
  ({ stdout }) => process.stdout.write(stdout),
  error => {
    process.stdout.write(error.stdout || "");
    process.stderr.write(error.stderr || "");
    throw error;
  }
);

console.log("Desktop assets prepared in desktop-dist and src-tauri/icons.");
