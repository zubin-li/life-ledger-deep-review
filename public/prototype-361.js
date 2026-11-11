import { illustrations } from "./prototype-361-illus.js";
import {
  createInitialState,
  completionRateForDay,
  isAllDoneToday,
  timeOfDayIllus,
} from "./prototype-361-data.js";
import { initVariantC } from "./prototype-361-canvas.js";
import { normalizeWidgetSize } from "./prototype-361-widgets.js";

const VARIANTS = [
  { id: "a", name: "Floating Islands" },
  { id: "b", name: "Native Modular" },
  { id: "c", name: "Living Canvas" },
];

const MODULE_LABELS = {
  greeting: "今日问候",
  habits: "习惯",
  mood: "心情",
  reflection: "复盘",
  photos: "照片",
  focus: "专注",
  "week-glance": "本周一览",
};

let state = createInitialState();
let variant = document.documentElement.dataset.variant || "a";
let focusTimerId = null;
let toastTimer = null;
const app = document.getElementById("protoApp");
const toastEl = document.getElementById("protoToast");
const switcherLabel = document.getElementById("protoSwitcherLabel");
const statePanel = document.getElementById("protoState");
const stateBody = document.getElementById("protoStateBody");

function formatFocus(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const variantC = initVariantC({
  illustrations,
  completionRateForDay,
  isAllDoneToday,
  timeOfDayIllus,
  formatFocus,
});
const { registry: cRegistry, renderCWidgets, bindCCanvas, renderCHeaderExtras } = variantC;

function showToast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  toastEl.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove("is-visible");
    toastEl.hidden = true;
  }, 2400);
}

function setVariant(next) {
  const idx = VARIANTS.findIndex((v) => v.id === variant);
  const i = VARIANTS.findIndex((v) => v.id === next);
  variant = VARIANTS[i >= 0 ? i : (idx + 1) % VARIANTS.length].id;
  document.documentElement.dataset.variant = variant;
  const url = new URL(location.href);
  url.searchParams.set("variant", variant);
  history.replaceState(null, "", url);
  render(true);
}

function cycleVariant(dir) {
  const idx = VARIANTS.findIndex((v) => v.id === variant);
  const next = VARIANTS[(idx + dir + VARIANTS.length) % VARIANTS.length].id;
  setVariant(next);
}

function toggleTheme() {
  const next = document.documentElement.dataset.protoTheme === "dark" ? "light" : "dark";
  document.documentElement.dataset.protoTheme = next;
  sessionStorage.setItem("proto-361-theme", next);
  render();
}

function cycleMotion() {
  const order = ["full", "reduced", "off"];
  const cls = document.documentElement.classList;
  let current = "full";
  if (cls.contains("proto-motion-reduced")) current = "reduced";
  if (cls.contains("proto-motion-off")) current = "off";
  const next = order[(order.indexOf(current) + 1) % order.length];
  cls.remove("proto-motion-full", "proto-motion-reduced", "proto-motion-off");
  if (next === "reduced") cls.add("proto-motion-reduced");
  else if (next === "off") cls.add("proto-motion-off");
  else cls.add("proto-motion-full");
  sessionStorage.setItem("proto-361-motion", next);
  showToast(`Motion: ${next}`);
  syncStatePanel();
}

function toggleHabit(habitId) {
  const map = { ...(state.completions[state.anchor] || {}) };
  map[habitId] = !map[habitId];
  state.completions[state.anchor] = map;
  if (isAllDoneToday(state)) {
    showToast("今日习惯已全部完成");
  }
  render();
}

function setMood(value) {
  state.mood.value = value;
  render();
}

async function saveReflection() {
  const btn = document.querySelector("[data-action='save-reflection']");
  if (btn) {
    btn.classList.add("is-loading");
    btn.disabled = true;
  }
  state.reflection.status = "saving";
  app.dataset.saving = "true";
  render();
  await new Promise((r) => setTimeout(r, 520));
  state.reflection.saved = state.reflection.draft;
  state.reflection.status = "success";
  app.dataset.saving = "false";
  showToast("复盘已保存（仅内存）");
  render();
  await new Promise((r) => setTimeout(r, 600));
  state.reflection.status = "idle";
  render();
}

