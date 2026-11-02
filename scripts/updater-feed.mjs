// Writes the Tauri updater feed (latest.json) for the macOS build in <bundle/macos dir>.
// The archive URL points at the fixed "mac-updates" release, where the workflow uploads the same files.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) throw new Error("usage: updater-feed.mjs <bundle/macos dir>");
const archive = readdirSync(dir).find(name => name.endsWith(".app.tar.gz"));
if (!archive) throw new Error("no .app.tar.gz updater archive found");
const conf = JSON.parse(readFileSync(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8"));
const notes = readFileSync(new URL("../.github/releases/mac-update-notes.md", import.meta.url), "utf8").trim();
const asset = encodeURIComponent(archive).replace(/%20/g, ".");
const feed = {
  version: conf.version,
  notes,
  pub_date: new Date().toISOString(),
  platforms: {
    "darwin-aarch64": {
      signature: readFileSync(join(dir, `${archive}.sig`), "utf8").trim(),
      url: `https://github.com/zubin-li/life-ledger-deep-review/releases/download/mac-updates/${asset}`,
    },
  },
};
process.stdout.write(`${JSON.stringify(feed, null, 2)}\n`);
