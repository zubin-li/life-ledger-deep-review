import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

test("Today keeps the compact event strip and removes daily flexible goals", () => {
  const todayView = html.match(/<section class="view active today-desk" id="todayView">([\s\S]*?)<section class="view week-board" id="weekView">/);
  assert.ok(todayView, "Today view is missing");
  assert.match(todayView[1], /class="today-events-strip" id="todayEventsStrip"/);
  assert.match(todayView[1], /class="today-habit-list" id="todayHabitList"/);
  assert.doesNotMatch(todayView[1], /id="dayScheduleList"/);
  assert.doesNotMatch(todayView[1], /id="toggleRoutineEvents"/);
  assert.doesNotMatch(todayView[1], /id="openDayPlan"/);
  assert.doesNotMatch(todayView[1], /id="dayScheduleCount"/);
  assert.doesNotMatch(todayView[1], /class="day-schedule-summary"/);
  assert.doesNotMatch(todayView[1], /id="dayPlanViewSwitch"/);
  assert.doesNotMatch(todayView[1], /id="dayGoalsPanel"/);
  assert.doesNotMatch(todayView[1], /id="dailyGoalList"/);
  assert.doesNotMatch(todayView[1], /id="dailyGoalForm"/);
  assert.doesNotMatch(todayView[1], /calendar-embedded/);
  assert.doesNotMatch(html, /id="dayPlanDialogGoals"/);
  assert.doesNotMatch(html, /id="focusGoalSelect"/);
  assert.match(app, /function renderTodayEventsStrip\(/);
  assert.match(app, /calendarEventsForDate\(selectedPlanningDate\)/);
  assert.match(app, /event\.routine/);
  assert.doesNotMatch(app, /function setDayPlanPane\(pane\)/);
  assert.doesNotMatch(app, /const dailyGoals = dates\.flatMap/);
  assert.doesNotMatch(app, /function renderDaySchedule\(/);
});

test("the selected Day Plan date drives the complete Today workspace", () => {
  assert.match(app, /function renderToday\(\)\s*\{\s*const date = selectedPlanningDate;/);
  assert.match(app, /todayHabitRowMarkup\(/);
  assert.match(app, /setMood\(selectedPlanningDate, b\.dataset\.mood\)/);
  assert.match(app, /const date = selectedPlanningDate;\s*const log = getLog\(date\);/);
  assert.match(app, /selectedPlanningDate = isoDate\(cursor\);/);
  assert.match(css, /\.today-habit-row\.future-locked\s*\{/);
});

test("Google Calendar stays read-only and lives in Settings", () => {
  const start = html.indexOf('id="settingsPane"');
  assert.ok(start >= 0, "Settings pane is missing");
  const settings = html.slice(start, html.indexOf("</section>", html.indexOf('data-settings-panel="habits"')));
  assert.match(settings, /id="calendarConnectionButton"/);
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
  assert.match(css, /@media \(min-width: 1101px\)\s*\{\s*\.daily-planning-grid\s*\{\s*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/);
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