function addPhoto() {
  if (state.photos.length >= 6) {
    showToast("演示上限 6 张");
    return;
  }
  const id = `p${state.photos.length + 1}`;
  state.photos.push({ id, label: `记忆 ${state.photos.length + 1}` });
  showToast("已添加示例照片");
  render();
}

function toggleFocus() {
  if (state.focus.running) {
    clearInterval(focusTimerId);
    focusTimerId = null;
    state.focus.running = false;
    state.focus.status = "idle";
    showToast("专注已暂停");
  } else {
    state.focus.running = true;
    state.focus.status = "running";
    focusTimerId = setInterval(() => {
      if (state.focus.secondsLeft <= 0) {
        clearInterval(focusTimerId);
        state.focus.running = false;
        state.focus.status = "done";
        state.focus.sessionsToday += 1;
        state.focus.totalToday += 25;
        state.focus.secondsLeft = 25 * 60;
        showToast("专注时段完成");
        render();
        return;
      }
      state.focus.secondsLeft -= 1;
      document.querySelectorAll(".proto-focus-dial, .proto-w-focus-time").forEach((dial) => {
        dial.textContent = formatFocus(state.focus.secondsLeft);
      });
    }, 1000);
    showToast("专注开始");
  }
  render();
}

function toggleCollapse(moduleId) {
  state.collapsed[moduleId] = !state.collapsed[moduleId];
  render();
}

function setView(view) {
  state.view = view;
  render(true);
}

function selectWeekDay(iso) {
  state.weekSelectedIso = iso;
  if (state.view === "week") render();
  else {
    state.view = "week";
    render(true);
  }
}

function moveModule(moduleId, dir) {
  const order = [...state.moduleOrder[variant]];
  const i = order.indexOf(moduleId);
  const j = i + dir;
  if (j < 0 || j >= order.length) return;
  order[i] = order[j];
  order[j] = moduleId;
  state.moduleOrder[variant] = order;
  render();
}

function spanForModule(id) {
  if (id === "habits" || id === "reflection") return "7";
  if (id === "mood" || id === "photos" || id === "focus") return "5";
  return "12";
}

function renderGreeting() {
  const illusKey = isAllDoneToday(state) ? "allDone" : timeOfDayIllus();
  const { done, total } = completionRateForDay(state, state.anchor);
  return `
    <section class="proto-module" data-module="greeting" data-span="12">
      <div class="proto-greeting-row">
        ${illustrations[illusKey]}
        <div class="proto-greeting-copy">
          <strong>周日 · 10月12日</strong>
          <span class="proto-header-meta">3.6.1 study · ${done}/${total} 习惯 · 上海 17:30</span>
        </div>
      </div>
      ${state.firstWeekBanner ? `<div class="proto-banner">${illustrations.firstWeek}<span>第一周使用 Life Ledger — 保持轻量记录即可。</span><button type="button" class="proto-btn proto-btn--ghost" data-action="dismiss-first-week">知道了</button></div>` : ""}
    </section>`;
}

