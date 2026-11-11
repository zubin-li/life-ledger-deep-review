import { chromium } from "playwright";

const base = process.env.BASE_URL || "http://127.0.0.1:8765";
const url = `${base}/?mode=local&lang=zh&preview=local`;

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

await page.goto(url, { waitUntil: "networkidle" });

const noticeVisible = await page.evaluate(() => {
  const el = document.querySelector("#demoWorkspaceNotice");
  return Boolean(el && !el.hidden);
});

const moodDays = await page.evaluate(() => {
  const raw = localStorage.getItem("life-ledger-v1");
  if (!raw) return 0;
  try {
    const state = JSON.parse(raw);
    return Object.values(state.logs || {}).filter(log => log?.mood).length;
  } catch {
    return 0;
  }
});

await page.evaluate(() => {
  window.confirm = () => true;
});
await page.click("#clearDemoWorkspace");
await page.reload({ waitUntil: "networkidle" });

const after = await page.evaluate(() => {
  const notice = document.querySelector("#demoWorkspaceNotice");
  const raw = localStorage.getItem("life-ledger-v1");
  let logDays = 0;
  try {
    logDays = Object.keys(JSON.parse(raw || "{}").logs || {}).length;
  } catch {
    logDays = -1;
  }
  return {
    noticeHidden: Boolean(notice?.hidden),
    logDays,
  };
});

await browser.close();

console.log(JSON.stringify({
  noticeVisible,
  moodDays,
  afterClear: after,
}, null, 2));
