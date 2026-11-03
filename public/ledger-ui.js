(function (root) {
  const core = () => root.LifeLedgerLedger;
  let ctx = null;
  let viewMonth = "";
  let ledgerMonthPulse = false;
  let listFilter = "";
  let listDayFilter = "";
  let pendingListFocus = false;
  let listCategoryFilter = "";
  let trendPlot = null;
  let categoryChartMode = "donut";
  let lastSummaryDisplay = { income: "", expense: "", net: "" };
  let lastHighlightTxId = "";
  let popoverEscapeHandler = null;
  let ledgerShortcutBound = false;

  function isLedgerTypingTarget(target) {
    if (!target || !(target instanceof Element)) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    if (tag === "TEXTAREA" || tag === "SELECT") return true;
    if (tag === "INPUT") {
      const type = (target.getAttribute("type") || "text").toLowerCase();
      return type !== "button" && type !== "submit" && type !== "reset" && type !== "checkbox" && type !== "radio";
    }
    return false;
  }

  function bindLedgerShortcuts() {
    if (ledgerShortcutBound) return;
    ledgerShortcutBound = true;
    document.addEventListener("keydown", event => {
      if (document.body.dataset.activeView !== "ledger") return;
      if (document.querySelector(".ledger-edit-popover, .ledger-recurring-popover, .ledger-import-popover")) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const typing = isLedgerTypingTarget(event.target);
      if (event.key === "/" && !typing) {
        const filter = $("#ledgerFilter");
        if (filter) {
          event.preventDefault();
          filter.focus();
          filter.select?.();
        }
        return;
      }
      if ((event.key === "n" || event.key === "N") && !typing) {
        const quick = $("#ledgerQuickInput");
        if (quick) {
          event.preventDefault();
          quick.focus();
          quick.select?.();
        }
        return;
      }
      if (event.key === "Escape") {
        if (typing && event.target?.id !== "ledgerFilter") return;
        if (!listFiltersActive()) return;
        const host = $("#ledgerView .ledger-page");
        if (!host) return;
        event.preventDefault();
        clearAllListFilters(host, viewMonth || ymFromDate(ctx?.iso(new Date()) || ""));
        return;
      }
      if (typing) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const ym = viewMonth || ymFromDate(ctx?.iso(new Date()) || "");
      if (!ym) return;
      event.preventDefault();
      viewMonth = shiftMonth(ym, event.key === "ArrowLeft" ? -1 : 1);
      ledgerMonthPulse = true;
      render();
    });
  }

  function detachPopoverEscape() {
    if (!popoverEscapeHandler) return;
    window.removeEventListener("keydown", popoverEscapeHandler);
    popoverEscapeHandler = null;
  }

  function attachPopoverEscape(onClose) {
    detachPopoverEscape();
    popoverEscapeHandler = event => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", popoverEscapeHandler);
  }

  const $ = (s, r = document) => r.querySelector(s);
  const t = (zh, en, de) => ctx.text(zh, en, de);

  function ledgerState() {
    const st = ctx.state();
    if (!st.ledger) st.ledger = core().emptyLedger();
    st.ledger = core().normalize(st.ledger, { lang: ctx.lang?.() || "en" });
    return st.ledger;
  }

  function commit(ledger) {
    ctx.state().ledger = ledger;
    ctx.save();
    ctx.changed?.();
  }

  function ymFromDate(iso) {
    return iso.slice(0, 7);
  }

  function shiftMonth(ym, delta) {
    return core().shiftYm(ym, delta);
  }

  function monthLabel(ym) {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y, m - 1, 1, 12);
    return ctx.monthName(d);
  }

  function destroyTrendPlot() {
    trendPlot?.destroy?.();
    trendPlot = null;
  }

  function renderTrend(host, ledger, ym) {
    destroyTrendPlot();
    if (!host) return;
    host.classList.remove("ledger-trend--ready");
    host.innerHTML = `<div class="ledger-skeleton ledger-skeleton--chart" aria-hidden="true"></div>`;
    const uPlot = root.LifeLedgerWidgetUI?.uPlot;
    const series = core().monthlyTrendSeries(ledger, ym, 6);
    const hasData = series.some(row => row.expenseMinor > 0 || row.incomeMinor > 0);
    const paint = () => {
      if (!hasData || !uPlot) {
        host.innerHTML = `<p class="ledger-empty ll-empty-enter">${t("暂无趋势数据", "Add entries to see the trend.", "Noch keine Trenddaten.")}</p>`;
        host.classList.add("ledger-trend--ready");
        return;
      }
      host.innerHTML = "";
      const width = Math.max(200, Math.floor(host.clientWidth || 280));
      const height = 120;
      const dark = document.documentElement.dataset.theme === "dark";
      const ink = dark ? "#9eafbe" : "#738495";
      const grid = dark ? "rgba(200,220,235,.09)" : "rgba(60,90,120,.09)";
      const accent = dark ? "#7fd4b0" : "#2d7a62";
      const labels = series.map(row => row.ym.slice(5));
      trendPlot = new uPlot({
        width,
        height,
        pxAlign: 1,
        padding: [8, 8, 0, 0],
        legend: { show: false },
        select: { show: false },
        cursor: { show: false },
        scales: { x: { time: false }, y: { auto: true } },
        series: [{}, { label: "€", stroke: accent, width: 2, points: { show: false } }],
        axes: [
          { stroke: ink, font: "10px -apple-system, system-ui", size: 18, grid: { stroke: grid, width: 1 }, ticks: { show: false } },
          { stroke: ink, font: "10px -apple-system, system-ui", size: 28, space: 22, grid: { show: false }, ticks: { show: false }, values: (_u, vals) => vals.map(v => `${Math.round(v / 100)}`) },
        ],
      }, [labels, series.map(row => row.expenseMinor)], host);
      host.classList.add("ledger-trend--ready");
    };
    requestAnimationFrame(paint);
  }

  function accentFill(colorName) {
    const key = (colorName || "sage").replace(/[^a-z0-9-]/gi, "") || "sage";
    const root = document.documentElement;
    const picked = getComputedStyle(root).getPropertyValue(`--accent-${key}`).trim();
    if (picked) return picked;
    return getComputedStyle(root).getPropertyValue("--accent-sage").trim() || "#3a8f7a";
  }

  function layoutTreemapCells(items, x, y, w, h, horizontal) {
    if (!items.length) return [];
    if (items.length === 1) {
      return [{ ...items[0], x, y, w, h }];
    }
    const total = items.reduce((s, row) => s + row.value, 0);
    let acc = 0;
    let split = 0;
    for (let i = 0; i < items.length - 1; i += 1) {
      acc += items[i].value;
      const ratio = acc / total;
      if (ratio >= 0.45) { split = i + 1; break; }
      split = i + 1;
    }
    const left = items.slice(0, split);
    const right = items.slice(split);
    const leftTotal = left.reduce((s, row) => s + row.value, 0);
    const slice = horizontal
      ? { lw: w * (leftTotal / total), rw: w - w * (leftTotal / total) }
      : { lh: h * (leftTotal / total), rh: h - h * (leftTotal / total) };
    if (horizontal) {
      return [
        ...layoutTreemapCells(left, x, y, slice.lw, h, !horizontal),
        ...layoutTreemapCells(right, x + slice.lw, y, slice.rw, h, !horizontal),
      ];
    }
    return [
      ...layoutTreemapCells(left, x, y, w, slice.lh, !horizontal),
      ...layoutTreemapCells(right, x, y + slice.lh, w, slice.rh, !horizontal),
    ];
  }

  function categorySegAttrs(categoryId, label, styleExtra) {
    const selected = listCategoryFilter === categoryId ? " is-selected" : "";
    const pressed = listCategoryFilter === categoryId ? "true" : "false";
    const aria = t(`筛选「${label}」交易`, `Filter “${label}” entries`, `Buchungen „${label}“ filtern`);
    return `class="ledger-cat-seg${selected}" data-ledger-category="${ctx.escape(categoryId)}" tabindex="0" role="button" aria-label="${ctx.escape(aria)}" aria-pressed="${pressed}"${styleExtra ? ` style="${styleExtra}"` : ""}`;
  }

  function renderTreemap(breakdown, ledger) {
    const total = breakdown.reduce((s, row) => s + row.amountMinor, 0);
    if (!total) return `<div class="ledger-donut ledger-donut--empty ll-empty-enter">${t("暂无支出分类", "No spending yet", "Noch keine Ausgaben")}</div>`;
    const items = breakdown.slice(0, 8).map(row => {
      const cat = ledger.categories.find(c => c.id === row.categoryId);
      const name = cat ? core().localizedCategoryName(cat, ctx.lang?.()) : "";
      const color = accentFill(cat?.color);
      return {
        categoryId: row.categoryId,
        value: row.amountMinor,
        color,
        label: name,
        lightFill: core().isLightAccentColor(color),
      };
    });
    const cells = layoutTreemapCells(items, 0, 0, 100, 100, true);
    const lang = ctx.lang?.() || "en";
    const rects = cells.map((cell, index) => {
      const maxChars = core().treemapLabelMaxChars(cell.w, cell.h, lang);
      const short = maxChars ? core().truncateTreemapLabel(cell.label, maxChars) : "";
      const label = short
        ? `<text x="${(cell.x + cell.w / 2).toFixed(2)}" y="${(cell.y + cell.h / 2).toFixed(2)}" text-anchor="middle" dominant-baseline="middle" class="ledger-treemap-label${cell.lightFill ? " ledger-treemap-label--dim" : ""}">${ctx.escape(short)}</text>`
        : "";
      const style = `--cell-i:${index}`;
      return `<rect x="${cell.x.toFixed(2)}" y="${cell.y.toFixed(2)}" width="${Math.max(0.5, cell.w).toFixed(2)}" height="${Math.max(0.5, cell.h).toFixed(2)}" fill="${cell.color}" rx="1" ${categorySegAttrs(cell.categoryId, cell.label, style)}><title>${ctx.escape(cell.label)}</title></rect>${label}`;
    }).join("");
    return `<svg class="ledger-treemap is-retargeting" viewBox="0 0 100 100" role="img" aria-label="${t("分类占比", "Category split", "Kategorien")}">${rects}</svg>`;
  }

  function renderCategoryViz(breakdown, ledger) {
    const body = categoryChartMode === "treemap"
      ? renderTreemap(breakdown, ledger)
      : renderDonut(breakdown, ledger);
    const empty = body.includes("ledger-donut--empty");
    const skel = empty ? "" : `<div class="ledger-skeleton ledger-skeleton--donut" aria-hidden="true"></div>`;
    return `<div class="ledger-category-viz${empty ? " is-ready" : ""}">${skel}${body}</div>`;
  }

  function renderDonut(breakdown, ledger) {
    const total = breakdown.reduce((s, row) => s + row.amountMinor, 0);
    if (!total) return `<div class="ledger-donut ledger-donut--empty ll-empty-enter">${t("暂无支出分类", "No spending yet", "Noch keine Ausgaben")}</div>`;
    const slices = core().breakdownDonutSlices(breakdown, 6);
    const paths = slices.map((slice, index) => {
      const cat = ledger.categories.find(c => c.id === slice.categoryId);
      const fill = accentFill(cat?.color);
      const name = cat ? core().localizedCategoryName(cat, ctx.lang?.()) : "";
      const d = core().annularSectorPath(50, 50, 30, 48, slice.startAngle, slice.endAngle);
      return `<path d="${d}" fill="${ctx.escape(fill)}" ${categorySegAttrs(slice.categoryId, name, `--seg-i:${index}`)}><title>${ctx.escape(name)}</title></path>`;
    }).join("");
    return `<svg class="ledger-donut ledger-donut-svg" viewBox="0 0 100 100" role="img" aria-label="${t("分类占比", "Category split", "Kategorien")}"><g class="ledger-donut-segments is-retargeting">${paths}</g><circle class="ledger-donut-hole" cx="50" cy="50" r="30" fill="var(--surface-page, #f5f5f0)"/></svg>`;
  }

  function renderHeatmap(ledger, ym) {
    const map = core().dailySpendHeatmap(ledger, ym);
    const [y, m] = ym.split("-").map(Number);
    const days = new Date(y, m, 0).getDate();
    const max = Math.max(1, ...map.values());
    const locale = ctx.locale?.() || "de-DE";
    let cells = "";
    for (let day = 1; day <= days; day += 1) {
      const iso = `${ym}-${String(day).padStart(2, "0")}`;
      const val = map.get(iso) || 0;
      const level = val ? Math.min(4, Math.ceil((val / max) * 4)) : 0;
      const selected = listDayFilter === iso ? " is-selected" : "";
      const spendLabel = val
        ? core().formatMoney(-Math.abs(val), ledger.settings.defaultCurrency, locale)
        : t("无支出", "No spend", "Keine Ausgaben");
      const dayLabel = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(y, m - 1, day));
      const aria = t(`${dayLabel}：${spendLabel}，筛选交易`, `${dayLabel}: ${spendLabel}, filter list`, `${dayLabel}: ${spendLabel}, Liste filtern`);
      cells += `<button type="button" class="ledger-heat ledger-heat-${level}${selected}" style="--heat-i:${day - 1}" data-ledger-day="${ctx.escape(iso)}" aria-label="${ctx.escape(aria)}" aria-pressed="${listDayFilter === iso ? "true" : "false"}"></button>`;
    }
    return `<div class="ledger-heat-grid is-retargeting">${cells}</div>`;
  }

  function renderWellnessEmptyBlock() {
    const scatterEmptyCta = t("去 Today 记录", "Log on Today", "Auf Heute erfassen");
    const scatterStepLabels = [
      t("记录心情", "Log mood", "Stimmung notieren"),
      t("完成习惯", "Complete habits", "Gewohnheiten abhaken"),
      t("记一笔支出", "Log spending", "Ausgabe erfassen"),
    ];
    const scatterStepTargets = ["today", "habits", "ledger"];
    const scatterSteps = scatterStepLabels
      .map(
        (label, i) =>
          `<li><button type="button" class="review-scatter-empty-step" data-scatter-empty-target="${scatterStepTargets[i]}" style="--step-i:${i}">${ctx.escape(label)}</button></li>`,
      )
      .join("");
    const hairline = ctx.hairlineEmpty?.(
      "./assets/hairline/empty-insights.svg",
      t("散点图还需要一点数据", "Scatter charts need a few more days", "Streudiagramme brauchen noch Tage"),
      t(
        "连续记录心情、习惯完成与支出后，心情 / 习惯与支出的对照图会自动出现。",
        "Log mood, habit completion, and spending on more days and mood / habit vs spend charts will appear.",
        "Erfasse an mehr Tagen Stimmung, Gewohnheiten und Ausgaben — dann erscheinen die Vergleichsdiagramme.",
      ),
    );
    const body = hairline
      ? hairline
      : `<p>${t("散点图还需要一点数据", "Scatter charts need a few more days", "Streudiagramme brauchen noch Tage")}</p>`;
    return `<div class="ledger-wellness-empty review-scatter-empty ll-polished" id="ledgerWellnessEmptyHint">${body}<ul class="review-scatter-empty-steps" aria-label="${ctx.escape(t("还需要的数据", "Still needed", "Noch nötig"))}">${scatterSteps}</ul><button type="button" class="primary-button review-scatter-empty-cta ledger-wellness-empty-cta" id="ledgerWellnessEmptyToday">${ctx.escape(scatterEmptyCta)}</button></div>`;
  }

  function ledgerPolishedEmpty(className, asset, title, help, ctaHtml = "") {
    const hairline = ctx.hairlineEmpty?.(asset, title, help);
    const body = hairline || `<p class="ledger-empty-fallback">${ctx.escape(help)}</p>`;
    return `<div class="${className} ll-polished ll-empty-enter" role="status">${body}${ctaHtml}</div>`;
  }

  function focusLedgerQuickEntry(host) {
    const reduced = root.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    host.querySelector(".ledger-quick")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    const input = host.querySelector("#ledgerQuickInput");
    input?.focus({ preventScroll: true });
  }

  function renderWellnessInsights(ledger, ym) {
    const summary = core().monthSummary(ledger, ym);
    if (summary.expenseMinor >= 0) return "";
    const rows = ctx.monthDailyRows?.(ym) || [];
    const L = core();
    const lang = ctx.lang?.() || "en";
    const locale = ctx.locale?.();
    const cur = ledger.settings.defaultCurrency;
    const moodScatter = rows.length ? L.moodSpendScatter(rows) : null;
    const habitScatter = rows.length ? L.habitCompletionSpendScatter(rows) : null;
    const scatterOpts = { lang, locale, currency: cur, width: 268, height: 90 };
    const cards = [];
    if (moodScatter) {
      cards.push(`<article class="ledger-wellness-card">
        <p class="ledger-wellness-caption">${t("心情与当日支出", "Mood vs daily spending", "Stimmung und Tagesausgaben")}</p>
        <div class="ledger-wellness-chart">${L.renderMoodSpendScatterSvg(moodScatter, scatterOpts)}</div>
        <button type="button" class="ledger-wellness-link" data-ledger-review-scatter="review-scatter-mood">${t("在复盘中查看 →", "Open in Review →", "In Rückblick öffnen →")}</button>
      </article>`);
    }
    if (habitScatter) {
      cards.push(`<article class="ledger-wellness-card">
        <p class="ledger-wellness-caption">${t("习惯完成度与当日支出", "Habit completion vs spending", "Gewohnheitsquote und Ausgaben")}</p>
        <div class="ledger-wellness-chart">${L.renderHabitCompletionSpendScatterSvg(habitScatter, scatterOpts)}</div>
        <button type="button" class="ledger-wellness-link" data-ledger-review-scatter="review-scatter-habit">${t("在复盘中查看 →", "Open in Review →", "In Rückblick öffnen →")}</button>
      </article>`);
    }
    const inner = cards.length
      ? `<div class="ledger-wellness-grid is-retargeting">${cards.join("")}</div>`
      : renderWellnessEmptyBlock();
    return `<section class="ledger-wellness-insights ll-polished" aria-label="${t("支出与生活关联", "Spending & life correlations", "Ausgaben und Leben")}">
      <div class="ledger-wellness-head"><h3>${t("本月关联洞察", "This month’s correlations", "Zusammenhänge in diesem Monat")}</h3></div>
      ${inner}
      <p class="sr-only ledger-scatter-live" aria-live="polite" aria-atomic="true"></p>
    </section>`;
  }

  function renderChips(ledger) {
    const ids = ledger.meta.recentCategoryIds.length
      ? ledger.meta.recentCategoryIds
      : ledger.categories.filter(c => !c.archived && c.kind === "expense").slice(0, 6).map(c => c.id);
    return ids.map(id => {
      const cat = ledger.categories.find(c => c.id === id);
      if (!cat) return "";
      const name = core().localizedCategoryName(cat, ctx.lang?.());
      return `<button type="button" class="ledger-chip" data-cat="${ctx.escape(id)}">${ctx.escape(name)}</button>`;
    }).join("");
  }

  function expenseCategoryOptions(ledger, selectedId) {
    return ledger.categories.filter(c => c.kind === "expense" && !c.archived).map(c => {
      const name = core().localizedCategoryName(c, ctx.lang?.());
      const sel = c.id === selectedId ? " selected" : "";
      return `<option value="${ctx.escape(c.id)}"${sel}>${ctx.escape(name)}</option>`;
    }).join("");
  }

  function renderBudgets(ledger, ym) {
    const rows = core().budgetProgress(ledger, ym);
    if (!rows.length) {
      const cta = `<button type="button" class="primary-button" id="ledgerBudgetEmptyAdd">${t("设置预算", "Set budget", "Budget setzen")}</button>`;
      return ledgerPolishedEmpty(
        "ledger-budget-empty-wrap",
        "./assets/hairline/empty-insights.svg",
        t("还没有本月预算", "No budgets this month", "Noch kein Monatsbudget"),
        t(
          "为餐饮、交通等支出分类设上限，进度条会随记账自动更新。",
          "Set a monthly cap per expense category — progress updates as you log.",
          "Lege Monatslimits pro Ausgabenkategorie fest — der Fortschritt folgt deinen Buchungen.",
        ),
        cta,
      );
    }
    return `<ul class="ledger-budget-list is-retargeting">${rows.map(row => {
      const cat = ledger.categories.find(c => c.id === row.categoryId);
      const name = cat ? core().localizedCategoryName(cat, ctx.lang?.()) : "";
      const pct = Math.min(100, Math.round(row.ratio * 100));
      const over = row.ratio > 1;
      return `<li class="ledger-budget${over ? " is-over" : ""}" data-budget-id="${ctx.escape(row.id)}">
        <span class="ledger-budget-name">${ctx.escape(name)}</span>
        <span class="ledger-budget-actions">
          <button type="button" class="icon-button ledger-budget-edit" aria-label="${t("编辑", "Edit", "Bearbeiten")}">✎</button>
          <button type="button" class="icon-button ledger-budget-del" aria-label="${t("删除", "Delete", "Löschen")}">×</button>
        </span>
        <span class="ledger-budget-amt">${ctx.escape(core().formatMoney(row.spentMinor, row.currency, ctx.locale?.()))} / ${ctx.escape(core().formatMoney(row.limitMinor, row.currency, ctx.locale?.()))}</span>
        <span class="ledger-budget-bar" style="--p:${pct / 100}"></span>
      </li>`;
    }).join("")}</ul>`;
  }

  function openBudgetPopover(ledger, ym, existing) {
    closeLedgerPopovers();
    const expenseCat = ledger.categories.find(c => c.kind === "expense" && !c.archived);
    const budget = existing || {
      id: "",
      categoryId: expenseCat?.id || "",
      month: ym,
      limitMinor: 10000,
      currency: ledger.settings.defaultCurrency,
    };
    const amountDisplay = (budget.limitMinor / 100).toFixed(2).replace(".", ",");
    const pop = document.createElement("div");
    pop.className = "ledger-budget-popover ledger-edit-popover";
    pop.innerHTML = `
      <form class="ledger-edit-form ledger-budget-form">
        <header><strong>${existing ? t("编辑预算", "Edit budget", "Budget bearbeiten") : t("设置预算", "Set budget", "Budget setzen")}</strong></header>
        <p class="ledger-budget-form-month">${ctx.escape(monthLabel(ym))}</p>
        <div class="ledger-edit-field">
          <span>${t("分类", "Category", "Kategorie")}</span>
          <select name="category"${existing ? " disabled" : ""}>${expenseCategoryOptions(ledger, budget.categoryId)}</select>
        </div>
        <div class="ledger-edit-field">
          <span>${t("上限", "Limit", "Limit")}</span>
          <input name="limit" inputmode="decimal" autocomplete="off" value="${ctx.escape(amountDisplay)}" placeholder="${t("例如 350", "e.g. 350", "z. B. 350")}" />
        </div>
        <div class="ledger-edit-actions">
          <button type="button" class="secondary-button" data-budget-cancel>${t("取消", "Cancel", "Abbrechen")}</button>
          <button type="submit" class="primary-button">${t("保存", "Save", "Speichern")}</button>
        </div>
      </form>`;
    document.body.appendChild(pop);
    const form = pop.querySelector("form");
    attachPopoverEscape(closeLedgerPopovers);
    pop.addEventListener("click", event => {
      if (event.target === pop) closeLedgerPopovers();
    });
    pop.querySelector("[data-budget-cancel]")?.addEventListener("click", closeLedgerPopovers);
    form.addEventListener("submit", event => {
      event.preventDefault();
      const categoryId = existing?.categoryId || form.querySelector('[name="category"]').value;
      const limitRaw = form.querySelector('[name="limit"]').value;
      const result = core().upsertCategoryBudget(ledgerState(), {
        id: existing?.id,
        categoryId,
        month: ym,
        amountText: limitRaw,
        currency: budget.currency || ledger.settings.defaultCurrency,
      }, { lang: ctx.lang?.() });
      if (!result) {
        form.querySelector('[name="limit"]')?.classList.add("is-error");
        return;
      }
      commit(result.ledger);
      closeLedgerPopovers();
      ctx.toast?.(t("已保存预算", "Budget saved", "Budget gespeichert"));
      render();
    });
  }

  function listFiltersActive() {
    return Boolean(String(listFilter || "").trim() || listDayFilter || listCategoryFilter);
  }

  function activeListFilterCount() {
    let n = 0;
    if (String(listFilter || "").trim()) n += 1;
    if (listDayFilter) n += 1;
    if (listCategoryFilter) n += 1;
    return n;
  }

  function clearAllListFilters(host, ym) {
    listFilter = "";
    listDayFilter = "";
    listCategoryFilter = "";
    const filterInput = host.querySelector("#ledgerFilter");
    if (filterInput) filterInput.value = "";
    syncHeatSelection(host);
    syncCategorySelection(host);
    refreshLedgerList(host, ledgerState(), ym);
  }

  function renderListFilterSummary(ledger, rows) {
    if (!listFiltersActive() || !rows.length) return "";
    const sum = core().summarizeTransactions(ledger, rows);
    const cur = ledger.settings.defaultCurrency;
    const locale = ctx.locale?.() || "de-DE";
    const countLabel = sum.count === 1
      ? t("1 笔", "1 entry", "1 Buchung")
      : t(`${sum.count} 笔`, `${sum.count} entries`, `${sum.count} Buchungen`);
    const hasIncome = sum.incomeMinor > 0;
    const hasExpense = sum.expenseMinor < 0;
    const showSplit = hasIncome && hasExpense;
    const net = core().formatMoney(sum.netMinor, cur, locale);
    const netText = showSplit
      ? `${t("净", "Net", "Saldo")} ${net}`
      : net;
    const splitMarkup = showSplit
      ? `<span class="ledger-list-filter-sum-split"><span class="ledger-list-filter-sum-in">${ctx.escape(t("收入", "Income", "Einnahmen"))} ${ctx.escape(core().formatMoney(sum.incomeMinor, cur, locale))}</span><span class="ledger-list-filter-sum-sep" aria-hidden="true">·</span><span class="ledger-list-filter-sum-out">${ctx.escape(t("支出", "Expenses", "Ausgaben"))} ${ctx.escape(core().formatMoney(sum.expenseMinor, cur, locale))}</span><span class="ledger-list-filter-sum-sep" aria-hidden="true">·</span></span>`
      : "";
    const clearAll = activeListFilterCount() >= 2
      ? `<button type="button" class="text-button ledger-filter-clear-all" data-ledger-clear-all-filters>${t("清除全部筛选", "Clear all filters", "Alle Filter aufheben")}</button>`
      : "";
    return `<div class="ledger-list-filter-sum ll-insight-enter" role="status">
      <span class="ledger-list-filter-sum-copy"><span class="ledger-list-filter-sum-count">${ctx.escape(countLabel)}</span><span class="ledger-list-filter-sum-sep" aria-hidden="true">·</span>${splitMarkup}<strong class="ledger-list-filter-sum-net">${ctx.escape(netText)}</strong></span>
      ${clearAll}
    </div>`;
  }

  function renderList(ledger, ym) {
    const rows = core().filterTransactions(ledger, ym, listFilter, listDayFilter, listCategoryFilter)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    if (!rows.length) {
      if (listDayFilter && listCategoryFilter) {
        const cta = `<button type="button" class="secondary-button" id="ledgerListEmptyClearAll">${t("清除全部筛选", "Clear all filters", "Alle Filter aufheben")}</button>`;
        return ledgerPolishedEmpty(
          "ledger-list-empty ledger-list-empty--combo",
          "./assets/hairline/search-empty.svg",
          t("没有匹配的交易", "No matching entries", "Keine passenden Buchungen"),
          t("这一天在这个分类下没有记录，试试放宽筛选。", "Nothing on this day in this category — try clearing a filter.", "An diesem Tag in dieser Kategorie nichts — Filter lockern."),
          cta,
        );
      }
      if (listDayFilter) {
        return ledgerPolishedEmpty(
          "ledger-list-empty ledger-list-empty--day",
          "./assets/hairline/search-empty.svg",
          t("这一天没有交易", "No entries this day", "Keine Buchungen an diesem Tag"),
          t("试试选其他日期，或清除日期筛选。", "Pick another day or clear the date filter.", "Wähle einen anderen Tag oder hebe den Datumsfilter auf."),
        );
      }
      if (listCategoryFilter) {
        const cta = `<button type="button" class="secondary-button" id="ledgerListEmptyClearCategory">${t("清除分类筛选", "Clear category filter", "Kategoriefilter aufheben")}</button>`;
        return ledgerPolishedEmpty(
          "ledger-list-empty ledger-list-empty--category",
          "./assets/hairline/search-empty.svg",
          t("这个分类本月没有交易", "No entries in this category", "Keine Buchungen in dieser Kategorie"),
          t("试试其他分类，或清除分类筛选。", "Pick another category or clear the filter.", "Andere Kategorie wählen oder Filter aufheben."),
          cta,
        );
      }
      if (listFilter) {
        const cta = `<button type="button" class="secondary-button" id="ledgerListEmptyClearFilter">${t("清除搜索", "Clear search", "Suche löschen")}</button>`;
        return ledgerPolishedEmpty(
          "ledger-list-empty ledger-list-empty--filter",
          "./assets/hairline/search-empty.svg",
          t("没有匹配的交易", "No matching entries", "Keine passenden Buchungen"),
          t("换个关键词，或清除搜索框。", "Try another keyword or clear the search field.", "Anderes Stichwort oder Suche leeren."),
          cta,
        );
      }
      const cta = `<button type="button" class="primary-button" id="ledgerListEmptyQuick">${t("开始录入", "Start typing", "Erfassung starten")}</button>`;
      return ledgerPolishedEmpty(
        "ledger-list-empty",
        "./assets/hairline/ledger-month-empty.svg",
        t("这个月还没有记录", "Nothing logged this month", "Noch nichts in diesem Monat"),
        t("在上方快速录入试试「12,50 咖啡」或「-45 Miete gestern」。", "Use quick entry above — e.g. \"12.50 coffee\" or \"-45 rent yesterday\".", "Oben Schnellerfassung — z. B. „12,50 Kaffee“ oder „-45 Miete gestern“."),
        cta,
      );
    }
    return `${renderListFilterSummary(ledger, rows)}<ul class="ledger-tx-list">${rows.map(tx => {
      const cat = ledger.categories.find(c => c.id === tx.categoryId);
      const name = cat ? core().localizedCategoryName(cat, ctx.lang?.()) : "";
      const enter = tx.id === lastHighlightTxId ? " is-enter" : "";
      return `<li class="ledger-tx${enter}" data-id="${ctx.escape(tx.id)}">
        <span class="ledger-tx-date">${ctx.escape(tx.date.slice(5))}</span>
        <span class="ledger-tx-note">${ctx.escape(tx.note || name)}</span>
        <span class="ledger-tx-amt ${tx.amountMinor < 0 ? "is-expense" : "is-income"}">${ctx.escape(core().formatMoney(tx.amountMinor, tx.currency, ctx.locale?.()))}</span>
        <span class="ledger-tx-actions">
          <button type="button" class="icon-button ledger-tx-edit" aria-label="${t("编辑", "Edit", "Bearbeiten")}">✎</button>
          <button type="button" class="icon-button ledger-tx-dup" aria-label="${t("复制", "Duplicate", "Duplizieren")}">⧉</button>
          <button type="button" class="icon-button ledger-tx-del" aria-label="${t("删除", "Delete", "Löschen")}">×</button>
        </span>
      </li>`;
    }).join("")}</ul>`;
  }

  function renderRecurringPendingBanner(ledger, ym) {
    const currentYm = ymFromDate(ctx.iso(new Date()));
    if (ym !== currentYm) return "";
    const pending = core().recurringPendingForMonth(ledger, ym, { lang: ctx.lang?.() });
    if (!pending.length) return "";
    const occurrenceCount = core().recurringPendingOccurrenceCount(ledger, ym, { lang: ctx.lang?.() });
    const labels = pending.slice(0, 3).map(rec => {
      const cat = ledger.categories.find(c => c.id === rec.categoryId);
      const raw = rec.label || (cat ? core().localizedCategoryName(cat, ctx.lang?.()) : t("固定项", "Recurring", "Vorlage"));
      return ctx.escape(raw);
    });
    const more = pending.length > 3 ? t(` 等 ${pending.length} 项`, ` and ${pending.length - 3} more`, ` und ${pending.length - 3} weitere`) : "";
    const listText = `${labels.join(" · ")}${more}`;
    let body;
    if (occurrenceCount <= 1) {
      body = t(`本月尚未记：${listText}`, `Not posted this month: ${listText}`, `Diesen Monat noch nicht gebucht: ${listText}`);
    } else if (pending.length === 1) {
      body = t(
        `本月尚有 ${occurrenceCount} 笔固定待记：${listText}`,
        `${occurrenceCount} recurring entries not posted this month: ${listText}`,
        `${occurrenceCount} Buchungen diesen Monat offen: ${listText}`,
      );
    } else {
      body = t(
        `本月有 ${occurrenceCount} 笔固定待记：${listText}`,
        `${occurrenceCount} recurring entries not posted this month: ${listText}`,
        `${occurrenceCount} Buchungen diesen Monat offen: ${listText}`,
      );
    }
    return `<div class="ledger-recurring-due ll-insight-enter" role="status">
      <p class="ledger-recurring-due-copy">${body}</p>
      <button type="button" class="primary-button ledger-recurring-due-all">${t("全部记入账", "Post all pending", "Alle buchen")}</button>
    </div>`;
  }

  function renderRecurring(ledger) {
    const rows = (ledger.recurring || []).filter(Boolean);
    const addBtn = `<button type="button" class="secondary-button ledger-recurring-add">${t("添加固定项", "Add recurring", "Hinzufügen")}</button>`;
    if (!rows.length) {
      const cta = `<button type="button" class="primary-button" id="ledgerRecurringEmptyAdd">${t("添加固定项", "Add recurring", "Hinzufügen")}</button>`;
      const emptyBlock = ledgerPolishedEmpty(
        "ledger-recurring-empty-wrap",
        "./assets/hairline/ledger-recurring-empty.svg",
        t("还没有固定收支", "No recurring templates", "Noch keine Vorlagen"),
        t("房租、订阅或工资等固定项可一键「记一笔」。", "Rent, subscriptions, or salary — post with one tap.", "Miete, Abos oder Gehalt — mit einem Tipp buchen."),
        cta,
      );
      return `<div class="ledger-recurring-head">${addBtn}</div>${emptyBlock}`;
    }
    return `<div class="ledger-recurring-head"><span class="ledger-recurring-count">${rows.length}</span>${addBtn}</div><ul class="ledger-recurring-list">${rows.map(rec => {
      const cat = ledger.categories.find(c => c.id === rec.categoryId);
      const name = rec.label || (cat ? core().localizedCategoryName(cat, ctx.lang?.()) : "");
      const amt = core().formatMoney(rec.amountMinor, rec.currency || ledger.settings.defaultCurrency, ctx.locale?.());
      const cadence = rec.cadence === "weekly" ? "weekly" : "monthly";
      const weekdayNames = [
        t("周日", "Sun", "So"),
        t("周一", "Mon", "Mo"),
        t("周二", "Tue", "Di"),
        t("周三", "Wed", "Mi"),
        t("周四", "Thu", "Do"),
        t("周五", "Fri", "Fr"),
        t("周六", "Sat", "Sa"),
      ];
      const meta = cadence === "weekly"
        ? `${t("每周", "Weekly", "Wöchentlich")} · ${weekdayNames[Number(rec.weekday) || 0] || weekdayNames[1]} · ${ctx.escape(amt)}`
        : `${t("每月", "Monthly", "Monatlich")} · ${t(`第 ${rec.dayOfMonth || 1} 日`, `day ${rec.dayOfMonth || 1}`, `Tag ${rec.dayOfMonth || 1}`)} · ${ctx.escape(amt)}`;
      return `<li class="ledger-recurring" data-rec-id="${ctx.escape(rec.id)}">
        <span class="ledger-recurring-name">${ctx.escape(name)}</span>
        <span class="ledger-recurring-meta">${meta}</span>
        <span class="ledger-recurring-actions">
          <button type="button" class="icon-button ledger-recurring-edit" aria-label="${t("编辑", "Edit", "Bearbeiten")}">✎</button>
          <button type="button" class="icon-button ledger-recurring-del" aria-label="${t("删除", "Delete", "Löschen")}">×</button>
          <button type="button" class="secondary-button ledger-recurring-apply" data-rec="${ctx.escape(rec.id)}">${t("记一笔", "Post now", "Buchen")}</button>
        </span>
      </li>`;
    }).join("")}</ul>`;
  }

  function closeLedgerPopovers() {
    detachPopoverEscape();
    document.querySelector(".ledger-import-popover")?.remove();
    document.querySelector(".ledger-edit-popover")?.remove();
    document.querySelector(".ledger-recurring-popover")?.remove();
    document.querySelector(".ledger-budget-popover")?.remove();
  }

  function openCsvImportConfirm(preview, onConfirm, onCancel) {
    closeLedgerPopovers();
    const skipNote = preview.skipped
      ? t(`，跳过 ${preview.skipped} 行`, `, skip ${preview.skipped} rows`, `, ${preview.skipped} Zeilen übersprungen`)
      : "";
    const body = t(
      `将导入 ${preview.importable} 笔交易${skipNote}。`,
      `Import ${preview.importable} ${preview.importable === 1 ? "entry" : "entries"}${skipNote}.`,
      `${preview.importable} Buchung${preview.importable === 1 ? "" : "en"} importieren${skipNote}.`,
    );
    const pop = document.createElement("div");
    pop.className = "ledger-edit-popover ledger-import-popover";
    pop.innerHTML = `
      <div class="ledger-edit-form ledger-import-confirm" role="dialog" aria-modal="true" aria-labelledby="ledgerImportConfirmTitle">
        <header><strong id="ledgerImportConfirmTitle">${t("导入 CSV", "Import CSV", "CSV importieren")}</strong></header>
        <p class="ledger-import-confirm-body">${ctx.escape(body)}</p>
        <div class="ledger-edit-actions">
          <button type="button" class="secondary-button" data-import-cancel>${t("取消", "Cancel", "Abbrechen")}</button>
          <button type="button" class="primary-button" data-import-confirm>${t("导入", "Import", "Importieren")}</button>
        </div>
      </div>`;
    document.body.appendChild(pop);
    const finishCancel = () => {
      closeLedgerPopovers();
      onCancel?.();
    };
    attachPopoverEscape(finishCancel);
    pop.addEventListener("click", event => {
      if (event.target === pop) finishCancel();
    });
    pop.querySelector("[data-import-cancel]")?.addEventListener("click", finishCancel);
    pop.querySelector("[data-import-confirm]")?.addEventListener("click", () => {
      closeLedgerPopovers();
      onConfirm?.();
    });
    pop.querySelector("[data-import-confirm]")?.focus();
  }

  function closeEditPopover() {
    closeLedgerPopovers();
  }

  function recurringCategoryOptions(ledger, selectedId) {
    const renderGroup = (kind, labelZh, labelEn, labelDe) => {
      const cats = ledger.categories.filter(c => c.kind === kind && !c.archived);
      if (!cats.length) return "";
      const label = t(labelZh, labelEn, labelDe);
      return `<optgroup label="${ctx.escape(label)}">${cats.map(c => {
        const name = core().localizedCategoryName(c, ctx.lang?.());
        const sel = c.id === selectedId ? " selected" : "";
        return `<option value="${ctx.escape(c.id)}"${sel}>${ctx.escape(name)}</option>`;
      }).join("")}</optgroup>`;
    };
    return [
      renderGroup("expense", "支出", "Expense", "Ausgabe"),
      renderGroup("income", "收入", "Income", "Einnahmen"),
    ].join("");
  }

  function openRecurringPopover(ledger, existing) {
    closeLedgerPopovers();
    const rec = existing || {
      id: "",
      label: "",
      categoryId: ledger.categories.find(c => c.kind === "expense" && !c.archived)?.id
        || ledger.categories.find(c => !c.archived)?.id
        || "",
      amountMinor: -1000,
      currency: ledger.settings.defaultCurrency,
      dayOfMonth: 1,
      cadence: "monthly",
      weekday: new Date().getDay(),
      note: "",
    };
    const cadence = rec.cadence === "weekly" ? "weekly" : "monthly";
    const amountDisplay = (Math.abs(rec.amountMinor) / 100).toFixed(2).replace(".", ",");
    const pop = document.createElement("div");
    pop.className = "ledger-recurring-popover ledger-edit-popover";
    pop.innerHTML = `
      <form class="ledger-edit-form ledger-recurring-form">
        <header><strong>${existing ? t("编辑固定项", "Edit recurring", "Wiederkehrend bearbeiten") : t("新建固定项", "New recurring", "Neu wiederkehrend")}</strong></header>
        <div class="ledger-edit-field">
          <span>${t("名称", "Label", "Bezeichnung")}</span>
          <input name="label" autocomplete="off" value="${ctx.escape(rec.label || "")}" placeholder="${t("例如房租", "e.g. Rent", "z. B. Miete")}" />
        </div>
        <div class="ledger-edit-field">
          <span>${t("分类", "Category", "Kategorie")}</span>
          <select name="category">${recurringCategoryOptions(ledger, rec.categoryId)}</select>
        </div>
        <div class="ledger-edit-field">
          <span>${t("金额", "Amount", "Betrag")}</span>
          <input name="amount" inputmode="decimal" value="${ctx.escape(amountDisplay)}" />
        </div>
        <div class="ledger-edit-field">
          <span>${t("频率", "Cadence", "Rhythmus")}</span>
          <select name="cadence">
            <option value="monthly"${cadence === "monthly" ? " selected" : ""}>${t("每月", "Monthly", "Monatlich")}</option>
            <option value="weekly"${cadence === "weekly" ? " selected" : ""}>${t("每周", "Weekly", "Wöchentlich")}</option>
          </select>
        </div>
        <div class="ledger-edit-field ledger-recurring-day" data-cadence-field="monthly"${cadence === "weekly" ? " hidden" : ""}>
          <span>${t("每月几号", "Day of month", "Tag im Monat")}</span>
          <input name="day" type="number" min="1" max="28" value="${Number(rec.dayOfMonth) || 1}" />
        </div>
        <div class="ledger-edit-field ledger-recurring-weekday" data-cadence-field="weekly"${cadence !== "weekly" ? " hidden" : ""}>
          <span>${t("星期几", "Weekday", "Wochentag")}</span>
          <select name="weekday">
            ${[0, 1, 2, 3, 4, 5, 6].map(wd => {
              const names = [
                t("周日", "Sunday", "Sonntag"),
                t("周一", "Monday", "Montag"),
                t("周二", "Tuesday", "Dienstag"),
                t("周三", "Wednesday", "Mittwoch"),
                t("周四", "Thursday", "Donnerstag"),
                t("周五", "Friday", "Freitag"),
                t("周六", "Saturday", "Samstag"),
              ];
              const sel = (Number(rec.weekday) || 0) === wd ? " selected" : "";
              return `<option value="${wd}"${sel}>${names[wd]}</option>`;
            }).join("")}
          </select>
        </div>
        <div class="ledger-edit-field">
          <span>${t("备注", "Note", "Notiz")}</span>
          <input name="note" value="${ctx.escape(rec.note || "")}" />
        </div>
        <div class="ledger-edit-actions">
          <button type="button" class="secondary-button" data-rec-cancel>${t("取消", "Cancel", "Abbrechen")}</button>
          <button type="submit" class="primary-button">${t("保存", "Save", "Speichern")}</button>
        </div>
      </form>`;
    document.body.appendChild(pop);
    const form = pop.querySelector("form");
    attachPopoverEscape(closeLedgerPopovers);
    const syncCadenceFields = () => {
      const mode = form.querySelector('[name="cadence"]')?.value === "weekly" ? "weekly" : "monthly";
      form.querySelectorAll("[data-cadence-field]").forEach(el => {
        el.hidden = el.dataset.cadenceField !== mode;
      });
    };
    form.querySelector('[name="cadence"]')?.addEventListener("change", syncCadenceFields);
    pop.addEventListener("click", event => {
      if (event.target === pop) closeLedgerPopovers();
    });
    pop.querySelector("[data-rec-cancel]")?.addEventListener("click", closeLedgerPopovers);
    form.addEventListener("submit", event => {
      event.preventDefault();
      const categoryId = form.querySelector('[name="category"]').value;
      const cat = ledger.categories.find(c => c.id === categoryId);
      const amountRaw = form.querySelector('[name="amount"]').value;
      let amountMinor = rec.amountMinor;
      const token = core().parseAmountToken(amountRaw);
      if (token != null) amountMinor = cat?.kind === "income" ? Math.abs(token) : -Math.abs(token);
      const dayOfMonth = Math.min(28, Math.max(1, Number(form.querySelector('[name="day"]').value) || 1));
      const cadenceSel = form.querySelector('[name="cadence"]')?.value === "weekly" ? "weekly" : "monthly";
      const weekday = Math.min(6, Math.max(0, Number(form.querySelector('[name="weekday"]')?.value) || 0));
      const draft = {
        id: existing?.id || core().createId(),
        label: form.querySelector('[name="label"]').value.trim(),
        categoryId,
        accountId: rec.accountId || ledger.accounts.find(a => !a.archived)?.id,
        amountMinor,
        currency: rec.currency || ledger.settings.defaultCurrency,
        dayOfMonth,
        cadence: cadenceSel,
        weekday: cadenceSel === "weekly" ? weekday : undefined,
        note: form.querySelector('[name="note"]').value.trim(),
      };
      const result = core().upsertRecurringTemplate(ledgerState(), draft, { lang: ctx.lang?.() });
      if (!result) return;
      commit(result.ledger);
      closeLedgerPopovers();
      ctx.toast?.(t("已保存固定项", "Recurring saved", "Wiederkehrend gespeichert"));
      render();
    });
  }

  function openEditPopover(host, tx, ledger) {
    closeEditPopover();
    const cat = ledger.categories.find(c => c.id === tx.categoryId);
    const catName = cat ? core().localizedCategoryName(cat, ctx.lang?.()) : "";
    const amountDisplay = (Math.abs(tx.amountMinor) / 100).toFixed(2).replace(".", ",");
    const pop = document.createElement("div");
    pop.className = "ledger-edit-popover";
    pop.innerHTML = `
      <form class="ledger-edit-form">
        <header><strong>${t("编辑交易", "Edit entry", "Buchung bearbeiten")}</strong></header>
        <p class="ledger-edit-cat">${ctx.escape(catName)}</p>
        <label class="ledger-edit-field"><span>${t("金额", "Amount", "Betrag")}</span><input name="amount" inputmode="decimal" value="${ctx.escape(amountDisplay)}" /></label>
        <label class="ledger-edit-field"><span>${t("日期", "Date", "Datum")}</span><input name="date" type="date" value="${ctx.escape(tx.date)}" /></label>
        <label class="ledger-edit-field"><span>${t("备注", "Note", "Notiz")}</span><input name="note" value="${ctx.escape(tx.note || "")}" /></label>
        <div class="ledger-edit-actions">
          <button type="button" class="secondary-button" data-edit-cancel>${t("取消", "Cancel", "Abbrechen")}</button>
          <button type="submit" class="primary-button">${t("保存", "Save", "Speichern")}</button>
        </div>
      </form>`;
    document.body.appendChild(pop);
    const form = pop.querySelector("form");
    const amountInput = form.querySelector('[name="amount"]');
    attachPopoverEscape(closeEditPopover);
    pop.addEventListener("click", event => {
      if (event.target === pop) closeEditPopover();
    });
    pop.querySelector("[data-edit-cancel]")?.addEventListener("click", closeEditPopover);
    amountInput?.addEventListener("input", () => amountInput.classList.remove("is-error"));
    form.addEventListener("submit", event => {
      event.preventDefault();
      const amountRaw = amountInput.value;
      const token = core().parseAmountToken(amountRaw);
      if (token == null) {
        amountInput.classList.add("is-error");
        amountInput.focus();
        return;
      }
      amountInput.classList.remove("is-error");
      let amountMinor = cat?.kind === "income" ? Math.abs(token) : -Math.abs(token);
      const date = form.querySelector('[name="date"]').value || tx.date;
      const note = form.querySelector('[name="note"]').value || "";
      const result = core().updateTransaction(ledgerState(), tx.id, { amountMinor, date, note }, { lang: ctx.lang?.() });
      if (!result) return;
      commit(result.ledger);
      closeEditPopover();
      ctx.toast?.(t("已更新", "Entry updated", "Buchung aktualisiert"));
      render();
    });
  }

  const ONBOARDING_KEY = "life-ledger-ledger-onboarding-dismissed";

  function onboardingDismissed() {
    try {
      return localStorage.getItem(ONBOARDING_KEY) === "1";
    } catch {
      return false;
    }
  }

  function dismissOnboarding(host) {
    if (onboardingDismissed()) return;
    try {
      localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {
      /* ignore */
    }
    const box = host?.querySelector?.("[data-ledger-onboarding]") || $("#ledgerView [data-ledger-onboarding]");
    if (!box) return;
    box.classList.add("is-dismissed");
    root.setTimeout?.(() => box.remove(), 280);
  }

  function renderOnboarding(ledger) {
    if (ledger.transactions.length || onboardingDismissed()) return "";
    return `<aside class="ledger-onboarding ll-empty ll-empty-enter" data-ledger-onboarding>
      <div class="ll-art" data-art="week-insights-empty"></div>
      <div class="ledger-onboarding-copy">
        <strong>${t("从这里记第一笔", "Log your first entry here", "Hier die erste Buchung erfassen")}</strong>
        <p>${t(
          "在上方输入框试试：12,50 咖啡、-45 Miete gestern、+2000 工资。分类芯片可一键填入名称。",
          "Use the quick field above: 12.50 coffee, -45 rent yesterday, +2000 salary. Category chips fill names for you.",
          "Im Feld oben z. B.: 12,50 Kaffee · -45 Miete gestern · +2000 Gehalt. Kategorien-Chips füllen Namen ein.",
        )}</p>
        <button type="button" class="text-button" data-ledger-hint-dismiss>${t("知道了", "Got it", "Verstanden")}</button>
      </div>
    </aside>`;
  }

  function mountOnboardingArt(host) {
    const box = host.querySelector("[data-ledger-onboarding] .ll-art[data-art]");
    if (box && root.LifeLedgerHairline?.mount) root.LifeLedgerHairline.mount(box, box.dataset.art);
  }

  function renderKeypad() {
    const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ",", "0", "⌫"];
    return `<div class="ledger-keypad" role="group" aria-label="${t("金额键盘", "Amount keypad", "Ziffernblock")}">
      ${keys.map(k => `<button type="button" class="ledger-key" data-key="${k === "⌫" ? "backspace" : k}">${k}</button>`).join("")}
      <button type="button" class="ledger-key ledger-key-sign" data-key="sign">±</button>
    </div>`;
  }

  function bindKeypad(host) {
    const input = host.querySelector("#ledgerQuickForm input[name=quick]");
    const pad = host.querySelector(".ledger-keypad");
    if (!input || !pad) return;
    pad.querySelectorAll(".ledger-key").forEach(btn => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.key;
        let value = input.value;
        if (key === "backspace") {
          input.value = value.slice(0, -1);
        } else if (key === "sign") {
          if (/^\s*[-+]/.test(value)) input.value = value.replace(/^\s*[-+]/, "");
          else if (/^\s*\d/.test(value) || /^\s*[,.\d]/.test(value)) input.value = `-${value.trimStart()}`;
          else input.value = `- ${value}`;
        } else {
          input.value = value + key;
        }
        input.focus();
      });
    });
  }

  function bindInteractions(host, ledger, ym) {
    const form = host.querySelector("#ledgerQuickForm");
    form?.addEventListener("submit", event => {
      event.preventDefault();
      const input = form.querySelector("input[name=quick]");
      const parsed = core().parseQuickEntry(input.value, ledger, { lang: ctx.lang?.(), today: ctx.iso(new Date()) });
      if (!parsed.ok) {
        input.classList.add("is-error");
        input.setAttribute("aria-invalid", "true");
        return;
      }
      input.classList.remove("is-error");
      input.removeAttribute("aria-invalid");
      const { ledger: next, transaction } = core().addTransaction(ledger, parsed.draft, { lang: ctx.lang?.() });
      const firstEntry = !ledger.transactions.length && next.transactions.length;
      lastHighlightTxId = transaction.id;
      commit(next);
      input.value = "";
      input.classList.add("is-success");
      setTimeout(() => input.classList.remove("is-success"), 600);
      form.classList.add("is-success-flash");
      setTimeout(() => form.classList.remove("is-success-flash"), 600);
      if (firstEntry) dismissOnboarding(host);
      render();
    });
    host.querySelectorAll(".ledger-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const input = form?.querySelector("input[name=quick]");
        if (!input) return;
        const cat = ledger.categories.find(c => c.id === chip.dataset.cat);
        const name = cat ? core().localizedCategoryName(cat, ctx.lang?.()) : "";
        input.value = input.value.trim() ? `${input.value.trim()} ${name}` : `12,50 ${name}`;
        input.focus();
      });
    });
    host.querySelector("[data-ledger-prev]")?.addEventListener("click", () => {
      viewMonth = shiftMonth(ym, -1);
      listDayFilter = "";
      listCategoryFilter = "";
      ledgerMonthPulse = true;
      render();
    });
    host.querySelector("[data-ledger-next]")?.addEventListener("click", () => {
      viewMonth = shiftMonth(ym, 1);
      listDayFilter = "";
      listCategoryFilter = "";
      ledgerMonthPulse = true;
      render();
    });
    host.querySelectorAll("[data-ledger-review-scatter]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-ledger-review-scatter");
        ctx.openReviewScatter?.(ym, id);
      });
    });
    host.querySelector("#ledgerFilter")?.addEventListener("input", e => {
      listFilter = e.target.value;
      refreshLedgerList(host, ledgerState(), ym);
    });
    host.querySelector("[data-ledger-export]")?.addEventListener("click", () => {
      const csv = core().exportTransactionsCsv(ledgerState(), ym, { lang: ctx.lang?.() });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `life-ledger-${ym}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      ctx.toast?.(t("已导出 CSV", "CSV exported", "CSV exportiert"));
    });
    const fileInput = host.querySelector("#ledgerCsvFile");
    host.querySelector("[data-ledger-import]")?.addEventListener("click", () => fileInput?.click());
    fileInput?.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        const preview = core().previewGermanBankCsv(text, ledgerState(), { lang: ctx.lang?.() });
        if (!preview.importable) {
          ctx.toast?.(
            preview.skipped
              ? t(`未导入：${preview.skipped} 行无法识别`, `Nothing imported (${preview.skipped} rows skipped)`, `Keine Buchungen (${preview.skipped} Zeilen übersprungen)`)
              : t("文件为空", "File is empty", "Datei ist leer"),
          );
          fileInput.value = "";
          return;
        }
        openCsvImportConfirm(
          preview,
          () => {
            const result = core().importGermanBankCsv(text, ledgerState(), { lang: ctx.lang?.() });
            const hadNone = !ledgerState().transactions.length;
            commit(result.ledger);
            if (hadNone && ledgerState().transactions.length) dismissOnboarding(host);
            const skippedTail = result.skipped
              ? t(`（跳过 ${result.skipped} 行）`, ` (${result.skipped} skipped)`, ` (${result.skipped} übersprungen)`)
              : "";
            ctx.toast?.(
              t(`已导入 ${result.imported} 笔${skippedTail}`, `Imported ${result.imported} entries${skippedTail}`, `${result.imported} Buchungen importiert${skippedTail}`),
            );
            fileInput.value = "";
            render();
          },
          () => {
            fileInput.value = "";
          },
        );
      };
      reader.readAsText(file);
    });
    bindDelete(host, ledger);
    bindDuplicate(host);
    bindEdit(host);
    bindRecurring(host, ym);
    bindBudget(host, ym);
    bindSwipeDelete(host);
    bindKeypad(host);
    host.querySelectorAll("[data-chart-mode]").forEach(btn => {
      btn.addEventListener("click", () => {
        categoryChartMode = btn.dataset.chartMode || "donut";
        render();
      });
    });
    ctx.bindScatterDotTips?.(host);
    const wellnessEmpty = host.querySelector("#ledgerWellnessEmptyHint");
    if (wellnessEmpty) {
      ctx.hydrateHairline?.(wellnessEmpty);
      wellnessEmpty.querySelector(".hairline-empty")?.classList.add("ll-empty");
      wellnessEmpty.querySelector("#ledgerWellnessEmptyToday")?.addEventListener("click", () => {
        ctx.switchView?.("today");
      });
      wellnessEmpty.querySelectorAll("[data-scatter-empty-target]").forEach(btn => {
        btn.addEventListener("click", () => {
          const view = btn.getAttribute("data-scatter-empty-target");
          if (view) ctx.switchView?.(view);
        });
      });
    }
    host.querySelectorAll("[data-ledger-day]").forEach(btn => {
      btn.addEventListener("click", () => {
        const day = btn.getAttribute("data-ledger-day");
        listDayFilter = listDayFilter === day ? "" : day;
        syncHeatSelection(host);
        refreshLedgerList(host, ledgerState(), ym);
        if (listDayFilter) {
          const reduced = root.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
          host.querySelector(".ledger-list-wrap")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
        }
      });
    });
    bindCategoryVizFilter(host, ym);
    bindLedgerPolishedEmpties(host, ym);
  }

  function bindCategoryVizFilter(host, ym) {
    host.querySelectorAll("[data-ledger-category]").forEach(el => {
      const activate = () => {
        const id = el.getAttribute("data-ledger-category");
        if (!id) return;
        listCategoryFilter = listCategoryFilter === id ? "" : id;
        syncCategorySelection(host);
        refreshLedgerList(host, ledgerState(), ym);
        if (listCategoryFilter) {
          const reduced = root.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
          host.querySelector(".ledger-list-wrap")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
        }
      };
      el.addEventListener("click", () => activate());
      el.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
    });
  }

  function bindLedgerPolishedEmpties(host, ym) {
    host.querySelectorAll(".ledger-list-empty, .ledger-budget-empty-wrap, .ledger-recurring-empty-wrap").forEach(el => {
      ctx.hydrateHairline?.(el);
      el.querySelector(".hairline-empty")?.classList.add("ll-empty");
    });
    host.querySelector("#ledgerListEmptyQuick")?.addEventListener("click", () => focusLedgerQuickEntry(host));
    host.querySelector("#ledgerListEmptyClearFilter")?.addEventListener("click", () => {
      listFilter = "";
      const filterInput = host.querySelector("#ledgerFilter");
      if (filterInput) filterInput.value = "";
      refreshLedgerList(host, ledgerState(), ym);
    });
    host.querySelector("#ledgerListEmptyClearCategory")?.addEventListener("click", () => {
      listCategoryFilter = "";
      syncCategorySelection(host);
      refreshLedgerList(host, ledgerState(), ym);
    });
    host.querySelector("#ledgerListEmptyClearAll")?.addEventListener("click", () => {
      clearAllListFilters(host, ym);
    });
    host.querySelector("[data-ledger-clear-all-filters]")?.addEventListener("click", () => {
      clearAllListFilters(host, ym);
    });
    host.querySelector("#ledgerBudgetEmptyAdd")?.addEventListener("click", () => {
      host.querySelector(".ledger-budget-add")?.click();
    });
    host.querySelector("#ledgerRecurringEmptyAdd")?.addEventListener("click", () => {
      host.querySelector(".ledger-recurring-add")?.click();
    });
  }

  function bindEdit(host) {
    host.querySelectorAll(".ledger-tx-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.closest(".ledger-tx")?.dataset.id;
        if (!id) return;
        const tx = ledgerState().transactions.find(t => t.id === id);
        if (!tx) return;
        openEditPopover(host, tx, ledgerState());
      });
    });
  }

  function bindRecurring(host, viewYm) {
    host.querySelector(".ledger-recurring-add")?.addEventListener("click", () => {
      openRecurringPopover(ledgerState(), null);
    });
    host.querySelectorAll(".ledger-recurring-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.closest(".ledger-recurring")?.dataset.recId;
        if (!id) return;
        const rec = ledgerState().recurring.find(r => r && r.id === id);
        if (!rec) return;
        openRecurringPopover(ledgerState(), rec);
      });
    });
    host.querySelectorAll(".ledger-recurring-del").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.closest(".ledger-recurring")?.dataset.recId;
        if (!id) return;
        const snap = core().removeRecurringTemplate(ledgerState(), id);
        if (!snap) return;
        commit(snap.ledger);
        ctx.toast?.(
          t("已删除固定项", "Recurring removed", "Vorlage entfernt"),
          {
            actionLabel: t("撤销", "Undo", "Rückgängig"),
            onAction: () => {
              const restored = core().restoreRecurringTemplate(ctx.state().ledger, snap.removed, snap.index);
              commit(restored);
              render();
            },
          },
        );
        render();
      });
    });
    host.querySelectorAll(".ledger-recurring-apply").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.rec;
        if (!id) return;
        const result = core().applyRecurringTemplate(ledgerState(), id, { lang: ctx.lang?.(), today: ctx.iso(new Date()) });
        if (!result) return;
        const hadNone = !ledgerState().transactions.length;
        commit(result.ledger);
        if (hadNone && ledgerState().transactions.length) dismissOnboarding(host);
        ctx.toast?.(t("已记一笔", "Entry posted", "Gebucht"));
        render();
      });
    });
    host.querySelector(".ledger-recurring-due-all")?.addEventListener("click", () => {
      const ym = viewYm || viewMonth || ymFromDate(ctx.iso(new Date()));
      const result = core().applyAllRecurringPending(ledgerState(), ym, { lang: ctx.lang?.(), today: ctx.iso(new Date()) });
      if (!result) return;
      const hadNone = !ledgerState().transactions.length;
      commit(result.ledger);
      if (hadNone && ledgerState().transactions.length) dismissOnboarding(host);
      const n = result.transactions.length;
      ctx.toast?.(
        n === 1
          ? t("已记 1 笔", "Posted 1 entry", "1 Buchung erfasst")
          : t(`已记 ${n} 笔`, `Posted ${n} entries`, `${n} Buchungen erfasst`),
      );
      render();
    });
  }

  function bindBudget(host, ym) {
    host.querySelector(".ledger-budget-add")?.addEventListener("click", () => {
      openBudgetPopover(ledgerState(), ym, null);
    });
    host.querySelectorAll(".ledger-budget-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.closest(".ledger-budget")?.dataset.budgetId;
        if (!id) return;
        const row = ledgerState().budgets.find(b => b && b.id === id);
        if (!row) return;
        openBudgetPopover(ledgerState(), ym, row);
      });
    });
    host.querySelectorAll(".ledger-budget-del").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.closest(".ledger-budget")?.dataset.budgetId;
        if (!id) return;
        const snap = core().removeCategoryBudget(ledgerState(), id);
        if (!snap) return;
        commit(snap.ledger);
        ctx.toast?.(
          t("已删除预算", "Budget removed", "Budget entfernt"),
          {
            actionLabel: t("撤销", "Undo", "Rückgängig"),
            onAction: () => {
              const restored = core().restoreCategoryBudget(ctx.state().ledger, snap.removed, snap.index);
              commit(restored);
              render();
            },
          },
        );
        render();
      });
    });
  }

  function bindSwipeDelete(host) {
    host.querySelectorAll(".ledger-tx").forEach(row => {
      let startX = 0;
      let startY = 0;
      row.addEventListener("touchstart", event => {
        startX = event.touches[0]?.clientX || 0;
        startY = event.touches[0]?.clientY || 0;
      }, { passive: true });
      row.addEventListener("touchend", event => {
        const endX = event.changedTouches[0]?.clientX || 0;
        const endY = event.changedTouches[0]?.clientY || 0;
        if (Math.abs(startY - endY) < 35 && startX - endX > 72) row.querySelector(".ledger-tx-del")?.click();
      }, { passive: true });
    });
  }

  function bindDuplicate(host) {
    host.querySelectorAll(".ledger-tx-dup").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.closest(".ledger-tx")?.dataset.id;
        if (!id) return;
        const result = core().duplicateTransaction(ledgerState(), id, { lang: ctx.lang?.(), today: ctx.iso(new Date()) });
        if (!result) return;
        lastHighlightTxId = result.transaction?.id || "";
        commit(result.ledger);
        ctx.toast?.(t("已复制一笔记录", "Entry duplicated", "Eintrag dupliziert"));
        render();
      });
    });
  }

  function pulseLedgerMonthMotion(host) {
    const summary = host.querySelector(".ledger-summary");
    const heading = host.querySelector(".ledger-header h2");
    root.LifeLedgerInteraction?.retarget?.(summary);
    if (heading) {
      heading.classList.remove("is-retargeting");
      void heading.offsetWidth;
      heading.classList.add("is-retargeting");
      root.setTimeout?.(() => heading.classList.remove("is-retargeting"), 520);
    }
  }

  function renderCategoryFilterChip(ledger) {
    if (!listCategoryFilter) return "";
    const cat = ledger.categories.find(c => c.id === listCategoryFilter);
    const name = cat ? core().localizedCategoryName(cat, ctx.lang?.()) : t("分类", "Category", "Kategorie");
    return `<button type="button" class="ledger-category-filter-chip" data-ledger-clear-category aria-label="${t(`清除 ${name} 筛选`, `Clear ${name} filter`, `Filter ${name} aufheben`)}"><span>${ctx.escape(name)}</span><span class="ledger-day-filter-x" aria-hidden="true">×</span></button>`;
  }

  function syncCategorySelection(host) {
    host.querySelectorAll("[data-ledger-category]").forEach(el => {
      const id = el.getAttribute("data-ledger-category");
      const on = id === listCategoryFilter;
      el.classList.toggle("is-selected", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function renderDayFilterChip(ym) {
    if (!listDayFilter || !listDayFilter.startsWith(`${ym}-`)) return "";
    const [y, m, d] = listDayFilter.split("-").map(Number);
    const locale = ctx.locale?.() || "de-DE";
    const label = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(y, m - 1, d));
    return `<button type="button" class="ledger-day-filter-chip" data-ledger-clear-day aria-label="${t(`清除 ${label} 筛选`, `Clear ${label} filter`, `Filter ${label} aufheben`)}"><span>${ctx.escape(label)}</span><span class="ledger-day-filter-x" aria-hidden="true">×</span></button>`;
  }

  function syncHeatSelection(host) {
    host.querySelectorAll("[data-ledger-day]").forEach(btn => {
      const on = btn.getAttribute("data-ledger-day") === listDayFilter;
      btn.classList.toggle("is-selected", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function refreshLedgerList(host, ledger, ym) {
    const list = host.querySelector(".ledger-list-wrap");
    if (!list) return;
    const h3 = list.querySelector("h3");
    list.innerHTML = `${h3 ? h3.outerHTML : ""}${renderDayFilterChip(ym)}${renderCategoryFilterChip(ledger)}${renderList(ledger, ym)}`;
    bindDelete(host, ledger);
    bindDuplicate(host);
    bindEdit(host);
    bindSwipeDelete(host);
    bindLedgerPolishedEmpties(host, ym);
    list.querySelector("[data-ledger-clear-day]")?.addEventListener("click", () => {
      listDayFilter = "";
      syncHeatSelection(host);
      refreshLedgerList(host, ledgerState(), ym);
    });
    list.querySelector("[data-ledger-clear-category]")?.addEventListener("click", () => {
      listCategoryFilter = "";
      syncCategorySelection(host);
      refreshLedgerList(host, ledgerState(), ym);
    });
    list.querySelector("[data-ledger-clear-all-filters]")?.addEventListener("click", () => {
      clearAllListFilters(host, ym);
    });
    const roll = root.LifeLedgerInteraction?.rollText;
    const netEl = list.querySelector(".ledger-list-filter-sum-net");
    if (roll && netEl) {
      const next = netEl.textContent || "";
      const prev = list.dataset.filterSumNet || "";
      if (prev && prev !== next) roll(netEl, next, prev);
      list.dataset.filterSumNet = next;
    }
  }

  function bindDelete(host, ledger) {
    host.querySelectorAll(".ledger-tx-del").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.closest(".ledger-tx")?.dataset.id;
        if (!id) return;
        const snap = core().removeTransaction(ledgerState(), id);
        if (!snap) return;
        commit(snap.ledger);
        ctx.toast?.(
          t("已删除一笔记录", "Entry removed", "Eintrag entfernt"),
          {
            actionLabel: t("撤销", "Undo", "Rückgängig"),
            onAction: () => {
              const restored = core().restoreTransaction(ctx.state().ledger, snap.removed, snap.index);
              commit(restored);
              render();
            },
          },
        );
        render();
      });
    });
  }

  function render() {
    const host = $("#ledgerView .ledger-page");
    if (!host || !ctx) return;
    destroyTrendPlot();
    const ledger = ledgerState();
    if (!viewMonth) viewMonth = ymFromDate(ctx.iso(new Date()));
    const ym = viewMonth;
    if (listDayFilter && !listDayFilter.startsWith(`${ym}-`)) listDayFilter = "";
    const summary = core().monthSummary(ledger, ym);
    const breakdown = core().categoryBreakdown(ledger, ym, "expense");
    const cur = ledger.settings.defaultCurrency;
    const secCur = ledger.settings.secondaryCurrency || "CNY";
    const fxHint = summary.otherCurrencyCount > 0
      ? `<p class="ledger-fx-hint">${t(
        `另有 ${summary.otherCurrencyCount} 笔 ${secCur} 未计入上方汇总`,
        `${summary.otherCurrencyCount} ${secCur} ${summary.otherCurrencyCount === 1 ? "entry" : "entries"} not in totals above`,
        `${summary.otherCurrencyCount} ${secCur}-Buchungen nicht in der Summe oben`,
      )}</p>`
      : "";

    host.innerHTML = `
      <header class="ledger-header">
        <div>
          <span class="kicker">${t("记账", "Money", "Geld")}</span>
          <h2>${ctx.escape(monthLabel(ym))}</h2>
        </div>
        <div class="ledger-month-nav" title="${t("← → 切换月份，/ 搜索，N 快速录入", "← → change month, / search, N quick entry", "← → Monat, / Suche, N Schnellerfassung")}">
          <button type="button" class="icon-button" data-ledger-prev aria-label="${t("上个月", "Previous month", "Vorheriger Monat")}">‹</button>
          <button type="button" class="icon-button" data-ledger-next aria-label="${t("下个月", "Next month", "Nächster Monat")}">›</button>
        </div>
      </header>
      <div class="ledger-summary">
        <article><small>${t("收入", "Income", "Einnahmen")}</small><strong data-ledger-sum="income">${ctx.escape(core().formatMoney(summary.incomeMinor, cur, ctx.locale?.()))}</strong></article>
        <article><small>${t("支出", "Spending", "Ausgaben")}</small><strong class="is-expense" data-ledger-sum="expense">${ctx.escape(core().formatMoney(summary.expenseMinor, cur, ctx.locale?.()))}</strong></article>
        <article><small>${t("结余", "Net", "Saldo")}</small><strong data-ledger-sum="net">${ctx.escape(core().formatMoney(summary.netMinor, cur, ctx.locale?.()))}</strong></article>
      </div>
      ${fxHint}
      <form class="ledger-quick" id="ledgerQuickForm">
        <div class="ledger-quick-label">
          <span>${t("快速录入", "Quick entry", "Schnellerfassung")}</span>
          <input name="quick" id="ledgerQuickInput" type="text" enterkeyhint="done" autocomplete="off" placeholder="${t("12,50 咖啡 · -45 Miete gestern", "12.50 coffee · -45 rent yesterday", "12,50 Kaffee · -45 Miete gestern")}" />
        </div>
        <button type="submit" class="primary-button">${t("添加", "Add", "Hinzufügen")}</button>
      </form>
      ${renderKeypad()}
      <div class="ledger-chips">${renderChips(ledger)}</div>
      ${renderRecurringPendingBanner(ledger, ym)}
      ${renderOnboarding(ledger)}
      <div class="ledger-toolbar">
        <input type="search" id="ledgerFilter" class="ledger-filter" value="${ctx.escape(listFilter)}" placeholder="${t("搜索交易…", "Search entries…", "Buchungen suchen…")}" />
        <button type="button" class="secondary-button" data-ledger-import>${t("导入 CSV", "Import CSV", "CSV importieren")}</button>
        <button type="button" class="secondary-button" data-ledger-export>${t("导出 CSV", "Export CSV", "CSV exportieren")}</button>
        <input type="file" id="ledgerCsvFile" accept=".csv,text/csv" hidden />
      </div>
      <div class="ledger-panels ledger-panels--wide">
        <section class="ledger-panel ledger-panel--categories">
          <div class="ledger-panel-head">
            <h3>${t("分类", "Categories", "Kategorien")}</h3>
            <div class="ledger-chart-toggle" role="group" aria-label="${t("图表样式", "Chart style", "Diagramm")}">
              <button type="button" class="ledger-chart-mode${categoryChartMode === "donut" ? " is-active" : ""}" data-chart-mode="donut" aria-pressed="${categoryChartMode === "donut"}">${t("圆环", "Donut", "Ring")}</button>
              <button type="button" class="ledger-chart-mode${categoryChartMode === "treemap" ? " is-active" : ""}" data-chart-mode="treemap" aria-pressed="${categoryChartMode === "treemap"}">${t("树图", "Treemap", "Baum")}</button>
            </div>
          </div>
          ${renderCategoryViz(breakdown, ledger)}
        </section>
        <section class="ledger-panel">
          <h3>${t("支出趋势", "Spending trend", "Ausgabentrend")}</h3>
          <div class="ledger-trend" id="ledgerTrendPlot"></div>
        </section>
        <section class="ledger-panel ledger-panel--heat">
          <h3>${t("每日支出", "Daily spend", "Tägliche Ausgaben")}</h3>
          ${renderHeatmap(ledger, ym)}
        </section>
      </div>
      ${renderWellnessInsights(ledger, ym)}
      <section class="ledger-budget-wrap">
        <div class="ledger-budget-head">
          <h3>${t("预算进度", "Budget progress", "Budgetfortschritt")}</h3>
          <button type="button" class="secondary-button ledger-budget-add">${t("设置预算", "Set budget", "Budget setzen")}</button>
        </div>
        ${renderBudgets(ledger, ym)}
      </section>
      <section class="ledger-recurring-wrap">
        <h3>${t("固定收支", "Recurring", "Wiederkehrend")}</h3>
        ${renderRecurring(ledger)}
      </section>
      <section class="ledger-list-wrap">
        <h3>${t("交易", "Transactions", "Buchungen")}</h3>
        ${renderDayFilterChip(ym)}
        ${renderCategoryFilterChip(ledger)}
        ${renderList(ledger, ym)}
      </section>`;
    host.querySelector("[data-ledger-hint-dismiss]")?.addEventListener("click", () => dismissOnboarding(host));
    mountOnboardingArt(host);
    bindInteractions(host, ledger, ym);
    requestAnimationFrame(() => renderTrend($("#ledgerTrendPlot"), ledger, ym));
    requestAnimationFrame(() => {
      const viz = host.querySelector(".ledger-category-viz");
      if (viz && !viz.classList.contains("is-ready")) viz.classList.add("is-ready");
      const budgetList = host.querySelector(".ledger-budget-list.is-retargeting");
      root.LifeLedgerReviewBars?.animateLedgerBudgetFills(budgetList);
      root.LifeLedgerInteraction?.retarget?.(budgetList);
      root.LifeLedgerInteraction?.retarget?.(host.querySelector(".ledger-heat-grid.is-retargeting"));
      root.LifeLedgerInteraction?.retarget?.(host.querySelector(".ledger-donut-segments.is-retargeting"));
      root.LifeLedgerInteraction?.retarget?.(host.querySelector(".ledger-treemap.is-retargeting"));
      root.LifeLedgerInteraction?.retarget?.(host.querySelector(".ledger-wellness-grid.is-retargeting"));
    });
    if (lastHighlightTxId) {
      const hi = lastHighlightTxId;
      setTimeout(() => {
        if (lastHighlightTxId === hi) lastHighlightTxId = "";
      }, 720);
    }
    const roll = root.LifeLedgerInteraction?.rollText;
    if (roll) {
      ["income", "expense", "net"].forEach(key => {
        const el = host.querySelector(`[data-ledger-sum="${key}"]`);
        const next = el?.textContent || "";
        const prev = lastSummaryDisplay[key] || "";
        if (el && next !== prev) roll(el, next, prev);
        lastSummaryDisplay[key] = next;
      });
    }
    if (ledgerMonthPulse) {
      ledgerMonthPulse = false;
      pulseLedgerMonthMotion(host);
    }
    if (pendingListFocus) {
      pendingListFocus = false;
      const wrap = host.querySelector(".ledger-list-wrap");
      if (wrap) {
        wrap.classList.add("is-spotlight");
        const reduced = document.documentElement.classList.contains("motion-reduced")
          || matchMedia("(prefers-reduced-motion: reduce)").matches;
        requestAnimationFrame(() => {
          wrap.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
          setTimeout(() => wrap.classList.remove("is-spotlight"), reduced ? 0 : 1100);
        });
      }
    }
  }

  function openToDay(isoDate, options = {}) {
    if (typeof isoDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return;
    viewMonth = isoDate.slice(0, 7);
    listDayFilter = isoDate;
    listCategoryFilter = "";
    listFilter = "";
    pendingListFocus = options.scrollToList !== false;
    if (ctx) render();
  }

  function openToMonth(ym, options = {}) {
    if (typeof ym !== "string" || !/^\d{4}-\d{2}$/.test(ym)) return;
    viewMonth = ym;
    listDayFilter = "";
    listCategoryFilter = "";
    listFilter = "";
    pendingListFocus = options.scrollToList === true;
    ledgerMonthPulse = options.pulseMonth !== false;
    if (ctx) render();
  }

  root.LifeLedgerLedgerUI = {
    render(options) {
      ctx = options;
      bindLedgerShortcuts();
      if (!viewMonth) viewMonth = ymFromDate(options.iso(new Date()));
      render();
    },
    setViewMonth(ym) {
      if (typeof ym === "string" && /^\d{4}-\d{2}$/.test(ym)) viewMonth = ym;
    },
    openToDay,
    openToMonth,
  };
})(typeof window !== "undefined" ? window : global);