function renderHabits(forIso = state.anchor) {
  const map = state.completions[forIso] || {};
  const items = state.habits
    .map(
      (h) => `
    <li class="proto-habit ${map[h.id] ? "is-done" : ""}" style="--habit-color:${h.color}">
      <button type="button" class="proto-habit-check" data-action="toggle-habit" data-habit="${h.id}" aria-pressed="${map[h.id] ? "true" : "false"}" aria-label="${h.name}"></button>
      <div>
        <div class="proto-habit-name">${h.name}</div>
        <div class="proto-habit-meta">${h.nameEn} · 连续 ${h.streak} 天</div>
      </div>
      <span class="proto-habit-meta">${map[h.id] ? "完成" : "待办"}</span>
    </li>`
    )
    .join("");
  const { done, total } = completionRateForDay(state, forIso);
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `
    <section class="proto-module ${state.collapsed.habits ? "is-collapsed" : ""}" data-module="habits" data-span="${spanForModule("habits")}">
      <header class="proto-module-head">
        <h2>${MODULE_LABELS.habits}</h2>
        <div class="proto-module-actions">
          ${variant === "a" ? `<button type="button" class="proto-icon-btn" data-action="move" data-module="habits" data-dir="-1" aria-label="上移">↑</button><button type="button" class="proto-icon-btn" data-action="move" data-module="habits" data-dir="1" aria-label="下移">↓</button>` : ""}
          <button type="button" class="proto-icon-btn" data-action="collapse" data-module="habits" aria-expanded="${!state.collapsed.habits}">▾</button>
        </div>
      </header>
      <div class="proto-module-body">
        <div class="proto-greeting-row" style="margin-bottom:8px">${illustrations.morning}<span class="proto-header-meta">晨间习惯优先 — 午后留给写作与专注</span></div>
        <ul class="proto-habit-list">${items}</ul>
        <div class="proto-progress" aria-hidden="true"><span style="width:${pct}%"></span></div>
      </div>
    </section>`;
}

function renderMood() {
  const faces = ["😐", "🙂", "😊", "😌", "🌟"];
  return `
    <section class="proto-module ${state.collapsed.mood ? "is-collapsed" : ""}" data-module="mood" data-span="${spanForModule("mood")}">
      <header class="proto-module-head">
        <h2>${MODULE_LABELS.mood}</h2>
        <button type="button" class="proto-icon-btn" data-action="collapse" data-module="mood">▾</button>
      </header>
      <div class="proto-module-body">
        <div class="proto-mood-row">
          ${faces
            .map(
              (f, i) =>
                `<button type="button" class="proto-mood-btn ${state.mood.value === i + 1 ? "is-selected" : ""}" data-action="mood" data-value="${i + 1}">${f}</button>`
            )
            .join("")}
        </div>
        <p class="proto-header-meta" style="margin:8px 0 0">${state.mood.note}</p>
      </div>
    </section>`;
}

function renderReflection() {
  const statusLabel =
    state.reflection.status === "saving"
      ? "保存中…"
      : state.reflection.status === "success"
        ? "已保存"
        : "";
  return `
    <section class="proto-module ${state.collapsed.reflection ? "is-collapsed" : ""}" data-module="reflection" data-span="${spanForModule("reflection")}">
      <header class="proto-module-head">
        <h2><span class="proto-module-illus">${illustrations.reflection}</span>${MODULE_LABELS.reflection}</h2>
        <button type="button" class="proto-icon-btn" data-action="collapse" data-module="reflection">▾</button>
      </header>
      <div class="proto-module-body proto-reflection">
        <textarea data-bind="reflection">${state.reflection.draft}</textarea>
        <div style="display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap">
          <button type="button" class="proto-btn proto-btn--primary ${state.reflection.status === "success" ? "is-success" : ""} ${state.reflection.status === "saving" ? "is-loading" : ""}" data-action="save-reflection">保存复盘</button>
          <span class="proto-header-meta">${statusLabel}</span>
        </div>
      </div>
    </section>`;
}

function renderPhotos() {
  const empty = state.photos.length === 0;
  const slots = empty
    ? `<div class="proto-empty">${illustrations.emptyPhotos}<p>今天还没有照片记忆</p><button type="button" class="proto-btn" data-action="add-photo">添加示例</button></div>`
    : `<div class="proto-photo-grid">${state.photos
        .map((p) => `<div class="proto-photo-slot is-filled">${p.label}</div>`)
        .join("")}<button type="button" class="proto-photo-slot" data-action="add-photo">+</button></div>`;
  return `
    <section class="proto-module ${state.collapsed.photos ? "is-collapsed" : ""}" data-module="photos" data-span="${spanForModule("photos")}">
      <header class="proto-module-head"><h2>${MODULE_LABELS.photos}</h2><button type="button" class="proto-icon-btn" data-action="collapse" data-module="photos">▾</button></header>
      <div class="proto-module-body">${slots}</div>
    </section>`;
}

