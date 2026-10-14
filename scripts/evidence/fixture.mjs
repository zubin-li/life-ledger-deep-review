export const FIXTURE_DATE = "2026-10-02";

export function createFictionalState(date = FIXTURE_DATE) {
  return {
    meta: {
      updatedAt: Date.now(),
      starterPackVersion: 2,
    },
    habits: [
      {
        id: "habit-walk",
        name: "Morning walk",
        icon: "footprints",
        color: "blue",
        active: true,
        versions: [
          {
            trackingMode: "check",
            target: 1,
            unit: "",
            frequency: "daily",
            scheduleTime: "08:00",
            periodTarget: null,
            countsTowardDaily: true,
            effectiveDate: "2026-01-01",
          },
        ],
      },
      {
        id: "habit-read",
        name: "Reading",
        icon: "book",
        color: "amber",
        active: true,
        versions: [
          {
            trackingMode: "measured",
            target: 20,
            unit: "min",
            frequency: "daily",
            scheduleTime: "",
            periodTarget: null,
            countsTowardDaily: true,
            effectiveDate: "2026-01-01",
          },
        ],
      },
      {
        id: "habit-write",
        name: "Deep writing",
        icon: "pen",
        color: "sage",
        active: true,
        versions: [
          {
            trackingMode: "measured",
            target: 30,
            unit: "min",
            frequency: "daily",
            scheduleTime: "",
            periodTarget: null,
            countsTowardDaily: true,
            effectiveDate: "2026-01-01",
          },
        ],
      },
      {
        id: "habit-sleep",
        name: "Sleep before 23:30",
        icon: "bed",
        color: "violet",
        active: true,
        versions: [
          {
            trackingMode: "check",
            target: 1,
            unit: "",
            frequency: "daily",
            scheduleTime: "23:30",
            periodTarget: null,
            countsTowardDaily: true,
            effectiveDate: "2026-01-01",
          },
        ],
      },
    ],
    logs: {
      [date]: {
        completed: ["habit-walk"],
        mood: "很好",
        moodReason: "Quiet morning clarity and smooth deep work session.",
        note: "Focused work on Life Ledger 3.5.1 polish. Calm thoughts and crisp autumn air.",
        photos: [],
      },
      "2026-10-01": {
        completed: ["habit-read", "habit-walk", "habit-write"],
        mood: "平静",
        moodReason: "Steady progress.",
        note: "Completed all scheduled habit check-ins and drafted initial review outline.",
        photos: [],
      },
      "2026-09-30": {
        completed: ["habit-read", "habit-walk"],
        mood: "很好",
        moodReason: "Great walk in the park.",
        note: "Walking through the park. Steady steps forward.",
        photos: [],
      },
    },
    weeklyGoals: {
      "2026-W40": [
        { id: "goal-1", text: "Complete 3.5.1 final polish audit matrix", done: false },
        { id: "goal-2", text: "Refactor week agenda day rail meters", done: true },
      ],
    },
    longTermGoals: [
      {
        id: "lt-1",
        name: "Calibrate life rhythm system",
        nextAction: "Audit 3.5.1 controls across desktop surface",
        reviewDate: "2026-10-15",
        status: "active",
      },
    ],
    weeklyOutputs: {
      "2026-W40": "Calibrated week views and unified focus timer across all surfaces.",
    },
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
  };
}

export function createEmptyFictionalState(date = FIXTURE_DATE) {
  return {
    meta: {
      updatedAt: Date.now(),
      starterPackVersion: 2,
    },
    habits: [],
    logs: {},
    weeklyGoals: {},
    longTermGoals: [],
    weeklyOutputs: {},
    focusSessions: [],
    focusSettings: {
      preset: "classic",
      focusMinutes: 25,
      breakMinutes: 5,
      defaultTopic: "Core deep focus",
      sound: true,
      notify: false,
      wakeLock: true,
    },
  };
}

export async function applyFixture(page, options = {}) {
  const date = options.date || FIXTURE_DATE;
  const theme = options.theme || "light";
  const motion = options.motion || "full";
  const language = options.language || "en";
  const languageRequested = typeof options.language === "string";
  const state = options.state || (options.empty ? createEmptyFictionalState(date) : createFictionalState(date));

  await page.addInitScript(
    ({ stateStr, dateVal, themeVal, motionVal, langVal, languageRequestedVal }) => {
      localStorage.setItem("life-ledger-v1", stateStr);
      localStorage.setItem("life-ledger-theme", themeVal);
      localStorage.setItem("life-ledger-motion", motionVal);
      localStorage.setItem("life-ledger-language", langVal);
      if (languageRequestedVal) {
        localStorage.setItem("life-ledger-language-preference-set", "true");
      }
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
      languageRequestedVal: languageRequested,
    }
  );
}
