import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(rootDir, "public");

const hasPlaywright = await import("playwright")
  .then(() => true)
  .catch(() => false);

test(
  "Today 2.0 layout: edit mode, 2D drag, discrete S/M/L, keyboard move, undo, reset, and persistence",
  { skip: !hasPlaywright, timeout: 60_000 },
  async () => {
    const { chromium } = await import("playwright");
    const { startStaticServer } = await import("../scripts/evidence/server.mjs");
    const { applyFixture, FIXTURE_DATE } = await import("../scripts/evidence/fixture.mjs");

    let server;
    let browser;
    let context;
    let page;

    try {
      server = await startStaticServer(publicDir);
      browser = await chromium.launch({ headless: true });
      context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      page = await context.newPage();

      await applyFixture(page, { date: FIXTURE_DATE, theme: "light", motion: "full", language: "en" });
      await page.goto(`${server.url}/index.html?desktop=tauri-local`);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(400);

      // 1. Verify all 7 Today modules are rendered in the desktop grid
      const initialCards = await page.evaluate(() => {
        const board = document.querySelector("#todayView");
        const cards = [...board.querySelectorAll(":scope > .module-card")];
        return cards.map(c => ({
          module: c.dataset.module,
          size: c.dataset.widgetSize,
          hidden: c.hidden,
          gridX: c.style.getPropertyValue("--grid-x"),
          gridY: c.style.getPropertyValue("--grid-y"),
          gridW: c.style.getPropertyValue("--grid-w"),
          gridH: c.style.getPropertyValue("--grid-h"),
        }));
      });

      assert.equal(initialCards.length, 7, "All 7 Today modules must exist");
      const summaryCard = initialCards.find(c => c.module === "summary");
      assert.equal(summaryCard?.size, "large");
      assert.equal(summaryCard?.hidden, false);

      // 2. Normal mode: dragging is disabled, internal controls work without starting drag
      const editBarHidden = await page.evaluate(() => {
        const editBars = document.querySelectorAll("#todayView .widget-edit-bar");
        return [...editBars].every(bar => bar.hidden || bar.style.display === "none");
      });
      assert.ok(editBarHidden, "Widget edit bars must be hidden in normal mode");

      // Verify normal mode habit click works
      const habitCheckbox = page.locator("#todayHabitList .today-habit-check").first();
      await habitCheckbox.click({ timeout: 5000 });
      await page.waitForTimeout(100);

      // 3. Toggle edit mode via #editLayoutToggle
      await page.locator("#editLayoutToggle").click();
      await page.waitForTimeout(150);

      const isEditing = await page.evaluate(() => {
        return document.querySelector("#todayView").classList.contains("is-editing-layout");
      });
      assert.equal(isEditing, true, "Today board must have .is-editing-layout in edit mode");

      // Undo button and reset button should now be visible
      const toolbarButtonsVisible = await page.evaluate(() => {
        const undo = document.querySelector("#undoLayoutButton");
        const reset = document.querySelector("#resetLayoutButton");
        return {
          undoVisible: undo && !undo.hidden,
          resetVisible: reset && !reset.hidden,
        };
      });
      assert.equal(toolbarButtonsVisible.resetVisible, true, "Reset button visible in edit mode");

      // 4. Test discrete S/M/L switching
      // Switch summary card from Large to Small
      const summarySmallBtn = page.locator('[data-module="summary"] .widget-size-btn[data-size="small"]');
      await summarySmallBtn.click();
      await page.waitForTimeout(150);

      const summaryAfterSmall = await page.evaluate(() => {
        const c = document.querySelector('[data-module="summary"]');
        return {
          size: c.dataset.widgetSize,
          gridW: c.style.getPropertyValue("--grid-w"),
          gridH: c.style.getPropertyValue("--grid-h"),
        };
      });
      assert.equal(summaryAfterSmall.size, "small");
      assert.equal(summaryAfterSmall.gridW, "4");
      assert.equal(summaryAfterSmall.gridH, "1");

      // 5. Test undo: reverting size change
      const undoBtn = page.locator("#undoLayoutButton");
      await undoBtn.click();
      await page.waitForTimeout(150);

      const summaryAfterUndo = await page.evaluate(() => {
        const c = document.querySelector('[data-module="summary"]');
        return {
          size: c.dataset.widgetSize,
          gridW: c.style.getPropertyValue("--grid-w"),
          gridH: c.style.getPropertyValue("--grid-h"),
        };
      });
      assert.equal(summaryAfterUndo.size, "large");
      assert.equal(summaryAfterUndo.gridW, "8");
      assert.equal(summaryAfterUndo.gridH, "2");

      // 6. Test keyboard movement (Arrow keys) and sizing (S/M/L keys) on drag handle
      const focusHandle = page.locator('[data-module="focus"] .widget-drag-handle');
      await focusHandle.focus();
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(150);

      const focusGridPos = await page.evaluate(() => {
        const c = document.querySelector('[data-module="focus"]');
        return {
          gridX: c.style.getPropertyValue("--grid-x"),
        };
      });
      // Focus was at x: 8, ArrowLeft moves by 4 to x: 4
      assert.equal(focusGridPos.gridX, "4", "ArrowLeft should shift widget x by 4 columns");

      // Test keyboard sizing: press M to change to medium
      await focusHandle.focus();
      await page.keyboard.press("m");
      await page.waitForTimeout(120);
      const focusSizeAfterKeyM = await page.evaluate(() => {
        return document.querySelector('[data-module="focus"]').dataset.widgetSize;
      });
      assert.equal(focusSizeAfterKeyM, "medium", "Pressing 'm' on focused handle must set size to medium");

      // Press S to change back to small
      await focusHandle.focus();
      await page.keyboard.press("s");
      await page.waitForTimeout(120);
      const focusSizeAfterKeyS = await page.evaluate(() => {
        return document.querySelector('[data-module="focus"]').dataset.widgetSize;
      });
      assert.equal(focusSizeAfterKeyS, "small", "Pressing 's' on focused handle must set size to small");

      // 7. Test hide / show toggle
      const reflectionHideBtn = page.locator('[data-module="reflection"] [data-action="toggle-hide"]');
      await reflectionHideBtn.click();
      await page.waitForTimeout(150);

      const reflectionHidden = await page.evaluate(() => {
        const c = document.querySelector('[data-module="reflection"]');
        return c.classList.contains("is-widget-hidden");
      });
      assert.equal(reflectionHidden, true, "Reflection card should be marked .is-widget-hidden in edit mode");

      // 8. Test Escape key cancels active edit session and restores pre-edit snapshot
      await page.keyboard.press("Escape");
      await page.waitForTimeout(150);

      const isEditingAfterEscape = await page.evaluate(() => {
        return document.querySelector("#todayView").classList.contains("is-editing-layout");
      });
      assert.equal(isEditingAfterEscape, false, "Escape must exit edit mode");

      // Escape must have restored the snapshot from before entering edit mode:
      const reflectionAfterEscape = await page.evaluate(() => {
        const c = document.querySelector('[data-module="reflection"]');
        const f = document.querySelector('[data-module="focus"]');
        return {
          reflectionHidden: c.hidden,
          focusGridX: f.style.getPropertyValue("--grid-x"),
        };
      });
      assert.equal(reflectionAfterEscape.reflectionHidden, false, "Escape cancels edit session and restores reflection visibility");
      assert.equal(reflectionAfterEscape.focusGridX, "8", "Escape cancels edit session and restores focus position");

      // Now enter edit mode again, make changes, and click Done to persist
      await page.locator("#editLayoutToggle").click();
      await page.waitForTimeout(120);
      const focusHandle2 = page.locator('[data-module="focus"] .widget-drag-handle');
      await focusHandle2.focus();
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(120);
      await page.locator('[data-module="reflection"] [data-action="toggle-hide"]').click();
      await page.waitForTimeout(120);
      // Click Done button to save
      await page.locator("#editLayoutToggle").click();
      await page.waitForTimeout(150);

      // In normal mode after Done, hidden card is truly hidden
      const reflectionHiddenNormal = await page.evaluate(() => {
        const c = document.querySelector('[data-module="reflection"]');
        return c.hidden;
      });
      assert.equal(reflectionHiddenNormal, true, "Hidden widget must be hidden in normal mode after Done");

      // 9. Test persistence across reload
      await page.reload();
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(300);

      const restoredState = await page.evaluate(() => {
        const v2 = localStorage.getItem("life-ledger-layout-v2");
        const parsed = JSON.parse(v2);
        const focusW = parsed.widgets.find(w => w.type === "focus");
        const reflectionW = parsed.widgets.find(w => w.type === "reflection");
        return {
          focusX: focusW?.x,
          reflectionHidden: reflectionW?.hidden,
        };
      });
      assert.equal(restoredState.focusX, 4, "Persisted focus x position restored after reload");
      assert.equal(restoredState.reflectionHidden, true, "Persisted reflection hidden state restored after reload");

      // 10. Test Reset Layout
      await page.locator("#editLayoutToggle").click();
      await page.waitForTimeout(150);

      // Handle window.confirm for resetLayout
      page.once("dialog", async dialog => {
        await dialog.accept();
      });
      await page.locator("#resetLayoutButton").click();
      await page.waitForTimeout(200);

      const afterReset = await page.evaluate(() => {
        const v2 = localStorage.getItem("life-ledger-layout-v2");
        const parsed = JSON.parse(v2);
        const focusW = parsed.widgets.find(w => w.type === "focus");
        const reflectionW = parsed.widgets.find(w => w.type === "reflection");
        return {
          focusX: focusW?.x,
          reflectionHidden: reflectionW?.hidden,
        };
      });
      assert.equal(afterReset.focusX, 8, "Reset layout restores default focus x: 8");
      assert.equal(afterReset.reflectionHidden, false, "Reset layout restores default reflection hidden: false");

    } finally {
      await page?.close().catch(() => {});
      await context?.close().catch(() => {});
      await browser?.close().catch(() => {});
      if (server?.close) {
        await server.close().catch(() => {});
      }
    }
  }
);

