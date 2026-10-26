import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_STORAGE_KEY,
  DEMO_PREVIEW_ID,
  DEMO_MEMORY_ASSETS,
  buildClearedWorkspace,
  buildDemoPhotoSchedule,
  buildDemoWorkspace,
  demoNoticeCopy,
  demoPhotosForRange,
  hasMeaningfulUserData,
  isDemoActive,
  isLocalOnlyEligible,
  relocalizeDemoWorkspace,
  resolveDismissedKey,
  resolveStorageKey,
  shouldSeedDemo,
} from "../public/demo-workspace.js";
import { demoScheduleFor } from "../public/demo-persona.js";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const index = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");
const assetRoot = fileURLToPath(new URL("../public/assets/demo-memories/", import.meta.url));

const FIXED_NOW = new Date(2026, 9, 12, 12, 0, 0);
const ACCEPT_NOW = new Date("2026-10-22T18:00:00");

function assertDemoRichness(demo, lang) {
  const today = "2026-10-22";
  const logs = Object.entries(demo.logs).filter(([k]) => k <= today);
  const notes = logs.map(([, v]) => v.note);
  assert.equal(logs.length, 90, `${lang}: 90 log days`);
  assert.equal(new Set(notes).size, 90, `${lang}: 90 unique notes`);
  assert.equal(logs.filter(([, v]) => v.moodReason).length, 90, `${lang}: mood reasons`);
  const dg = Object.keys(demo.dailyGoals);
  assert.ok(dg.length >= 97, `${lang}: daily goal days`);
  assert.equal(dg.filter(k => k > today).length, 7, `${lang}: future goal days`);
  const goalSets = dg.map(date => demo.dailyGoals[date].map(goal => goal.text).join(" | "));
  assert.ok(new Set(goalSets).size >= 70, `${lang}: varied daily goal combinations`);
  assert.equal(Object.keys(demo.reviews).length, 4, `${lang}: monthly reviews`);
  assert.ok(demo.longTermGoals.length >= 11, `${lang}: long-term goals`);
  assert.ok(Math.min(...demo.longTermGoals.map(g => g.events.length)) >= 3, `${lang}: goal events`);
  assert.ok(new Set(demo.focusSessions.map(s => s.date)).size >= 64, `${lang}: focus days`);
  const weeks = Object.keys(demo.weeklyReviews).length;
  assert.equal(new Set(Object.values(demo.weeklyReviews)).size, weeks, `${lang}: unique week reviews`);
  const weeklyCopy = [...Object.values(demo.weeklyOutputs), ...Object.values(demo.weeklyReviews)];
  assert.ok(weeklyCopy.every(text => String(text).length >= 70), `${lang}: weekly writing has substance`);
  assert.ok(weeklyCopy.every(text => !/^(第\s*\d+\s*周|Week\s+\d+|Woche\s+\d+)/i.test(String(text))), `${lang}: content does not repeat the UI week label`);
  const monthlyMinimum = lang === "zh" ? 100 : 180;
  assert.ok(Object.values(demo.reviews).every(text => String(text).length >= monthlyMinimum), `${lang}: monthly reviews are developed reflections`);
}
const starterHabits = [
  { id: "exercise", name: "Exercise", versions: [{ frequency: "daily", countsTowardDaily: true }] },
  { id: "reading", name: "Reading", versions: [{ frequency: "daily", countsTowardDaily: true }] },
  { id: "sleep2330", name: "Sleep", versions: [{ frequency: "daily", countsTowardDaily: true }] },
  { id: "hydration", name: "Hydration", versions: [{ frequency: "daily", countsTowardDaily: true }] },
  { id: "meditation", name: "Meditation", versions: [{ frequency: "daily", countsTowardDaily: true }] },
  { id: "deepwork", name: "Deep work", versions: [{ frequency: "daily", countsTowardDaily: true }] },
  { id: "language", name: "Language", versions: [{ frequency: "daily", countsTowardDaily: true }] },
  { id: "strength", name: "Strength", versions: [{ frequency: "weekly", countsTowardDaily: false, weeklyTarget: 3 }] },
];

