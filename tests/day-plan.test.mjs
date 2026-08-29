import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

test("Day Plan keeps the schedule and removes daily flexible goals", () => {
  const card = html.match(/<article class="daily-goals-card" data-plan="selected-day">([\s\S]*?)<\/article>/);
  assert.ok(card, "Day Plan card is missing");
  assert.match(card[1], /id="dayScheduleList"/);
  assert.match(card[1], /id="toggleRoutineEvents"/);
  assert.match(card[1], /id="openDayPlan"/);
  assert.match(card[1], /id="dayScheduleCount"/);
  assert.doesNotMatch(card[1], /id="dayPlanViewSwitch"/);
  assert.doesNotMatch(card[1], /id="dayGoalsPanel"/);
  assert.doesNotMatch(card[1], /id="dailyGoalList"/);
  assert.doesNotMatch(card[1], /id="dailyGoalForm"/);
  assert.doesNotMatch(html, /id="dayPlanDialogGoals"/);
  assert.doesNotMatch(html, /id="focusGoalSelect"/);
  assert.match(app, /calendarEventsForDate\(selectedPlanningDate\)/);
  assert.match(app, /event\.routine/);
  assert.doesNotMatch(app, /function setDayPlanPane\(pane\)/);
  assert.doesNotMatch(app, /const dailyGoals = dates\.flatMap/);
});

test("Google Calendar stays read-only and progressively disclosed inside Day Plan", () => {
  assert.match(cardMarkup(), /id="calendarConnectionButton"/);
  assert.match(html, /id="calendarSettingsDialog"/);
  assert.match(html, /id="calendarHideRecurring"[^>]*checked/);
  assert.match(app, /calendarApi\("calendars"\)/);
  assert.match(app, /calendarApi\(`events\?\$\{query\}`\)/);
  assert.match(app, /method: "DELETE"/);
  assert.doesNotMatch(app, /calendarApi\("event"/);
  assert.match(app, /day-calendar-status/);
});

test("calendar settings connect two accounts without adding another page", () => {
  assert.match(html, /id="calendarAddAccountButton"/);
  assert.match(html, /id="calendarAccountsList"/);
  assert.match(app, /googleCalendar\.accounts\.length >= 2/);
  assert.match(app, /disconnect\?connectionId=/);
  assert.match(app, /body: JSON\.stringify\(\{ accounts, hideRecurring:/);
  assert.doesNotMatch(html, /id="calendarDisconnectButton"/);
});

function cardMarkup() {
  return html.match(/<article class="daily-goals-card" data-plan="selected-day">([\s\S]*?)<\/article>/)?.[1] || "";
}

test("weekly goals and long-term goals use progressive disclosure in one card", () => {
  assert.match(html, /id="goalHorizonSwitch"/);
  assert.match(html, /id="weeklyGoalsPane"/);
  assert.match(html, /id="longTermGoalsPane" hidden/);
  assert.match(app, /longTermGoals:\s*\[\]/);
  assert.match(app, /function applyGoalHorizon\(\)/);
  assert.match(app, /function saveLongTermGoal\(event\)/);
});

test("mobile Day Plan keeps one responsive schedule without horizontal scrolling", () => {
  const mobile = css.slice(css.lastIndexOf("/* Day Plan:"));
  assert.match(css, /\.day-schedule-summary\s*\{[^}]*grid-template-columns:\s*18px minmax\(0, 1fr\) auto;/);
  assert.match(mobile, /\.day-plan-dialog-body\s*\{\s*grid-template-columns:\s*1fr;/);
  assert.doesNotMatch(mobile, /overflow-x:\s*(auto|scroll)/);
});

test("focus and month calendar reflow instead of clipping on narrow screens", () => {
  assert.match(css, /\.focus-overview-card\s*\{[\s\S]*?grid-template-columns:\s*repeat\(auto-fit, minmax\(min\(100%, 360px\), 1fr\)\);/);
  const compactCalendar = css.slice(css.lastIndexOf("/* Compact month view"));
  assert.match(compactCalendar, /@media \(min-width: 761px\) and \(max-width: 1100px\)[\s\S]*?\.calendar-card\s*\{[^}]*aspect-ratio:\s*1;/);
  assert.match(compactCalendar, /\.calendar-card\s*\{[^}]*aspect-ratio:\s*1;/);
  assert.match(compactCalendar, /\.calendar-grid\s*\{[^}]*grid-template-rows:\s*repeat\(6, minmax\(0, 1fr\)\);/);
  assert.match(compactCalendar, /\.calendar-day\s*\{[^}]*min-height:\s*0;/);
});

test("long-term goals are included in backup and restore state", () => {
  assert.match(app, /longTermGoals:\s*cloneData\(state\.longTermGoals \|\| \[\]\)/);
  assert.match(app, /invalid-longTermGoals/);
  assert.match(app, /longTermGoals:\s*cloneData\(payload\.longTermGoals \|\| \[\]\)/);
});