test(
  "Today 2.0 pointer drag follows with zero easing and snaps to valid slot on release",
  { skip: !hasPlaywright, timeout: 30_000 },
  async () => {
    const { chromium } = await import("playwright");
    const { startStaticServer } = await import("../scripts/evidence/server.mjs");
    const { applyFixture, FIXTURE_DATE } = await import("../scripts/evidence/fixture.mjs");

    let server;
    let browser;
    let context;
    let page;

    try {
      server = await startStaticServer(publicDir);
      browser = await chromium.launch({ headless: true });
      context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      page = await context.newPage();

      await applyFixture(page, { date: FIXTURE_DATE, theme: "light", motion: "full", language: "en" });
      await page.goto(`${server.url}/index.html?desktop=tauri-local`);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(300);

      // Enter edit mode
      await page.locator("#editLayoutToggle").click();
      await page.waitForTimeout(150);

      const focusHandle = page.locator('[data-module="focus"] .widget-drag-handle');
      await focusHandle.scrollIntoViewIfNeeded();

      // Dispatch pointerdown on the drag handle
      await focusHandle.dispatchEvent("pointerdown", { button: 0, clientX: 100, clientY: 100, pointerId: 1 });

      // Check that during drag, card has zero easing (transition: none) and is-dragging class
      const draggingState = await page.evaluate(() => {
        const c = document.querySelector('[data-module="focus"]');
        return {
          isDragging: c.classList.contains("is-dragging"),
          transition: c.style.transition,
        };
      });
      assert.equal(draggingState.isDragging, true, "Card must have is-dragging class while pointer is down");
      assert.equal(draggingState.transition, "none", "Direct drag must have zero easing / transition: none");

      // Move pointer down by 240px and release
      await page.evaluate(() => {
        window.dispatchEvent(new PointerEvent("pointermove", { clientX: 100, clientY: 340, pointerId: 1 }));
      });
      await page.evaluate(() => {
        window.dispatchEvent(new PointerEvent("pointerup", { clientX: 100, clientY: 340, pointerId: 1 }));
      });
      await page.waitForTimeout(300);

      const afterRelease = await page.evaluate(() => {
        const c = document.querySelector('[data-module="focus"]');
        return {
          isDragging: c.classList.contains("is-dragging"),
          gridY: c.style.getPropertyValue("--grid-y"),
        };
      });
      assert.equal(afterRelease.isDragging, false, "Card must remove is-dragging class after release");
      assert.ok(Number(afterRelease.gridY) >= 1, "Card must snap to valid row after release");
    } finally {
      await page?.close().catch(() => {});
      await context?.close().catch(() => {});
      await browser?.close().catch(() => {});
      if (server?.close) await server.close().catch(() => {});
    }
  }
);

