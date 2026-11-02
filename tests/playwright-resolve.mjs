import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const candidates = [
  join(repoRoot, "node_modules/playwright"),
  "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright",
];

export function resolvePlaywrightRoot() {
  for (const root of candidates) {
    if (existsSync(join(root, "index.mjs"))) return root;
  }
  return null;
}

export const playwrightRoot = resolvePlaywrightRoot();
export const hasPlaywright = Boolean(playwrightRoot);