function build(lang = "en") {
  return buildDemoWorkspace({ now: FIXED_NOW, lang, seedHabits: starterHabits });
}

test("deterministic demo output for fixed now and language", () => {
  const first = build("en");
  const second = build("en");
  assert.deepEqual(first.logs, second.logs);
  assert.deepEqual(first.focusSessions.map(s => s.id), second.focusSessions.map(s => s.id));
});

test("sample calendar varies by day and keeps locale-specific everyday life", () => {
  const dates = Array.from({ length: 60 }, (_, offset) => {
    const date = new Date(FIXED_NOW);
    date.setDate(date.getDate() - offset);
    return date.toISOString().slice(0, 10);
  });
  for (const lang of ["zh", "en", "de"]) {
    const signatures = dates.map(date => demoScheduleFor(lang, date, FIXED_NOW).map(event => event.title).join(" | "));
    assert.ok(new Set(signatures).size >= 45, `${lang}: calendar days are meaningfully varied`);
  }
  assert.match(demoScheduleFor("zh", "2026-10-12", FIXED_NOW).map(event => event.title).join(" "), /小区|快递|买菜|地铁|复盘|家里|书/);
  assert.match(demoScheduleFor("en", "2026-10-12", FIXED_NOW).map(event => event.title).join(" "), /park|train|library|reflection|groceries|family/i);
  assert.match(demoScheduleFor("de", "2026-10-12", FIXED_NOW).map(event => event.title).join(" "), /Kiez|Rad|Pfand|Bibliothek|Tagesrückblick|Familie/i);
});

test("demo history respects now, covers ~90 days, and meets content thresholds", () => {
  const demo = build("de");
  const today = "2026-10-12";
  const dates = Object.keys(demo.logs);
  assert.ok(dates.every(date => date <= today), "no future log dates");
  assert.ok(dates.some(date => date.startsWith("2026-10")), "includes current month");
  assert.ok(dates.some(date => date.startsWith("2026-09")), "includes previous month");
  assert.ok(dates.some(date => date.startsWith("2026-08")), "includes month before that");
  assert.ok(dates.length >= 45, "substantial day coverage");

  const moodDays = dates.filter(date => demo.logs[date].mood).length;
  assert.ok(moodDays >= 60, "at least 60 mood days");

  const reasons = new Set(dates.map(date => demo.logs[date].moodReason).filter(Boolean));
  assert.ok(reasons.size >= 20, "at least 20 mood reasons");

  const journals = dates.map(date => demo.logs[date].note).filter(text => String(text || "").length > 40);
  assert.ok(journals.length >= 12, "at least 12 journal entries");

  const dailyGoalDays = Object.keys(demo.dailyGoals).length;
  assert.ok(dailyGoalDays >= 5, "several daily goal days");

  const weekKeys = Object.keys(demo.weeklyGoals);
  assert.ok(weekKeys.length >= 6, "six or more weeks of weekly goals");
  assert.ok(Object.keys(demo.weeklyOutputs).length >= 6);
  assert.ok(Object.keys(demo.weeklyReviews).length >= 3);
  assert.ok(Object.keys(demo.reviews).length >= 3);
  assert.ok(demo.longTermGoals.length >= 3);
  assert.ok(demo.focusSessions.length >= 30);

  const focusMinutes = new Set(demo.focusSessions.map(session => session.actualMinutes));
  assert.ok(focusMinutes.size >= 4, "varied focus durations");

  const completionRates = ["exercise", "reading"].map(id => {
    const eligible = dates.length;
    const done = dates.filter(date => demo.logs[date]?.completed?.includes(id)).length;
    return done / eligible;
  });
  assert.ok(Math.abs(completionRates[0] - completionRates[1]) > 0.05, "habit completion varies");

  for (const date of dates) {
    const weekday = new Date(`${date}T12:00:00`).getDay();
    const completed = demo.logs[date]?.completed || [];
    if (completed.includes("strength") && ![1, 3, 6].includes(weekday)) {
      assert.fail(`strength should stay weekly-patterned on ${date}`);
    }
  }
});