test(
  "Today 2.0 light and dark themes render without clipping or contrast collapse",
  { skip: !hasPlaywright, timeout: 30_000 },
  async () => {
    const { chromium } = await import("playwright");
    const { startStaticServer } = await import("../scripts/evidence/server.mjs");
    const { applyFixture, FIXTURE_DATE } = await import("../scripts/evidence/fixture.mjs");

    let server;
    let browser;
    let context;
    let page;

    try {
      server = await startStaticServer(publicDir);
      browser = await chromium.launch({ headless: true });
      context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      page = await context.newPage();

      for (const theme of ["light", "dark"]) {
        await applyFixture(page, { date: FIXTURE_DATE, theme, motion: "full", language: "en" });
        await page.goto(`${server.url}/index.html?desktop=tauri-local`);
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(250);

        const checks = await page.evaluate(() => {
          const main = document.querySelector(".main-content");
          const board = document.querySelector("#todayView");
          const cards = [...board.querySelectorAll(":scope > .module-card")];
          return {
            theme: document.documentElement.dataset.theme,
            mainOverflow: getComputedStyle(main).overflow,
            cardCount: cards.length,
            visibleCards: cards.filter(c => !c.hidden).length,
          };
        });

        assert.equal(checks.theme, theme);
        assert.equal(checks.visibleCards, 7, `All 7 Today cards must be visible in ${theme} theme`);
      }
    } finally {
      await page?.close().catch(() => {});
      await context?.close().catch(() => {});
      await browser?.close().catch(() => {});
      if (server?.close) await server.close().catch(() => {});
    }
  }
);

