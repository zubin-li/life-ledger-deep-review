import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5294;
const base = `http://127.0.0.1:${port}/index.html?mode=local`;

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
      cwd: join(repoRoot, "public"),
      stdio: "ignore",
    });
    proc.on("error", reject);
    setTimeout(() => resolve(proc), 400);
  });
}

test(
  "Today card library onboarding dismisses and opens library",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "zh");
        localStorage.removeItem("life-ledger-today-cards-onboarding-dismissed");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await page.click('.nav-item[data-view="today"]');
      await page.waitForSelector("#tcOnboardHint:not([hidden])", { timeout: 15000 });
      await page.locator("#tcOnboardHint [data-tc-onboard-library]").click();
      await page.waitForSelector("#tcLibrary[open]", { timeout: 10000 });
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.getElementById("tcOnboardHint"), null, { timeout: 3000 });
      const stored = await page.evaluate(() =>
        localStorage.getItem("life-ledger-today-cards-onboarding-dismissed"),
      );
      assert.equal(stored, "1");
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "Today card onboarding hidden after dismiss button",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "de");
        if (!sessionStorage.getItem("tc-onboard-test-seeded")) {
          sessionStorage.setItem("tc-onboard-test-seeded", "1");
          localStorage.removeItem("life-ledger-today-cards-onboarding-dismissed");
        }
      });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await page.click('.nav-item[data-view="today"]');
      await page.waitForSelector("#tcOnboardHint:not([hidden])", { timeout: 15000 });
      await page.evaluate(() => document.querySelector("#tcOnboardHint [data-tc-onboard-dismiss]")?.click());
      await page.waitForFunction(() => !document.getElementById("tcOnboardHint"), null, { timeout: 3000 });
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.click('.nav-item[data-view="today"]');
      await page.waitForTimeout(500);
      assert.equal(await page.locator("#tcOnboardHint").count(), 0);
      const stored = await page.evaluate(() =>
        localStorage.getItem("life-ledger-today-cards-onboarding-dismissed"),
      );
      assert.equal(stored, "1");
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "Today card onboarding hint is opaque at mobile width (C1)",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "zh");
        localStorage.removeItem("life-ledger-today-cards-onboarding-dismissed");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await page.click('.nav-item[data-view="today"]');
      await page.waitForSelector("#tcOnboardHint:not([hidden])", { timeout: 15000 });
      const styles = await page.evaluate(() => {
        const el = document.getElementById("tcOnboardHint");
        const cs = getComputedStyle(el);
        const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/);
        let alpha = 1;
        if (m) {
          const parts = m[1].split(",").map(s => s.trim());
          if (parts.length === 4) alpha = Number.parseFloat(parts[3]);
        }
        return {
          opacity: cs.opacity,
          backgroundColor: cs.backgroundColor,
          alpha,
          zIndex: cs.zIndex,
        };
      });
      assert.equal(styles.opacity, "1");
      assert.ok(styles.alpha >= 0.99, `onboard background alpha ${styles.alpha}`);
      assert.ok(Number.parseInt(styles.zIndex, 10) >= 12000);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "Today card library dialog uses opaque float surface (C1)",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "zh");
        localStorage.removeItem("life-ledger-today-cards-onboarding-dismissed");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await page.click('.nav-item[data-view="today"]');
      await page.waitForSelector("#tcOnboardHint:not([hidden])", { timeout: 15000 });
      await page.locator("#tcOnboardHint [data-tc-onboard-library]").click();
      await page.waitForSelector("#tcLibrary[open]", { timeout: 10000 });
      const styles = await page.evaluate(() => {
        const el = document.getElementById("tcLibrary");
        const cs = getComputedStyle(el);
        const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/);
        let alpha = 1;
        if (m) {
          const parts = m[1].split(",").map(s => s.trim());
          if (parts.length === 4) alpha = Number.parseFloat(parts[3]);
        }
        return { alpha, backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter };
      });
      assert.ok(styles.alpha >= 0.99, `tc-library dialog alpha ${styles.alpha}`);
      assert.equal(styles.backdropFilter, "none");
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "Today card edit toggle uses opaque float surface (C1)",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "zh");
        localStorage.setItem("life-ledger-today-cards-onboarding-dismissed", "1");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
      });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await page.click('.nav-item[data-view="today"]');
      await page.waitForSelector(".tc-edit-toggle", { state: "visible", timeout: 15000 });
      const styles = await page.evaluate(() => {
        const el = document.querySelector(".tc-edit-toggle");
        const cs = getComputedStyle(el);
        const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/);
        let alpha = 1;
        if (m) {
          const parts = m[1].split(",").map(s => s.trim());
          if (parts.length === 4) alpha = Number.parseFloat(parts[3]);
        }
        return { alpha, backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter };
      });
      assert.ok(styles.alpha >= 0.99, `edit toggle alpha ${styles.alpha}`);
      assert.equal(styles.backdropFilter, "none");
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