function renderFocus() {
  return `
    <section class="proto-module ${state.collapsed.focus ? "is-collapsed" : ""}" data-module="focus" data-span="${spanForModule("focus")}">
      <header class="proto-module-head">
        <h2><span class="proto-module-illus">${illustrations.focus}</span>${MODULE_LABELS.focus}</h2>
        <button type="button" class="proto-icon-btn" data-action="collapse" data-module="focus">▾</button>
      </header>
      <div class="proto-module-body proto-focus-ring">
        <div class="proto-focus-dial ${state.focus.running ? "is-running" : ""}">${formatFocus(state.focus.secondsLeft)}</div>
        <div>
          <p style="margin:0 0 8px">今日 ${state.focus.sessionsToday} 次 · ${state.focus.totalToday} 分钟</p>
          <button type="button" class="proto-btn proto-btn--primary" data-action="toggle-focus">${state.focus.running ? "暂停" : "开始 25 分钟"}</button>
        </div>
      </div>
    </section>`;
}

function renderWeekGlance() {
  const strip = state.weekDays
    .map(
      (d) => `
    <button type="button" class="proto-week-day ${d.isToday ? "is-today" : ""} ${state.weekSelectedIso === d.iso ? "is-selected" : ""}" data-action="week-day" data-iso="${d.iso}">
      <div class="proto-header-meta">${d.labelZh}</div>
      <div class="proto-week-day-num">${d.dayNum}</div>
    </button>`
    )
    .join("");
  const rows = state.weekDays
    .map((d) => {
      const { done, total } = completionRateForDay(state, d.iso);
      return `<div class="proto-week-row ${d.isToday ? "is-today" : ""}">
        <span class="proto-header-meta">${d.label}</span>
        <button type="button" data-action="week-day" data-iso="${d.iso}">${d.dayNum} 日 · ${done}/${total} 习惯</button>
        <span class="proto-habit-meta">${d.isWeekend ? "周末" : "工作日"}</span>
      </div>`;
    })
    .join("");
  return `
    <section class="proto-module ${state.collapsed["week-glance"] ? "is-collapsed" : ""}" data-module="week-glance" data-span="12">
      <header class="proto-module-head">
        <h2><span class="proto-module-illus">${illustrations.calendarInsight}</span>${MODULE_LABELS["week-glance"]}</h2>
        <button type="button" class="proto-icon-btn" data-action="collapse" data-module="week-glance">▾</button>
      </header>
      <div class="proto-module-body">
        <div class="proto-week-strip">${strip}</div>
        ${state.view === "week"
          ? `<div class="proto-week-agenda">${rows}</div>
             <div class="proto-banner" style="margin-top:14px">${illustrations.calendarInsight}<span>本周完成率 74% · 比上周 +6%。周三写作日最稳定。</span></div>
             <p class="proto-header-meta" style="margin:12px 0 0;line-height:1.6">周记草稿：保持晨间阅读，减少午后会议对专注的切割。周末留出照片整理时间。</p>`
          : `<p class="proto-header-meta" style="margin-top:10px">切换到「本周」查看完整议程与洞察</p>`}
      </div>
    </section>`;
}

const moduleRenderers = {
  greeting: renderGreeting,
  habits: () => renderHabits(state.view === "week" ? state.weekSelectedIso : state.anchor),
  mood: renderMood,
  reflection: renderReflection,
  photos: renderPhotos,
  focus: renderFocus,
  "week-glance": renderWeekGlance,
};

function renderModules() {
  if (variant === "c") return renderCWidgets(state, cRegistry);
  const order = state.moduleOrder[variant];
  return order.map((id) => moduleRenderers[id]()).join("");
}