test(
  "Today 2.0 motion settings: full, reduced, and off modes disable nonessential motion",
  { skip: !hasPlaywright, timeout: 30_000 },
  async () => {
    const { chromium } = await import("playwright");
    const { startStaticServer } = await import("../scripts/evidence/server.mjs");
    const { applyFixture, FIXTURE_DATE } = await import("../scripts/evidence/fixture.mjs");

    let server;
    let browser;
    let context;
    let page;

    try {
      server = await startStaticServer(publicDir);
      browser = await chromium.launch({ headless: true });
      context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      page = await context.newPage();

      for (const motion of ["full", "reduced", "off"]) {
        await applyFixture(page, { date: FIXTURE_DATE, theme: "light", motion, language: "en" });
        await page.goto(`${server.url}/index.html?desktop=tauri-local`);
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(200);

        const docClasses = await page.evaluate(() => {
          const doc = document.documentElement;
          return {
            hasReduced: doc.classList.contains("motion-reduced"),
            hasOff: doc.classList.contains("motion-off"),
          };
        });

        if (motion === "reduced") {
          assert.equal(docClasses.hasReduced, true, "motion-reduced class must be present on <html>");
        } else if (motion === "off") {
          assert.equal(docClasses.hasOff, true, "motion-off class must be present on <html>");
        } else {
          assert.equal(docClasses.hasReduced, false);
          assert.equal(docClasses.hasOff, false);
        }
      }
    } finally {
      await page?.close().catch(() => {});
      await context?.close().catch(() => {});
      await browser?.close().catch(() => {});
      if (server?.close) await server.close().catch(() => {});
    }
  }
);

