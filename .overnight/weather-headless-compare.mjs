import { webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const port = 5299;

function validForecast(data) {
  return Boolean(data?.current?.time && Array.isArray(data.hourly?.time) && data.hourly.time.length > 2);
}

function sampleForecast() {
  const day = "2026-11-03";
  const hours = Array.from({ length: 24 }, (_, i) => `${day}T${String(i).padStart(2, "0")}:00`);
  return {
    current: { time: `${day}T14:00`, temperature_2m: 12, weather_code: 1 },
    hourly: {
      time: hours,
      temperature_2m: hours.map((_, i) => 10 + i * 0.1),
      precipitation_probability: hours.map(() => 10),
      precipitation: hours.map(() => 0),
      snowfall: hours.map(() => 0),
      weather_code: hours.map(() => 1),
    },
  };
}

const berlin = { name: "Berlin", latitude: 52.52, longitude: 13.405 };
const cacheKey = `${berlin.latitude},${berlin.longitude},31-16`;
const cachePayload = { city: cacheKey, stamp: Date.now(), data: sampleForecast() };

async function readWeather(page) {
  return page.evaluate(() => {
    const card = document.querySelector('[data-module="weather"]');
    const detail = document.querySelector("#weatherDetail");
    const empty = document.querySelector(".weather-empty");
    const temp = detail?.querySelector(".weather-temp");
    return {
      isEmptyClass: card?.classList.contains("is-empty") ?? null,
      emptyHidden: empty ? empty.hidden : null,
      detailChildCount: detail?.childElementCount ?? 0,
      tempText: temp?.textContent?.trim() || "",
      statusText: document.querySelector("#weatherStatus")?.textContent?.trim() || "",
      plotChildCount: document.querySelector("#weatherPlot")?.childElementCount ?? 0,
    };
  });
}

const previewSlug = "demo-showcase-v1";
const storageSuffix = `-preview-${previewSlug}`;

async function probe(publicRoot, label) {
  const base = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=${previewSlug}`;
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: publicRoot,
    stdio: "ignore",
  });
  await new Promise(r => setTimeout(r, 450));
  try {
  const browser = await webkit.launch({ headless: true });

  const coldCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await coldCtx.addInitScript(suffix => {
    localStorage.removeItem(`life-ledger-weather-city${suffix}`);
    localStorage.removeItem(`life-ledger-weather-cache${suffix}`);
  }, storageSuffix);
  const coldPage = await coldCtx.newPage();
  await coldPage.goto(base, { waitUntil: "networkidle" });
  await coldPage.waitForSelector("#todayView.active .tw-weather", { timeout: 20000 });
  await coldPage.waitForTimeout(1200);
  const coldStart = await readWeather(coldPage);
  await coldCtx.close();

  const cacheCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await cacheCtx.addInitScript(({ berlin, cachePayload, suffix }) => {
    localStorage.setItem(`life-ledger-weather-city${suffix}`, JSON.stringify(berlin));
    localStorage.setItem(`life-ledger-weather-cache${suffix}`, JSON.stringify(cachePayload));
  }, { berlin, cachePayload, suffix: storageSuffix });
  const cachePage = await cacheCtx.newPage();
  await cachePage.goto(base, { waitUntil: "networkidle" });
  await cachePage.waitForSelector("#todayView.active .tw-weather", { timeout: 20000 });
  await cachePage.waitForTimeout(1200);
  const cached = await readWeather(cachePage);
  await cacheCtx.close();

  await browser.close();
  return {
    label,
    coldStart,
    cached,
    cacheFormatValid: validForecast(cachePayload.data),
  };
  } finally {
    server.kill("SIGTERM");
  }
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
const outPath = join(here, "weather-headless-compare.json");
writeFileSync(outPath, `${JSON.stringify(results, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ outPath, results }, null, 2));