function moveCWidget(widgetId, dir) {
  const order = [...state.cWidgetLayout.order];
  const i = order.indexOf(widgetId);
  const j = i + dir;
  if (j < 0 || j >= order.length) return;
  order[i] = order[j];
  order[j] = widgetId;
  state.cWidgetLayout.order = order;
  render();
}

function setCWidgetSize(widgetId, size) {
  const def = cRegistry[widgetId];
  if (!def || !def.allowedSizes.includes(size)) return;
  state.cWidgetLayout.sizes[widgetId] = size;
  state.cWidgetLayout.sizePickerOpen = null;
  render();
}

function removeCWidget(widgetId) {
  state.cWidgetLayout.order = state.cWidgetLayout.order.filter((id) => id !== widgetId);
  if (!state.cWidgetLayout.offCanvas.includes(widgetId)) {
    state.cWidgetLayout.offCanvas.push(widgetId);
  }
  render();
}

function addCWidget(widgetId) {
  if (!cRegistry[widgetId]) return;
  state.cWidgetLayout.offCanvas = state.cWidgetLayout.offCanvas.filter((id) => id !== widgetId);
  if (!state.cWidgetLayout.order.includes(widgetId)) {
    state.cWidgetLayout.order.push(widgetId);
    state.cWidgetLayout.sizes[widgetId] = normalizeWidgetSize(cRegistry, widgetId, cRegistry[widgetId].defaultSize);
  }
  state.cWidgetLayout.addPaletteOpen = false;
  showToast(`已添加「${cRegistry[widgetId].title}」`);
  render();
}

function toggleCEdit() {
  const layout = state.cWidgetLayout;
  layout.editMode = !layout.editMode;
  layout.sizePickerOpen = null;
  layout.addPaletteOpen = false;
  render();
}

function cycleMood() {
  state.mood.value = state.mood.value >= 5 ? 1 : state.mood.value + 1;
  render();
}

