/** In-memory Life Ledger fixture — shared across variants A/B/C. */

export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function isoDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function addDays(base, offset) {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return d;
}

const ANCHOR = new Date(2026, 9, 12); // Oct 12, 2026 — aligns with study session

export function buildWeekDays(anchor = ANCHOR) {
  const monday = addDays(anchor, -((anchor.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(monday, i);
    return {
      iso: isoDate(d),
      label: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
      labelZh: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][i],
      dayNum: d.getDate(),
      isToday: isoDate(d) === isoDate(anchor),
      isWeekend: i >= 5,
    };
  });
}

export function createInitialState() {
  const weekDays = buildWeekDays();
  const todayIso = isoDate(ANCHOR);
  return {
    anchor: todayIso,
    view: "today",
    weekSelectedIso: todayIso,
    habits: [
      { id: "h1", name: "晨间阅读", nameEn: "Morning read", color: "#68725c", streak: 12, targetMin: 20 },
      { id: "h2", name: "散步", nameEn: "Walk", color: "#6e8c98", streak: 8, targetMin: 30 },
      { id: "h3", name: "深度写作", nameEn: "Deep write", color: "#b86b3d", streak: 5, targetMin: 45 },
      { id: "h4", name: "拉伸", nameEn: "Stretch", color: "#7a6b98", streak: 21, targetMin: 10 },
      { id: "h5", name: "饮水 8 杯", nameEn: "Hydration", color: "#4d7c6a", streak: 3, targetMin: 0 },
    ],
    completions: {
      [todayIso]: { h1: true, h2: true, h3: false, h4: true, h5: false },
      [weekDays[0].iso]: { h1: true, h2: false, h3: true, h4: true, h5: true },
      [weekDays[1].iso]: { h1: true, h2: true, h3: false, h4: false, h5: true },
      [weekDays[2].iso]: { h1: false, h2: true, h3: true, h4: true, h5: false },
      [weekDays[3].iso]: { h1: true, h2: true, h3: true, h4: true, h5: true },
      [weekDays[4].iso]: { h1: true, h2: false, h3: false, h4: true, h5: false },
      [weekDays[5].iso]: { h1: false, h2: true, h3: false, h4: false, h5: true },
    },
    mood: { value: 4, note: "节奏平稳，午后有一点分心。" },
    reflection: {
      draft: "今天把周报框架搭好了，晚上想补一段对专注时段的复盘。",
      saved: "今天把周报框架搭好了，晚上想补一段对专注时段的复盘。",
      status: "idle",
    },
    photos: [],
    focus: {
      running: false,
      secondsLeft: 25 * 60,
      totalToday: 52,
      sessionsToday: 2,
      status: "idle",
    },
    collapsed: {},
    moduleOrder: {
      a: ["greeting", "habits", "mood", "reflection", "photos", "focus", "week-glance"],
      b: ["habits", "focus", "reflection", "mood", "photos", "week-glance", "greeting"],
      c: ["greeting", "focus", "habits", "photos", "reflection", "mood", "week-glance"],
    },
    cWidgetLayout: {
      editMode: false,
      order: ["greeting", "focus", "habits", "photos", "reflection", "mood", "week-glance"],
      sizes: {
        greeting: "m",
        focus: "s",
        habits: "l",
        photos: "s",
        reflection: "l",
        mood: "m",
        "week-glance": "m",
        insights: "s",
      },
      offCanvas: ["insights"],
      sizePickerOpen: null,
      addPaletteOpen: false,
      focusedWidget: null,
    },
    toast: null,
    weekDays,
    firstWeekBanner: true,
  };
}

export function completionRateForDay(state, iso) {
  const map = state.completions[iso] || {};
  const done = state.habits.filter((h) => map[h.id]).length;
  return { done, total: state.habits.length };
}

export function isAllDoneToday(state) {
  const { done, total } = completionRateForDay(state, state.anchor);
  return done === total;
}

export function timeOfDayIllus() {
  const hour = 17;
  if (hour < 12) return "morning";
  if (hour >= 18) return "evening";
  return "focus";
}
