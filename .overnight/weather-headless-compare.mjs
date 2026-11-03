import { webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const port = 5298;

async function probe(publicRoot, label) {
  const base = `http://127.0.0.1:${port}/index.html?mode=local`;
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: publicRoot,
    stdio: "ignore",
  });
  await new Promise(r => setTimeout(r, 400));
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  const noCity = await page.evaluate(() => {
    const card = document.querySelector('.tc-card[data-id="weather"], .tc-card:has(.tw-weather)');
    const w = document.querySelector(".tw-weather");
    const empty = document.querySelector(".weather-empty");
    const temp = document.querySelector(".weather-temp");
    return {
      hasWeather: Boolean(w),
      emptyHidden: empty ? empty.hidden : null,
      tempText: temp?.textContent?.trim() || "",
      isEmptyClass: card?.classList.contains("is-empty") ?? null,
    };
  });
  await context.addInitScript(() => {
    localStorage.setItem("life-ledger-weather-city", JSON.stringify({ name: "Berlin", latitude: 52.52, longitude: 13.405 }));
    localStorage.setItem("life-ledger-weather-cache", JSON.stringify({
      fetchedAt: Date.now(),
      current: { temperature: 12, weathercode: 1 },
      daily: { time: [], temperature_2m_max: [], temperature_2m_min: [] },
    }));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const withCache = await page.evaluate(() => {
    const empty = document.querySelector(".weather-empty");
    const temp = document.querySelector(".weather-temp");
    return { emptyHidden: empty ? empty.hidden : null, tempText: temp?.textContent?.trim() || "" };
  });
  await browser.close();
  server.kill("SIGTERM");
  return { label, noCity, withCache };
}

const head = join(here, "..", "public");
const baseTag = join(here, "base", "public");
const results = [];
results.push(await probe(head, "HEAD"));
try {
  results.push(await probe(baseTag, "v2.0.10"));
} catch (e) {
  results.push({ label: "v2.0.10", error: String(e) });
}
console.log(JSON.stringify(results, null, 2));