function renderShell(enter) {
  const vMeta = VARIANTS.find((v) => v.id === variant);
  switcherLabel.textContent = `${variant.toUpperCase()} · ${vMeta.name}`;

  const navIconToday = '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>';
  const navIconWeek = '<svg viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h9"/></svg>';

  const title =
    state.view === "week"
      ? "本周 · 10月6日 – 12日"
      : "今日 · 10月12日";

  const headerBlock =
    variant === "b"
      ? `<div class="proto-titlebar">
          <div>
            <span class="proto-study-badge">3.6.1 design study</span>
            <h1 style="margin:4px 0 0;font-size:1.1rem">${title}</h1>
          </div>
          <div class="proto-toolbar-actions">
            <button type="button" class="proto-chip ${state.view === "today" ? "is-on" : ""}" data-action="view" data-view="today">今日</button>
            <button type="button" class="proto-chip ${state.view === "week" ? "is-on" : ""}" data-action="view" data-view="week">本周</button>
            <button type="button" class="proto-chip" data-action="theme">${document.documentElement.dataset.protoTheme === "dark" ? "浅色" : "深色"}</button>
            <button type="button" class="proto-chip" data-action="motion">动效</button>
            <button type="button" class="proto-chip" data-action="state">State</button>
            <span class="proto-kbd-hint">⌘K</span>
          </div>
        </div>`
      : variant === "c"
        ? `<header class="proto-header proto-header--c">
          <div>
            <span class="proto-study-badge">3.6.1 design study · Living Canvas</span>
            <h1>${title}</h1>
            <p class="proto-header-meta">固定尺寸小组件 · 无持久化</p>
          </div>
          <div class="proto-toolbar-actions proto-toolbar-actions--wrap">
            <button type="button" class="proto-chip ${state.view === "today" ? "is-on" : ""}" data-action="view" data-view="today">今日</button>
            <button type="button" class="proto-chip ${state.view === "week" ? "is-on" : ""}" data-action="view" data-view="week">本周</button>
            <button type="button" class="proto-chip" data-action="theme">外观</button>
            <button type="button" class="proto-chip" data-action="motion">动效</button>
            <div class="proto-c-edit-cluster">
              ${renderCHeaderExtras(state, cRegistry)}
            </div>
            <button type="button" class="proto-chip" data-action="state">State</button>
          </div>
        </header>`
        : `<header class="proto-header">
          <div>
            <span class="proto-study-badge">3.6.1 design study</span>
            <h1>${title}</h1>
            <p class="proto-header-meta">${vMeta.name} · 无持久化</p>
          </div>
          <div class="proto-toolbar-actions">
            <button type="button" class="proto-chip ${state.view === "today" ? "is-on" : ""}" data-action="view" data-view="today">今日</button>
            <button type="button" class="proto-chip ${state.view === "week" ? "is-on" : ""}" data-action="view" data-view="week">本周</button>
            <button type="button" class="proto-chip" data-action="theme">外观</button>
            <button type="button" class="proto-chip" data-action="motion">动效</button>
            <button type="button" class="proto-chip" data-action="palette">命令面板</button>
            <button type="button" class="proto-chip" data-action="state">State</button>
          </div>
        </header>`;

  const canvasTop = "";

  const modulesMarkup =
    variant === "c"
      ? `<div class="proto-c-scroll"><div class="proto-c-grid ${state.cWidgetLayout.editMode ? "is-editing" : ""}" id="protoCGrid">${renderModules()}</div></div>`
      : `<div class="proto-modules" id="protoModules">${renderModules()}</div>`;

  app.classList.toggle("is-entering", !!enter);
  app.dataset.cEdit = variant === "c" && state.cWidgetLayout.editMode ? "true" : "false";
  app.innerHTML = `
    <aside class="proto-rail" aria-label="导航">
      <div class="proto-mark" title="Life Ledger">L</div>
      <nav class="proto-nav">
        <button type="button" class="proto-nav-btn ${state.view === "today" ? "is-active" : ""}" data-action="view" data-view="today">
          <span class="proto-nav-icon">${navIconToday}</span><span class="proto-nav-label">今日</span>
        </button>
        <button type="button" class="proto-nav-btn ${state.view === "week" ? "is-active" : ""}" data-action="view" data-view="week">
          <span class="proto-nav-icon">${navIconWeek}</span><span class="proto-nav-label">本周</span>
        </button>
      </nav>
      <div class="proto-sidebar-foot" style="margin-top:auto;font-size:10px;color:var(--proto-muted);text-align:center">
        ${variant === "b" ? "⌘1 今日 · ⌘2 本周" : ""}
      </div>
    </aside>
    <main class="proto-workspace">
      <div class="proto-island-shell">
        ${headerBlock}
        ${canvasTop}
        ${modulesMarkup}
      </div>
    </main>`;

  if (variant === "c") {
    bindCCanvas(state, cRegistry, () => render(false), showToast);
  }
  syncStatePanel();
}

function syncStatePanel() {
  if (statePanel.hidden) return;
  const snapshot = {
    variant,
    view: state.view,
    anchor: state.anchor,
    weekSelected: state.weekSelectedIso,
    completionsToday: state.completions[state.anchor],
    moduleOrder: state.moduleOrder[variant],
    cWidgetLayout: variant === "c" ? state.cWidgetLayout : undefined,
    reflectionStatus: state.reflection.status,
    photos: state.photos.length,
    focusRunning: state.focus.running,
    motion: sessionStorage.getItem("proto-361-motion"),
    theme: document.documentElement.dataset.protoTheme,
  };
  stateBody.textContent = JSON.stringify(snapshot, null, 2);
}

function render(enter = false) {
  renderShell(enter);
}

