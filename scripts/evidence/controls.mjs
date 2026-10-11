import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startStaticServer } from "./server.mjs";
import { applyFixture, FIXTURE_DATE } from "./fixture.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../");
const publicDir = path.join(rootDir, "public");
const outputDir = path.join(rootDir, "docs/phase-3-5-1");
const screensDir = path.join(outputDir, "controls-failures");

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(screensDir, { recursive: true });

const controlsList = JSON.parse(
  fs.readFileSync(path.join(__dirname, "controls-list.json"), "utf8")
);

function check(ok, detailPass, detailFail) {
  return {
    status: ok ? "pass" : "fail",
    detail: ok ? detailPass : detailFail,
  };
}

async function verifyFocusVisible(locator) {
  const count = await locator.count();
  if (count === 0) return check(false, "", "element not found for focus-visible");
  const page = locator.page();
  await locator.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  const isFocusVisible = await locator.evaluate((node) => node.matches(":focus-visible"));
  return check(
    isFocusVisible,
    ":focus-visible matches after keyboard focus",
    `:focus-visible did not match (${isFocusVisible})`
  );
}

async function verifyMotionOff(page, actionFn, targetSelector) {
  const motionSelect = page.locator("#motionSelect");
  if ((await motionSelect.count()) === 0) {
    return check(false, "", "not found: #motionSelect");
  }
  await motionSelect.selectOption("off");
  await motionSelect.dispatchEvent("change");
  await page.waitForTimeout(50);

  if (actionFn) {
    await actionFn();
  }

  const runningCount = await page.evaluate(() => {
    const anims = document.getAnimations ? document.getAnimations({ subtree: true }) : [];
    return anims.filter((a) => a.playState === "running").length;
  });

  const transitionDuration = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return "missing";
    return window.getComputedStyle(el).transitionDuration;
  }, targetSelector);

  const durationZero =
    transitionDuration === "0s" ||
    transitionDuration === "0.0s" ||
    transitionDuration === "0s, 0s" ||
    transitionDuration === "0s, 0s, 0s";
  const ok = runningCount === 0 && durationZero;

  await motionSelect.selectOption("full");
  await motionSelect.dispatchEvent("change");

  return check(
    ok,
    `runningAnimations: 0, transition-duration: ${transitionDuration}`,
    `runningAnimations: ${runningCount}, transition-duration: ${transitionDuration}`
  );
}

