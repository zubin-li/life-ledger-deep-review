(function () {
  const T = {
    zh: {
      avg: (n) => `平均 ${n}%`,
      focus: (n) => `专注 ${n} 分钟`,
      empty: "习惯分数 · 专注时长",
    },
    en: {
      avg: (n) => `${n}% avg`,
      focus: (n) => `${n} min focus`,
      empty: "Habit scores · Focus time",
    },
    de: {
      avg: (n) => `Ø ${n} %`,
      focus: (n) => `${n} Min. Fokus`,
      empty: "Gewohnheitswerte · Fokuszeit",
    },
  };

  function langKey(lang) {
    const k = String(lang || "zh").slice(0, 2);
    return k === "de" ? "de" : k === "en" ? "en" : "zh";
  }

  function formatPreview({ avgRate, focusMinutes, lang } = {}) {
    const L = T[langKey(lang)];
    const parts = [];
    if (Number.isFinite(avgRate)) parts.push(L.avg(Math.round(avgRate)));
    if (Number.isFinite(focusMinutes) && focusMinutes > 0) parts.push(L.focus(Math.round(focusMinutes)));
    return parts.length ? parts.join(" · ") : L.empty;
  }

  function averageRate(rates) {
    if (!rates?.length) return null;
    const sum = rates.reduce((a, b) => a + b, 0);
    return Math.round(sum / rates.length);
  }

  /** Top habit completion rates for collapsed summary chips (does not duplicate insight headline metrics). */
  function pickTopHabitScores(entries, limit = 3) {
    const cap = Math.max(1, Math.min(5, limit | 0));
    return (entries || [])
      .filter(e => e && Number.isFinite(e.rate) && String(e.label || "").trim())
      .sort((a, b) => b.rate - a.rate || String(a.label).localeCompare(String(b.label)))
      .slice(0, cap);
  }

  window.LifeLedgerReviewMetricsPreview = { formatPreview, averageRate, pickTopHabitScores, langKey };
})();
