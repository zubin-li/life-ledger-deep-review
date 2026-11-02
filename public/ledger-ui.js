(function (root) {
  const core = () => root.LifeLedgerLedger;
  let ctx = null;
  let viewMonth = "";

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
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1, 12);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  function monthLabel(ym) {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y, m - 1, 1, 12);
    return ctx.monthName(d);
  }

  function renderDonut(breakdown, ledger) {
    const total = breakdown.reduce((s, row) => s + row.amountMinor, 0);
    if (!total) return `<div class="ledger-donut ledger-donut--empty">${t("暂无支出分类", "No spending yet", "Noch keine Ausgaben")}</div>`;
    let angle = 0;
    const stops = breakdown.slice(0, 6).map(row => {
      const cat = ledger.categories.find(c => c.id === row.categoryId);
      const pct = row.amountMinor / total;
      const start = angle;
      angle += pct * 360;
      const color = `var(--accent-${cat?.color || "sage"}, var(--accent-sage))`;
      return `${color} ${start.toFixed(2)}deg ${angle.toFixed(2)}deg`;
    }).join(", ");
    return `<div class="ledger-donut" style="background:conic-gradient(${stops})" role="img" aria-label="${t("分类占比", "Category split", "Kategorien")}"></div>`;
  }

  function renderHeatmap(ledger, ym) {
    const map = core().dailySpendHeatmap(ledger, ym);
    const [y, m] = ym.split("-").map(Number);
    const days = new Date(y, m, 0).getDate();
    const max = Math.max(1, ...map.values());
    let cells = "";
    for (let day = 1; day <= days; day++) {
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

  function renderList(ledger, ym) {
    const rows = core().transactionsInMonth(ledger, ym).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    if (!rows.length) {
      return `<p class="ledger-empty">${t("这个月还没有记录。试试输入「12,50 咖啡」。", "Nothing this month yet. Try \"12.50 coffee\".", "Noch nichts in diesem Monat. Probiere „12,50 Kaffee“.")}</p>`;
    }
    return `<ul class="ledger-tx-list">${rows.map(tx => {
      const cat = ledger.categories.find(c => c.id === tx.categoryId);
      const name = cat ? core().localizedCategoryName(cat, ctx.lang?.()) : "";
      return `<li class="ledger-tx" data-id="${ctx.escape(tx.id)}">
        <span class="ledger-tx-date">${ctx.escape(tx.date.slice(5))}</span>
        <span class="ledger-tx-note">${ctx.escape(tx.note || name)}</span>
        <span class="ledger-tx-amt ${tx.amountMinor < 0 ? "is-expense" : "is-income"}">${ctx.escape(core().formatMoney(tx.amountMinor, tx.currency, ctx.locale?.()))}</span>
        <button type="button" class="icon-button ledger-tx-del" aria-label="${t("删除", "Delete", "Löschen")}">×</button>
      </li>`;
    }).join("")}</ul>`;
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
      commit(next);
      input.value = "";
      input.classList.add("is-success");
      setTimeout(() => input.classList.remove("is-success"), 600);
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
        <article><small>${t("收入", "Income", "Einnahmen")}</small><strong>${ctx.escape(core().formatMoney(summary.incomeMinor, cur, ctx.locale?.()))}</strong></article>
        <article><small>${t("支出", "Spending", "Ausgaben")}</small><strong class="is-expense">${ctx.escape(core().formatMoney(summary.expenseMinor, cur, ctx.locale?.()))}</strong></article>
        <article><small>${t("结余", "Net", "Saldo")}</small><strong>${ctx.escape(core().formatMoney(summary.netMinor, cur, ctx.locale?.()))}</strong></article>
      </div>
      <form class="ledger-quick" id="ledgerQuickForm">
        <label class="ledger-quick-label">
          <span>${t("快速录入", "Quick entry", "Schnellerfassung")}</span>
          <input name="quick" type="text" enterkeyhint="done" autocomplete="off" placeholder="${t("12,50 咖啡 · -45 Miete gestern", "12.50 coffee · -45 rent yesterday", "12,50 Kaffee · -45 Miete gestern")}" />
        </label>
        <button type="submit" class="primary-button">${t("添加", "Add", "Hinzufügen")}</button>
      </form>
      <div class="ledger-chips">${renderChips(ledger)}</div>
      <div class="ledger-panels">
        <section class="ledger-panel">
          <h3>${t("分类", "Categories", "Kategorien")}</h3>
          ${renderDonut(breakdown, ledger)}
        </section>
        <section class="ledger-panel">
          <h3>${t("每日支出", "Daily spend", "Tägliche Ausgaben")}</h3>
          ${renderHeatmap(ledger, ym)}
        </section>
      </div>
      <section class="ledger-list-wrap">
        <h3>${t("交易", "Transactions", "Buchungen")}</h3>
        ${renderList(ledger, ym)}
      </section>`;
    bindInteractions(host, ledger, ym);
  }

  root.LifeLedgerLedgerUI = {
    render(options) {
      ctx = options;
      if (!viewMonth) viewMonth = ymFromDate(options.iso(new Date()));
      render();
    },
  };
})(typeof window !== "undefined" ? window : global);