test("local-only eligibility and seed gating", () => {
  assert.equal(isLocalOnlyEligible({ deploymentMode: "local", cloudBaseConfigured: false }), true);
  assert.equal(isLocalOnlyEligible({ deploymentMode: "cloudflare", cloudBaseConfigured: false }), false);
  assert.equal(isLocalOnlyEligible({ deploymentMode: "local", cloudBaseConfigured: true }), false);

  const empty = { habits: starterHabits, logs: {}, reviews: {}, weeklyGoals: {}, focusSessions: [] };
  assert.equal(shouldSeedDemo({ eligible: true, dismissed: false, storedRaw: null, state: empty }), true);
  assert.equal(shouldSeedDemo({ eligible: false, dismissed: false, storedRaw: null, state: empty }), false);
  assert.equal(shouldSeedDemo({ eligible: true, dismissed: true, storedRaw: null, state: empty }), false);
  assert.equal(shouldSeedDemo({ eligible: true, dismissed: false, storedRaw: "{}", state: empty }), false);
  assert.equal(shouldSeedDemo({
    eligible: true,
    dismissed: false,
    storedRaw: JSON.stringify({ habits: starterHabits, logs: {}, meta: { updatedAt: 0 } }),
    state: empty,
  }), false);
  assert.equal(shouldSeedDemo({
    eligible: true,
    dismissed: false,
    storedRaw: "{}",
    state: { ...empty, logs: { "2026-10-01": { completed: ["exercise"], mood: "", moodReason: "", note: "" } } },
  }), false);
});

test("preview storage key isolation and dismissal reset", () => {
  assert.equal(resolveStorageKey(null), DEFAULT_STORAGE_KEY);
  assert.equal(resolveStorageKey(DEMO_PREVIEW_ID), `life-ledger-preview-${DEMO_PREVIEW_ID}`);
  assert.notEqual(resolveStorageKey(DEMO_PREVIEW_ID), DEFAULT_STORAGE_KEY);
  assert.match(resolveDismissedKey(DEMO_PREVIEW_ID), /preview/);
});

test("clearing demo returns starter habits with empty histories", () => {
  const demo = build("en");
  assert.equal(isDemoActive(demo), true);
  const cleared = buildClearedWorkspace({ seedHabits: starterHabits, starterPackVersion: 2 });
  assert.equal(isDemoActive(cleared), false);
  assert.equal(Object.keys(cleared.logs).length, 0);
  assert.equal(cleared.habits.length, 8);
  assert.equal(cleared.focusSessions.length, 0);
});

test("demoPhotosForRange stays stable when anchored to seededAt", () => {
  const anchor = new Date(2026, 9, 12, 12, 0, 0);
  const later = new Date(2026, 11, 1, 12, 0, 0);
  const first = demoPhotosForRange("2026-08-01", "2026-10-12", anchor);
  const second = demoPhotosForRange("2026-08-01", "2026-10-12", anchor);
  assert.deepEqual(first.map(photo => photo.id), second.map(photo => photo.id));
  const shifted = demoPhotosForRange("2026-08-01", "2026-10-12", later);
  assert.notDeepEqual(first.map(photo => photo.id), shifted.map(photo => photo.id));
});

test("demo photo assets are local and files exist", () => {
  const schedule = buildDemoPhotoSchedule(FIXED_NOW);
  const photoDays = schedule.reduce((sum, day) => sum + day.assets.length, 0);
  assert.ok(photoDays >= 20 && photoDays <= 40, "three months of persona events: 20-40 demo photos");
  for (const asset of DEMO_MEMORY_ASSETS) {
    assert.ok(existsSync(`${assetRoot}${asset.file}`), `missing asset ${asset.file}`);
  }
  const photos = demoPhotosForRange("2026-08-01", "2026-10-12", FIXED_NOW);
  assert.ok(photos.length >= 12);
  assert.ok(photos.every(photo => photo.url.startsWith("./assets/demo-memories/")));
});