function handleAction(e) {
  const t = e.target.closest("[data-action]");
  if (!t) return;
  const action = t.dataset.action;
  switch (action) {
    case "view":
      setView(t.dataset.view);
      break;
    case "theme":
      toggleTheme();
      break;
    case "motion":
      cycleMotion();
      break;
    case "toggle-habit":
      toggleHabit(t.dataset.habit);
      break;
    case "mood":
      setMood(Number(t.dataset.value));
      break;
    case "save-reflection":
      saveReflection();
      break;
    case "add-photo":
      addPhoto();
      break;
    case "toggle-focus":
      toggleFocus();
      break;
    case "collapse":
      toggleCollapse(t.dataset.module);
      break;
    case "week-day":
      selectWeekDay(t.dataset.iso);
      break;
    case "move":
      moveModule(t.dataset.module, Number(t.dataset.dir));
      break;
    case "dismiss-first-week":
      state.firstWeekBanner = false;
      render();
      break;
    case "state":
      statePanel.hidden = !statePanel.hidden;
      syncStatePanel();
      break;
    case "palette":
      showToast("命令面板：演示中跳转到本周视图");
      setView("week");
      break;
    case "toggle-c-edit":
      toggleCEdit();
      break;
    case "toggle-size-picker":
      state.cWidgetLayout.sizePickerOpen =
        state.cWidgetLayout.sizePickerOpen === t.dataset.widget ? null : t.dataset.widget;
      render();
      break;
    case "set-widget-size":
      setCWidgetSize(t.dataset.widget, t.dataset.size);
      break;
    case "remove-widget":
      removeCWidget(t.dataset.widget);
      showToast("已移回组件库");
      break;
    case "add-widget":
      addCWidget(t.dataset.widget);
      break;
    case "toggle-add-palette":
      state.cWidgetLayout.addPaletteOpen = !state.cWidgetLayout.addPaletteOpen;
      render();
      break;
    case "move-widget":
      moveCWidget(t.dataset.widget, Number(t.dataset.dir));
      break;
    case "mood-cycle":
      cycleMood();
      break;
    default:
      break;
  }
}

document.getElementById("protoSwitcher").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-switch]");
  if (!btn) return;
  cycleVariant(btn.dataset.switch === "prev" ? -1 : 1);
});

document.getElementById("protoStateClose").addEventListener("click", () => {
  statePanel.hidden = true;
});

app.addEventListener("click", handleAction);

app.addEventListener("input", (e) => {
  if (e.target.matches("[data-bind='reflection']")) {
    state.reflection.draft = e.target.value;
    syncStatePanel();
  }
});

document.addEventListener("keydown", (e) => {
  const tag = e.target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    cycleVariant(-1);
  }
  if (e.key === "ArrowRight") {
    e.preventDefault();
    cycleVariant(1);
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    showToast("⌘K · 今日 / 本周 / 外观 / 动效");
  }
  if (variant === "b" && (e.metaKey || e.ctrlKey) && e.key === "1") {
    e.preventDefault();
    setView("today");
  }
  if (variant === "b" && (e.metaKey || e.ctrlKey) && e.key === "2") {
    e.preventDefault();
    setView("week");
  }
  if (variant === "c" && state.cWidgetLayout.editMode && state.cWidgetLayout.focusedWidget) {
    const id = state.cWidgetLayout.focusedWidget;
    if (e.key === "ArrowUp" && (e.metaKey || e.altKey)) {
      e.preventDefault();
      moveCWidget(id, -1);
    }
    if (e.key === "ArrowDown" && (e.metaKey || e.altKey)) {
      e.preventDefault();
      moveCWidget(id, 1);
    }
  }
});

app.addEventListener("focusin", (e) => {
  if (variant !== "c") return;
  const w = e.target.closest(".proto-widget");
  if (w) state.cWidgetLayout.focusedWidget = w.dataset.widget;
});

const urlV = new URLSearchParams(location.search).get("variant");
if (urlV && VARIANTS.some((v) => v.id === urlV)) {
  variant = urlV;
  document.documentElement.dataset.variant = variant;
}

render(true);
