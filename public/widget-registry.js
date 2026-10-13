/**
 * Life Ledger 2.0 — Widget Registry
 * Project-owned boundary managing widget definitions, allowed sizes, and
 * size-specific content rendering according to the Life Ledger 2.0 contract.
 */
(function (root) {
  const ALLOWED_SIZES = ["small", "medium", "large"];

  let appTranslator = null;
  let contextProvider = () => ({});

  function setTranslator(fn) {
    if (typeof fn === "function") appTranslator = fn;
  }

  function tr(key, varsOrFallback = {}, fallbackStr = "") {
    let vars = {};
    let fallback = fallbackStr;
    if (typeof varsOrFallback === "string") {
      fallback = varsOrFallback;
    } else if (varsOrFallback && typeof varsOrFallback === "object") {
      vars = varsOrFallback;
      if (vars.fallback) fallback = vars.fallback;
    }
    if (appTranslator) {
      try {
        const res = appTranslator(key, vars);
        if (typeof res === "string" && res !== key && !res.startsWith("modules.")) {
          return res;
        }
      } catch {
        // ignore
      }
    }
    return fallback || key;
  }

  function escapeHtml(text) {
    return String(text ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function part(element, name) {
    return element?.querySelector(`[data-widget-part="${name}"]`) || null;
  }

  function setPartHidden(element, name, hidden) {
    const node = part(element, name);
    if (node) node.hidden = Boolean(hidden);
  }

  function resetParts(element, names, hidden = true) {
    for (const name of names) {
      setPartHidden(element, name, hidden);
    }
  }

  class WidgetRegistry {
    constructor() {
      this._widgets = new Map();
      this._initDefaultWidgets();
    }

    setTranslator(fn) {
      setTranslator(fn);
    }

    setContextProvider(fn) {
      if (typeof fn === "function") {
        contextProvider = fn;
      }
    }

    register(definition) {
      if (!definition || typeof definition !== "object") {
        throw new Error("Widget definition must be an object");
      }
      const { id, type, allowedSizes, defaultSize, defaultPlacement, render } = definition;
      if (!id || typeof id !== "string") throw new Error("Widget id is required");
      if (!type || typeof type !== "string") throw new Error("Widget type is required");
      if (!Array.isArray(allowedSizes) || allowedSizes.length === 0) {
        throw new Error("Widget allowedSizes must be a non-empty array");
      }
      for (const s of allowedSizes) {
        if (!ALLOWED_SIZES.includes(s)) {
          throw new Error(`Invalid size "${s}". Allowed: ${ALLOWED_SIZES.join(", ")}`);
        }
      }
      if (!allowedSizes.includes(defaultSize)) {
        throw new Error(`defaultSize "${defaultSize}" must be in allowedSizes`);
      }
      if (typeof render !== "function") {
        throw new Error("Widget render must be a function");
      }

      const widget = {
        id,
        type,
        allowedSizes: [...allowedSizes],
        defaultSize,
        defaultPlacement: { ...defaultPlacement },
        render,
        getA11ySummary: definition.getA11ySummary || (() => ""),
        settingsSchema: definition.settingsSchema || {},
        migrateSettings: definition.migrateSettings || (p => p || {}),
      };

      this._widgets.set(id, widget);
      this._widgets.set(type, widget);
      return widget;
    }

    get(typeOrId) {
      return this._widgets.get(typeOrId) || null;
    }

    has(typeOrId) {
      return this._widgets.has(typeOrId);
    }

    getAll() {
      const seen = new Set();
      const list = [];
      for (const widget of this._widgets.values()) {
        if (!seen.has(widget.id)) {
          seen.add(widget.id);
          list.push(widget);
        }
      }
      return list;
    }

    unregister(typeOrId) {
      const widget = this.get(typeOrId);
      if (!widget) return false;
      this._widgets.delete(widget.id);
      this._widgets.delete(widget.type);
      return true;
    }

    _initDefaultWidgets() {
      this.register({
        id: "today-summary",
        type: "summary",
        allowedSizes: ["small", "medium", "large"],
        defaultSize: "large",
        defaultPlacement: { x: 0, y: 0, size: "large" },
        render({ element, size }) {
          if (!element) return;
          element.dataset.widgetSize = size;
          const ctx = contextProvider();

          const art = element.querySelector("#todayHeaderArt");
          const dateSec = element.querySelector("#todayDateSecondary");
          const meta = element.querySelector(".today-stage-meta");
          const mood = element.querySelector("#quickMood");
          const reason = element.querySelector("#inspectorMoodReason");
          const reflectBtn = element.querySelector("#openDayDetail");
          const eventsStrip = element.querySelector("#todayEventsStrip");
          const nextItem = part(element, "summary-next-item");
          const dateHeading = element.querySelector("#todayDateHeading");
          const summaryLine = element.querySelector("#todaySummary");

          if (art) art.dataset.widgetPart = "summary-greeting";
          if (dateHeading) dateHeading.dataset.widgetPart = "summary-date";
          if (summaryLine) summaryLine.dataset.widgetPart = "summary-completion";
          if (mood) mood.dataset.widgetPart = "summary-mood";
          if (eventsStrip) eventsStrip.dataset.widgetPart = "summary-events";
          if (reflectBtn) reflectBtn.dataset.widgetPart = "summary-review";

          if (art) art.hidden = size !== "large";
          if (dateSec) dateSec.hidden = size === "small";
          if (meta) meta.hidden = size === "small";
          if (mood) mood.hidden = size === "small";
          if (reason) reason.hidden = size === "small";
          if (reflectBtn) reflectBtn.hidden = size !== "large";
          if (eventsStrip) eventsStrip.hidden = size === "small";

          if (nextItem) {
            nextItem.hidden = size === "small";
            if (size !== "small" && ctx.summaryNextItem) {
              nextItem.textContent = ctx.summaryNextItem;
            }
          }
        },
        getA11ySummary(data) {
          const done = Number(data?.completedCount) || 0;
          const total = Number(data?.totalCount) || 0;
          return tr("widgets.a11y.summary", {
            date: data?.date || "",
            done,
            total,
          });
        },
      });

      this.register({
        id: "today-habits",
        type: "habits",
        allowedSizes: ["small", "medium", "large"],
        defaultSize: "large",
        defaultPlacement: { x: 0, y: 2, size: "large" },
        render({ element, size }) {
          if (!element) return;
          element.dataset.widgetSize = size;
          const ctx = contextProvider();

          const openRows = Array.from(element.querySelectorAll("#todayHabitList .today-habit-row, .today-habit-item"));
          const scheduled = element.querySelector("#todayScheduledGroup");
          const completed = element.querySelector("#todayCompletedGroup");
          const notToday = element.querySelector("#todayNotTodayGroup");
          const showAll = part(element, "habits-show-all");
          const openHeading = element.querySelector("#todayOpenHeading");
          if (openHeading) openHeading.dataset.widgetPart = "habits-open-heading";
          if (scheduled) scheduled.dataset.widgetPart = "habits-scheduled";
          if (completed) completed.dataset.widgetPart = "habits-completed";
          if (notToday) notToday.dataset.widgetPart = "habits-not-today";
          openRows.forEach((row, idx) => {
            row.dataset.widgetPart = `habits-row-${idx}`;
          });

          if (size === "small") {
            if (scheduled) scheduled.hidden = true;
            if (completed) completed.hidden = true;
            if (notToday) notToday.hidden = true;
            if (showAll) showAll.hidden = true;
            openRows.forEach((row, idx) => {
              row.hidden = idx > 0;
            });
          } else if (size === "medium") {
            if (scheduled) scheduled.hidden = true;
            if (completed) completed.hidden = true;
            if (notToday) notToday.hidden = true;
            if (showAll) showAll.hidden = true;
            openRows.forEach((row, idx) => {
              row.hidden = idx >= 3;
            });
          } else {
            openRows.forEach(row => { row.hidden = false; });
            if (scheduled) scheduled.hidden = !scheduled.querySelector("li");
            if (completed) {
              completed.hidden = !completed.querySelector("li");
              if (!completed.hidden) completed.open = true;
            }
            if (notToday) {
              notToday.hidden = !notToday.querySelector("li");
              if (!notToday.hidden) notToday.open = true;
            }
            if (showAll) {
              const overflow = Number(ctx.habitsOverflowCount) || 0;
              showAll.hidden = overflow <= 0;
              if (overflow > 0) {
                showAll.textContent = tr("today.showAllHabits", { count: overflow, fallback: `Show all ${overflow}` });
              }
            }
          }
        },
        getA11ySummary(data) {
          const completed = Number(data?.completedCount) || 0;
          const open = Number(data?.openCount) || 0;
          return tr("widgets.a11y.habits", { completed, open });
        },
      });

      this.register({
        id: "today-calendar",
        type: "calendar",
        allowedSizes: ["small", "medium", "large"],
        defaultSize: "large",
        defaultPlacement: { x: 0, y: 5, size: "large" },
        render({ element, size }) {
          if (!element) return;
          element.dataset.widgetSize = size;
          const ctx = contextProvider();
          const locale = ctx.locale || root.document?.documentElement?.lang || "en";

          const nav = element.querySelector(".module-calendar-nav");
          const weekdays = element.querySelector("#todayCalendarWeekdays");
          const grid = element.querySelector("#todayCalendarGrid");
          const card = element.querySelector(".today-calendar-card");
          let compact = part(element, "calendar-compact");
          const body = element.querySelector(".module-body");

          if (!compact && body) {
            compact = root.document.createElement("div");
            compact.className = "calendar-small-callout";
            compact.dataset.widgetPart = "calendar-compact";
            compact.innerHTML = `
              <div class="calendar-callout-day" data-widget-part="calendar-date">
                <span class="calendar-callout-num" data-widget-part="calendar-day-num"></span>
                <span class="calendar-callout-name" data-widget-part="calendar-day-name"></span>
              </div>
              <div class="calendar-callout-streak" data-widget-part="calendar-streak">
                <span class="calendar-callout-badge" data-widget-part="calendar-streak-label"></span>
              </div>
            `;
            body.prepend(compact);
          }

          if (size === "small") {
            if (nav) nav.hidden = true;
            if (card) card.hidden = true;
            if (weekdays) weekdays.hidden = true;
            if (grid) grid.hidden = true;
            if (compact) {
              compact.hidden = false;
              const selected = ctx.selectedDate ? new Date(`${ctx.selectedDate}T12:00:00`) : null;
              const dayNum = part(element, "calendar-day-num");
              const dayName = part(element, "calendar-day-name");
              const streakLabel = part(element, "calendar-streak-label");
              if (selected && dayNum && dayName) {
                dayNum.textContent = String(selected.getDate());
                dayName.textContent = selected.toLocaleDateString(locale, { weekday: "short" });
              }
              if (streakLabel) {
                const streakText = ctx.calendarStreakLabel || "";
                streakLabel.textContent = streakText;
                part(element, "calendar-streak").hidden = !streakText;
              }
            }
          } else if (size === "medium") {
            if (compact) compact.hidden = true;
            if (card) card.hidden = false;
            if (nav) {
              nav.hidden = true;
              delete nav.dataset.widgetPart;
            }
            if (weekdays) weekdays.hidden = false;
            if (grid) {
              grid.hidden = false;
              grid.classList.add("is-heatmap-compact");
              grid.dataset.widgetPart = "calendar-heatmap";
            }
          } else {
            if (compact) compact.hidden = true;
            if (card) card.hidden = false;
            if (nav) {
              nav.hidden = false;
              nav.dataset.widgetPart = "calendar-nav";
            }
            if (weekdays) weekdays.hidden = false;
            if (grid) {
              grid.hidden = false;
              grid.classList.remove("is-heatmap-compact");
              grid.dataset.widgetPart = "calendar-full-grid";
            }
          }
        },
        getA11ySummary() {
          return tr("modules.calendar");
        },
      });

      this.register({
        id: "today-focus",
        type: "focus",
        allowedSizes: ["small", "medium", "large"],
        defaultSize: "small",
        defaultPlacement: { x: 8, y: 0, size: "small" },
        render({ element, size }) {
          if (!element) return;
          element.dataset.widgetSize = size;
          const ctx = contextProvider();

          const streakArt = element.querySelector("#todayFocusStreakArt");
          const openTimerBtn = element.querySelector("#todayFocusOpenTimer");
          const startBtn = element.querySelector("#todayFocusStartBtn");
          const sessionBlock = part(element, "focus-session");
          const historyBlock = part(element, "focus-history");
          let presets = element.querySelector(".today-focus-presets");

          const stats = element.querySelector(".today-focus-stats");
          const actions = element.querySelector(".today-focus-actions");
          if (stats) stats.dataset.widgetPart = "focus-stats";
          if (actions) actions.dataset.widgetPart = "focus-actions";
          if (streakArt) streakArt.dataset.widgetPart = "focus-streak";

          if (startBtn) startBtn.hidden = false;
          if (openTimerBtn) openTimerBtn.hidden = false;

          if (size === "small") {
            if (streakArt) streakArt.hidden = true;
            if (presets) presets.hidden = true;
            if (sessionBlock) sessionBlock.hidden = true;
            if (historyBlock) historyBlock.hidden = true;
          } else if (size === "medium") {
            if (streakArt) streakArt.hidden = true;
            if (historyBlock) historyBlock.hidden = true;
            if (sessionBlock) sessionBlock.hidden = false;
            if (!presets) {
              presets = root.document.createElement("div");
              presets.className = "today-focus-presets";
              presets.dataset.widgetPart = "focus-presets";
              element.querySelector(".today-focus-actions")?.before(presets);
            }
            const minutes = ctx.focusPresetMinutes || [15, 25, 50];
            const active = ctx.focusActivePreset || 25;
            presets.innerHTML = minutes.map(m => `<button type="button" class="chip-preset${m === active ? " is-active" : ""}" data-preset="${m}">${m}m</button>`).join("");
            presets.hidden = false;
          } else {
            if (streakArt) streakArt.hidden = false;
            if (sessionBlock) sessionBlock.hidden = false;
            let history = historyBlock;
            if (!history) {
              history = root.document.createElement("div");
              history.className = "today-focus-history";
              history.dataset.widgetPart = "focus-history";
              history.hidden = false;
              element.querySelector(".module-body")?.appendChild(history);
            } else {
              history.hidden = false;
            }
            if (!presets) {
              presets = root.document.createElement("div");
              presets.className = "today-focus-presets";
              presets.dataset.widgetPart = "focus-presets";
              element.querySelector(".today-focus-actions")?.before(presets);
            }
            const minutes = ctx.focusPresetMinutes || [15, 25, 50];
            const active = ctx.focusActivePreset || 25;
            presets.innerHTML = minutes.map(m => `<button type="button" class="chip-preset${m === active ? " is-active" : ""}" data-preset="${m}">${m}m</button>`).join("");
            presets.hidden = false;
          }
        },
        getA11ySummary(data) {
          return `${data?.minutes || 0}`;
        },
      });

      this.register({
        id: "today-photos",
        type: "photos",
        allowedSizes: ["small", "medium", "large"],
        defaultSize: "medium",
        defaultPlacement: { x: 0, y: 4, size: "medium" },
        render({ element, size }) {
          if (!element) return;
          element.dataset.widgetSize = size;

          const help = element.querySelector("#todayPhotoHelp");
          const addBtn = element.querySelector("#todayPhotoAdd");
          const list = element.querySelector("#todayPhotoList");
          const emptyArt = element.querySelector("#todayPhotoEmptyArt");
          const heading = element.querySelector(".mood-photo-heading");

          if (heading) heading.dataset.widgetPart = "photos-heading";
          if (list) list.dataset.widgetPart = "photos-list";
          if (emptyArt) emptyArt.dataset.widgetPart = "photos-empty-art";
          if (help) help.dataset.widgetPart = "photos-help";
          if (addBtn) {
            addBtn.dataset.widgetPart = size === "medium" ? "photos-inline-add" : "photos-add";
          }

          if (addBtn) addBtn.hidden = false;
          if (emptyArt) emptyArt.hidden = size !== "large";

          if (size === "small") {
            if (help) help.hidden = true;
            if (list) {
              const thumbs = Array.from(list.children);
              thumbs.forEach((t, i) => { t.hidden = i > 0; });
            }
          } else if (size === "medium") {
            if (help) help.hidden = true;
            if (list) {
              const thumbs = Array.from(list.children);
              thumbs.forEach((t, i) => { t.hidden = i >= 3; });
            }
          } else {
            if (help) help.hidden = false;
            if (list) {
              Array.from(list.children).forEach(t => { t.hidden = false; });
            }
          }
        },
        getA11ySummary(data) {
          return `${data?.count || 0}`;
        },
      });

      this.register({
        id: "today-reflection",
        type: "reflection",
        allowedSizes: ["small", "medium", "large"],
        defaultSize: "small",
        defaultPlacement: { x: 8, y: 2, size: "small" },
        render({ element, size }) {
          if (!element) return;
          element.dataset.widgetSize = size;
          const ctx = contextProvider();

          const textarea = element.querySelector("#homeDayNote");
          const voiceBtn = element.querySelector("#voiceReflectionButton");
          const autosave = element.querySelector("#homeJournalSave");
          const status = part(element, "reflection-status");
          const prompt = part(element, "reflection-prompt");
          const dayContext = part(element, "reflection-day-context");

          if (textarea) {
            textarea.hidden = false;
            if (size === "small") delete textarea.dataset.widgetPart;
            else textarea.dataset.widgetPart = "reflection-editor";
          }
          if (autosave) autosave.hidden = size === "small";

          if (status && ctx.reflectionStatus) {
            status.textContent = ctx.reflectionStatus;
          }
          if (prompt && ctx.reflectionPrompt) {
            prompt.textContent = ctx.reflectionPrompt;
          }

          if (size === "small") {
            if (voiceBtn) voiceBtn.hidden = true;
            if (status) status.hidden = false;
            if (prompt) prompt.hidden = false;
            if (dayContext) dayContext.hidden = true;
            if (textarea) {
              textarea.rows = 2;
              textarea.classList.add("is-compact-reflection");
            }
          } else if (size === "medium") {
            if (voiceBtn) voiceBtn.hidden = false;
            if (status) status.hidden = true;
            if (prompt) prompt.hidden = true;
            if (dayContext) dayContext.hidden = true;
            if (textarea) {
              textarea.rows = 3;
              textarea.classList.remove("is-compact-reflection");
            }
          } else {
            if (voiceBtn) voiceBtn.hidden = false;
            if (status) status.hidden = true;
            if (prompt) prompt.hidden = true;
            if (dayContext) dayContext.hidden = false;
            if (textarea) {
              textarea.rows = 6;
              textarea.classList.remove("is-compact-reflection");
            }
          }
        },
        getA11ySummary(data) {
          return data?.hasNote ? "1" : "0";
        },
      });

      this.register({
        id: "today-context",
        type: "context",
        allowedSizes: ["small", "medium", "large"],
        defaultSize: "small",
        defaultPlacement: { x: 8, y: 1, size: "small" },
        render({ element, size }) {
          if (!element) return;
          element.dataset.widgetSize = size;
          const ctx = contextProvider();

          const compact = part(element, "context-compact");
          const weekStrip = part(element, "context-week-strip");
          const aside = part(element, "context-aside");

          if (compact) {
            const percentEl = part(element, "context-percent");
            const barsEl = part(element, "context-mini-bars");
            if (size === "small") {
              compact.hidden = false;
              if (percentEl && ctx.contextSevenDayPercent != null) {
                const label = ctx.contextConsistencyLabel ? ` ${ctx.contextConsistencyLabel}` : "";
                percentEl.textContent = `${ctx.contextSevenDayPercent}${label}`;
              }
              if (barsEl && Array.isArray(ctx.contextMiniBars)) {
                barsEl.innerHTML = ctx.contextMiniBars
                  .map(fill => `<i style="--fill:${fill}"></i>`)
                  .join("");
              }
            } else {
              compact.hidden = true;
            }
          }

          if (weekStrip) {
            weekStrip.hidden = size === "small";
          }

          if (aside) {
            aside.hidden = size !== "large";
          }

          const legacyAside = element.querySelector(".today-context-aside");
          const legacyWeek = element.querySelector(".today-context-week");
          if (legacyAside && !aside) {
            legacyAside.hidden = size !== "large";
          }
          if (legacyWeek && !weekStrip) {
            legacyWeek.classList.toggle("is-kpi-only", false);
            if (size === "small") {
              const dayItems = legacyWeek.querySelectorAll("ol li");
              dayItems.forEach(li => { li.hidden = false; });
            }
          }
        },
        getA11ySummary(data) {
          return `${data?.rate || 0}`;
        },
      });
    }
  }

  const instance = new WidgetRegistry();
  root.LifeLedgerWidgetRegistry = instance;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { WidgetRegistry, widgetRegistry: instance };
  }
})(typeof window !== "undefined" ? window : globalThis);