test("relocalization keeps demo active and changes prose", () => {
  const demo = build("en");
  const zh = relocalizeDemoWorkspace(demo, "zh");
  assert.equal(isDemoActive(zh), true);
  const sampleDate = Object.keys(demo.logs).find(date => demo.logs[date].note?.trim()) || "2026-07-29";
  assert.notEqual(zh.logs[sampleDate]?.note, demo.logs[sampleDate]?.note);
});

test("localized notice copy exists for en, zh, and de", () => {
  for (const lang of ["en", "zh", "de"]) {
    const copy = demoNoticeCopy(lang);
    assert.ok(copy.message && copy.clear && copy.confirm && copy.cleared);
  }
});

test("fictional sample stays locale-specific and free of personal career or German-study history", () => {
  const forbidden = /德语|B1|B2|German|Goethe|AI\b|LLM|analyst|数据分析师|产品分析|Datenanalyse|Produktanalyse|Eval-|评估流水线|漂移报告|SQL|pipeline/i;
  for (const lang of ["zh", "en", "de"]) {
    const demo = build(lang);
    assert.doesNotMatch(JSON.stringify(demo), forbidden, `${lang}: neutral fictional sample`);
  }
  assert.match(JSON.stringify(build("zh")), /快递|物业/);
  assert.match(JSON.stringify(build("en")), /recycling|library/i);
  assert.match(JSON.stringify(build("de")), /Bürgeramt|Altglas/);
  assert.match(app, /languageText\("于朦胧", "Alan", "Alan"\)/);
  assert.doesNotMatch(app, /Lin Zhiyao · AI data analyst|林知遥 · AI 数据分析师|KI-Datenanalystin/);
});

test("app integration wires demo photos and controls", () => {
  assert.match(app, /mergeDemoTimelinePhotos/);
  assert.match(app, /syncDemoCalendarPhotos/);
  assert.match(app, /demoPhotoAnchorDate/);
  assert.match(app, /demoPhotosForRange\(from, to, demoPhotoAnchorDate\(\)\)/);
  assert.match(app, /function renderCalendar\(\)[\s\S]*syncDemoCalendarPhotos\(cursor\);[\s\S]*calendarPhotosByDate\.get/);
  assert.match(app, /demoWasActive[\s\S]*mergeBackupData\(demoWasActive \? cleanStarterWorkspaceBase\(\) : state/);
  assert.match(app, /if \(demoWasActive\)[\s\S]*dismissDemoMetadataAfterRestore\(\)/);
  assert.match(app, /clearDemoWorkspace/);
  assert.match(app, /dismissDemoMetadataAfterRestore/);
  assert.match(app, /life-ledger-preview-demo-showcase-v1/);
  assert.match(index, /id="demoWorkspaceNotice"/);
  assert.match(index, /id="clearDemoWorkspace"/);
  assert.match(index, /demo-workspace\.js/);
  assert.match(css, /\.demo-workspace-notice/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.demo-workspace-actions/);
});

test("round-12 demo richness thresholds for zh and en at 2026-10-22", () => {
  for (const lang of ["zh", "en"]) {
    const demo = buildDemoWorkspace({ now: ACCEPT_NOW, lang, seedHabits: starterHabits });
    assertDemoRichness(demo, lang);
  }
});

test("hasMeaningfulUserData detects non-empty workspace", () => {
  const base = { logs: {}, reviews: {}, weeklyGoals: {}, weeklyOutputs: {}, weeklyReviews: {}, dailyGoals: {}, longTermGoals: [], focusSessions: [] };
  assert.equal(hasMeaningfulUserData(base), false);
  assert.equal(hasMeaningfulUserData({ ...base, weeklyGoals: { "2026-W41": [{ id: "g", text: "x", done: false }] } }), true);
});
