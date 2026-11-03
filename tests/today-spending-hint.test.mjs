import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const widgets = readFileSync(new URL("../public/today-widgets.js", import.meta.url), "utf8");

test("Today spending hint hides once the ledger has any transaction", () => {
  assert.match(widgets, /ledgerHasEntries\s*=\s*Boolean\(ledger\?\.transactions\?\.length\)/);
  assert.match(widgets, /hint\.hidden\s*=\s*Boolean\(todayMinor\)\s*\|\|\s*ledgerHasEntries/);
});

test("Today spending note uses quiet copy when ledger has history but today is zero", () => {
  assert.match(widgets, /spendingEmptyQuiet/);
  assert.match(widgets, /ledgerHasEntries\s*\?\s*t\("spendingEmptyQuiet"\)\s*:\s*t\("spendingEmpty"\)/);
});

test("ledgerHasEntries is declared before spending note reads it", () => {
  const decl = widgets.indexOf("const ledgerHasEntries = Boolean(ledger?.transactions?.length)");
  const note = widgets.indexOf('t("spendingEmptyQuiet")');
  assert.ok(decl > 0 && note > decl, "avoid temporal dead zone in spending()");
});

test("Today spending card shows localized mood pill when mood is logged", () => {
  assert.match(widgets, /tw-spend-mood-pill/);
  assert.match(widgets, /spendingMoodLabel/);
  assert.match(widgets, /moodPill\.dataset\.mood = dayMood/);
  assert.match(widgets, /t\("moodGood"\)/);
});

test("Today spending mood pill opens Review mood scatter", () => {
  assert.match(widgets, /switchToView\("review"\)/);
  assert.match(widgets, /review-scatter-mood/);
  assert.match(widgets, /spendingMoodReview/);
});

test("Today spending recurring pill uses pending templates for current month", () => {
  assert.match(widgets, /tw-spend-recurring-pill/);
  assert.match(widgets, /recurringPendingForMonth/);
  assert.match(widgets, /spendingRecurringOne/);
  assert.match(widgets, /switchToView\("ledger"\)/);
});

test("Today spending card shows top category chip when today has expenses", () => {
  assert.match(widgets, /tw-spend-top-cat/);
  assert.match(widgets, /spendingTodayDetail/);
  assert.match(widgets, /spendingTodayCountMany/);
});

test("Today spending card compares today vs yesterday when ledger has history", () => {
  assert.match(widgets, /tw-spend-compare/);
  assert.match(widgets, /alignedDaySpendCompare/);
  assert.match(widgets, /spendingMoreDay/);
});