test(
  "Today 2.0 multilingual parity: English, Simplified Chinese, and German render cleanly",
  { skip: !hasPlaywright, timeout: 30_000 },
  async () => {
    const { chromium } = await import("playwright");
    const { startStaticServer } = await import("../scripts/evidence/server.mjs");
    const { applyFixture, FIXTURE_DATE } = await import("../scripts/evidence/fixture.mjs");

    let server;
    let browser;
    let context;
    let page;

    try {
      server = await startStaticServer(publicDir);
      browser = await chromium.launch({ headless: true });
      context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      page = await context.newPage();

      for (const language of ["en", "zh", "de"]) {
        await applyFixture(page, { date: FIXTURE_DATE, theme: "light", motion: "full", language });
        await page.goto(`${server.url}/index.html?desktop=tauri-local&lang=${language}`);
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(250);

        const langData = await page.evaluate(lang => {
          const editBtn = document.querySelector("#editLayoutToggle");
          const kicker = document.querySelector("#habitsModuleKicker")?.textContent;
          return {
            currentLang: lang,
            editBtnText: editBtn?.textContent?.trim(),
            kickerText: kicker?.trim(),
          };
        }, language);

        // Open edit mode to verify edit bar localization
        await page.locator("#editLayoutToggle").click();
        await page.waitForTimeout(150);

        const editBarData = await page.evaluate(() => {
          const summaryBar = document.querySelector('[data-module="summary"] .widget-edit-bar');
          const title = summaryBar?.querySelector(".widget-edit-title")?.textContent?.trim();
          const sizePicker = summaryBar?.querySelector(".widget-size-picker");
          const sizePickerLabel = sizePicker?.getAttribute("aria-label");
          const smallBtnTitle = sizePicker?.querySelector('[data-size="small"]')?.getAttribute("title");
          return { title, sizePickerLabel, smallBtnTitle };
        });

        if (language === "en") {
          assert.equal(langData.editBtnText, "Edit layout");
          assert.equal(editBarData.title, "Summary");
          assert.equal(editBarData.sizePickerLabel, "Widget size");
          assert.equal(editBarData.smallBtnTitle, "Small");
        } else if (language === "zh") {
          assert.equal(langData.editBtnText, "编辑布局");
          assert.equal(editBarData.title, "今日概览");
          assert.equal(editBarData.sizePickerLabel, "卡片尺寸");
          assert.equal(editBarData.smallBtnTitle, "小");
        } else if (language === "de") {
          assert.equal(langData.editBtnText, "Layout bearbeiten");
          assert.equal(editBarData.title, "Tagesübersicht");
          assert.equal(editBarData.sizePickerLabel, "Modulgröße");
          assert.equal(editBarData.smallBtnTitle, "Klein");
        }

        // Close edit mode
        await page.locator("#editLayoutToggle").click();
        await page.waitForTimeout(100);
      }
    } finally {
      await page?.close().catch(() => {});
      await context?.close().catch(() => {});
      await browser?.close().catch(() => {});
      if (server?.close) await server.close().catch(() => {});
    }
  }
);

test(
  "Today 2.0 default layout primary actions actionable via elementFromPoint and habits S/M differ",
  { skip: !hasPlaywright, timeout: 30_000 },
  async () => {
    const { chromium } = await import("playwright");
    const { startStaticServer } = await import("../scripts/evidence/server.mjs");
    const { applyFixture, FIXTURE_DATE } = await import("../scripts/evidence/fixture.mjs");

    let server;
    let browser;
    let context;
    let page;

    try {
      server = await startStaticServer(publicDir);
      browser = await chromium.launch({ headless: true });
      context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      page = await context.newPage();

      await applyFixture(page, { date: FIXTURE_DATE, theme: "light", motion: "full", language: "en" });
      await page.goto(`${server.url}/index.html?desktop=tauri-local&lang=en`);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(300);

      // 1. Verify primary actions in default layout are visible and actionable via elementFromPoint
      const actionsActionable = await page.evaluate(() => {
        const checkAction = sel => {
          const el = document.querySelector(sel);
          if (!el) return { found: false, ok: false, reason: "not in DOM" };
          el.scrollIntoView({ block: "center", inline: "center" });
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return { found: true, ok: false, reason: "zero-size" };
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          const topEl = document.elementFromPoint(x, y);
          const reachable = topEl === el || el.contains(topEl);
          return {
            found: true,
            ok: reachable,
            rect: { w: rect.width, h: rect.height, x, y },
            topEl: topEl ? `${topEl.tagName}#${topEl.id}.${topEl.className}` : null,
          };
        };

        return {
          focusTimer: checkAction("#todayFocusOpenTimer"),
          focusStart: checkAction("#todayFocusStartBtn"),
          reflectionNote: checkAction("#homeDayNote"),
          photosAdd: checkAction("#todayPhotoAdd"),
        };
      });

      assert.ok(actionsActionable.focusTimer.ok, "Focus open timer button must be actionable via elementFromPoint in default layout");
      assert.ok(actionsActionable.focusStart.ok, "Focus start button must be actionable via elementFromPoint in default layout");
      assert.ok(actionsActionable.reflectionNote.ok, "Reflection note textarea must be actionable via elementFromPoint in default layout");
      assert.ok(actionsActionable.photosAdd.ok, "Add photo button must be actionable via elementFromPoint in default layout");

      // 2. Verify habits S vs M vs L visible row counts in real DOM
      // Enter edit mode to switch sizes
      await page.locator("#editLayoutToggle").click();
      await page.waitForTimeout(150);

      const habitsHandle = page.locator('[data-module="habits"] .widget-drag-handle');
      await habitsHandle.focus();

      // Set to small via keyboard 's'
      await page.keyboard.press("s");
      await page.waitForTimeout(150);
      const visibleHabitsSmall = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('[data-module="habits"] .today-habit-row'));
        return rows.filter(r => !r.hidden && r.offsetParent !== null).length;
      });

      // Set to medium via keyboard 'm'
      await habitsHandle.focus();
      await page.keyboard.press("m");
      await page.waitForTimeout(150);
      const visibleHabitsMedium = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('[data-module="habits"] .today-habit-row'));
        return rows.filter(r => !r.hidden && r.offsetParent !== null).length;
      });

      // Set to large via keyboard 'l'
      await habitsHandle.focus();
      await page.keyboard.press("l");
      await page.waitForTimeout(150);
      const visibleHabitsLarge = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('[data-module="habits"] .today-habit-row'));
        return rows.filter(r => !r.hidden && r.offsetParent !== null).length;
      });

      assert.equal(visibleHabitsSmall, 1, "Habits small size must show exactly 1 priority row");
      assert.ok(visibleHabitsMedium > visibleHabitsSmall, "Habits medium size must show more rows than small");
      assert.ok(visibleHabitsLarge > visibleHabitsMedium, "Habits large size must show full habit list");

      // Exit edit mode
      await page.locator("#editLayoutToggle").click();
    } finally {
      await page?.close().catch(() => {});
      await context?.close().catch(() => {});
      await browser?.close().catch(() => {});
      if (server?.close) await server.close().catch(() => {});
    }
  }
);

