import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const iconsDir = resolve(root, "src-tauri/icons");
const sourceIcon = resolve(root, "public/assets/app-icon.svg");

await mkdir(iconsDir, { recursive: true });
await execFileAsync("npx", ["tauri", "icon", sourceIcon, "--output", iconsDir], { cwd: root });

console.log("Tauri icons regenerated from public/assets/app-icon.svg.");
