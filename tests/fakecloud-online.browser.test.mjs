import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5298;
const base = `http://127.0.0.1:${port}/index.html?mode=cloudflare`;

async function waitForHttp(url, attempts = 120) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      await execFileAsync("curl", ["-sf", "-o", "/dev/null", url]);
      return;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error(`Server did not respond: ${url}`);
}

function startFakecloud() {
  return spawn("bash", [join(repoRoot, ".overnight/fakecloud.sh"), String(port)], {
    cwd: repoRoot,
    stdio: "ignore",
    detached: true,
  });
}

test(
  "fakecloud online mode loads and conflict recovery row stays hidden after first sync",
  { skip: !hasPlaywright, timeout: 180_000 },
  async () => {
    const fakecloud = startFakecloud();
    try {
      await waitForHttp(base);
      const { webkit } = await import(join(playwrightRoot, "index.mjs"));
      const browser = await webkit.launch({ headless: true });
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      try {
        await page.addInitScript(() => {
          localStorage.clear();
          localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
          localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
        });
        await page.goto(base, { waitUntil: "networkidle", timeout: 60_000 });
        await page.waitForSelector(".tc-grid", { timeout: 30_000 });
        await page.waitForFunction(() => document.querySelector("#saveMode")?.classList.contains("cloud"), {
          timeout: 90_000,
        });
        await page.waitForTimeout(500);
        const conflictHidden = await page.evaluate(() => {
          const row = document.getElementById("conflictRecoveryRow");
          return !row || row.hidden || getComputedStyle(row).display === "none";
        });
        assert.equal(conflictHidden, true);
        const revision = await page.evaluate(async () => {
          const res = await fetch("/api/state", { credentials: "same-origin" });
          if (res.status === 404) return 0;
          const body = await res.json();
          return Number(body.revision) || 0;
        });
        assert.ok(revision >= 0);
      } finally {
        await browser.close();
      }
    } finally {
      try {
        process.kill(-fakecloud.pid, "SIGTERM");
      } catch {
        fakecloud.kill("SIGTERM");
      }
    }
  },
);