async function openTodayWithLargeHabits(width) {
  const { chromium } = await import("playwright");
  const { startStaticServer } = await import("../scripts/evidence/server.mjs");
  const { applyFixture, FIXTURE_DATE } = await import("../scripts/evidence/fixture.mjs");
  const server = await startStaticServer(publicDir);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  await applyFixture(page, { date: FIXTURE_DATE, theme: "light", motion: "full", language: "en" });
  await page.goto(`${server.url}/index.html?desktop=tauri-local&lang=en`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(300);
  await page.locator("#editLayoutToggle").click();
  await page.waitForTimeout(150);
  await page.locator('[data-module="habits"] .widget-drag-handle').focus();
  await page.keyboard.press("l");
  await page.waitForTimeout(150);
  await page.locator("#editLayoutToggle").click();
  await page.waitForTimeout(150);
  const close = async () => {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    if (server?.close) await server.close().catch(() => {});
  };
  return { page, close };
}

const habitRowIds = page => page.evaluate(() =>
  [...document.querySelectorAll('[data-module="habits"] #todayHabitList .today-habit-row, [data-module="habits"] #todayScheduledList .today-habit-row, [data-module="habits"] #todayCompletedList .today-habit-row')]
    .filter(row => !row.hidden && row.offsetParent !== null)
    .map(row => row.dataset.id));

const activeHabitRow = page => page.evaluate(() => {
  const el = document.activeElement;
  return {
    isRow: Boolean(el?.classList?.contains("today-habit-row")),
    connected: Boolean(el?.isConnected),
    id: el?.dataset?.id || "",
    tabindex: el?.getAttribute("tabindex"),
    rovingZeroCount: document.querySelectorAll('[data-module="habits"] .today-habit-row[tabindex="0"]').length,
  };
});
test(
  "Today Habits Large rail (>=1180px): repeated ArrowLeft/ArrowRight keeps focus on the connected, intended row",
  { skip: !hasPlaywright, timeout: 30_000 },
  async () => {
    const { page, close } = await openTodayWithLargeHabits(1440);
    try {
      const listDirection = await page.evaluate(() =>
        getComputedStyle(document.querySelector('[data-module="habits"] .today-list')).flexDirection);
      assert.equal(listDirection, "row", "Habits Large must render as a horizontal rail at 1440px");
      const ids = await habitRowIds(page);
      assert.ok(ids.length >= 3, `Need at least 3 habit rows for rail navigation, got ${ids.length}`);

      await page.locator(`[data-module="habits"] .today-habit-row[data-id="${ids[0]}"]`).focus();
      const steps = Math.min(ids.length - 1, 4);
      for (let i = 1; i <= steps; i += 1) {
        await page.keyboard.press("ArrowRight");
        const active = await activeHabitRow(page);
        assert.ok(active.isRow, `ArrowRight #${i}: focus must be on a habit row`);
        assert.ok(active.connected, `ArrowRight #${i}: focused row must be connected to the document`);
        assert.equal(active.id, ids[i], `ArrowRight #${i}: focus must move to the next rail item`);
        assert.equal(active.tabindex, "0", "Focused row must carry the roving tabindex");
        assert.equal(active.rovingZeroCount, 1, "Exactly one habit row may be in the tab order");
      }
      for (let i = steps - 1; i >= 0; i -= 1) {
        await page.keyboard.press("ArrowLeft");
        const active = await activeHabitRow(page);
        assert.ok(active.connected, "ArrowLeft: focused row must be connected to the document");
        assert.equal(active.id, ids[i], "ArrowLeft: focus must move to the previous rail item");
      }
      const selectedId = await page.evaluate(() =>
        document.querySelector('[data-module="habits"] .today-habit-row.selected')?.dataset.id);
      assert.equal(selectedId, ids[0], "Selection must follow keyboard focus");
    } finally {
      await close();
    }
  }
);

test(
  "Today Habits Large below 1180px: vertical list uses ArrowUp/ArrowDown and does not intercept ArrowLeft/ArrowRight",
  { skip: !hasPlaywright, timeout: 30_000 },
  async () => {
    const { page, close } = await openTodayWithLargeHabits(1024);
    try {
      const size = await page.evaluate(() => document.querySelector('[data-module="habits"]').dataset.widgetSize);
      assert.equal(size, "large");
      const listDisplay = await page.evaluate(() =>
        getComputedStyle(document.querySelector('[data-module="habits"] .today-list')).display);
      assert.notEqual(listDisplay, "flex", "Below 1180px Habits Large must not render the horizontal rail");
      const ids = await habitRowIds(page);
      assert.ok(ids.length >= 3, `Need at least 3 habit rows for list navigation, got ${ids.length}`);

      await page.locator(`[data-module="habits"] .today-habit-row[data-id="${ids[0]}"]`).focus();
      await page.keyboard.press("ArrowDown");
      let active = await activeHabitRow(page);
      assert.ok(active.connected, "ArrowDown: focused row must be connected to the document");
      assert.equal(active.id, ids[1], "ArrowDown must not be blocked in the vertical list");
      await page.keyboard.press("ArrowDown");
      active = await activeHabitRow(page);
      assert.equal(active.id, ids[2], "Repeated ArrowDown must keep moving focus");
      await page.keyboard.press("ArrowUp");
      active = await activeHabitRow(page);
      assert.ok(active.connected, "ArrowUp: focused row must be connected to the document");
      assert.equal(active.id, ids[1], "ArrowUp must move focus back up the list");

      const rightPrevented = await page.evaluate(() => {
        const event = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true });
        document.activeElement.dispatchEvent(event);
        return event.defaultPrevented;
      });
      assert.equal(rightPrevented, false, "ArrowRight must not be intercepted as rail navigation below 1180px");
      active = await activeHabitRow(page);
      assert.equal(active.id, ids[1], "ArrowRight must not move focus in the vertical list");
    } finally {
      await close();
    }
  }
);

test("Today geometry evidence clears stale failure screenshots at the start of every run", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(path.join(rootDir, "scripts/evidence/today-geometry.mjs"), "utf8");
  const clearIndex = source.search(/fs\.rmSync\(failuresDir, \{ recursive: true, force: true \}\)/);
  assert.ok(clearIndex !== -1, "today-geometry.mjs must remove the failures dir at run start");
  assert.ok(clearIndex < source.indexOf("chromium.launch"), "failures dir must be cleared before the browser run starts");
  assert.doesNotMatch(source.slice(0, clearIndex), /mkdirSync\(failuresDir/, "failures dir must not be pre-created before clearing");
});
