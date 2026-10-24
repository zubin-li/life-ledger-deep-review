// Web Today card layer (widget grid, sizes S/M/L/W/X): the original Today sections plus the extra cards (today-widgets.js)
// become cards that can be reordered, resized (only cards with a real second size), hidden,
// configured (edit mode → click a card) and added from the card library.
// It only moves existing nodes; app.js keeps rendering their content, so every original
// interaction and animation stays as it was. Desktop (Tauri) is untouched.
(() => {
  if (new URLSearchParams(location.search).get("desktop") === "tauri-local") return;
  const view = document.getElementById("todayView");
  if (!view) return;
  const $ = (s, r = document) => r.querySelector(s);
  const NS = window.LifeLedgerStorageSuffix || "";
  const T = {
    zh: { edit: "编辑卡片", done: "完成", add: "添加卡片", reset: "恢复默认", size: "卡片尺寸", hide: "移除卡片", left: "前移", right: "后移", settings: "卡片设置", hint: "拖动排序 · 点卡片设置",
      libTitle: "让日常，按你的方式展开", libKicker: "组件库", libHint: "只添加你需要的。添加后，可以在编辑卡片中调整位置。", libAdd: "添加", libAdded: "已添加", libClose: "完成",
      setHint: "设置自动保存。只有在编辑卡片时才能移动和设置。", fixed: "这张卡片只有一种尺寸。", sS: "小", sM: "中", sL: "大", sW: "长条", sX: "整行",
      hero: "今日进度", mood: "心情", habits: "今日基础目标", dayplan: "每日日程", tools: "复盘与专注", calendar: "月历", weather: "天气", rhythm: "近期节律", heatmap: "习惯热力图", wall: "照片墙", photos: "照片记忆", focus: "专注", freq: "频率记录",
      d_hero: "名言、日期和今日完成度。", d_mood: "记录今天整体的心情。", d_habits: "点完成后自动移到最后；大卡一页 6 个，长条一行 4 个，整行一页 8 个。", d_dayplan: "Google 日历当天日程（只读）。", d_tools: "每日复盘、快速记录，可切换到专注。", d_calendar: "这个月每天的心情，点某天可补打卡。",
      d_weather: "当前天气，横轴看各时段，雨雪提醒。", d_rhythm: "最近 7 天的完成情况。", d_heatmap: "本月习惯完成的深浅。", d_wall: "照片铺满卡片；在卡片设置里添加、取景和轮播。", d_photos: "这一天的照片（部署版）。", d_focus: "一键开始专注计时。", d_freq: "每周 / 每月计次的目标：看这个月的记录分布。" },
    en: { edit: "Edit cards", done: "Done", add: "Add card", reset: "Reset", size: "Card size", hide: "Remove card", left: "Move earlier", right: "Move later", settings: "Card settings", hint: "Drag to reorder · click a card for settings",
      libTitle: "Make room for your day", libKicker: "WIDGET LIBRARY", libHint: "Choose what belongs on your desk. Added cards can be moved in Edit cards.", libAdd: "Add", libAdded: "Added", libClose: "Done",
      setHint: "Changes save automatically. Cards only move and change in edit mode.", fixed: "This card has one size.", sS: "Small", sM: "Medium", sL: "Large", sW: "Wide", sX: "Extra large",
      hero: "Today's progress", mood: "Mood", habits: "Foundations", dayplan: "Daily calendar", tools: "Reflection & focus", calendar: "Month", weather: "Weather", rhythm: "Recent rhythm", heatmap: "Habit heatmap", wall: "Photo wall", photos: "Photo memories", focus: "Focus", freq: "By frequency",
      d_hero: "Quote, date and today's progress.", d_mood: "How the whole day felt.", d_habits: "Done habits move to the end; large shows 6, wide 4 in a row, extra large 8.", d_dayplan: "Today's Google Calendar (read-only).", d_tools: "Daily reflection and quick record, with a Focus tab.", d_calendar: "This month's moods; open a day to catch up.",
      d_weather: "Weather now, hourly curve, rain and snow alerts.", d_rhythm: "The last 7 days at a glance.", d_heatmap: "How full each day of the month was.", d_wall: "Your photo fills the card; add, frame and loop in card settings.", d_photos: "This day's photos (deployed version).", d_focus: "Start a focus session in one tap.", d_freq: "Weekly or monthly habits: how this month is spread." },
    de: { edit: "Karten bearbeiten", done: "Fertig", add: "Karte hinzufügen", reset: "Zurücksetzen", size: "Kartengröße", hide: "Karte entfernen", left: "Nach vorn", right: "Nach hinten", settings: "Karteneinstellungen", hint: "Ziehen zum Sortieren · Karte anklicken zum Einstellen",
      libTitle: "Dein Tag. Dein Platz.", libKicker: "WIDGET-BIBLIOTHEK", libHint: "Wähle, was auf deinen Schreibtisch gehört. Karten lassen sich im Bearbeitungsmodus bewegen.", libAdd: "Hinzufügen", libAdded: "Hinzugefügt", libClose: "Fertig",
      setHint: "Wird automatisch gespeichert. Karten lassen sich nur im Bearbeitungsmodus ändern.", fixed: "Diese Karte hat eine Größe.", sS: "Klein", sM: "Mittel", sL: "Groß", sW: "Breit", sX: "Extragroß",
      hero: "Heutiger Fortschritt", mood: "Stimmung", habits: "Grundlagen", dayplan: "Tageskalender", tools: "Reflexion & Fokus", calendar: "Monat", weather: "Wetter", rhythm: "Letzte Tage", heatmap: "Gewohnheits-Heatmap", wall: "Fotowand", photos: "Fotoerinnerungen", focus: "Fokus", freq: "Nach Häufigkeit",
      d_hero: "Zitat, Datum und heutiger Fortschritt.", d_mood: "Wie sich der ganze Tag angefühlt hat.", d_habits: "Erledigte rücken ans Ende; groß zeigt 6, breit 4 in einer Reihe, extragroß 8.", d_dayplan: "Google-Kalender des Tages (nur lesen).", d_tools: "Tagesreflexion und Schnellnotiz, mit Fokus-Tab.", d_calendar: "Stimmungen des Monats; Tag öffnen zum Nachtragen.",
      d_weather: "Wetter jetzt, Stundenkurve, Regen- und Schneehinweis.", d_rhythm: "Die letzten 7 Tage auf einen Blick.", d_heatmap: "Wie voll jeder Tag im Monat war.", d_wall: "Dein Foto füllt die Karte; Hinzufügen, Ausschnitt und Wechsel in den Einstellungen.", d_photos: "Fotos dieses Tages (Server-Version).", d_focus: "Fokus mit einem Tipp starten.", d_freq: "Wöchentliche oder monatliche Ziele: Verteilung im Monat." },
  };
  const tr0 = k => (T[document.documentElement.lang?.slice(0, 2)] || T.zh)[k] ?? T.zh[k] ?? k;
  // extra instances (wall2, d_wall3…) reuse the base label: "照片墙 2"
  const tr = k => { const m = /^(d_)?(wall)(\d)$/.exec(k); return m ? (m[1] ? tr0("d_wall") : `${tr0("wall")} ${m[3]}`) : tr0(k); };

  // Wrap the original sections in place (reusing the existing section elements as wrappers).
  const wrap = (el, id) => { el.classList.add("tc-card"); el.dataset.card = id; return el; };
  const box = (id, ...kids) => { const d = document.createElement("div"); kids.forEach(k => d.append(k)); return wrap(d, id); };
  const heroGrid = $(".hero-grid", view), planGrid = $(".daily-planning-grid", view);
  const mood = $(".mood-card", heroGrid), tools = $(".daily-tool-card", planGrid);
  if (!heroGrid || !planGrid || !mood || !tools) return;
  // Quote banner + mood stay the original fixed top row (user 10/21); only the cards below are free.
  const top = heroGrid; top.classList.add("tc-top"); view.prepend(top);
  // Widget sizes in grid cells [columns, rows] (iOS/Android widget model, user 10/21): S 1×1, M 2×1,
  // L 2×2, W 4×1 (strip), X 4×2. Each card lists its allowed sizes; first = default.
  const SIZE = { S: [1, 1], M: [2, 1], L: [2, 2], W: [4, 1], X: [4, 2] };
  const CARDS = [
    { id: "habits", el: box("habits", $(".habits-heading", view), $("#todayHabitCarousel")), sizes: ["L", "W", "X"] },
    { id: "calendar", el: wrap($(".calendar-embedded", view), "calendar"), sizes: ["L", "X"] },
    { id: "dayplan", el: wrap(planGrid, "dayplan"), sizes: ["L"] },
    { id: "tools", el: box("tools", tools), sizes: ["L"] },
    ...(window.LifeLedgerExtraCards || []).map(c => ({ ...c, el: wrap(c.el, c.id) })),
  ];
  const byId = Object.fromEntries(CARDS.map(c => [c.id, c]));
  const els = Object.fromEntries(CARDS.map(c => [c.id, c.el]));
  // Default layout fills every row (below the fixed quote + mood row): weather M + heatmap S + focus S | habits L + month L | plan L + review L |
  // frequency L with rhythm M stacked over heatmap M.
  const ORDER = ["weather", "habits", "heatmap", "focus", "rhythm", "calendar", "dayplan", "tools", "freq", "wall", "photos"];
  view.classList.add("tc-grid");
  document.documentElement.classList.add("tc-on");

  const defaults = () => ORDER.filter(id => byId[id]).concat(CARDS.map(c => c.id).filter(id => !ORDER.includes(id)))
    .map(id => ({ id, size: byId[id].sizes[0], hidden: byId[id].hidden === true }));
  const KEY = "life-ledger-web-today-cards-v4" + NS, OLD = "life-ledger-web-today-cards-v3" + NS;
  const fit = (id, size) => (byId[id].sizes.includes(size) ? size : byId[id].sizes[0]);
  const load = () => {
    try {
      let saved = JSON.parse(localStorage.getItem(KEY)), old = false;
      // v3 (column spans) → v4 (sizes): keep order and hidden; full row → X where allowed. v3 stays for rollback.
      if (!Array.isArray(saved)) { saved = JSON.parse(localStorage.getItem(OLD)); old = true; }
      if (!Array.isArray(saved)) return defaults();
      const rows = saved.filter(r => byId[r?.id]).map(r => ({ id: r.id, size: old ? fit(r.id, r.span === 12 ? "X" : "") : fit(r.id, r.size), hidden: r.hidden === true }));
      const seen = new Set(rows.map(r => r.id));
      if (seen.size !== rows.length) return defaults();
      return rows.concat(defaults().filter(r => !seen.has(r.id)));
    } catch { return defaults(); }
  };
  let layout = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(layout)); } catch {} };

  // Columns and row height follow the canvas width: 4 columns from 860px, else 2 (W shows as M, X as L).
  let geo = { cols: 0, row: 0 };
  function geometry() {
    const w = view.clientWidth;
    if (!w) return;
    const cols = w >= 860 ? 4 : 2, gap = cols === 4 ? 20 : 14, colW = (w - gap * (cols - 1)) / cols;
    geo = { cols, row: Math.round(Math.min(220, Math.max(170, colW * 0.8))) };
    view.classList.toggle("tc-2col", cols === 2); view.style.setProperty("--tc-cols", cols); view.style.setProperty("--tc-gap", gap + "px"); view.style.setProperty("--tc-row", geo.row + "px");
  }
  const shownSize = row => (geo.cols === 2 ? { W: "M", X: "L" }[row.size] || row.size : row.size);
  // Foundations per page by size: L 2×3, W 4×1 (2 on two columns), X 4×2. app.js reads data-per.
  function habitsPer() {
    const el = els.habits, [c, r] = { X: [4, 2], W: [4, 1], M: [2, 1] }[el.dataset.size] || [2, 3];
    el.style.setProperty("--hc", c); el.style.setProperty("--hr", r);
    if (el.dataset.per === String(c * r)) return false;
    el.dataset.per = String(c * r); return true;
  }
  function apply() {
    geometry();
    let prev = top;
    for (const row of layout) {
      const el = els[row.id], s = shownSize(row);
      if (el.dataset.size !== s) el.dataset.size = s;
      el.style.gridColumn = `span ${SIZE[s][0]}`; el.style.gridRow = `span ${SIZE[s][1]}`;
      if (el.hidden !== row.hidden) el.hidden = row.hidden;
      const want = prev ? prev.nextElementSibling : view.firstElementChild;
      if (want !== el) prev ? prev.after(el) : view.prepend(el);
      prev = el;
    }
    if (habitsPer() && document.readyState !== "loading") window.renderToday?.();
    refreshControls();
    for (const row of layout) if (!row.hidden) byId[row.id].onShow?.();
  }

  // ---- edit mode ----
  let editing = false, sortable = null, dragging = false;
  const toggle = document.createElement("button");
  toggle.type = "button"; toggle.id = "tcEditToggle"; toggle.className = "secondary-button tc-edit-toggle";
  toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/></svg><span></span>';
  document.body.append(toggle);

  const bar = document.createElement("div");
  bar.className = "tc-bar"; bar.hidden = true; bar.setAttribute("role", "toolbar");
  bar.innerHTML = '<p class="tc-hint"></p><button type="button" class="secondary-button tc-add-btn" aria-haspopup="dialog"></button><button type="button" class="text-button tc-reset"></button><button type="button" class="primary-button tc-done"></button>';
  document.body.append(bar);

  for (const { el } of CARDS) {
    const c = document.createElement("div");
    c.className = "tc-controls";
    c.innerHTML = '<span class="tc-grip" aria-hidden="true">⠿</span><b class="tc-name"></b><button type="button" data-tc="left">←</button><button type="button" data-tc="right">→</button><button type="button" data-tc="settings" class="tc-gear">⚙</button><button type="button" data-tc="hide" class="tc-hide">✕</button>';
    el.prepend(c);
  }

  // Card settings and card library: two plain dialogs, styled like the original dialogs.
  const sheet = document.createElement("dialog");
  sheet.className = "tc-dialog"; sheet.id = "tcSettings";
  sheet.innerHTML = '<form method="dialog"><header><div><span class="kicker"></span><h2></h2></div><button type="submit" class="primary-button tc-close"></button></header><div class="tc-dialog-body"><p class="tc-note"></p><div class="tc-sizes" role="radiogroup"></div><div class="tc-extra"></div><button type="button" class="text-button tc-remove"></button></div></form>';
  const lib = document.createElement("dialog");
  lib.className = "tc-dialog tc-library"; lib.id = "tcLibrary";
  lib.innerHTML = '<form method="dialog"><header><div><span class="kicker"></span><h2></h2></div><button type="submit" class="primary-button tc-close"></button></header><div class="tc-dialog-body"><p class="tc-note"></p><div class="tc-lib-list"></div></div></form>';
  document.body.append(sheet, lib);
  let sheetId = "";
  sheet.addEventListener("close", () => {
    if (sheetFromView) { sheetFromView = false; setEditing(false, { focus: false }); return; }
    const el = els[sheetId]; if (editing && el && !el.hidden) el.querySelector(".tc-gear")?.focus({ preventScroll: true });
  });

  let sheetFromView = false;
  function openSettings(id) {
    if (!byId[id]) return;
    sheetFromView = !editing;  // e.g. weather "Set location" in normal view
    if (!editing) setEditing(true, { focus: false });
    sheetId = id;
    renderSettings();
    if (!sheet.open) sheet.showModal();
  }
  function renderSettings() {
    const id = sheetId, row = layout.find(r => r.id === id), card = byId[id];
    sheet.querySelector(".kicker").textContent = tr("settings");
    sheet.querySelector("h2").textContent = tr(id);
    sheet.querySelector(".tc-close").textContent = tr("done");
    sheet.querySelector(".tc-note").textContent = card.sizes.length > 1 ? tr("setHint") : `${tr("fixed")} ${tr("setHint")}`;
    sheet.querySelector(".tc-sizes").innerHTML = card.sizes.length > 1 ? `<span>${tr("size")}</span>` + [...card.sizes].sort((a, b) => "SMLWX".indexOf(a) - "SMLWX".indexOf(b)).map(s => `<button type="button" role="radio" data-tcsize="${s}" aria-checked="${row.size === s}" class="${row.size === s ? "is-on" : ""}"><i class="tc-size-ico" style="--w:${SIZE[s][0]};--h:${SIZE[s][1]}" aria-hidden="true"></i>${tr("s" + s)}</button>`).join("") : "";
    const extra = sheet.querySelector(".tc-extra");
    if (extra.dataset.for !== id || !sheet.open) { extra.replaceChildren(); extra.dataset.for = id; card.settings?.(extra); }
    else card.relabel?.(extra);
    sheet.querySelector(".tc-remove").textContent = tr("hide");
  }
  sheet.addEventListener("click", e => {
    const s = e.target.closest("[data-tcsize]");
    if (s) { const size = s.dataset.tcsize; layout.find(r => r.id === sheetId).size = size; save(); apply(); renderSettings(); window.renderToday?.(); sheet.querySelector(`.tc-sizes [data-tcsize="${size}"]`)?.focus(); }
    if (e.target.closest(".tc-remove")) { const fromView = sheetFromView; layout.find(r => r.id === sheetId).hidden = true; save(); apply(); sheet.close(); if (fromView) setTimeout(() => toggle.focus()); else bar.querySelector(".tc-add-btn")?.focus(); }
  });

  function openLibrary() {
    if (!editing) setEditing(true, { focus: false });
    lib.querySelector(".kicker").textContent = tr("libKicker");
    lib.querySelector("h2").textContent = tr("libTitle");
    lib.querySelector(".tc-close").textContent = tr("libClose");
    lib.querySelector(".tc-note").textContent = tr("libHint");
    const chip = id => view.querySelector(`[data-card="${id}"] .ll-chip`)?.closest(".ll-head");
    lib.querySelector(".tc-lib-list").innerHTML = layout.map(r => { const h = chip(r.id); return `<div class="tc-lib-item${r.hidden ? "" : " is-added"}"><div class="ll-head" style="${h ? `--w-solid:${h.style.getPropertyValue("--w-solid")};--w-soft:${h.style.getPropertyValue("--w-soft")}` : ""}">${h ? h.querySelector(".ll-chip").outerHTML : ""}<span><strong>${tr(r.id)}</strong><small>${tr("d_" + r.id)}</small></span></div><button type="button" class="secondary-button" data-add="${r.id}" ${r.hidden ? "" : "disabled"}>${r.hidden ? tr("libAdd") : "✓ " + tr("libAdded")}</button></div>`; }).join("");
    const list = lib.querySelector(".tc-lib-list"), atEnd = () => list.classList.toggle("is-end", list.scrollTop + list.clientHeight >= list.scrollHeight - 4);
    list.onscroll = atEnd;
    if (!lib.open) lib.showModal();
    list.scrollTop = 0; atEnd();
  }
  lib.addEventListener("click", e => {
    const id = e.target.closest("[data-add]")?.dataset.add;
    if (!id) return;
    const row = layout.find(r => r.id === id);
    row.hidden = false; layout = layout.filter(r => r !== row).concat(row);
    for (const k of els[id].children) if (!k.classList.contains("tc-controls")) k.inert = editing;
    save(); apply(); window.renderToday?.(); lib.close(); flash(els[id]);
  });

  function refreshControls() {
    toggle.querySelector("span").textContent = tr("edit");
    toggle.setAttribute("aria-label", tr("edit"));
    bar.querySelector(".tc-hint").textContent = tr("hint");
    bar.querySelector(".tc-add-btn").textContent = "＋ " + tr("add");
    bar.querySelector(".tc-reset").textContent = tr("reset");
    bar.querySelector(".tc-done").textContent = tr("done");
    const shown = layout.filter(r => !r.hidden);
    for (const row of layout) {
      const c = els[row.id].querySelector(":scope > .tc-controls");
      c.querySelector(".tc-name").textContent = tr(row.id);
      const i = shown.indexOf(row);
      const [l, r, g, h] = c.querySelectorAll("button");
      l.disabled = i <= 0; r.disabled = i === shown.length - 1;
      l.setAttribute("aria-label", `${tr("left")} · ${tr(row.id)}`); r.setAttribute("aria-label", `${tr("right")} · ${tr(row.id)}`);
      g.setAttribute("aria-label", `${tr("settings")} · ${tr(row.id)}`); g.title = tr("settings");
      h.setAttribute("aria-label", `${tr("hide")} · ${tr(row.id)}`); h.title = tr("hide");
    }
  }

  function setEditing(on, { focus = true } = {}) {
    if (editing === on) return;
    editing = on;
    view.classList.toggle("tc-editing", on);
    // Card content is inert while editing: no clicks, no tab stops, only the card controls.
    for (const el of Object.values(els)) for (const k of el.children) if (!k.classList.contains("tc-controls")) k.inert = on;
    bar.hidden = !on;
    toggle.setAttribute("aria-pressed", String(on));
    if (!on) { if (sheet.open) sheet.close(); if (lib.open) lib.close(); }
    if (on && window.Sortable && !sortable) {
      sortable = window.Sortable.create(view, {
        draggable: ".tc-card", filter: ".tc-controls button", preventOnFilter: false, animation: 220,
        forceFallback: true, fallbackTolerance: 4, delay: 160, delayOnTouchOnly: true,
        easing: "cubic-bezier(.2,.8,.2,1)", ghostClass: "tc-ghost", chosenClass: "tc-chosen",
        // Backfill pauses while dragging so cards don't jump under the pointer.
        onStart: () => { dragging = true; view.classList.add("tc-dragging"); },
        onEnd: () => {
          view.classList.remove("tc-dragging");
          setTimeout(() => { dragging = false; });
          const order = [...view.querySelectorAll(":scope > .tc-card")].map(el => el.dataset.card);
          layout.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)); save(); apply();
        },
      });
    }
    sortable?.option("disabled", !on);
    if (focus) (on ? view.querySelector(".tc-card:not([hidden]) .tc-controls button:not(:disabled)") : toggle)?.focus({ preventScroll: true });
  }
  // Leaving Today ends editing, so the toolbar never floats over another view.
  new MutationObserver(() => { if (editing && !view.classList.contains("active")) setEditing(false, { focus: false }); }).observe(view, { attributes: true, attributeFilter: ["class"] });

  const flash = el => { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.remove("tc-new"); void el.offsetWidth; el.classList.add("tc-new"); setTimeout(() => el.classList.remove("tc-new"), 1600); };

  view.addEventListener("click", e => {
    if (!editing || dragging) return;
    const b = e.target.closest(".tc-controls button");
    const card = e.target.closest(".tc-card");
    if (!card || card.parentElement !== view) return;
    const id = card.dataset.card;
    if (!b) { openSettings(id); return; }  // C2: in edit mode, clicking a card opens its settings
    const row = layout.find(r => r.id === id), shown = layout.filter(r => !r.hidden), i = shown.indexOf(row);
    if (b.dataset.tc === "settings") { openSettings(id); return; }
    if (b.dataset.tc === "hide") row.hidden = true;
    if (b.dataset.tc === "left" || b.dataset.tc === "right") {
      const other = shown[i + (b.dataset.tc === "left" ? -1 : 1)];
      if (!other) return;
      const a = layout.indexOf(row), z = layout.indexOf(other);
      [layout[a], layout[z]] = [layout[z], layout[a]];
    }
    save(); apply();
    (b.dataset.tc === "hide" ? bar.querySelector(".tc-add-btn") : els[id].querySelector(`[data-tc="${b.dataset.tc}"]:not(:disabled)`) || els[id].querySelector(".tc-gear"))?.focus();
  });
  toggle.addEventListener("click", () => setEditing(!editing));
  bar.querySelector(".tc-done").addEventListener("click", () => setEditing(false));
  bar.querySelector(".tc-reset").addEventListener("click", () => { layout = defaults(); save(); apply(); window.renderToday?.(); });
  bar.querySelector(".tc-add-btn").addEventListener("click", openLibrary);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && editing && !document.querySelector("dialog[open], .day-drawer.open")) setEditing(false); });
  new MutationObserver(() => { refreshControls(); if (sheet.open) renderSettings(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  let lastCols = 0;
  new ResizeObserver(() => { const before = geo.row; geometry(); if (geo.cols !== lastCols || geo.row !== before) { lastCols = geo.cols; apply(); } }).observe(view);

  apply();
  window.LifeLedgerTodayCards = { get: () => layout.map(r => ({ ...r })), sizes: () => Object.fromEntries(CARDS.map(c => [c.id, [...c.sizes]])), setEditing, openSettings, openLibrary, show: id => { const r = layout.find(x => x.id === id); if (r?.hidden) { r.hidden = false; save(); apply(); } }, reset: () => { layout = defaults(); save(); apply(); } };
})();
