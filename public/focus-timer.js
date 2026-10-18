(function attachLifeLedgerFocusTimer(root) {
  "use strict";

  const clampMs = value => Math.max(0, Number(value) || 0);

  function createTimer(options = {}) {
    const storage = options.storage || root.localStorage;
    const storageKey = options.storageKey || "life-ledger-focus-active";
    const now = options.now || (() => Date.now());
    const schedule = options.setInterval || root.setInterval.bind(root);
    const unschedule = options.clearInterval || root.clearInterval.bind(root);
    const onChange = options.onChange || (() => {});
    const onFocusComplete = options.onFocusComplete || (() => {});
    const onPhaseComplete = options.onPhaseComplete || (() => {});
    let active = load();
    let timerId = null;
    let lastSecond = null;

    function load() {
      try {
        const value = JSON.parse(storage.getItem(storageKey) || "null");
        if (!value || !["focus", "break"].includes(value.phase)) return null;
        if (!["running", "paused", "ready"].includes(value.status)) return null;
        return value;
      } catch {
        return null;
      }
    }

    function persist() {
      if (active) storage.setItem(storageKey, JSON.stringify(active));
      else storage.removeItem(storageKey);
    }

    function remainingMs() {
      if (!active) return 0;
      if (active.status === "running") return clampMs(active.endsAt - now());
      return clampMs(active.remainingMs);
    }

    function snapshot() {
      if (!active) return null;
      return { ...active, remainingMs: remainingMs() };
    }

    function emit(force = false) {
      const seconds = Math.ceil(remainingMs() / 1000);
      if (!force && seconds === lastSecond) return;
      lastSecond = seconds;
      onChange(snapshot());
    }

    function stopTicker() {
      if (timerId !== null) unschedule(timerId);
      timerId = null;
    }

    function startTicker() {
      stopTicker();
      if (active?.status !== "running") return;
      timerId = schedule(reconcile, 250);
    }

    function sessionFromActive(outcome) {
      const endedAt = now();
      const actualMs = Math.max(0, clampMs(active.durationMs) - remainingMs());
      return {
        id: active.id,
        date: active.date,
        startedAt: active.startedAt,
        endedAt,
        plannedMinutes: Math.round(clampMs(active.durationMs) / 60000),
        actualMinutes: Math.max(0.1, Math.round(actualMs / 6000) / 10),
        outcome,
        linkedGoalId: active.linkedGoalId || "",
        label: active.label || "",
        preset: active.preset || "classic",
      };
    }

    function finishPhase() {
      if (!active) return;
      stopTicker();
      if (active.phase === "focus") {
        const session = sessionFromActive("completed");
        const breakMinutes = Math.max(1, Number(active.breakMinutes) || 5);
        active = {
          id: `break-${active.id}`,
          phase: "break",
          status: "ready",
          durationMs: breakMinutes * 60000,
          remainingMs: breakMinutes * 60000,
          endsAt: null,
          startedAt: null,
          date: session.date,
          label: session.label,
          linkedGoalId: session.linkedGoalId,
          preset: session.preset,
          breakMinutes,
        };
        persist();
        onFocusComplete(session);
        onPhaseComplete("focus", snapshot());
      } else {
        active = null;
        persist();
        onPhaseComplete("break", null);
      }
      emit(true);
    }

    function reconcile() {
      if (active?.status === "running" && remainingMs() <= 0) {
        finishPhase();
        return;
      }
      emit();
    }

    function start(config = {}) {
      const durationMinutes = Math.max(1, Number(config.durationMinutes) || 25);
      const startedAt = now();
      active = {
        id: config.id || `focus-${startedAt.toString(36)}`,
        phase: "focus",
        status: "running",
        durationMs: durationMinutes * 60000,
        remainingMs: durationMinutes * 60000,
        endsAt: startedAt + durationMinutes * 60000,
        startedAt,
        date: config.date,
        label: config.label || "",
        linkedGoalId: config.linkedGoalId || "",
        preset: config.preset || "classic",
        breakMinutes: Math.max(1, Number(config.breakMinutes) || 5),
      };
      persist();
      startTicker();
      emit(true);
      return snapshot();
    }

    function startBreak() {
      if (active?.phase !== "break" || active.status !== "ready") return snapshot();
      const startedAt = now();
      active.startedAt = startedAt;
      active.endsAt = startedAt + active.remainingMs;
      active.status = "running";
      persist();
      startTicker();
      emit(true);
      return snapshot();
    }

    function pause() {
      if (active?.status !== "running") return snapshot();
      active.remainingMs = remainingMs();
      active.endsAt = null;
      active.status = "paused";
      persist();
      stopTicker();
      emit(true);
      return snapshot();
    }

    function resume() {
      if (active?.status !== "paused") return snapshot();
      active.endsAt = now() + active.remainingMs;
      active.status = "running";
      persist();
      startTicker();
      emit(true);
      return snapshot();
    }

    function endFocus(outcome = "finishedEarly") {
      if (!active || active.phase !== "focus") return null;
      const session = sessionFromActive(outcome);
      active = null;
      persist();
      stopTicker();
      emit(true);
      onFocusComplete(session);
      return session;
    }

    function skipBreak() {
      if (active?.phase !== "break") return;
      active = null;
      persist();
      stopTicker();
      emit(true);
    }

    function clear() {
      active = null;
      persist();
      stopTicker();
      emit(true);
    }

    function initialize() {
      reconcile();
      startTicker();
      emit(true);
      return snapshot();
    }

    return { initialize, snapshot, reconcile, start, startBreak, pause, resume, endFocus, skipBreak, clear };
  }

  root.LifeLedgerFocusTimer = { createTimer };
})(globalThis);
