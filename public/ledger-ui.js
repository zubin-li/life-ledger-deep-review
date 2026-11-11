(function (root) {
  const core = () => root.LifeLedgerLedger;
  let ctx = null;
  let viewMonth = "";
  let ledgerMonthPulse = false;
  let listFilter = "";
  let listDayFilter = "";
  let pendingListFocus = false;
  let listCategoryFilter = "";
  let viewDay = "";
  let statsScope = "month";
  let ledgerMenuOpen = false;
  let lastSummaryDisplay = { income: "", expense: "", net: "" };
  let lastHighlightTxId = "";
  let popoverEscapeHandler = null;
  let ledgerShortcutBound = false;
  let ledgerCsvDropBound = false;
  let ledgerImportPulse = false;
  let ledgerStatsScopePulse = false;

  function pulseLedgerCategoryChip(chip) {
    root.LifeLedgerInteraction?.pressBump?.(chip, "is-chip-press");
  }

  function pulseLedgerHeatDay(cell) {
    root.LifeLedgerInteraction?.pressBump?.(cell, "is-heat-press");
  }

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
        event.preventDefault();
        ledgerMenuOpen = true;
        render();
        root.requestAnimationFrame?.(() => {
          const filter = $("#ledgerFilter");
          filter?.focus();
          filter?.select?.();
        });
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
      const today = ctx?.iso(new Date()) || "";
      if (!viewDay) viewDay = today;
      event.preventDefault();
      const next = shiftDay(viewDay, event.key === "ArrowLeft" ? -1 : 1);
      if (next > today) return;
      viewDay = next;
      viewMonth = viewDay.slice(0, 7);
      listDayFilter = "";
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

  function dayLabel(iso) {
    if (!iso || iso.length < 10) return iso;
    const [y, m, d] = iso.split("-").map(Number);
    const locale = ctx.locale?.() || "de-DE";
    return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", weekday: "short" }).format(new Date(y, m - 1, d));
  }

  function shiftDay(iso, delta) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return iso;
    const d = new Date(`${iso}T12:00:00`);
    d.setDate(d.getDate() + delta);
    return ctx.iso(d);
  }

  function formatStatsCompareCaption(ledger, cmp) {
    const cur = ledger.settings.defaultCurrency;
    const locale = ctx.locale?.() || "de-DE";
    if (core().preferSpendCompareAmountCaption?.(cmp)) {
      return core().formatMoney(Math.abs(cmp.deltaMinor), cur, locale);
    }
    const pct = core().displaySpendDeltaPercent?.(cmp.deltaPercent, cmp.direction);
    if (pct == null) {
      if (Math.abs(Number(cmp.deltaMinor)) > 0) {
        return core().formatMoney(Math.abs(cmp.deltaMinor), cur, locale);
      }
      return null;
    }
    return `${pct}%`;
  }

  function renderStatsCompareLine(ledger, scope, anchorIso) {
    const today = ctx.iso(new Date());
    if (scope === "week") {
      const { start, end } = core().weekRangeMondayLocal(anchorIso, today);
      const cmp = core().alignedWeekSpendCompare(ledger, start, end);
      if (!cmp || cmp.direction === "none") return "";
      const caption = formatStatsCompareCaption(ledger, cmp);
      if (cmp.direction === "up") {
        if (!caption) return t("较上周同期新增支出", "New spending vs last week", "Neue Ausgaben gg. Vorwoche");
        return t(`较上周同期 +${caption}`, `+${caption} vs same days last week`, `+${caption} gg. Vorwoche`);
      }
      if (cmp.direction === "down") {
        if (!caption) return t("较上周同期减少支出", "Less spending vs last week", "Weniger Ausgaben gg. Vorwoche");
        return t(`较上周同期 −${caption}`, `−${caption} vs same days last week`, `−${caption} gg. Vorwoche`);
      }
      return t("与上周同期相近", "About the same as last week", "Wie in der Vorwoche");
    }
    const ym = anchorIso.slice(0, 7);
    const cmp = core().alignedMonthSpendCompare(ledger, ym, anchorIso);
    if (!cmp || cmp.direction === "none") return "";
    const caption = formatStatsCompareCaption(ledger, cmp);
    if (cmp.direction === "up") {
      if (!caption) return t("较上月同期新增支出", "New spending vs last month", "Neue Ausgaben gg. Vormonat");
      return t(`较上月同期 +${caption}`, `+${caption} vs same days last month`, `+${caption} gg. Vormonat`);
    }
    if (cmp.direction === "down") {
      if (!caption) return t("较上月同期减少支出", "Less spending vs last month", "Weniger Ausgaben gg. Vormonat");
      return t(`较上月同期 −${caption}`, `−${caption} vs same days last month`, `−${caption} gg. Vormonat`);
    }
    return t("与上月同期相近", "About the same as last month", "Wie im Vormonat");
  }

  function renderStatsPanel(ledger, anchorIso) {
    const today = ctx.iso(new Date());
    const cur = ledger.settings.defaultCurrency;
    const locale = ctx.locale?.() || "de-DE";
    let rangeStart;
    let rangeEnd;
    if (statsScope === "week") {
      ({ start: rangeStart, end: rangeEnd } = core().weekRangeMondayLocal(anchorIso, today));
    } else {
      rangeStart = `${anchorIso.slice(0, 7)}-01`;
      rangeEnd = anchorIso.slice(0, 7) === today.slice(0, 7) ? today : `${anchorIso.slice(0, 7)}-31`;
    }
    const summary = core().rangeSummary(ledger, rangeStart, rangeEnd);
    const breakdown = statsScope === "week"
      ? core().categoryBreakdownRange(ledger, rangeStart, rangeEnd, "expense")
      : core().categoryBreakdown(ledger, anchorIso.slice(0, 7), "expense");
    const compare = renderStatsCompareLine(ledger, statsScope, anchorIso);
    const scopeToggle = `<div class="ledger-stats-scope" data-segment role="group" aria-label="${t("统计范围", "Stats range", "Statistikzeitraum")}">
      <button type="button" class="ledger-stats-scope-btn${statsScope === "week" ? " is-active" : ""}" data-ledger-stats="week" aria-pressed="${statsScope === "week"}">${t("周", "Week", "Woche")}</button>
      <button type="button" class="ledger-stats-scope-btn${statsScope === "month" ? " is-active" : ""}" data-ledger-stats="month" aria-pressed="${statsScope === "month"}">${t("月", "Month", "Monat")}</button>
    </div>`;
    const dailyStrip = statsScope === "month"
      ? `<div class="ledger-daily-strip">${renderHeatmap(ledger, anchorIso.slice(0, 7))}</div>`
      : "";
    const subTotal = statsScope === "month"
      ? (ledger.recurring || [])
        .filter(r => r && r.cadence !== "weekly" && r.amountMinor < 0 && (r.currency || cur) === cur)
        .reduce((sum, r) => sum + (Number.isInteger(r.amountMinor) ? Math.abs(r.amountMinor) : 0), 0)
      : 0;
    const subLine = subTotal
      ? `<p class="ledger-sub-total">${t(`每月订阅合计 ${core().formatMoney(-subTotal, cur, locale)}`, `Subscriptions ${core().formatMoney(-subTotal, cur, locale)}/mo`, `Abos ${core().formatMoney(-subTotal, cur, locale)}/Monat`)}</p>`
      : "";
    return `<section class="ledger-panel ledger-panel--stats panel">
      <div class="ledger-panel-head">${scopeToggle}</div>
      <div class="ledger-stats-anim">
        <div class="ledger-summary ledger-summary--compact">
          <article><small>${t("收入", "Income", "Einnahmen")}</small><strong data-ledger-sum="income">${ctx.escape(core().formatMoney(summary.incomeMinor, cur, locale))}</strong></article>
          <article><small>${t("支出", "Spending", "Ausgaben")}</small><strong class="is-expense" data-ledger-sum="expense">${ctx.escape(core().formatMoney(summary.expenseMinor, cur, locale))}</strong></article>
          <article><small>${t("结余", "Net", "Saldo")}</small><strong data-ledger-sum="net">${ctx.escape(core().formatMoney(summary.netMinor, cur, locale))}</strong></article>
        </div>
        ${compare ? `<p class="ledger-stats-compare">${ctx.escape(compare)}</p>` : ""}
        ${subLine}
        <div class="ledger-panel-head"><h3>${t("分类", "Categories", "Kategorien")}</h3></div>
        ${renderCategoryViz(breakdown, ledger)}
        ${dailyStrip}
      </div>
    </section>`;
  }

  function renderSubscriptionList(ledger) {
    const rows = (ledger.recurring || []).filter(r => r && r.cadence !== "weekly");
    if (!rows.length) {
      const empty = ledgerPolishedEmpty(
        "ledger-subscriptions-empty",
        "./assets/hairline/ledger-subscriptions-empty.svg",
        t("暂无订阅", "No subscriptions yet", "Noch keine Abos"),
        t("在 ⋯ 菜单添加固定收支，每月自动记一笔。", "Add recurring in ⋯ — posted once each month.", "Unter ⋯ Wiederkehrend — monatlich automatisch."),
        `<button type="button" class="secondary-button ledger-recurring-add">${t("添加订阅", "Add subscription", "Abo hinzufügen")}</button>`,
      );
      return `<section class="ledger-subscriptions panel"><h3>${t("每月订阅", "Subscriptions", "Abos")}</h3>${empty}</section>`;
    }
    return `<section class="ledger-subscriptions panel"><h3>${t("每月订阅", "Subscriptions", "Abos")}</h3><ul class="ledger-sub-list">${rows.map(rec => {
      const cat = ledger.categories.find(c => c.id === rec.categoryId);
      const catName = cat ? core().localizedCategoryName(cat, ctx.lang?.()) : "";
      const label = rec.label || rec.note || catName;
      const dom = Number(rec.dayOfMonth) || 1;
      return `<li class="ledger-sub-row"><span class="ledger-sub-name">${ctx.escape(label)}</span><span class="ledger-sub-meta">${t("每月", "Monthly", "Monatlich")} ${dom} · ${ctx.escape(catName)}</span><span class="ledger-sub-amt">${ctx.escape(core().formatMoney(rec.amountMinor, rec.currency || ledger.settings.defaultCurrency, ctx.locale?.()))}</span></li>`;
    }).join("")}</ul></section>`;
  }

  function renderLedgerMoreMenu(ledger, ym) {
    return `<div class="ledger-more-wrap">
      <button type="button" class="icon-button ledger-more-toggle" data-ledger-more-toggle aria-expanded="${ledgerMenuOpen ? "true" : "false"}" aria-haspopup="true" title="${t("更多", "More", "Mehr")}">⋯</button>
      ${ledgerMenuOpen ? `<div class="ledger-more-menu is-open" role="menu">
        <label class="ledger-more-search"><span class="sr-only">${t("搜索", "Search", "Suche")}</span><input type="search" id="ledgerFilter" class="ledger-filter" value="${ctx.escape(listFilter)}" placeholder="${t("搜索交易…", "Search entries…", "Buchungen suchen…")}" /></label>
        <button type="button" class="secondary-button" data-ledger-import role="menuitem">${t("导入 CSV", "Import CSV", "CSV importieren")}</button>
        <button type="button" class="secondary-button" data-ledger-export role="menuitem">${t("导出 CSV", "Export CSV", "CSV exportieren")}</button>
        <button type="button" class="secondary-button ledger-budget-add" role="menuitem">${t("预算", "Budgets", "Budgets")}</button>
        <button type="button" class="secondary-button ledger-recurring-add" role="menuitem">${t("固定收支", "Recurring", "Wiederkehrend")}</button>
        <p class="ledger-kbd-hints ledger-kbd-hints--menu" aria-hidden="true"><kbd>M</kbd> · <kbd>N</kbd> · <kbd>/</kbd> · <kbd>←</kbd><kbd>→</kbd></p>
      </div>` : ""}
      <input type="file" id="ledgerCsvFile" accept=".csv,text/csv" hidden />
    </div>`;
  }

  function accentFill(colorName) {
    const key = (colorName || "sage").replace(/[^a-z0-9-]/gi, "") || "sage";
    const root = document.documentElement;
    const picked = getComputedStyle(root).getPropertyValue(`--accent-${key}`).trim();
    if (picked) return picked;
    return getComputedStyle(root).getPropertyValue("--accent-sage").trim() || "#3a8f7a";
  }

  function renderIconMarkup(iconKey) {
    const render = typeof root.renderIcon === "function"
      ? root.renderIcon
      : (typeof globalThis.renderIcon === "function" ? globalThis.renderIcon : null);
    if (!render) return ctx.escape(String(iconKey || "more").slice(0, 1).toUpperCase());
    return render(iconKey || "more", "ledger-cat-icon-svg");
  }

  function renderCategoryIcon(cat) {
    const fill = accentFill(cat?.color);
    return `<span class="ledger-tx-cat" style="--accent:${ctx.escape(fill)}" aria-hidden="true">${renderIconMarkup(cat?.icon || "more")}</span>`;
  }

  function categorySegAttrs(categoryId, label, styleExtra) {
    const selected = listCategoryFilter === categoryId ? " is-selected" : "";
    const pressed = listCategoryFilter === categoryId ? "true" : "false";
    const aria = t(`筛选「${label}」交易`, `Filter “${label}” entries`, `Buchungen „${label}“ filtern`);
    return `class="ledger-cat-seg${selected}" data-ledger-category="${ctx.escape(categoryId)}" tabindex="0" role="button" aria-label="${ctx.escape(aria)}" aria-pressed="${pressed}"${styleExtra ? ` style="${styleExtra}"` : ""}`;
  }

  function renderCategoryViz(breakdown, ledger) {
    const body = renderDonut(breakdown, ledger);
    const empty = body.includes("ledger-donut--empty");
    const skel = empty ? "" : `<div class="ledger-skeleton ledger-skeleton--donut" aria-hidden="true"></div>`;
    const legend = empty ? "" : renderDonutLegend(breakdown, ledger);
    return `<div class="ledger-category-viz${empty ? " is-ready" : ""}"><div class="ledger-category-viz-row">${skel}${body}${legend}</div></div>`;
  }

  function renderDonutLegend(breakdown, ledger) {
    const total = breakdown.reduce((s, row) => s + row.amountMinor, 0);
    if (!total) return "";
    const locale = ctx.locale?.() || "de-DE";
    const cur = ledger.settings.defaultCurrency;
    const top = breakdown.slice(0, 5);
    const rest = breakdown.slice(5);
    const restSum = rest.reduce((s, row) => s + row.amountMinor, 0);
    const rows = top.map(row => {
      const cat = ledger.categories.find(c => c.id === row.categoryId);
      const name = cat ? core().localizedCategoryName(cat, ctx.lang?.()) : "";
      const fill = accentFill(cat?.color);
      const pct = Math.round((row.amountMinor / total) * 100);
      const amt = core().formatMoney(-row.amountMinor, cur, locale);
      return `<li class="ledger-donut-legend-row"><span class="ledger-donut-legend-dot" style="background:${ctx.escape(fill)}"></span><span class="ledger-donut-legend-name">${ctx.escape(name)}</span><span class="ledger-donut-legend-amt">${ctx.escape(amt)}</span><span class="ledger-donut-legend-pct">${pct}%</span></li>`;
    });
    if (restSum > 0) {
      const pct = Math.round((restSum / total) * 100);
      const amt = core().formatMoney(-restSum, cur, locale);
      const other = t("其他", "Other", "Sonstiges");
      rows.push(`<li class="ledger-donut-legend-row ledger-donut-legend-row--other"><span class="ledger-donut-legend-dot ledger-donut-legend-dot--other"></span><span class="ledger-donut-legend-name">${ctx.escape(other)}</span><span class="ledger-donut-legend-amt">${ctx.escape(amt)}</span><span class="ledger-donut-legend-pct">${pct}%</span></li>`);
    }
    return `<ol class="ledger-donut-legend">${rows.join("")}</ol>`;
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
      cells += `<button type="button" class="ledger-heat ledger-heat-${level}${selected}" style="--heat-i:${day - 1}" data-ledger-day="${ctx.escape(iso)}" title="${ctx.escape(spendLabel)}" aria-label="${ctx.escape(aria)}" aria-pressed="${listDayFilter === iso ? "true" : "false"}"></button>`;
    }
    return `<div class="ledger-heat-grid is-retargeting">${cells}</div>`;
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

  function expenseCategoryOptions(ledger, selectedId) {
    return ledger.categories.filter(c => c.kind === "expense" && !c.archived && !c.isGroup).map(c => {
      const name = core().localizedCategoryName(c, ctx.lang?.());
      const sel = c.id === selectedId ? " selected" : "";
      return `<option value="${ctx.escape(c.id)}"${sel}>${ctx.escape(name)}</option>`;
    }).join("");
  }

  function openBudgetPopover(ledger, ym, existing) {
    closeLedgerPopovers();
    const expenseCat = ledger.categories.find(c => c.kind === "expense" && !c.archived && !c.isGroup);
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
    return `${renderListFilterSummary(ledger, rows)}<ul class="ledger-tx-list ledger-tx-list--grouped">${(() => {
      const byDay = new Map();
      rows.forEach(tx => {
        if (!byDay.has(tx.date)) byDay.set(tx.date, []);
        byDay.get(tx.date).push(tx);
      });
      const days = [...byDay.keys()].sort((a, b) => b.localeCompare(a));
      const focusDay = listDayFilter || viewDay || ctx.iso(new Date());
      let out = "";
      days.forEach(day => {
        const txs = byDay.get(day);
        const expanded = !listDayFilter && !listFilter && !listCategoryFilter
          ? day === focusDay
          : true;
        const sum = core().summarizeTransactions(ledger, txs);
        const cur = ledger.settings.defaultCurrency;
        const locale = ctx.locale?.() || "de-DE";
        const total = core().formatMoney(sum.netMinor, cur, locale);
        out += `<li class="ledger-day-group${expanded ? " is-expanded" : " is-collapsed"}" data-ledger-day-group="${ctx.escape(day)}">
          <button type="button" class="ledger-day-head" data-ledger-expand-day="${ctx.escape(day)}" aria-expanded="${expanded ? "true" : "false"}">
            <span>${ctx.escape(dayLabel(day))}</span><span class="ledger-day-total">${ctx.escape(total)}</span>
          </button>`;
        if (expanded) {
          out += `<ul class="ledger-day-rows">${txs.map(tx => {
            const cat = ledger.categories.find(c => c.id === tx.categoryId);
            const name = cat ? core().localizedCategoryName(cat, ctx.lang?.()) : "";
            const enter = tx.id === lastHighlightTxId ? " is-enter" : "";
            return `<li class="ledger-tx ledger-tx--slim${enter}" data-id="${ctx.escape(tx.id)}">
              ${renderCategoryIcon(cat)}
              <span class="ledger-tx-note">${ctx.escape(tx.note || name)}</span>
              <button type="button" class="ledger-tx-cat-chip" data-ledger-tx-cat="${ctx.escape(tx.categoryId)}" aria-label="${t("分类", "Category", "Kategorie")}">${ctx.escape(name)}</button>
              <span class="ledger-tx-amt ${tx.amountMinor < 0 ? "is-expense" : "is-income"}">${ctx.escape(core().formatMoney(tx.amountMinor, tx.currency, locale))}</span>
              <span class="ledger-tx-actions">
                <button type="button" class="icon-button ledger-tx-edit" aria-label="${t("编辑", "Edit", "Bearbeiten")}">✎</button>
                <button type="button" class="icon-button ledger-tx-del" aria-label="${t("删除", "Delete", "Löschen")}">×</button>
              </span>
            </li>`;
          }).join("")}</ul>`;
        }
        out += "</li>";
      });
      return out;
    })()}</ul>`;
  }

  function renderRecurringPendingBanner(ledger, ym) {
    const currentYm = ymFromDate(ctx.iso(new Date()));
    if (ym !== currentYm) return "";
    const pending = core().recurringPendingForMonth(ledger, ym, { lang: ctx.lang?.() }).filter(rec => rec.cadence === "weekly");
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

  function formatImportPreviewDate(isoDate) {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate || "";
    const locale = ctx.locale?.() || "de-DE";
    const [y, m, d] = isoDate.split("-").map(Number);
    return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(y, m - 1, d));
  }

  function renderCsvImportPreview(preview) {
    const samples = preview.samples || [];
    if (!samples.length) return "";
    const locale = ctx.locale?.() || "de-DE";
    const rows = samples.map(row => {
      const note = row.note ? String(row.note).slice(0, 48) : t("（无备注）", "(no memo)", "(ohne Verwendungszweck)");
      const amt = core().formatMoney(row.amountMinor, row.currency, locale);
      return `<tr>
        <td>${ctx.escape(formatImportPreviewDate(row.date))}</td>
        <td>${ctx.escape(note)}</td>
        <td class="ledger-import-preview-amt ${row.amountMinor < 0 ? "is-expense" : "is-income"}">${ctx.escape(amt)}</td>
      </tr>`;
    }).join("");
    const more = preview.importable > samples.length
      ? `<p class="ledger-import-preview-more">${ctx.escape(t(
        `还有 ${preview.importable - samples.length} 笔未列出`,
        `+ ${preview.importable - samples.length} more not shown`,
        `+ ${preview.importable - samples.length} weitere nicht angezeigt`,
      ))}</p>`
      : "";
    const tableLabel = t("预览将导入的交易", "Preview of entries to import", "Vorschau der Buchungen");
    return `<div class="ledger-import-preview-wrap">
      <table class="ledger-import-preview" aria-label="${ctx.escape(tableLabel)}">
        <thead><tr>
          <th scope="col">${t("日期", "Date", "Datum")}</th>
          <th scope="col">${t("备注", "Memo", "Verwendungszweck")}</th>
          <th scope="col">${t("金额", "Amount", "Betrag")}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>${more}
    </div>`;
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
        ${renderCsvImportPreview(preview)}
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

  function isLikelyCsvFile(file) {
    if (!file) return false;
    const name = String(file.name || "").toLowerCase();
    if (name.endsWith(".csv")) return true;
    const type = String(file.type || "").toLowerCase();
    return type === "text/csv" || type === "application/vnd.ms-excel" || type === "";
  }

  function processGermanBankCsvText(text, fileInput) {
    const preview = core().previewGermanBankCsv(text, ledgerState(), { lang: ctx.lang?.() });
    if (!preview.importable) {
      ctx.toast?.(
        preview.skipped
          ? t(`未导入：${preview.skipped} 行无法识别`, `Nothing imported (${preview.skipped} rows skipped)`, `Keine Buchungen (${preview.skipped} Zeilen übersprungen)`)
          : t("文件为空", "File is empty", "Datei ist leer"),
      );
      if (fileInput) fileInput.value = "";
      return;
    }
    openCsvImportConfirm(
      preview,
      () => {
        const result = core().importGermanBankCsv(text, ledgerState(), { lang: ctx.lang?.() });
        const hadNone = !ledgerState().transactions.length;
        commit(result.ledger);
        if (hadNone && ledgerState().transactions.length) {
          const host = $("#ledgerView .ledger-page");
          if (host) dismissOnboarding(host);
        }
        const skippedTail = result.skipped
          ? t(`（跳过 ${result.skipped} 行）`, ` (${result.skipped} skipped)`, ` (${result.skipped} übersprungen)`)
          : "";
        ctx.toast?.(
          t(`已导入 ${result.imported} 笔${skippedTail}`, `Imported ${result.imported} entries${skippedTail}`, `${result.imported} Buchungen importiert${skippedTail}`),
        );
        if (fileInput) fileInput.value = "";
        ledgerImportPulse = true;
        render();
      },
      () => {
        if (fileInput) fileInput.value = "";
      },
    );
  }

  function readLedgerCsvFile(file, fileInput) {
    if (!isLikelyCsvFile(file)) {
      ctx.toast?.(t("请使用 .csv 银行导出文件", "Use a .csv bank export file", "Bitte eine .csv-Bankdatei verwenden"));
      if (fileInput) fileInput.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => processGermanBankCsvText(String(reader.result || ""), fileInput);
    reader.readAsText(file);
  }

  function bindLedgerCsvDrop() {
    if (ledgerCsvDropBound) return;
    const view = document.getElementById("ledgerView");
    if (!view) return;
    ledgerCsvDropBound = true;
    let dragDepth = 0;
    const hasFileDrag = event => {
      const types = event.dataTransfer?.types;
      if (!types) return false;
      return [...types].includes("Files");
    };
    const showDrop = () => view.classList.add("is-csv-drag");
    const hideDrop = () => {
      dragDepth = 0;
      view.classList.remove("is-csv-drag");
    };
    view.addEventListener("dragenter", event => {
      if (document.body.dataset.activeView !== "ledger") return;
      if (!hasFileDrag(event)) return;
      event.preventDefault();
      dragDepth += 1;
      showDrop();
    });
    view.addEventListener("dragover", event => {
      if (document.body.dataset.activeView !== "ledger") return;
      if (!hasFileDrag(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    });
    view.addEventListener("dragleave", event => {
      if (document.body.dataset.activeView !== "ledger") return;
      if (!hasFileDrag(event)) return;
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) hideDrop();
    });
    view.addEventListener("drop", event => {
      if (document.body.dataset.activeView !== "ledger") return;
      event.preventDefault();
      hideDrop();
      const file = event.dataTransfer?.files?.[0];
      if (!file) return;
      readLedgerCsvFile(file, document.getElementById("ledgerCsvFile"));
    });
  }

  function closeEditPopover() {
    closeLedgerPopovers();
  }

  function allCategoryOptions(ledger, selectedId) {
    return recurringCategoryOptions(ledger, selectedId);
  }

  function recurringCategoryOptions(ledger, selectedId) {
    const renderGroup = (kind, labelZh, labelEn, labelDe) => {
      const cats = ledger.categories.filter(c => c.kind === kind && !c.archived && !c.isGroup);
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
      categoryId: ledger.categories.find(c => c.kind === "expense" && !c.archived && !c.isGroup)?.id
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
        <label class="ledger-edit-field"><span>${t("分类", "Category", "Kategorie")}</span><select name="category">${allCategoryOptions(ledger, tx.categoryId)}</select></label>
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
      const categoryId = form.querySelector('[name="category"]')?.value || tx.categoryId;
      const catNext = ledger.categories.find(c => c.id === categoryId) || cat;
      let amountMinor = catNext?.kind === "income" ? Math.abs(token) : -Math.abs(token);
      const date = form.querySelector('[name="date"]').value || tx.date;
      const note = form.querySelector('[name="note"]').value || "";
      const result = core().updateTransaction(ledgerState(), tx.id, { amountMinor, date, note, categoryId }, { lang: ctx.lang?.() });
      if (!result) return;
      let nextLedger = result.ledger;
      if (categoryId !== tx.categoryId && note) {
        nextLedger = core().rememberCategoryHint(nextLedger, note, categoryId);
      }
      commit(nextLedger);
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

  function sampleQuickEntryLine() {
    const code = String(ctx.lang?.() || "en").slice(0, 2);
    if (code === "zh") return "-3,50 餐饮";
    if (code === "de") return "-3,50 Kaffee";
    return "-3.50 coffee";
  }

  function postSampleEntry(host, ledger) {
    const parsed = core().parseQuickEntry(sampleQuickEntryLine(), ledger, {
      lang: ctx.lang?.(),
      today: ctx.iso(new Date()),
    });
    if (!parsed.ok) return false;
    const { ledger: next, transaction } = core().addTransaction(ledger, parsed.draft, { lang: ctx.lang?.() });
    const snapTx = { ...transaction };
    const snapIndex = next.transactions.findIndex(tx => tx.id === transaction.id);
    lastHighlightTxId = transaction.id;
    commit(next);
    dismissOnboarding(host);
    ctx.toast?.(
      t("已记一笔示例（可撤销）", "Sample entry added (undo)", "Beispielbuchung (rückgängig)"),
      {
        actionLabel: t("撤销", "Undo", "Rückgängig"),
        onAction: () => {
          const restored = core().restoreTransaction(ctx.state().ledger, snapTx, snapIndex);
          commit(restored);
          render();
        },
      },
    );
    return true;
  }

  function renderOnboarding(ledger) {
    if (ledger.transactions.length || onboardingDismissed()) return "";
    const sampleBtn = `<button type="button" class="secondary-button ledger-onboarding-sample" data-ledger-sample-entry>${t("记一笔示例", "Add sample entry", "Beispiel buchen")}</button>`;
    return `<aside class="ledger-onboarding ll-empty ll-empty-enter" data-ledger-onboarding>
      <div class="ll-art" data-art="week-insights-empty"></div>
      <div class="ledger-onboarding-copy">
        <strong>${t("从这里记第一笔", "Log your first entry here", "Hier die erste Buchung erfassen")}</strong>
        <p>${t(
          "默认分类已就绪。在上方输入框试试：12,50 咖啡、-45 Miete gestern、+2000 工资；或先记一笔示例熟悉流程。",
          "Starter categories are ready. Use quick entry — e.g. 12.50 coffee, -45 rent yesterday, +2000 salary — or add a sample entry below.",
          "Standardkategorien sind da. Schnellerfassung oben — z. B. 12,50 Kaffee · -45 Miete gestern · +2000 Gehalt — oder unten eine Beispielbuchung.",
        )}</p>
        <div class="ledger-onboarding-actions">${sampleBtn}<button type="button" class="text-button" data-ledger-hint-dismiss>${t("知道了", "Got it", "Verstanden")}</button></div>
      </div>
    </aside>`;
  }

  function mountOnboardingArt(host) {
    const box = host.querySelector("[data-ledger-onboarding] .ll-art[data-art]");
    if (box && root.LifeLedgerHairline?.mount) root.LifeLedgerHairline.mount(box, box.dataset.art);
  }

  function submitQuickEntry(host, rawText, anchorDay, options = {}) {
    const ledger = ledgerState();
    const input = options.inputEl;
    const form = options.formEl;
    const parsed = core().parseQuickEntry(rawText, ledger, { lang: ctx.lang?.(), today: anchorDay || ctx.iso(new Date()) });
    if (parsed.ok && options.categoryId && parsed.draft) {
      const cat = ledger.categories.find(c => c.id === options.categoryId && !c.archived);
      if (cat) {
        parsed.draft.categoryId = cat.id;
        const abs = Math.abs(parsed.draft.amountMinor);
        parsed.draft.amountMinor = cat.kind === "income" ? abs : -abs;
      }
    }
    if (!parsed.ok) {
      if (input) {
        input.classList.add("is-error");
        input.setAttribute("aria-invalid", "true");
      }
      return { ok: false };
    }
    if (input) {
      input.classList.remove("is-error");
      input.removeAttribute("aria-invalid");
    }
    let { ledger: next, transaction } = core().addTransaction(ledger, parsed.draft, { lang: ctx.lang?.() });
    if (options.categoryId && parsed.draft.note) {
      next = core().rememberCategoryHint(next, parsed.draft.note, parsed.draft.categoryId);
    }
    const firstEntry = !ledger.transactions.length && next.transactions.length;
    lastHighlightTxId = transaction.id;
    commit(next);
    if (input) {
      input.value = "";
      input.classList.add("is-success");
      setTimeout(() => input.classList.remove("is-success"), 600);
    }
    if (form) {
      form.classList.add("is-success-flash");
      setTimeout(() => form.classList.remove("is-success-flash"), 600);
    }
    if (firstEntry && host) dismissOnboarding(host);
    if (options.render !== false) render();
    root.LifeLedgerTodayWidgets?.reload?.();
    return { ok: true, transaction };
  }

  function bindInteractions(host, ledger, ym) {
    const form = host.querySelector("#ledgerQuickForm");
    form?.addEventListener("submit", event => {
      event.preventDefault();
      const input = form.querySelector("input[name=quick]");
      const result = submitQuickEntry(host, input.value, viewDay || ctx.iso(new Date()), { inputEl: input, formEl: form });
      if (!result.ok) return;
    });
    host.querySelector("[data-ledger-day-prev]")?.addEventListener("click", () => {
      viewDay = shiftDay(viewDay || ctx.iso(new Date()), -1);
      viewMonth = viewDay.slice(0, 7);
      listDayFilter = "";
      render();
    });
    host.querySelector("[data-ledger-day-next]")?.addEventListener("click", () => {
      const today = ctx.iso(new Date());
      const next = shiftDay(viewDay || today, 1);
      if (next > today) return;
      viewDay = next;
      viewMonth = viewDay.slice(0, 7);
      listDayFilter = "";
      render();
    });
    host.querySelector("[data-ledger-more-toggle]")?.addEventListener("click", () => {
      ledgerMenuOpen = !ledgerMenuOpen;
      render();
    });
    host.querySelectorAll("[data-ledger-stats]").forEach(btn => {
      btn.addEventListener("click", () => {
        const next = btn.getAttribute("data-ledger-stats") === "month" ? "month" : "week";
        if (next === statsScope) return;
        ledgerStatsScopePulse = true;
        statsScope = next;
        render();
      });
    });
    host.querySelectorAll("[data-ledger-expand-day]").forEach(btn => {
      btn.addEventListener("click", () => {
        const day = btn.getAttribute("data-ledger-expand-day");
        if (!day) return;
        const listRoot = host.querySelector(".ledger-tx-list--grouped");
        const finishFlip = root.LifeLedgerInteraction?.captureFlip?.(
          listRoot,
          ".ledger-day-group",
          node => node.getAttribute("data-ledger-day-group"),
        );
        viewDay = day;
        listDayFilter = "";
        viewMonth = day.slice(0, 7);
        render();
        finishFlip?.(host.querySelector(".ledger-tx-list--grouped"));
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
      readLedgerCsvFile(file, fileInput);
    });
    bindDelete(host, ledger);
    bindDuplicate(host);
    bindEdit(host);
    host.querySelectorAll(".ledger-tx-cat-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        pulseLedgerCategoryChip(btn);
        const id = btn.closest(".ledger-tx")?.dataset.id;
        if (!id) return;
        const tx = ledgerState().transactions.find(row => row.id === id);
        if (tx) openEditPopover(host, tx, ledgerState());
      });
    });
    bindRecurring(host, ym);
    bindBudget(host, ym);
    bindTouchRowGestures(host);
    host.querySelectorAll("[data-ledger-day]").forEach(btn => {
      btn.addEventListener("click", () => {
        pulseLedgerHeatDay(btn);
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
    host.querySelectorAll(".ledger-list-empty, .ledger-recurring-empty-wrap").forEach(el => {
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

  function bindTouchRowGestures(host) {
    host.querySelectorAll(".ledger-tx").forEach(row => {
      let startX = 0;
      let startY = 0;
      let longTimer = null;
      let longFired = false;
      let activePointer = null;
      const cancelLong = () => {
        if (longTimer) clearTimeout(longTimer);
        longTimer = null;
      };
      const beginPress = (clientX, clientY, pointerId) => {
        longFired = false;
        cancelLong();
        startX = clientX;
        startY = clientY;
        activePointer = pointerId;
        longTimer = setTimeout(() => {
          longFired = true;
          cancelLong();
          row.querySelector(".ledger-tx-edit")?.click();
          root.LifeLedgerInteraction?.pressBump?.(row, "is-long-press-hint");
        }, 520);
      };
      row.addEventListener("pointerdown", event => {
        if (event.pointerType === "mouse") return;
        beginPress(event.clientX, event.clientY, event.pointerId);
      });
      row.addEventListener("pointermove", event => {
        if (activePointer === null || event.pointerId !== activePointer) return;
        if (Math.abs(event.clientX - startX) > 12 || Math.abs(event.clientY - startY) > 12) cancelLong();
      });
      row.addEventListener("pointerup", event => {
        if (activePointer === null || event.pointerId !== activePointer) return;
        cancelLong();
        activePointer = null;
        if (longFired) return;
        if (Math.abs(startY - event.clientY) < 35 && startX - event.clientX > 72) row.querySelector(".ledger-tx-del")?.click();
      });
      row.addEventListener("pointercancel", () => {
        cancelLong();
        activePointer = null;
      });
    });
  }

  function focusQuickEntry() {
    const input = $("#ledgerQuickInput");
    if (!input) return;
    input.focus();
    input.select?.();
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
    bindTouchRowGestures(host);
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
    let ledger = ledgerState();
    const today = ctx.iso(new Date());
    if (!viewDay) viewDay = today;
    viewMonth = viewDay.slice(0, 7);
    const autoPosted = ctx.state()?.meta?.demo?.active
      ? null
      : core().autoPostDueMonthlyRecurring(ledger, { lang: ctx.lang?.(), today });
    if (autoPosted) {
      commit(autoPosted.ledger);
      ledger = ledgerState();
    }
    const ym = viewMonth;
    if (listDayFilter && !listDayFilter.startsWith(`${ym}-`)) {
      viewMonth = listDayFilter.slice(0, 7);
      viewDay = listDayFilter;
    }
    // 2.1 Slice 2: the Money page (money-ui.js) owns the page when loaded; old renderer stays as fallback.
    if (root.LifeLedgerMoneyUI?.render(host, ctx, {
      month: viewMonth,
      day: listDayFilter,
      setMonth: next => { viewMonth = next; viewDay = `${next}-01`; listDayFilter = ""; render(); },
    })) return;
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
      <header class="ledger-header ledger-header--daily panel">
        <div class="ledger-day-nav">
          <button type="button" class="icon-button" data-ledger-day-prev aria-label="${t("前一天", "Previous day", "Vorheriger Tag")}">‹</button>
          <h2 class="ledger-day-title">${ctx.escape(dayLabel(viewDay))}</h2>
          <button type="button" class="icon-button" data-ledger-day-next aria-label="${t("后一天", "Next day", "Nächster Tag")}" ${viewDay >= today ? "disabled" : ""}>›</button>
        </div>
        ${renderLedgerMoreMenu(ledger, ym)}
      </header>
      <form class="ledger-quick panel" id="ledgerQuickForm">
        <div class="ledger-quick-label">
          <input name="quick" id="ledgerQuickInput" type="text" enterkeyhint="done" autocomplete="off" placeholder="${t("12,50 咖啡", "12.50 coffee · -45 rent yesterday", "12,50 Kaffee · -45 Miete gestern")}" aria-label="${t("快速录入", "Quick entry", "Schnellerfassung")}" />
        </div>
        <button type="submit" class="primary-button">${t("添加", "Add", "Hinzufügen")}</button>
      </form>
      ${renderOnboarding(ledger)}
      ${renderStatsPanel(ledger, viewDay)}
      ${fxHint}
      ${renderSubscriptionList(ledger)}
      ${renderRecurringPendingBanner(ledger, ym)}
      <section class="ledger-list-wrap panel">
        <h3>${t("交易", "Transactions", "Buchungen")}</h3>
        ${renderDayFilterChip(ym)}
        ${renderCategoryFilterChip(ledger)}
        ${renderList(ledger, ym)}
      </section>`;
    host.querySelector("[data-ledger-hint-dismiss]")?.addEventListener("click", () => dismissOnboarding(host));
    host.querySelector("[data-ledger-sample-entry]")?.addEventListener("click", () => {
      if (postSampleEntry(host, ledgerState())) render();
    });
    mountOnboardingArt(host);
    bindInteractions(host, ledger, ym);
    bindLedgerCsvDrop();
    const dropHint = document.getElementById("ledgerCsvDropHint");
    if (dropHint) {
      dropHint.textContent = t("松开以导入 CSV", "Drop CSV to import", "CSV loslassen zum Importieren");
    }
    requestAnimationFrame(() => {
      const viz = host.querySelector(".ledger-panel--stats .ledger-category-viz");
      if (viz && !viz.classList.contains("is-ready")) viz.classList.add("is-ready");
      root.LifeLedgerInteraction?.syncSegments?.(host);
      root.LifeLedgerInteraction?.retarget?.(host.querySelector(".ledger-panel--stats .ledger-donut-segments.is-retargeting"));
      root.LifeLedgerInteraction?.retarget?.(host.querySelector(".ledger-daily-strip .ledger-heat-grid.is-retargeting"));
      if (ledgerStatsScopePulse) {
        ledgerStatsScopePulse = false;
        const panel = host.querySelector(".ledger-panel--stats");
        panel?.classList.add("is-scope-swap");
        root.setTimeout?.(() => panel?.classList.remove("is-scope-swap"), 480);
      }
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
    if (ledgerImportPulse) {
      ledgerImportPulse = false;
      const wrap = host.querySelector(".ledger-list-wrap");
      if (wrap) {
        wrap.classList.add("is-import-pulse");
        root.LifeLedgerInteraction?.retarget?.(wrap);
        const reduced = document.documentElement.classList.contains("motion-reduced")
          || matchMedia("(prefers-reduced-motion: reduce)").matches;
        setTimeout(() => wrap.classList.remove("is-import-pulse"), reduced ? 0 : 900);
      }
    }
  }

  function openToDay(isoDate, options = {}) {
    if (typeof isoDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return;
    viewDay = isoDate;
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
    const today = ctx?.iso(new Date()) || "";
    viewDay = ym === today.slice(0, 7) ? today : `${ym}-01`;
    listDayFilter = "";
    listCategoryFilter = "";
    listFilter = "";
    pendingListFocus = options.scrollToList === true;
    ledgerMonthPulse = options.pulseMonth !== false;
    statsScope = "month";
    if (ctx) render();
  }

  root.LifeLedgerLedgerUI = {
    render(options) {
      ctx = options;
      bindLedgerShortcuts();
      bindLedgerCsvDrop();
      if (!viewMonth) viewMonth = ymFromDate(options.iso(new Date()));
      render();
    },
    setViewMonth(ym) {
      if (typeof ym === "string" && /^\d{4}-\d{2}$/.test(ym)) viewMonth = ym;
    },
    openToDay,
    openToMonth,
    focusQuickEntry,
    quickAdd(text, anchorDay, options) {
      // Today's quick sheet can be used before the ledger page was ever rendered; ctx is set by render().
      if (!ctx) root.renderLedger?.();
      if (!ctx) return { ok: false };
      return submitQuickEntry(null, text, anchorDay, { ...options, render: options?.render !== false });
    },
  };
})(typeof window !== "undefined" ? window : global);
