(function (root) {
  const core = () => root.LifeLedgerLedger;
  let ctx = null;
  let viewMonth = "";
  let listFilter = "";
  let trendPlot = null;
  let categoryChartMode = "donut";
  let lastSummaryDisplay = { income: "", expense: "", net: "" };

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

  function renderTreemap(breakdown, ledger) {
    const total = breakdown.reduce((s, row) => s + row.amountMinor, 0);
    if (!total) return `<div class="ledger-donut ledger-donut--empty ll-empty-enter">${t("暂无支出分类", "No spending yet", "Noch keine Ausgaben")}</div>`;
    const items = breakdown.slice(0, 8).map(row => {
      const cat = ledger.categories.find(c => c.id === row.categoryId);
      const name = cat ? core().localizedCategoryName(cat, ctx.lang?.()) : "";
      const color = accentFill(cat?.color);
      return {
        value: row.amountMinor,
        color,
        label: name,
        lightFill: core().isLightAccentColor(color),
      };
    });
    const cells = layoutTreemapCells(items, 0, 0, 100, 100, true);
    const lang = ctx.lang?.() || "en";
    const rects = cells.map(cell => {
      const maxChars = core().treemapLabelMaxChars(cell.w, cell.h, lang);
      const short = maxChars ? core().truncateTreemapLabel(cell.label, maxChars) : "";
      const label = short
        ? `<text x="${(cell.x + cell.w / 2).toFixed(2)}" y="${(cell.y + cell.h / 2).toFixed(2)}" text-anchor="middle" dominant-baseline="middle" class="ledger-treemap-label${cell.lightFill ? " ledger-treemap-label--dim" : ""}">${ctx.escape(short)}</text>`
        : "";
      return `<rect x="${cell.x.toFixed(2)}" y="${cell.y.toFixed(2)}" width="${Math.max(0.5, cell.w).toFixed(2)}" height="${Math.max(0.5, cell.h).toFixed(2)}" fill="${cell.color}" rx="1"><title>${ctx.escape(cell.label)}</title></rect>${label}`;
    }).join("");
    return `<svg class="ledger-treemap" viewBox="0 0 100 100" role="img" aria-label="${t("分类占比", "Category split", "Kategorien")}">${rects}</svg>`;
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
    const paths = slices.map(slice => {
      const cat = ledger.categories.find(c => c.id === slice.categoryId);
      const fill = accentFill(cat?.color);
      const d = core().annularSectorPath(50, 50, 30, 48, slice.startAngle, slice.endAngle);
      return `<path d="${d}" fill="${ctx.escape(fill)}"><title>${ctx.escape(cat ? core().localizedCategoryName(cat, ctx.lang?.()) : "")}</title></path>`;
    }).join("");
    return `<svg class="ledger-donut ledger-donut-svg" viewBox="0 0 100 100" role="img" aria-label="${t("分类占比", "Category split", "Kategorien")}"><g class="ledger-donut-segments">${paths}</g><circle class="ledger-donut-hole" cx="50" cy="50" r="30" fill="var(--surface-page, #f5f5f0)"/></svg>`;
  }

  function renderHeatmap(ledger, ym) {
    const map = core().dailySpendHeatmap(ledger, ym);
    const [y, m] = ym.split("-").map(Number);
    const days = new Date(y, m, 0).getDate();
    const max = Math.max(1, ...map.values());
    let cells = "";
    for (let day = 1; day <= days; day += 1) {
      const iso = `${ym}-${String(day).padStart(2, "0")}`;
      const val = map.get(iso) || 0;
      const level = val ? Math.min(4, Math.ceil((val / max) * 4)) : 0;
      cells += `<span class="ledger-heat ledger-heat-${level}" title="${ctx.escape(iso)}"></span>`;
    }
    return `<div class="ledger-heat-grid" aria-hidden="true">${cells}</div>`;
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
      return `<p class="ledger-empty ledger-budget-empty ll-empty-enter">${t(
        "点击「设置预算」为本月支出分类添加上限。",
        "Tap “Set budget” to add a monthly limit for an expense category.",
        "Tippe auf „Budget setzen“, um ein Monatslimit für eine Ausgabenkategorie festzulegen.",
      )}</p>`;
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

  function renderList(ledger, ym) {
    const rows = core().filterTransactions(ledger, ym, listFilter)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    if (!rows.length) {
      return `<p class="ledger-empty ll-empty-enter">${listFilter
        ? t("没有匹配的交易。", "No matching entries.", "Keine passenden Buchungen.")
        : t("这个月还没有记录。试试输入「12,50 咖啡」。", "Nothing this month yet. Try \"12.50 coffee\".", "Noch nichts in diesem Monat. Probiere „12,50 Kaffee“.")}</p>`;
    }
    return `<ul class="ledger-tx-list">${rows.map(tx => {
      const cat = ledger.categories.find(c => c.id === tx.categoryId);
      const name = cat ? core().localizedCategoryName(cat, ctx.lang?.()) : "";
      return `<li class="ledger-tx" data-id="${ctx.escape(tx.id)}">
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

  function renderRecurring(ledger) {
    const rows = (ledger.recurring || []).filter(Boolean);
    const addBtn = `<button type="button" class="secondary-button ledger-recurring-add">${t("添加固定项", "Add recurring", "Hinzufügen")}</button>`;
    if (!rows.length) {
      return `<div class="ledger-recurring-head">${addBtn}</div><p class="ledger-empty ledger-recurring-empty ll-empty-enter">${t("房租、订阅或工资等固定项可在下方添加。", "Add rent, subscriptions, or salary templates.", "Miete, Abos oder Gehalt als Vorlage anlegen.")}</p>`;
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
    document.querySelector(".ledger-edit-popover")?.remove();
    document.querySelector(".ledger-recurring-popover")?.remove();
    document.querySelector(".ledger-budget-popover")?.remove();
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
    pop.querySelector("[data-edit-cancel]")?.addEventListener("click", closeEditPopover);
    form.addEventListener("submit", event => {
      event.preventDefault();
      const amountRaw = form.querySelector('[name="amount"]').value;
      const token = core().parseAmountToken(amountRaw);
      let amountMinor = tx.amountMinor;
      if (token != null) {
        amountMinor = cat?.kind === "income" ? Math.abs(token) : -Math.abs(token);
      }
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
        return;
      }
      input.classList.remove("is-error");
      const { ledger: next } = core().addTransaction(ledger, parsed.draft, { lang: ctx.lang?.() });
      const firstEntry = !ledger.transactions.length && next.transactions.length;
      commit(next);
      input.value = "";
      input.classList.add("is-success");
      setTimeout(() => input.classList.remove("is-success"), 600);
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
    host.querySelector("[data-ledger-prev]")?.addEventListener("click", () => { viewMonth = shiftMonth(ym, -1); render(); });
    host.querySelector("[data-ledger-next]")?.addEventListener("click", () => { viewMonth = shiftMonth(ym, 1); render(); });
    host.querySelector("#ledgerFilter")?.addEventListener("input", e => {
      listFilter = e.target.value;
      const list = host.querySelector(".ledger-list-wrap");
      if (list) {
        const h = list.querySelector("h3");
        list.innerHTML = `${h ? h.outerHTML : ""}${renderList(ledgerState(), ym)}`;
        bindDelete(host, ledgerState());
        bindDuplicate(host);
        bindEdit(host);
        bindSwipeDelete(host);
      }
    });
    host.querySelector("[data-ledger-export]")?.addEventListener("click", () => {
      const csv = core().exportTransactionsCsv(ledgerState(), ym);
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
        const result = core().importGermanBankCsv(String(reader.result || ""), ledgerState(), { lang: ctx.lang?.() });
        const hadNone = !ledgerState().transactions.length;
        commit(result.ledger);
        if (hadNone && ledgerState().transactions.length) dismissOnboarding(host);
        ctx.toast?.(t(`已导入 ${result.imported} 笔`, `Imported ${result.imported} entries`, `${result.imported} Buchungen importiert`));
        fileInput.value = "";
        render();
      };
      reader.readAsText(file);
    });
    bindDelete(host, ledger);
    bindDuplicate(host);
    bindEdit(host);
    bindRecurring(host);
    bindBudget(host, ym);
    bindSwipeDelete(host);
    bindKeypad(host);
    host.querySelectorAll("[data-chart-mode]").forEach(btn => {
      btn.addEventListener("click", () => {
        categoryChartMode = btn.dataset.chartMode || "donut";
        render();
      });
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

  function bindRecurring(host) {
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
      row.addEventListener("touchstart", event => {
        startX = event.touches[0]?.clientX || 0;
      }, { passive: true });
      row.addEventListener("touchend", event => {
        const endX = event.changedTouches[0]?.clientX || 0;
        if (startX - endX > 72) row.querySelector(".ledger-tx-del")?.click();
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
        commit(result.ledger);
        ctx.toast?.(t("已复制一笔记录", "Entry duplicated", "Eintrag dupliziert"));
        render();
      });
    });
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
    const summary = core().monthSummary(ledger, ym);
    const breakdown = core().categoryBreakdown(ledger, ym, "expense");
    const cur = ledger.settings.defaultCurrency;

    host.innerHTML = `
      <header class="ledger-header">
        <div>
          <span class="kicker">${t("记账", "Money", "Geld")}</span>
          <h2>${ctx.escape(monthLabel(ym))}</h2>
        </div>
        <div class="ledger-month-nav">
          <button type="button" class="icon-button" data-ledger-prev aria-label="${t("上个月", "Previous month", "Vorheriger Monat")}">‹</button>
          <button type="button" class="icon-button" data-ledger-next aria-label="${t("下个月", "Next month", "Nächster Monat")}">›</button>
        </div>
      </header>
      <div class="ledger-summary">
        <article><small>${t("收入", "Income", "Einnahmen")}</small><strong data-ledger-sum="income">${ctx.escape(core().formatMoney(summary.incomeMinor, cur, ctx.locale?.()))}</strong></article>
        <article><small>${t("支出", "Spending", "Ausgaben")}</small><strong class="is-expense" data-ledger-sum="expense">${ctx.escape(core().formatMoney(summary.expenseMinor, cur, ctx.locale?.()))}</strong></article>
        <article><small>${t("结余", "Net", "Saldo")}</small><strong data-ledger-sum="net">${ctx.escape(core().formatMoney(summary.netMinor, cur, ctx.locale?.()))}</strong></article>
      </div>
      <form class="ledger-quick" id="ledgerQuickForm">
        <div class="ledger-quick-label">
          <span>${t("快速录入", "Quick entry", "Schnellerfassung")}</span>
          <input name="quick" id="ledgerQuickInput" type="text" enterkeyhint="done" autocomplete="off" placeholder="${t("12,50 咖啡 · -45 Miete gestern", "12.50 coffee · -45 rent yesterday", "12,50 Kaffee · -45 Miete gestern")}" />
        </div>
        <button type="submit" class="primary-button">${t("添加", "Add", "Hinzufügen")}</button>
      </form>
      ${renderKeypad()}
      <div class="ledger-chips">${renderChips(ledger)}</div>
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
    });
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
  }

  root.LifeLedgerLedgerUI = {
    render(options) {
      ctx = options;
      if (!viewMonth) viewMonth = ymFromDate(options.iso(new Date()));
      render();
    },
  };
})(typeof window !== "undefined" ? window : global);
