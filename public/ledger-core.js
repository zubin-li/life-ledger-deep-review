/* Bookkeeping core: integer minor units, ISO dates, no runtime network. MIT — Life Ledger project. */
(function (root) {
  const LEDGER_VERSION = 1;
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

  const DEFAULT_EXPENSE_CATEGORIES = [
    { name: "Groceries", icon: "shopping", color: "sage", zh: "日用", de: "Lebensmittel" },
    { name: "Dining", icon: "coffee", color: "amber", zh: "餐饮", de: "Essen" },
    { name: "Transport", icon: "car", color: "blue", zh: "交通", de: "Mobilität" },
    { name: "Housing", icon: "home", color: "coral", zh: "住房", de: "Wohnen" },
    { name: "Health", icon: "heart", color: "violet", zh: "健康", de: "Gesundheit" },
    { name: "Shopping", icon: "shopping", color: "cyan", zh: "购物", de: "Einkauf" },
    { name: "Entertainment", icon: "music", color: "amber", zh: "娱乐", de: "Freizeit" },
    { name: "Other", icon: "more", color: "sage", zh: "其他", de: "Sonstiges" },
  ];
  const DEFAULT_INCOME_CATEGORIES = [
    { name: "Salary", icon: "wallet", color: "sage", zh: "工资", de: "Gehalt" },
    { name: "Side income", icon: "sparkles", color: "amber", zh: "副业", de: "Nebeneinkommen" },
    { name: "Other income", icon: "plus", color: "blue", zh: "其他收入", de: "Sonstige Einnahmen" },
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
    if (code === "zh") {
      out.forEach(c => {
        if (c.nameZh && c.kind === "expense") c.name = c.nameZh;
        if (c.nameZh && c.kind === "income") c.name = c.nameZh;
      });
    }
    if (code === "de") {
      out.forEach(c => {
        if (c.nameDe) c.name = c.nameDe;
      });
    }
    return out;
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
    if (Array.isArray(raw.recurring)) ledger.recurring = raw.recurring.filter(Boolean);
    if (raw.meta && typeof raw.meta === "object") {
      ledger.meta.recentCategoryIds = Array.isArray(raw.meta.recentCategoryIds)
        ? raw.meta.recentCategoryIds.filter(id => typeof id === "string").slice(0, 12)
        : [];
      ledger.meta.lastEntryAt = Number(raw.meta.lastEntryAt) || 0;
    }
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
    const iso = options.today || new Date().toISOString().slice(0, 10);
    const d = new Date(`${iso}T12:00:00`);
    d.setDate(d.getDate() + dateOffset);
    const date = d.toISOString().slice(0, 10);

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
    if (amountMinor > 0 && !explicitIncome) {
      amountMinor = -Math.abs(amountMinor);
      if (category?.kind === "income") {
        category = activeCategories.find(c => c.kind === "expense" && /other|sonst|其他|餐饮|coffee/i.test(localizedCategoryName(c, lang)))
          || activeCategories.find(c => c.kind === "expense");
      }
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

  function monthSummary(ledger, ym) {
    const rows = transactionsInMonth(ledger, ym);
    let income = 0;
    let expense = 0;
    rows.forEach(tx => {
      if (tx.amountMinor >= 0) income += tx.amountMinor;
      else expense += tx.amountMinor;
    });
    return { incomeMinor: income, expenseMinor: expense, netMinor: income + expense, count: rows.length };
  }

  function dailySpendHeatmap(ledger, ym) {
    const map = new Map();
    transactionsInMonth(ledger, ym).forEach(tx => {
      if (tx.amountMinor >= 0) return;
      map.set(tx.date, (map.get(tx.date) || 0) + Math.abs(tx.amountMinor));
    });
    return map;
  }

  function categoryBreakdown(ledger, ym, kind = "expense") {
    const totals = new Map();
    transactionsInMonth(ledger, ym).forEach(tx => {
      const cat = ledger.categories.find(c => c.id === tx.categoryId);
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
    return new Intl.NumberFormat(loc, { style: "currency", currency: currency || "EUR" }).format(minor / 100);
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

  function applyRecurringTemplate(ledger, recurringId, options = {}) {
    const base = normalize(ledger, options);
    const rec = base.recurring.find(r => r && r.id === recurringId);
    if (!rec || !Number.isInteger(rec.amountMinor)) return null;
    const today = options.today && ISO_DATE.test(options.today) ? options.today : "";
    const ym = today ? today.slice(0, 7) : monthKey(new Date().toISOString().slice(0, 10));
    const day = Math.min(28, Math.max(1, Number(rec.dayOfMonth) || 1));
    const scheduled = `${ym}-${String(day).padStart(2, "0")}`;
    const date = today || scheduled;
    const accountId = rec.accountId || base.accounts.find(a => !a.archived)?.id;
    if (!accountId || !rec.categoryId) return null;
    return addTransaction(base, {
      accountId,
      categoryId: rec.categoryId,
      amountMinor: rec.amountMinor,
      currency: rec.currency || base.settings.defaultCurrency,
      date,
      note: rec.note || rec.label || "",
    }, options);
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

  function parseGermanDate(value) {
    const m = String(value || "").trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!m) return "";
    const day = m[1].padStart(2, "0");
    const month = m[2].padStart(2, "0");
    const iso = `${m[3]}-${month}-${day}`;
    return ISO_DATE.test(iso) ? iso : "";
  }

  function parseGermanAmount(value) {
    let s = String(value || "").trim().replace(/\s/g, "");
    if (!s) return null;
    s = s.replace(/\./g, "").replace(",", ".");
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    return Math.round(n * 100);
  }

  function importGermanBankCsv(text, ledger, options = {}) {
    const base = normalize(ledger, options);
    const lines = String(text || "").split(/\r?\n/).filter(line => line.trim());
    if (!lines.length) return { ledger: base, imported: 0, skipped: 0 };
    const account = base.accounts.find(a => !a.archived);
    const defaultExpense = base.categories.find(c => c.kind === "expense" && !c.archived);
    let imported = 0;
    let skipped = 0;
    const start = lines[0].toLowerCase().includes("datum") ? 1 : 0;
    for (let i = start; i < lines.length; i++) {
      const cols = lines[i].split(";");
      if (cols.length < 3) { skipped++; continue; }
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
      if (!date || amountMinor === null || !account) { skipped++; continue; }
      if (amountMinor === 0) { skipped++; continue; }
      const signed = amountMinor;
      const incomeCat = base.categories.find(c => c.kind === "income" && !c.archived);
      const categoryId = signed >= 0
        ? (incomeCat?.id || defaultExpense?.id || base.categories[0]?.id)
        : (defaultExpense?.id || base.categories[0]?.id);
      const { ledger: next } = addTransaction(base, {
        accountId: account.id,
        categoryId,
        amountMinor: signed,
        currency: account.currency,
        date,
        note: note || "Import",
      }, options);
      Object.assign(base, next);
      imported++;
    }
    return { ledger: base, imported, skipped };
  }

  function exportTransactionsCsv(ledger, ym) {
    const rows = transactionsInMonth(normalize(ledger), ym);
    const header = "date;note;category;amount_eur\n";
    const body = rows.map(tx => {
      const cat = ledger.categories.find(c => c.id === tx.categoryId);
      const amount = (tx.amountMinor / 100).toFixed(2).replace(".", ",");
      return `${tx.date.split("-").reverse().join(".")};"${tx.note.replace(/"/g, "'")}";"${cat?.name || ""}";${amount}`;
    }).join("\n");
    return header + body;
  }

  function spendingTodayMinor(ledger, isoDate) {
    return normalize(ledger).transactions
      .filter(tx => tx.date === isoDate && tx.amountMinor < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amountMinor), 0);
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
      if (tx.amountMinor >= 0) return;
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
    return ledger;
  }

  function isoFromDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function expenseCountInMonth(ledger, ym) {
    return transactionsInMonth(ledger, ym).filter(tx => tx.amountMinor < 0).length;
  }

  function hasExpenseOn(ledger, iso) {
    return ledger.transactions.some(tx => tx.date === iso && tx.amountMinor < 0);
  }

  /** Demo-only: early-month views still show donut, heatmap, and Today card spend. */
  function ensureDemoMonthActivity(ledger, now, lang, rng) {
    const today = isoFromDate(now);
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
    moodSpendComparison,
    monthSummary,
    monthKey,
    transactionsInMonth,
    dailySpendHeatmap,
    categoryBreakdown,
    formatMoney,
    localizedCategoryName,
    importGermanBankCsv,
    exportTransactionsCsv,
    spendingTodayMinor,
    budgetProgress,
    monthlyTrendSeries,
    filterTransactions,
    shiftYm,
    buildDemoSample,
    createId,
  };
})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : global);
