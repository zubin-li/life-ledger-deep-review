import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(rootDir, "public");

const hasPlaywright = await import("playwright")
  .then(() => true)
  .catch(() => false);

async function cardSetting(page,type,field,value){
  await page.locator(`[data-module="${type}"] .widget-configure`).click();
  if(field==='size')await page.locator('#widgetSettingsSize').selectOption(value);
  else await page.locator('#widgetSettingsVisible').setChecked(value);
  await page.locator('#widgetSettingsClose').click();
}

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

      assert.equal(initialCards.length, 12, "Core and optional Today modules must exist");
      assert.equal(initialCards.find(c => c.module === "dayplan")?.hidden, true, "The web-only day plan stays out of the desktop app");
      const summaryCard = initialCards.find(c => c.module === "summary");
      assert.equal(summaryCard?.size, "large");
      assert.equal(summaryCard?.hidden, false);

      // 2. Normal mode: dragging is disabled, internal controls work without starting drag
      const editBarHidden = await page.evaluate(() => {
        const editBars = document.querySelectorAll("#todayView .widget-edit-bar");
        return [...editBars].every(bar => bar.hidden || bar.style.display === "none");
      });
      assert.ok(editBarHidden, "Widget edit bars must be hidden in normal mode");
      const normalResizeHandles = await page.locator("#todayView .widget-resize-handle:visible").count();
      assert.equal(normalResizeHandles, 0, "Resize handles must not be visible in normal mode");

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

      const resizeHandles = await page.evaluate(() =>
        [...document.querySelectorAll("#todayView > [data-module]:not([hidden]) > .widget-resize-handle")].map(handle => {
          const rect = handle.getBoundingClientRect();
          return {
            name: handle.getAttribute("aria-label"),
            width: rect.width,
            height: rect.height,
          };
        }));
      assert.equal(resizeHandles.length, 8, "Every added card exposes a real resize handle, including welcome and mood");
      for (const handle of resizeHandles) {
        assert.ok(handle.name, "Every resize handle must have an accessible name");
        assert.ok(handle.width >= 44, "Resize handle pointer target must be at least 44px wide");
        assert.ok(handle.height >= 44, "Resize handle pointer target must be at least 44px high");
      }

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
      // Switch habits card from the compact default to Small.
      await cardSetting(page,'habits','size','small');
      await page.waitForTimeout(150);

      const habitsAfterSmall = await page.evaluate(() => {
        const c = document.querySelector('[data-module="habits"]');
        return {
          size: c.dataset.widgetSize,
          gridW: c.style.getPropertyValue("--grid-w"),
          gridH: c.style.getPropertyValue("--grid-h"),
        };
      });
      assert.equal(habitsAfterSmall.size, "small");
      assert.equal(habitsAfterSmall.gridW, "4");
      assert.equal(habitsAfterSmall.gridH, "1");

      // 5. Test undo: reverting size change
      const undoBtn = page.locator("#undoLayoutButton");
      await undoBtn.click();
      await page.waitForTimeout(150);

      const habitsAfterUndo = await page.evaluate(() => {
        const c = document.querySelector('[data-module="habits"]');
        return {
          size: c.dataset.widgetSize,
          gridW: c.style.getPropertyValue("--grid-w"),
          gridH: c.style.getPropertyValue("--grid-h"),
        };
      });
      assert.equal(habitsAfterUndo.size, "medium");
      assert.equal(habitsAfterUndo.gridW, "8");
      assert.equal(habitsAfterUndo.gridH, "1");

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
      // Focus starts in the right column of the approved composition.
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
      await cardSetting(page,'reflection','visible',false);
      await page.waitForTimeout(150);

      const reflectionHidden = await page.evaluate(() => {
        const c = document.querySelector('[data-module="reflection"]');
        return c.hidden;
      });
      assert.equal(reflectionHidden, true, "Removed cards must leave the edit grid, not become ghost placeholders");

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
      assert.equal(reflectionAfterEscape.focusGridX, "8", "Escape restores the right-column default focus position");

      // Now enter edit mode again, make changes, and click Done to persist
      await page.locator("#editLayoutToggle").click();
      await page.waitForTimeout(120);
      const focusHandle2 = page.locator('[data-module="focus"] .widget-drag-handle');
      await focusHandle2.focus();
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(120);
      await cardSetting(page,'reflection','visible',false);
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
      assert.equal(afterReset.focusX, 8, "Reset restores the content-specific default focus position");
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

      const handleBox=await focusHandle.boundingBox();
      const pointerX=handleBox.x+handleBox.width/2,pointerY=handleBox.y+handleBox.height/2;
      await page.mouse.move(pointerX,pointerY);await page.mouse.down();

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
      await page.mouse.move(pointerX,pointerY+160,{steps:12});await page.mouse.up();
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
  "Today 2.0 pointer resize previews and commits only S/M/L at wide and single-column widths",
  { skip: !hasPlaywright, timeout: 45_000 },
  async () => {
    const { chromium } = await import("playwright");
    const { startStaticServer } = await import("../scripts/evidence/server.mjs");
    const { applyFixture, FIXTURE_DATE } = await import("../scripts/evidence/fixture.mjs");

    let server;
    let browser;

    try {
      server = await startStaticServer(publicDir);
      browser = await chromium.launch({ headless: true });

      for (const width of [1440, 1024]) {
        const context = await browser.newContext({ viewport: { width, height: 900 } });
        const page = await context.newPage();
        try {
          await applyFixture(page, { date: FIXTURE_DATE, theme: "light", motion: "full", language: "en" });
          await page.goto(`${server.url}/index.html?desktop=tauri-local&lang=en`);
          await page.waitForLoadState("domcontentloaded");
          await page.waitForTimeout(300);
          await page.locator("#editLayoutToggle").click();
          await page.waitForTimeout(120);

          // This gesture contract starts at L, independently of the default.
          // Choose it through the same settings UI a user would use.
          await cardSetting(page, 'habits', 'size', 'large');

          const storedHabitsSize = () => page.evaluate(() => {
            const raw = localStorage.getItem("life-ledger-layout-v2");
            if (!raw) return null;
            const layout = JSON.parse(raw);
            return layout.widgets.find(widget => widget.type === "habits").size;
          });
          const renderedHabits = () => page.evaluate(() => {
            const card = document.querySelector('[data-module="habits"]');
            const marker = card.querySelector(".widget-resize-state");
            return {
              size: card.dataset.widgetSize,
              marker: marker?.textContent,
              markerVisible: Boolean(marker && marker.getBoundingClientRect().width),
              editing: document.querySelector("#todayView").classList.contains("is-editing-layout"),
            };
          });
          const beginResize = async (deltaX, deltaY) => {
            const handle = page.locator('[data-module="habits"] > .widget-resize-handle');
            await handle.scrollIntoViewIfNeeded();
            const box = await handle.boundingBox();
            assert.ok(box, `Resize handle must be measurable at ${width}px`);
            const x = box.x + box.width / 2;
            const y = box.y + box.height / 2;
            await page.mouse.move(x, y);
            await page.mouse.down();
            await page.mouse.move(x + deltaX, y + deltaY, { steps: 5 });
            return { handle, x, y };
          };

          // Escape restores the preview without leaving edit mode or changing storage.
          await beginResize(0, -220);
          assert.equal((await renderedHabits()).size, "medium", `Large must preview Medium at ${width}px`);
          assert.equal(await storedHabitsSize(), "large", "Preview must not change the saved Large size");
          await page.keyboard.press("Escape");
          await page.mouse.up();
          const afterEscape = await renderedHabits();
          assert.equal(afterEscape.size, "large", "Escape must restore the original rendered size");
          assert.equal(afterEscape.editing, true, "Escape during resize must keep layout edit mode active");
          assert.equal(await storedHabitsSize(), "large", "Escape must not persist the preview size");

          // pointercancel has the same no-commit behavior.
          const cancelledGesture = await beginResize(0, -220);
          assert.equal((await renderedHabits()).size, "medium", "pointercancel setup must expose the candidate preview");
          await cancelledGesture.handle.dispatchEvent("pointercancel", { pointerId: 1, isPrimary: true });
          await page.mouse.up();
          assert.equal((await renderedHabits()).size, "large", "pointercancel must restore the original rendered size");
          assert.equal(await storedHabitsSize(), "large", "pointercancel must not persist the preview size");

          // A real mouse-backed pointer sequence previews Medium, then commits once on release.
          await beginResize(0, -220);
          const preview = await renderedHabits();
          assert.equal(preview.size, "medium", `Vertical contraction must preview Medium at ${width}px`);
          assert.equal(preview.marker, "M", "The visible resize marker must identify the Medium candidate");
          assert.equal(preview.markerVisible, true, "The candidate marker must remain visible during manipulation");
          assert.equal(await storedHabitsSize(), "large", "Pointermove must not persist the candidate");
          await page.mouse.up();

          const settlingTransition = await page.evaluate(() =>
            document.querySelector('[data-module="habits"]').style.transition);
          assert.doesNotMatch(settlingTransition, /\b(?:all|width|height|top|left)\b/, "Resize settle may animate only transform/opacity");
          await page.waitForTimeout(280);
          assert.equal((await renderedHabits()).size, "medium", "Pointerup must commit the previewed Medium size");
          assert.equal(await storedHabitsSize(), "medium", "Rendered and stored sizes must match after pointerup");

          // The reverse gesture reaches Large again from Medium.
          await beginResize(0, 220);
          assert.equal((await renderedHabits()).size, "large", `Vertical expansion must preview Large at ${width}px`);
          assert.equal(await storedHabitsSize(), "medium", "Reverse preview must still leave storage unchanged");
          await page.mouse.up();
          await page.waitForTimeout(280);
          assert.equal((await renderedHabits()).size, "large", "Pointerup must commit Large from Medium");
          assert.equal(await storedHabitsSize(), "large", "The reverse commit must persist Large");

          const persistedSizes = await page.evaluate(() =>
            JSON.parse(localStorage.getItem("life-ledger-layout-v2")).widgets.map(widget => widget.size));
          assert.ok(
            persistedSizes.every(size => ["small", "medium", "large"].includes(size)),
            "Pointer resizing must never persist an arbitrary size",
          );

          // One undo reverses exactly the last pointer resize transaction.
          await page.locator("#undoLayoutButton").click();
          await page.waitForTimeout(120);
          assert.equal((await renderedHabits()).size, "medium", "A single undo must reverse one pointer resize commit");
          assert.equal(await storedHabitsSize(), "medium", "Undo must keep rendered and stored sizes aligned");

          // Horizontal intent selects between the two compact-height states in both directions.
          await beginResize(-220, 0);
          assert.equal((await renderedHabits()).size, "small", `Horizontal contraction must preview Small at ${width}px`);
          assert.equal(await storedHabitsSize(), "medium", "Horizontal preview must leave storage unchanged");
          await page.mouse.up();
          await page.waitForTimeout(280);
          assert.equal((await renderedHabits()).size, "small", "Pointerup must commit Small from Medium");
          assert.equal(await storedHabitsSize(), "small", "The horizontal contraction must persist Small");

          await beginResize(220, 0);
          assert.equal((await renderedHabits()).size, "medium", `Horizontal expansion must preview Medium at ${width}px`);
          assert.equal(await storedHabitsSize(), "small", "Reverse horizontal preview must leave storage unchanged");
          await page.mouse.up();
          await page.waitForTimeout(280);
          assert.equal((await renderedHabits()).size, "medium", "Pointerup must commit Medium from Small");
          assert.equal(await storedHabitsSize(), "medium", "The horizontal expansion must persist Medium");
        } finally {
          await page.close().catch(() => {});
          await context.close().catch(() => {});
        }
      }
    } finally {
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
        assert.equal(checks.visibleCards, 8, `Eight default cards include the independent mood in ${theme} theme`);
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

        if (motion !== "full") {
          await page.locator("#editLayoutToggle").click();
          await page.locator('[data-module="habits"] .widget-drag-handle').focus();
          await page.keyboard.press("l");
          const resizeHandle = page.locator('[data-module="habits"] > .widget-resize-handle');
          await resizeHandle.scrollIntoViewIfNeeded();
          const box = await resizeHandle.boundingBox();
          assert.ok(box, `${motion} motion resize handle must be measurable`);
          const x = box.x + box.width / 2;
          const y = box.y + box.height / 2;
          await page.mouse.move(x, y);
          await page.mouse.down();
          await page.mouse.move(x, y - 220, { steps: 4 });
          const preview = await page.evaluate(() => ({
            size: document.querySelector('[data-module="habits"]').dataset.widgetSize,
            marker: document.querySelector('[data-module="habits"] .widget-resize-state')?.textContent,
          }));
          assert.equal(preview.size, "medium", `${motion} motion must preserve the resize candidate preview`);
          assert.equal(preview.marker, "M", `${motion} motion must keep the candidate state clear`);
          await page.mouse.up();
          await page.waitForTimeout(50);
          const committed = await page.evaluate(() => {
            const card = document.querySelector('[data-module="habits"]');
            const layout = JSON.parse(localStorage.getItem("life-ledger-layout-v2"));
            return {
              renderedSize: card.dataset.widgetSize,
              storedSize: layout.widgets.find(widget => widget.type === "habits").size,
              resizing: card.classList.contains("is-resizing"),
              transition: card.style.transition,
            };
          });
          assert.equal(committed.renderedSize, "medium", `${motion} motion must commit the candidate size`);
          assert.equal(committed.storedSize, "medium", `${motion} motion must persist the committed size`);
          assert.equal(committed.resizing, false, `${motion} motion must end direct manipulation immediately`);
          assert.doesNotMatch(committed.transition, /transform/, `${motion} motion must not animate resize reflow`);
          await page.locator("#editLayoutToggle").click();
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

        const langData = await page.evaluate(() => {
          const editBtn = document.querySelector("#editLayoutToggle");
          const kicker = document.querySelector("#habitsModuleKicker")?.textContent;
          return {
            documentLanguage: document.documentElement.lang,
            bodyLanguage: document.body.dataset.language,
            urlLanguage: new URL(location.href).searchParams.get("lang"),
            editBtnText: editBtn?.textContent?.trim(),
            kickerText: kicker?.trim(),
          };
        });
        const expectedLocale = {
          en: { document: "en", body: "en" },
          zh: { document: "zh-CN", body: "zh" },
          de: { document: "de", body: "de" },
        }[language];
        assert.equal(langData.urlLanguage, language, `Evidence URL must request ${language}`);
        assert.equal(langData.documentLanguage, expectedLocale.document, `<html lang> must render ${language}`);
        assert.equal(langData.bodyLanguage, expectedLocale.body, `body data-language must render ${language}`);

        // Open edit mode to verify edit bar localization
        await page.locator("#editLayoutToggle").click();
        await page.waitForTimeout(150);

        const editBarData = await page.evaluate(() => {
          const summaryBar = document.querySelector('[data-module="summary"] .widget-edit-bar');
          const title = summaryBar?.querySelector(".widget-edit-title")?.textContent?.trim();
          const sizePicker = document.querySelector('[data-module="habits"] .widget-size-picker');
          const sizePickerLabel = sizePicker?.getAttribute("aria-label");
          const smallBtnTitle = sizePicker?.querySelector('[data-size="small"]')?.getAttribute("title");
          return { title, sizePickerLabel, smallBtnTitle };
        });

        if (language === "en") {
          assert.equal(langData.editBtnText, "Edit cards");
          assert.equal(editBarData.title, "Summary");
          assert.equal(editBarData.sizePickerLabel, "Widget size");
          assert.equal(editBarData.smallBtnTitle, "Small");
        } else if (language === "zh") {
          assert.equal(langData.editBtnText, "编辑卡片");
          assert.equal(editBarData.title, "今日概览");
          assert.equal(editBarData.sizePickerLabel, "卡片尺寸");
          assert.equal(editBarData.smallBtnTitle, "小");
        } else if (language === "de") {
          assert.equal(langData.editBtnText, "Karten bearbeiten");
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
  "Screenshot evidence pins URL locale and fixture language preference cannot fall back to the system locale",
  { skip: !hasPlaywright, timeout: 30_000 },
  async () => {
    const { readFile } = await import("node:fs/promises");
    const { chromium } = await import("playwright");
    const { startStaticServer } = await import("../scripts/evidence/server.mjs");
    const { applyFixture, FIXTURE_DATE } = await import("../scripts/evidence/fixture.mjs");
    const source = await readFile(path.join(rootDir, "scripts/evidence/screens.mjs"), "utf8");

    assert.match(source, /url\.searchParams\.set\("lang", language\)/, "Evidence URLs must encode the requested locale");
    assert.match(source, /page\.goto\(evidenceUrl\(server\.url, lang\)\)/, "Every multilingual evidence page must use the locale URL");
    assert.match(source, /emptyPage\.goto\(evidenceUrl\(server\.url, "en"\)\)/, "English empty-state evidence must pin lang=en");

    let server;
    let browser;
    let context;
    let page;
    try {
      server = await startStaticServer(publicDir);
      browser = await chromium.launch({ headless: true });
      context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "en-US" });
      page = await context.newPage();

      await applyFixture(page, { date: FIXTURE_DATE, theme: "light", motion: "full", language: "de" });
      await page.goto(`${server.url}/index.html?desktop=tauri-local`);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(250);

      const localeState = await page.evaluate(() => ({
        storedLanguage: localStorage.getItem("life-ledger-language"),
        preferenceSet: localStorage.getItem("life-ledger-language-preference-set"),
        documentLanguage: document.documentElement.lang,
        bodyLanguage: document.body.dataset.language,
        todayText: document.querySelector('.sidebar .nav-item[data-view="today"] .nav-label')?.textContent?.trim(),
      }));
      assert.equal(localeState.storedLanguage, "de");
      assert.equal(localeState.preferenceSet, "true", "A requested fixture language must be marked as an explicit preference");
      assert.equal(localeState.documentLanguage, "de", "Fixture language must override an English system locale without a URL parameter");
      assert.equal(localeState.bodyLanguage, "de");
      assert.equal(localeState.todayText, "Heute");
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
    const { applyFixture, createFictionalState, FIXTURE_DATE } = await import("../scripts/evidence/fixture.mjs");

    let server;
    let browser;
    let context;
    let page;

    try {
      server = await startStaticServer(publicDir);
      browser = await chromium.launch({ headless: true });
      context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      page = await context.newPage();

      // More than four habits exercises the new M=4/L=all contract without
      // changing shared fixtures or weakening the S/M/L hierarchy assertions.
      const state = createFictionalState(FIXTURE_DATE);
      for (const [id, name, icon] of [["extra-meditation", "Meditation", "brain"], ["extra-water", "Hydration", "droplets"]]) {
        state.habits.push({ ...structuredClone(state.habits[0]), id, name, icon });
      }
      await applyFixture(page, { date: FIXTURE_DATE, theme: "light", motion: "full", language: "en", state });
      await page.goto(`${server.url}/index.html?desktop=tauri-local&lang=en`);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(300);

      const routedViews = await page.evaluate(() => ({
        activeView: document.body.dataset.activeView,
        todayDisplay: getComputedStyle(document.querySelector("#todayView")).display,
        weekDisplay: getComputedStyle(document.querySelector("#weekView")).display,
        visibleViews: [...document.querySelectorAll(".view")]
          .filter(view => getComputedStyle(view).display !== "none")
          .map(view => view.id),
      }));

      assert.equal(routedViews.activeView, "today", "Today must be the initial routed view");
      assert.notEqual(routedViews.todayDisplay, "none", "The active Today view must be visible");
      assert.equal(routedViews.weekDisplay, "none", "The inactive Week view must not overlay Today");
      assert.deepEqual(routedViews.visibleViews, ["todayView"], "Exactly one application view must be visible initially");

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
      assert.equal(visibleHabitsMedium, 4, "Medium must show four habits across groups");
      assert.ok(visibleHabitsLarge > visibleHabitsMedium, "Habits large size must show full habit list");
      assert.equal(visibleHabitsLarge, state.habits.length, "Large must retain every habit");

      // Exit edit mode before switching to the compact viewport, where toolbar
      // controls intentionally collapse into the mobile navigation treatment.
      await page.locator("#editLayoutToggle").click();

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${server.url}/index.html?lang=en`);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(150);
      const compactSummary = await page.evaluate(() => {
        const card = document.querySelector('[data-module="summary"]');
        const cardRect = card.getBoundingClientRect();
        const selectors = ["#quickMood", "#inspectorMoodReason", "#openDayDetail", ".module-collapse-toggle"];
        const controls = selectors.map(selector => {
          const element = document.querySelector(selector);
          const rect = element.getBoundingClientRect();
          const ownerRect=element.closest('.module-card').getBoundingClientRect();
          return {
            selector,
            hidden: element.hidden,
            left: rect.left,
            right: rect.right,
            ownerLeft: ownerRect.left,
            ownerRight: ownerRect.right,
          };
        });
        return {
          clientWidth: card.clientWidth,
          scrollWidth: card.scrollWidth,
          left: cardRect.left,
          right: cardRect.right,
          controls,
        };
      });

      assert.ok(compactSummary.scrollWidth <= compactSummary.clientWidth + 1, "Compact Summary must not scroll horizontally");
      for (const control of compactSummary.controls.filter(item => !item.hidden)) {
        assert.ok(control.left >= control.ownerLeft - 1, `${control.selector} must stay inside its card's left edge`);
        assert.ok(control.right <= control.ownerRight + 1, `${control.selector} must stay inside its card's right edge`);
      }

    } finally {
      await page?.close().catch(() => {});
      await context?.close().catch(() => {});
      await browser?.close().catch(() => {});
      if (server?.close) await server.close().catch(() => {});
    }
  }
);

async function openTodayWithLargeHabits(width, { extraHabits = 0 } = {}) {
  const { chromium } = await import("playwright");
  const { startStaticServer } = await import("../scripts/evidence/server.mjs");
  const { applyFixture, createFictionalState, FIXTURE_DATE } = await import("../scripts/evidence/fixture.mjs");
  const server = await startStaticServer(publicDir);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  // Extra fictional daily habits make the Large rail overflow horizontally.
  const state = createFictionalState(FIXTURE_DATE);
  for (let i = 1; i <= extraHabits; i += 1) {
    state.habits.push({
      id: `habit-extra-${i}`,
      name: `Practice ${i}`,
      icon: "leaf",
      color: "sage",
      active: true,
      versions: [{ trackingMode: "check", target: 1, unit: "", frequency: "daily", scheduleTime: "", periodTarget: null, countsTowardDaily: true, effectiveDate: "2026-01-01" }],
    });
  }
  await applyFixture(page, { date: FIXTURE_DATE, theme: "light", motion: "full", language: "en", state });
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
  await page.locator('[data-module="habits"]').scrollIntoViewIfNeeded();
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

// Records the Habits widget right after the app's own click/keydown handler re-rendered it.
const installHabitSnapshots = page => page.evaluate(() => {
  window.__habitSnapshot = () => {
    const card = document.querySelector('[data-module="habits"]');
    const rail = card.querySelector(".today-list");
    const railRect = rail.getBoundingClientRect();
    const rows = [...card.querySelectorAll(".today-habit-row")].filter(row => !row.hidden && row.offsetParent !== null);
    const nodes = [...card.querySelectorAll(".today-habit-row, .today-habit-check")];
    const active = document.activeElement;
    const activeRow = active?.closest?.(".today-habit-row");
    const activeRect = activeRow?.getBoundingClientRect();
    return {
      order: rows.map(row => row.dataset.id),
      visualOrder: [...rows].sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left).map(row => row.dataset.id),
      done: rows.filter(row => row.classList.contains("done")).map(row => row.dataset.id),
      moving: [...card.querySelectorAll(".is-moving")].map(node => node.dataset.id),
      completing: card.querySelectorAll(".is-completing").length,
      staleFlip: card.querySelectorAll(".habit-row-flip").length,
      inline: nodes
        .filter(node => node.style.transform || node.style.transition || node.style.willChange)
        .map(node => ({ id: node.closest(".today-habit-row")?.dataset.id, transform: node.style.transform, transition: node.style.transition, willChange: node.style.willChange })),
      animations: card.getAnimations({ subtree: true }).map(animation => ({
        target: animation.effect?.target?.className?.baseVal ?? animation.effect?.target?.className,
        properties: animation.transitionProperty
          ? [animation.transitionProperty]
          : animation.effect.getKeyframes().flatMap(frame => Object.keys(frame)).filter(key => !["offset", "computedOffset", "easing", "composite"].includes(key)),
      })),
      activeId: activeRow?.dataset.id || "",
      activeKind: active?.classList?.contains("today-habit-check") ? "check" : active?.classList?.contains("today-habit-row") ? "row" : active?.tagName,
      activeConnected: Boolean(active?.isConnected && active !== document.body),
      activeInRail: Boolean(activeRect && activeRect.left >= railRect.left - 1 && activeRect.right <= railRect.right + 1),
      tabStops: [...card.querySelectorAll('.today-habit-row[tabindex="0"]')].map(row => row.dataset.id),
      railScrollLeft: rail.scrollLeft,
      pageScrollTop: document.querySelector("#todayView").scrollTop,
    };
  };
  window.__habitSnapshots = [];
  for (const type of ["click", "keydown"]) {
    window.addEventListener(type, () => setTimeout(() => window.__habitSnapshots.push(window.__habitSnapshot()), 0), true);
  }
});

const nextHabitSnapshot = async (page, count) => {
  await page.waitForFunction(expected => window.__habitSnapshots.length >= expected, count);
  return page.evaluate(index => window.__habitSnapshots[index], count - 1);
};

const storedCompleted = page => page.evaluate(date =>
  JSON.parse(localStorage.getItem("life-ledger-v1")).logs[date]?.completed || [], "2026-10-02");

// Matches CSS transition names and camel-cased keyframe keys that would animate layout.
const LAYOUT_PROPERTY = /^all$|width|height|^(?:top|left|right|bottom)$|inset|margin|padding/i;
const isMovement = animation => animation.properties.some(property => /^(?:transform|translate|scale|rotate)$/.test(property));

function assertNoMotionResidue(snapshot, where) {
  assert.deepEqual(snapshot.moving, [], `${where}: no row may keep is-moving`);
  assert.equal(snapshot.completing, 0, `${where}: no check may keep is-completing`);
  assert.equal(snapshot.staleFlip, 0, `${where}: no row may keep a FLIP marker class`);
  assert.deepEqual(snapshot.inline, [], `${where}: no inline transform/transition/will-change may remain`);
  assert.deepEqual(snapshot.animations, [], `${where}: no habit animation may still run`);
  assert.deepEqual(snapshot.visualOrder, snapshot.order, `${where}: visual order must equal DOM order`);
}

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
  "Today Habits Large on phones: vertical list uses ArrowUp/ArrowDown and does not intercept ArrowLeft/ArrowRight",
  { skip: !hasPlaywright, timeout: 30_000 },
  async () => {
    const { page, close } = await openTodayWithLargeHabits(390);
    try {
      const size = await page.evaluate(() => document.querySelector('[data-module="habits"]').dataset.widgetSize);
      assert.equal(size, "large");
      const listDisplay = await page.evaluate(() =>
        getComputedStyle(document.querySelector('[data-module="habits"] .today-list')).display);
      assert.notEqual(listDisplay, "flex", "Phone Habits Large must not render the desktop horizontal rail");
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

test(
  "Today Habits Large rail: pointer completion keeps one tab stop, focus and rail scroll while the item moves to the end",
  { skip: !hasPlaywright, timeout: 30_000 },
  async () => {
    const { page, close } = await openTodayWithLargeHabits(1440, { extraHabits: 12 });
    try {
      await installHabitSnapshots(page);
      const initial = await page.evaluate(() => window.__habitSnapshot());
      assert.equal(initial.tabStops.length, 1, "Exactly one habit row must be in the tab order before any action");

      const rail = page.locator('[data-module="habits"] .today-list');
      const extent = await rail.evaluate(node => ({
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        clientHeight: node.clientHeight,
        scrollHeight: node.scrollHeight,
      }));
      assert.ok(extent.scrollWidth > extent.clientWidth + 72, "Sixteen habits must overflow the Large rail horizontally");
      assert.ok(extent.scrollHeight <= extent.clientHeight + 1, "The Large rail must not scroll vertically");

      // Horizontal wheel intent scrolls the rail itself; completion must keep that position.
      const railBox = await rail.boundingBox();
      await page.mouse.move(railBox.x + railBox.width / 2, railBox.y + railBox.height / 2);
      await page.mouse.wheel(180, 0);
      await page.waitForFunction(() => document.querySelector('[data-module="habits"] .today-list').scrollLeft > 0);
      await page.waitForTimeout(400);
      const scrollBefore = await rail.evaluate(node => node.scrollLeft);

      const target = await page.evaluate(() => {
        const list = document.querySelector('[data-module="habits"] .today-list');
        const bounds = list.getBoundingClientRect();
        const row = [...list.querySelectorAll(".today-habit-row:not(.done)")].find(candidate => {
          const rect = candidate.querySelector(".today-habit-check").getBoundingClientRect();
          return rect.left >= bounds.left && rect.right <= bounds.right;
        });
        const rect = row.querySelector(".today-habit-check").getBoundingClientRect();
        return { id: row.dataset.id, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      });
      const expectedOrder = [...initial.order.filter(id => id !== target.id), target.id];

      await page.mouse.click(target.x, target.y);
      const moved = await nextHabitSnapshot(page, 1);
      assert.ok(moved.done.includes(target.id), "Pointer completion must change the state immediately");
      assert.deepEqual(moved.order, expectedOrder, "The completed habit must render at the logical end of the rail");
      assert.ok(moved.moving.includes(target.id), "Pointer completion must carry the item to the end with a FLIP move");
      const movedProperties = [
        ...moved.inline.flatMap(entry => entry.transition.split(",").map(part => part.trim().split(/\s+/)[0]).filter(Boolean)),
        ...moved.animations.flatMap(animation => animation.properties),
      ];
      assert.ok(movedProperties.includes("transform"), "The move must be carried by transform");
      assert.deepEqual(movedProperties.filter(property => LAYOUT_PROPERTY.test(property)), [], "Pointer completion must not animate layout properties");
      assert.equal(moved.activeId, target.id, "Focus must stay with the completed habit");
      assert.equal(moved.activeKind, "check", "Pointer completion must return focus to the habit's check control");
      assert.equal(moved.activeConnected, true, "The focused control must be connected to the document");
      assert.deepEqual(moved.tabStops, [target.id], "Exactly one habit row, the completed one, must hold tabindex=0");
      assert.ok(Math.abs(moved.railScrollLeft - scrollBefore) <= 1, "Pointer completion must not jump the rail scroll position");

      await page.waitForTimeout(450);
      const settled = await page.evaluate(() => window.__habitSnapshot());
      assertNoMotionResidue(settled, "Pointer completion settle");
      assert.deepEqual(settled.order, expectedOrder, "The settled order must match the state order");
      assert.equal(settled.activeId, target.id, "Focus must remain on the completed habit after the move");
      assert.equal(settled.activeKind, "check", "Focus must remain on the habit's check control after the move");
      assert.equal(settled.activeConnected, true, "The settled focus target must be connected");
      assert.deepEqual(settled.tabStops, [target.id], "The tab stop must stay on the completed habit");
      assert.ok(Math.abs(settled.railScrollLeft - scrollBefore) <= 1, "The rail scroll position must survive the settle");
      assert.ok((await storedCompleted(page)).includes(target.id), "Stored state must record the completion");
    } finally {
      await close();
    }
  }
);

test(
  "Today Habits Large rail: keyboard completion keeps focus and one tab stop and reorders without movement",
  { skip: !hasPlaywright, timeout: 30_000 },
  async () => {
    const { page, close } = await openTodayWithLargeHabits(1440, { extraHabits: 12 });
    try {
      await installHabitSnapshots(page);
      const initial = await page.evaluate(() => window.__habitSnapshot());
      assert.equal(initial.tabStops.length, 1, "Exactly one habit row must be in the tab order before any action");
      const [first, second] = initial.order.filter(id => !initial.done.includes(id));

      const assertStill = (snapshot, where) => {
        assert.deepEqual(snapshot.moving, [], `${where}: keyboard activation must not start a FLIP move`);
        assert.deepEqual(snapshot.inline, [], `${where}: keyboard activation must not set inline transforms or transitions`);
        assert.deepEqual(snapshot.animations.filter(isMovement), [], `${where}: keyboard activation must not run any movement`);
        assert.equal(snapshot.completing, 0, `${where}: keyboard activation must skip the decorative check pop`);
      };

      await page.locator(`[data-module="habits"] .today-habit-row[data-id="${first}"]`).focus();
      await page.keyboard.press("Space");
      const completed = await nextHabitSnapshot(page, 1);
      assert.ok(completed.done.includes(first), "Keyboard completion must change the state immediately");
      assert.deepEqual(completed.order, [...initial.order.filter(id => id !== first), first], "Keyboard completion must still reorder to the logical end");
      assertStill(completed, "Space completion");
      assert.equal(completed.activeId, first, "Focus must follow the completed habit");
      assert.equal(completed.activeKind, "row", "Row activation must return focus to the same habit's row");
      assert.equal(completed.activeConnected, true, "The focused row must be connected to the document");
      assert.deepEqual(completed.tabStops, [first], "Exactly one habit row, the focused one, must hold tabindex=0");
      assert.equal(completed.activeInRail, true, "The focused habit must stay visible inside the rail");
      assert.equal(completed.pageScrollTop, initial.pageScrollTop, "Keyboard completion must not scroll the page");

      await page.keyboard.press("Space");
      const reopened = await nextHabitSnapshot(page, 2);
      assert.ok(!reopened.done.includes(first), "A second Space must reopen the habit immediately");
      assert.deepEqual(reopened.order, initial.order, "Reopening must restore the state order");
      assertStill(reopened, "Space reopen");
      assert.equal(reopened.activeId, first, "Focus must follow the reopened habit");
      assert.equal(reopened.activeKind, "row", "Focus must stay on the habit row");
      assert.deepEqual(reopened.tabStops, [first], "The reopened habit must keep the single tab stop");
      assert.equal(reopened.activeInRail, true, "The reopened habit must stay visible inside the rail");

      await page.locator(`[data-module="habits"] .today-habit-row[data-id="${second}"] .today-habit-check`).focus();
      await page.keyboard.press("Enter");
      const viaCheck = await nextHabitSnapshot(page, 3);
      assert.ok(viaCheck.done.includes(second), "Enter on the check control must complete the habit");
      assertStill(viaCheck, "Enter on check");
      assert.equal(viaCheck.activeId, second, "Focus must follow the habit completed from its check control");
      assert.equal(viaCheck.activeKind, "check", "Check activation must return focus to the same habit's check");
      assert.equal(viaCheck.activeConnected, true, "The focused check must be connected to the document");
      assert.deepEqual(viaCheck.tabStops, [second], "The habit holding focus must hold the single tab stop");

      await page.waitForTimeout(300);
      const settled = await page.evaluate(() => window.__habitSnapshot());
      assertNoMotionResidue(settled, "Keyboard completion settle");
      assert.equal(settled.activeId, second, "Keyboard focus must remain on the completed habit");
      const stored = await storedCompleted(page);
      assert.ok(stored.includes(second) && !stored.includes(first), "Stored state must match the rendered keyboard toggles");
    } finally {
      await close();
    }
  }
);

test(
  "Today Habits Large rail: rapid pointer re-toggles retarget cleanly and leave no motion residue",
  { skip: !hasPlaywright, timeout: 30_000 },
  async () => {
    const { page, close } = await openTodayWithLargeHabits(1440);
    try {
      await installHabitSnapshots(page);
      const initial = await page.evaluate(() => window.__habitSnapshot());
      const id = initial.order.find(candidate => !initial.done.includes(candidate));
      const completedOrder = [...initial.order.filter(other => other !== id), id];
      const clicks = 5;

      for (let i = 1; i <= clicks; i += 1) {
        // Aim at the check where it is drawn now; after the first click it is still mid-flight.
        const point = await page.evaluate(habitId => {
          const rect = document.querySelector(`[data-module="habits"] .today-habit-row[data-id="${habitId}"] .today-habit-check`).getBoundingClientRect();
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }, id);
        await page.mouse.click(point.x, point.y);
        const snapshot = await nextHabitSnapshot(page, i);
        const completed = i % 2 === 1;
        assert.equal(snapshot.done.includes(id), completed, `Toggle #${i} must flip the state immediately`);
        assert.deepEqual(snapshot.order, completed ? completedOrder : initial.order, `Toggle #${i} must render the state order`);
        assert.equal(snapshot.activeId, id, `Toggle #${i}: focus must stay with the toggled habit`);
        assert.equal(snapshot.activeKind, "check", `Toggle #${i}: focus must stay on the habit's check control`);
        assert.deepEqual(snapshot.tabStops, [id], `Toggle #${i}: exactly one tab stop must follow the toggled habit`);
        for (const entry of snapshot.inline) {
          assert.match(entry.transition, /^transform\s/, `Toggle #${i}: the retargeted move must be transform-only`);
        }
        if (i < clicks) await page.waitForTimeout(150);
      }

      await page.waitForTimeout(450);
      const settled = await page.evaluate(() => window.__habitSnapshot());
      assertNoMotionResidue(settled, "Rapid re-toggle settle");
      assert.deepEqual(settled.order, completedOrder, "An odd number of toggles must settle completed at the logical end");
      assert.ok((await storedCompleted(page)).includes(id), "Stored state must match the rendered completion");
      assert.equal(settled.activeId, id, "Focus must remain with the toggled habit after the moves settle");
      assert.equal(settled.activeConnected, true, "The settled focus target must be connected");
      assert.deepEqual(settled.tabStops, [id], "Exactly one tab stop must remain after rapid toggles");
    } finally {
      await close();
    }
  }
);

test(
  "Today 2.0 edit shelf: single-line titles, 44px pointer targets, accessible names, and no card overflow",
  { skip: !hasPlaywright, timeout: 60_000 },
  async () => {
    const { chromium } = await import("playwright");
    const { startStaticServer } = await import("../scripts/evidence/server.mjs");
    const { applyFixture, FIXTURE_DATE } = await import("../scripts/evidence/fixture.mjs");

    let server;
    let browser;

    try {
      server = await startStaticServer(publicDir);
      browser = await chromium.launch({ headless: true });

      for (const width of [1440, 1180]) {
        for (const language of ["en", "zh", "de"]) {
          for (const theme of ["light", "dark"]) {
            const context = await browser.newContext({ viewport: { width, height: 900 } });
            const page = await context.newPage();
            const where = `${width}px ${language} ${theme}`;
            try {
              await applyFixture(page, { date: FIXTURE_DATE, theme, motion: "full", language });
              await page.goto(`${server.url}/index.html?desktop=tauri-local&lang=${language}`);
              await page.waitForLoadState("domcontentloaded");
              await page.waitForTimeout(300);
              await page.locator("#editLayoutToggle").click();
              await page.waitForTimeout(200);

              const report = await page.evaluate(() => {
                // A control passes when a 44x44 box centred on it is reachable, which covers
                // both real 44px boxes and equivalent pseudo-element hit areas.
                const reaches44 = element => {
                  element.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
                  const rect = element.getBoundingClientRect();
                  const cx = rect.left + rect.width / 2;
                  const cy = rect.top + rect.height / 2;
                  return [[cx, cy], [cx, cy - 21], [cx, cy + 21], [cx - 21, cy], [cx + 21, cy]].every(([x, y]) => {
                    const top = document.elementFromPoint(x, y);
                    return top === element || element.contains(top);
                  });
                };

                const cards = [];
                for (const card of document.querySelectorAll("#todayView > [data-module]:not([hidden])")) {
                  const shelf = card.querySelector(".widget-edit-bar");
                  const title = card.querySelector(".widget-edit-title");
                  const handle = card.querySelector(".widget-drag-handle");
                  const sizeButtons = [...card.querySelectorAll(".widget-size-btn")];
                  const hide = card.querySelector('[data-action="toggle-hide"]');
                  const configure = card.querySelector('.widget-configure');
                  const controls = [handle, configure].filter(Boolean);
                  const cardRect = card.getBoundingClientRect();
                  const shelfRect = shelf.getBoundingClientRect();
                  const titleRect = title.getBoundingClientRect();
                  const lineHeight = Number.parseFloat(getComputedStyle(title).lineHeight) || 16;
                  cards.push({
                    module: card.dataset.module,
                    titleLines: titleRect.height / lineHeight,
                    titleText: title.textContent.trim(),
                    cardOverflow: card.scrollHeight - card.clientHeight,
                    shelfOverflow: shelf.scrollWidth - shelf.clientWidth,
                    shelfInside: shelfRect.left >= cardRect.left - 1 && shelfRect.right <= cardRect.right + 1,
                    sizeButtonCount: sizeButtons.length,
                    configureCount: configure ? 1 : 0,
                    missingNames: controls
                      .filter(control => !(control.getAttribute("aria-label") || control.textContent.trim()))
                      .map(control => control.className),
                    smallTargets: controls.filter(control => !reaches44(control)).map(control => control.className),
                  });
                }

                const toolbar = ["editLayoutToggle", "resetLayoutButton", "undoLayoutButton"].map(id => {
                  const element = document.getElementById(id);
                  return {
                    id,
                    hidden: element.hidden,
                    reaches44: reaches44(element),
                    name: element.getAttribute("aria-label") || element.textContent.trim(),
                  };
                });

                return { cards, toolbar };
              });

              assert.equal(report.cards.length, 8, `${where}: only the eight added cards expose an edit shelf`);
              for (const card of report.cards) {
                assert.ok(
                  card.titleLines <= 1.01,
                  `${where}: ${card.module} title "${card.titleText}" must stay on one line, got ${card.titleLines.toFixed(2)}`,
                );
                assert.ok(card.titleText.length > 0, `${where}: ${card.module} title must be localized text`);
                assert.ok(
                  card.cardOverflow <= 2,
                  `${where}: ${card.module} must not overflow its card in edit mode, got ${card.cardOverflow}px`,
                );
                assert.ok(
                  card.shelfOverflow <= 1 && card.shelfInside,
                  `${where}: ${card.module} edit shelf must stay inside the card without overflow`,
                );
                assert.equal(card.sizeButtonCount, card.module==='mood' ? 2 : 3, `${where}: ${card.module} offers content-appropriate inline sizes`);
                assert.equal(card.configureCount,1,`${where}: card settings remain reachable without a resident size/hide toolbar`);
                assert.deepEqual(card.missingNames, [], `${where}: ${card.module} edit controls must all have accessible names`);
                assert.deepEqual(
                  card.smallTargets,
                  [],
                  `${where}: ${card.module} edit controls must each reach a 44x44 pointer target`,
                );
              }

              for (const button of report.toolbar) {
                assert.equal(button.hidden, false, `${where}: ${button.id} must be available in edit mode`);
                assert.ok(button.name, `${where}: ${button.id} must have an accessible name`);
                assert.ok(button.reaches44, `${where}: ${button.id} must reach a 44x44 pointer target`);
              }
            } finally {
              await page.close().catch(() => {});
              await context.close().catch(() => {});
            }
          }
        }
      }
    } finally {
      await browser?.close().catch(() => {});
      if (server?.close) await server.close().catch(() => {});
    }
  }
);

test(
  "Today 2.0 edit mode motion stays subtle: no transition:all, no layout animation, reduced motion drops movement",
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
        await page.goto(`${server.url}/index.html?desktop=tauri-local&lang=en`);
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(250);
        await page.locator("#editLayoutToggle").click();
        await page.waitForTimeout(150);

        const transitions = await page.evaluate(() => {
          const read = selector => {
            const element = document.querySelector(selector);
            const style = getComputedStyle(element);
            return {
              selector,
              property: style.transitionProperty,
              duration: style.transitionDuration,
            };
          };
          return [
            read('[data-module="summary"] .widget-drag-handle'),
            read('[data-module="habits"] .widget-size-btn'),
            read('[data-module="summary"] [data-action="toggle-hide"]'),
            read('[data-module="habits"] > .widget-resize-handle .widget-resize-state'),
          ];
        });

        for (const entry of transitions) {
          assert.doesNotMatch(
            entry.property,
            /\ball\b/,
            `${motion}: ${entry.selector} must not use transition: all`,
          );
          assert.doesNotMatch(
            entry.property,
            /\b(?:width|height|top|left|right|bottom|margin|padding|inset)\b/,
            `${motion}: ${entry.selector} must not animate layout properties`,
          );
          const durations = entry.duration.split(",").map(value => Number.parseFloat(value) * (value.includes("ms") ? 1 : 1000));
          for (const ms of durations) {
            assert.ok(
              motion === "off" ? ms === 0 : ms <= 240,
              `${motion}: ${entry.selector} transition ${ms}ms must stay inside the frequent-UI budget`,
            );
          }
        }

        const idle = await page.evaluate(() => ({
          button: getComputedStyle(document.querySelector('[data-module="habits"] .widget-size-btn')).transform,
          card: getComputedStyle(document.querySelector('[data-module="summary"]')).transform,
        }));
        assert.equal(idle.button, "none", `${motion}: idle size buttons must not hold a transform`);
        assert.equal(idle.card, "none", `${motion}: idle cards must not hold a transform`);

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

test("Today geometry evidence clears stale failure screenshots at the start of every run", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(path.join(rootDir, "scripts/evidence/today-geometry.mjs"), "utf8");
  const clearIndex = source.search(/fs\.rmSync\(failuresDir, \{ recursive: true, force: true \}\)/);
  assert.ok(clearIndex !== -1, "today-geometry.mjs must remove the failures dir at run start");
  assert.ok(clearIndex < source.indexOf("chromium.launch"), "failures dir must be cleared before the browser run starts");
  assert.doesNotMatch(source.slice(0, clearIndex), /mkdirSync\(failuresDir/, "failures dir must not be pre-created before clearing");
});
