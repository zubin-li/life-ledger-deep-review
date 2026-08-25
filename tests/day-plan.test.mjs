import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

test("schedule and flexible goals share the existing Day Plan card", () => {
  const card = html.match(/<article class="daily-goals-card" data-plan="selected-day">([\s\S]*?)<\/article>/);
  assert.ok(card, "Day Plan card is missing");
  assert.match(card[1], /id="dayScheduleList"/);
  assert.match(card[1], /id="dailyGoalList"/);
  assert.match(card[1], /id="toggleRoutineEvents"/);
  assert.match(card[1], /id="openDayPlan"/);
  assert.match(app, /calendarPreviewEvents\(selectedPlanningDate\)/);
  assert.match(app, /event\.routine/);
});

test("weekly goals and long-term goals use progressive disclosure in one card", () => {
  assert.match(html, /id="goalHorizonSwitch"/);
  assert.match(html, /id="weeklyGoalsPane"/);
  assert.match(html, /id="longTermGoalsPane" hidden/);
  assert.match(app, /longTermGoals:\s*\[\]/);
  assert.match(app, /function applyGoalHorizon\(\)/);
  assert.match(app, /function saveLongTermGoal\(event\)/);
});

test("mobile Day Plan stacks schedule and goals without horizontal scrolling", () => {
  const mobile = css.slice(css.lastIndexOf("/* Day Plan prototype"));
  assert.match(mobile, /@media \(max-width: 760px\)[\s\S]*?\.day-plan-columns\s*\{\s*grid-template-columns:\s*1fr;/);
  assert.match(mobile, /\.day-flexible-goals\s*\{[^}]*border-left:\s*0;[^}]*border-top:/);
  assert.match(mobile, /\.day-plan-dialog-body\s*\{\s*grid-template-columns:\s*1fr;/);
  assert.doesNotMatch(mobile, /overflow-x:\s*(auto|scroll)/);
});

test("long-term goals are included in backup and restore state", () => {
  assert.match(app, /longTermGoals:\s*cloneData\(state\.longTermGoals \|\| \[\]\)/);
  assert.match(app, /invalid-longTermGoals/);
  assert.match(app, /longTermGoals:\s*cloneData\(payload\.longTermGoals \|\| \[\]\)/);
});
