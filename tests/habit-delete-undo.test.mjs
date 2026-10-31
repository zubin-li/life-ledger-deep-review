import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");

function extractFunctionSource(source, signature) {
  const start = source.indexOf(signature);
  assert.ok(start >= 0, `missing ${signature} in app.js`);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unterminated function: ${signature}`);
}

function makeClassList(initial = []) {
  const set = new Set(initial);
  return {
    add(...tokens) { tokens.forEach(t => set.add(t)); },
    remove(...tokens) { tokens.forEach(t => set.delete(t)); },
    toggle(token, force) {
      const next = force === undefined ? !set.has(token) : Boolean(force);
      if (next) set.add(token);
      else set.delete(token);
      return next;
    },
    contains(token) { return set.has(token); },
  };
}

function makeHarness(overrides = {}) {
  const timers = new Map();
  let nextTimerId = 1;
  let focusedElement = null;

  const setTimeoutStub = (fn, delay) => {
    const id = nextTimerId++;
    timers.set(id, { id, fn, delay });
    return id;
  };
  const clearTimeoutStub = id => {
    timers.delete(id);
  };

  const makeElement = (tag, props = {}) => {
    const el = {
      tagName: tag.toUpperCase(),
      id: props.id || "",
      className: props.className || "",
      textContent: props.textContent || "",
      hidden: Boolean(props.hidden),
      disabled: Boolean(props.disabled),
      dataset: { ...(props.dataset || {}) },
      isConnected: props.isConnected ?? true,
      classList: makeClassList(props.classes || []),
      children: [],
      onclick: null,
      onkeydown: null,
      appendChild(child) {
        this.children.push(child);
        return child;
      },
      querySelector(selector) {
        if (selector === "p") return this.children.find(c => c.tagName === "P") || null;
        if (selector === ".toast-action") return this.children.find(c => c.className === "toast-action" || c.classList?.contains("toast-action")) || null;
        return null;
      },
      focus() {
        focusedElement = this;
      },
      click() {
        if (this.disabled || this.hidden) return;
        this.onclick?.({ preventDefault() {} });
      },
      keydown(key) {
        if (this.disabled || this.hidden) return;
        let defaultPrevented = false;
        this.onkeydown?.({
          key,
          preventDefault() { defaultPrevented = true; },
          get defaultPrevented() { return defaultPrevented; },
        });
        return defaultPrevented;
      },
      closest() {
        return null;
      },
    };
    return el;
  };

  const toastText = makeElement("p", { textContent: "Saved" });
  const toastAction = makeElement("button", {
    id: "toastAction",
    className: "toast-action",
    hidden: true,
    disabled: true,
    classes: ["toast-action"],
  });
  const toast = makeElement("div", { id: "toast", classes: ["toast"] });
  toast.appendChild(toastText);
  toast.appendChild(toastAction);

  const inspectorNameInput = makeElement("input", { id: "habitInspectorName" });
  let inspectorResetCount = 0;
  const inspectorForm = {
    ...makeElement("form", { id: "habitInspectorForm" }),
    dataset: { dirty: "1" },
    reset() {
      inspectorResetCount++;
    },
  };
  const openHabitDialogButton = makeElement("button", { id: "openHabitDialog" });
  const activeNavButton = makeElement("button", { className: "nav-item active" });
  const todayHabitCardButton = makeElement("button", { className: "habit-card-btn" });

  const initialHabits = overrides.habits ?? [
    {
      id: "h1",
      name: "Morning Walk",
      icon: "sun",
      color: "sage",
      active: true,
      versions: [{ effectiveDate: "2026-09-01", frequency: "daily", trackingMode: "check", target: 1, unit: "", countsTowardDaily: true }],
    },
    {
      id: "h2",
      name: "Deep Reading",
      icon: "book",
      color: "amber",
      active: true,
      versions: [
        { effectiveDate: "2026-09-01", frequency: "daily", trackingMode: "measured", target: 30, unit: "min", note: "Fiction", countsTowardDaily: true },
        { effectiveDate: "2026-10-01", frequency: "daily", trackingMode: "measured", target: 45, unit: "min", note: "Essays", countsTowardDaily: true },
      ],
    },
    {
      id: "h3",
      name: "Strength",
      icon: "dumbbell",
      color: "coral",
      active: false,
      versions: [{ effectiveDate: "2026-09-01", frequency: "weekly", trackingMode: "check", target: 1, periodTarget: 3, weeklyTarget: 3, countsTowardDaily: false }],
    },
  ];

  const initialLogs = overrides.logs ?? {
    "2026-10-01": { completed: ["h2", "h1", "h3"], mood: "很好", moodReason: "Good start", note: "Day 1 note" },
    "2026-10-02": { completed: ["h1", "h2", "h3"], mood: "平静", moodReason: "", note: "Day 2 note" },
    "2026-10-03": { completed: ["h3", "h1", "h2"], mood: "低落", moodReason: "Tired", note: "Day 3 note" },
    "2026-10-04": { completed: ["h2"], mood: null, moodReason: "", note: "" },
    "2026-10-05": { completed: ["h1", "h3"], mood: "很好", moodReason: "", note: "Untouched day" },
  };

  let rowButtons = [];
  const rebuildRowButtons = (habits) => {
    rowButtons = habits.map(h => makeElement("button", {
      className: "setting-main habit-settings-main",
      dataset: { id: h.id },
    }));
  };

  const events = {
    confirms: [],
    saves: 0,
    renders: 0,
    dialogCloses: 0,
    populatedIds: [],
    streakIds: [],
    get inspectorResets() { return inspectorResetCount; },
  };

  let confirmResult = overrides.confirmResult ?? true;
  const documentBody = makeElement("body", {
    dataset: { activeView: overrides.activeView ?? "habits" },
  });

  const context = {
    state: {
      habits: structuredClone(initialHabits),
      logs: structuredClone(initialLogs),
    },
    editingHabitId: overrides.editingHabitId ?? "h2",
    selectedHabitSettingsId: overrides.selectedHabitSettingsId ?? "h2",
    setTimeout: setTimeoutStub,
    clearTimeout: clearTimeoutStub,
    cloneData: value => structuredClone(value),
    displayHabitName: habit => habit?.name || "",
    tr: (key, vars = {}) => `${key}:${vars.habit || ""}`,
    languageText: (_zh, en) => en,
    appConfirm: async message => {
      events.confirms.push(message);
      return typeof confirmResult === "function" ? await confirmResult(message) : confirmResult;
    },
    saveState: () => {
      events.saves++;
    },
    closeHabitDialog: () => {
      events.dialogCloses++;
      context.editingHabitId = null;
    },
    populateHabitInspectorForm: id => {
      events.populatedIds.push(id);
    },
    renderHabitStreakCalendar: id => {
      events.streakIds.push(id);
    },
    renderAll: () => {
      events.renders++;
      inspectorForm.hidden = !context.state.habits.length;
      rebuildRowButtons(context.state.habits);
    },
    document: {
      body: documentBody,
      get activeElement() { return focusedElement; },
      createElement: tag => makeElement(tag),
    },
    $: (selector, root) => {
      if (root === toast) return toast.querySelector(selector);
      if (selector === "#toast") return toast;
      if (selector === "#habitInspectorForm") return inspectorForm;
      if (selector === "#habitInspectorForm input[name=\"name\"]") return inspectorNameInput;
      if (selector === "#openHabitDialog") return openHabitDialogButton;
      if (selector === ".nav-item.active") return activeNavButton;
      if (selector === ".habit-card button, .habit-card") {
        return context.state.habits.length ? todayHabitCardButton : null;
      }
      return null;
    },
    $$: selector => {
      if (selector === ".habit-settings-main") return rowButtons;
      return [];
    },
  };

  rebuildRowButtons(context.state.habits);

  const blockStart = app.indexOf("/* life-ledger-habit-delete-undo-start */");
  const blockEnd = app.indexOf("/* life-ledger-habit-delete-undo-end */");
  assert.ok(blockStart >= 0 && blockEnd > blockStart, "habit delete/undo block must exist in app.js");
  const blockSource = app.slice(blockStart + "/* life-ledger-habit-delete-undo-start */".length, blockEnd);
  const deleteHabitSource = extractFunctionSource(app, "async function deleteHabit()");
  const deleteInspectorSource = extractFunctionSource(app, "async function deleteHabitFromInspector()");

  vm.createContext(context);
  vm.runInContext(`${blockSource}\n${deleteHabitSource}\n${deleteInspectorSource}`, context);

  return {
    context,
    events,
    toast,
    toastText,
    toastAction,
    inspectorForm,
    inspectorNameInput,
    openHabitDialogButton,
    todayHabitCardButton,
    timers,
    getFocusedElement: () => focusedElement,
    setFocusedElement: el => { focusedElement = el; },
    setConfirmResult: next => { confirmResult = next; },
    runAllTimers: () => {
      for (const entry of [...timers.values()]) {
        timers.delete(entry.id);
        entry.fn();
      }
    },
  };
}

test("both deleteHabit and deleteHabitFromInspector delegate to confirmAndDeleteHabit and toast markup/styles exist", () => {
  const deleteHabitFn = extractFunctionSource(app, "async function deleteHabit()");
  const deleteInspectorFn = extractFunctionSource(app, "async function deleteHabitFromInspector()");
  assert.match(deleteHabitFn, /return confirmAndDeleteHabit\(editingHabitId,\s*\{\s*source:\s*"dialog",\s*closeDialog:\s*true\s*\}\)/);
  assert.match(deleteInspectorFn, /return confirmAndDeleteHabit\(selectedHabitSettingsId,\s*\{\s*source:\s*"inspector",\s*closeDialog:\s*false\s*\}\)/);
  assert.match(html, /id="toast"[^>]*>[\s\S]*class="toast-action"/);
  assert.match(css, /\.toast\.show\.has-action,\s*\.toast\.show \.toast-action\s*\{\s*pointer-events:\s*auto;\s*\}/);
  assert.match(css, /html\[data-theme="dark"\] \.toast \.toast-action/);
});

test("cancelling confirmation in either delete entry point performs no mutation or toast", async () => {
  const h = makeHarness({ confirmResult: false, editingHabitId: "h2", selectedHabitSettingsId: "h2" });

  const dialogResult = await h.context.deleteHabit();
  assert.equal(dialogResult, false);
  assert.equal(h.events.confirms.length, 1);
  assert.equal(h.context.state.habits.length, 3);
  assert.deepEqual(Array.from(h.context.state.logs["2026-10-02"].completed), ["h1", "h2", "h3"]);
  assert.equal(h.events.saves, 0);
  assert.equal(h.events.dialogCloses, 0);
  assert.equal(h.toast.classList.contains("show"), false);

  const inspectorResult = await h.context.deleteHabitFromInspector();
  assert.equal(inspectorResult, false);
  assert.equal(h.events.confirms.length, 2);
  assert.equal(h.context.state.habits.length, 3);
  assert.equal(h.events.saves, 0);
  assert.equal(h.toast.classList.contains("show"), false);
});

test("deleteHabit (dialog entry point) removes habit and completions, closes dialog, and Undo restores habit at original index and exact multi-day log ordering", async () => {
  const h = makeHarness({
    activeView: "today",
    editingHabitId: "h2",
    selectedHabitSettingsId: "h2",
  });

  const deleted = await h.context.deleteHabit();
  assert.equal(deleted, true);
  assert.equal(h.events.confirms.length, 1);
  assert.equal(h.events.dialogCloses, 1);
  assert.equal(h.context.editingHabitId, null);
  assert.deepEqual(h.context.state.habits.map(item => item.id), ["h1", "h3"]);
  assert.deepEqual(Array.from(h.context.state.logs["2026-10-01"].completed), ["h1", "h3"]);
  assert.deepEqual(Array.from(h.context.state.logs["2026-10-02"].completed), ["h1", "h3"]);
  assert.deepEqual(Array.from(h.context.state.logs["2026-10-03"].completed), ["h3", "h1"]);
  assert.deepEqual(Array.from(h.context.state.logs["2026-10-04"].completed), []);
  assert.deepEqual(Array.from(h.context.state.logs["2026-10-05"].completed), ["h1", "h3"]);
  assert.equal(h.context.selectedHabitSettingsId, "h3");
  assert.equal(h.getFocusedElement(), h.todayHabitCardButton);
  assert.equal(h.toast.classList.contains("show"), true);
  assert.equal(h.toast.classList.contains("has-action"), true);
  assert.equal(h.toastAction.hidden, false);
  assert.equal(h.toastAction.disabled, false);
  assert.equal(h.toastAction.textContent, "Undo");

  h.toastAction.click();

  assert.deepEqual(h.context.state.habits.map(item => item.id), ["h1", "h2", "h3"]);
  assert.equal(h.context.state.habits[1].name, "Deep Reading");
  assert.equal(h.context.state.habits[1].versions.length, 2);
  assert.equal(h.context.state.habits[1].versions[1].note, "Essays");
  assert.deepEqual(Array.from(h.context.state.logs["2026-10-01"].completed), ["h2", "h1", "h3"]);
  assert.deepEqual(Array.from(h.context.state.logs["2026-10-02"].completed), ["h1", "h2", "h3"]);
  assert.deepEqual(Array.from(h.context.state.logs["2026-10-03"].completed), ["h3", "h1", "h2"]);
  assert.deepEqual(Array.from(h.context.state.logs["2026-10-04"].completed), ["h2"]);
  assert.deepEqual(Array.from(h.context.state.logs["2026-10-05"].completed), ["h1", "h3"]);
  assert.equal(h.context.state.logs["2026-10-01"].note, "Day 1 note");
  assert.equal(h.context.state.logs["2026-10-03"].moodReason, "Tired");
  assert.equal(h.context.selectedHabitSettingsId, "h2");
  assert.equal(h.toast.classList.contains("show"), false);
  assert.equal(h.toastAction.hidden, true);
});

test("deleteHabitFromInspector (inspector entry point) updates selection/focus and Undo restores first/last index, logs, and selection", async () => {
  const h = makeHarness({
    activeView: "habits",
    selectedHabitSettingsId: "h1",
  });

  await h.context.deleteHabitFromInspector();
  assert.equal(h.events.dialogCloses, 0);
  assert.deepEqual(h.context.state.habits.map(item => item.id), ["h2", "h3"]);
  assert.equal(h.context.selectedHabitSettingsId, "h2");
  assert.equal(h.inspectorForm.dataset.dirty, undefined);
  assert.equal(h.events.populatedIds.at(-1), "h2");
  assert.equal(h.getFocusedElement()?.dataset?.id, "h2");
  assert.deepEqual(Array.from(h.context.state.logs["2026-10-01"].completed), ["h2", "h3"]);
  assert.deepEqual(Array.from(h.context.state.logs["2026-10-02"].completed), ["h2", "h3"]);
  assert.deepEqual(Array.from(h.context.state.logs["2026-10-03"].completed), ["h3", "h2"]);
  assert.deepEqual(Array.from(h.context.state.logs["2026-10-05"].completed), ["h3"]);

  // Activate undo via keyboard Enter on the toast action button
  const prevented = h.toastAction.keydown("Enter");
  assert.equal(prevented, true);
  assert.deepEqual(h.context.state.habits.map(item => item.id), ["h1", "h2", "h3"]);
  assert.equal(h.context.selectedHabitSettingsId, "h1");
  assert.equal(h.events.populatedIds.at(-1), "h1");
  assert.equal(h.getFocusedElement()?.dataset?.id, "h1");
  assert.deepEqual(Array.from(h.context.state.logs["2026-10-01"].completed), ["h2", "h1", "h3"]);
  assert.deepEqual(Array.from(h.context.state.logs["2026-10-02"].completed), ["h1", "h2", "h3"]);
  assert.deepEqual(Array.from(h.context.state.logs["2026-10-03"].completed), ["h3", "h1", "h2"]);
  assert.deepEqual(Array.from(h.context.state.logs["2026-10-05"].completed), ["h1", "h3"]);

  // Now delete the last habit (index 2: h3) and verify selection falls back to adjacent h2, then Undo restores index 2
  h.context.selectedHabitSettingsId = "h3";
  await h.context.deleteHabitFromInspector();
  assert.deepEqual(h.context.state.habits.map(item => item.id), ["h1", "h2"]);
  assert.equal(h.context.selectedHabitSettingsId, "h2");
  assert.equal(h.getFocusedElement()?.dataset?.id, "h2");

  h.toastAction.keydown(" ");
  assert.deepEqual(h.context.state.habits.map(item => item.id), ["h1", "h2", "h3"]);
  assert.equal(h.context.selectedHabitSettingsId, "h3");
  assert.equal(h.getFocusedElement()?.dataset?.id, "h3");
  assert.deepEqual(Array.from(h.context.state.logs["2026-10-03"].completed), ["h3", "h1", "h2"]);
});

test("deleting the only remaining habit clears selection, resets inspector, and focuses add button; Undo restores it", async () => {
  const h = makeHarness({
    habits: [{ id: "solo", name: "Solo Habit", icon: "sun", color: "sage", active: true, versions: [{ effectiveDate: "2026-10-01", frequency: "daily", trackingMode: "check", target: 1 }] }],
    logs: { "2026-10-10": { completed: ["solo"], mood: null, note: "" } },
    selectedHabitSettingsId: "solo",
    activeView: "habits",
  });

  await h.context.deleteHabitFromInspector();
  assert.equal(h.context.state.habits.length, 0);
  assert.equal(h.context.selectedHabitSettingsId, "");
  assert.equal(h.inspectorForm.hidden, true);
  assert.equal(h.events.inspectorResets, 1);
  assert.equal(h.events.streakIds.at(-1), "");
  assert.equal(h.getFocusedElement(), h.openHabitDialogButton);

  h.toastAction.click();
  assert.equal(h.context.state.habits.length, 1);
  assert.equal(h.context.state.habits[0].id, "solo");
  assert.equal(h.context.selectedHabitSettingsId, "solo");
  assert.deepEqual(Array.from(h.context.state.logs["2026-10-10"].completed), ["solo"]);
  assert.equal(h.getFocusedElement()?.dataset?.id, "solo");
});

test("toast action runs at most once, hides toast, and cleans up on timeout or when a new toast appears", () => {
  const h = makeHarness();
  let actionCount = 0;

  h.context.showToast("Habit deleted", {
    actionLabel: "Undo",
    onAction: () => { actionCount++; },
  });

  assert.equal(h.toast.classList.contains("show"), true);
  assert.equal(h.toast.classList.contains("has-action"), true);
  assert.equal(h.toastAction.hidden, false);
  assert.equal(h.timers.size, 1);

  const savedOnClick = h.toastAction.onclick;
  const savedActiveAction = h.context.showToast.activeAction;

  // First activation runs onAction and hides toast
  h.toastAction.click();
  assert.equal(actionCount, 1);
  assert.equal(h.toast.classList.contains("show"), false);
  assert.equal(h.toast.classList.contains("has-action"), false);
  assert.equal(h.toastAction.hidden, true);
  assert.equal(h.toastAction.disabled, true);
  assert.equal(h.timers.size, 0);

  // Second activation (even through retained references) must not run onAction again
  h.toastAction.click();
  savedOnClick?.({ preventDefault() {} });
  savedActiveAction?.();
  assert.equal(actionCount, 1);

  // Timeout cleanup: action toast expires after timer and cannot be triggered afterward
  let timeoutActionCount = 0;
  h.context.showToast("Second delete", {
    actionLabel: "Undo",
    onAction: () => { timeoutActionCount++; },
  });
  const expiredActionRef = h.context.showToast.activeAction;
  assert.equal(h.toast.classList.contains("show"), true);
  h.runAllTimers();
  assert.equal(h.toast.classList.contains("show"), false);
  assert.equal(h.toast.classList.contains("has-action"), false);
  assert.equal(h.toastAction.hidden, true);
  expiredActionRef?.();
  assert.equal(timeoutActionCount, 0);

  // New-toast cleanup: showing an ordinary toast replaces a pending action toast and clears its timer/action
  let replacedActionCount = 0;
  h.context.showToast("Third delete", {
    actionLabel: "Undo",
    onAction: () => { replacedActionCount++; },
  });
  const firstTimerId = [...h.timers.keys()][0];
  const supersededActionRef = h.context.showToast.activeAction;

  h.context.showToast("Saved");
  assert.equal(h.timers.has(firstTimerId), false, "previous toast timer must be cleared");
  assert.equal(h.timers.size, 1);
  assert.equal([...h.timers.values()][0].delay, 1600, "ordinary toast keeps 1600ms timeout");
  assert.equal(h.toastText.textContent, "Saved");
  assert.equal(h.toast.classList.contains("show"), true);
  assert.equal(h.toast.classList.contains("has-action"), false);
  assert.equal(h.toastAction.hidden, true);
  assert.equal(h.toastAction.disabled, true);
  assert.equal(h.toastAction.textContent, "");
  supersededActionRef?.();
  assert.equal(replacedActionCount, 0);

  h.runAllTimers();
  assert.equal(h.toast.classList.contains("show"), false);
});
