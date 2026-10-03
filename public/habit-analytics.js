(function attachHabitAnalytics(root) {
  function parseIso(iso) {
    const [year, month, day] = String(iso).split("-").map(Number);
    return new Date(year, (month || 1) - 1, day || 1, 12);
  }
  function toIso(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  function windowDates(endIso, length) {
    const end = parseIso(endIso);
    const count = Math.max(0, Number(length) || 0);
    return Array.from({ length: count }, (_, index) => {
      const date = new Date(end);
      date.setDate(end.getDate() - (count - 1 - index));
      return toIso(date);
    });
  }
  function previousWindow(dates) {
    if (!dates.length) return [];
    const start = parseIso(dates[0]);
    start.setDate(start.getDate() - 1);
    return windowDates(toIso(start), dates.length);
  }
  function rate(completed, eligible) {
    const done = Math.max(0, Number(completed) || 0);
    const slots = Math.max(0, Number(eligible) || 0);
    return {
      completed: done,
      eligible: slots,
      percent: slots > 0 ? Math.round((done / slots) * 100) : null,
    };
  }
  function streaks(doneFlags, options = {}) {
    const flags = Array.isArray(doneFlags) ? doneFlags : [];
    const ignoreTrailingMiss = Boolean(options.ignoreTrailingMiss);
    let best = 0;
    let run = 0;
    flags.forEach(done => {
      run = done ? run + 1 : 0;
      best = Math.max(best, run);
    });
    let current = 0;
    for (let index = flags.length - 1; index >= 0; index -= 1) {
      if (!flags[index]) {
        if (ignoreTrailingMiss && index === flags.length - 1) continue;
        break;
      }
      current += 1;
    }
    return { current, best };
  }
  function weekdayAverages(points) {
    const buckets = Array.from({ length: 7 }, () => []);
    (points || []).forEach(point => {
      const day = parseIso(point.date).getDay();
      buckets[(day + 6) % 7].push(Number(point.value) || 0);
    });
    return buckets.map(values => (
      values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null
    ));
  }
  function chartMode(pointCount) {
    return pointCount >= 4 ? "line" : "compact";
  }
  function pluralEn(count, one, many) {
    const value = Number(count) || 0;
    return `${value} ${value === 1 ? one : many}`;
  }
  root.LifeLedgerAnalytics = {
    windowDates,
    previousWindow,
    rate,
    streaks,
    weekdayAverages,
    chartMode,
    pluralEn,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
