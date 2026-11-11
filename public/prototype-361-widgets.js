/**
 * Variant C widget registry — stable ids, allowed sizes, size-aware renderers.
 * New product widgets register here; layout state only stores id + semantic size.
 */

export const WIDGET_SIZES = ["s", "m", "l"];

export function sizeLabel(size) {
  return { s: "小", m: "中", l: "大" }[size] || size;
}

export function createWidgetRegistry(deps) {
  const { illustrations, completionRateForDay, isAllDoneToday, timeOfDayIllus, formatFocus } = deps;

  function habitIso(state) {
    return state.view === "week" ? state.weekSelectedIso : state.anchor;
  }

  function nextOpenHabit(state) {
    const iso = habitIso(state);
    const map = state.completions[iso] || {};
    return state.habits.find((h) => !map[h.id]) || state.habits[0];
  }

  const registry = {
    greeting: {
      id: "greeting",
      title: "今日问候",
      allowedSizes: ["s", "m", "l"],
      defaultSize: "m",
      render(state, size) {
        const illusKey = isAllDoneToday(state) ? "allDone" : timeOfDayIllus();
        const { done, total } = completionRateForDay(state, state.anchor);
        if (size === "s") {
          return `
            <div class="proto-w-greeting proto-w-greeting--s">
              <span class="proto-w-illus-sm">${illustrations[illusKey]}</span>
              <div>
                <strong class="proto-w-title">10月12日</strong>
                <span class="proto-w-meta">${done}/${total} 习惯</span>
              </div>
              ${state.firstWeekBanner ? `<button type="button" class="proto-btn proto-btn--ghost proto-w-cta" data-action="dismiss-first-week">知道了</button>` : ""}
            </div>`;
        }
        if (size === "m") {
          return `
            <div class="proto-w-greeting proto-w-greeting--m">
              ${illustrations[illusKey]}
              <div>
                <strong class="proto-w-title">周日 · 10月12日</strong>
                <span class="proto-w-meta">3.6.1 study · ${done}/${total} · 上海 17:30</span>
              </div>
            </div>
            ${state.firstWeekBanner ? `<div class="proto-w-banner-compact">${illustrations.firstWeek}<span>第一周 Life Ledger</span><button type="button" class="proto-btn proto-btn--ghost" data-action="dismiss-first-week">×</button></div>` : ""}`;
        }
        return `
          <div class="proto-w-greeting proto-w-greeting--l">
            ${illustrations[illusKey]}
            <div>
              <strong class="proto-w-title-lg">周日 · 10月12日</strong>
              <p class="proto-w-meta">3.6.1 design study · ${done}/${total} 习惯完成 · 上海 17:30</p>
            </div>
          </div>
          ${state.firstWeekBanner ? `<div class="proto-w-banner">${illustrations.firstWeek}<span>第一周使用 Life Ledger — 保持轻量记录即可。</span><button type="button" class="proto-btn proto-btn--ghost" data-action="dismiss-first-week">知道了</button></div>` : `<p class="proto-w-meta">今日节奏平稳，晚间适合复盘与照片整理。</p>`}`;
      },
    },

    habits: {
      id: "habits",
      title: "习惯",
      allowedSizes: ["s", "m", "l"],
      defaultSize: "l",
      render(state, size) {
        const iso = habitIso(state);
        const map = state.completions[iso] || {};
        const { done, total } = completionRateForDay(state, iso);
        const pct = total ? Math.round((done / total) * 100) : 0;
        const next = nextOpenHabit(state);
        const row = (h, compact) => `
          <li class="proto-habit ${map[h.id] ? "is-done" : ""} ${compact ? "proto-habit--compact" : ""}" style="--habit-color:${h.color}">
            <button type="button" class="proto-habit-check" data-action="toggle-habit" data-habit="${h.id}" aria-pressed="${map[h.id] ? "true" : "false"}" aria-label="${h.name}"></button>
            <span class="proto-habit-name">${h.name}</span>
            ${compact ? "" : `<span class="proto-habit-meta">${map[h.id] ? "完成" : "待办"}</span>`}
          </li>`;
        if (size === "s") {
          return `
            <div class="proto-w-habits-s">
              <div class="proto-w-stat-ring" aria-hidden="true"><span>${done}</span><small>/${total}</small></div>
              <div class="proto-w-stack">
                <span class="proto-w-meta">下一项 · ${next.name}</span>
                <button type="button" class="proto-btn proto-btn--primary proto-w-cta" data-action="toggle-habit" data-habit="${next.id}">${map[next.id] ? "已完成" : "打卡"}</button>
              </div>
            </div>`;
        }
        if (size === "m") {
          return `
            <ul class="proto-habit-list proto-habit-list--tight">${state.habits.slice(0, 3).map((h) => row(h, true)).join("")}</ul>
            <div class="proto-progress"><span style="width:${pct}%"></span></div>`;
        }
        return `
          <p class="proto-w-meta proto-w-line-clamp-1">${illustrations.morning}<span>晨间优先 · ${done}/${total}</span></p>
          <ul class="proto-habit-list proto-habit-list--tight">${state.habits.map((h) => row(h, false)).join("")}</ul>
          <div class="proto-progress"><span style="width:${pct}%"></span></div>`;
      },
    },

    mood: {
      id: "mood",
      title: "心情",
      allowedSizes: ["s", "m"],
      defaultSize: "m",
      render(state, size) {
        const faces = ["😐", "🙂", "😊", "😌", "🌟"];
        const selected = faces[state.mood.value - 1] || "🙂";
        if (size === "s") {
          return `
            <div class="proto-w-mood-s">
              <span class="proto-w-mood-emoji" aria-hidden="true">${selected}</span>
              <span class="proto-w-meta">心情 ${state.mood.value}/5</span>
              <button type="button" class="proto-btn proto-btn--ghost proto-w-cta" data-action="mood-cycle">调整</button>
            </div>`;
        }
        return `
          <div class="proto-mood-row proto-mood-row--widget">
            ${faces.map((f, i) => `<button type="button" class="proto-mood-btn ${state.mood.value === i + 1 ? "is-selected" : ""}" data-action="mood" data-value="${i + 1}">${f}</button>`).join("")}
          </div>
          <p class="proto-w-meta proto-w-line-clamp-2">${state.mood.note}</p>`;
      },
    },

    reflection: {
      id: "reflection",
      title: "复盘",
      allowedSizes: ["s", "m", "l"],
      defaultSize: "m",
      render(state, size) {
        const status =
          state.reflection.status === "saving" ? "保存中…" : state.reflection.status === "success" ? "已保存" : "";
        const preview = state.reflection.draft.slice(0, 48) + (state.reflection.draft.length > 48 ? "…" : "");
        if (size === "s") {
          return `
            <div class="proto-w-reflection-s">
              <span class="proto-w-illus-sm">${illustrations.reflection}</span>
              <p class="proto-w-line-clamp-2">${preview}</p>
              <button type="button" class="proto-btn proto-btn--primary proto-w-cta" data-action="save-reflection">保存</button>
            </div>`;
        }
        if (size === "m") {
          return `
            <textarea class="proto-w-textarea proto-w-textarea--m" data-bind="reflection" rows="3">${state.reflection.draft}</textarea>
            <div class="proto-w-row">
              <button type="button" class="proto-btn proto-btn--primary ${state.reflection.status === "saving" ? "is-loading" : ""}" data-action="save-reflection">保存复盘</button>
              <span class="proto-w-meta">${status}</span>
            </div>`;
        }
        return `
          <textarea class="proto-w-textarea proto-w-textarea--l" data-bind="reflection">${state.reflection.draft}</textarea>
          <div class="proto-w-row">
            <button type="button" class="proto-btn proto-btn--primary ${state.reflection.status === "success" ? "is-success" : ""} ${state.reflection.status === "saving" ? "is-loading" : ""}" data-action="save-reflection">保存复盘</button>
            <span class="proto-w-meta">${status || "完整编辑视图"}</span>
          </div>`;
      },
    },

    photos: {
      id: "photos",
      title: "照片",
      allowedSizes: ["s", "m", "l"],
      defaultSize: "s",
      render(state, size) {
        const empty = state.photos.length === 0;
        if (size === "s") {
          return empty
            ? `<div class="proto-w-photos-s">${illustrations.emptyPhotos}<button type="button" class="proto-btn proto-w-cta" data-action="add-photo">添加</button></div>`
            : `<div class="proto-w-photos-s"><span class="proto-w-title">${state.photos.length} 张</span><button type="button" class="proto-btn proto-btn--ghost" data-action="add-photo">+</button></div>`;
        }
        if (size === "m") {
          const slots = empty
            ? `<div class="proto-w-empty-inline">${illustrations.emptyPhotos}<span>暂无照片</span></div>`
            : state.photos
                .slice(0, 3)
                .map((p) => `<div class="proto-photo-slot is-filled">${p.label}</div>`)
                .join("");
          return `<div class="proto-photo-grid proto-photo-grid--m">${slots}<button type="button" class="proto-photo-slot" data-action="add-photo">+</button></div>`;
        }
        const grid = empty
          ? `<div class="proto-w-empty-inline">${illustrations.emptyPhotos}<p>今天还没有照片记忆</p><button type="button" class="proto-btn" data-action="add-photo">添加示例</button></div>`
          : `<div class="proto-photo-grid">${state.photos.map((p) => `<div class="proto-photo-slot is-filled">${p.label}</div>`).join("")}<button type="button" class="proto-photo-slot" data-action="add-photo">+</button></div>`;
        return grid;
      },
    },

    focus: {
      id: "focus",
      title: "专注",
      allowedSizes: ["s", "m", "l"],
      defaultSize: "m",
      render(state, size) {
        if (size === "s") {
          return `
            <div class="proto-w-focus-s">
              <span class="proto-w-focus-time">${formatFocus(state.focus.secondsLeft)}</span>
              <button type="button" class="proto-btn proto-btn--primary proto-w-cta" data-action="toggle-focus">${state.focus.running ? "暂停" : "开始"}</button>
            </div>`;
        }
        if (size === "m") {
          return `
            <div class="proto-focus-ring proto-focus-ring--widget">
              <div class="proto-focus-dial ${state.focus.running ? "is-running" : ""}">${formatFocus(state.focus.secondsLeft)}</div>
              <div>
                <p class="proto-w-meta">今日 ${state.focus.sessionsToday} 次 · ${state.focus.totalToday} 分</p>
                <button type="button" class="proto-btn proto-btn--primary" data-action="toggle-focus">${state.focus.running ? "暂停" : "25 分钟"}</button>
              </div>
            </div>`;
        }
        return `
          <div class="proto-w-focus-l">
            <div class="proto-focus-dial proto-focus-dial--lg ${state.focus.running ? "is-running" : ""}">${formatFocus(state.focus.secondsLeft)}</div>
            <ul class="proto-w-focus-log">
              <li>上午 · 专注 25 分 · 写作</li>
              <li>下午 · 专注 27 分 · 阅读</li>
              <li class="proto-w-meta">今日累计 ${state.focus.totalToday} 分钟</li>
            </ul>
            <button type="button" class="proto-btn proto-btn--primary" data-action="toggle-focus">${state.focus.running ? "暂停专注" : "开始 25 分钟"}</button>
          </div>`;
      },
    },

    "week-glance": {
      id: "week-glance",
      title: "本周一览",
      allowedSizes: ["s", "m", "l"],
      defaultSize: "m",
      render(state, size) {
        const days = state.weekDays;
        const strip = (subset) =>
          subset
            .map(
              (d) => `
          <button type="button" class="proto-week-day proto-week-day--widget ${d.isToday ? "is-today" : ""} ${state.weekSelectedIso === d.iso ? "is-selected" : ""}" data-action="week-day" data-iso="${d.iso}">
            <span class="proto-w-meta">${d.labelZh}</span>
            <span class="proto-week-day-num">${d.dayNum}</span>
          </button>`
            )
            .join("");
        if (size === "s") {
          const idx = days.findIndex((d) => d.isToday);
          const subset = days.slice(Math.max(0, idx - 1), idx + 2);
          return `<div class="proto-week-strip proto-week-strip--s">${strip(subset)}</div>`;
        }
        if (size === "m") {
          return `<div class="proto-week-strip">${strip(days)}</div>`;
        }
        const rows = days
          .map((d) => {
            const { done, total } = completionRateForDay(state, d.iso);
            return `<div class="proto-week-row proto-week-row--widget ${d.isToday ? "is-today" : ""}">
              <span class="proto-w-meta">${d.labelZh}</span>
              <button type="button" class="proto-w-link" data-action="week-day" data-iso="${d.iso}">${done}/${total} 习惯</button>
            </div>`;
          })
          .join("");
        return `
          <div class="proto-week-strip">${strip(days)}</div>
          <div class="proto-week-agenda proto-week-agenda--widget">${rows}</div>
          <p class="proto-w-meta proto-w-line-clamp-1">${illustrations.calendarInsight} 本周完成率 74%</p>`;
      },
    },

    insights: {
      id: "insights",
      title: "洞察",
      allowedSizes: ["s", "m"],
      defaultSize: "s",
      render(state, size) {
        if (size === "s") {
          return `
            <div class="proto-w-insights-s">
              ${illustrations.calendarInsight}
              <div>
                <strong class="proto-w-title">74%</strong>
                <span class="proto-w-meta">本周习惯</span>
              </div>
              <button type="button" class="proto-btn proto-btn--ghost proto-w-cta" data-action="view" data-view="week">查看</button>
            </div>`;
        }
        return `
          <ul class="proto-w-insights-list">
            <li><strong>+6%</strong> 较上周完成率</li>
            <li>周三 · 写作最稳定</li>
            <li>周末 · 照片待整理</li>
          </ul>
          <button type="button" class="proto-btn" data-action="view" data-view="week">打开本周</button>`;
      },
    },
  };

  return registry;
}

export function normalizeWidgetSize(registry, widgetId, size) {
  const def = registry[widgetId];
  if (!def) return "m";
  if (def.allowedSizes.includes(size)) return size;
  return def.defaultSize;
}
