import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5299;
const base = `http://127.0.0.1:${port}/index.html?mode=cloudflare&local-preview=demo-showcase-v1`;
const SYNC_CONFLICT_KEY = "life-ledger-sync-conflict-v1";
const PREVIEW_STORAGE_KEY = "life-ledger-preview-demo-showcase-v1";

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

async function ensureCloudPayloadHasLedger(page) {
  return page.evaluate(async previewKey => {
    const get = await fetch("/api/state", { credentials: "same-origin" });
    if (!get.ok) throw new Error(`GET /api/state ${get.status}`);
    const body = await get.json();
    const st = body.payload;
    if ((st.ledger?.transactions?.length ?? 0) > 0) {
      localStorage.setItem(previewKey, JSON.stringify(st));
      return st.ledger.transactions.length;
    }
    const L = globalThis.LifeLedgerLedger;
    if (!L?.buildDemoSample) throw new Error("LifeLedgerLedger unavailable");
    st.ledger = L.buildDemoSample({ now: new Date(), lang: "de" });
    st.meta = { ...(st.meta || {}), updatedAt: Date.now() };
    const put = await fetch("/api/state", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ payload: st, baseRevision: body.revision }),
    });
    if (!put.ok) throw new Error(`PUT /api/state ${put.status}`);
    localStorage.setItem(previewKey, JSON.stringify(st));
    return st.ledger.transactions.length;
  }, PREVIEW_STORAGE_KEY);
}

async function advanceRemoteRevision(page) {
  return page.evaluate(async () => {
    const res = await fetch("/api/state", { credentials: "same-origin" });
    if (!res.ok) throw new Error(`GET /api/state ${res.status}`);
    const body = await res.json();
    const payload = body.payload;
    payload.meta = { ...(payload.meta || {}), updatedAt: Date.now() + 60_000 };
    const put = await fetch("/api/state", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ payload, baseRevision: body.revision }),
    });
    if (!put.ok) throw new Error(`PUT /api/state ${put.status}`);
    const next = await put.json();
    return { before: body.revision, after: next.revision };
  });
}

test(
  "fakecloud stale PUT surfaces conflict recovery with Money merge preview",
  { skip: !hasPlaywright, timeout: 240_000 },
  async () => {
    const fakecloud = startFakecloud();
    try {
      await waitForHttp(base);
      const { webkit } = await import(join(playwrightRoot, "index.mjs"));
      const browser = await webkit.launch({ headless: true });
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      try {
        await page.addInitScript(() => {
          localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
          localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
        });
        await page.goto(base, { waitUntil: "networkidle", timeout: 90_000 });
        await page.waitForSelector(".tc-grid", { timeout: 45_000 });
        await page.waitForFunction(() => document.querySelector("#saveMode")?.classList.contains("cloud"), {
          timeout: 90_000,
        });

        const ledgerTx = await ensureCloudPayloadHasLedger(page);
        assert.ok(ledgerTx > 0, "cloud payload should include ledger transactions");
        await page.reload({ waitUntil: "networkidle", timeout: 90_000 });
        await page.waitForSelector(".tc-grid", { timeout: 45_000 });
        await page.waitForFunction(() => document.querySelector("#saveMode")?.classList.contains("cloud"), {
          timeout: 90_000,
        });

        const bumped = await advanceRemoteRevision(page);
        assert.ok(bumped.after > bumped.before, "remote revision should advance");

        await page.locator("#todayHabits .habit-card").first().click();
        await page.waitForTimeout(1200);

        const conflictRecord = await page.evaluate(key => localStorage.getItem(key), SYNC_CONFLICT_KEY);
        assert.ok(conflictRecord, "expected sync conflict record in localStorage");

        await page.click("#settingsButton");
        await page.waitForSelector("#settingsDialog[open]", { timeout: 10_000 });
        await page.locator("#settingsBackup").scrollIntoViewIfNeeded();
        await page.click("#settingsBackup");
        await page.waitForSelector("#exportDialog[open]", { timeout: 10_000 });
        await page.click("#backupImportTab");
        await page.waitForSelector("#backupImportPanel:not([hidden])", { timeout: 5000 });
        const rowVisible = await page.evaluate(() => {
          const row = document.getElementById("conflictRecoveryRow");
          return Boolean(row && !row.hidden);
        });
        assert.equal(rowVisible, true);
        await page.waitForSelector("#conflictLedgerPreview .conflict-ledger-preview-kicker", { timeout: 8000 });

        page.once("dialog", dialog => dialog.accept());
        await page.click("#dismissConflictRecovery");
        await page.waitForTimeout(400);
        const cleared = await page.evaluate(key => !localStorage.getItem(key), SYNC_CONFLICT_KEY);
        assert.equal(cleared, true);
        const rowHidden = await page.evaluate(() => {
          const row = document.getElementById("conflictRecoveryRow");
          return !row || row.hidden;
        });
        assert.equal(rowHidden, true);
      } finally {
        await context.close();
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
