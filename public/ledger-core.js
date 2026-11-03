/* Bookkeeping core: integer minor units, ISO dates, no runtime network. MIT — Life Ledger project. */
(function (root) {
  const LEDGER_VERSION = 1;
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

  const DEFAULT_EXPENSE_CATEGORIES = [
    { slug: "groceries", name: "Groceries", icon: "shopping", color: "sage", zh: "日用", de: "Lebensmittel" },
    { slug: "dining", name: "Dining", icon: "coffee", color: "amber", zh: "餐饮", de: "Essen" },
    { slug: "transport", name: "Transport", icon: "car", color: "blue", zh: "交通", de: "Mobilität" },
    { slug: "housing", name: "Housing", icon: "home", color: "coral", zh: "住房", de: "Wohnen" },
    { slug: "health", name: "Health", icon: "heart", color: "violet", zh: "健康", de: "Gesundheit" },
    { slug: "shopping", name: "Shopping", icon: "shopping", color: "cyan", zh: "购物", de: "Einkauf" },
    { slug: "entertainment", name: "Entertainment", icon: "music", color: "amber", zh: "娱乐", de: "Freizeit" },
    { slug: "other", name: "Other", icon: "more", color: "sage", zh: "其他", de: "Sonstiges" },
  ];
  const DEFAULT_INCOME_CATEGORIES = [
    { slug: "salary", name: "Salary", icon: "wallet", color: "sage", zh: "工资", de: "Gehalt" },
    { slug: "side-income", name: "Side income", icon: "sparkles", color: "amber", zh: "副业", de: "Nebeneinkommen" },
    { slug: "other-income", name: "Other income", icon: "plus", color: "blue", zh: "其他收入", de: "Sonstige Einnahmen" },
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createId() {
    if (root.crypto?.randomUUID) return root.crypto.randomUUID();
    return `ledger-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  function emptyLedger() {
    return {
      version: LEDGER_VERSION,
      settings: { defaultCurrency: "EUR", secondaryCurrency: "CNY" },
      accounts: [],
      categories: [],
      transactions: [],
      budgets: [],
      recurring: [],
      meta: { recentCategoryIds: [], lastEntryAt: 0 },
    };
  }

  function localizedCategoryName(cat, lang) {
    if (!cat) return "";
    const code = String(lang || "en").slice(0, 2);
    if (code === "zh" && cat.nameZh) return cat.nameZh;
    if (code === "de" && cat.nameDe) return cat.nameDe;
    return cat.name || "";
  }

  function seedDefaultCategories(categories, lang) {
    const out = [...categories];
    const has = kind => out.some(c => c.kind === kind && !c.archived);
    const code = String(lang || "en").slice(0, 2);
    if (!has("expense")) {
      DEFAULT_EXPENSE_CATEGORIES.forEach(def => {
        out.push({
          id: createId(),
          defaultSlug: def.slug,
          name: def.name,
          nameZh: def.zh,
          nameDe: def.de,
          kind: "expense",
          icon: def.icon,
          color: def.color,
          parentId: "",
          archived: false,
        });
      });
    }
    if (!has("income")) {
      DEFAULT_INCOME_CATEGORIES.forEach(def => {
        out.push({
          id: createId(),
          defaultSlug: def.slug,
          name: def.name,
          nameZh: def.zh,
          nameDe: def.de,
          kind: "income",
          icon: def.icon,
          color: def.color,
          parentId: "",
          archived: false,
        });
      });
    }
    return out;
  }

  function categoryMatchesDefault(cat, def) {
    if (cat.defaultSlug && def.slug && cat.defaultSlug === def.slug) return true;
    if (cat.name === def.name) return true;
    if (cat.name === def.zh || cat.name === def.de) return true;
    const glyphMatch = cat.icon === def.icon && cat.color === def.color;
    if (glyphMatch && cat.nameZh === def.zh) return true;
    if (glyphMatch && cat.nameDe === def.de) return true;
    return false;
  }

  function defaultDefForCategory(cat) {
    if (!cat || cat.archived) return null;
    const pool = cat.kind === "income" ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
    return pool.find(def => categoryMatchesDefault(cat, def)) || null;
  }

  /** One-time repair when old seeds overwrote English `name` with zh/de. */
  function repairDefaultCategoryNames(categories) {
    if (!Array.isArray(categories)) return categories;
    return categories.map(cat => {
      const def = defaultDefForCategory(cat);
      if (!def) return cat;
      const next = { ...cat };
      const nameWasLocalized = next.name === def.zh || next.name === def.de;
      const localizedFieldsMatch = next.nameZh === def.zh || next.nameDe === def.de;
      if (nameWasLocalized || (next.name !== def.name && localizedFieldsMatch)) {
        next.name = def.name;
      }
      if (!next.nameZh) next.nameZh = def.zh;
      if (!next.nameDe) next.nameDe = def.de;
      return next;
    });
  }

  function ensurePrimaryAccount(ledger) {
    if (ledger.accounts.some(a => !a.archived)) return ledger;
    ledger.accounts.push({
      id: createId(),
      name: "Cash",
      currency: ledger.settings?.defaultCurrency || "EUR",
      kind: "checking",
      icon: "wallet",
      color: "sage",
      archived: false,
    });
    return ledger;
  }

  function validTransaction(tx) {
    return tx
      && typeof tx.id === "string"
      && typeof tx.accountId === "string"
      && typeof tx.categoryId === "string"
      && Number.isInteger(tx.amountMinor)
      && typeof tx.currency === "string"
      && ISO_DATE.test(tx.date)
      && typeof tx.note === "string";
  }

  function normalize(raw, options = {}) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      const fresh = emptyLedger();
      fresh.categories = seedDefaultCategories(fresh.categories, options.lang);
      ensurePrimaryAccount(fresh);
      return fresh;
    }
    const ledger = emptyLedger();
    ledger.version = raw.version === LEDGER_VERSION ? LEDGER_VERSION : LEDGER_VERSION;
    if (raw.settings && typeof raw.settings === "object") {
      ledger.settings = {
        defaultCurrency: typeof raw.settings.defaultCurrency === "string" ? raw.settings.defaultCurrency : "EUR",
        secondaryCurrency: typeof raw.settings.secondaryCurrency === "string" ? raw.settings.secondaryCurrency : "CNY",
      };
    }
    if (Array.isArray(raw.accounts)) {
      ledger.accounts = raw.accounts.filter(a => a && typeof a.id === "string" && typeof a.name === "string").map(a => ({
        id: a.id,
        name: a.name.slice(0, 120),
        currency: typeof a.currency === "string" ? a.currency : ledger.settings.defaultCurrency,
        kind: ["cash", "checking", "savings"].includes(a.kind) ? a.kind : "checking",
        icon: typeof a.icon === "string" ? a.icon : "wallet",
        color: typeof a.color === "string" ? a.color : "sage",
        archived: a.archived === true,
      }));
    }
    if (Array.isArray(raw.categories)) {
      ledger.categories = raw.categories.filter(c => c && typeof c.id === "string").map(c => ({
        id: c.id,
        name: String(c.name || "").slice(0, 80),
        nameZh: typeof c.nameZh === "string" ? c.nameZh : "",
        nameDe: typeof c.nameDe === "string" ? c.nameDe : "",
        kind: c.kind === "income" ? "income" : "expense",
        icon: typeof c.icon === "string" ? c.icon : "more",
        color: typeof c.color === "string" ? c.color : "sage",
        parentId: typeof c.parentId === "string" ? c.parentId : "",
        archived: c.archived === true,
      }));
    }
    if (Array.isArray(raw.transactions)) {
      ledger.transactions = raw.transactions.filter(validTransaction).map(tx => ({ ...tx, note: tx.note.slice(0, 500) }));
    }
    if (Array.isArray(raw.budgets)) {
      ledger.budgets = raw.budgets.filter(b => b && typeof b.categoryId === "string" && /^\d{4}-\d{2}$/.test(b.month || "")).map(b => ({
        id: typeof b.id === "string" ? b.id : createId(),
        categoryId: b.categoryId,
        month: b.month,
        limitMinor: Number.isInteger(b.limitMinor) ? b.limitMinor : 0,
        currency: typeof b.currency === "string" ? b.currency : ledger.settings.defaultCurrency,
      }));
    }
    if (Array.isArray(raw.recurring)) {
      ledger.recurring = raw.recurring
        .filter(Boolean)
        .map(r => normalizeRecurringEntry(r, ledger))
        .filter(r => r && r.categoryId && r.accountId && Number.isInteger(r.amountMinor) && r.amountMinor !== 0);
    }
    if (raw.meta && typeof raw.meta === "object") {
      ledger.meta.recentCategoryIds = Array.isArray(raw.meta.recentCategoryIds)
        ? raw.meta.recentCategoryIds.filter(id => typeof id === "string").slice(0, 12)
        : [];
      ledger.meta.lastEntryAt = Number(raw.meta.lastEntryAt) || 0;
    }
    ledger.categories = repairDefaultCategoryNames(ledger.categories);
    ledger.categories = seedDefaultCategories(ledger.categories, options.lang);
    ensurePrimaryAccount(ledger);
    return ledger;
  }

  function parseAmountToken(token) {
    let s = token.trim().replace(/\s/g, "");
    let sign = 1;
    if (s.startsWith("+")) s = s.slice(1);
    else if (s.startsWith("-")) { sign = -1; s = s.slice(1); }
    if (!s) return null;
    if (s.includes(",") && s.includes(".")) {
      if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
      else s = s.replace(/,/g, "");
    } else if (s.includes(",")) s = s.replace(",", ".");
    const value = Number(s);
    if (!Number.isFinite(value)) return null;
    return Math.round(value * 100) * sign;
  }

  const DATE_WORDS = [
    { re: /(?:^|\s)(gestern|yesterday|昨天)(?:\s|$)/i, offset: -1 },
    { re: /(?:^|\s)(heute|today|今天)(?:\s|$)/i, offset: 0 },
    { re: /(?:^|\s)(vorgestern|day before yesterday|前天)(?:\s|$)/i, offset: -2 },
  ];

  function parseQuickEntry(text, ledger, options = {}) {
    const lang = options.lang || "en";
    const base = normalize(ledger, { lang });
    let raw = String(text || "").trim();
    if (!raw) return { ok: false, error: "empty" };

    let dateOffset = 0;
    for (const rule of DATE_WORDS) {
      if (rule.re.test(raw)) {
        dateOffset = rule.offset;
        raw = raw.replace(rule.re, " ").trim();
        break;
      }
    }
    const iso = options.today || isoDateFromDate(new Date());
    const d = new Date(`${iso}T12:00:00`);
    d.setDate(d.getDate() + dateOffset);
    const date = isoDateFromDate(d);

    const amountMatch = raw.match(/^([+-]?\d[\d.,]*)\s*(.*)$/) || raw.match(/^(.+?)\s+([+-]?\d[\d.,]*)$/);
    let amountMinor = null;
    let notePart = raw;
    if (amountMatch) {
      if (/^\d/.test(amountMatch[1]) || /^[+-]/.test(amountMatch[1])) {
        amountMinor = parseAmountToken(amountMatch[1]);
        notePart = (amountMatch[2] || "").trim();
      } else {
        amountMinor = parseAmountToken(amountMatch[2]);
        notePart = (amountMatch[1] || "").trim();
      }
    }
    if (amountMinor === null) return { ok: false, error: "amount" };

    const activeCategories = base.categories.filter(c => !c.archived);
    const hint = notePart.toLowerCase();
    let category = activeCategories.find(c => localizedCategoryName(c, lang).toLowerCase() === hint);
    if (!category && hint) {
      category = activeCategories.find(c => localizedCategoryName(c, lang).toLowerCase().includes(hint) || hint.includes(localizedCategoryName(c, lang).toLowerCase()));
    }
    if (!category) {
      category = activeCategories.find(c => c.kind === (amountMinor < 0 ? "expense" : "income") && /other|sonst|其他/i.test(c.name));
    }
    if (!category) {
      category = activeCategories.find(c => c.kind === (amountMinor < 0 ? "expense" : "income"));
    }

    const explicitIncome = /^\+\s*\d/.test(String(text || "").trim());
    const incomeCategoryByName = category?.kind === "income" && hint
      && activeCategories.some(c => c.id === category.id && (
        localizedCategoryName(c, lang).toLowerCase() === hint
        || localizedCategoryName(c, lang).toLowerCase().includes(hint)
        || hint.includes(localizedCategoryName(c, lang).toLowerCase())
      ));
    if (amountMinor > 0 && !explicitIncome && !incomeCategoryByName) {
      amountMinor = -Math.abs(amountMinor);
    }
    if (amountMinor > 0 && category?.kind === "expense") amountMinor = -Math.abs(amountMinor);
    if (amountMinor < 0 && category?.kind === "income" && explicitIncome) amountMinor = Math.abs(amountMinor);
    else if (amountMinor < 0 && category?.kind === "income") {
      category = activeCategories.find(c => c.kind === "expense") || category;
    }

    const account = base.accounts.find(a => !a.archived) || base.accounts[0];
    if (!account || !category) return { ok: false, error: "setup" };

    if (amountMinor > 0 && category.kind === "expense") amountMinor = -amountMinor;
    if (amountMinor < 0 && category.kind === "income" && explicitIncome) amountMinor = Math.abs(amountMinor);

    return {
      ok: true,
      draft: {
        accountId: account.id,
        categoryId: category.id,
        amountMinor,
        currency: account.currency,
        date,
        note: notePart || localizedCategoryName(category, lang),
      },
    };
  }

  function monthKey(date) {
    return String(date || "").slice(0, 7);
  }

  function transactionsInMonth(ledger, ym) {
    return ledger.transactions.filter(tx => monthKey(tx.date) === ym);
  }

  function reportingCurrency(ledger) {
    return normalize(ledger).settings.defaultCurrency || "EUR";
  }

  function txInReportingCurrency(ledger, tx) {
    const cur = reportingCurrency(ledger);
    return (tx.currency || cur) === cur;
  }

  function monthSummary(ledger, ym) {
    const base = normalize(ledger);
    const inMonth = transactionsInMonth(base, ym);
    const rows = inMonth.filter(tx => txInReportingCurrency(base, tx));
    const otherCurrencyCount = inMonth.filter(tx => !txInReportingCurrency(base, tx)).length;
    let income = 0;
    let expense = 0;
    rows.forEach(tx => {
      if (tx.amountMinor >= 0) income += tx.amountMinor;
      else expense += tx.amountMinor;
    });
    return {
      incomeMinor: income,
      expenseMinor: expense,
      netMinor: income + expense,
      count: rows.length,
      otherCurrencyCount,
    };
  }

  function rangeSummary(ledger, startIso, endIso) {
    const base = normalize(ledger);
    const start = startIso <= endIso ? startIso : endIso;
    const end = startIso <= endIso ? endIso : startIso;
    const inRange = base.transactions.filter(tx => tx.date >= start && tx.date <= end);
    const rows = inRange.filter(tx => txInReportingCurrency(base, tx));
    const otherCurrencyCount = inRange.filter(tx => !txInReportingCurrency(base, tx)).length;
    let income = 0;
    let expense = 0;
    rows.forEach(tx => {
      if (tx.amountMinor >= 0) income += tx.amountMinor;
      else expense += tx.amountMinor;
    });
    return {
      incomeMinor: income,
      expenseMinor: expense,
      netMinor: income + expense,
      count: rows.length,
      otherCurrencyCount,
    };
  }

  function shiftIsoDate(iso, days) {
    if (!ISO_DATE.test(iso)) return iso;
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, m - 1, d, 12);
    dt.setDate(dt.getDate() + days);
    return isoDateFromDate(dt);
  }

  /** Percent change vs a prior baseline (always divides by previous period spend). */
  function temporalSpendChangePercent(previousExpenseMinor, currentExpenseMinor) {
    const prev = Math.abs(Number(previousExpenseMinor)) || 0;
    const cur = Math.abs(Number(currentExpenseMinor)) || 0;
    if (prev <= 0) return null;
    return Math.round(Math.abs(cur - prev) / prev * 100);
  }

  /** When the prior period baseline is tiny, a money delta reads better than +900%. */
  const SPEND_COMPARE_AMOUNT_BASELINE_MINOR = 1500;
  /** When the percent jump is huge, show €/¥ delta instead of a capped +999%. */
  const SPEND_COMPARE_EXTREME_PERCENT = 500;

  function displaySpendDeltaPercent(deltaPercent, direction) {
    if (deltaPercent == null) return null;
    if (direction === "down") return deltaPercent;
    return Math.min(Math.round(deltaPercent), 999);
  }

  function preferSpendCompareAmountCaption(cmp) {
    if (!cmp || cmp.direction !== "up") return false;
    const prev = Math.abs(Number(cmp.previousExpenseMinor)) || 0;
    if (prev <= 0) return false;
    const delta = Math.abs(Number(cmp.deltaMinor)) || 0;
    if (delta <= 0) return false;
    if (prev < SPEND_COMPARE_AMOUNT_BASELINE_MINOR) return true;
    const pct = Number(cmp.deltaPercent);
    if (Number.isFinite(pct) && pct > SPEND_COMPARE_EXTREME_PERCENT) return true;
    return false;
  }

  /** Compare default-currency expenses for [start,end] vs the same span shifted back 7 days. */
  function alignedWeekSpendCompare(ledger, startIso, endIso) {
    if (!ISO_DATE.test(startIso) || !ISO_DATE.test(endIso)) return null;
    const start = startIso <= endIso ? startIso : endIso;
    const end = startIso <= endIso ? endIso : startIso;
    const curExp = Math.abs(rangeSummary(ledger, start, end).expenseMinor);
    const prevStart = shiftIsoDate(start, -7);
    const prevEnd = shiftIsoDate(end, -7);
    const prevExp = Math.abs(rangeSummary(ledger, prevStart, prevEnd).expenseMinor);
    if (curExp === 0 && prevExp === 0) return null;
    if (curExp === prevExp) {
      return {
        direction: "same",
        currentExpenseMinor: curExp,
        previousExpenseMinor: prevExp,
        deltaMinor: 0,
        deltaPercent: 0,
      };
    }
    const direction = curExp > prevExp ? "up" : "down";
    const deltaMinor = curExp - prevExp;
    const deltaPercent = temporalSpendChangePercent(prevExp, curExp);
    return {
      direction,
      currentExpenseMinor: curExp,
      previousExpenseMinor: prevExp,
      deltaMinor,
      deltaPercent,
    };
  }

  function ymLastDayIso(ym) {
    if (!/^\d{4}-\d{2}$/.test(ym)) return "";
    const [y, m] = ym.split("-").map(Number);
    const days = new Date(y, m, 0).getDate();
    return `${ym}-${String(days).padStart(2, "0")}`;
  }

  /** Compare default-currency expenses for ym through todayIso (or full month) vs the same day span in the previous month. */
  function alignedMonthSpendCompare(ledger, ym, todayIso) {
    if (!/^\d{4}-\d{2}$/.test(ym)) return null;
    const today = todayIso && ISO_DATE.test(todayIso) ? todayIso : null;
    const start = `${ym}-01`;
    const monthEnd = ymLastDayIso(ym);
    if (!monthEnd) return null;
    let end = monthEnd;
    if (today && monthKey(today) === ym && today >= start && today <= monthEnd) {
      end = today;
    }
    const endDay = Number(end.slice(8, 10));
    const prevYm = shiftYm(ym, -1);
    const prevStart = `${prevYm}-01`;
    const prevMonthEnd = ymLastDayIso(prevYm);
    if (!prevMonthEnd) return null;
    const prevEndDay = Math.min(endDay, Number(prevMonthEnd.slice(8, 10)));
    const prevEnd = `${prevYm}-${String(prevEndDay).padStart(2, "0")}`;
    const curExp = Math.abs(rangeSummary(ledger, start, end).expenseMinor);
    const prevExp = Math.abs(rangeSummary(ledger, prevStart, prevEnd).expenseMinor);
    if (curExp === 0 && prevExp === 0) return null;
    if (curExp === prevExp) {
      return {
        direction: "same",
        currentExpenseMinor: curExp,
        previousExpenseMinor: prevExp,
        deltaMinor: 0,
        deltaPercent: 0,
      };
    }
    const direction = curExp > prevExp ? "up" : "down";
    const deltaMinor = curExp - prevExp;
    const deltaPercent = temporalSpendChangePercent(prevExp, curExp);
    return {
      direction,
      currentExpenseMinor: curExp,
      previousExpenseMinor: prevExp,
      deltaMinor,
      deltaPercent,
    };
  }

  /** Compare default-currency expenses on isoDate vs the previous calendar day. */
  function alignedDaySpendCompare(ledger, isoDate) {
    if (!ISO_DATE.test(isoDate)) return null;
    const prev = shiftIsoDate(isoDate, -1);
    const curExp = Math.abs(rangeSummary(ledger, isoDate, isoDate).expenseMinor);
    const prevExp = Math.abs(rangeSummary(ledger, prev, prev).expenseMinor);
    if (curExp === 0 && prevExp === 0) return null;
    if (curExp === prevExp) {
      return {
        direction: "same",
        currentExpenseMinor: curExp,
        previousExpenseMinor: prevExp,
        deltaMinor: 0,
        deltaPercent: 0,
      };
    }
    const direction = curExp > prevExp ? "up" : "down";
    const deltaMinor = curExp - prevExp;
    const deltaPercent = temporalSpendChangePercent(prevExp, curExp);
    return {
      direction,
      currentExpenseMinor: curExp,
      previousExpenseMinor: prevExp,
      deltaMinor,
      deltaPercent,
    };
  }

  function dailySpendHeatmap(ledger, ym) {
    const base = normalize(ledger);
    const map = new Map();
    transactionsInMonth(base, ym).forEach(tx => {
      if (!txInReportingCurrency(base, tx) || tx.amountMinor >= 0) return;
      map.set(tx.date, (map.get(tx.date) || 0) + Math.abs(tx.amountMinor));
    });
    return map;
  }

  function categoryBreakdown(ledger, ym, kind = "expense") {
    const base = normalize(ledger);
    const totals = new Map();
    transactionsInMonth(base, ym).forEach(tx => {
      if (!txInReportingCurrency(base, tx)) return;
      const cat = base.categories.find(c => c.id === tx.categoryId);
      if (!cat || cat.kind !== kind) return;
      const mag = kind === "expense" ? Math.abs(Math.min(0, tx.amountMinor)) : Math.max(0, tx.amountMinor);
      if (!mag) return;
      totals.set(cat.id, (totals.get(cat.id) || 0) + mag);
    });
    return [...totals.entries()]
      .map(([categoryId, amountMinor]) => ({ categoryId, amountMinor }))
      .sort((a, b) => b.amountMinor - a.amountMinor);
  }

  function formatMoney(minor, currency, locale) {
    const loc = locale || "de-DE";
    const val = minor === 0 || Object.is(minor, -0) ? 0 : minor / 100;
    return new Intl.NumberFormat(loc, { style: "currency", currency: currency || "EUR" }).format(val);
  }

  function addTransaction(ledger, draft, options = {}) {
    const base = normalize(ledger, options);
    const tx = {
      id: createId(),
      accountId: draft.accountId,
      categoryId: draft.categoryId,
      amountMinor: draft.amountMinor,
      currency: draft.currency || base.settings.defaultCurrency,
      date: draft.date,
      note: String(draft.note || "").slice(0, 500),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    if (typeof draft.recurringId === "string" && draft.recurringId) tx.recurringId = draft.recurringId;
    if (!validTransaction(tx)) throw new Error("invalid-transaction");
    base.transactions.push(tx);
    const recent = [tx.categoryId, ...base.meta.recentCategoryIds.filter(id => id !== tx.categoryId)].slice(0, 8);
    base.meta.recentCategoryIds = recent;
    base.meta.lastEntryAt = tx.createdAt;
    return { ledger: base, transaction: tx };
  }

  function removeTransaction(ledger, id) {
    const base = normalize(ledger);
    const index = base.transactions.findIndex(t => t.id === id);
    if (index < 0) return null;
    const [removed] = base.transactions.splice(index, 1);
    return { ledger: base, removed, index };
  }

  function restoreTransaction(ledger, tx, index) {
    const base = normalize(ledger);
    const copy = { ...tx };
    base.transactions.splice(Math.max(0, Math.min(index, base.transactions.length)), 0, copy);
    return base;
  }

  function duplicateTransaction(ledger, id, options = {}) {
    const base = normalize(ledger, options);
    const tx = base.transactions.find(t => t.id === id);
    if (!tx) return null;
    const today = options.today || tx.date;
    return addTransaction(base, {
      accountId: tx.accountId,
      categoryId: tx.categoryId,
      amountMinor: tx.amountMinor,
      currency: tx.currency,
      date: today,
      note: tx.note,
    }, options);
  }

  function updateTransaction(ledger, id, patch, options = {}) {
    const base = normalize(ledger, options);
    const index = base.transactions.findIndex(t => t.id === id);
    if (index < 0) return null;
    const prev = base.transactions[index];
    const next = {
      ...prev,
      accountId: typeof patch.accountId === "string" ? patch.accountId : prev.accountId,
      categoryId: typeof patch.categoryId === "string" ? patch.categoryId : prev.categoryId,
      amountMinor: Number.isInteger(patch.amountMinor) ? patch.amountMinor : prev.amountMinor,
      currency: typeof patch.currency === "string" ? patch.currency : prev.currency,
      date: typeof patch.date === "string" && ISO_DATE.test(patch.date) ? patch.date : prev.date,
      note: typeof patch.note === "string" ? patch.note.slice(0, 500) : prev.note,
      id: prev.id,
      createdAt: prev.createdAt,
      updatedAt: Date.now(),
    };
    if (!validTransaction(next)) return null;
    base.transactions[index] = next;
    return { ledger: base, transaction: next };
  }

  function normalizeRecurringEntry(raw, ledger) {
    if (!raw || typeof raw !== "object") return null;
    const accountId = typeof raw.accountId === "string"
      ? raw.accountId
      : (ledger.accounts.find(a => !a.archived)?.id || "");
    return {
      id: typeof raw.id === "string" ? raw.id : createId(),
      label: String(raw.label || "").slice(0, 120),
      accountId,
      categoryId: typeof raw.categoryId === "string" ? raw.categoryId : "",
      amountMinor: Number.isInteger(raw.amountMinor) ? raw.amountMinor : 0,
      currency: typeof raw.currency === "string" ? raw.currency : ledger.settings.defaultCurrency,
      dayOfMonth: Math.min(28, Math.max(1, Number(raw.dayOfMonth) || 1)),
      cadence: raw.cadence === "weekly" ? "weekly" : "monthly",
      weekday: raw.cadence === "weekly"
        ? Math.min(6, Math.max(0, Number.isInteger(raw.weekday) ? raw.weekday : new Date().getDay()))
        : undefined,
      note: typeof raw.note === "string" ? raw.note.slice(0, 500) : "",
    };
  }

  function isoDateFromDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function weekNumberIso(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  function isoWeekKeyFromDate(date) {
    return `${date.getFullYear()}-W${String(weekNumberIso(date)).padStart(2, "0")}`;
  }

  function isoWeekKeyFromIso(iso) {
    if (!ISO_DATE.test(iso)) return "";
    const [y, m, day] = iso.split("-").map(Number);
    return isoWeekKeyFromDate(new Date(y, m - 1, day, 12));
  }

  /** Calendar dates in ym whose weekday matches a weekly template (0=Sun … 6=Sat). */
  function weeklyOccurrenceDatesInMonth(rec, ym) {
    if (!/^\d{4}-\d{2}$/.test(ym || "") || rec?.cadence !== "weekly") return [];
    const [y, m] = ym.split("-").map(Number);
    const wd = Number.isInteger(rec.weekday) ? rec.weekday : 1;
    const daysInMonth = new Date(y, m, 0).getDate();
    const out = [];
    for (let d = 1; d <= daysInMonth; d += 1) {
      const dt = new Date(y, m - 1, d, 12);
      if (dt.getDay() === wd) out.push(isoDateFromDate(dt));
    }
    return out;
  }

  /** Latest date on or before referenceIso whose weekday matches (0=Sun … 6=Sat). */
  function nearestWeekdayIso(weekday, referenceIso) {
    const ref = referenceIso && ISO_DATE.test(referenceIso)
      ? referenceIso
      : isoDateFromDate(new Date());
    const start = new Date(`${ref}T12:00:00`);
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(start);
      d.setDate(d.getDate() - i);
      if (d.getDay() === weekday) return isoDateFromDate(d);
    }
    return ref;
  }

  function upsertRecurringTemplate(ledger, draft, options = {}) {
    const base = normalize(ledger, options);
    const rec = normalizeRecurringEntry({ ...draft, id: draft?.id || createId() }, base);
    if (!rec || !rec.categoryId || !rec.accountId || !Number.isInteger(rec.amountMinor) || rec.amountMinor === 0) return null;
    const cat = base.categories.find(c => c.id === rec.categoryId);
    if (!cat) return null;
    if (cat.kind === "income" && rec.amountMinor < 0) rec.amountMinor = Math.abs(rec.amountMinor);
    if (cat.kind === "expense" && rec.amountMinor > 0) rec.amountMinor = -Math.abs(rec.amountMinor);
    const index = base.recurring.findIndex(r => r && r.id === rec.id);
    if (index >= 0) base.recurring[index] = rec;
    else base.recurring.push(rec);
    return { ledger: base, recurring: rec };
  }

  function removeRecurringTemplate(ledger, id) {
    const base = normalize(ledger);
    const index = base.recurring.findIndex(r => r && r.id === id);
    if (index < 0) return null;
    const removed = { ...base.recurring[index] };
    base.recurring = base.recurring.filter((_, i) => i !== index);
    return { ledger: base, removed, index };
  }

  function restoreRecurringTemplate(ledger, removed, index) {
    const base = normalize(ledger);
    if (!removed || typeof removed.id !== "string") return base;
    const next = [...base.recurring];
    const at = Number.isInteger(index) && index >= 0 && index <= next.length ? index : next.length;
    next.splice(at, 0, { ...removed });
    base.recurring = next;
    return base;
  }

  function applyRecurringTemplate(ledger, recurringId, options = {}) {
    const base = normalize(ledger, options);
    const rec = base.recurring.find(r => r && r.id === recurringId);
    if (!rec || !Number.isInteger(rec.amountMinor)) return null;
    const today = options.today && ISO_DATE.test(options.today) ? options.today : "";
    const refIso = today || isoDateFromDate(new Date());
    let date = today;
    if (!date) {
      if (rec.cadence === "weekly") {
        const wd = Number.isInteger(rec.weekday) ? rec.weekday : 1;
        date = nearestWeekdayIso(wd, refIso);
      } else {
        const ym = refIso.slice(0, 7);
        const day = Math.min(28, Math.max(1, Number(rec.dayOfMonth) || 1));
        date = `${ym}-${String(day).padStart(2, "0")}`;
      }
    }
    const accountId = rec.accountId || base.accounts.find(a => !a.archived)?.id;
    if (!accountId || !rec.categoryId) return null;
    return addTransaction(base, {
      accountId,
      categoryId: rec.categoryId,
      amountMinor: rec.amountMinor,
      currency: rec.currency || base.settings.defaultCurrency,
      date,
      note: rec.note || rec.label || "",
      recurringId: rec.id,
    }, options);
  }

  function transactionFulfillsRecurringOccurrence(tx, rec, occurrenceIso) {
    if (!tx || !rec || !ISO_DATE.test(occurrenceIso)) return false;
    if (typeof tx.date !== "string" || !ISO_DATE.test(tx.date)) return false;
    if (isoWeekKeyFromIso(tx.date) !== isoWeekKeyFromIso(occurrenceIso)) return false;
    if (typeof tx.recurringId === "string" && tx.recurringId === rec.id) return true;
    return tx.categoryId === rec.categoryId && tx.amountMinor === rec.amountMinor;
  }

  function transactionFulfillsRecurring(tx, rec, ym) {
    if (!tx || !rec || typeof tx.date !== "string" || !tx.date.startsWith(ym)) return false;
    if (rec.cadence === "weekly") {
      return weeklyOccurrenceDatesInMonth(rec, ym).some(
        occ => transactionFulfillsRecurringOccurrence(tx, rec, occ),
      );
    }
    if (typeof tx.recurringId === "string" && tx.recurringId === rec.id) return true;
    return tx.categoryId === rec.categoryId && tx.amountMinor === rec.amountMinor;
  }

  function recurringPostedInMonth(ledger, rec, ym, options = {}) {
    if (rec.cadence === "weekly") {
      const dates = weeklyOccurrenceDatesInMonth(rec, ym);
      if (!dates.length) return true;
      const base = normalize(ledger, options);
      return dates.every(occ => base.transactions.some(
        tx => transactionFulfillsRecurringOccurrence(tx, rec, occ),
      ));
    }
    const base = normalize(ledger, options);
    return base.transactions.some(tx => transactionFulfillsRecurring(tx, rec, ym));
  }

  function recurringPendingForMonth(ledger, ym, options = {}) {
    if (!/^\d{4}-\d{2}$/.test(ym || "")) return [];
    const base = normalize(ledger, options);
    return (base.recurring || []).filter(rec => rec && rec.id && !recurringPostedInMonth(base, rec, ym, options));
  }

  /** Unposted occurrence count for one template in ym (weekly = remaining weekdays; monthly = 0 or 1). */
  function recurringUnpostedOccurrenceCount(ledger, rec, ym, options = {}) {
    if (!rec?.id || !/^\d{4}-\d{2}$/.test(ym || "")) return 0;
    if (rec.cadence === "weekly") {
      const base = normalize(ledger, options);
      const dates = weeklyOccurrenceDatesInMonth(rec, ym);
      return dates.filter(
        occ => !base.transactions.some(tx => transactionFulfillsRecurringOccurrence(tx, rec, occ)),
      ).length;
    }
    return recurringPostedInMonth(ledger, rec, ym, options) ? 0 : 1;
  }

  function recurringPendingOccurrenceCount(ledger, ym, options = {}) {
    return recurringPendingForMonth(ledger, ym, options).reduce(
      (sum, rec) => sum + recurringUnpostedOccurrenceCount(ledger, rec, ym, options),
      0,
    );
  }

  function applyAllRecurringPending(ledger, ym, options = {}) {
    if (!/^\d{4}-\d{2}$/.test(ym || "")) return null;
    let current = normalize(ledger, options);
    const transactions = [];
    const today = options.today && ISO_DATE.test(options.today) ? options.today : "";
    (current.recurring || []).forEach(rec => {
      if (!rec?.id || recurringPostedInMonth(current, rec, ym, options)) return;
      if (rec.cadence === "weekly") {
        weeklyOccurrenceDatesInMonth(rec, ym).forEach(occ => {
          if (today && occ > today) return;
          if (current.transactions.some(tx => transactionFulfillsRecurringOccurrence(tx, rec, occ))) return;
          const accountId = rec.accountId || current.accounts.find(a => !a.archived)?.id;
          if (!accountId || !rec.categoryId) return;
          const posted = addTransaction(current, {
            accountId,
            categoryId: rec.categoryId,
            amountMinor: rec.amountMinor,
            currency: rec.currency || current.settings.defaultCurrency,
            date: occ,
            note: rec.note || rec.label || "",
            recurringId: rec.id,
          }, options);
          if (!posted) return;
          current = posted.ledger;
          transactions.push(posted.transaction);
        });
        return;
      }
      const result = applyRecurringTemplate(current, rec.id, { ...options, today: today || undefined });
      if (!result) return;
      current = result.ledger;
      transactions.push(result.transaction);
    });
    return transactions.length ? { ledger: current, transactions } : null;
  }

  /** Compare average daily spend on great-mood vs low-mood days (mood values are canonical zh keys). */
  function moodSpendComparison(dailyRows, options = {}) {
    const greatMood = options.greatMood || "很好";
    const lowMood = options.lowMood || "低落";
    let greatSpend = 0;
    let greatDays = 0;
    let lowSpend = 0;
    let lowDays = 0;
    (dailyRows || []).forEach(row => {
      const spend = row?.spendMinor || 0;
      if (!spend) return;
      if (row.mood === greatMood) { greatSpend += spend; greatDays += 1; }
      if (row.mood === lowMood) { lowSpend += spend; lowDays += 1; }
    });
    if (!greatDays || !lowDays) return null;
    const greatAvg = Math.round(greatSpend / greatDays);
    const lowAvg = Math.round(lowSpend / lowDays);
    if (greatAvg === lowAvg) return null;
    return { greatAvg, lowAvg, greatDays, lowDays };
  }

  /** Percent lift from the lower average to the higher (both positive spend amounts). */
  function spendInsightDeltaPercent(higherAvg, lowerAvg) {
    const high = Number(higherAvg);
    const low = Number(lowerAvg);
    if (!Number.isFinite(high) || !Number.isFinite(low) || low <= 0 || high <= low) return null;
    return Math.round(((high - low) / low) * 100);
  }

  const MOOD_SCATTER_ORDER = ["很好", "平静", "低落"];
  const MOOD_SCATTER_COLORS = { 很好: "#34c759", 平静: "#64d2ff", 低落: "#ff9f0a" };

  function scatterTipAttrEsc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function scatterTipLocale(lang) {
    const code = String(lang || "en").slice(0, 2);
    if (code === "zh") return "zh-CN";
    if (code === "de") return "de-DE";
    return "en-GB";
  }

  function formatScatterTipDate(iso, locale) {
    if (!ISO_DATE.test(iso)) return iso;
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, m - 1, d, 12);
    return new Intl.DateTimeFormat(locale || "de-DE", { month: "short", day: "numeric" }).format(dt);
  }

  function moodScatterDisplayLabel(mood, lang) {
    const code = String(lang || "en").slice(0, 2);
    if (mood === "很好") return code === "zh" ? "很好" : code === "de" ? "Gut" : "Good";
    if (mood === "平静") return code === "zh" ? "平静" : code === "de" ? "Ruhig" : "Calm";
    if (mood === "低落") return code === "zh" ? "低落" : code === "de" ? "Schwer" : "Low";
    return mood;
  }

  function moodScatterTipLines(point, options = {}) {
    const locale = options.locale || scatterTipLocale(options.lang);
    const currency = options.currency || "EUR";
    const spend = formatMoney(-Math.abs(point.spendMinor), currency, locale);
    const mood = moodScatterDisplayLabel(point.mood, options.lang);
    return {
      line1: formatScatterTipDate(point.date, locale),
      line2: `${spend} · ${mood}`,
    };
  }

  function habitScatterTipLines(point, options = {}) {
    const locale = options.locale || scatterTipLocale(options.lang);
    const currency = options.currency || "EUR";
    const spend = formatMoney(-Math.abs(point.spendMinor), currency, locale);
    const pct = `${point.completionPercent}%`;
    const code = String(options.lang || "en").slice(0, 2);
    const habitsLabel = code === "zh" ? "习惯" : code === "de" ? "Gewohnheiten" : "Habits";
    return {
      line1: formatScatterTipDate(point.date, locale),
      line2: `${spend} · ${pct} ${habitsLabel}`,
    };
  }

  function focusScatterTipLines(point, options = {}) {
    const locale = options.locale || scatterTipLocale(options.lang);
    const currency = options.currency || "EUR";
    const spend = formatMoney(-Math.abs(point.spendMinor), currency, locale);
    const code = String(options.lang || "en").slice(0, 2);
    const mins = Math.round(point.focusMinutes);
    const focusLabel = code === "zh"
      ? `${mins} 分钟专注`
      : code === "de"
        ? `${mins} Min. Fokus`
        : `${mins} min focus`;
    return {
      line1: formatScatterTipDate(point.date, locale),
      line2: `${spend} · ${focusLabel}`,
    };
  }

  function scatterDotMarkup({ x, y, color, index, className, line1, line2 }) {
    const cx = x.toFixed(1);
    const cy = y.toFixed(1);
    const l1 = scatterTipAttrEsc(line1);
    const l2 = scatterTipAttrEsc(line2);
    const aria = scatterTipAttrEsc(`${line1} — ${line2}`);
    const tab = index === 0 ? "0" : "-1";
    return `<g class="review-scatter-dot-group" style="--dot-i:${index}"><circle class="review-scatter-dot-hit" cx="${cx}" cy="${cy}" r="9" fill="transparent" data-tip-line1="${l1}" data-tip-line2="${l2}" aria-label="${aria}" tabindex="${tab}" role="button"/><circle class="${className}" cx="${cx}" cy="${cy}" r="4.5" fill="${color}" opacity="0.82" pointer-events="none"/></g>`;
  }

  /** Daily mood vs spend points for a compact review scatter (needs ≥3 spending days with mood). */
  function moodSpendScatter(dailyRows, options = {}) {
    const moodOrder = options.moodOrder || MOOD_SCATTER_ORDER;
    const minSpend = options.minSpendMinor || 1;
    const points = [];
    (dailyRows || []).forEach((row, index) => {
      const spend = row?.spendMinor || 0;
      if (spend < minSpend || !row?.mood) return;
      const moodIndex = moodOrder.indexOf(row.mood);
      if (moodIndex < 0) return;
      points.push({
        date: row.date,
        mood: row.mood,
        moodIndex,
        spendMinor: spend,
        jitter: ((index * 17 + spend) % 7) / 7 - 0.5,
      });
    });
    if (points.length < 3) return null;
    const maxSpend = Math.max(...points.map(p => p.spendMinor));
    return { points, moodOrder, maxSpend };
  }

  function renderMoodSpendScatterSvg(scatter, options = {}) {
    if (!scatter?.points?.length) return "";
    const width = options.width || 280;
    const height = options.height || 92;
    const pad = { left: 10, right: 10, top: 10, bottom: 22 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const slots = scatter.moodOrder.length;
    const maxSpend = Math.max(1, scatter.maxSpend);
    const tipOpts = { lang: options.lang, locale: options.locale, currency: options.currency };
    const dots = scatter.points.map((p, i) => {
      const xSlot = (p.moodIndex + 0.5) / slots;
      const x = pad.left + xSlot * plotW + p.jitter * (plotW / slots) * 0.35;
      const y = pad.top + plotH - (p.spendMinor / maxSpend) * plotH;
      const color = MOOD_SCATTER_COLORS[p.mood] || "#888";
      const tip = moodScatterTipLines(p, tipOpts);
      return scatterDotMarkup({
        x,
        y,
        color,
        index: i,
        className: "review-mood-scatter-dot",
        line1: tip.line1,
        line2: tip.line2,
      });
    }).join("");
    const guides = scatter.moodOrder.map((mood, i) => {
      const x = pad.left + ((i + 0.5) / slots) * plotW;
      return `<line class="review-mood-scatter-guide" x1="${x.toFixed(1)}" y1="${pad.top}" x2="${x.toFixed(1)}" y2="${pad.top + plotH}" stroke="currentColor" stroke-opacity="0.08"/>`;
    }).join("");
    return `<svg class="review-mood-scatter" viewBox="0 0 ${width} ${height}" role="img" aria-label="">${guides}${dots}</svg>`;
  }

  const HABIT_SCATTER_COLORS = { high: "#6f8f7d", mid: "#9aa8a0", low: "#e07a5f" };

  /** Habit completion % (x) vs daily spend (y); needs ≥3 spending days with completion data. */
  function habitCompletionSpendScatter(dailyRows, options = {}) {
    const minSpend = options.minSpendMinor || 1;
    const highThreshold = options.highThreshold ?? 70;
    const lowThreshold = options.lowThreshold ?? 40;
    const points = [];
    (dailyRows || []).forEach((row, index) => {
      const spend = row?.spendMinor || 0;
      if (spend < minSpend || !Number.isFinite(row.completionPercent)) return;
      const pct = row.completionPercent;
      let band = "mid";
      if (pct >= highThreshold) band = "high";
      else if (pct <= lowThreshold) band = "low";
      points.push({
        date: row.date,
        completionPercent: pct,
        spendMinor: spend,
        band,
        jitter: ((index * 13 + spend) % 5) / 5 - 0.5,
      });
    });
    if (points.length < 3) return null;
    const maxSpend = Math.max(...points.map(p => p.spendMinor));
    return { points, maxSpend, highThreshold, lowThreshold };
  }

  function renderHabitCompletionSpendScatterSvg(scatter, options = {}) {
    if (!scatter?.points?.length) return "";
    const width = options.width || 280;
    const height = options.height || 92;
    const pad = { left: 10, right: 10, top: 10, bottom: 22 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const maxSpend = Math.max(1, scatter.maxSpend);
    const hiX = pad.left + (scatter.highThreshold / 100) * plotW;
    const loX = pad.left + (scatter.lowThreshold / 100) * plotW;
    const zones = `<rect x="${pad.left}" y="${pad.top}" width="${Math.max(0, loX - pad.left).toFixed(1)}" height="${plotH}" fill="${HABIT_SCATTER_COLORS.low}" opacity="0.06"/>
      <rect x="${loX.toFixed(1)}" y="${pad.top}" width="${Math.max(0, hiX - loX).toFixed(1)}" height="${plotH}" fill="${HABIT_SCATTER_COLORS.mid}" opacity="0.05"/>
      <rect x="${hiX.toFixed(1)}" y="${pad.top}" width="${Math.max(0, pad.left + plotW - hiX).toFixed(1)}" height="${plotH}" fill="${HABIT_SCATTER_COLORS.high}" opacity="0.08"/>`;
    const tipOpts = { lang: options.lang, locale: options.locale, currency: options.currency };
    const dots = scatter.points.map((p, i) => {
      const xNorm = Math.max(0, Math.min(100, p.completionPercent)) / 100;
      const x = pad.left + xNorm * plotW + p.jitter * 4;
      const y = pad.top + plotH - (p.spendMinor / maxSpend) * plotH;
      const color = HABIT_SCATTER_COLORS[p.band] || HABIT_SCATTER_COLORS.mid;
      const tip = habitScatterTipLines(p, tipOpts);
      return scatterDotMarkup({
        x,
        y,
        color,
        index: i,
        className: "review-habit-scatter-dot",
        line1: tip.line1,
        line2: tip.line2,
      });
    }).join("");
    const axis = `<line x1="${pad.left}" y1="${pad.top + plotH}" x2="${pad.left + plotW}" y2="${pad.top + plotH}" stroke="currentColor" stroke-opacity="0.12"/>`;
    return `<svg class="review-habit-scatter" viewBox="0 0 ${width} ${height}" role="img" aria-label="">${zones}${axis}${dots}</svg>`;
  }

  const FOCUS_SCATTER_COLORS = { high: "#7c6fd6", mid: "#9aa8c8", low: "#c4b5fd" };

  /** Focus minutes (x) vs daily spend (y); needs ≥3 spending days with focus data. */
  function focusSpendScatter(dailyRows, options = {}) {
    const minSpend = options.minSpendMinor || 1;
    const highMinutes = options.highMinutes ?? 60;
    const lowMinutes = options.lowMinutes ?? 25;
    const maxFocusCap = options.maxFocusMinutes ?? 180;
    const points = [];
    (dailyRows || []).forEach((row, index) => {
      const spend = row?.spendMinor || 0;
      if (spend < minSpend || !Number.isFinite(row.focusMinutes)) return;
      const mins = Math.max(0, row.focusMinutes);
      let band = "mid";
      if (mins >= highMinutes) band = "high";
      else if (mins <= lowMinutes) band = "low";
      points.push({
        date: row.date,
        focusMinutes: mins,
        spendMinor: spend,
        band,
        jitter: ((index * 11 + spend) % 5) / 5 - 0.5,
      });
    });
    if (points.length < 3) return null;
    const maxSpend = Math.max(...points.map(p => p.spendMinor));
    const maxFocus = Math.max(highMinutes + 1, ...points.map(p => p.focusMinutes), maxFocusCap);
    return { points, maxSpend, maxFocus, highMinutes, lowMinutes };
  }

  function renderFocusSpendScatterSvg(scatter, options = {}) {
    if (!scatter?.points?.length) return "";
    const width = options.width || 280;
    const height = options.height || 92;
    const pad = { left: 10, right: 10, top: 10, bottom: 22 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const maxSpend = Math.max(1, scatter.maxSpend);
    const maxFocus = Math.max(1, scatter.maxFocus);
    const hiX = pad.left + (scatter.highMinutes / maxFocus) * plotW;
    const loX = pad.left + (scatter.lowMinutes / maxFocus) * plotW;
    const zones = `<rect x="${pad.left}" y="${pad.top}" width="${Math.max(0, loX - pad.left).toFixed(1)}" height="${plotH}" fill="${FOCUS_SCATTER_COLORS.low}" opacity="0.07"/>
      <rect x="${loX.toFixed(1)}" y="${pad.top}" width="${Math.max(0, hiX - loX).toFixed(1)}" height="${plotH}" fill="${FOCUS_SCATTER_COLORS.mid}" opacity="0.05"/>
      <rect x="${hiX.toFixed(1)}" y="${pad.top}" width="${Math.max(0, pad.left + plotW - hiX).toFixed(1)}" height="${plotH}" fill="${FOCUS_SCATTER_COLORS.high}" opacity="0.1"/>`;
    const tipOpts = { lang: options.lang, locale: options.locale, currency: options.currency };
    const dots = scatter.points.map((p, i) => {
      const xNorm = Math.max(0, Math.min(maxFocus, p.focusMinutes)) / maxFocus;
      const x = pad.left + xNorm * plotW + p.jitter * 4;
      const y = pad.top + plotH - (p.spendMinor / maxSpend) * plotH;
      const color = FOCUS_SCATTER_COLORS[p.band] || FOCUS_SCATTER_COLORS.mid;
      const tip = focusScatterTipLines(p, tipOpts);
      return scatterDotMarkup({
        x,
        y,
        color,
        index: i,
        className: "review-focus-scatter-dot",
        line1: tip.line1,
        line2: tip.line2,
      });
    }).join("");
    const axis = `<line x1="${pad.left}" y1="${pad.top + plotH}" x2="${pad.left + plotW}" y2="${pad.top + plotH}" stroke="currentColor" stroke-opacity="0.12"/>`;
    return `<svg class="review-focus-scatter" viewBox="0 0 ${width} ${height}" role="img" aria-label="">${zones}${axis}${dots}</svg>`;
  }

  function ledgerStatsSnapshot(ledger, options = {}) {
    if (!ledger) return { hasLedger: false, transactions: 0, accounts: 0, categories: 0 };
    const base = normalize(ledger, options);
    return {
      hasLedger: true,
      transactions: base.transactions.length,
      accounts: base.accounts.filter(a => !a.archived).length,
      categories: base.categories.filter(c => !c.archived).length,
    };
  }

  /** Compare preserved device ledger vs current state for sync-conflict UI (read-only). */
  function ledgerConflictCompare(preservedLedger, currentLedger, options = {}) {
    const preserved = ledgerStatsSnapshot(preservedLedger, options);
    const current = ledgerStatsSnapshot(currentLedger, options);
    if (!preserved.hasLedger && !current.hasLedger) return null;
    return {
      preserved,
      current,
      differs: preserved.transactions !== current.transactions
        || preserved.categories !== current.categories
        || preserved.accounts !== current.accounts,
    };
  }

  function parseCssRgb(color) {
    const s = String(color || "").trim();
    let m = s.match(/^#([0-9a-f]{3,8})$/i);
    if (m) {
      let hex = m[1];
      if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
      if (hex.length === 6) {
        return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
      }
    }
    m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
    return null;
  }

  function relativeLuminance(color) {
    const rgb = parseCssRgb(color);
    if (!rgb) return null;
    const linear = rgb.map(v => {
      const c = Math.max(0, Math.min(255, v)) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  }

  function isLightAccentColor(color) {
    const lum = relativeLuminance(color);
    return lum != null && lum > 0.58;
  }

  function truncateTreemapLabel(text, maxChars) {
    const raw = String(text || "").trim();
    if (!raw) return "";
    const limit = Math.max(3, Number(maxChars) || 8);
    if (raw.length <= limit) return raw;
    if (limit <= 3) return raw.slice(0, limit);
    return `${raw.slice(0, limit - 1)}…`;
  }

  function polarPoint(cx, cy, r, deg) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  /** SVG annular sector for donut charts (angles in degrees, clockwise from 12 o'clock). */
  function annularSectorPath(cx, cy, rInner, rOuter, startDeg, endDeg) {
    if (endDeg - startDeg <= 0) return "";
    let end = endDeg;
    if (end - startDeg >= 360) end = startDeg + 359.999;
    const p0 = polarPoint(cx, cy, rOuter, startDeg);
    const p1 = polarPoint(cx, cy, rOuter, end);
    const p2 = polarPoint(cx, cy, rInner, end);
    const p3 = polarPoint(cx, cy, rInner, startDeg);
    const large = end - startDeg > 180 ? 1 : 0;
    return [
      `M ${p0.x.toFixed(3)} ${p0.y.toFixed(3)}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${p1.x.toFixed(3)} ${p1.y.toFixed(3)}`,
      `L ${p2.x.toFixed(3)} ${p2.y.toFixed(3)}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${p3.x.toFixed(3)} ${p3.y.toFixed(3)}`,
      "Z",
    ].join(" ");
  }

  function breakdownDonutSlices(breakdown, maxSlices = 6) {
    const total = (breakdown || []).reduce((s, row) => s + row.amountMinor, 0);
    if (!total) return [];
    let angle = 0;
    return breakdown.slice(0, maxSlices).map(row => {
      const sweep = (row.amountMinor / total) * 360;
      const startAngle = angle;
      angle += sweep;
      return { categoryId: row.categoryId, startAngle, endAngle: angle, amountMinor: row.amountMinor };
    });
  }

  /** Map treemap cell size (0–100 viewBox units) to a readable label length. */
  function treemapLabelMaxChars(cellW, cellH, lang) {
    const side = Math.min(Number(cellW) || 0, Number(cellH) || 0);
    if (side < 11) return 0;
    const density = lang === "de" ? 0.38 : lang === "zh" ? 0.52 : 0.45;
    return Math.max(4, Math.min(16, Math.floor(side * density)));
  }

  /** Compare average spend on days with high vs low habit completion (completionPercent 0–100). */
  function habitCompletionSpendInsight(dailyRows, options = {}) {
    const minSpend = options.minSpendMinor || 1;
    const rows = (dailyRows || []).filter(row => (row?.spendMinor || 0) >= minSpend && Number.isFinite(row.completionPercent));
    if (rows.length < 4) return null;
    const sorted = [...rows].sort((a, b) => b.completionPercent - a.completionPercent);
    const bucket = Math.max(1, Math.ceil(sorted.length / 3));
    const high = sorted.slice(0, bucket);
    const low = sorted.slice(-bucket);
    const highAvg = Math.round(high.reduce((s, r) => s + r.spendMinor, 0) / high.length);
    const lowAvg = Math.round(low.reduce((s, r) => s + r.spendMinor, 0) / low.length);
    if (highAvg === lowAvg) return null;
    return {
      highCompletionAvg: highAvg,
      lowCompletionAvg: lowAvg,
      highCompletionDays: high.length,
      lowCompletionDays: low.length,
    };
  }

  /** Compare average spend on highest- vs lowest-focus days (by focus minutes in the row). */
  function focusSpendInsight(dailyRows, options = {}) {
    const minSpend = options.minSpendMinor || 1;
    const rows = (dailyRows || []).filter(row => (row?.spendMinor || 0) >= minSpend && Number.isFinite(row.focusMinutes));
    if (rows.length < 4) return null;
    const sorted = [...rows].sort((a, b) => b.focusMinutes - a.focusMinutes);
    const bucket = Math.max(1, Math.ceil(sorted.length / 3));
    const high = sorted.slice(0, bucket);
    const low = sorted.slice(-bucket);
    const highAvg = Math.round(high.reduce((s, r) => s + r.spendMinor, 0) / high.length);
    const lowAvg = Math.round(low.reduce((s, r) => s + r.spendMinor, 0) / low.length);
    if (highAvg === lowAvg) return null;
    return { highFocusAvg: highAvg, lowFocusAvg: lowAvg, highFocusDays: high.length, lowFocusDays: low.length };
  }

  function parseGermanDate(value) {
    const m = String(value || "").trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!m) return "";
    const day = m[1].padStart(2, "0");
    const month = m[2].padStart(2, "0");
    const iso = `${m[3]}-${month}-${day}`;
    return ISO_DATE.test(iso) ? iso : "";
  }

  function splitGermanCsvLine(line) {
    const cols = [];
    let cur = "";
    let inQ = false;
    const text = String(line || "");
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') {
        inQ = !inQ;
      } else if (ch === ";" && !inQ) {
        cols.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    cols.push(cur);
    return cols.map(c => c.replace(/^"|"$/g, "").replace(/""/g, '"').trim());
  }

  function parseGermanAmount(value) {
    let s = String(value || "").trim().replace(/["']/g, "").replace(/\s/g, "");
    if (!s) return null;
    let sign = 1;
    if (s.endsWith("-")) {
      sign = -1;
      s = s.slice(0, -1);
    } else if (s.endsWith("+")) {
      s = s.slice(0, -1);
    }
    if (s.includes(",") && s.includes(".")) {
      if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
      else s = s.replace(/,/g, "");
    } else if (s.includes(",")) s = s.replace(",", ".");
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    return sign * Math.round(n * 100);
  }

  function germanBankCsvDataStart(lines) {
    if (!lines.length) return 0;
    const head = lines[0].toLowerCase();
    return head.includes("datum") || head.includes("buchungstag") || head.startsWith("buchung") ? 1 : 0;
  }

  function draftFromGermanBankCsvRow(cols, base) {
    if (cols.length < 3) return null;
    const account = base.accounts.find(a => !a.archived);
    if (!account) return null;
    const defaultExpense = base.categories.find(c => c.kind === "expense" && !c.archived);
    const date = parseGermanDate(cols[0].replace(/"/g, ""));
    let amountMinor = null;
    let note = "";
    if (cols.length >= 8) {
      amountMinor = parseGermanAmount(cols[7]);
      note = (cols[4] || cols[3] || "").replace(/"/g, "").trim();
    } else {
      amountMinor = parseGermanAmount(cols[cols.length - 1]);
      note = cols.slice(1, -1).join(" ").replace(/"/g, "").trim();
    }
    if (!date || amountMinor === null || amountMinor === 0) return null;
    const incomeCat = base.categories.find(c => c.kind === "income" && !c.archived);
    const categoryId = amountMinor >= 0
      ? (incomeCat?.id || defaultExpense?.id || base.categories[0]?.id)
      : (defaultExpense?.id || base.categories[0]?.id);
    return {
      accountId: account.id,
      categoryId,
      amountMinor,
      currency: account.currency,
      date,
      note: note || "Import",
    };
  }

  function previewGermanBankCsv(text, ledger, options = {}) {
    const base = normalize(ledger, options);
    const lines = String(text || "").split(/\r?\n/).filter(line => line.trim());
    if (!lines.length) return { importable: 0, skipped: 0, dataRows: 0 };
    const start = germanBankCsvDataStart(lines);
    let importable = 0;
    let skipped = 0;
    for (let i = start; i < lines.length; i++) {
      const cols = splitGermanCsvLine(lines[i]);
      if (draftFromGermanBankCsvRow(cols, base)) importable++;
      else skipped++;
    }
    return { importable, skipped, dataRows: lines.length - start };
  }

  function importGermanBankCsv(text, ledger, options = {}) {
    const base = normalize(ledger, options);
    const lines = String(text || "").split(/\r?\n/).filter(line => line.trim());
    if (!lines.length) return { ledger: base, imported: 0, skipped: 0 };
    let imported = 0;
    let skipped = 0;
    const start = germanBankCsvDataStart(lines);
    for (let i = start; i < lines.length; i++) {
      const cols = splitGermanCsvLine(lines[i]);
      const draft = draftFromGermanBankCsvRow(cols, base);
      if (!draft) { skipped++; continue; }
      const { ledger: next } = addTransaction(base, draft, options);
      Object.assign(base, next);
      imported++;
    }
    return { ledger: base, imported, skipped };
  }

  function exportTransactionsCsv(ledger, ym, options = {}) {
    const lang = options.lang || "en";
    const base = normalize(ledger, options);
    const rows = transactionsInMonth(base, ym);
    const header = "date;note;category;amount;currency\n";
    const body = rows.map(tx => {
      const cat = base.categories.find(c => c.id === tx.categoryId);
      const amount = (tx.amountMinor / 100).toFixed(2).replace(".", ",");
      const currency = tx.currency || base.settings.defaultCurrency || "EUR";
      const catLabel = cat ? localizedCategoryName(cat, lang) : "";
      return `${tx.date.split("-").reverse().join(".")};"${tx.note.replace(/"/g, "'")}";"${catLabel.replace(/"/g, "'")}";${amount};${currency}`;
    }).join("\n");
    return header + body;
  }

  function spendingTodayMinor(ledger, isoDate) {
    return spendingTodayDetail(ledger, isoDate).totalMinor;
  }

  function spendingTodayDetail(ledger, isoDate, options = {}) {
    const base = normalize(ledger, options);
    const lang = options.lang || "en";
    const txs = base.transactions.filter(
      tx => tx.date === isoDate && tx.amountMinor < 0 && txInReportingCurrency(base, tx),
    );
    const byCat = new Map();
    txs.forEach(tx => {
      byCat.set(tx.categoryId, (byCat.get(tx.categoryId) || 0) + Math.abs(tx.amountMinor));
    });
    let topCategoryId = null;
    let topAmount = 0;
    byCat.forEach((amountMinor, categoryId) => {
      if (amountMinor > topAmount) {
        topAmount = amountMinor;
        topCategoryId = categoryId;
      }
    });
    const topCat = topCategoryId ? base.categories.find(c => c.id === topCategoryId) : null;
    return {
      totalMinor: txs.reduce((sum, tx) => sum + Math.abs(tx.amountMinor), 0),
      expenseCount: txs.length,
      topCategory: topCat
        ? {
            categoryId: topCat.id,
            amountMinor: topAmount,
            color: topCat.color,
            name: localizedCategoryName(topCat, lang),
          }
        : null,
    };
  }

  /** Last N calendar days ending at endIso (inclusive), reporting-currency expenses only. */
  function dailyExpenseSeries(ledger, endIso, days = 7) {
    const base = normalize(ledger);
    const end = ISO_DATE.test(endIso || "") ? endIso : isoDateFromDate(new Date());
    const count = Math.max(1, Math.min(31, Number(days) || 7));
    const spendByDate = new Map();
    base.transactions.forEach(tx => {
      if (!txInReportingCurrency(base, tx) || tx.amountMinor >= 0) return;
      spendByDate.set(tx.date, (spendByDate.get(tx.date) || 0) + Math.abs(tx.amountMinor));
    });
    const anchor = new Date(`${end}T12:00:00`);
    const out = [];
    for (let i = count - 1; i >= 0; i -= 1) {
      const d = new Date(anchor);
      d.setDate(d.getDate() - i);
      const date = isoDateFromDate(d);
      out.push({ date, spendMinor: spendByDate.get(date) || 0 });
    }
    return out;
  }

  function renderMiniSpendSparklineSvg(series, options = {}) {
    const rows = Array.isArray(series) ? series : [];
    if (rows.length < 2) return "";
    const w = options.width || 120;
    const h = options.height || 28;
    const pad = 2;
    const max = Math.max(1, ...rows.map(r => r.spendMinor || 0));
    const step = (w - pad * 2) / (rows.length - 1);
    const points = rows.map((r, i) => {
      const x = pad + i * step;
      const y = pad + (h - pad * 2) * (1 - (r.spendMinor || 0) / max);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    const last = rows[rows.length - 1]?.spendMinor || 0;
    const accent = last > 0 ? "var(--accent, #3d8f6a)" : "var(--text-3, #9aa0a6)";
    return `<svg class="tw-spend-sparkline" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><polyline fill="none" stroke="${accent}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" points="${points}"/></svg>`;
  }

  function shiftYm(ym, delta) {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1, 12);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  function budgetProgress(ledger, ym) {
    const base = normalize(ledger);
    const spentByCat = new Map();
    transactionsInMonth(base, ym).forEach(tx => {
      if (tx.amountMinor >= 0 || !txInReportingCurrency(base, tx)) return;
      spentByCat.set(tx.categoryId, (spentByCat.get(tx.categoryId) || 0) + Math.abs(tx.amountMinor));
    });
    return base.budgets
      .filter(b => b.month === ym && b.limitMinor > 0)
      .map(b => {
        const spentMinor = spentByCat.get(b.categoryId) || 0;
        return {
          ...b,
          spentMinor,
          ratio: b.limitMinor > 0 ? spentMinor / b.limitMinor : 0,
        };
      })
      .sort((a, b) => b.ratio - a.ratio);
  }

  /** Categories over monthly limit, largest overspend first. */
  function budgetOverspendList(ledger, ym) {
    return budgetProgress(ledger, ym)
      .filter(b => b.spentMinor > b.limitMinor)
      .map(b => ({
        categoryId: b.categoryId,
        spentMinor: b.spentMinor,
        limitMinor: b.limitMinor,
        overMinor: b.spentMinor - b.limitMinor,
        ratio: b.ratio,
      }));
  }

  function datesWithCategorySpend(ledger, ym, categoryIds) {
    const base = normalize(ledger);
    const dates = new Set();
    if (!categoryIds?.size) return dates;
    transactionsInMonth(base, ym).forEach(tx => {
      if (tx.amountMinor >= 0 || !categoryIds.has(tx.categoryId) || !txInReportingCurrency(base, tx)) return;
      if (typeof tx.date === "string") dates.add(tx.date);
    });
    return dates;
  }

  /**
   * On days with spend in categories that ended over budget, compare low-mood rate vs other spending days.
   * dailyRows: { date, mood, spendMinor } from review panel builder.
   */
  function moodOverspendCategoryInsight(ledger, ym, dailyRows, options = {}) {
    const overs = budgetOverspendList(ledger, ym);
    if (!overs.length) return null;
    const hotDates = datesWithCategorySpend(ledger, ym, new Set(overs.map(o => o.categoryId)));
    if (hotDates.size < 2) return null;
    const lowMood = options.lowMood || "低落";
    const positiveMoods = options.positiveMoods || ["很好", "平静"];
    let lowOnHot = 0;
    let hotWithMood = 0;
    let lowOnOther = 0;
    let otherWithMood = 0;
    let positiveOnHot = 0;
    let positiveOnOther = 0;
    (dailyRows || []).forEach(row => {
      if (!row?.mood || !(row.spendMinor > 0)) return;
      const isPositive = positiveMoods.includes(row.mood);
      if (hotDates.has(row.date)) {
        hotWithMood += 1;
        if (row.mood === lowMood) lowOnHot += 1;
        if (isPositive) positiveOnHot += 1;
      } else {
        otherWithMood += 1;
        if (row.mood === lowMood) lowOnOther += 1;
        if (isPositive) positiveOnOther += 1;
      }
    });
    if (hotWithMood < 2 || otherWithMood < 2) return null;
    const hotRate = lowOnHot / hotWithMood;
    const otherRate = lowOnOther / otherWithMood;
    const positiveHotRate = positiveOnHot / hotWithMood;
    const positiveOtherRate = positiveOnOther / otherWithMood;
    const lowGap = Math.abs(hotRate - otherRate);
    const positiveGap = Math.abs(positiveHotRate - positiveOtherRate);
    if (lowGap < 0.08 && positiveGap < 0.08) return null;
    return {
      hotRate,
      otherRate,
      positiveHotRate,
      positiveOtherRate,
      hotDays: hotWithMood,
      otherDays: otherWithMood,
      overs,
    };
  }

  function resolveBudgetLimitMinor(rawLimit, amountText) {
    if (Number.isInteger(rawLimit) && rawLimit > 0) return rawLimit;
    const token = parseAmountToken(amountText);
    if (token != null && token > 0) return token;
    return null;
  }

  function upsertCategoryBudget(ledger, draft, options = {}) {
    const base = normalize(ledger, options);
    const month = typeof draft?.month === "string" && /^\d{4}-\d{2}$/.test(draft.month) ? draft.month : "";
    if (!month) return null;
    const categoryId = typeof draft?.categoryId === "string" ? draft.categoryId : "";
    const cat = base.categories.find(c => c.id === categoryId && !c.archived);
    if (!cat || cat.kind !== "expense") return null;
    const limitMinor = resolveBudgetLimitMinor(draft.limitMinor, draft.amountText);
    if (!limitMinor) return null;
    const currency = typeof draft.currency === "string" ? draft.currency : base.settings.defaultCurrency;
    const id = typeof draft.id === "string" && draft.id ? draft.id : createId();
    const idxById = base.budgets.findIndex(b => b.id === id);
    const idxByPair = base.budgets.findIndex(b => b.month === month && b.categoryId === categoryId);
    const next = {
      id,
      categoryId,
      month,
      limitMinor,
      currency,
    };
    if (idxById >= 0) base.budgets[idxById] = { ...base.budgets[idxById], ...next };
    else if (idxByPair >= 0) base.budgets[idxByPair] = { ...base.budgets[idxByPair], ...next };
    else base.budgets.push(next);
    return { ledger: base, budget: next };
  }

  function removeCategoryBudget(ledger, id) {
    const base = normalize(ledger);
    const index = base.budgets.findIndex(b => b && b.id === id);
    if (index < 0) return null;
    const removed = { ...base.budgets[index] };
    base.budgets = base.budgets.filter((_, i) => i !== index);
    return { ledger: base, removed, index };
  }

  function restoreCategoryBudget(ledger, removed, index) {
    const base = normalize(ledger);
    if (!removed || typeof removed.categoryId !== "string") return base;
    const next = [...base.budgets];
    const at = Number.isInteger(index) && index >= 0 && index <= next.length ? index : next.length;
    next.splice(at, 0, { ...removed });
    base.budgets = next;
    return base;
  }

  function monthlyTrendSeries(ledger, endYm, months = 6) {
    const base = normalize(ledger);
    const out = [];
    let ym = endYm;
    for (let i = 0; i < months; i += 1) {
      const summary = monthSummary(base, ym);
      out.unshift({
        ym,
        expenseMinor: Math.abs(summary.expenseMinor),
        incomeMinor: summary.incomeMinor,
        netMinor: summary.netMinor,
      });
      ym = shiftYm(ym, -1);
    }
    return out;
  }

  function filterTransactions(ledger, ym, query) {
    const q = String(query || "").trim().toLowerCase();
    const rows = transactionsInMonth(normalize(ledger), ym);
    if (!q) return rows;
    return rows.filter(tx => {
      const cat = ledger.categories.find(c => c.id === tx.categoryId);
      const hay = [
        tx.note,
        cat?.name,
        cat?.nameZh,
        cat?.nameDe,
        String(Math.abs(tx.amountMinor) / 100),
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  function mulberry32(seed) {
    let value = seed >>> 0;
    return () => {
      value += 0x6d2b79f5;
      let t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function categoryByEnglishName(ledger, enName, kind = "expense") {
    const def = kind === "income"
      ? DEFAULT_INCOME_CATEGORIES.find(c => c.name === enName)
      : DEFAULT_EXPENSE_CATEGORIES.find(c => c.name === enName);
    if (!def) return ledger.categories.find(c => c.kind === kind && !c.archived);
    return ledger.categories.find(c => c.kind === kind && !c.archived && (c.name === def.name || c.nameZh === def.zh || c.nameDe === def.de))
      || ledger.categories.find(c => c.kind === kind && !c.archived);
  }

  function ensureDemoBudgets(ledger, ym) {
    const base = normalize(ledger);
    if (base.budgets.some(b => b.month === ym)) return base;
    const dining = categoryByEnglishName(base, "Dining");
    const groceries = categoryByEnglishName(base, "Groceries");
    const transport = categoryByEnglishName(base, "Transport");
    const cur = base.settings.defaultCurrency;
    [
      { categoryId: groceries?.id, limitMinor: 35000 },
      { categoryId: dining?.id, limitMinor: 18000 },
      { categoryId: transport?.id, limitMinor: 12000 },
    ].filter(row => row.categoryId).forEach(row => {
      base.budgets.push({
        id: createId(),
        categoryId: row.categoryId,
        month: ym,
        limitMinor: row.limitMinor,
        currency: cur,
      });
    });
    return base;
  }

  /** Demo-only: ensure current month has 1–2 over-budget categories for Review insights. */
  function alignDemoBudgetOverspendForReview(ledger, ym) {
    const base = normalize(ledger);
    const progress = budgetProgress(base, ym);
    if (!progress.length) return base;
    const top = [...progress].sort((a, b) => b.spentMinor - a.spentMinor).slice(0, 2);
    top.forEach(row => {
      if (row.spentMinor < 800 || row.spentMinor > row.limitMinor) return;
      const targetLimit = Math.max(500, Math.round(row.spentMinor * 0.78));
      const idx = base.budgets.findIndex(b => b.id === row.id);
      if (idx >= 0) base.budgets[idx] = { ...base.budgets[idx], limitMinor: targetLimit };
    });
    return base;
  }

  function buildDemoSample(options = {}) {
    const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
    const lang = options.lang || "en";
    const rng = mulberry32((options.contentSeed ?? 0x6d656d6f) ^ 0x1ed6e9);
    let ledger = normalize(null, { lang });
    const account = ledger.accounts[0]?.id;
    if (!account) return ledger;
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const salaryCat = categoryByEnglishName(ledger, "Salary", "income");
    const groceries = categoryByEnglishName(ledger, "Groceries");
    const dining = categoryByEnglishName(ledger, "Dining");
    const transport = categoryByEnglishName(ledger, "Transport");
    const housing = categoryByEnglishName(ledger, "Housing");
    const shopping = categoryByEnglishName(ledger, "Shopping");
    const expenseCats = [groceries, dining, transport, shopping].filter(Boolean);
    for (let offset = 89; offset >= 0; offset -= 1) {
      const d = new Date(now);
      d.setDate(d.getDate() - offset);
      d.setHours(12, 0, 0, 0);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (iso > today) continue;
      const day = d.getDate();
      if (day === 1 && salaryCat) {
        ({ ledger } = addTransaction(ledger, {
          accountId: account,
          categoryId: salaryCat.id,
          amountMinor: 285000 + Math.round(rng() * 40000),
          currency: "EUR",
          date: iso,
          note: lang === "de" ? "Gehalt" : lang === "zh" ? "工资" : "Salary",
        }, { lang }));
      }
      if (day === 3 && housing) {
        ({ ledger } = addTransaction(ledger, {
          accountId: account,
          categoryId: housing.id,
          amountMinor: -95000,
          currency: "EUR",
          date: iso,
          note: lang === "de" ? "Miete" : lang === "zh" ? "房租" : "Rent",
        }, { lang }));
      }
      const weekday = d.getDay();
      if (weekday !== 0 && weekday !== 6 && rng() < 0.55 && expenseCats.length) {
        const cat = expenseCats[Math.floor(rng() * expenseCats.length)];
        const cents = -(400 + Math.round(rng() * 4200));
        ({ ledger } = addTransaction(ledger, {
          accountId: account,
          categoryId: cat.id,
          amountMinor: cents,
          currency: "EUR",
          date: iso,
          note: cat.name,
        }, { lang }));
      }
    }
    ledger = ensureDemoBudgets(ledger, monthKey(today));
    ledger = ensureDemoBudgets(ledger, shiftYm(monthKey(today), -1));
    ledger = ensureDemoMonthActivity(ledger, now, lang, rng);
    ledger = alignDemoBudgetOverspendForReview(ledger, monthKey(today));
    return ledger;
  }

  function expenseCountInMonth(ledger, ym) {
    return transactionsInMonth(ledger, ym).filter(tx => tx.amountMinor < 0).length;
  }

  function hasExpenseOn(ledger, iso) {
    return ledger.transactions.some(tx => tx.date === iso && tx.amountMinor < 0);
  }

  /** Demo-only: early-month views still show donut, heatmap, and Today card spend. */
  function ensureDemoMonthActivity(ledger, now, lang, rng) {
    const today = isoDateFromDate(now);
    const ym = monthKey(today);
    const account = ledger.accounts[0]?.id;
    if (!account) return ledger;
    const groceries = categoryByEnglishName(ledger, "Groceries");
    const dining = categoryByEnglishName(ledger, "Dining");
    const transport = categoryByEnglishName(ledger, "Transport");
    const housing = categoryByEnglishName(ledger, "Housing");
    const dayNum = now.getDate();
    const picks = [
      { day: 1, cat: groceries, amountMinor: -(3800 + Math.round(rng() * 1200)), note: lang === "de" ? "REWE" : lang === "zh" ? "超市" : "Groceries" },
      { day: Math.max(1, dayNum - 1), cat: dining, amountMinor: -(850 + Math.round(rng() * 900)), note: lang === "de" ? "Kaffee" : lang === "zh" ? "咖啡" : "Coffee" },
      { day: dayNum, cat: transport, amountMinor: -(280 + Math.round(rng() * 420)), note: lang === "de" ? "BVG" : lang === "zh" ? "地铁" : "Transit" },
    ];
    picks.forEach(row => {
      if (!row.cat || row.day > dayNum) return;
      const iso = `${ym}-${String(row.day).padStart(2, "0")}`;
      if (hasExpenseOn(ledger, iso)) return;
      ({ ledger } = addTransaction(ledger, {
        accountId: account,
        categoryId: row.cat.id,
        amountMinor: row.amountMinor,
        currency: "EUR",
        date: iso,
        note: row.note,
      }, { lang }));
    });
    const rentDay = Math.min(3, dayNum);
    const rentIso = `${ym}-${String(rentDay).padStart(2, "0")}`;
    if (housing && dayNum >= 1 && !ledger.transactions.some(tx => tx.date.startsWith(ym) && tx.categoryId === housing.id)) {
      ({ ledger } = addTransaction(ledger, {
        accountId: account,
        categoryId: housing.id,
        amountMinor: -95000,
        currency: "EUR",
        date: rentIso,
        note: lang === "de" ? "Miete" : lang === "zh" ? "房租" : "Rent",
      }, { lang }));
    }
    if (!hasExpenseOn(ledger, today) && dining) {
      ({ ledger } = addTransaction(ledger, {
        accountId: account,
        categoryId: dining.id,
        amountMinor: -(650 + Math.round(rng() * 400)),
        currency: "EUR",
        date: today,
        note: lang === "de" ? "Mittag" : lang === "zh" ? "午餐" : "Lunch",
      }, { lang }));
    }
    if (!ledger.recurring.length && housing && dining) {
      ledger.recurring = [
        {
          id: createId(),
          label: lang === "de" ? "Miete monatlich" : lang === "zh" ? "每月房租" : "Rent monthly",
          accountId: account,
          categoryId: housing.id,
          amountMinor: -95000,
          currency: "EUR",
          dayOfMonth: 3,
          cadence: "monthly",
          note: lang === "de" ? "Miete" : lang === "zh" ? "房租" : "Rent",
        },
        {
          id: createId(),
          label: lang === "de" ? "Abonnement" : lang === "zh" ? "订阅" : "Subscriptions",
          accountId: account,
          categoryId: dining.id,
          amountMinor: -1299,
          currency: "EUR",
          dayOfMonth: 15,
          cadence: "monthly",
          note: "Streaming",
        },
      ];
    }
    if (expenseCountInMonth(ledger, ym) < 2 && groceries) {
      ({ ledger } = addTransaction(ledger, {
        accountId: account,
        categoryId: groceries.id,
        amountMinor: -2400,
        currency: "EUR",
        date: today,
        note: lang === "de" ? "Einkauf" : lang === "zh" ? "采购" : "Shop",
      }, { lang }));
    }
    return ledger;
  }

  /** Demo-only: high habit completion on lower-spend days (and the reverse) for review habit × spend insight. */
  function alignDemoHabitCompletionWithSpend(logs, ledger, habitIds, now = new Date()) {
    if (!logs || !ledger?.transactions?.length || !habitIds?.length) return logs;
    const anchor = now instanceof Date ? now : new Date(now);
    const today = isoDateFromDate(anchor);
    const ym = monthKey(today);
    const spendByDate = new Map();
    ledger.transactions.forEach(tx => {
      if (!tx.date.startsWith(ym) || tx.date > today || tx.amountMinor >= 0) return;
      spendByDate.set(tx.date, (spendByDate.get(tx.date) || 0) + Math.abs(tx.amountMinor));
    });
    const dates = [...spendByDate.keys()].sort();
    if (dates.length < 4) return logs;
    const sorted = [...dates].sort((a, b) => spendByDate.get(a) - spendByDate.get(b));
    const lowSpend = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 3)));
    const highSpend = sorted.slice(-Math.max(1, Math.ceil(sorted.length / 3)));
    const allIds = habitIds.filter(Boolean);
    lowSpend.forEach(date => {
      const base = logs[date] || { completed: [], mood: "平静", note: "", moodReason: "" };
      logs[date] = { ...base, completed: [...allIds] };
    });
    highSpend.forEach(date => {
      const base = logs[date];
      if (!base) return;
      logs[date] = { ...base, completed: allIds.length ? [allIds[0]] : [] };
    });
    return logs;
  }

  /**
   * Demo-only: on days that spent in over-budget categories, bias mood toward 很好/平静 so Review
   * budget insight can show the positive-mood follow-up sentence (after alignDemoBudgetOverspendForReview).
   */
  function alignDemoMoodWithBudgetOverspend(logs, ledger, now = new Date()) {
    if (!logs || !ledger?.transactions?.length) return logs;
    const anchor = now instanceof Date ? now : new Date(now);
    const today = isoDateFromDate(anchor);
    const ym = monthKey(today);
    const base = normalize(ledger);
    const overs = budgetOverspendList(base, ym);
    if (!overs.length) return logs;
    const hotDates = datesWithCategorySpend(base, ym, new Set(overs.map(o => o.categoryId)));
    if (hotDates.size < 2) return logs;
    const spendByDate = new Map();
    base.transactions.forEach(tx => {
      if (!tx.date.startsWith(ym) || tx.date > today || tx.amountMinor >= 0) return;
      if (!txInReportingCurrency(base, tx)) return;
      spendByDate.set(tx.date, (spendByDate.get(tx.date) || 0) + Math.abs(tx.amountMinor));
    });
    const otherSpendDates = [...spendByDate.keys()].filter(date => !hotDates.has(date));
    if (otherSpendDates.length < 2) return logs;
    let flip = 0;
    hotDates.forEach(date => {
      if (!logs[date] || !spendByDate.has(date)) return;
      logs[date] = { ...logs[date], mood: flip % 2 === 0 ? "很好" : "平静" };
      flip += 1;
    });
    otherSpendDates.forEach((date, index) => {
      if (!logs[date]) return;
      const mood = index % 3 === 0 ? "平静" : "低落";
      logs[date] = { ...logs[date], mood };
    });
    return logs;
  }

  /** Demo-only: tag lowest-spend days as 很好 and highest as 低落 so review mood vs spend insights render. */
  function alignDemoMoodWithSpend(logs, ledger, now = new Date()) {
    if (!logs || !ledger?.transactions?.length) return logs;
    const anchor = now instanceof Date ? now : new Date(now);
    const today = isoDateFromDate(anchor);
    const startDate = new Date(anchor);
    startDate.setHours(12, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 44);
    const start = isoDateFromDate(startDate);
    const spendByDate = new Map();
    ledger.transactions.forEach(tx => {
      if (tx.date < start || tx.date > today || tx.amountMinor >= 0) return;
      spendByDate.set(tx.date, (spendByDate.get(tx.date) || 0) + Math.abs(tx.amountMinor));
    });
    const ranked = [...spendByDate.entries()].sort((a, b) => a[1] - b[1]);
    if (ranked.length < 2) return logs;
    const greatMood = "很好";
    const lowMood = "低落";
    const lowDates = new Set(ranked.slice(-Math.max(1, Math.ceil(ranked.length / 3))).map(row => row[0]));
    const greatDates = new Set(ranked.slice(0, Math.max(1, Math.ceil(ranked.length / 3))).map(row => row[0]));
    ranked.forEach(([date]) => {
      if (!logs[date]) {
        logs[date] = { completed: [], mood: "", moodReason: "", note: "" };
      }
      let mood = logs[date].mood;
      if (greatDates.has(date)) mood = greatMood;
      else if (lowDates.has(date)) mood = lowMood;
      if (mood !== logs[date].mood) logs[date] = { ...logs[date], mood };
    });
    return logs;
  }

  function mergeById(left, right) {
    const map = new Map((left || []).filter(Boolean).map(item => [item.id, item]));
    (right || []).filter(Boolean).forEach(item => map.set(item.id, { ...item }));
    return [...map.values()];
  }

  function mergeBudgetsByMonthCategory(left, right) {
    const map = new Map();
    (left || []).filter(Boolean).forEach(b => map.set(`${b.month}:${b.categoryId}`, { ...b }));
    (right || []).filter(Boolean).forEach(b => map.set(`${b.month}:${b.categoryId}`, { ...b }));
    return [...map.values()];
  }

  function mergeLedgerForBackup(current, incoming, options = {}) {
    if (!incoming && !current) return undefined;
    const base = normalize(current || null, options);
    if (!incoming) return base;
    const add = normalize(incoming, options);
    return {
      ...base,
      settings: { ...base.settings, ...(add.settings || {}) },
      accounts: mergeById(base.accounts, add.accounts),
      categories: mergeById(base.categories, add.categories),
      transactions: mergeById(base.transactions, add.transactions).sort((a, b) => {
        const byDate = String(a.date).localeCompare(String(b.date));
        return byDate || String(a.id).localeCompare(String(b.id));
      }),
      budgets: mergeBudgetsByMonthCategory(base.budgets, add.budgets),
      recurring: mergeById(base.recurring, add.recurring),
    };
  }

  function scopeLedgerForBackup(ledger, withinRange, options = {}) {
    if (!ledger) return undefined;
    const base = normalize(ledger, options);
    const copy = {
      ...base,
      accounts: base.accounts.map(a => ({ ...a })),
      categories: base.categories.map(c => ({ ...c })),
      transactions: base.transactions.map(t => ({ ...t })),
      budgets: base.budgets.map(b => ({ ...b })),
      recurring: base.recurring.map(r => ({ ...r })),
    };
    if (typeof withinRange === "function") {
      copy.transactions = copy.transactions.filter(tx => withinRange(tx.date));
    }
    return copy;
  }

  /** Demo-only: more focus minutes on lower-spend days (and the reverse) for review focus × spend scatter. */
  function alignDemoFocusWithSpend(focusSessions, ledger, now = new Date()) {
    if (!ledger?.transactions?.length) return focusSessions || [];
    const anchor = now instanceof Date ? now : new Date(now);
    const today = isoDateFromDate(anchor);
    const ym = monthKey(today);
    const spendByDate = new Map();
    ledger.transactions.forEach(tx => {
      if (!tx.date.startsWith(ym) || tx.date > today || tx.amountMinor >= 0) return;
      spendByDate.set(tx.date, (spendByDate.get(tx.date) || 0) + Math.abs(tx.amountMinor));
    });
    const dates = [...spendByDate.keys()].sort();
    if (dates.length < 4) return focusSessions || [];
    const sorted = [...dates].sort((a, b) => spendByDate.get(a) - spendByDate.get(b));
    const lowSpend = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 3)));
    const highSpend = sorted.slice(-Math.max(1, Math.ceil(sorted.length / 3)));
    const sessions = (focusSessions || []).filter(s => !String(s?.id || "").startsWith("demo-focus-align-"));
    const pushSession = (date, minutes) => {
      const startedAt = Date.parse(`${date}T10:00:00`);
      if (!Number.isFinite(startedAt)) return;
      const durationMs = minutes * 60000;
      sessions.push({
        id: `demo-focus-align-${date}`,
        date,
        label: "Demo",
        outcome: "completed",
        startedAt,
        endedAt: startedAt + durationMs,
        durationMs,
      });
    };
    lowSpend.forEach(date => pushSession(date, 85 + (date.charCodeAt(8) % 20)));
    highSpend.forEach(date => pushSession(date, 12 + (date.charCodeAt(9) % 8)));
    return sessions;
  }

  root.LifeLedgerLedger = {
    LEDGER_VERSION,
    emptyLedger,
    normalize,
    parseQuickEntry,
    parseAmountToken,
    addTransaction,
    removeTransaction,
    restoreTransaction,
    duplicateTransaction,
    updateTransaction,
    applyRecurringTemplate,
    recurringPendingForMonth,
    recurringUnpostedOccurrenceCount,
    recurringPendingOccurrenceCount,
    applyAllRecurringPending,
    upsertRecurringTemplate,
    removeRecurringTemplate,
    restoreRecurringTemplate,
    normalizeRecurringEntry,
    moodSpendComparison,
    spendInsightDeltaPercent,
    moodSpendScatter,
    moodScatterTipLines,
    habitScatterTipLines,
    focusScatterTipLines,
    renderMoodSpendScatterSvg,
    habitCompletionSpendScatter,
    renderHabitCompletionSpendScatterSvg,
    focusSpendScatter,
    renderFocusSpendScatterSvg,
    ledgerStatsSnapshot,
    ledgerConflictCompare,
    focusSpendInsight,
    habitCompletionSpendInsight,
    truncateTreemapLabel,
    treemapLabelMaxChars,
    annularSectorPath,
    breakdownDonutSlices,
    parseCssRgb,
    relativeLuminance,
    isLightAccentColor,
    alignDemoHabitCompletionWithSpend,
    nearestWeekdayIso,
    monthSummary,
    rangeSummary,
    alignedWeekSpendCompare,
    alignedMonthSpendCompare,
    alignedDaySpendCompare,
    temporalSpendChangePercent,
    displaySpendDeltaPercent,
    preferSpendCompareAmountCaption,
    SPEND_COMPARE_AMOUNT_BASELINE_MINOR,
    SPEND_COMPARE_EXTREME_PERCENT,
    monthKey,
    transactionsInMonth,
    dailySpendHeatmap,
    categoryBreakdown,
    formatMoney,
    localizedCategoryName,
    importGermanBankCsv,
    previewGermanBankCsv,
    exportTransactionsCsv,
    spendingTodayMinor,
    spendingTodayDetail,
    dailyExpenseSeries,
    renderMiniSpendSparklineSvg,
    repairDefaultCategoryNames,
    budgetProgress,
    budgetOverspendList,
    moodOverspendCategoryInsight,
    upsertCategoryBudget,
    removeCategoryBudget,
    restoreCategoryBudget,
    monthlyTrendSeries,
    filterTransactions,
    shiftYm,
    buildDemoSample,
    alignDemoMoodWithSpend,
    alignDemoMoodWithBudgetOverspend,
    alignDemoFocusWithSpend,
    mergeLedgerForBackup,
    scopeLedgerForBackup,
    createId,
  };
})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : global);
