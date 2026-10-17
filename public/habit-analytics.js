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
  // Daily-scored opportunities only. Missing records stay visible as gaps, not
  // invented evidence of failure or a causal claim about someone's behaviour.
  function dailySummary(dates, habits, logs, eligibleOn) {
    const rows = habits.filter(h => h.active).map(habit => {
      const eligibleDates = dates.filter(date => eligibleOn(habit, date));
      const completed = eligibleDates.filter(date => new Set(logs[date]?.completed || []).has(habit.id)).length;
      return { id: habit.id, ...rate(completed, eligibleDates.length) };
    }).filter(row => row.eligible > 0);
    const points = dates.map(date => {
      const eligible = habits.filter(h => h.active && eligibleOn(h, date));
      const done = new Set(logs[date]?.completed || []);
      const completed = eligible.filter(h => done.has(h.id)).length;
      const log = logs[date];
      const recorded = Boolean(log && (log.note?.trim() || log.mood || log.moodReason?.trim() || log.completed?.length));
      return { date, ...rate(completed, eligible.length), recorded };
    });
    const totals = rate(rows.reduce((n,r)=>n+r.completed,0),rows.reduce((n,r)=>n+r.eligible,0));
    const weekdays = Array.from({length:7},(_,index)=>{
      const items = points.filter(p => (parseIso(p.date).getDay()+6)%7 === index);
      return rate(items.reduce((n,p)=>n+p.completed,0),items.reduce((n,p)=>n+p.eligible,0));
    });
    return { ...totals, rows, points, weekdays, recordedDays: points.filter(p=>p.recorded).length, eligibleDays: points.filter(p=>p.eligible).length };
  }
  root.LifeLedgerAnalytics = {
    windowDates,
    previousWindow,
    rate,
    streaks,
    weekdayAverages,
    chartMode,
    pluralEn,
    dailySummary,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