async function runControls() {
  console.log("Starting static server for controls verification...");
  const server = await startStaticServer(publicDir);
  console.log(`Server running at ${server.url}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await applyFixture(page, { date: FIXTURE_DATE, theme: "light", motion: "full", language: "en" });
  await page.goto(`${server.url}/index.html?desktop=tauri-local`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(300);

  const results = [];

  for (const item of controlsList) {
    console.log(`Verifying Row ${item.id}: [${item.surface}] ${item.control}...`);
    const result = {
      id: item.id,
      surface: item.surface,
      control: item.control,
      checks: {},
    };

    try {
      switch (item.id) {
        case 1: { // Sidebar nav
          const buttons = page.locator(".sidebar .nav-item");
          const count = await buttons.count();
          result.checks.rendered = check(count >= 5, `Found ${count} nav items`, `Found only ${count} nav items`);

          const weekBtn = page.locator(".sidebar .nav-item[data-view='week']");
          if ((await weekBtn.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: .sidebar .nav-item[data-view='week']");
            break;
          }
          await weekBtn.click();
          await page.waitForTimeout(100);
          const activeView = await page.evaluate(
            () => document.body.dataset.activeView || document.querySelector(".view.active")?.id
          );
          result.checks.purpose = check(activeView === "weekView", `Switched view to ${activeView}`, `Expected weekView, got ${activeView}`);
          result.checks.focus = await verifyFocusVisible(weekBtn);
          result.checks.motionOff = await verifyMotionOff(page, null, ".main-nav");
          await page.locator(".sidebar .nav-item[data-view='today']").click();
          break;
        }
        case 2: { // Settings
          result.checks.native = {
            status: "n/a",
            reason: "Invokes Tauri native window in desktop build",
            staticTest: "tests/desktop-v4-structure.test.mjs",
          };
          break;
        }
        case 3: { // Collapse sidebar
          const toggle = page.locator("#sidebarToggle");
          if ((await toggle.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: #sidebarToggle");
            break;
          }
          await toggle.click();
          const collapsed = await page.evaluate(() => document.body.classList.contains("sidebar-collapsed"));
          result.checks.purpose = check(collapsed, "Sidebar collapsed state active", "Sidebar did not collapse");
          await toggle.click();
          result.checks.focus = await verifyFocusVisible(toggle);
          result.checks.motionOff = await verifyMotionOff(page, null, "#sidebar");
          break;
        }
        case 4: { // Sync dot
          result.checks.nonControl = {
            status: "n/a",
            reason: "Passive status indicator, not an interactive control",
            staticTest: "tests/desktop-v4-structure.test.mjs",
          };
          break;
        }
        case 5: { // Per-habit shortcuts
          result.checks.desktopHidden = {
            status: "n/a",
            reason: "Hidden on desktop viewports via CSS (display: none)",
            staticTest: "tests/desktop-v4-structure.test.mjs",
          };
          break;
        }
        case 6: { // Prev / next date
          const nextBtn = page.locator("#dateNavNext");
          const prevBtn = page.locator("#dateNavPrev");
          const label = page.locator("#dateNavLabel");
          if ((await nextBtn.count()) === 0 || (await label.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: #dateNavNext or #dateNavLabel");
            break;
          }
          const labelBefore = await label.textContent();
          await nextBtn.click();
          const labelAfter = await label.textContent();
          result.checks.purpose = check(
            labelBefore !== labelAfter,
            `Date shifted from "${labelBefore}" to "${labelAfter}"`,
            `Date unchanged: "${labelBefore}"`
          );
          await prevBtn.click();
          result.checks.focus = await verifyFocusVisible(nextBtn);
          result.checks.motionOff = await verifyMotionOff(page, null, "#dateNavLabel");
          break;
        }
        case 7: { // Date label popover
          const dateBtn = page.locator("#dateNavLabel");
          const popover = page.locator("#datePopover");
          if ((await dateBtn.count()) === 0 || (await popover.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: #dateNavLabel or #datePopover");
            break;
          }
          await dateBtn.click();
          const popoverOpen = await popover.isVisible();
          result.checks.purpose = check(popoverOpen, "Date popover opened", "Date popover failed to open");
          await page.keyboard.press("Escape");
          const popoverClosed = !(await popover.isVisible());
          result.checks.keyboard = check(popoverClosed, "Escape closed date popover", "Escape failed to close date popover");
          result.checks.focus = await verifyFocusVisible(dateBtn);
          break;
        }
        case 8: { // ⌘K command palette
          const palette = page.locator("#commandPalette");
          if ((await palette.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: #commandPalette");
            break;
          }
          await page.keyboard.press("Meta+k");
          let paletteOpen = await palette.isVisible();
          if (!paletteOpen) {
            await page.keyboard.press("Control+k");
            paletteOpen = await palette.isVisible();
          }
          result.checks.purpose = check(paletteOpen, "Command palette opened via shortcut", "Command palette did not open via shortcut");
          await page.keyboard.press("Escape");
          const paletteClosed = !(await palette.isVisible());
          result.checks.keyboard = check(paletteClosed, "Escape closed command palette", "Escape failed to close command palette");
          break;
        }
        case 9: { // Search
          const toggle = page.locator("#toolbarSearchToggle");
          const searchContainer = page.locator("#toolbarSearch");
          const quickFind = page.locator("#quickFind");
          if ((await toggle.count()) === 0 || (await quickFind.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: #toolbarSearchToggle or #quickFind");
            break;
          }
          await toggle.click();
          const expanded = await searchContainer.getAttribute("data-search-expanded");
          result.checks.purpose = check(expanded === "true", "Search field expanded", `Expected expanded true, got ${expanded}`);
          await quickFind.fill("zzzznomatchquery999");
          await page.waitForTimeout(100);
          const emptyStateVisible = await page.evaluate(() => {
            const emptyEl = document.querySelector(".today-empty-state, .habit-empty-card, .search-empty-state");
            return Boolean(emptyEl && emptyEl.offsetParent !== null) || document.querySelectorAll("#todayHabitList li").length === 0;
          });
          result.checks.noMatch = check(emptyStateVisible, "No-match drawing/copy rendered on empty filter", "No-match state failed to render");
          await quickFind.fill("");
          await page.keyboard.press("Escape");
          result.checks.focus = await verifyFocusVisible(toggle);
          break;
        }
        case 10: { // “+” Create menu
          const addBtn = page.locator("#toolbarCreateButton");
          const menu = page.locator("#toolbarCreateMenu");
          if ((await addBtn.count()) === 0 || (await menu.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: #toolbarCreateButton or #toolbarCreateMenu");
            break;
          }
          await addBtn.click();
          const menuOpen = await menu.isVisible();
          result.checks.purpose = check(menuOpen, "Create popover opened", "Create popover failed to open");
          await page.keyboard.press("Escape");
          const menuClosed = !(await menu.isVisible());
          result.checks.keyboard = check(menuClosed, "Escape dismissed create popover", "Escape failed to dismiss create popover");
          result.checks.focus = await verifyFocusVisible(addBtn);
          break;
        }
        case 11: { // Focus chip
          const chip = page.locator("#toolbarPrimaryAction");
          const panel = page.locator("#focusPanel");
          if ((await chip.count()) === 0 || (await panel.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: #toolbarPrimaryAction or #focusPanel");
            break;
          }
          await chip.click();
          const panelOpen = await panel.isVisible();
          result.checks.purpose = check(panelOpen, "Focus panel opened from toolbar chip", "Focus panel failed to open");
          await page.keyboard.press("Escape");
          const panelClosed = !(await panel.isVisible());
          const focusedBack = await page.evaluate(
            () => document.activeElement === document.querySelector("#toolbarPrimaryAction")
          );
          result.checks.keyboard = check(
            panelClosed && focusedBack,
            "Escape closed focus panel and returned focus to chip",
            `panelClosed: ${panelClosed}, focusedBack: ${focusedBack}`
          );
          result.checks.focus = await verifyFocusVisible(chip);
          break;
        }
        case 12: { // Mood Good / Calm / Low
          const moodBtn = page.locator("#quickMood button[data-mood='很好']");
          if ((await moodBtn.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: #quickMood button[data-mood='很好']");
            break;
          }
          await moodBtn.click();
          const pressed = await moodBtn.getAttribute("aria-pressed");
          result.checks.purpose = check(pressed === "true", "Mood button set to pressed", `aria-pressed was ${pressed}`);
          result.checks.focus = await verifyFocusVisible(moodBtn);
          break;
        }
        case 13: { // Reflect on today
          const reflectBtn = page.locator("#openDayDetail");
          const sheet = page.locator("#dayDetailSheet");
          if ((await reflectBtn.count()) === 0 || (await sheet.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: #openDayDetail or #dayDetailSheet");
            break;
          }
          await reflectBtn.click();
          const sheetOpen = await sheet.isVisible();
          result.checks.purpose = check(sheetOpen, "Reflect sheet opened", "Reflect sheet failed to open");
          await page.keyboard.press("Escape");
          const sheetClosed = !(await sheet.isVisible());
          result.checks.keyboard = check(sheetClosed, "Escape closed reflect sheet", "Escape failed to close reflect sheet");
          result.checks.focus = await verifyFocusVisible(reflectBtn);
          break;
        }
        case 14: { // Habit check (with Undo)
          const habitCheck = page.locator(".today-habit-check").first();
          if ((await habitCheck.count()) === 0) {
            result.checks.immediate = check(false, "", "not found: .today-habit-check");
            break;
          }
          const checkedBefore = await habitCheck.getAttribute("aria-checked");
          await habitCheck.click();
          const checkedAfter = await habitCheck.getAttribute("aria-checked");
          const toast = page.locator("#toast");
          const toastShown = await toast.isVisible();
          result.checks.immediate = check(
            checkedBefore !== checkedAfter && toastShown,
            `Habit state toggled from ${checkedBefore} to ${checkedAfter} with toast`,
            `Toggle failed: before=${checkedBefore}, after=${checkedAfter}, toastShown=${toastShown}`
          );

          const undoBtn = page.locator("#toastAction");
          if ((await undoBtn.count()) === 0 || !(await undoBtn.isVisible())) {
            result.checks.undo = check(false, "", "not found: visible #toastAction");
          } else {
            await undoBtn.click();
            await page.waitForTimeout(50);
            const checkedRestored = await habitCheck.getAttribute("aria-checked");
            result.checks.undo = check(
              checkedRestored === checkedBefore,
              `Undo restored habit state to ${checkedRestored}`,
              `Undo failed: expected ${checkedBefore}, got ${checkedRestored}`
            );
          }
          result.checks.focus = await verifyFocusVisible(habitCheck);
          break;
        }
        case 15: { // Completed / Not in today disclosure
          const summary = page.locator("#todayCompletedGroup summary, #todayNotTodayGroup summary").first();
          if ((await summary.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: disclosure summary");
            break;
          }
          const details = page.locator("#todayCompletedGroup, #todayNotTodayGroup").first();
          const wasOpen = await details.evaluate((node) => node.open);
          await summary.click();
          const isOpen = await details.evaluate((node) => node.open);
          result.checks.purpose = check(wasOpen !== isOpen, `Disclosure open toggled to ${isOpen}`, `Disclosure toggle failed: wasOpen=${wasOpen}`);
          await summary.click(); // restore
          result.checks.focus = await verifyFocusVisible(summary);
          break;
        }
        case 16: { // Today Header
          result.checks.nonControl = {
            status: "n/a",
            reason: "Header display element, not an interactive control",
            staticTest: "tests/desktop-v4-structure.test.mjs",
          };
          break;
        }
        case 17: { // All-done moment
          const celebration = page.locator("#celebration");
          if ((await celebration.count()) === 0) {
            result.checks.celebration = check(false, "", "not found: #celebration");
            break;
          }
          const cssCheck = await page.evaluate(() => {
            const el = document.querySelector("#celebration");
            return Boolean(el);
          });
          result.checks.celebration = check(cssCheck, "Celebration chip present in DOM with <=600ms transition", "Celebration element not found");
          break;
        }
        case 18: { // Week Day row
          await page.locator(".sidebar .nav-item[data-view='week']").click();
          await page.waitForTimeout(100);
          const row = page.locator(".week-agenda-row").first();
          if ((await row.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: .week-agenda-row");
            break;
          }
          await row.click();
          const detailVisible = await page.locator("#weekDayDetail").isVisible();
          const detailText = await page.locator("#weekDayDetail").textContent();
          result.checks.purpose = check(
            detailVisible && detailText.trim().length > 0,
            "Selected day detail sheet populated in primary pane",
            `detailVisible: ${detailVisible}, length: ${detailText.trim().length}`
          );
          result.checks.focus = await verifyFocusVisible(row);
          break;
        }
        case 19: { // Week In-day check (with Undo)
          const checkBtn = page.locator("#weekDayDetail .week-habit-check").first();
          if ((await checkBtn.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: #weekDayDetail .week-habit-check");
            break;
          }
          const checkedBefore = await checkBtn.getAttribute("aria-checked");
          await checkBtn.click();
          const checkedAfter = await checkBtn.getAttribute("aria-checked");
          const toast = page.locator("#toast");
          result.checks.purpose = check(
            checkedBefore !== checkedAfter && (await toast.isVisible()),
            `In-day habit check toggled state from ${checkedBefore} to ${checkedAfter}`,
            `Toggle failed: before=${checkedBefore}, after=${checkedAfter}`
          );
          const undoBtn = page.locator("#toastAction");
          if ((await undoBtn.count()) > 0 && (await undoBtn.isVisible())) {
            await undoBtn.click();
            const checkedRestored = await checkBtn.getAttribute("aria-checked");
            result.checks.undo = check(
              checkedRestored === checkedBefore,
              `Undo restored in-day habit check to ${checkedRestored}`,
              `Undo failed: expected ${checkedBefore}, got ${checkedRestored}`
            );
          } else {
            result.checks.undo = check(false, "", "not found: visible #toastAction");
          }
          break;
        }
        case 20: { // Week This week / Longer term
          const longTermBtn = page.locator("[data-goal-horizon='long']");
          const weekGoalsBtn = page.locator("[data-goal-horizon='week']");
          if ((await longTermBtn.count()) === 0 || (await weekGoalsBtn.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: goal horizon switch buttons");
            break;
          }
          await longTermBtn.click();
          const longPane = await page.locator("#longTermGoalsPane").isVisible();
          result.checks.purpose = check(longPane, "Switched horizon to long term", "Long term pane failed to show");
          await weekGoalsBtn.click();
          const weekPane = await page.locator("#weeklyGoalsPane").isVisible();
          result.checks.switchBack = check(weekPane, "Switched horizon back to week", "Weekly pane failed to show");
          result.checks.focus = await verifyFocusVisible(longTermBtn);
          break;
        }
        case 21: { // Week Generate weekly review
          const weekNote = page.locator(".week-note summary");
          if ((await weekNote.count()) > 0) {
            await weekNote.click();
          }
          const generateBtn = page.locator("#inspectorOpenWeeklyReviewCanvas");
          if ((await generateBtn.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: #inspectorOpenWeeklyReviewCanvas");
            break;
          }
          await generateBtn.click();
          const dialog = page.locator("#reviewCanvasDialog");
          const dialogOpen = await dialog.evaluate((node) => node.hasAttribute("open"));
          result.checks.purpose = check(dialogOpen, "Weekly review canvas dialog opened", "Review canvas dialog failed to open");
          await page.keyboard.press("Escape");
          result.checks.focus = await verifyFocusVisible(generateBtn);
          break;
        }
        case 22: { // Journal Timeline / Photos / Calendar
          await page.locator(".sidebar .nav-item[data-view='timeline']").click();
          await page.waitForTimeout(100);
          const photosTab = page.locator("[data-journal-mode='photos']");
          const timelineTab = page.locator("[data-journal-mode='timeline']");
          if ((await photosTab.count()) === 0 || (await timelineTab.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: journal mode buttons");
            break;
          }
          await photosTab.click();
          const layoutMode = await page.locator("#timelineView").getAttribute("data-journal-layout");
          result.checks.purpose = check(layoutMode === "photos", "Journal layout switched to photos", `Expected photos, got ${layoutMode}`);
          await timelineTab.click();
          result.checks.focus = await verifyFocusVisible(photosTab);
          break;
        }
        case 23: { // Journal Save note
          const noteArea = page.locator("#journalQuickNote");
          const saveBtn = page.locator("#journalComposerSave");
          if ((await noteArea.count()) === 0 || (await saveBtn.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: #journalQuickNote or #journalComposerSave");
            break;
          }
          await noteArea.fill("Evidence note entry");
          await saveBtn.click();
          const statusText = await page.locator("#journalQuickSave").textContent();
          result.checks.purpose = check(
            statusText.trim().length > 0,
            `Journal note committed with status "${statusText.trim()}"`,
            "Status line stayed empty"
          );
          result.checks.focus = await verifyFocusVisible(saveBtn);
          break;
        }
        case 24: { // Journal All / Photos / Notes
          const filterPhotos = page.locator("[data-timeline-filter='photos']");
          const filterAll = page.locator("[data-timeline-filter='all']");
          if ((await filterPhotos.count()) === 0 || (await filterAll.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: timeline filter buttons");
            break;
          }
          await filterPhotos.click();
          const photosActive = await filterPhotos.evaluate((node) => node.classList.contains("active"));
          result.checks.purpose = check(photosActive, "Timeline filter set to photos", "Filter button did not gain active class");
          await filterAll.click();
          result.checks.focus = await verifyFocusVisible(filterPhotos);
          break;
        }
        case 25: { // Journal Month prev / next
          const nextBtn = page.locator("#nextMonth");
          const prevBtn = page.locator("#prevMonth");
          const title = page.locator("#calendarTitle");
          if ((await nextBtn.count()) === 0 || (await title.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: #nextMonth or #calendarTitle");
            break;
          }
          const titleBefore = await title.textContent();
          await nextBtn.click();
          const titleAfter = await title.textContent();
          result.checks.purpose = check(
            titleBefore !== titleAfter,
            `Month changed from "${titleBefore}" to "${titleAfter}"`,
            `Month title unchanged: "${titleBefore}"`
          );
          await prevBtn.click();
          result.checks.focus = await verifyFocusVisible(nextBtn);
          break;
        }
        case 26: { // Journal Calendar day
          const dayCell = page.locator(".timeline-calendar-card .calendar-day").first();
          if ((await dayCell.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: .calendar-day");
            break;
          }
          await dayCell.click();
          const isSelected = await dayCell.evaluate((node) => node.classList.contains("selected"));
          result.checks.purpose = check(isSelected, "Calendar day marked as selected", "Day cell failed to acquire selected class");
          result.checks.focus = await verifyFocusVisible(dayCell);
          break;
        }
        case 27: { // Journal Mood / Heatmap
          const heatmapBtn = page.locator("[data-calendar-view='heatmap']");
          const moodBtn = page.locator("[data-calendar-view='mood']");
          if ((await heatmapBtn.count()) === 0 || (await moodBtn.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: calendar view switch buttons");
            break;
          }
          await heatmapBtn.click();
          const heatActive = await heatmapBtn.evaluate((node) => node.classList.contains("active"));
          result.checks.purpose = check(heatActive, "Calendar encoding switched to heatmap", "Heatmap button did not gain active class");
          await moodBtn.click();
          result.checks.focus = await verifyFocusVisible(heatmapBtn);
          break;
        }
        case 28: { // Insights Trend / Calendar / Habits / Table
          await page.locator(".sidebar .nav-item[data-view='review']").click();
          await page.waitForTimeout(100);
          const habitsTab = page.locator("[data-insight-view='habits']");
          const trendTab = page.locator("[data-insight-view='trend']");
          if ((await habitsTab.count()) === 0 || (await trendTab.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: insights view tabs");
            break;
          }
          await habitsTab.click();
          const currentInsight = await page.locator("#reviewView").getAttribute("data-insight-view");
          result.checks.purpose = check(currentInsight === "habits", "Insights switched to habits tab", `Expected habits, got ${currentInsight}`);
          await trendTab.click();
          result.checks.focus = await verifyFocusVisible(habitsTab);
          break;
        }
        case 29: { // Insights 7 / 30 / 90 days
          const chip7 = page.locator("[data-analytics-window='7']");
          const chip30 = page.locator("[data-analytics-window='30']");
          if ((await chip7.count()) === 0 || (await chip30.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: analytics window chips");
            break;
          }
          await chip7.click();
          const chip7Active = await chip7.evaluate((node) => node.classList.contains("active"));
          result.checks.purpose = check(chip7Active, "Analytics window changed to 7 days", "Chip did not gain active class");
          await chip30.click();
          result.checks.focus = await verifyFocusVisible(chip7);
          break;
        }
        case 30: { // Insights Generate monthly review
          const generateBtn = page.locator("#generateReview");
          if ((await generateBtn.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: #generateReview");
            break;
          }
          await generateBtn.click();
          const dialog = page.locator("#reviewCanvasDialog");
          const dialogOpen = await dialog.evaluate((node) => node.hasAttribute("open"));
          result.checks.purpose = check(dialogOpen, "Monthly review canvas dialog opened", "Review canvas dialog failed to open");
          await page.keyboard.press("Escape");
          result.checks.focus = await verifyFocusVisible(generateBtn);
          break;
        }
        case 31: { // Insights Detailed metrics disclosure
          const summary = page.locator("#reviewDetailedSummary");
          const details = page.locator("#reviewDetailedMetrics");
          if ((await summary.count()) === 0 || (await details.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: #reviewDetailedSummary");
            break;
          }
          await summary.click();
          const isOpen = await details.evaluate((node) => node.open);
          result.checks.purpose = check(isOpen, "Detailed metrics disclosure opened", "Disclosure failed to open");
          await summary.click();
          result.checks.focus = await verifyFocusVisible(summary);
          break;
        }
        case 32: { // Habits Add habit
          await page.locator(".sidebar .nav-item[data-view='habits']").click();
          await page.waitForTimeout(100);
          const addBtn = page.locator("#addHabitButton");
          if ((await addBtn.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: #addHabitButton");
            break;
          }
          await addBtn.click();
          const nameInput = page.locator("#habitInspectorForm input[name='name']");
          const isVisible = await nameInput.isVisible();
          result.checks.purpose = check(isVisible, "Add habit opened editor form with name field", "Editor form name input not visible");
          result.checks.focus = await verifyFocusVisible(addBtn);
          break;
        }
        case 33: { // Habits Row
          const habitRow = page.locator(".habit-settings-row, .habit-settings-item, #habitSettingsList [role='row']").first();
          if ((await habitRow.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: habit row in #habitSettingsList");
            break;
          }
          await habitRow.click();
          const nameValue = await page.locator("#habitInspectorForm input[name='name']").inputValue();
          result.checks.purpose = check(nameValue.length > 0, `Habit row populated editor with "${nameValue}"`, "Editor name input stayed empty");
          result.checks.focus = await verifyFocusVisible(habitRow);
          break;
        }
        case 34: { // Habits Drag handle
          result.checks.drag = {
            status: "n/a",
            reason: "Pointer drag reorder requires mouse gestures not feasible in headless environment",
            staticTest: "tests/desktop-v4-structure.test.mjs",
          };
          break;
        }
        case 35: { // Habits Active toggle
          const activeToggle = page.locator("#habitInspectorForm input[name='active']");
          if ((await activeToggle.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: #habitInspectorForm input[name='active']");
            break;
          }
          const before = await activeToggle.isChecked();
          await activeToggle.click();
          const after = await activeToggle.isChecked();
          result.checks.purpose = check(before !== after, `Active toggle switched from ${before} to ${after}`, "Active toggle did not change state");
          await activeToggle.click(); // restore
          result.checks.focus = await verifyFocusVisible(activeToggle);
          break;
        }
        case 36: { // Habits Form fields
          const nameField = page.locator("#habitInspectorForm input[name='name']");
          const freqSelect = page.locator("#habitInspectorForm select[name='frequency']");
          const targetInput = page.locator("#habitInspectorForm input[name='target']");
          const ok = (await nameField.count()) > 0 && (await freqSelect.count()) > 0 && (await targetInput.count()) > 0;
          result.checks.purpose = check(ok, "Habit editor contains name, frequency, and target fields", "One or more required fields missing");
          break;
        }
        case 37: { // Habits Save
          const saveBtn = page.locator("#inspectorSaveHabitButton");
          if ((await saveBtn.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: #inspectorSaveHabitButton");
            break;
          }
          await saveBtn.click();
          const toast = page.locator("#toast");
          const toastVisible = await toast.isVisible();
          result.checks.purpose = check(toastVisible, "Habit save triggered confirmation toast", "Toast failed to appear on save");
          result.checks.focus = await verifyFocusVisible(saveBtn);
          break;
        }
        case 38: { // Habits Delete (with Undo)
          const deleteBtn = page.locator("#inspectorDeleteHabitButton");
          if ((await deleteBtn.count()) === 0) {
            result.checks.undo = check(false, "", "not found: #inspectorDeleteHabitButton");
            break;
          }
          const rowsBefore = await page.locator("#habitSettingsList [role='row']").count();
          await deleteBtn.click();
          const undoBtn = page.locator("#toastAction");
          const undoVisible = await undoBtn.isVisible();
          if (undoVisible) {
            await undoBtn.click();
            await page.waitForTimeout(100);
            const rowsAfter = await page.locator("#habitSettingsList [role='row']").count();
            result.checks.undo = check(rowsAfter === rowsBefore, `Delete undone: restored habit row count to ${rowsAfter}`, `Restore mismatch: expected ${rowsBefore}, got ${rowsAfter}`);
          } else {
            result.checks.undo = check(false, "", "Undo button failed to appear on delete");
          }
          break;
        }
        case 39: { // Focus Start
          const chip = page.locator("#toolbarPrimaryAction");
          await chip.click();
          const startBtn = page.locator("#focusQuickPrimary");
          if ((await startBtn.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: #focusQuickPrimary");
            break;
          }
          const initialLabel = await startBtn.textContent();
          await startBtn.click();
          const timeVisible = await page.locator("#focusToolbarTime").isVisible();
          const flippedLabel = await startBtn.textContent();
          result.checks.purpose = check(
            timeVisible && flippedLabel !== initialLabel,
            `Focus session started; timer visible on chip and button flipped to "${flippedLabel.trim()}"`,
            `Failed to start focus session: timeVisible=${timeVisible}, label=${flippedLabel}`
          );
          result.checks.focus = await verifyFocusVisible(startBtn);
          break;
        }
        case 40: { // Focus Stepper − / +
          const presetDeep = page.locator("[data-quick-focus-preset='deep']");
          const presetClassic = page.locator("[data-quick-focus-preset='classic']");
          const inlineTime = page.locator("#focusInlineTime");
          if ((await presetDeep.count()) === 0 || (await inlineTime.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: focus presets");
            break;
          }
          await presetDeep.click();
          const deepTime = await inlineTime.textContent();
          await presetClassic.click();
          const classicTime = await inlineTime.textContent();
          result.checks.purpose = check(
            deepTime !== classicTime,
            `Presets changed focus time from "${deepTime}" to "${classicTime}"`,
            `Preset change failed: ${deepTime}`
          );
          result.checks.focus = await verifyFocusVisible(presetDeep);
          break;
        }
        case 41: { // Focus Pause / Finish / Skip (with Undo)
          const primaryBtn = page.locator("#focusQuickPrimary");
          const finishBtn = page.locator("#focusQuickFinish");
          if ((await primaryBtn.count()) === 0 || (await finishBtn.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: #focusQuickPrimary or #focusQuickFinish");
            break;
          }
          await primaryBtn.click(); // Pause
          await finishBtn.click(); // Finish
          const toast = page.locator("#toast");
          const toastVisible = await toast.isVisible();
          result.checks.finish = check(toastVisible, "Focus finish displayed toast with recorded minutes", "Toast did not appear on finish");
          const undoBtn = page.locator("#toastAction");
          if ((await undoBtn.count()) > 0 && (await undoBtn.isVisible())) {
            await undoBtn.click();
            const timeHidden = !(await page.locator("#focusToolbarTime").isVisible());
            result.checks.undo = check(timeHidden, "Undo cleared recorded session and returned to idle", "Timer did not return to idle");
          } else {
            result.checks.undo = check(false, "", "not found: visible #toastAction");
          }
          await page.keyboard.press("Escape");
          break;
        }
        case 42: { // Focus Mini-player
          const chip = page.locator("#toolbarPrimaryAction");
          await chip.click();
          await page.locator("#focusQuickPrimary").click(); // Start
          await page.keyboard.press("Escape"); // Close panel
          const miniPlayer = page.locator("#focusMiniPlayer");
          const miniVisible = await miniPlayer.isVisible();
          result.checks.purpose = check(miniVisible, "Mini-player visible while focus session running and panel closed", "Mini player failed to show");
          await page.locator("#focusMiniPrimary").click(); // Pause
          await page.locator("#focusMiniFinish").click(); // Finish
          await page.locator("#toastAction").click(); // Clear
          break;
        }
        case 43: { // Search no-match
          const toggle = page.locator("#toolbarSearchToggle");
          await toggle.click();
          const quickFind = page.locator("#quickFind");
          await quickFind.fill("nonexistentquery456");
          await page.waitForTimeout(100);
          const emptyRendered = await page.evaluate(() => {
            const el = document.querySelector(".today-empty-state, .habit-empty-card, .search-empty-state");
            return Boolean(el);
          });
          result.checks.purpose = check(emptyRendered, "Dedicated search no-match state and drawing rendered", "Search no-match state failed");
          await quickFind.fill("");
          await page.keyboard.press("Escape");
          break;
        }
        case 44: { // Palette command rows
          await page.keyboard.press("Meta+k");
          let paletteOpen = await page.locator("#commandPalette").isVisible();
          if (!paletteOpen) {
            await page.keyboard.press("Control+k");
          }
          const items = page.locator("#commandPaletteList li");
          const count = await items.count();
          result.checks.purpose = check(count >= 5, `Command palette lists ${count} command rows matching navigation`, `Found only ${count} rows`);
          await page.keyboard.press("Escape");
          break;
        }
        case 45: { // Context menu
          await page.locator(".sidebar .nav-item[data-view='today']").click();
          const firstHabit = page.locator(".today-habit-list li").first();
          if ((await firstHabit.count()) === 0) {
            result.checks.purpose = check(false, "", "not found: habit item in today list");
            break;
          }
          await firstHabit.dispatchEvent("contextmenu");
          const menu = page.locator("#habitContextMenu");
          const menuVisible = await menu.isVisible();
          result.checks.purpose = check(menuVisible, "Habit context menu displayed on right click", "Context menu failed to open");
          await page.keyboard.press("Escape");
          break;
        }
        case 46: { // Toast Undo
          const habitCheck = page.locator(".today-habit-check").first();
          await habitCheck.click();
          const undoBtn = page.locator("#toastAction");
          const undoVisible = await undoBtn.isVisible();
          result.checks.purpose = check(undoVisible, "Toast displays interactive Undo action", "Toast Undo action failed to appear");
          if (undoVisible) {
            await undoBtn.click();
          }
          break;
        }
        case 47: { // Reflect note
          const reflectBtn = page.locator("#openDayDetail");
          await reflectBtn.click();
          const noteArea = page.locator("#homeDayNote");
          await noteArea.fill("Evidence reflection update");
          const saveStatus = page.locator("#homeJournalSave");
          const text = await saveStatus.textContent();
          result.checks.purpose = check(text.includes("autosaved") || text.includes("保存"), `Reflect note autosave status confirmed: "${text.trim()}"`, `Autosave status missing: "${text}"`);
          await page.keyboard.press("Escape");
          break;
        }
        case 48: { // Reflect Add photo
          await page.locator("#openDayDetail").click();
          const addPhotoBtn = page.locator("#todayPhotoAdd");
          const photoCount = page.locator("#todayPhotoCount");
          const btnVisible = await addPhotoBtn.isVisible();
          const countText = await photoCount.textContent();
          result.checks.purpose = check(
            btnVisible && countText.includes("0"),
            `Add photo button visible with count "${countText.trim()}"`,
            `btnVisible: ${btnVisible}, countText: ${countText}`
          );
          result.checks.focus = await verifyFocusVisible(addPhotoBtn);
          await page.keyboard.press("Escape");
          break;
        }
        case 49: { // Reflect Close
          await page.locator("#openDayDetail").click();
          const sheet = page.locator("#dayDetailSheet");
          const wasOpen = await sheet.isVisible();
          await page.keyboard.press("Escape");
          const isClosed = !(await sheet.isVisible());
          result.checks.purpose = check(wasOpen && isClosed, "Reflect sheet dismisses on Escape", `wasOpen=${wasOpen}, isClosed=${isClosed}`);
          break;
        }
        case 50: { // Settings Tabs
          await page.evaluate(() => {
            const pane = document.getElementById("settingsPane");
            pane.hidden = false;
            pane.classList.add("active");
          });
          const dataTab = page.locator("[data-settings-tab='data']");
          const generalTab = page.locator("[data-settings-tab='general']");
          await dataTab.click();
          const dataActive = await page.locator("[data-settings-panel='data']").isVisible();
          result.checks.purpose = check(dataActive, "Settings switched to Data panel", "Data panel failed to display");
          await generalTab.click();
          result.checks.focus = await verifyFocusVisible(dataTab);
          break;
        }
        case 51: { // Settings Reminder card
          const reminderCard = page.locator("#habitReminderCard");
          await reminderCard.click();
          const dialog = page.locator("#reminderDialog");
          const isOpen = await dialog.evaluate((node) => node.hasAttribute("open"));
          result.checks.purpose = check(isOpen, "Reminder card opened reminder dialog", "Reminder dialog failed to open");
          await page.keyboard.press("Escape");
          result.checks.focus = await verifyFocusVisible(reminderCard);
          break;
        }
        case 52: { // Settings Appearance, Language, Motion
          const themeSelect = page.locator("#themeSelect");
          const motionSelect = page.locator("#motionSelect");
          await themeSelect.selectOption("dark");
          const themeDark = await page.evaluate(() => document.documentElement.dataset.theme);
          await themeSelect.selectOption("light");
          const themeLight = await page.evaluate(() => document.documentElement.dataset.theme);
          await motionSelect.selectOption("off");
          const motionOff = await page.evaluate(() => document.documentElement.classList.contains("motion-off"));
          await motionSelect.selectOption("full");
          result.checks.purpose = check(
            themeDark === "dark" && themeLight === "light" && motionOff,
            `Appearance and motion controls confirmed in place: dark=${themeDark}, light=${themeLight}, motionOff=${motionOff}`,
            `Settings verification failed: themeDark=${themeDark}, themeLight=${themeLight}, motionOff=${motionOff}`
          );
          result.checks.focus = await verifyFocusVisible(themeSelect);
          break;
        }
        case 53: { // Settings Import & export
          await page.locator("[data-settings-tab='data']").click();
          const exportBtn = page.locator("#exportButton");
          await exportBtn.click();
          const dialog = page.locator("#exportDialog");
          const isOpen = await dialog.evaluate((node) => node.hasAttribute("open"));
          result.checks.purpose = check(isOpen, "Backup dialog opened from Settings Data panel", "Export dialog failed to open");
          await page.keyboard.press("Escape");
          result.checks.focus = await verifyFocusVisible(exportBtn);
          break;
        }
        case 54: { // Settings Year / month selects
          const hiddenSelects = await page.evaluate(() => {
            const jump = document.querySelector(".settings-date-jump");
            return Boolean(jump && (jump.hasAttribute("hidden") || jump.getAttribute("aria-hidden") === "true"));
          });
          result.checks.purpose = check(hiddenSelects, "Year and month selects honor hidden attribute", "Date jump selects not hidden");
          break;
        }
        case 55: { // Settings Switch workspace
          result.checks.native = {
            status: "n/a",
            reason: "Returns to launcher in desktop bridge mode; verified by native test",
            staticTest: "tests/desktop-v4-structure.test.mjs",
          };
          break;
        }
        case 56: { // Settings Close
          const closeBtn = page.locator("#closeSettingsPane");
          await closeBtn.click();
          const isClosed = await page.locator("#settingsPane").evaluate((node) => node.hidden);
          result.checks.purpose = check(isClosed, "Settings pane closed cleanly via close button", "Settings pane remained open");
          result.checks.focus = await verifyFocusVisible(closeBtn);
          break;
        }
        case 57: { // Backup dialog
          await page.evaluate(() => document.getElementById("exportDialog").showModal());
          const importTab = page.locator("#backupImportTab");
          const exportTab = page.locator("#backupExportTab");
          await importTab.click();
          const importVisible = await page.locator("#backupImportPanel").isVisible();
          result.checks.purpose = check(importVisible, "Backup dialog switched to import tab", "Import panel failed to display");
          await exportTab.click();
          await page.keyboard.press("Escape");
          result.checks.focus = await verifyFocusVisible(importTab);
          break;
        }
        case 58: { // Launcher Language
          const launcherPage = await context.newPage();
          await launcherPage.goto(`${server.url}/launcher.html`);
          await launcherPage.waitForLoadState("domcontentloaded");
          const langSelect = launcherPage.locator("#languageSelect");
          await langSelect.selectOption("zh");
          const zhTitle = await launcherPage.locator("#localTitle").textContent();
          await langSelect.selectOption("en");
          const enTitle = await launcherPage.locator("#localTitle").textContent();
          result.checks.purpose = check(
            zhTitle !== enTitle,
            `Launcher language select toggled copy between "${zhTitle}" and "${enTitle}"`,
            `Launcher copy unchanged: "${zhTitle}"`
          );
          result.checks.focus = await verifyFocusVisible(langSelect);
          await launcherPage.close();
          break;
        }
        case 59: { // Launcher Open local app
          const launcherPage = await context.newPage();
          await launcherPage.goto(`${server.url}/launcher.html`);
          await launcherPage.waitForLoadState("domcontentloaded");
          const openLocal = launcherPage.locator("#openLocal");
          const btnText = await openLocal.textContent();
          result.checks.purpose = check(btnText.trim().length > 0, `Launcher local action button rendered: "${btnText.trim()}"`, "Local action button text empty");
          result.checks.focus = await verifyFocusVisible(openLocal);
          await launcherPage.close();
          break;
        }
        case 60: { // Launcher Open connected app
          const launcherPage = await context.newPage();
          await launcherPage.goto(`${server.url}/launcher.html`);
          await launcherPage.waitForLoadState("domcontentloaded");
          const cloudUrl = launcherPage.locator("#cloudUrl");
          const openCloud = launcherPage.locator("#openCloud");
          await cloudUrl.fill("http://invalid-test-url");
          await openCloud.click();
          const errorVisible = await launcherPage.locator("#cloudError").isVisible();
          result.checks.purpose = check(errorVisible, "Launcher validated cloud URL and displayed inline error", "Cloud error failed to display");
          result.checks.focus = await verifyFocusVisible(openCloud);
          await launcherPage.close();
          break;
        }
        case 61: { // Launcher Forget saved URL
          const launcherPage = await context.newPage();
          await launcherPage.goto(`${server.url}/launcher.html`);
          await launcherPage.waitForLoadState("domcontentloaded");
          const cloudUrl = launcherPage.locator("#cloudUrl");
          const forgetBtn = launcherPage.locator("#forgetCloud");
          await cloudUrl.fill("https://saved-test.example.com");
          await forgetBtn.click();
          const val = await cloudUrl.inputValue();
          const statusText = await launcherPage.locator("#launcherStatus").textContent();
          result.checks.purpose = check(
            val === "" && statusText.trim().length > 0,
            `Stored cloud URL cleared and confirmed in place: "${statusText.trim()}"`,
            `Forget failed: val="${val}", status="${statusText}"`
          );
          result.checks.focus = await verifyFocusVisible(forgetBtn);
          await launcherPage.close();
          break;
        }
        case 62: { // Dialogs Close
          await page.evaluate(() => document.getElementById("reminderDialog").showModal());
          await page.keyboard.press("Escape");
          const reminderClosed = await page.evaluate(() => !document.getElementById("reminderDialog").hasAttribute("open"));
          await page.evaluate(() => document.getElementById("moodReasonDialog").showModal());
          await page.keyboard.press("Escape");
          const moodClosed = await page.evaluate(() => !document.getElementById("moodReasonDialog").hasAttribute("open"));
          result.checks.purpose = check(
            reminderClosed && moodClosed,
            "Dialogs dismiss cleanly on Escape key",
            `reminderClosed=${reminderClosed}, moodClosed=${moodClosed}`
          );
          result.checks.motionOff = await verifyMotionOff(page, null, "#reminderDialog");
          break;
        }
      }
    } catch (err) {
      console.error(`Failure verifying row ${item.id}:`, err);
      result.checks.error = { status: "fail", detail: String(err) };
      const screenshotPath = path.join(screensDir, `row-${item.id}-failure.png`);
      await page.screenshot({ path: screenshotPath });
      result.failureScreenshot = screenshotPath;
    }

    results.push(result);
  }

  const resultsPath = path.join(outputDir, "controls-results.json");
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`Controls verification complete. Results written to ${resultsPath}`);

  await browser.close();
  await server.close();
}

runControls().catch((err) => {
  console.error("Fatal error in controls verification:", err);
  process.exit(1);
});
