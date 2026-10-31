import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

console.log("Desktop assets prepared in desktop-dist (Tauri icons unchanged; run npm run desktop:icons when app-icon.svg changes).");
