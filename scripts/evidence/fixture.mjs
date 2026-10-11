export const FIXTURE_DATE = "2026-10-02";

export function createFictionalState(date = FIXTURE_DATE) {
  return {
    version: 4,
    habits: [
      {
        id: "habit-read",
        name: "Read 20 pages",
        icon: "book",
        color: "#5d7d68",
        schedule: "daily",
        target: 1,
        active: true,
        order: 0,
        versions: [{ effectiveDate: "2026-01-01", name: "Read 20 pages", schedule: "daily", target: 1 }],
      },
      {
        id: "habit-walk",
        name: "Morning walk",
        icon: "footprints",
        color: "#6e8c98",
        schedule: "daily",
        target: 1,
        active: true,
        order: 1,
        versions: [{ effectiveDate: "2026-01-01", name: "Morning walk", schedule: "daily", target: 1 }],
      },
      {
        id: "habit-write",
        name: "Deep writing",
        icon: "pen-tool",
        color: "#a15c32",
        schedule: "daily",
        target: 1,
        active: true,
        order: 2,
        versions: [{ effectiveDate: "2026-01-01", name: "Deep writing", schedule: "daily", target: 1 }],
      },
      {
        id: "habit-code",
        name: "Code review",
        icon: "terminal",
        color: "#5d7d68",
        schedule: "daily",
        target: 1,
        active: true,
        order: 3,
        versions: [{ effectiveDate: "2026-01-01", name: "Code review", schedule: "daily", target: 1 }],
      },
    ],
    logs: {
      [date]: {
        completed: ["habit-walk"],
        mood: "很好",
        moodReason: "Quiet morning clarity and smooth deep work session.",
        note: "Focused work on Life Ledger 3.5.1 polish. Calm thoughts and crisp autumn air.",
        photos: [
          { id: "photo-1", dataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='%23e9e6de'/><circle cx='200' cy='150' r='50' fill='%235d7d68'/></svg>", date },
        ],
      },
      "2026-10-01": {
        completed: ["habit-read", "habit-walk", "habit-write"],
        mood: "平静",
        note: "Completed all scheduled habit check-ins and drafted initial review outline.",
        photos: [],
      },
      "2026-09-30": {
        completed: ["habit-read", "habit-walk"],
        mood: "很好",
        note: "Walking through the park. Steady steps forward.",
        photos: [],
      },
    },
    weeklyGoals: [
      { id: "goal-1", title: "Complete 3.5.1 final polish audit matrix", done: false, date },
      { id: "goal-2", title: "Refactor week agenda day rail meters", done: true, date },
    ],
    focusSessions: [
      {
        id: "focus-101",
        date,
        startedAt: 1790930000000,
        endedAt: 1790931500000,
        plannedMinutes: 25,
        actualMinutes: 25,
        outcome: "completed",
        label: "Architecture review",
        preset: "classic",
      },
      {
        id: "focus-102",
        date: "2026-10-01",
        startedAt: 1790840000000,
        endedAt: 1790843000000,
        plannedMinutes: 50,
        actualMinutes: 50,
        outcome: "completed",
        label: "Design system calibration",
        preset: "deep",
      },
    ],
    focusSettings: {
      preset: "classic",
      focusMinutes: 25,
      breakMinutes: 5,
      defaultTopic: "Core deep focus",
      sound: true,
      notify: false,
      wakeLock: true,
    },
    settings: {
      theme: "system",
      language: "en",
      motion: "full",
    },
  };
}

export async function applyFixture(page, options = {}) {
  const date = options.date || FIXTURE_DATE;
  const theme = options.theme || "light";
  const motion = options.motion || "full";
  const language = options.language || "en";
  const state = options.state || createFictionalState(date);

  await page.addInitScript(
    ({ stateStr, dateVal, themeVal, motionVal, langVal }) => {
      localStorage.setItem("life-ledger-state", stateStr);
      localStorage.setItem("life-ledger-theme", themeVal);
      localStorage.setItem("life-ledger-motion", motionVal);
      localStorage.setItem("life-ledger-language", langVal);
      localStorage.setItem("life-ledger-first-run", "done");
      localStorage.setItem("life-ledger-welcome-seen", "true");
      sessionStorage.setItem("life-ledger-session-date", dateVal);

      // Mock date to stay consistent on fictional date
      const fakeTime = new Date(`${dateVal}T10:30:00Z`).getTime();
      const OrigDate = Date;
      class MockDate extends OrigDate {
        constructor(...args) {
          if (args.length === 0) super(fakeTime);
          else super(...args);
        }
        static now() {
          return fakeTime;
        }
      }
      globalThis.Date = MockDate;
    },
    {
      stateStr: JSON.stringify(state),
      dateVal: date,
      themeVal: theme,
      motionVal: motion,
      langVal: language,
    }
  );
}
