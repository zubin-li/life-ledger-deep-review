import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startStaticServer } from "./server.mjs";
import {
  applyFixture,
  createFictionalState,
  createEmptyFictionalState,
  FIXTURE_DATE,
} from "./fixture.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../");
const publicDir = path.join(rootDir, "public");
const outputDir = process.env.EVIDENCE_DIR
  ? path.resolve(process.env.EVIDENCE_DIR.startsWith("/") ? process.env.EVIDENCE_DIR : path.join(rootDir, process.env.EVIDENCE_DIR))
  : path.join(rootDir, "docs/phase-3-5-1");
const failuresDir = path.join(outputDir, "today-geometry-failures");

fs.mkdirSync(outputDir, { recursive: true });
// Start every run from a clean failure-artifact state; the dir is recreated only when this run writes a failure screenshot.
fs.rmSync(failuresDir, { recursive: true, force: true });

const WIDTHS = [1024, 1180, 1440, 1728];
const THEMES = ["light", "dark"];
const LANGUAGES = ["en", "zh", "de"];
const FIXTURES = ["empty", "typical", "stress"];
const COLUMNS = 12;

function createStressFictionalState(date = FIXTURE_DATE) {
  const base = createFictionalState(date);
  const habits = [];
  for (let i = 1; i <= 12; i += 1) {
    habits.push({
      id: `habit-stress-${i}`,
      name: i === 7 ? "Sehr lange deutsche Gewohnheitsbezeichnung für Stresslayout" : `Stress habit ${i}`,
      icon: "circle",
      color: "sage",
      active: true,
      versions: [{
        trackingMode: "check",
        target: 1,
        unit: "",
        frequency: "daily",
        scheduleTime: i % 3 === 0 ? "09:00" : "",
        periodTarget: null,
        countsTowardDaily: true,
        effectiveDate: "2026-01-01",
      }],
    });
  }
  const longReflection = "Dies ist eine absichtlich lange deutsche Reflexion für Stressdaten. ".repeat(12);
  base.habits = habits;
  base.logs[date] = {
    ...base.logs[date],
    note: longReflection,
    photos: [
      { id: "p1", caption: "One", dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" },
      { id: "p2", caption: "Two", dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" },
      { id: "p3", caption: "Three", dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" },
    ],
  };
  return base;
}

function fail(results, id, detail) {
  results.push({ id, status: "fail", detail });
  return false;
}

function pass(results, id, detail) {
  results.push({ id, status: "pass", detail });
  return true;
}

/** Shared with layout-engine drop mapping (evidence mirror). */
const gridMeasureFns = `
  function parseTracks(raw) {
    return String(raw || "")
      .split(/\\s+/)
      .map(token => {
        const trimmed = token.trim();
        if (!trimmed || trimmed === "none") return 0;
        const px = /^([\\d.]+)px$/.exec(trimmed);
        if (px) return parseFloat(px[1]);
        const num = parseFloat(trimmed);
        return Number.isFinite(num) ? num : 0;
      })
      .filter(n => n > 0);
  }
  function measureGrid(board) {
    const style = window.getComputedStyle(board);
    const colGap = parseFloat(style.columnGap) || 0;
    const rowGap = parseFloat(style.rowGap) || 0;
    let colTracks = parseTracks(style.gridTemplateColumns);
    let rowTracks = parseTracks(style.gridTemplateRows);
    const rect = board.getBoundingClientRect();
    if (!colTracks.length && rect.width > 0) {
      const colWidth = (rect.width - colGap * (${COLUMNS} - 1)) / ${COLUMNS};
      colTracks = Array.from({ length: ${COLUMNS} }, () => colWidth);
    }
    if (!rowTracks.length) rowTracks = [180];
    rowTracks = rowTracksFromPlacedCards(board, rowTracks);
    const anchors = measureRowAnchors(board, rowGap, rowTracks);
    if (anchors.rowStarts?.length) rowTracks = anchors.rowTracks;
    return { colTracks, rowTracks, rowStarts: anchors.rowStarts, colGap, rowGap };
  }
  function measureRowAnchors(board, rowGap, fallbackTracks) {
    const containerRect = board.getBoundingClientRect();
    const cards = [...board.querySelectorAll(":scope > [data-module]:not([hidden])")].filter(
      card => !card.classList.contains("is-dragging"),
    );
    const topsByY = new Map();
    let maxY = 0;
    for (const card of cards) {
      const y = Number.parseInt(card.style.getPropertyValue("--grid-y"), 10) || 0;
      const top = card.getBoundingClientRect().top - containerRect.top;
      topsByY.set(y, topsByY.has(y) ? Math.min(topsByY.get(y), top) : top);
      maxY = Math.max(maxY, y);
    }
    if (!topsByY.size) return { rowStarts: [0], rowTracks: fallbackTracks.length ? fallbackTracks : [180] };
    const rowStarts = [];
    const rowTracks = [];
    for (let i = 0; i <= maxY; i += 1) {
      if (topsByY.has(i)) rowStarts[i] = topsByY.get(i);
      else if (i === 0) rowStarts[i] = 0;
      else {
        const prevTrack = rowTracks[i - 1] || fallbackTracks[i - 1] || 180;
        rowStarts[i] = (rowStarts[i - 1] ?? 0) + prevTrack + rowGap;
      }
      let nextStart = null;
      for (let j = i + 1; j <= maxY; j += 1) {
        if (topsByY.has(j)) {
          nextStart = topsByY.get(j);
          break;
        }
      }
      if (nextStart != null) rowTracks[i] = Math.max(1, nextStart - rowStarts[i] - rowGap);
      else {
        let maxBottom = rowStarts[i];
        for (const card of cards) {
          const cy = Number.parseInt(card.style.getPropertyValue("--grid-y"), 10) || 0;
          if (cy !== i) continue;
          const rect = card.getBoundingClientRect();
          maxBottom = Math.max(maxBottom, rect.bottom - containerRect.top);
        }
        rowTracks[i] = Math.max(maxBottom - rowStarts[i], fallbackTracks[i] || 180);
      }
    }
    return { rowStarts, rowTracks };
  }
  function rowTracksFromPlacedCards(board, fallbackTracks) {
    const cards = [...board.querySelectorAll(":scope > [data-module]:not([hidden])")];
    if (!cards.length) return fallbackTracks;
    const heights = new Map();
    for (const card of cards) {
      const y = Number.parseInt(card.style.getPropertyValue("--grid-y"), 10) || 0;
      const h = card.getBoundingClientRect().height;
      if (h > 0) heights.set(y, Math.max(heights.get(y) || 0, h));
    }
    if (!heights.size) return fallbackTracks;
    const maxRow = Math.max(...heights.keys(), fallbackTracks.length - 1);
    const tracks = [];
    for (let i = 0; i <= maxRow; i += 1) {
      tracks.push(heights.get(i) || fallbackTracks[i] || fallbackTracks[fallbackTracks.length - 1] || 180);
    }
    return tracks;
  }
  function trackStarts(tracks, gap) {
    const starts = [];
    let acc = 0;
    for (let i = 0; i < tracks.length; i++) {
      starts.push(acc);
      acc += tracks[i] + gap;
    }
    return starts;
  }
  function nearestTrackIndex(offsetPx, tracks, gap) {
    if (!tracks.length) return 0;
    const starts = trackStarts(tracks, gap);
    let bestIdx = 0;
    let bestDist = Math.abs(offsetPx - starts[0]);
    for (let i = 1; i < starts.length; i++) {
      const dist = Math.abs(offsetPx - starts[i]);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    const lastStart = starts[starts.length - 1];
    const lastSize = tracks[tracks.length - 1] || 180;
    const step = lastSize + gap;
    if (offsetPx > lastStart + 1 && step > 0) {
      const extraRows = Math.round((offsetPx - lastStart) / step);
      bestIdx = starts.length - 1 + Math.max(0, extraRows);
    }
    return Math.max(0, bestIdx);
  }
  function pointerToGridColumn(relX, metrics) {
    const colIndex = nearestTrackIndex(relX, metrics.colTracks, metrics.colGap);
    let targetX = Math.round(colIndex / 4) * 4;
    if (targetX < 0) targetX = 0;
    if (targetX > ${COLUMNS} - 1) targetX = ${COLUMNS} - 4;
    return targetX;
  }
  function nearestTrackIndexFromStarts(offsetPx, starts, tracks, gap) {
    if (!starts?.length) return 0;
    let bestIdx = 0;
    let bestDist = Math.abs(offsetPx - (starts[0] ?? 0));
    for (let i = 1; i < starts.length; i += 1) {
      const start = starts[i];
      if (start == null) continue;
      const dist = Math.abs(offsetPx - start);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    const lastIdx = starts.length - 1;
    const lastStart = starts[lastIdx] ?? 0;
    const lastSize = tracks[lastIdx] || tracks[tracks.length - 1] || 180;
    const step = lastSize + gap;
    if (offsetPx > lastStart + lastSize / 2 && step > 0) {
      const extra = Math.round((offsetPx - lastStart) / step);
      return lastIdx + Math.max(0, extra);
    }
    return Math.max(0, bestIdx);
  }
  function pointerToGridRow(relY, metrics) {
    const starts = metrics.rowStarts;
    if (starts?.length) {
      let row = 0;
      for (let i = 0; i < starts.length; i += 1) {
        if (starts[i] != null && relY + 0.5 >= starts[i]) row = i;
      }
      const lastIdx = starts.length - 1;
      const lastStart = starts[lastIdx] ?? 0;
      const lastTrack = metrics.rowTracks[lastIdx] || metrics.rowTracks[metrics.rowTracks.length - 1] || 180;
      const step = lastTrack + metrics.rowGap;
      if (relY > lastStart + lastTrack && step > 0) {
        return lastIdx + Math.max(0, Math.floor((relY - lastStart) / step));
      }
      return row;
    }
    return nearestTrackIndex(relY, metrics.rowTracks, metrics.rowGap);
  }
  function isVisuallyHidden(el) {
    if (!el || el.closest("[hidden]")) return true;
    if (el.classList.contains("sr-only") || el.getAttribute("aria-hidden") === "true") return true;
    const s = window.getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden") return true;
    if (s.clip === "rect(0px, 0px, 0px, 0px)" || s.clipPath === "inset(50%)") return true;
    return false;
  }
  function withinCard(rect, cardRect, tol = 1) {
    return rect.top >= cardRect.top - tol
      && rect.left >= cardRect.left - tol
      && rect.bottom <= cardRect.bottom + tol
      && rect.right <= cardRect.right + tol;
  }
  function withinCardVertical(rect, cardRect, tol = 1) {
    return rect.top >= cardRect.top - tol && rect.bottom <= cardRect.bottom + tol;
  }
  function isHabitsLargeRailNode(node) {
    return Boolean(node.closest('[data-module="habits"][data-widget-size="large"] .today-list'));
  }
`;

async function assertCardGeometry(page, caseId) {
  return page.evaluate(({ cid, helpers }) => {
    // eslint-disable-next-line no-eval
    eval(helpers);
    const issues = [];
    const board = document.querySelector("#todayView");
    if (!board) return { ok: false, issues: ["#todayView missing"] };

    window.scrollTo(0, 0);
    document.querySelector(".main-content")?.scrollTo(0, 0);
    board.scrollTop = 0;

    const boardRect = board.getBoundingClientRect();
    if (board.scrollWidth > boardRect.width + 2) {
      issues.push("dashboard horizontal overflow scrollbar risk");
    }

    const cards = [...board.querySelectorAll(":scope > [data-module]:not([hidden])")];
    const overlapRects = cards.map(card => card.getBoundingClientRect());

    for (let i = 0; i < overlapRects.length; i += 1) {
      for (let j = i + 1; j < overlapRects.length; j += 1) {
        const a = overlapRects[i];
        const b = overlapRects[j];
        const overlap = !(a.right <= b.left + 1 || b.right <= a.left + 1 || a.bottom <= b.top + 1 || b.bottom <= a.top + 1);
        if (overlap) issues.push(`cards overlap: ${cards[i].dataset.module} vs ${cards[j].dataset.module}`);
      }
    }

    for (const card of cards) {
      let cardRect = card.getBoundingClientRect();
      const cardStyle = window.getComputedStyle(card);
      if (cardStyle.overflowY === "scroll" || cardStyle.overflow === "scroll") {
        issues.push(`card scroll ${card.dataset.module}`);
      }
      if (card.scrollHeight > card.clientHeight + 2 && cardStyle.overflowY !== "visible" && cardStyle.overflow !== "visible") {
        issues.push(`card internal scroll ${card.dataset.module}`);
      }

      cardRect = card.getBoundingClientRect();
      const descendants = card.querySelectorAll("*");
      descendants.forEach(node => {
        if (node.tagName === "TEXTAREA") return;
        if (node.closest("textarea")) return;
        if (isVisuallyHidden(node)) return;
        const nr = node.getBoundingClientRect();
        if (nr.width < 1 && nr.height < 1) return;
        const inside = isHabitsLargeRailNode(node)
          ? withinCardVertical(nr, cardRect, 1)
          : withinCard(nr, cardRect, 1);
        if (!inside) {
          issues.push(`descendant outside card ${card.dataset.module} ${node.tagName}.${node.className || ""}`);
        }
      });

      const controls = card.querySelectorAll("button, input, textarea, a[href], select");
      controls.forEach(ctrl => {
        if (ctrl.hidden || ctrl.closest("[hidden]")) return;
        if (isVisuallyHidden(ctrl)) return;
        ctrl.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
        cardRect = card.getBoundingClientRect();
        const r = ctrl.getBoundingClientRect();
        if (r.width < 1 && r.height < 1) return;
        const controlInside = isHabitsLargeRailNode(ctrl)
          ? withinCardVertical(r, cardRect, 1)
          : withinCard(r, cardRect, 1);
        if (!controlInside) {
          issues.push(`control outside card ${card.dataset.module} ${ctrl.id || ctrl.className || ctrl.tagName}`);
        }
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        if (cx < 0 || cy < 0 || cx > window.innerWidth || cy > window.innerHeight) {
          issues.push(`control off viewport ${card.dataset.module} ${ctrl.id || ctrl.tagName}`);
          return;
        }
        const top = document.elementFromPoint(cx, cy);
        if (!top) {
          issues.push(`elementFromPoint null ${card.dataset.module} ${ctrl.id || ctrl.tagName}`);
          return;
        }
        if (top !== ctrl && !ctrl.contains(top)) {
          issues.push(`elementFromPoint miss ${card.dataset.module} ${ctrl.id || ctrl.tagName}`);
        }
      });
    }

    return { ok: issues.length === 0, issues, cid };
  }, { cid: caseId, helpers: gridMeasureFns });
}

async function runCase(page, meta, results) {
  const id = `${meta.width}x${meta.theme}-${meta.language}-${meta.fixture}`;
  await page.setViewportSize({ width: meta.width, height: 900 });
  const state = meta.fixture === "empty"
    ? createEmptyFictionalState(FIXTURE_DATE)
    : meta.fixture === "stress"
      ? createStressFictionalState(FIXTURE_DATE)
      : undefined;

  await applyFixture(page, {
    date: FIXTURE_DATE,
    theme: meta.theme,
    motion: "full",
    language: meta.language,
    empty: meta.fixture === "empty",
    state,
  });
  await page.goto(`${meta.serverUrl}/index.html?desktop=tauri-local&lang=${meta.language}`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(350);

  const geom = await assertCardGeometry(page, id);
  if (!geom.ok) {
    fail(results, `${id}-geometry`, geom.issues.slice(0, 12).join("; "));
    fs.mkdirSync(failuresDir, { recursive: true });
    await page.screenshot({ path: path.join(failuresDir, `${id}-geometry.png`) });
  } else {
    pass(results, `${id}-geometry`, "card/control geometry");
  }

  if (meta.width >= 1180 && meta.fixture === "typical") {
    const heights = await page.evaluate(() => {
      const cards = [...document.querySelectorAll("#todayView > [data-module]:not([hidden])")];
      return cards.map(c => ({
        module: c.dataset.module,
        size: c.dataset.widgetSize,
        h: Math.round(c.getBoundingClientRect().height),
      }));
    });
    for (const row of heights) {
      const nominal = row.size === "large" ? 380 : 180;
      if (Math.abs(row.h - nominal) > 1) {
        fail(results, `${id}-nominal-${row.module}`, `height ${row.h} vs ${nominal}±1`);
      } else {
        pass(results, `${id}-nominal-${row.module}`, `height ${row.h}`);
      }
    }
  }

  if (meta.width >= 1180) {
    await page.locator("#editLayoutToggle").click();
    await page.waitForTimeout(120);
    const gridEdit = await page.evaluate(() => {
      const board = document.querySelector("#todayView");
      const style = window.getComputedStyle(board);
      const cols = String(style.gridTemplateColumns || "")
        .split(/\s+/)
        .map(t => t.trim())
        .filter(t => t && t !== "none");
      return {
        editing: board.classList.contains("is-editing-layout"),
        colCount: cols.length,
        display: style.display,
      };
    });
    if (!gridEdit.editing || gridEdit.colCount !== 12) {
      fail(results, `${id}-edit-grid`, JSON.stringify(gridEdit));
    } else {
      pass(results, `${id}-edit-grid`, "12-column grid in edit mode");
    }
    await page.keyboard.press("Escape");
    await page.waitForTimeout(100);
  }

  if (meta.language === "zh" || meta.language === "de") {
    await page.waitForFunction(
      expected => {
        const lang = document.documentElement.lang || "";
        const edit = document.querySelector("#editLayoutToggle")?.textContent?.trim() || "";
        if (expected === "zh") return lang.startsWith("zh") && edit !== "Edit layout";
        if (expected === "de") return lang.startsWith("de") && edit !== "Edit layout";
        return true;
      },
      meta.language,
      { timeout: 8000 }
    );
    await page.locator("#editLayoutToggle").click();
    await page.waitForTimeout(100);
    const undo = await page.evaluate(() => {
      const btn = document.querySelector("#undoLayoutButton");
      return {
        label: document.querySelector("#undoLayoutLabel")?.textContent?.trim() || "",
        aria: btn?.getAttribute("aria-label") || "",
        title: btn?.getAttribute("title") || "",
      };
    });
    const looksEnglish = (s) => /undo/i.test(s) || /^Undo\b/i.test(s);
    const bad = [undo.label, undo.aria, undo.title].some(looksEnglish);
    if (bad) {
      fail(results, `${id}-undo-i18n`, JSON.stringify(undo));
    } else {
      pass(results, `${id}-undo-i18n`, JSON.stringify(undo));
    }
    await page.keyboard.press("Escape");
  }
}

async function runSmLMatrix(page, serverUrl, results) {
  await applyFixture(page, { date: FIXTURE_DATE, theme: "light", language: "en" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${serverUrl}/index.html?desktop=tauri-local`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(300);
  await page.locator("#editLayoutToggle").click();
  await page.waitForTimeout(150);

  const modules = ["summary", "context", "calendar", "focus", "photos", "reflection", "habits"];
  for (const mod of modules) {
    const signatures = {};
    for (const size of ["small", "medium", "large"]) {
      await page.locator(`[data-module="${mod}"] .widget-size-btn[data-size="${size}"]`).click();
      await page.waitForTimeout(120);
      signatures[size] = await page.evaluate(moduleName => {
        const card = document.querySelector(`[data-module="${moduleName}"]`);
        const parts = [...card.querySelectorAll("[data-widget-part]:not([hidden])")].map(p => p.dataset.widgetPart).sort();
        return parts.join(",");
      }, mod);
    }
    const sets = [signatures.small, signatures.medium, signatures.large];
    const unique = new Set(sets);
    if (unique.size < 3 || sets.some(s => !s)) {
      fail(results, `sml-${mod}`, JSON.stringify(signatures));
    } else {
      pass(results, `sml-${mod}`, "pairwise distinct data-widget-part sets");
    }
  }
}

async function runDragKeyboard(page, serverUrl, results) {
  await applyFixture(page, { date: FIXTURE_DATE, theme: "light", language: "en" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${serverUrl}/index.html?desktop=tauri-local`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(250);
  await page.locator("#editLayoutToggle").click();
  await page.waitForTimeout(120);

  const before = await page.evaluate(() => document.querySelector('[data-module="focus"]').style.getPropertyValue("--grid-x"));
  const handle = page.locator('[data-module="focus"] .widget-drag-handle');
  await handle.focus();
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(200);
  const after = await page.evaluate(() => document.querySelector('[data-module="focus"]').style.getPropertyValue("--grid-x"));
  if (before === after) {
    fail(results, "drag-keyboard", `x unchanged ${before}`);
  } else {
    pass(results, "drag-keyboard", `x ${before} -> ${after}`);
  }
}

async function runDragPointer(page, serverUrl, results) {
  await applyFixture(page, { date: FIXTURE_DATE, theme: "light", language: "en" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    localStorage.removeItem("life-ledger-layout-v2");
  });
  await page.goto(`${serverUrl}/index.html?desktop=tauri-local`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(300);
  await page.locator("#editLayoutToggle").click();
  await page.waitForTimeout(150);

  const widgetType = "reflection";
  const handle = page.locator(`[data-module="${widgetType}"] .widget-drag-handle`);
  await handle.scrollIntoViewIfNeeded();
  await page.waitForTimeout(80);
  const box = await handle.boundingBox();
  if (!box) {
    fail(results, "drag-pointer", "no drag handle box");
    return;
  }

  const rowHeightsUnequal = await page.evaluate(() => {
    const board = document.querySelector("#todayView");
    const style = window.getComputedStyle(board);
    const rows = String(style.gridTemplateRows || "").split(/\s+/).map(t => parseFloat(t)).filter(n => n > 0);
    if (rows.length < 2) return false;
    return Math.max(...rows) - Math.min(...rows) > 8;
  });
  if (!rowHeightsUnequal) {
    fail(results, "drag-pointer-unequal-rows", "grid rows not measurably unequal");
    return;
  }

  const dragDy = 920;
  const dragDx = -320;
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  const beforeY = await page.evaluate(widgetType => {
    const card = document.querySelector(`[data-module="${widgetType}"]`);
    return Number.parseInt(card?.style.getPropertyValue("--grid-y"), 10);
  }, widgetType);

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + dragDx, startY + dragDy, { steps: 32 });
  await page.mouse.up();
  await page.waitForFunction(widgetType => {
    const card = document.querySelector(`[data-module="${widgetType}"]`);
    if (!card || card.classList.contains("is-dragging")) return false;
    const transform = window.getComputedStyle(card).transform;
    return !transform || transform === "none";
  }, widgetType, { timeout: 5000 });
  await page.waitForTimeout(400);

  const check = await page.evaluate(({ widgetType, helpers }) => {
    // eslint-disable-next-line no-eval
    eval(helpers);
    const board = document.querySelector("#todayView");
    const card = document.querySelector(`[data-module="${widgetType}"]`);
    const containerRect = board.getBoundingClientRect();
    const droppedRect = card.getBoundingClientRect();
    const relX = droppedRect.left - containerRect.left;
    const relY = droppedRect.top - containerRect.top;
    const metrics = measureGrid(board);
    const expectedX = pointerToGridColumn(relX, metrics);
    const expectedY = pointerToGridRow(relY, metrics);
    const styleX = Number.parseInt(card.style.getPropertyValue("--grid-x"), 10);
    const styleY = Number.parseInt(card.style.getPropertyValue("--grid-y"), 10);
    const raw = localStorage.getItem("life-ledger-layout-v2");
    if (!raw) return { error: "missing life-ledger-layout-v2" };
    const layout = JSON.parse(raw);
    const w = layout.widgets?.find(item => item.type === widgetType);
    const actualX = w?.x;
    const actualY = w?.y;
    const storageMatchesDom = actualX === styleX && actualY === styleY;
    const slotMatchesRendered = actualX === expectedX && actualY === expectedY;
    return {
      expectedX,
      expectedY,
      styleX,
      styleY,
      actualX,
      actualY,
      storageMatchesDom,
      slotMatchesRendered,
      relY,
      rowTracks: metrics.rowTracks,
    };
  }, { widgetType, helpers: gridMeasureFns });

  const moved = Number.isFinite(beforeY) && check.actualY !== beforeY;
  if (check.error || !moved || !check.storageMatchesDom || !check.slotMatchesRendered) {
    fail(results, "drag-pointer", JSON.stringify({ ...check, beforeY, moved }));
  } else {
    pass(results, "drag-pointer", JSON.stringify(check));
  }
}

async function runHabitsLargeRail(page, serverUrl, results) {
  await applyFixture(page, { date: FIXTURE_DATE, theme: "light", language: "en", state: createStressFictionalState() });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${serverUrl}/index.html?desktop=tauri-local`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(300);
  await page.locator("#editLayoutToggle").click();
  await page.waitForTimeout(120);
  const habitsHandle = page.locator('[data-module="habits"] .widget-drag-handle');
  await habitsHandle.focus();
  await page.keyboard.press("l");
  await page.waitForTimeout(200);

  const rail = await page.evaluate(() => {
    const module = document.querySelector('[data-module="habits"][data-widget-size="large"]');
    const list = module?.querySelector(".today-list");
    const rows = module
      ? [...module.querySelectorAll(".today-habit-row")].filter(r => !r.hidden && r.offsetParent !== null)
      : [];
    const scheduledVisible = module?.querySelector("#todayScheduledGroup:not([hidden])");
    const style = list ? window.getComputedStyle(list) : null;
    return {
      rowCount: rows.length,
      scheduledGroupVisible: Boolean(scheduledVisible),
      overflowX: style?.overflowX,
      overflowY: style?.overflowY,
      scrollWidth: list?.scrollWidth ?? 0,
      clientWidth: list?.clientWidth ?? 0,
    };
  });

  if (rail.rowCount < 10) {
    fail(results, "habits-large-full-list", `expected many visible habit tiles, got ${rail.rowCount}`);
  } else {
    pass(results, "habits-large-full-list", `visible tiles=${rail.rowCount}, scheduled=${rail.scheduledGroupVisible}`);
  }
  if (rail.overflowY !== "hidden") {
    fail(results, "habits-large-overflow-y", `overflow-y must be hidden, got ${rail.overflowY}`);
  } else if (rail.overflowX !== "auto" && rail.overflowX !== "scroll") {
    fail(results, "habits-large-overflow-x", `overflow-x must allow horizontal scroll, got ${rail.overflowX}`);
  } else if (rail.scrollWidth <= rail.clientWidth + 4) {
    fail(results, "habits-large-horizontal-overflow", `scrollWidth ${rail.scrollWidth} <= clientWidth ${rail.clientWidth}`);
  } else {
    pass(results, "habits-large-rail-overflow", `scroll ${rail.scrollWidth}/${rail.clientWidth}`);
  }
}

async function main() {
  const results = [];
  const server = await startStaticServer(publicDir);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    for (const width of WIDTHS) {
      for (const theme of THEMES) {
        for (const language of LANGUAGES) {
          for (const fixture of FIXTURES) {
            await runCase(page, { width, theme, language, fixture, serverUrl: server.url }, results);
          }
        }
      }
    }
    await runSmLMatrix(page, server.url, results);
    await runDragKeyboard(page, server.url, results);
    await runDragPointer(page, server.url, results);
    await runHabitsLargeRail(page, server.url, results);
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    await server.close().catch(() => {});
  }

  const outPath = path.join(outputDir, "today-geometry-results.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), "utf8");
  const failed = results.filter(r => r.status === "fail");
  const passed = results.length - failed.length;
  console.log(`Today geometry evidence: ${passed} passed, ${failed.length} failed → ${outPath}`);
  if (failed.length) {
    console.error(failed.slice(0, 25));
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
