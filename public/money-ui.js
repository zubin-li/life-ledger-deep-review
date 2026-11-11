/* Life Ledger 2.1 Slice 2 B1 — Money page. Owns #ledgerView .ledger-page when loaded (see ledger-ui.js render()).
   Data helpers live in ledger-core.js (moneyMonth, budgetHint, filterMoneyRows, guessCategory, FX helpers). */
(function (root) {
  const FX_API = "https://api.frankfurter.dev/v1/";
  const CURRENCIES = ["EUR", "CNY", "USD", "GBP", "CHF", "JPY"];
  const ui = {
    drill: "", pickedDay: "", includeFixed: false, showSettings: false,
    filters: { categoryId: "", currency: "", accountId: "", source: "", search: "" },
    sheet: null, catTouched: false, import: null,
  };
  const charts = {};
  let ctx = null;
  let nav = null;

  const core = () => root.LifeLedgerLedger;
  const bank = () => root.LifeLedgerBankImport;
  const t = (zh, en, de) => ctx.text(zh, en, de);
  const esc = s => ctx.escape(String(s ?? ""));
  const css = name => getComputedStyle(document.querySelector("#ledgerView .money-page") || document.body).getPropertyValue(name).trim();

  function fxUrl(currency, iso, target = "EUR") {
    return `${FX_API}${core().fxRequestDate(iso)}?base=${currency}&symbols=${target}`;
  }

  function ledgerState() {
    const st = ctx.state();
    st.ledger = core().normalize(st.ledger || core().emptyLedger(), { lang: ctx.lang?.() || "en" });
    return st.ledger;
  }

  function commit(ledger) {
    ctx.state().ledger = ledger;
    ctx.save();
    ctx.changed?.();
  }

  const money = (minor, cur, digits) => {
    const ledger = ledgerState();
    const c = cur || ledger.settings.defaultCurrency;
    if (digits === 0) {
      return new Intl.NumberFormat(ctx.locale(), { style: "currency", currency: c, maximumFractionDigits: 0 }).format(Math.round(minor / 100));
    }
    return core().formatMoney(minor, c, ctx.locale());
  };

  function catName(ledger, id) {
    if (!id) return t("未分类", "Uncategorised", "Ohne Kategorie");
    return core().localizedCategoryName(ledger.categories.find(c => c.id === id), ctx.lang?.()) || t("未分类", "Uncategorised", "Ohne Kategorie");
  }

  const GROUP_COLOR = { "grp-food": 1, "grp-home": 2, "grp-health": 3, "grp-leisure": 4, "grp-finance": 5, transport: 6, shopping: 7, travel: 8, education: 4, other: 8 };

  function catColor(ledger, id) {
    const cat = ledger.categories.find(c => c.id === id);
    if (!cat) return "var(--cat-8)";
    if (!cat.isGroup && /^cat-[1-8]$/.test(cat.color || "")) return `var(--${cat.color})`;
    const group = cat.isGroup ? cat : ledger.categories.find(c => c.id === cat.parentId && c.isGroup);
    const slot = GROUP_COLOR[(group || cat).defaultSlug];
    if (slot) return `var(--cat-${slot})`;
    const leaves = ledger.categories.filter(c => !c.isGroup);
    const i = Math.max(0, leaves.findIndex(c => c.id === id));
    return `var(--cat-${(i % 8) + 1})`;
  }

  /** Leaf rows rolled up to their group. A leaf with no group stays itself. */
  function spendRollup(ledger, leafRows) {
    const map = new Map();
    for (const row of leafRows || []) {
      const cat = ledger.categories.find(c => c.id === row.categoryId);
      const parent = cat?.parentId ? ledger.categories.find(c => c.id === cat.parentId && c.isGroup) : null;
      const id = parent ? parent.id : row.categoryId;
      map.set(id, (map.get(id) || 0) + row.amountMinor);
    }
    return [...map].map(([categoryId, amountMinor]) => ({ categoryId, amountMinor })).sort((a, b) => b.amountMinor - a.amountMinor);
  }

  /** Filter bar keeps a native select. Groups are optgroup labels; leaves are the options. */
  function categoryFilterOptions(ledger, selected) {
    const opt = (v, label) => `<option value="${esc(v)}" ${v === selected ? "selected" : ""}>${esc(label)}</option>`;
    const block = (label, rows) => rows.length ? `<optgroup label="${esc(label)}">${rows.map(c => opt(c.id, catName(ledger, c.id))).join("")}</optgroup>` : "";
    const leaves = ledger.categories.filter(c => !c.archived && !c.isGroup);
    const used = new Set();
    let html = opt("", t("全部类别", "All categories", "Alle Kategorien"));
    for (const g of ledger.categories.filter(c => c.isGroup && !c.archived)) {
      const kids = leaves.filter(c => c.parentId === g.id);
      kids.forEach(c => used.add(c.id));
      html += block(catName(ledger, g.id), kids);
    }
    html += block(t("其他支出", "Other spending", "Weitere Ausgaben"), leaves.filter(c => c.kind === "expense" && !used.has(c.id)));
    html += block(t("收入", "Income", "Einnahmen"), leaves.filter(c => c.kind === "income"));
    return html;
  }

  function monthLabel(ym) {
    const [y, m] = ym.split("-").map(Number);
    return ctx.monthName(new Date(y, m - 1, 1, 12));
  }

  function dayLabel(iso, withWeekday = true) {
    const d = new Date(`${iso}T12:00:00`);
    const opts = withWeekday ? { day: "numeric", month: "short", weekday: "short" } : { day: "numeric", month: "short" };
    return new Intl.DateTimeFormat(ctx.locale(), opts).format(d);
  }

  function deltaHtml(cur, prev, goodWhenDown) {
    if (!prev) return `<span class="money-delta">${t("上月无数据", "No data last month", "Kein Vormonat")}</span>`;
    const pct = Math.round(((cur - prev) / prev) * 100);
    const up = pct > 0;
    const cls = pct === 0 ? "" : (up === goodWhenDown ? "up" : "down");
    return `<span class="money-delta"><b class="${cls}">${up ? "+" : ""}${pct}%</b> ${t("比上月", "vs last month", "ggü. Vormonat")}</span>`;
  }

  /* Days so far: current month averages over elapsed days only, past months over all days. */
  function elapsedDays(mm) {
    const today = ctx.iso(new Date());
    return today.startsWith(mm.ym) ? Number(today.slice(8, 10)) : mm.days.length;
  }

  /* ---------- rows ---------- */
  function txRow(ledger, tx, showDate = true) {
    const fx = tx.originalCurrency
      ? `<small>${esc(money(tx.amountMinor, tx.currency))}${tx.fxSource === "estimate" ? ` · ${t("估算", "estimate", "Schätzung")}` : ""}</small>`
      : "";
    const amount = tx.originalCurrency ? money(tx.originalAmountMinor, tx.originalCurrency) : money(tx.amountMinor, tx.currency);
    const badge = tx.originalCurrency ? `<span class="money-fx">${esc(tx.originalCurrency)}</span>` : "";
    const meta = [tx.source === "import" ? t("导入", "Imported", "Importiert") : "", tx.transfer ? t("转账", "Transfer", "Umbuchung") : "", core().isFixedTx(ledger, tx) ? t("固定", "Fixed", "Fix") : ""].filter(Boolean).join(" · ");
    return `<li class="money-tx" data-id="${esc(tx.id)}">
      <span class="d">${showDate ? esc(dayLabel(tx.date, false)) : ""}</span>
      <span class="m">${esc(tx.note || catName(ledger, tx.categoryId))}${badge}${meta ? `<small>${esc(meta)}</small>` : ""}</span>
      <span class="money-chip" style="--c:${catColor(ledger, tx.categoryId)}"><i class="money-dot"></i>${esc(catName(ledger, tx.categoryId))}</span>
      <span class="a money-num ${tx.amountMinor > 0 ? "in" : ""}">${esc(amount)}${fx}</span>
      <button class="money-del" type="button" data-del="${esc(tx.id)}" aria-label="${esc(t("删除", "Delete", "Löschen"))}">×</button>
    </li>`;
  }

  /* ---------- sections ---------- */
  function headerHtml(ym, isCurrent) {
    return `<header class="money-head">
      <div><span class="kicker">${t("每一笔，都知道去了哪里", "Every euro, accounted for", "Jeder Euro, nachvollziehbar")}</span>
        <h1 class="money-title">${esc(monthLabel(ym))}</h1>
        <p class="money-lede">${t("收入、支出与固定开销，一屏看清；点任意类别或日期查看明细。", "Income, spending and fixed costs at a glance — tap any category or day for details.", "Einnahmen, Ausgaben und Fixkosten auf einen Blick – Kategorie oder Tag antippen für Details.")}</p></div>
      <div class="money-head-actions">
        <div class="money-nav"><button class="icon-button" type="button" data-month="-1" aria-label="${esc(t("上个月", "Previous month", "Vormonat"))}">‹</button><button class="secondary-button" type="button" data-month="0" ${isCurrent ? "aria-current=\"true\"" : ""}>${t("本月", "This month", "Dieser Monat")}</button><button class="icon-button" type="button" data-month="1" ${isCurrent ? "disabled" : ""} aria-label="${esc(t("下个月", "Next month", "Nächster Monat"))}">›</button></div>
        <button class="icon-button money-gear" type="button" data-money-settings aria-label="${esc(t("记账设置", "Money settings", "Einstellungen"))}">⚙</button>
        <button class="secondary-button money-import-hd" type="button" data-money-import>${t("导入银行账单", "Import bank statement", "Kontoauszug importieren")}</button>
        <button class="primary-button money-add" type="button" data-money-add>＋ ${t("记一笔", "Add entry", "Eintrag")}</button>
      </div>
    </header>`;
  }

  function overviewHtml(ledger, mm, prev, ym) {
    const net = mm.incomeMinor - mm.expenseMinor;
    const budget = ledger.settings.monthlyBudgetMinor;
    let budgetHtml;
    if (budget > 0) {
      const used = mm.variableMinor / budget;
      const today = ctx.iso(new Date());
      const days = mm.days.length;
      const pace = today.startsWith(ym) ? Number(today.slice(8, 10)) / days : (today > ym ? 1 : 0);
      const left = budget - mm.variableMinor;
      budgetHtml = `<div class="money-budget">
        <div class="money-budget-track ${used > 1 ? "is-over" : ""}"><i style="transform:scaleX(${Math.min(1, used).toFixed(3)})"></i><s style="left:${(pace * 100).toFixed(1)}%"></s></div>
        <div class="money-budget-meta"><span>${left >= 0
          ? t(`可变支出预算 ${money(budget, null, 0)}，还剩 <b>${money(left, null, 0)}</b>`, `Variable budget ${money(budget, null, 0)}, <b>${money(left, null, 0)}</b> left`, `Budget ${money(budget, null, 0)}, noch <b>${money(left, null, 0)}</b>`)
          : t(`已超出预算 <b>${money(-left, null, 0)}</b>`, `<b>${money(-left, null, 0)}</b> over budget`, `<b>${money(-left, null, 0)}</b> über Budget`)}</span><span>${t(`已用 ${Math.round(used * 100)}% · 时间过去 ${Math.round(pace * 100)}%`, `${Math.round(used * 100)}% used · ${Math.round(pace * 100)}% of month`, `${Math.round(used * 100)} % genutzt · ${Math.round(pace * 100)} % des Monats`)}</span></div>
      </div>`;
    } else {
      const hint = core().budgetHint(ledger, ym);
      budgetHtml = `<p class="money-budget-off">${t("还没有设月度预算。", "No monthly budget set.", "Kein Monatsbudget gesetzt.")}${hint
        ? ` ${t(`参考：近 3 个月可变支出中位数 ${money(hint, null, 0)}。`, `Reference: median variable spend of the last 3 months ${money(hint, null, 0)}.`, `Richtwert: Median der variablen Ausgaben der letzten 3 Monate ${money(hint, null, 0)}.`)}`
        : ""} <button class="money-link" type="button" data-money-settings>${t("去设置", "Set one", "Festlegen")}</button></p>`;
    }
    return `<article class="module-card money-card" data-module="money-overview">
      <header class="module-header"><div><span class="kicker">${t("本月概览", "This month", "Monatsüberblick")}</span><h3 class="module-title">${t("这个月，钱是怎么流动的", "How money moved this month", "So floss das Geld diesen Monat")}</h3></div></header>
      <dl class="money-overview">
        <div><dt>${t("结余", "Net", "Saldo")}</dt><dd class="money-num">${esc(money(net, null, 0))}</dd>${deltaHtml(net, prev.incomeMinor - prev.expenseMinor, false)}</div>
        <div><dt>${t("收入", "Income", "Einnahmen")}</dt><dd class="money-num">${esc(money(mm.incomeMinor, null, 0))}</dd>${deltaHtml(mm.incomeMinor, prev.incomeMinor, false)}</div>
        <div><dt>${t("总支出", "Total spending", "Ausgaben gesamt")}</dt><dd class="money-num">${esc(money(mm.expenseMinor, null, 0))}</dd>${deltaHtml(mm.expenseMinor, prev.expenseMinor, true)}
          <span class="money-split">${t(`可变 ${money(mm.variableMinor, null, 0)} · 固定 ${money(mm.fixedMinor, null, 0)}`, `Variable ${money(mm.variableMinor, null, 0)} · fixed ${money(mm.fixedMinor, null, 0)}`, `Variabel ${money(mm.variableMinor, null, 0)} · fix ${money(mm.fixedMinor, null, 0)}`)}</span></div>
      </dl>
      ${budgetHtml}
    </article>`;
  }

  function catBar(ledger, c, i, max, total) {
    return `<li><button class="money-cat-row" type="button" data-drill="${esc(c.categoryId)}" data-idx="${i}" style="--c:${catColor(ledger, c.categoryId)}">
          <span class="money-cat-name"><i class="money-dot"></i>${esc(catName(ledger, c.categoryId))}</span>
          <span class="money-cat-bar"><i style="transform:scaleX(${(c.amountMinor / max).toFixed(3)})"></i></span>
          <span class="amt money-num">${esc(money(c.amountMinor, null, 0))}</span>
          <span class="pct money-num">${total ? Math.round((c.amountMinor / total) * 100) : 0}%</span>
          <span class="chev" aria-hidden="true">›</span></button></li>`;
  }

  function categoriesHtml(ledger, mm, ym) {
    const total = mm.expenseMinor;
    const rolled = spendRollup(ledger, mm.categories);
    const drillCat = ledger.categories.find(c => c.id === ui.drill);
    const cats = drillCat?.isGroup
      ? mm.categories.filter(c => ledger.categories.find(x => x.id === c.categoryId)?.parentId === drillCat.id).sort((a, b) => b.amountMinor - a.amountMinor)
      : rolled;
    const top = (drillCat && !drillCat.isGroup ? mm.categories.filter(c => c.categoryId === drillCat.id) : cats)[0];
    const titleCount = drillCat && !drillCat.isGroup ? 1 : cats.length;
    const title = !top
      ? t("这个月还没有支出", "No spending yet this month", "Noch keine Ausgaben")
      : drillCat && !drillCat.isGroup
        ? catName(ledger, drillCat.id)
        : t(`${titleCount} 个类别，${catName(ledger, top.categoryId)}占得最多`, `${titleCount} categories, ${catName(ledger, top.categoryId)} leads`, `${titleCount} Kategorien, ${catName(ledger, top.categoryId)} vorn`);
    let body;
    if (drillCat?.isGroup) {
      const max = cats[0]?.amountMinor || 1;
      const sum = cats.reduce((s, c) => s + c.amountMinor, 0);
      body = `<div class="money-drill" style="--c:${catColor(ledger, drillCat.id)}">
        <div class="money-drill-head">
          <button class="secondary-button money-back" type="button" data-drill-back>‹ ${t("全部分组", "All groups", "Alle Gruppen")}</button>
          <div><h4>${esc(catName(ledger, drillCat.id))}</h4><p>${esc(money(sum))} · ${total ? Math.round((sum / total) * 100) : 0}%</p></div>
        </div>
        <ul class="money-cat-list">${cats.map((c, i) => catBar(ledger, c, i, max, sum)).join("")}</ul>
      </div>`;
    } else if (ui.drill && drillCat) {
      const rows = core().filterMoneyRows(ledger, ym, { categoryId: ui.drill }).flatMap(g => g.rows);
      const sum = mm.categories.find(c => c.categoryId === ui.drill)?.amountMinor || 0;
      const spendRows = rows.filter(tx => tx.amountMinor < 0);
      const budget = ledger.budgets.find(b => b.month === ym && b.categoryId === ui.drill);
      body = `<div class="money-drill" style="--c:${catColor(ledger, ui.drill)}">
        <div class="money-drill-head">
          <button class="secondary-button money-back" type="button" data-drill-back>‹ ${drillCat.parentId ? t("返回分组", "Back to group", "Zurück zur Gruppe") : t("返回全部类别", "All categories", "Alle Kategorien")}</button>
          <div><h4>${esc(catName(ledger, ui.drill))}</h4><p>${esc(t(`${spendRows.length} 笔 · 共 ${money(sum)} · 占 ${total ? Math.round((sum / total) * 100) : 0}%`, `${spendRows.length} entries · ${money(sum)} · ${total ? Math.round((sum / total) * 100) : 0}%`, `${spendRows.length} Buchungen · ${money(sum)} · ${total ? Math.round((sum / total) * 100) : 0} %`))}</p></div>
        </div>
        <div class="money-drill-grid">
          <div class="money-drill-side">
            <p class="money-hint">${t("这个类别每天花了多少", "Daily spend in this category", "Täglich in dieser Kategorie")}</p>
            <div class="money-mini" id="moneyDrillChart"></div>
            <dl class="money-drill-stats">
              <div><dt>${t("平均每笔", "Avg per entry", "Ø pro Buchung")}</dt><dd class="money-num">${esc(money(spendRows.length ? Math.round(sum / spendRows.length) : 0))}</dd></div>
              <div><dt>${t("最大一笔", "Largest", "Größte")}</dt><dd class="money-num">${esc(money(spendRows.reduce((m, tx) => Math.max(m, -tx.amountMinor), 0)))}</dd></div>
              <div><dt>${t("本类预算", "Category budget", "Kategoriebudget")}</dt><dd><input class="money-input money-cat-budget" inputmode="decimal" data-cat-budget value="${budget ? esc((budget.limitMinor / 100).toFixed(2).replace(".", ",")) : ""}" placeholder="${esc(t("可选", "optional", "optional"))}" aria-label="${esc(t("本类预算", "Category budget", "Kategoriebudget"))}"></dd></div>
            </dl>
          </div>
          <ul class="money-rows money-drill-rows">${rows.map(tx => txRow(ledger, tx)).join("") || `<li class="money-hint">${t("没有记录", "No entries", "Keine Einträge")}</li>`}</ul>
        </div>
      </div>`;
    } else {
      const max = cats[0]?.amountMinor || 1;
      body = cats.length ? `<div class="money-cat-layout">
        <div class="money-donut" id="moneyDonut" role="img" aria-label="${esc(title)}"></div>
        <ul class="money-cat-list">${cats.map((c, i) => catBar(ledger, c, i, max, total)).join("")}</ul>
      </div>` : `<p class="money-empty">${t("记下第一笔后，这里会显示每个类别的占比。", "Add an entry to see where money goes.", "Nach dem ersten Eintrag siehst du hier die Verteilung.")}</p>`;
    }
    return `<article class="module-card money-card" data-module="money-categories" ${ui.drill ? "data-drill" : ""}>
      <header class="module-header"><div><span class="kicker">${t("支出构成", "Where it went", "Wohin es ging")}</span><h3 class="module-title">${esc(title)}</h3></div></header>
      ${body}
    </article>`;
  }

  function dailyHtml(ledger, mm, ym) {
    const vals = mm.days.map(d => d.variableMinor + (ui.includeFixed ? d.fixedMinor : 0));
    const active = vals.filter(v => v > 0);
    const avg = active.length ? Math.round(vals.reduce((a, b) => a + b, 0) / elapsedDays(mm)) : 0;
    const peakIdx = vals.indexOf(Math.max(...vals));
    const title = active.length
      ? t(`日均 ${money(avg, null, 0)}，${dayLabel(mm.days[peakIdx].date, false)}花得最多`, `${money(avg, null, 0)} a day, peak on ${dayLabel(mm.days[peakIdx].date, false)}`, `Ø ${money(avg, null, 0)} pro Tag, Spitze am ${dayLabel(mm.days[peakIdx].date, false)}`)
      : t("还没有可变支出", "No variable spending yet", "Noch keine variablen Ausgaben");
    let panel;
    if (ui.pickedDay && ui.pickedDay.startsWith(ym)) {
      const g = core().filterMoneyRows(ledger, ym, { hideTransfers: ledger.settings.hideTransfers }).find(x => x.date === ui.pickedDay);
      panel = `<h4>${esc(dayLabel(ui.pickedDay))} · ${esc(money(g?.expenseMinor || 0))}</h4><ul class="money-rows">${g ? g.rows.map(tx => txRow(ledger, tx, false)).join("") : `<li class="money-hint">${t("这天没有记录", "Nothing that day", "Keine Einträge an diesem Tag")}</li>`}</ul>`;
    } else {
      panel = `<p class="money-hint">${t("点任意一天，看那天记了什么。", "Tap a day to see its entries.", "Tag antippen, um Einträge zu sehen.")}</p>`;
    }
    return `<article class="module-card money-card" data-module="money-daily">
      <header class="module-header"><div><span class="kicker">${t("每日支出", "Daily spending", "Tägliche Ausgaben")}</span><h3 class="module-title">${esc(title)}</h3></div>
        <label class="money-toggle"><span>${t("包含固定开销", "Include fixed costs", "Fixkosten einbeziehen")}</span><button class="money-switch" type="button" role="switch" aria-checked="${ui.includeFixed}" data-toggle-fixed></button></label></header>
      <div class="money-daily" id="moneyDaily" role="img" aria-label="${esc(title)}"></div>
      ${!ui.includeFixed && mm.fixedMinor ? `<p class="money-fixed-note">${t(`+ ${money(mm.fixedMinor)} 固定开销未计入`, `+ ${money(mm.fixedMinor)} fixed costs not shown`, `+ ${money(mm.fixedMinor)} Fixkosten nicht enthalten`)}</p>` : ""}
      <div class="money-day-panel">${panel}</div>
    </article>`;
  }

  function nextDue(rec, todayIso) {
    const d = new Date(`${todayIso}T12:00:00`);
    if (rec.cadence === "weekly") {
      const add = ((rec.weekday ?? 1) - d.getDay() + 7) % 7;
      d.setDate(d.getDate() + add);
    } else {
      const dom = rec.dayOfMonth || 1;
      if (d.getDate() > dom) d.setMonth(d.getMonth() + 1, dom);
      else d.setDate(dom);
    }
    return ctx.iso(d);
  }

  function fixedHtml(ledger) {
    const recs = ledger.recurring.filter(r => r.amountMinor < 0);
    const monthly = r => (r.cadence === "weekly" ? Math.round((-r.amountMinor * 52) / 12) : -r.amountMinor);
    const total = recs.reduce((s, r) => s + monthly(r), 0);
    const today = ctx.iso(new Date());
    const title = recs.length
      ? t(`${recs.length} 项，每月 ${money(total)}`, `${recs.length} items, ${money(total)} a month`, `${recs.length} Posten, ${money(total)} im Monat`)
      : t("还没有订阅或固定开销", "No subscriptions or fixed costs yet", "Noch keine Abos oder Fixkosten");
    return `<article class="module-card money-card" data-module="money-fixed">
      <header class="module-header"><div><span class="kicker">${t("订阅与固定开销", "Subscriptions & fixed costs", "Abos & Fixkosten")}</span><h3 class="module-title">${esc(title)}</h3></div></header>
      ${recs.length ? `<div class="money-subs">${recs.map(r => `<div class="money-sub" style="--c:${catColor(ledger, r.categoryId)}">
        <strong>${esc(r.label || r.note || catName(ledger, r.categoryId))}</strong>
        <p class="p money-num">${esc(money(-r.amountMinor, r.currency))}</p>
        <small>${r.cadence === "weekly" ? t("每周", "Weekly", "Wöchentlich") : t("每月", "Monthly", "Monatlich")} · ${t("下次", "next", "nächste")} ${esc(dayLabel(nextDue(r, today), false))}</small>
      </div>`).join("")}</div>
      <div class="money-sub-total"><span>${t("按月自动计入支出，在每日图中默认不计入。", "Posted monthly; left out of the daily chart by default.", "Monatlich gebucht; im Tagesdiagramm standardmäßig ausgeblendet.")}</span><span>${t("一年合计", "Per year", "Pro Jahr")} <b class="money-num">${esc(money(total * 12, null, 0))}</b></span></div>`
      : `<p class="money-empty">${t("在设置里把房租等类别标为固定开销，或添加每月重复的记录。", "Flag rent-like categories as fixed in settings.", "Markiere Kategorien wie Miete in den Einstellungen als fix.")}</p>`}
    </article>`;
  }

  function listHtml(ledger, ym) {
    const f = ui.filters;
    const groups = core().filterMoneyRows(ledger, ym, { ...f, hideTransfers: ledger.settings.hideTransfers });
    const count = groups.reduce((n, g) => n + g.rows.length, 0);
    const monthTx = core().transactionsInMonth(ledger, ym);
    const currencies = [...new Set(monthTx.map(tx => tx.originalCurrency || tx.currency))];
    const opt = (v, label, sel) => `<option value="${esc(v)}" ${v === sel ? "selected" : ""}>${esc(label)}</option>`;
    const accounts = ledger.accounts.filter(a => !a.archived);
    return `<article class="module-card money-card" data-module="money-list">
      <header class="module-header"><div><span class="kicker">${t("全部记录", "All entries", "Alle Einträge")}</span><h3 class="module-title">${esc(t(`${count} 笔记录`, `${count} entries`, `${count} Einträge`))}</h3></div></header>
      <div class="money-filters">
        <input class="money-input money-search" type="search" data-filter="search" value="${esc(f.search)}" placeholder="${esc(t("搜索备注或类别", "Search notes or categories", "Notiz oder Kategorie suchen"))}" aria-label="${esc(t("搜索", "Search", "Suche"))}">
        <select class="money-select" data-filter="categoryId" aria-label="${esc(t("类别", "Category", "Kategorie"))}">${categoryFilterOptions(ledger, f.categoryId)}</select>
        <select class="money-select" data-filter="currency" aria-label="${esc(t("币种", "Currency", "Währung"))}">${opt("", t("全部币种", "All currencies", "Alle Währungen"), f.currency)}${currencies.map(c => opt(c, c, f.currency)).join("")}</select>
        ${accounts.length > 1 ? `<select class="money-select" data-filter="accountId" aria-label="${esc(t("账户", "Account", "Konto"))}">${opt("", t("全部账户", "All accounts", "Alle Konten"), f.accountId)}${accounts.map(a => opt(a.id, a.name, f.accountId)).join("")}</select>` : ""}
        <select class="money-select" data-filter="source" aria-label="${esc(t("来源", "Source", "Quelle"))}">${opt("", t("全部来源", "All sources", "Alle Quellen"), f.source)}${opt("manual", t("手记", "Manual", "Manuell"), f.source)}${opt("import", t("导入", "Imported", "Importiert"), f.source)}</select>
        <label class="money-toggle"><span>${t("隐藏转账", "Hide transfers", "Umbuchungen ausblenden")}</span><button class="money-switch" type="button" role="switch" aria-checked="${ledger.settings.hideTransfers}" data-setting-toggle="hideTransfers"></button></label>
      </div>
      ${groups.length ? groups.map(g => `<section class="money-day-group">
        <h4><span>${esc(dayLabel(g.date))}</span><span class="money-num">${g.expenseMinor ? esc(t(`当日支出 ${money(g.expenseMinor)}`, `Spent ${money(g.expenseMinor)}`, `Ausgaben ${money(g.expenseMinor)}`)) : ""}</span></h4>
        <ul class="money-rows">${g.rows.map(tx => txRow(ledger, tx, false)).join("")}</ul>
      </section>`).join("") : `<p class="money-empty">${Object.values(f).some(Boolean) ? t("没有符合筛选的记录。", "No entries match these filters.", "Keine passenden Einträge.") : t("这个月还没有记录。", "No entries this month.", "Noch keine Einträge in diesem Monat.")}</p>`}
      <div class="money-list-foot"><span>${t("外币按记账当日汇率折算", "Foreign amounts converted at the entry-date rate", "Fremdwährungen zum Kurs am Buchungstag umgerechnet")}</span></div>
    </article>`;
  }

  function settingsHtml(ledger) {
    const s = ledger.settings;
    const sw = (key, label, hint) => `<div class="money-setting"><label class="money-toggle"><span>${label}</span><button class="money-switch" type="button" role="switch" aria-checked="${Boolean(s[key])}" data-setting-toggle="${key}"></button></label>${hint ? `<p class="money-hint">${hint}</p>` : ""}</div>`;
    const hint = core().budgetHint(ledger, nav.month);
    const kinds = { checking: t("活期", "Checking", "Girokonto"), credit: t("信用卡", "Credit card", "Kreditkarte"), savings: t("储蓄", "Savings", "Sparkonto"), cash: t("现金", "Cash", "Bargeld") };
    return `<article class="module-card money-card money-settings-card" data-module="money-settings" id="moneySettings">
      <header class="module-header"><div><span class="kicker">${t("记账设置", "Money settings", "Einstellungen")}</span><h3 class="module-title">${t("币种、预算与类别", "Currency, budget & categories", "Währung, Budget & Kategorien")}</h3></div></header>
      <div class="money-settings-grid">
        <section><h4>${t("币种与汇率", "Currency & rates", "Währung & Kurse")}</h4>
          <div class="money-setting"><label class="money-toggle"><span>${t("默认币种", "Default currency", "Standardwährung")}</span><select class="money-select" data-setting="defaultCurrency">${CURRENCIES.map(c => `<option ${c === s.defaultCurrency ? "selected" : ""}>${c}</option>`).join("")}</select></label></div>
          ${sw("perEntryCurrency", t("每笔可选币种", "Currency per entry", "Währung pro Eintrag"), t("开启后，记一笔时可单独选币种，统计按默认币种折算。", "Pick a currency per entry; totals convert to the default.", "Pro Eintrag wählbar; Summen in Standardwährung."))}
          ${sw("autoFx", t("自动获取汇率", "Fetch rates automatically", "Kurse automatisch holen"), t("欧洲央行参考汇率（frankfurter.dev），周末取上一个工作日；离线时用上次的汇率并标为“估算”。", "ECB reference rates via frankfurter.dev; offline uses the last cached rate marked “estimate”.", "EZB-Referenzkurse über frankfurter.dev; offline letzter Kurs als „Schätzung“."))}
        </section>
        <section><h4>${t("月度预算", "Monthly budget", "Monatsbudget")}</h4>
          <div class="money-setting"><label class="money-toggle"><span>${t("可变支出预算", "Variable spending budget", "Budget variable Ausgaben")}</span><input class="money-input money-budget-input" inputmode="decimal" data-setting="monthlyBudgetMinor" value="${s.monthlyBudgetMinor ? esc((s.monthlyBudgetMinor / 100).toFixed(0)) : ""}" placeholder="${esc(t("未设置", "Off", "Aus"))}"></label>
          <p class="money-hint">${hint ? t(`参考：近 3 个月中位数 ${money(hint, null, 0)}（不会自动套用）。留空即关闭。`, `Reference: 3-month median ${money(hint, null, 0)} (never applied automatically). Empty = off.`, `Richtwert: 3-Monats-Median ${money(hint, null, 0)} (nie automatisch). Leer = aus.`) : t("至少有 2 个完整月份后，这里会给出参考值。留空即关闭。", "A reference appears after 2 full months. Empty = off.", "Richtwert nach 2 vollen Monaten. Leer = aus.")}</p></div>
          <button class="money-manage-row" type="button" data-open-categories><span>${t("类别", "Categories", "Kategorien")}</span><span aria-hidden="true">›</span></button>
          <p class="money-hint">${t("分组、颜色、固定开销和自动归类规则。", "Groups, colours, fixed costs and category rules.", "Gruppen, Farben, Fixkosten und Regeln.")}</p>
        </section>
        <section>
          <h4>${t("我的姓名", "My name", "Mein Name")}</h4>
          <label class="money-field"><span>${t("我的姓名（可选）。只有一边出现、且对方姓名一致时，预勾选为可能是自己账户转账", "My name(s), optional. A one-sided row paid to this name is pre-checked as a possible own transfer", "Mein Name, optional. Eine einzelne Zeile an diesen Namen ist als mögliche eigene Umbuchung vorausgewählt")}</span><input class="money-input" data-setting="ownerNames" value="${esc((s.ownerNames || []).join(", "))}" autocomplete="name"></label>
          <h4>${t("账户", "Accounts", "Konten")}</h4>
          <button class="secondary-button money-import-settings" type="button" data-money-import>${t("导入银行账单", "Import bank statement", "Kontoauszug importieren")}</button>
          <ul class="money-rules money-account-list">${ledger.accounts.filter(a => !a.archived).map(a => {
            const B = bank();
            const bal = B?.accountBalance ? B.accountBalance(ledger, a.id) : 0;
            const clos = ledger.meta.bankStatementClosing?.[a.id];
            let warn = "";
            if (B?.checkClosingBalance && clos?.closingBalanceMinor != null) {
              const chk = B.checkClosingBalance(ledger, a.id, clos.closingBalanceMinor, clos.asOfDate || "");
              if (chk.warning) warn = `<p class="money-import-warn">${t(`账单期末余额 ${money(clos.closingBalanceMinor)} 与当前余额 ${money(chk.actual)} 相差 ${money(Math.abs(chk.diff))}`, `Statement closing ${money(clos.closingBalanceMinor)} differs from balance ${money(chk.actual)} by ${money(Math.abs(chk.diff))}`, `Kontoauszug-Saldo ${money(clos.closingBalanceMinor)} weicht um ${money(Math.abs(chk.diff))} vom Saldo ${money(chk.actual)} ab`)}</p>`;
            }
            return `<li><span class="money-rule-key">${esc(a.name)}</span><span class="money-hint">${esc(kinds[a.kind] || a.kind)} · ${t("余额", "Balance", "Saldo")} ${esc(money(bal, a.currency))} · ${t("期初", "opening", "Anfang")} ${esc(money(a.openingBalanceMinor || 0, a.currency))}</span>${warn}</li>`;
          }).join("")}</ul>
          <h4>${t("导入记录", "Import history", "Importverlauf")}</h4>
          ${(() => {
            const batches = (ledger.meta.importBatches || []).slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            if (!batches.length) return `<p class="money-hint">${t("还没有导入记录。", "No imports yet.", "Noch keine Importe.")}</p>`;
            return `<ul class="money-rules money-import-history">${batches.map(b => {
              const acc = ledger.accounts.find(a => a.id === b.accountId);
              const n = (b.newTxIds?.length || 0) + (b.merges?.length || 0);
              const when = b.createdAt ? dayLabel(ctx.iso(new Date(b.createdAt)), false) : "—";
              return `<li><span class="money-rule-key">${esc(when)} · ${esc(acc?.name || t("账户", "Account", "Konto"))}</span><span class="money-hint">${esc(t(`${n} 笔`, `${n} entries`, `${n} Buchungen`))}</span><button class="secondary-button money-import-undo" type="button" data-import-undo="${esc(b.id)}">${t("撤销", "Undo", "Rückgängig")}</button></li>`;
            }).join("")}</ul>`;
          })()}
          <form class="money-account-form" data-account-form>
            <input class="money-input" name="name" required placeholder="${esc(t("账户名称", "Account name", "Kontoname"))}" aria-label="${esc(t("账户名称", "Account name", "Kontoname"))}">
            <select class="money-select" name="kind">${Object.entries(kinds).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("")}</select>
            <button class="secondary-button" type="submit">${t("添加", "Add", "Hinzufügen")}</button>
          </form>
        </section>
      </div>
    </article>`;
  }

  /* ---------- charts ---------- */
  function disposeCharts() {
    Object.keys(charts).forEach(k => { charts[k]?.dispose?.(); delete charts[k]; });
  }

  function chartBase() {
    return {
      animationDuration: document.documentElement.classList.contains("motion-reduced") ? 0 : 500,
      textStyle: { fontFamily: css("--font-body") || "sans-serif" },
      tooltip: { backgroundColor: css("--ll-surface-float") || "#fff", borderColor: css("--desk-border") || "#ccc", textStyle: { color: css("--desk-text"), fontSize: 12 }, extraCssText: "border-radius:12px;box-shadow:0 10px 30px #1d2a3a22;" },
    };
  }

  function barAxis(days) {
    const n = days.length;
    const ticks = [0, 6, 13, 20, 27, n - 1];
    return {
      xAxis: { type: "category", data: days.map(d => String(Number(d.slice(8, 10)))), axisLine: { lineStyle: { color: css("--desk-border") } }, axisTick: { show: false }, axisLabel: { color: css("--desk-muted"), fontSize: 11, interval: i => ticks.includes(i) } },
      yAxis: { type: "value", splitNumber: 3, axisLabel: { color: css("--desk-muted"), fontSize: 11, formatter: v => money(v * 100, null, 0) }, splitLine: { lineStyle: { color: css("--desk-border"), type: [3, 4] } } },
    };
  }

  const resolveColor = v => (v.startsWith("var(") ? css(v.slice(4, -1)) : v);

  function drawCharts(host, ledger, mm) {
    const ec = root.echarts;
    if (!ec) return;
    const donutEl = host.querySelector("#moneyDonut");
    if (donutEl) {
      charts.donut = ec.init(donutEl);
      const total = mm.expenseMinor;
      charts.donut.setOption({
        ...chartBase(),
        tooltip: { ...chartBase().tooltip, trigger: "item", formatter: p => `<b>${esc(p.name)}</b><br>${esc(money(p.value * 100))} · ${Math.round(p.percent)}%` },
        series: [{
          type: "pie", radius: ["58%", "86%"], padAngle: 2, itemStyle: { borderRadius: 6 },
          label: { show: true, position: "center", formatter: () => `{a|${t("总支出", "Spending", "Ausgaben")}}\n{b|${money(total, null, 0)}}`, rich: { a: { color: css("--desk-muted"), fontSize: 12, lineHeight: 20 }, b: { color: css("--desk-text"), fontSize: 22, fontWeight: 650, lineHeight: 30 } } },
          emphasis: { scale: true, scaleSize: 6, label: { show: true } }, labelLine: { show: false },
          data: spendRollup(ledger, mm.categories).map(c => ({ name: catName(ledger, c.categoryId), value: c.amountMinor / 100, itemStyle: { color: resolveColor(catColor(ledger, c.categoryId)) }, categoryId: c.categoryId })),
        }],
      });
      charts.donut.on("click", p => { ui.drill = p.data.categoryId; render(); });
      host.querySelectorAll(".money-cat-row").forEach(b => {
        const i = Number(b.dataset.idx);
        b.addEventListener("mouseenter", () => charts.donut?.dispatchAction({ type: "highlight", dataIndex: i }));
        b.addEventListener("mouseleave", () => charts.donut?.dispatchAction({ type: "downplay", dataIndex: i }));
      });
    }
    const drillEl = host.querySelector("#moneyDrillChart");
    if (drillEl) {
      const byDay = mm.days.map(d => 0);
      core().transactionsInMonth(ledger, mm.ym).forEach(tx => {
        if (tx.categoryId === ui.drill && tx.amountMinor < 0 && !tx.transfer && tx.currency === ledger.settings.defaultCurrency) byDay[Number(tx.date.slice(8, 10)) - 1] += -tx.amountMinor / 100;
      });
      charts.drill = ec.init(drillEl);
      charts.drill.setOption({
        ...chartBase(), grid: { left: 52, right: 8, top: 10, bottom: 24 }, ...barAxis(mm.days.map(d => d.date)),
        tooltip: { ...chartBase().tooltip, trigger: "axis", axisPointer: { type: "shadow" }, formatter: p => `${esc(dayLabel(mm.days[p[0].dataIndex].date))}<br><b>${esc(money(Math.round(p[0].value * 100)))}</b>` },
        series: [{ type: "bar", data: byDay, barWidth: "56%", itemStyle: { color: resolveColor(catColor(ledger, ui.drill)), borderRadius: [4, 4, 0, 0] } }],
      });
    }
    const dailyEl = host.querySelector("#moneyDaily");
    if (dailyEl) {
      const vals = mm.days.map(d => (d.variableMinor + (ui.includeFixed ? d.fixedMinor : 0)) / 100);
      const avg = vals.reduce((a, b) => a + b, 0) / elapsedDays(mm);
      const picked = mm.days.findIndex(d => d.date === ui.pickedDay);
      charts.daily = ec.init(dailyEl);
      charts.daily.setOption({
        ...chartBase(), grid: { left: 56, right: 12, top: 18, bottom: 26 }, ...barAxis(mm.days.map(d => d.date)),
        tooltip: { ...chartBase().tooltip, trigger: "axis", axisPointer: { type: "shadow", shadowStyle: { color: css("--desk-border") } }, formatter: p => `${esc(dayLabel(mm.days[p[0].dataIndex].date))}<br><b>${esc(money(Math.round(p[0].value * 100)))}</b>` },
        series: [{
          type: "bar", barWidth: "62%",
          data: vals.map((v, k) => ({ value: v, itemStyle: { color: k === picked ? css("--desk-teal") : (v > avg * 2.2 ? css("--cat-5") : css("--cat-1")), opacity: picked < 0 || k === picked ? 1 : 0.45, borderRadius: [5, 5, 0, 0] } })),
          markLine: avg ? { silent: true, symbol: "none", lineStyle: { color: css("--desk-muted"), type: [4, 4] }, label: { color: css("--desk-muted"), formatter: `${t("日均", "avg", "Ø")} ${money(Math.round(avg * 100), null, 0)}`, position: "insideEndTop", fontSize: 11 }, data: [{ yAxis: +avg.toFixed(2) }] } : undefined,
        }],
      });
      charts.daily.getZr().on("click", e => {
        const pt = [e.offsetX, e.offsetY];
        if (!charts.daily.containPixel("grid", pt)) return;
        const k = charts.daily.convertFromPixel({ seriesIndex: 0 }, pt)[0];
        if (k >= 0 && k < mm.days.length) { ui.pickedDay = mm.days[k].date === ui.pickedDay ? "" : mm.days[k].date; render(); }
      });
    }
  }

  /* ---------- bank import wizard ---------- */
  const IMPORT_FIELDS = ["date", "bookingDate", "payee", "text", "amount", "soll", "haben", "status", "currency", "bankId"];
  const PRESET_LABEL = {
    sparkasse: "Sparkasse", ing: "ING", dkb: "DKB", n26: "N26", comdirect: "comdirect",
    commerzbank: "Commerzbank", deutsche: "Deutsche Bank", postbank: "Postbank",
    kreditkarte: "Kreditkarte", "amex-de": "American Express", generic: "",
  };
  function fieldLabel(key) {
    const m = {
      date: t("日期", "Date", "Datum"), bookingDate: t("记账日", "Booking date", "Buchungstag"),
      payee: t("对方", "Payee", "Partner"), text: t("用途说明", "Description", "Verwendungszweck"),
      amount: t("金额", "Amount", "Betrag"), soll: t("支出列", "Debit column", "Soll"), haben: t("收入列", "Credit column", "Haben"),
      status: t("状态", "Status", "Status"), currency: t("币种", "Currency", "Währung"), bankId: t("银行参考号", "Bank reference", "Bankreferenz"),
    };
    return m[key] || key;
  }
  function presetLabel(id) {
    if (id && id !== "generic" && PRESET_LABEL[id]) return PRESET_LABEL[id];
    return id === "generic" ? t("未识别的银行", "Unrecognised bank", "Unbekannte Bank") : (id || t("未识别的银行", "Unrecognised bank", "Unbekannte Bank"));
  }
  function mappingReady(m) {
    if (!m || !Number.isInteger(m.date) || m.date < 0) return false;
    if (Number.isInteger(m.amount) && m.amount >= 0) return true;
    return (Number.isInteger(m.soll) && m.soll >= 0) || (Number.isInteger(m.haben) && m.haben >= 0);
  }
  function guessImportCategory(ledger, row) {
    if (row.categoryId) return row.categoryId;
    const B = bank();
    if (B?.guessCategory) return B.guessCategory(ledger, row).categoryId || "";
    const note = [row.payee, row.text].filter(Boolean).join(" — ") || row.payee || row.text || "";
    return core().guessCategory(ledger, note, row.amountMinor).categoryId || "";
  }
  function importRowNote(row) {
    return [row.payee, row.text].filter(Boolean).join(" — ") || row.payee || row.text || "";
  }
  function countUncategorized(imp) {
    const plan = imp?.plan;
    if (!plan) return 0;
    const pick = ix => imp.picks?.[ix];
    const active = (item, defaultInclude) => {
      const p = pick(item.index);
      if (!p) return defaultInclude;
      return p.include !== false && !p.mergeTxId;
    };
    let n = 0;
    (plan.new || []).forEach(item => { if (active(item, true) && !pick(item.index)?.categoryId) n++; });
    (plan.possibleDuplicates || []).forEach(item => { if (active(item, false) && !pick(item.index)?.categoryId) n++; });
    (plan.matched || []).forEach(item => { if (active(item, true) && !pick(item.index)?.categoryId) n++; });
    return n;
  }
  async function copyImportPrompt(text) {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else throw new Error("no clipboard");
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
  }
  function importSheetEl() {
    let el = document.getElementById("moneyImportSheetRoot");
    if (!el) {
      el = document.createElement("div");
      el.id = "moneyImportSheetRoot";
      document.body.appendChild(el);
    }
    return el;
  }
  function closeImportWizard() {
    closeCategoryPicker(false);
    const el = document.getElementById("moneyImportSheetRoot");
    if (!el) return;
    el.classList.remove("money-open");
    ui.import = null;
    setTimeout(() => { if (!ui.import) el.innerHTML = ""; }, 220);
  }
  function defaultAccountId(ledger) {
    return (ledger.accounts || []).find(a => !a.archived)?.id || "";
  }
  function openImportWizard(opts = {}) {
    if (ui.sheetHost === "cats") closeCategorySheet();
    else closeSheet();
    const ledger = ledgerState();
    ui.import = {
      open: true, step: 1,
      accountId: opts.accountId || defaultAccountId(ledger),
      files: [], pasteText: "",
      parsedFiles: [], pasteParsed: null, mapQueue: [], mapAt: 0, mapLabel: "",
      parsed: null, mapping: {}, rows: [], plan: null, sourceChecks: [], unreadable: [],
      mappingOpen: false, skipPending: true,
      picks: {}, transferPicks: {},
      aiPromptOpen: false, promptCopied: false,
      error: "",
    };
    mountImportSheet();
  }
  function showMapFile() {
    const imp = ui.import;
    const file = imp?.mapQueue?.[imp.mapAt];
    if (!file) return;
    imp.parsed = file.parsed;
    imp.mapping = file.mapping;
    imp.mapLabel = file.name;
    imp.mappingOpen = true;
  }
  function rebuildImportPlan() {
    const imp = ui.import;
    const B = bank();
    if (!imp || !B) return;
    const ledger = ledgerState();
    if (!imp.accountId) imp.accountId = defaultAccountId(ledger);
    const lang = ctx.lang?.() || "en";
    const rows = [];
    const sourceChecks = [];
    const unreadable = [];
    for (const f of imp.parsedFiles || []) {
      const part = B.applyMapping(f.parsed, f.mapping, imp.accountId, { ledger, lang, sourceId: f.sourceId });
      rows.push(...part);
      (f.parsed.unreadable || []).forEach(u => unreadable.push({ ...u, source: f.name }));
      sourceChecks.push({ name: f.name, parsed: part.filter(r => !r.pending).length, total: B.sumBookedRows(part) });
    }
    if (imp.pasteParsed?.unified) {
      const part = B.applyMapping(imp.pasteParsed, {}, imp.accountId, { ledger, lang, sourceId: "ai" });
      rows.push(...part);
      sourceChecks.push({
        name: t("AI 粘贴", "AI paste", "KI-Einfügen"),
        parsed: part.filter(r => !r.pending).length,
        total: B.sumBookedRows(part),
        aiReport: imp.pasteParsed.meta?.aiReport || null,
      });
    }
    imp.rows = rows;
    imp.unreadable = unreadable;
    imp.sourceChecks = sourceChecks;
    imp.plan = B.planImport(ledger, imp.accountId, rows, { skipPending: imp.skipPending });
    imp.picks = {};
    imp.transferPicks = {};
    const pickBase = (item, extra) => ({ categoryId: guessImportCategory(ledger, item.row), merchantKey: core().merchantKey(importRowNote(item.row)), ...extra });
    (imp.plan.matched || []).forEach(item => {
      imp.picks[item.index] = pickBase(item, { kind: "matched", include: true, mergeTxId: item.txId });
    });
    (imp.plan.new || []).forEach(item => {
      imp.picks[item.index] = pickBase(item, { kind: "new", include: true });
    });
    (imp.plan.possibleDuplicates || []).forEach(item => {
      imp.picks[item.index] = pickBase(item, { kind: "duplicate", include: false });
    });
    (imp.plan.suggestions || []).forEach(item => {
      if (!imp.picks[item.index]) imp.picks[item.index] = pickBase(item, { kind: "new", include: true });
      imp.picks[item.index].suggest = true;
      imp.picks[item.index].suggestTxId = item.candidates?.[0]?.txId || item.candidates?.[0] || "";
    });
    (imp.plan.transfers || []).forEach((tr, i) => { imp.transferPicks[i] = true; });
  }
  function importCounts() {
    const imp = ui.import;
    const plan = imp?.plan;
    if (!plan) return { new: 0, duplicate: 0, offset: 0, skipped: 0, uncategorized: 0, unreadable: 0 };
    const picks = imp.picks || {};
    return {
      new: (plan.new || []).filter(n => picks[n.index]?.include && !picks[n.index]?.mergeTxId).length,
      duplicate: (plan.possibleDuplicates || []).length,
      offset: (plan.transfers || []).filter(t => t.kind === "withinFile" || t.kind === "ledger").length,
      skipped: (plan.skipped || []).length,
      uncategorized: countUncategorized(imp),
      unreadable: (imp.unreadable || []).length,
    };
  }
  function importCommitCount() {
    const imp = ui.import;
    const plan = imp?.plan;
    if (!plan) return 0;
    const picks = imp.picks || {};
    let n = (plan.matched || []).filter(m => picks[m.index]?.include !== false).length;
    n += (plan.new || []).filter(x => picks[x.index]?.include && !picks[x.index]?.mergeTxId).length;
    n += (plan.possibleDuplicates || []).filter(x => picks[x.index]?.include).length;
    n += Object.values(picks).filter(p => p.mergeTxId && p.kind !== "matched").length;
    for (const tr of plan.transfers || []) n += tr.kind === "withinFile" ? 2 : 1;
    return n;
  }
  function previewCells(parsed, mapping, limit = 5) {
    const cols = parsed.columns || [];
    const rows = (parsed.rows || []).slice(0, limit);
    return rows.map(r => IMPORT_FIELDS.map(f => {
      const ix = mapping[f];
      return Number.isInteger(ix) && ix >= 0 ? (r[ix] ?? "") : "";
    }));
  }
  function txLabel(ledger, txId) {
    const tx = ledger.transactions.find(t => t.id === txId);
    if (!tx) return "";
    return `${dayLabel(tx.date, false)} · ${tx.note || catName(ledger, tx.categoryId)} · ${money(tx.amountMinor, tx.currency)}`;
  }
  /* ---------- one category picker ---------- */
  const pickerBinds = [];
  let pickerOpen = null;

  function beginPickers() {
    closeCategoryPicker(false);
    pickerBinds.length = 0;
  }

  function categoryPickerRows(categories, opts = {}) {
    const query = String(opts.query || "").trim().toLowerCase();
    const kind = opts.kind || "";
    const leaves = (categories || []).filter(c => c && !c.archived && !c.isGroup && (!kind || c.kind === kind));
    const blob = c => `${c.name || ""} ${c.nameZh || ""} ${c.nameDe || ""}`.toLowerCase();
    const match = c => !query || blob(c).includes(query);
    const shown = new Set();
    const sections = [];
    if (!query) {
      const items = [];
      for (const id of opts.recentIds || []) {
        if (items.length >= 5) break;
        const c = leaves.find(x => x.id === id);
        if (!c || shown.has(c.id)) continue;
        shown.add(c.id);
        items.push(c);
      }
      if (items.length) sections.push({ id: "recent", items });
    }
    for (const g of (categories || []).filter(c => c && c.isGroup && !c.archived && (!kind || c.kind === kind))) {
      const items = leaves.filter(c => c.parentId === g.id && match(c) && !shown.has(c.id));
      items.forEach(c => shown.add(c.id));
      if (items.length) sections.push({ id: g.id, label: g, items });
    }
    const expenseTop = leaves.filter(c => c.kind !== "income" && !c.parentId && match(c) && !shown.has(c.id));
    expenseTop.forEach(c => shown.add(c.id));
    if (expenseTop.length) sections.push({ id: "top", items: expenseTop });
    const income = leaves.filter(c => c.kind === "income" && match(c) && !shown.has(c.id));
    if (income.length) sections.push({ id: "income", items: income });
    return sections;
  }

  function recentCategoryIds(ledger) {
    const ids = [];
    const txs = [...(ledger.transactions || [])].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0) || String(b.date).localeCompare(String(a.date)));
    for (const tx of txs) {
      if (ids.includes(tx.categoryId)) continue;
      const c = ledger.categories.find(x => x.id === tx.categoryId);
      if (!c || c.archived || c.isGroup) continue;
      ids.push(c.id);
      if (ids.length >= 5) break;
    }
    return ids;
  }

  function learnText(key, categoryId) {
    const name = catName(ledgerState(), categoryId);
    return t(`以后「${key}」都归为 ${name}`, `Always use ${name} for “${key}”`, `„${key}“ immer als ${name}`);
  }

  function categoryPicker({ value, kind, onPick, ledger, token, warn }) {
    const i = pickerBinds.push({ value: value || "", kind: kind || "", onPick, ledger, token: token || "" }) - 1;
    const label = value ? catName(ledger, value) : t("选择类别", "Choose category", "Kategorie wählen");
    return `<span class="money-picker${warn ? " is-uncat" : ""}" data-money-picker="${i}"><button type="button" class="money-picker-btn" data-picker-btn data-picker-token="${esc(token || "")}">${esc(label)}</button></span>`;
  }

  function bindCategoryPickers(scope) {
    scope.querySelectorAll("[data-picker-btn]").forEach(btn => btn.addEventListener("click", () => openBoundPicker(btn)));
  }

  function pickerPanel() {
    let el = document.getElementById("moneyPickerPanel");
    if (el) return el;
    el = document.createElement("div");
    el.id = "moneyPickerPanel";
    el.className = "money-picker-panel";
    el.hidden = true;
    el.innerHTML = `<input class="money-input" type="search" data-picker-search autocomplete="off"><div data-picker-list></div>`;
    document.body.appendChild(el);
    el.addEventListener("keydown", onPickerKey);
    el.querySelector("[data-picker-search]").addEventListener("input", e => {
      if (!pickerOpen) return;
      pickerOpen.query = e.target.value;
      pickerOpen.active = 0;
      paintPickerList();
    });
    document.addEventListener("pointerdown", e => {
      if (!pickerOpen) return;
      const panel = document.getElementById("moneyPickerPanel");
      if (panel?.contains(e.target) || pickerOpen.btn?.contains(e.target)) return;
      closeCategoryPicker(false);
    });
    return el;
  }

  function openBoundPicker(btn) {
    const spec = pickerBinds[Number(btn.closest("[data-money-picker]")?.dataset.moneyPicker)];
    if (!spec) return;
    closeCategoryPicker(false);
    pickerOpen = { btn, spec, query: "", active: 0, flat: [] };
    const panel = pickerPanel();
    panel.hidden = false;
    const input = panel.querySelector("[data-picker-search]");
    input.value = "";
    input.placeholder = t("搜索类别", "Search categories", "Kategorie suchen");
    input.setAttribute("aria-label", input.placeholder);
    paintPickerList();
    const wide = window.innerWidth >= 640;
    panel.classList.toggle("is-sheet", !wide);
    if (wide) {
      const r = btn.getBoundingClientRect();
      const width = 280;
      panel.style.width = `${width}px`;
      panel.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - width - 8))}px`;
      panel.style.top = `${r.bottom + 6}px`;
    } else {
      panel.style.width = "";
      panel.style.left = "";
      panel.style.top = "";
    }
    input.focus();
  }

  function paintPickerList() {
    if (!pickerOpen) return;
    const ledger = pickerOpen.spec.ledger || ledgerState();
    const sections = categoryPickerRows(ledger.categories, {
      query: pickerOpen.query, kind: pickerOpen.spec.kind, recentIds: recentCategoryIds(ledger),
    });
    const flat = [];
    const head = sec => {
      if (sec.id === "recent") return t("最近", "Recent", "Zuletzt");
      if (sec.id === "income") return t("收入", "Income", "Einnahmen");
      if (sec.label) return core().localizedCategoryName(sec.label, ctx.lang?.()) || sec.label.name;
      return t("其他", "Other", "Weitere");
    };
    const html = sections.map(sec => {
      const items = sec.items.map(c => {
        const idx = flat.push(c) - 1;
        const on = idx === pickerOpen.active ? " is-active" : "";
        return `<button type="button" class="money-picker-item${on}" data-picker-item="${idx}" style="--c:${catColor(ledger, c.id)}"><i class="money-dot"></i>${esc(core().localizedCategoryName(c, ctx.lang?.()) || c.name)}</button>`;
      }).join("");
      return `<div class="money-picker-sec"><div class="money-picker-head">${esc(head(sec))}</div>${items}</div>`;
    }).join("") || `<p class="money-hint">${esc(t("没有匹配的类别", "No matching category", "Keine passende Kategorie"))}</p>`;
    pickerOpen.flat = flat;
    const list = pickerPanel().querySelector("[data-picker-list]");
    list.innerHTML = html;
    list.querySelectorAll("[data-picker-item]").forEach(b => b.addEventListener("click", () => pickPicker(Number(b.dataset.pickerItem))));
    list.querySelector(".is-active")?.scrollIntoView({ block: "nearest" });
  }

  function pickPicker(i) {
    const c = pickerOpen?.flat?.[i];
    if (!c) return;
    const { btn, spec } = pickerOpen;
    btn.textContent = catName(spec.ledger || ledgerState(), c.id);
    const onPick = spec.onPick;
    closeCategoryPicker(true);
    onPick?.(c.id);
  }

  function onPickerKey(e) {
    if (!pickerOpen) return;
    const n = pickerOpen.flat?.length || 0;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeCategoryPicker(true); return; }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!n) return;
      pickerOpen.active = (pickerOpen.active + (e.key === "ArrowDown" ? 1 : -1) + n) % n;
      paintPickerList();
      return;
    }
    if (e.key === "Enter") { e.preventDefault(); pickPicker(pickerOpen.active); }
  }

  function closeCategoryPicker(returnFocus) {
    const btn = pickerOpen?.btn;
    pickerOpen = null;
    const panel = document.getElementById("moneyPickerPanel");
    if (panel) panel.hidden = true;
    if (returnFocus && btn?.isConnected) btn.focus();
  }

  /** Checked rule copies its category onto other rows of the same merchant that the user has not set. */
  function applySameMerchantCategory(picks, sourceIndex) {
    const src = picks?.[sourceIndex] ?? picks?.[String(sourceIndex)];
    if (!src?.learn || !src.learnKey || !src.categoryId) return picks;
    const next = { ...picks };
    for (const [k, p] of Object.entries(picks)) {
      if (String(k) === String(sourceIndex) || !p || p.learn || p.userCat) continue;
      if (p.merchantKey && p.merchantKey === src.learnKey) next[k] = { ...p, categoryId: src.categoryId };
    }
    return next;
  }

  function mountImportSheet() {
    const imp = ui.import;
    if (!imp?.open || !ctx || !bank()) return;
    beginPickers();
    const B = bank();
    const ledger = ledgerState();
    const root_ = importSheetEl();
    const step = imp.step;
    const steps = [1, 2, 3].map(n => `<span class="money-import-step${n === step ? " is-on" : n < step ? " is-done" : ""}">${n}</span>`).join("");
    let body = "";
    let wide = false;
    if (step === 1) {
      const prompt = B.buildAiImportPrompt ? B.buildAiImportPrompt(ledger, { lang: ctx.lang?.() || "en" }) : "";
      const fileList = (imp.files || []).map((f, i) => `<li><span>${esc(f.name)}</span><button class="money-import-file-x" type="button" data-import-file-remove="${i}" aria-label="${esc(t("移除", "Remove", "Entfernen"))}">×</button></li>`).join("");
      body = `<p class="sub">${t("放入这个月的一份或多份 CSV，或粘贴 AI 整理的结果。不必先设置账户。", "Drop one or more CSV statements for the month, or paste an AI result. No account setup needed.", "Eine oder mehrere CSV-Auszüge dieses Monats ablegen, oder ein KI-Ergebnis einfügen. Kein Konto nötig.")}</p>
        <div class="money-import-ai-actions">
          <button class="secondary-button" type="button" data-import-copy-prompt>${t("复制 AI 提示词", "Copy AI prompt", "KI-Prompt kopieren")}</button>
          ${imp.promptCopied ? `<span class="money-hint money-import-copied">${t("已复制", "Copied", "Kopiert")}</span>` : ""}
        </div>
        <details class="money-import-prompt" ${imp.aiPromptOpen ? "open" : ""}><summary>${t("查看提示词", "View prompt", "Prompt anzeigen")}</summary>
          <textarea class="money-textarea money-import-prompt-text" readonly rows="8">${esc(prompt)}</textarea>
        </details>
        <label class="money-import-drop"><input type="file" accept=".csv,text/csv" data-import-file multiple hidden><span>${t("点选或拖入一个或多个 .csv", "Tap or drop one or more .csv files", "Eine oder mehrere .csv-Dateien wählen oder ablegen")}</span></label>
        ${fileList ? `<ul class="money-import-files">${fileList}</ul>` : ""}
        <label class="money-field"><span>${t("粘贴 AI 结果", "Paste AI result", "KI-Ergebnis einfügen")}</span>
          <textarea class="money-textarea" rows="5" data-import-paste placeholder="${esc(t("可含 ``` 代码块与 ROWS=/TOTAL= 行", "May include a ``` fence and ROWS=/TOTAL=", "Darf ```-Block und ROWS=/TOTAL= enthalten"))}">${esc(imp.pasteText || "")}</textarea>
        </label>
        <label class="money-toggle money-import-pending"><span>${t("跳过银行尚未入账的交易", "Skip pending rows", "Vorgemerkte überspringen")}</span><button class="money-switch" type="button" role="switch" aria-checked="${imp.skipPending}" data-import-skip-pending></button></label>`;
    } else if (step === 2 && imp.parsed) {
      const unsure = imp.parsed.presetId === "generic" || !mappingReady(imp.mapping);
      const cols = imp.parsed.columns || [];
      const colOpts = (sel, ix) => `<select class="money-select" data-map-field="${esc(sel)}">${`<option value="-1">${t("（不对应）", "(none)", "(keine)")}</option>`}${cols.map((c, i) => `<option value="${i}" ${i === ix ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>`;
      const sure = !unsure && !imp.mappingOpen;
      const preview = previewCells(imp.parsed, imp.mapping);
      body = `<p class="money-import-detect">${esc(t(`正在对应：${imp.mapLabel || ""}（${(imp.mapAt || 0) + 1}/${(imp.mapQueue || []).length || 1}）`, `Mapping: ${imp.mapLabel || ""} (${(imp.mapAt || 0) + 1}/${(imp.mapQueue || []).length || 1})`, `Zuordnung: ${imp.mapLabel || ""} (${(imp.mapAt || 0) + 1}/${(imp.mapQueue || []).length || 1})`))} · ${t("识别为：", "Detected as: ", "Erkannt als: ")}<strong>${esc(presetLabel(imp.parsed.presetId))}</strong></p>
        ${sure ? `<button class="money-link money-import-map-toggle" type="button" data-import-map-toggle>${t("列对应关系（已自动识别）", "Column mapping (auto-detected)", "Spaltenzuordnung (automatisch)")}</button>` : ""}
        <div class="money-import-map${sure ? " is-collapsed" : ""}" data-import-map-panel>
          <table class="money-import-table"><thead><tr>${IMPORT_FIELDS.map(f => `<th>${esc(fieldLabel(f))}<div>${colOpts(f, imp.mapping[f])}</div></th>`).join("")}</tr></thead>
          <tbody>${preview.map(row => `<tr>${row.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>
        </div>`;
      wide = true;
    } else if (step === 3 && imp.plan) {
      const unread = imp.unreadable || [];
      const counts = importCounts();
      const chips = [
        ["new", t("新增", "New", "Neu"), counts.new],
        ["offset", t("内部抵消", "Internal offsets", "Interne Verrechnung"), counts.offset],
        ["duplicate", t("可能重复", "Possible duplicate", "Mögliches Duplikat"), counts.duplicate],
        ["uncategorized", t("待分类", "Uncategorized", "Nicht kategorisiert"), counts.uncategorized],
        ["unreadable", t("无法读取", "Unreadable", "Nicht lesbar"), counts.unreadable],
        ["skipped", t("已跳过", "Skipped", "Übersprungen"), counts.skipped],
      ];
      body = `<div class="money-import-summary">${chips.map(([k, label, n]) => `<span class="money-chip${k === "uncategorized" && n ? " money-chip-warn" : ""}" style="--c:var(--cat-${k === "uncategorized" && n ? "4" : "7"})">${esc(label)} <b>${n}</b></span>`).join("")}</div>`;
      for (const s of imp.sourceChecks || []) {
        body += `<p class="money-import-ai-check" data-import-rowcheck>${esc(t(
          `${s.name}：已解析 ${s.parsed} 行，合计 ${(s.total / 100).toFixed(2)}`,
          `${s.name}: parsed ${s.parsed} rows, total ${(s.total / 100).toFixed(2)}`,
          `${s.name}: ${s.parsed} Zeilen gelesen, Summe ${(s.total / 100).toFixed(2)}`,
        ))}</p>`;
        if (s.aiReport) {
          const mismatch = s.aiReport.rows !== s.parsed || s.aiReport.totalMinor !== s.total;
          body += `<p class="money-import-ai-check${mismatch ? " is-warn" : ""}">${esc(t(
            `AI 报告 ROWS=${s.aiReport.rows} TOTAL=${(s.aiReport.totalMinor / 100).toFixed(2)} · 实际解析 ${s.parsed} 行 / ${(s.total / 100).toFixed(2)}`,
            `AI reported ROWS=${s.aiReport.rows} TOTAL=${(s.aiReport.totalMinor / 100).toFixed(2)} · parsed ${s.parsed} rows / ${(s.total / 100).toFixed(2)}`,
            `KI meldet ROWS=${s.aiReport.rows} TOTAL=${(s.aiReport.totalMinor / 100).toFixed(2)} · geparst ${s.parsed} Zeilen / ${(s.total / 100).toFixed(2)}`,
          ))}</p>`;
        }
      }
      const byDay = new Map();
      const push = (item, kind) => {
        const d = item.row?.date || "";
        if (!byDay.has(d)) byDay.set(d, []);
        byDay.get(d).push({ item, kind });
      };
      (imp.plan.skipped || []).forEach(item => push(item, "skipped"));
      (imp.plan.matched || []).forEach(item => push(item, "matched"));
      (imp.plan.new || []).forEach(item => push(item, "new"));
      (imp.plan.possibleDuplicates || []).forEach(item => push(item, "duplicate"));
      const days = [...byDay.keys()].sort((a, b) => b.localeCompare(a));
      const reviewItem = ({ item, kind }) => {
        const pick = imp.picks[item.index] || { include: kind !== "duplicate", categoryId: guessImportCategory(ledger, item.row) };
        const row = item.row;
        const payee = row.payee || row.text || "—";
        const matched = kind === "matched";
        const skipped = kind === "skipped";
        const sug = pick.suggest && (imp.plan.suggestions || []).find(s => s.index === item.index);
        const include = skipped ? false : pick.include;
        const uncat = !skipped && !pick.categoryId;
        const learn = !skipped && pick.userCat && pick.learnKey
          ? `<label class="money-learn"><input type="checkbox" data-import-learn="${item.index}" ${pick.learn ? "checked" : ""}><span>${esc(learnText(pick.learnKey, pick.categoryId))}</span></label>`
          : "";
        return `<li class="money-import-row${uncat ? " is-uncategorized" : ""}" data-kind="${kind}" data-import-row="${item.index}">
          <label class="money-import-check">${skipped ? "" : `<input type="checkbox" data-import-pick="${item.index}" ${include ? "checked" : ""}>`}
          <span class="money-import-payee">${esc(payee)}</span>${row.sourceId ? `<span class="money-import-source">${esc(row.sourceId)}</span>` : ""}</label>
          <span class="money-num ${row.amountMinor > 0 ? "in" : ""}">${esc(money(row.amountMinor, row.currency))}</span>
          ${skipped ? `<span class="money-hint">${t("已跳过", "Skipped", "Übersprungen")}</span>` : categoryPicker({ value: pick.categoryId, kind: row.amountMinor > 0 ? "income" : "expense", ledger, token: `imp-${item.index}`, warn: uncat, onPick: id => setImportCategory(item.index, id) })}
          ${learn}
          ${matched ? `<span class="money-import-merge">${t("合并到：", "Merges with: ", "Verknüpft mit: ")}${esc(txLabel(ledger, pick.mergeTxId || item.txId))}</span>` : ""}
          ${sug ? `<label class="money-import-suggest"><input type="checkbox" data-import-merge="${item.index}" ${pick.mergeTxId ? "checked" : ""}>${t("与手记合并：", "Merge with: ", "Zusammenführen mit: ")}${esc(txLabel(ledger, pick.mergeTxId || pick.suggestTxId))}</label>` : ""}
        </li>`;
      };
      const dayHtml = days.map(day => {
        const items = byDay.get(day);
        if (!items?.length) return "";
        return `<section class="money-day-group"><h4><span>${esc(dayLabel(day))}</span></h4><ul class="money-import-review">${items.map(reviewItem).join("")}</ul></section>`;
      }).join("");
      const pairSide = row => row ? `<span class="money-import-pair-side"><span class="money-import-payee">${esc(row.payee || row.text || "—")}</span> <span class="money-num ${row.amountMinor > 0 ? "in" : ""}">${esc(money(row.amountMinor, row.currency))}</span> <span class="money-import-source">${esc(row.sourceId || "")}</span></span>` : "";
      const transferEntries = (imp.plan.transfers || []).map((tr, i) => ({ tr, i }));
      const offsetEntries = transferEntries.filter(e => e.tr.kind === "withinFile" || e.tr.kind === "ledger");
      const ownEntries = transferEntries.filter(e => e.tr.kind === "possible-own");
      const offsetHtml = offsetEntries.length ? `<section class="money-day-group"><h4>${t("内部抵消", "Internal offsets", "Interne Verrechnung")}</h4><p class="money-hint">${t("已勾选的两边都不计入收支。取消勾选则两笔都按普通收入或支出导入。", "Checked pairs stay out of income and expense. Uncheck to import both rows as normal income or expense.", "Angehakte Paare zählen nicht als Einnahme oder Ausgabe. Ohne Haken werden beide Zeilen normal gebucht.")}</p><ul class="money-import-review">${offsetEntries.map(({ tr, i }) => {
        const sides = tr.kind === "ledger"
          ? `${pairSide(tr.row)} ↔ <span class="money-import-source">${esc(txLabel(ledger, tr.txId))}</span>`
          : `${pairSide(tr.rowA)} ↔ ${pairSide(tr.rowB)}`;
        return `<li class="money-import-row"><label class="money-import-check"><input type="checkbox" data-import-transfer="${i}" ${imp.transferPicks[i] ? "checked" : ""}><span class="money-import-pair">${sides}</span></label></li>`;
      }).join("")}</ul></section>` : "";
      const ownHtml = ownEntries.length ? `<section class="money-day-group"><h4>${t("可能是自己账户转账", "Possibly own transfer", "Möglicherweise eigene Umbuchung")}</h4><p class="money-hint">${t("已勾选的记为转账。取消勾选则按普通收支导入。", "Checked rows import as transfers. Uncheck to import them as normal income or expense.", "Angehakte Zeilen werden als Umbuchung gebucht. Ohne Haken als normale Einnahme oder Ausgabe.")}</p><ul class="money-import-review">${ownEntries.map(({ tr, i }) => `<li class="money-import-row"><label class="money-import-check"><input type="checkbox" data-import-transfer="${i}" ${imp.transferPicks[i] ? "checked" : ""}><span>${esc(tr.row?.payee || tr.row?.text || "—")} · ${esc(money(tr.row?.amountMinor, tr.row?.currency))}</span>${tr.row?.sourceId ? `<span class="money-import-source">${esc(tr.row.sourceId)}</span>` : ""}</label></li>`).join("")}</ul></section>` : "";
      const unreadHtml = unread.length
        ? `<section class="money-day-group"><h4>${t("无法读取", "Unreadable", "Nicht lesbar")}</h4><ul class="money-import-review">${unread.map(u => `<li class="money-import-row"><span class="money-import-payee">${esc(u.raw || "")}</span>${u.source ? `<span class="money-import-source">${esc(u.source)}</span>` : ""}</li>`).join("")}</ul></section>`
        : "";
      body += offsetHtml + ownHtml + dayHtml + unreadHtml;
      wide = true;
    }
    root_.innerHTML = `<div class="money-scrim" data-close-import></div>
      <div class="money-sheet${wide ? " money-sheet-wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="moneyImportTitle">
        <div class="money-import-steps" aria-hidden="true">${steps}</div>
        <h3 id="moneyImportTitle">${t("导入银行账单", "Import bank statement", "Kontoauszug importieren")}</h3>
        ${body}
        <p class="money-error" data-import-error role="alert">${esc(imp.error || "")}</p>
        <div class="money-sheet-actions">
          ${step > 1 ? `<button class="secondary-button" type="button" data-import-back>${t("上一步", "Back", "Zurück")}</button>` : `<button class="secondary-button" type="button" data-close-import>${t("取消", "Cancel", "Abbrechen")}</button>`}
          ${step < 3
            ? `<button class="primary-button" type="button" data-import-next>${step === 2 && imp.mapAt >= (imp.mapQueue.length || 1) - 1 ? t("查看预览", "Review", "Vorschau") : t("下一步", "Next", "Weiter")}</button>`
            : `<button class="primary-button" type="button" data-import-commit>${t(`导入 ${importCommitCount()} 笔`, `Import ${importCommitCount()} entries`, `${importCommitCount()} Buchungen importieren`)}</button>`}
        </div>
      </div>`;
    bindImportSheet(root_, ledger);
    bindCategoryPickers(root_);
    requestAnimationFrame(() => root_.classList.add("money-open"));
  }
  function refreshImportPickerLabels() {
    const imp = ui.import;
    if (!imp) return;
    for (const [k, p] of Object.entries(imp.picks || {})) {
      const btn = document.querySelector(`[data-picker-token="imp-${k}"]`);
      if (btn && p.categoryId) btn.textContent = catName(ledgerState(), p.categoryId);
    }
  }

  function setImportCategory(ix, categoryId) {
    const imp = ui.import;
    const pick = imp?.picks?.[ix];
    if (!pick) return;
    pick.categoryId = categoryId;
    pick.userCat = true;
    const item = [...(imp.plan?.new || []), ...(imp.plan?.matched || []), ...(imp.plan?.possibleDuplicates || [])].find(x => x.index === ix);
    pick.learnKey = core().merchantKey(importRowNote(item?.row || {}));
    pick.merchantKey = pick.learnKey || pick.merchantKey;
    const li = document.querySelector(`[data-import-row="${ix}"]`);
    if (!li || !pick.learnKey) return;
    let lab = li.querySelector(".money-learn");
    if (!lab) {
      lab = document.createElement("label");
      lab.className = "money-learn";
      lab.innerHTML = `<input type="checkbox" data-import-learn="${ix}"><span></span>`;
      li.appendChild(lab);
      lab.querySelector("input").addEventListener("change", () => toggleImportLearn(ix, lab.querySelector("input").checked));
    }
    lab.querySelector("span").textContent = learnText(pick.learnKey, categoryId);
    if (pick.learn) toggleImportLearn(ix, true);
  }

  function toggleImportLearn(ix, checked) {
    const imp = ui.import;
    const pick = imp?.picks?.[ix];
    if (!pick) return;
    pick.learn = checked;
    if (!checked) return;
    imp.picks = applySameMerchantCategory(imp.picks, ix);
    refreshImportPickerLabels();
  }

  function bindImportSheet(root_, ledger) {
    const imp = ui.import;
    const B = bank();
    root_.querySelectorAll("[data-close-import]").forEach(b => b.addEventListener("click", closeImportWizard));
    root_.addEventListener("keydown", e => { if (e.key === "Escape") closeImportWizard(); });
    root_.querySelectorAll("[data-import-file-remove]").forEach(b => b.addEventListener("click", () => {
      imp.files.splice(Number(b.dataset.importFileRemove), 1);
      mountImportSheet();
    }));
    root_.querySelector("[data-import-back]")?.addEventListener("click", () => {
      imp.error = "";
      if (imp.step === 3) {
        if (imp.mapQueue.length) { imp.mapAt = imp.mapQueue.length - 1; showMapFile(); imp.step = 2; }
        else imp.step = 1;
      } else if (imp.step === 2 && imp.mapAt > 0) {
        imp.mapAt -= 1;
        showMapFile();
      } else imp.step = 1;
      mountImportSheet();
    });
    root_.querySelector("[data-import-copy-prompt]")?.addEventListener("click", async () => {
      const text = B.buildAiImportPrompt?.(ledgerState(), { lang: ctx.lang?.() || "en" }) || "";
      imp.promptCopied = await copyImportPrompt(text);
      mountImportSheet();
    });
    root_.querySelector(".money-import-prompt")?.addEventListener("toggle", e => { imp.aiPromptOpen = e.currentTarget.open; });
    root_.querySelector("[data-import-paste]")?.addEventListener("input", e => { imp.pasteText = e.target.value; imp.error = ""; });
    root_.querySelector("[data-import-map-toggle]")?.addEventListener("click", () => {
      imp.mappingOpen = !imp.mappingOpen;
      root_.querySelector("[data-import-map-panel]")?.classList.toggle("is-collapsed", !imp.mappingOpen);
    });
    root_.querySelector("[data-import-skip-pending]")?.addEventListener("click", e => {
      imp.skipPending = !imp.skipPending;
      e.currentTarget.setAttribute("aria-checked", imp.skipPending ? "true" : "false");
    });
    root_.querySelectorAll("[data-map-field]").forEach(sel => sel.addEventListener("change", () => {
      const f = sel.dataset.mapField;
      const v = Number(sel.value);
      imp.mapping[f] = v >= 0 ? v : -1;
      imp.parsed.presetId = "generic";
    }));
    const fileInput = root_.querySelector("[data-import-file]");
    const ingestFiles = list => {
      const files = [...(list || [])].filter(Boolean);
      if (!files.length) return;
      let left = files.length;
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = () => {
          imp.files.push({ name: file.name, bytes: new Uint8Array(reader.result) });
          if (--left === 0) { imp.error = ""; mountImportSheet(); }
        };
        reader.readAsArrayBuffer(file);
      }
    };
    fileInput?.addEventListener("change", () => { ingestFiles(fileInput.files); fileInput.value = ""; });
    const drop = root_.querySelector(".money-import-drop");
    drop?.addEventListener("dragover", e => { e.preventDefault(); drop.classList.add("is-drag"); });
    drop?.addEventListener("dragleave", () => drop.classList.remove("is-drag"));
    drop?.addEventListener("drop", e => { e.preventDefault(); drop.classList.remove("is-drag"); ingestFiles(e.dataTransfer?.files); });
    root_.querySelector("[data-import-next]")?.addEventListener("click", () => {
      imp.error = "";
      const B = bank();
      if (imp.step === 1) {
        if (!imp.files.length && !imp.pasteText?.trim()) {
          imp.error = t("请选择 CSV 或粘贴 AI 结果", "Choose a CSV or paste AI output", "CSV wählen oder KI-Ergebnis einfügen");
          mountImportSheet();
          return;
        }
        if (imp.files.some(f => !f.bytes)) {
          imp.error = t("文件还在读取", "Still reading the files", "Dateien werden noch gelesen");
          mountImportSheet();
          return;
        }
        imp.parsedFiles = [];
        imp.pasteParsed = null;
        const pushParsed = (name, sourceId, text) => {
          const parsed = B.parseStatement(text);
          if (!parsed.unified && parsed.headerIndex < 0) return name;
          if (parsed.unified) { imp.pasteParsed = parsed; return ""; }
          imp.parsedFiles.push({
            name, sourceId, parsed,
            mapping: { ...(parsed.guessedMapping || {}) },
            needsMap: parsed.presetId === "generic",
          });
          return "";
        };
        for (const f of imp.files) {
          const bad = pushParsed(f.name, f.name, B.decodeBytes(f.bytes));
          if (bad) {
            imp.error = t(`${bad}：无法识别表头`, `${bad}: could not find a header row`, `${bad}: keine Kopfzeile erkannt`);
            mountImportSheet();
            return;
          }
        }
        if (imp.pasteText?.trim()) {
          const bad = pushParsed(t("AI 粘贴", "AI paste", "KI-Einfügen"), "ai", imp.pasteText);
          if (bad) {
            imp.error = t("粘贴内容无法识别表头", "Could not find a header in the pasted text", "Keine Kopfzeile im eingefügten Text");
            mountImportSheet();
            return;
          }
        }
        imp.mapQueue = imp.parsedFiles.filter(f => f.needsMap);
        imp.mapAt = 0;
        if (imp.mapQueue.length) { showMapFile(); imp.step = 2; }
        else { rebuildImportPlan(); imp.step = 3; }
      } else if (imp.step === 2) {
        if (!mappingReady(imp.mapping)) { imp.error = t("请至少指定日期和金额列", "Map at least date and amount", "Mindestens Datum und Betrag zuordnen"); mountImportSheet(); return; }
        imp.mapAt += 1;
        if (imp.mapAt < imp.mapQueue.length) showMapFile();
        else { rebuildImportPlan(); imp.step = 3; }
      }
      mountImportSheet();
    });
    const refreshCommitLabel = () => {
      const btn = root_.querySelector("[data-import-commit]");
      if (!btn) return;
      const n = importCommitCount();
      btn.textContent = t(`导入 ${n} 笔`, `Import ${n} entries`, `${n} Buchungen importieren`);
    };
    root_.querySelectorAll("[data-import-pick]").forEach(box => box.addEventListener("change", () => {
      const ix = Number(box.dataset.importPick);
      if (imp.picks[ix]) imp.picks[ix].include = box.checked;
      refreshCommitLabel();
    }));
    root_.querySelectorAll("[data-import-learn]").forEach(box => box.addEventListener("change", () => {
      toggleImportLearn(Number(box.dataset.importLearn), box.checked);
    }));
    root_.querySelectorAll("[data-import-merge]").forEach(box => box.addEventListener("change", () => {
      const ix = Number(box.dataset.importMerge);
      const sug = (imp.plan.suggestions || []).find(s => s.index === ix);
      if (!imp.picks[ix]) return;
      if (box.checked) {
        imp.picks[ix].mergeTxId = sug?.candidates?.[0]?.txId || sug?.candidates?.[0] || imp.picks[ix].suggestTxId;
        imp.picks[ix].include = false;
      } else {
        imp.picks[ix].mergeTxId = "";
        imp.picks[ix].include = true;
      }
      refreshCommitLabel();
    }));
    root_.querySelectorAll("[data-import-transfer]").forEach(box => box.addEventListener("change", () => {
      imp.transferPicks[Number(box.dataset.importTransfer)] = box.checked;
      refreshCommitLabel();
    }));
    root_.querySelector("[data-import-commit]")?.addEventListener("click", () => {
      const B = bank();
      const plan = imp.plan;
      const picks = imp.picks;
      const newIndices = (plan.new || []).filter(n => picks[n.index]?.include && !picks[n.index]?.mergeTxId).map(n => n.index);
      const duplicateIndices = (plan.possibleDuplicates || []).filter(d => picks[d.index]?.include).map(d => d.index);
      const merges = {};
      (plan.matched || []).forEach(m => {
        if (picks[m.index]?.include === false) return;
        merges[m.index] = m.txId;
      });
      (plan.new || []).concat(plan.suggestions || []).forEach(item => {
        const mid = picks[item.index]?.mergeTxId;
        if (mid) merges[item.index] = mid;
      });
      const transfers = [];
      const possibleOwnIndices = [];
      const categoryOverrides = {};
      Object.entries(picks).forEach(([ix, p]) => { if (p?.categoryId) categoryOverrides[Number(ix)] = p.categoryId; });
      (plan.transfers || []).forEach((tr, i) => {
        if (!imp.transferPicks[i]) return;
        if (tr.kind === "possible-own") possibleOwnIndices.push(tr.index);
        else if (tr.kind === "withinFile") transfers.push({ rowAIndex: tr.rowA?._index, rowBIndex: tr.rowB?._index });
        else if (tr.kind === "ledger") transfers.push({ rowIndex: tr.rowIndex, ledgerTxId: tr.txId });
      });
      const out = B.commitImport(ledgerState(), plan, {
        accountId: imp.accountId || defaultAccountId(ledgerState()), includeNew: true, newIndices, duplicateIndices, merges, transfers,
        possibleOwnIndices, categoryOverrides,
      });
      let next = out.ledger;
      const batchId = out.batchId;
      const applyCat = item => {
        const pick = picks[item.index];
        if (!pick?.categoryId) return;
        const fp = item.fingerprint || B.fingerprint(item.row);
        const tx = next.transactions.find(x => x.importBatchId === batchId && x.bankFingerprint === fp);
        if (tx && tx.categoryId !== pick.categoryId) {
          const u = core().updateTransaction(next, tx.id, { categoryId: pick.categoryId });
          if (u?.ledger) next = u.ledger;
        }
      };
      (plan.new || []).filter(n => newIndices.includes(n.index)).forEach(applyCat);
      (plan.possibleDuplicates || []).filter(d => duplicateIndices.includes(d.index)).forEach(applyCat);
      const learned = new Set();
      Object.values(picks).forEach(p => {
        if (!p?.learn || !p.categoryId || !p.learnKey || learned.has(p.learnKey)) return;
        learned.add(p.learnKey);
        next = core().learnCategoryRule(next, p.learnKey, p.categoryId);
      });
      commit(next);
      const n = (out.ledger.meta.importBatches?.find(b => b.id === batchId)?.newTxIds?.length || 0)
        + (out.ledger.meta.importBatches?.find(b => b.id === batchId)?.merges?.length || 0);
      const earliest = (imp.rows || []).map(r => r.date).filter(Boolean).sort()[0] || "";
      closeImportWizard();
      if (earliest && !earliest.startsWith(nav.month)) nav.setMonth(earliest.slice(0, 7));
      else render();
      ctx.toast?.(t(`已导入 ${n} 笔`, `Imported ${n} entries`, `${n} Buchungen importiert`), {
        actionLabel: t("撤销", "Undo", "Rückgängig"),
        onAction: () => {
          const undone = B.undoImport(ledgerState(), batchId);
          if (undone.undone) { commit(undone.ledger); render(); ctx.toast?.(t("已撤销导入", "Import undone", "Import rückgängig")); }
        },
      });
    });
  }

  /* ---------- quick-entry sheet ---------- */
  function sheetEl() {
    let el = document.getElementById("moneySheetRoot");
    if (!el) {
      el = document.createElement("div");
      el.id = "moneySheetRoot";
      document.body.appendChild(el);
    }
    return el;
  }

  function setEntryCategory(id, user) {
    const form = document.querySelector("#moneySheetRoot form");
    if (!form) return;
    form.elements.category.value = id || "";
    const btn = form.querySelector("[data-picker-btn]");
    if (btn) btn.textContent = id ? catName(ledgerState(), id) : t("选择类别", "Choose category", "Kategorie wählen");
    const guessEl = form.parentElement.querySelector("[data-guess]");
    const lab = form.querySelector("[data-learn]");
    if (!user) return;
    ui.catTouched = true;
    if (guessEl) guessEl.textContent = "";
    const key = core().merchantKey(form.elements.note.value);
    if (!lab) return;
    if (!key || !id) { lab.hidden = true; return; }
    lab.hidden = false;
    lab.querySelector("span").textContent = learnText(key, id);
  }

  function openSheet() {
    closeImportWizard();
    ui.catSheet = null;
    ui.sheetHost = "entry";
    const ledger = ledgerState();
    const today = ctx.iso(new Date());
    const day = today.startsWith(nav.month) ? today : (ui.pickedDay || `${nav.month}-01`);
    ui.sheet = { currency: ledger.settings.defaultCurrency, date: day, fx: null };
    ui.catTouched = false;
    const s = ledger.settings;
    const accounts = ledger.accounts.filter(a => !a.archived);
    beginPickers();
    const root_ = sheetEl();
    root_.innerHTML = `<div class="money-scrim" data-close-sheet></div>
      <div class="money-sheet" role="dialog" aria-modal="true" aria-labelledby="moneySheetTitle">
        <h3 id="moneySheetTitle">${t("记一笔", "Add entry", "Neuer Eintrag")}</h3>
        <p class="sub">${t("类别会根据备注自动猜一个，你可以改。", "The category is guessed from the note — change it anytime.", "Die Kategorie wird aus der Notiz erraten – jederzeit änderbar.")}</p>
        <form class="money-sheet-form" novalidate>
          <div class="money-entry ${s.perEntryCurrency ? "" : "no-cur"}">
            ${s.perEntryCurrency ? `<label><span>${t("币种", "Currency", "Währung")}</span><select name="currency">${CURRENCIES.map(c => `<option ${c === s.defaultCurrency ? "selected" : ""}>${c}</option>`).join("")}</select></label>` : ""}
            <label class="amount"><span>${t("金额", "Amount", "Betrag")}</span><input name="amount" inputmode="decimal" autocomplete="off" placeholder="0,00" required></label>
            <label><span>${t("类别", "Category", "Kategorie")}</span><input type="hidden" name="category" value="">${categoryPicker({ value: "", kind: "", ledger, onPick: id => setEntryCategory(id, true) })}</label>
          </div>
          <p class="money-guess" data-guess></p>
          <label class="money-learn" data-learn hidden><input type="checkbox"><span></span></label>
          <label class="money-field"><span>${t("备注", "Note", "Notiz")}</span><input name="note" autocomplete="off" placeholder="${esc(t("例如 Rewe、房租、咖啡", "e.g. Rewe, rent, coffee", "z. B. Rewe, Miete, Kaffee"))}"></label>
          <div class="money-entry-row">
            <label class="money-field"><span>${t("日期", "Date", "Datum")}</span><input name="date" type="date" value="${esc(day)}" max="${esc(today)}"></label>
            ${accounts.length > 1 ? `<label class="money-field"><span>${t("账户", "Account", "Konto")}</span><select name="account">${accounts.map(a => `<option value="${esc(a.id)}">${esc(a.name)}</option>`).join("")}</select></label>` : ""}
          </div>
          <div class="money-fxline" data-fx hidden>
            <span data-fx-text></span>
            <label><span>${t("手动汇率", "Manual rate", "Kurs manuell")}</span><input name="rate" inputmode="decimal" autocomplete="off" placeholder="—"></label>
          </div>
          <p class="money-error" data-error role="alert"></p>
          <div class="money-sheet-actions">
            <button class="secondary-button" type="button" data-close-sheet>${t("取消", "Cancel", "Abbrechen")}</button>
            <button class="primary-button" type="submit">${t("保存", "Save", "Speichern")}</button>
          </div>
        </form>
      </div>`;
    const form = root_.querySelector("form");
    bindCategoryPickers(root_);
    const note = form.elements.note;
    const guessEl = root_.querySelector("[data-guess]");
    const updateGuess = () => {
      if (ui.catTouched) {
        const lab = form.querySelector("[data-learn]");
        const key = core().merchantKey(note.value);
        if (lab && !lab.hidden) {
          if (!key) lab.hidden = true;
          else lab.querySelector("span").textContent = learnText(key, form.elements.category.value);
        }
        return;
      }
      const g = core().guessCategory(ledgerState(), note.value);
      setEntryCategory(g.categoryId || "", false);
      guessEl.innerHTML = g.source === "none" ? "" : `${g.source === "rule" ? t("按你以前的选择", "From your earlier choice", "Aus deiner früheren Wahl") : t("按关键词猜测", "Guessed from keyword", "Aus Stichwort geraten")}${t("：", ": ", ": ")}<b>${esc(catName(ledgerState(), g.categoryId))}</b>`;
    };
    note.addEventListener("input", updateGuess);
    const refreshFx = () => updateFxLine(form);
    form.elements.currency?.addEventListener("change", refreshFx);
    form.elements.date.addEventListener("change", refreshFx);
    form.elements.amount.addEventListener("input", () => { if (ui.sheet.fx) renderFxText(form); });
    form.elements.rate.addEventListener("input", () => renderFxText(form));
    root_.querySelectorAll("[data-close-sheet]").forEach(b => b.addEventListener("click", closeSheet));
    form.addEventListener("submit", e => { e.preventDefault(); saveSheet(form); });
    root_.onkeydown = e => {
      if (e.key !== "Escape") return;
      if (pickerOpen) { closeCategoryPicker(true); return; }
      closeSheet();
    };
    requestAnimationFrame(() => {
      root_.classList.add("money-open");
      form.elements.amount.focus();
    });
  }

  function closeSheet() {
    if (ui.sheetHost === "cats") return;
    closeCategoryPicker(false);
    const el = document.getElementById("moneySheetRoot");
    if (!el) return;
    el.classList.remove("money-open");
    ui.sheet = null;
    ui.sheetHost = "";
    setTimeout(() => { if (!ui.sheetHost) el.innerHTML = ""; }, 220);
    document.querySelector("#ledgerView [data-money-add]")?.focus();
  }

  async function lookupRate(currency, iso) {
    const ledger = ledgerState();
    const target = ledger.settings.defaultCurrency;
    const reqDate = core().fxRequestDate(iso);
    const cache = ledger.meta.fxCache || {};
    const exact = cache[`${currency}:${reqDate}`];
    if (exact) return { rate: exact, rateDate: reqDate, source: "ecb" };
    if (ledger.settings.autoFx && root.fetch) {
      try {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 5000);
        const res = await fetch(fxUrl(currency, iso, target), { signal: ctl.signal });
        clearTimeout(timer);
        if (res.ok) {
          const body = await res.json();
          const rate = Number(body?.rates?.[target]);
          if (rate > 0) {
            const date = body.date || reqDate;
            const next = ledgerState();
            next.meta.fxCache[`${currency}:${date}`] = rate;
            if (date !== reqDate) next.meta.fxCache[`${currency}:${reqDate}`] = rate;
            commit(next);
            return { rate, rateDate: date, source: "ecb" };
          }
        }
      } catch { /* offline → cached estimate below */ }
    }
    return core().cachedFxRate(ledgerState().meta.fxCache, currency, reqDate);
  }

  async function updateFxLine(form) {
    const cur = form.elements.currency?.value || ledgerState().settings.defaultCurrency;
    const box = form.querySelector("[data-fx]");
    ui.sheet.currency = cur;
    if (cur === ledgerState().settings.defaultCurrency) { box.hidden = true; ui.sheet.fx = null; return; }
    box.hidden = false;
    form.querySelector("[data-fx-text]").textContent = t("正在获取汇率…", "Fetching rate…", "Kurs wird geladen …");
    const asked = `${cur}:${form.elements.date.value}`;
    ui.sheet.fxKey = asked;
    const fx = await lookupRate(cur, form.elements.date.value);
    if (!ui.sheet || ui.sheet.fxKey !== asked) return;
    ui.sheet.fx = fx;
    renderFxText(form);
  }

  function manualRate(form) {
    const v = Number(String(form.elements.rate.value || "").replace(",", "."));
    return v > 0 ? v : 0;
  }

  function renderFxText(form) {
    const text = form.querySelector("[data-fx-text]");
    if (!text || !ui.sheet) return;
    const target = ledgerState().settings.defaultCurrency;
    const manual = manualRate(form);
    const fx = manual ? { rate: manual, source: "manual", rateDate: form.elements.date.value } : ui.sheet.fx;
    if (!fx) { text.textContent = t("没有可用汇率，请手动填写。", "No rate available — enter one manually.", "Kein Kurs verfügbar – bitte manuell eintragen."); return; }
    const amt = core().parseMoneyInput(form.elements.amount.value);
    const src = { ecb: t("欧洲央行", "ECB", "EZB"), estimate: t("估算", "estimate", "Schätzung"), manual: t("手动", "manual", "manuell") }[fx.source] || fx.source;
    text.textContent = `1 ${ui.sheet.currency} = ${fx.rate.toFixed(4)} ${target} · ${src} · ${dayLabel(fx.rateDate, false)}${amt ? ` → ${money(Math.round(amt * fx.rate), target)}` : ""}`;
  }

  function saveSheet(form) {
    const err = form.querySelector("[data-error]");
    let ledger = ledgerState();
    const amt = core().parseMoneyInput(form.elements.amount.value);
    if (!amt) { err.textContent = t("请输入金额", "Enter an amount", "Betrag eingeben"); form.elements.amount.focus(); return; }
    let categoryId = form.elements.category.value;
    if (!categoryId) {
      categoryId = ledger.categories.find(c => c.kind === "expense" && !c.archived && !c.isGroup && c.defaultSlug === "other")?.id
        || ledger.categories.find(c => c.kind === "expense" && !c.archived && !c.isGroup && /^(other|sonstiges|其他)$/i.test(c.name))?.id
        || ledger.categories.find(c => c.kind === "expense" && !c.archived && !c.isGroup)?.id || "";
    }
    const cat = ledger.categories.find(c => c.id === categoryId);
    if (!cat || cat.isGroup) { err.textContent = t("请选择类别", "Pick a category", "Kategorie wählen"); return; }
    if (!ledger.accounts.some(a => !a.archived)) ledger = core().normalize(ledger);
    const accountId = form.elements.account?.value || ledger.accounts.find(a => !a.archived)?.id;
    const note = form.elements.note.value.trim();
    let draft = {
      accountId, categoryId, note, date: form.elements.date.value || ctx.iso(new Date()),
      amountMinor: cat.kind === "income" ? amt : -amt,
      currency: form.elements.currency?.value || ledger.settings.defaultCurrency,
      source: "manual",
    };
    if (draft.currency !== ledger.settings.defaultCurrency) {
      const manual = manualRate(form);
      const fx = manual ? { rate: manual, source: "manual", rateDate: draft.date } : ui.sheet?.fx;
      if (!fx) { err.textContent = t("没有汇率：请联网或手动填写汇率。", "No rate: go online or enter one.", "Kein Kurs: online gehen oder manuell eintragen."); form.elements.rate.focus(); return; }
      draft = core().foreignEntryDraft(draft, fx, ledger.settings.defaultCurrency);
    }
    try {
      ({ ledger } = core().addTransaction(ledger, draft, { lang: ctx.lang?.() }));
    } catch {
      err.textContent = t("保存失败，请检查输入", "Could not save — check the fields", "Speichern fehlgeschlagen");
      return;
    }
    const learnOn = form.querySelector("[data-learn] input")?.checked;
    if (note && (!ui.catTouched || learnOn)) ledger = core().learnCategoryRule(ledger, note, categoryId);
    commit(ledger);
    closeSheet();
    ctx.toast?.(t("已记一笔", "Entry saved", "Eintrag gespeichert"));
    if (!draft.date.startsWith(nav.month)) nav.setMonth(draft.date.slice(0, 7));
    else render();
  }

  /* ---------- category manager ---------- */
  function editLabel(edit) {
    const code = String(ctx.lang?.() || "en").slice(0, 2);
    if (code === "zh") return edit.nameZh || edit.name || "";
    if (code === "de") return edit.nameDe || edit.name || "";
    return edit.name || "";
  }

  function catRow(ledger, c) {
    const fixed = ledger.settings.fixedCategoryIds.includes(c.id) ? `<small>${t("固定", "Fixed", "Fix")}</small>` : "";
    return `<button type="button" class="money-manage-row" data-cat-edit="${esc(c.id)}" style="--c:${catColor(ledger, c.id)}"><i class="money-dot"></i><span>${esc(catName(ledger, c.id))}</span>${fixed}<span aria-hidden="true">›</span></button>`;
  }

  function catListHtml(ledger) {
    const leaves = ledger.categories.filter(c => !c.isGroup && !c.archived);
    const archived = ledger.categories.filter(c => !c.isGroup && c.archived);
    const used = new Set();
    let blocks = "";
    for (const g of ledger.categories.filter(c => c.isGroup && !c.archived)) {
      const kids = leaves.filter(c => c.parentId === g.id);
      kids.forEach(c => used.add(c.id));
      if (!kids.length) continue;
      blocks += `<h4 class="money-picker-head">${esc(catName(ledger, g.id))}</h4>${kids.map(c => catRow(ledger, c)).join("")}`;
    }
    const rest = leaves.filter(c => !used.has(c.id));
    if (rest.length) blocks += `<h4 class="money-picker-head">${t("其他", "Other", "Weitere")}</h4>${rest.map(c => catRow(ledger, c)).join("")}`;
    if (archived.length) blocks += `<h4 class="money-picker-head">${t("已归档", "Archived", "Archiviert")}</h4>${archived.map(c => catRow(ledger, c)).join("")}`;
    const hints = Object.entries(ledger.meta.noteCategoryHints || {});
    const rules = hints.length
      ? `<ul class="money-rules">${hints.map(([key, id]) => `<li><span class="money-rule-key">${esc(key)}</span>${categoryPicker({ value: id, kind: "", ledger, onPick: catId => { const l = ledgerState(); l.meta.noteCategoryHints[key] = catId; commit(l); renderCatSheet(); } })}<button class="money-del" type="button" data-rule-del="${esc(key)}" aria-label="${esc(t("删除规则", "Delete rule", "Regel löschen"))}">×</button></li>`).join("")}</ul>`
      : `<p class="money-hint">${t("还没有规则。改类别时可以勾选记住商户。", "No rules yet. Tick the box when you re-categorise.", "Noch keine Regeln. Beim Ändern ankreuzen.")}</p>`;
    return `<h3>${t("类别", "Categories", "Kategorien")}</h3>
      <div class="money-manage-list">${blocks}</div>
      <button class="secondary-button" type="button" data-cat-new>＋ ${t("新类别", "New category", "Neue Kategorie")}</button>
      <h4 class="money-picker-head">${t("自动归类规则", "Rules", "Regeln")}</h4>
      ${rules}
      <div class="money-sheet-actions"><button class="secondary-button" type="button" data-close-cats>${t("完成", "Done", "Fertig")}</button></div>`;
  }

  function catEditorHtml(ledger, edit) {
    const groups = ledger.categories.filter(c => c.isGroup && !c.archived);
    const used = edit.id && core().categoryUsed(ledger, edit.id);
    const colors = [1, 2, 3, 4, 5, 6, 7, 8];
    return `<button class="money-link" type="button" data-cat-back>‹ ${t("类别", "Categories", "Kategorien")}</button>
      <h3>${edit.id ? t("编辑类别", "Edit category", "Kategorie") : t("新类别", "New category", "Neue Kategorie")}</h3>
      <form class="money-sheet-form" data-cat-form>
        <label class="money-field"><span>${t("名称", "Name", "Name")}</span><input class="money-input" name="name" required value="${esc(editLabel(edit))}"></label>
        <div class="money-colors" role="group" aria-label="${esc(t("颜色", "Colour", "Farbe"))}">${colors.map(n => `<button type="button" class="money-color${edit.color === `cat-${n}` ? " is-on" : ""}" data-cat-color="cat-${n}" style="--c:var(--cat-${n})" aria-pressed="${edit.color === `cat-${n}` ? "true" : "false"}"></button>`).join("")}</div>
        ${edit.kind === "income" ? "" : `<label class="money-field"><span>${t("分组", "Group", "Gruppe")}</span>
          <select class="money-select" name="parent"><option value="">${t("无", "None", "Keine")}</option>${groups.map(g => `<option value="${esc(g.id)}" ${g.id === edit.parentId ? "selected" : ""}>${esc(catName(ledger, g.id))}</option>`).join("")}</select>
        </label>`}
        <label class="money-toggle"><span>${t("固定开销", "Fixed cost", "Fixkosten")}</span><button class="money-switch" type="button" role="switch" aria-checked="${edit.fixed ? "true" : "false"}" data-cat-fixed></button></label>
        <p class="money-hint">${t("固定开销不计入每日图和可变预算。", "Fixed costs stay out of the daily chart and the variable budget.", "Fixkosten zählen nicht zum Tagesdiagramm und zum variablen Budget.")}</p>
        <p class="money-error" data-cat-error role="alert"></p>
        <div class="money-sheet-actions">
          ${edit.id ? `<button class="secondary-button" type="button" data-cat-archive>${edit.archived ? t("恢复", "Unarchive", "Wiederherstellen") : t("归档", "Archive", "Archivieren")}</button>` : ""}
          ${edit.id && !used ? `<button class="secondary-button" type="button" data-cat-delete>${t("删除", "Delete", "Löschen")}</button>` : ""}
          <button class="primary-button" type="submit">${t("保存", "Save", "Speichern")}</button>
        </div>
      </form>`;
  }

  function renderCatSheet() {
    if (!ui.catSheet || !ctx) return;
    beginPickers();
    ui.sheetHost = "cats";
    ui.sheet = null;
    const ledger = ledgerState();
    const root_ = sheetEl();
    const edit = ui.catSheet.edit;
    root_.innerHTML = `<div class="money-scrim" data-close-cats></div><div class="money-sheet" role="dialog" aria-modal="true">${edit ? catEditorHtml(ledger, edit) : catListHtml(ledger)}</div>`;
    bindCategoryPickers(root_);
    root_.querySelectorAll("[data-close-cats]").forEach(b => b.addEventListener("click", closeCategorySheet));
    root_.querySelector("[data-cat-new]")?.addEventListener("click", () => {
      const g = ledger.categories.find(c => c.isGroup && !c.archived);
      ui.catSheet.edit = { id: "", name: "", color: "cat-6", parentId: g?.id || "", fixed: false, archived: false };
      renderCatSheet();
      root_.querySelector("[name=name]")?.focus();
    });
    root_.querySelectorAll("[data-cat-edit]").forEach(b => b.addEventListener("click", () => {
      const c = ledger.categories.find(x => x.id === b.dataset.catEdit);
      if (!c || c.isGroup) return;
      ui.catSheet.edit = { id: c.id, name: c.name, nameZh: c.nameZh || "", nameDe: c.nameDe || "", kind: c.kind, color: /^cat-[1-8]$/.test(c.color) ? c.color : "cat-6", parentId: c.parentId || "", fixed: ledger.settings.fixedCategoryIds.includes(c.id), archived: c.archived === true };
      renderCatSheet();
    }));
    root_.querySelector("[data-cat-back]")?.addEventListener("click", () => { ui.catSheet.edit = null; renderCatSheet(); });
    root_.querySelectorAll("[data-cat-color]").forEach(b => b.addEventListener("click", () => {
      const typed = root_.querySelector("[name=name]")?.value;
      const code = String(ctx.lang?.() || "en").slice(0, 2);
      if (typed != null) {
        if (!ui.catSheet.edit.id || code === "en") ui.catSheet.edit.name = typed;
        else if (code === "zh") ui.catSheet.edit.nameZh = typed;
        else ui.catSheet.edit.nameDe = typed;
      }
      ui.catSheet.edit.color = b.dataset.catColor;
      renderCatSheet();
    }));
    root_.querySelector("[data-cat-fixed]")?.addEventListener("click", e => {
      ui.catSheet.edit.fixed = !ui.catSheet.edit.fixed;
      e.currentTarget.setAttribute("aria-checked", ui.catSheet.edit.fixed ? "true" : "false");
    });
    root_.querySelector("[data-cat-form]")?.addEventListener("submit", e => { e.preventDefault(); saveCatEditor(e.target); });
    root_.querySelector("[data-cat-archive]")?.addEventListener("click", () => {
      ui.catSheet.edit.archived = !ui.catSheet.edit.archived;
      const form = root_.querySelector("[data-cat-form]");
      if (form) saveCatEditor(form);
    });
    root_.querySelector("[data-cat-delete]")?.addEventListener("click", () => {
      const next = core().deleteCategory(ledgerState(), ui.catSheet.edit.id);
      if (!next) return;
      commit(next);
      ui.catSheet.edit = null;
      render();
      renderCatSheet();
    });
    root_.querySelectorAll("[data-rule-del]").forEach(b => b.addEventListener("click", () => {
      commit(core().forgetCategoryRule(ledgerState(), b.dataset.ruleDel));
      renderCatSheet();
    }));
    root_.onkeydown = e => {
      if (e.key !== "Escape") return;
      if (pickerOpen) { closeCategoryPicker(true); return; }
      if (ui.catSheet?.edit) { ui.catSheet.edit = null; renderCatSheet(); return; }
      closeCategorySheet();
    };
    requestAnimationFrame(() => root_.classList.add("money-open"));
  }

  function saveCatEditor(form) {
    const edit = ui.catSheet?.edit;
    if (!edit) return;
    const text = form.elements.name.value.trim();
    const err = form.querySelector("[data-cat-error]");
    if (!text) { if (err) err.textContent = t("请填写名称", "Enter a name", "Name eingeben"); return; }
    edit.parentId = form.elements.parent?.value || "";
    const code = String(ctx.lang?.() || "en").slice(0, 2);
    const draft = { id: edit.id, name: edit.name || text, color: edit.color, parentId: edit.parentId, kind: "expense", archived: edit.archived === true };
    if (!edit.id || code === "en") draft.name = text;
    else if (code === "zh") draft.nameZh = text;
    else if (code === "de") draft.nameDe = text;
    const res = core().upsertCategory(ledgerState(), draft);
    if (!res?.category) { if (err) err.textContent = t("无法保存", "Could not save", "Speichern fehlgeschlagen"); return; }
    const set = new Set(res.ledger.settings.fixedCategoryIds);
    if (edit.fixed) set.add(res.category.id); else set.delete(res.category.id);
    res.ledger.settings.fixedCategoryIds = [...set];
    commit(res.ledger);
    ui.catSheet.edit = null;
    render();
    renderCatSheet();
  }

  function openCategorySheet() {
    closeImportWizard();
    closeCategoryPicker(false);
    ui.sheet = null;
    ui.catSheet = { edit: null };
    ui.sheetHost = "cats";
    renderCatSheet();
  }

  function closeCategorySheet() {
    closeCategoryPicker(false);
    ui.catSheet = null;
    ui.sheetHost = "";
    const el = document.getElementById("moneySheetRoot");
    if (!el) return;
    el.classList.remove("money-open");
    setTimeout(() => { if (!ui.sheetHost) el.innerHTML = ""; }, 220);
    document.querySelector("[data-open-categories]")?.focus();
  }

  /* ---------- events ---------- */
  function bind(host, ledger) {
    host.querySelectorAll("[data-month]").forEach(b => b.addEventListener("click", () => {
      const d = Number(b.dataset.month);
      const today = ctx.iso(new Date()).slice(0, 7);
      ui.drill = ""; ui.pickedDay = "";
      nav.setMonth(d === 0 ? today : core().shiftYm(nav.month, d));
    }));
    host.querySelectorAll("[data-money-add]").forEach(b => b.addEventListener("click", openSheet));
    host.querySelectorAll("[data-money-import]").forEach(b => b.addEventListener("click", () => openImportWizard()));
    host.querySelectorAll("[data-import-undo]").forEach(b => b.addEventListener("click", () => {
      const B = bank();
      if (!B) return;
      const res = B.undoImport(ledgerState(), b.dataset.importUndo);
      if (res.undone) {
        commit(res.ledger);
        ctx.toast?.(t("已撤销该次导入", "That import was undone", "Import rückgängig gemacht"));
        render();
      }
    }));
    host.querySelectorAll("[data-money-settings]").forEach(b => b.addEventListener("click", () => {
      ui.showSettings = true;
      render();
      host.querySelector("#moneySettings")?.scrollIntoView({ block: "start", behavior: document.documentElement.classList.contains("motion-reduced") ? "auto" : "smooth" });
    }));
    host.querySelectorAll("[data-drill]").forEach(b => b.addEventListener("click", () => { ui.drill = b.dataset.drill; render(); }));
    host.querySelector("[data-drill-back]")?.addEventListener("click", () => {
      const cat = ledger.categories.find(c => c.id === ui.drill);
      const parent = cat && !cat.isGroup ? ledger.categories.find(c2 => c2.id === cat.parentId && c2.isGroup) : null;
      ui.drill = parent ? parent.id : "";
      render();
    });
    host.querySelector("[data-open-categories]")?.addEventListener("click", openCategorySheet);
    host.querySelector("[data-toggle-fixed]")?.addEventListener("click", () => { ui.includeFixed = !ui.includeFixed; render(); });
    host.querySelectorAll("[data-filter]").forEach(el => {
      const ev = el.tagName === "INPUT" ? "input" : "change";
      el.addEventListener(ev, () => {
        ui.filters[el.dataset.filter] = el.value;
        if (ev === "input") {
          clearTimeout(bind.searchTimer);
          bind.searchTimer = setTimeout(() => { render(); const s = document.querySelector("#ledgerView [data-filter=search]"); s?.focus(); s?.setSelectionRange(s.value.length, s.value.length); }, 180);
        } else render();
      });
    });
    host.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => {
      const snap = core().removeTransaction(ledgerState(), b.dataset.del);
      if (!snap) return;
      commit(snap.ledger);
      ctx.toast?.(t("已删除一笔记录", "Entry removed", "Eintrag entfernt"), {
        actionLabel: t("撤销", "Undo", "Rückgängig"),
        onAction: () => { commit(core().restoreTransaction(ledgerState(), snap.removed, snap.index)); render(); },
      });
      render();
    }));
    const setSetting = (key, value) => { const l = ledgerState(); l.settings[key] = value; commit(l); render(); };
    host.querySelectorAll("[data-setting-toggle]").forEach(b => b.addEventListener("click", () => setSetting(b.dataset.settingToggle, !ledger.settings[b.dataset.settingToggle])));
    host.querySelector("[data-setting=defaultCurrency]")?.addEventListener("change", e => setSetting("defaultCurrency", e.target.value));
    host.querySelector("[data-setting=monthlyBudgetMinor]")?.addEventListener("change", e => setSetting("monthlyBudgetMinor", core().parseMoneyInput(e.target.value) || 0));
    host.querySelector("[data-setting=ownerNames]")?.addEventListener("change", e => setSetting("ownerNames", e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean)));
    host.querySelector("[data-cat-budget]")?.addEventListener("change", e => {
      const l = ledgerState();
      const limitMinor = core().parseMoneyInput(e.target.value);
      const existing = l.budgets.find(b => b.month === nav.month && b.categoryId === ui.drill);
      if (!limitMinor) { if (existing) { commit(core().removeCategoryBudget(l, existing.id)?.ledger || l); } render(); return; }
      const res = core().upsertCategoryBudget(l, { id: existing?.id, month: nav.month, categoryId: ui.drill, limitMinor }, { lang: ctx.lang?.() });
      if (res) commit(res.ledger || res);
      render();
    });
    host.querySelector("[data-account-form]")?.addEventListener("submit", e => {
      e.preventDefault();
      const f = e.target;
      const name = f.elements.name.value.trim();
      if (!name) return;
      const l = ledgerState();
      l.accounts.push({ id: core().createId(), name: name.slice(0, 60), currency: l.settings.defaultCurrency, kind: f.elements.kind.value, icon: "wallet", color: "sage", archived: false, openingBalanceMinor: 0, openingDate: "" });
      commit(core().normalize(l)); render();
    });
  }

  let resizeBound = false;
  function render(host_, ctx_, nav_) {
    if (ctx_) ctx = ctx_;
    if (nav_) nav = nav_;
    const host = host_ || document.querySelector("#ledgerView .ledger-page");
    if (!host || !ctx || !nav) return false;
    const ledger = ledgerState();
    const ym = nav.month;
    const today = ctx.iso(new Date());
    const mm = core().moneyMonth(ledger, ym);
    const prev = core().moneyMonth(ledger, core().shiftYm(ym, -1));
    if (ui.drill) {
      const drillCat = ledger.categories.find(c => c.id === ui.drill);
      const leafHit = mm.categories.some(c => c.categoryId === ui.drill);
      const groupHit = drillCat?.isGroup && mm.categories.some(c => ledger.categories.find(x => x.id === c.categoryId)?.parentId === drillCat.id);
      if (!drillCat || (!leafHit && !groupHit)) ui.drill = "";
    }
    disposeCharts();
    host.classList.add("money-page");
    host.innerHTML = `${headerHtml(ym, ym >= today.slice(0, 7))}
      ${overviewHtml(ledger, mm, prev, ym)}
      ${categoriesHtml(ledger, mm, ym)}
      ${dailyHtml(ledger, mm, ym)}
      ${fixedHtml(ledger)}
      ${listHtml(ledger, ym)}
      ${settingsHtml(ledger)}`;
    bind(host, ledger);
    drawCharts(host, ledger, mm);
    if (ui.import?.open) mountImportSheet();
    if (!resizeBound) {
      resizeBound = true;
      root.addEventListener?.("resize", () => Object.values(charts).forEach(c => c?.resize?.()));
    }
    return true;
  }

  root.LifeLedgerMoneyUI = {
    render,
    openSheet: () => { if (ctx && nav) openSheet(); },
    openImport: opts => { if (ctx && nav) openImportWizard(opts); },
    fxUrl,
    categoryPickerRows,
    applySameMerchantCategory,
    _ui: ui,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
