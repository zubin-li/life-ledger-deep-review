/* Bank statement import — parse, plan, commit, undo. No DOM. MIT — Life Ledger project. */
(function (root) {
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
  const CP1252 = {
    0x80: "\u20AC", 0x82: "\u201A", 0x83: "\u0192", 0x84: "\u201E", 0x85: "\u2026", 0x86: "\u2020", 0x87: "\u2021",
    0x88: "\u02C6", 0x89: "\u2030", 0x8A: "\u0160", 0x8B: "\u2039", 0x8C: "\u0152", 0x8E: "\u017D", 0x91: "\u2018",
    0x92: "\u2019", 0x93: "\u201C", 0x94: "\u201D", 0x95: "\u2022", 0x96: "\u2013", 0x97: "\u2014", 0x98: "\u02DC",
    0x99: "\u2122", 0x9A: "\u0161", 0x9B: "\u203A", 0x9C: "\u0153", 0x9E: "\u017E", 0x9F: "\u0178",
  };

  function core() {
    return root.LifeLedgerLedger;
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function createId() {
    if (root.crypto?.randomUUID) return root.crypto.randomUUID();
    return `import-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  function decodeBytes(uint8) {
    const u8 = uint8 instanceof Uint8Array ? uint8 : new Uint8Array(uint8 || []);
    let utf8 = "";
    try {
      utf8 = new TextDecoder("utf-8", { fatal: true }).decode(u8);
    } catch {
      return decodeCp1252(u8);
    }
    if (!/[\uFFFD\uEFBFBD]/.test(utf8) && looksUtf8(u8)) return utf8;
    const alt = decodeCp1252(u8);
    if (scoreGerman(alt) > scoreGerman(utf8)) return alt;
    return utf8;
  }

  function decodeCp1252(u8) {
    let out = "";
    for (let i = 0; i < u8.length; i++) {
      const b = u8[i];
      out += b >= 0x80 && CP1252[b] ? CP1252[b] : String.fromCharCode(b);
    }
    return out;
  }

  function looksUtf8(u8) {
    let i = 0;
    while (i < u8.length) {
      const c = u8[i];
      if (c <= 0x7f) i++;
      else if (c >= 0xc2 && c <= 0xdf) {
        if (i + 1 >= u8.length || u8[i + 1] < 0x80 || u8[i + 1] > 0xbf) return false;
        i += 2;
      } else if (c >= 0xe0 && c <= 0xef) {
        if (i + 2 >= u8.length) return false;
        const c1 = u8[i + 1]; const c2 = u8[i + 2];
        if (c1 < 0x80 || c1 > 0xbf || c2 < 0x80 || c2 > 0xbf) return false;
        i += 3;
      } else if (c >= 0xf0 && c <= 0xf4) {
        if (i + 3 >= u8.length) return false;
        i += 4;
      } else return false;
    }
    return true;
  }

  function scoreGerman(text) {
    const re = /[äöüÄÖÜß€–]/g;
    const m = String(text || "").match(re);
    return m ? m.length : 0;
  }

  function parseGermanDate(value) {
    const s = String(value || "").trim().replace(/^"|"$/g, "");
    let m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
    if (m) {
      const day = m[1].padStart(2, "0");
      const month = m[2].padStart(2, "0");
      const iso = `${m[3]}-${month}-${day}`;
      return ISO_DATE.test(iso) ? iso : "";
    }
    m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2})$/);
    if (m) {
      const yr = Number(m[3]);
      const full = yr >= 70 ? 1900 + yr : 2000 + yr;
      const day = m[1].padStart(2, "0");
      const month = m[2].padStart(2, "0");
      const iso = `${full}-${month}-${day}`;
      return ISO_DATE.test(iso) ? iso : "";
    }
    if (ISO_DATE.test(s)) return s;
    return "";
  }

  function parseGermanAmount(value) {
    let s = String(value || "").trim().replace(/^"|"$/g, "").replace(/["']/g, "").replace(/\s/g, "").replace(/€|EUR$/gi, "");
    if (!s) return null;
    let sign = 1;
    if (s.endsWith("-")) {
      sign = -1;
      s = s.slice(0, -1);
    } else if (s.startsWith("-")) {
      sign = -1;
      s = s.slice(1);
    } else if (s.startsWith("+")) {
      s = s.slice(1);
    }
    if (s.includes(",") && s.includes(".")) {
      if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
      else s = s.replace(/,/g, "");
    } else if (s.includes(",")) s = s.replace(",", ".");
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    return sign * Math.round(n * 100);
  }

  function parseDecimalAmount(value) {
    let s = String(value || "").trim().replace(/^"|"$/g, "").replace(/\s/g, "");
    if (!s) return null;
    let sign = 1;
    if (s.startsWith("-")) { sign = -1; s = s.slice(1); }
    else if (s.startsWith("+")) s = s.slice(1);
    if (s.includes(",") && !s.includes(".")) return parseGermanAmount((sign < 0 ? "-" : "") + s);
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    return sign * Math.round(n * 100);
  }

  function splitCsvRecords(text, delimiter) {
    const rows = [];
    let row = [];
    let cell = "";
    let inQ = false;
    const delim = delimiter || ";";
    const src = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      const next = src[i + 1];
      if (ch === '"') {
        if (inQ && next === '"') { cell += '"'; i++; }
        else inQ = !inQ;
      } else if (!inQ && ch === delim) {
        row.push(cell);
        cell = "";
      } else if (!inQ && ch === "\n") {
        row.push(cell);
        if (row.length > 1 || row[0] !== "" || rows.length) rows.push(row);
        row = [];
        cell = "";
      } else cell += ch;
    }
    row.push(cell);
    if (row.length > 1 || row[0] !== "" || rows.length) rows.push(row);
    return rows.map(r => r.map(c => c.replace(/^"|"$/g, "").replace(/""/g, '"').trim()));
  }

  function normHeader(c) {
    return String(c || "").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/\s+/g, " ");
  }

  const PRESETS = [
    {
      id: "sparkasse",
      detect: cols => cols.some(c => /auftragskonto/i.test(c)) && cols.some(c => /buchungstag/i.test(c)),
      guess: cols => {
        const ix = name => cols.findIndex(c => name.test(c));
        return {
          date: ix(/buchungstag/i),
          bookingDate: ix(/valutadatum/i),
          payee: ix(/beguenstigter|zahlungspflichtiger/i),
          text: ix(/verwendungszweck/i),
          amount: ix(/^betrag$/i),
          currency: ix(/waehrung|währung/i),
          status: ix(/^info$/i),
        };
      },
    },
    {
      id: "ing",
      detect: cols => cols[0] === "Buchung" && cols.some(c => /wertstellung/i.test(c)) && cols.some(c => /betrag/i.test(c)),
      guess: cols => ({
        date: cols.indexOf("Buchung"),
        bookingDate: cols.findIndex(c => /wertstellung/i.test(c)),
        payee: cols.findIndex(c => /auftraggeber|empf/i.test(c)),
        text: cols.findIndex(c => /buchungstext/i.test(c)),
        text2: cols.findIndex(c => /verwendungszweck/i.test(c)),
        amount: cols.findIndex(c => /^betrag$/i.test(c)),
        currency: cols.filter(c => /währung|waehrung/i.test(c)).pop() ? cols.lastIndexOf(cols.find(c => /währung|waehrung/i.test(c))) : -1,
        status: cols.findIndex(c => /buchungstext/i.test(c)),
      }),
    },
    {
      id: "dkb",
      detect: cols =>
        cols.some(c => /^buchungsdatum$/i.test(c))
        && cols.some(c => /^status$/i.test(c))
        && cols.some(c => /betrag/i.test(c))
        && !cols.some(c => /^soll$/i.test(c)),
      guess: cols => ({
        date: cols.findIndex(c => /^buchungsdatum$/i.test(c)),
        bookingDate: cols.findIndex(c => /wertstellung/i.test(c)),
        payee: cols.findIndex(c => /zahlungsempf/i.test(c)),
        text: cols.findIndex(c => /verwendungszweck/i.test(c)),
        amount: cols.findIndex(c => /betrag/i.test(c)),
        status: cols.findIndex(c => /^status$/i.test(c)),
        currency: -1,
      }),
    },
    {
      id: "n26",
      detect: cols => cols.some(c => /amount \(eur\)/i.test(c)) && (
        cols.some(c => /booking date/i.test(c)) || cols.some(c => /^payee$/i.test(String(c || "").trim()))
      ),
      guess: cols => {
        const ix = re => cols.findIndex(c => re.test(c));
        const date = ix(/booking date/i);
        const payee = ix(/partner name/i);
        const type = ix(/^type$/i);
        const originalAmount = ix(/original amount/i);
        const originalCurrency = ix(/original currency/i);
        return {
          date: date >= 0 ? date : ix(/^date$/i),
          bookingDate: ix(/value date/i),
          payee: payee >= 0 ? payee : ix(/^payee$/i),
          text: ix(/payment reference/i),
          amount: ix(/amount \(eur\)/i),
          currency: -1,
          status: type >= 0 ? type : ix(/transaction type/i),
          iban: ix(/partner iban/i),
          originalAmount: originalAmount >= 0 ? originalAmount : ix(/amount \(foreign currency\)/i),
          originalCurrency: originalCurrency >= 0 ? originalCurrency : ix(/type foreign currency/i),
          fxRate: ix(/exchange rate/i),
        };
      },
    },
    {
      id: "kreditkarte",
      detect: cols => cols.some(c => /^soll$/i.test(c)) && cols.some(c => /^haben$/i.test(c)) && cols.some(c => /beschreibung/i.test(c)),
      guess: cols => ({
        date: cols.findIndex(c => /belegdatum/i.test(c)),
        bookingDate: cols.findIndex(c => /^buchungsdatum$/i.test(c)),
        text: cols.findIndex(c => /beschreibung/i.test(c)),
        soll: cols.findIndex(c => /^soll$/i.test(c)),
        haben: cols.findIndex(c => /^haben$/i.test(c)),
        status: cols.findIndex(c => /^status$/i.test(c)),
        bankId: cols.findIndex(c => /referenz/i.test(c)),
        currency: -1,
      }),
    },
    {
      // ponytail: only the known AMEX DE columns — a generic Datum/Betrag file must not have its signs flipped
      id: "amex-de",
      detect: cols => {
        const cells = cols.map(c => String(c || "").trim());
        const has = re => cells.some(c => re.test(c));
        if (!has(/^datum$/i) || !has(/^beschreibung$/i) || !has(/^betrag$/i)) return false;
        if (has(/^soll$/i) || has(/^haben$/i)) return false;
        return cells.every(c => /^(datum|beschreibung|betrag|karteninhaber|konto #|erweiterte details|erscheint auf ihrer abrechnung als|adresse|stadt|plz|land|betreff)$/i.test(c));
      },
      guess: cols => ({
        date: cols.findIndex(c => /^datum$/i.test(c)),
        payee: cols.findIndex(c => /erscheint auf ihrer abrechnung als/i.test(c)),
        text: cols.findIndex(c => /^beschreibung$/i.test(c)),
        amount: cols.findIndex(c => /^betrag$/i.test(c)),
        currency: -1,
      }),
    },
  ];

  function detectDelimiter(lines) {
    let semi = 0;
    let comma = 0;
    for (const line of lines.slice(0, 40)) {
      if (!line.trim()) continue;
      const qSemi = (line.match(/;/g) || []).length;
      const qComma = (line.match(/,/g) || []).length;
      if (qSemi >= qComma) semi += qSemi;
      else comma += qComma;
    }
    return comma > semi ? "," : ";";
  }

  function findHeader(records) {
    for (let i = 0; i < records.length; i++) {
      const cols = records[i].map(normHeader);
      const raw = records[i];
      const preset = PRESETS.find(p => p.detect(raw) || p.detect(cols));
      if (preset) return { headerIndex: i, columns: raw, preset };
    }
    for (let i = 0; i < records.length; i++) {
      const cols = records[i];
      const joined = cols.join(";").toLowerCase();
      if (/(datum|buchung|date|betrag|amount|soll)/.test(joined) && cols.length >= 3) {
        return { headerIndex: i, columns: cols, preset: null };
      }
    }
    return { headerIndex: -1, columns: [], preset: null };
  }

  function extractMeta(records, headerIndex) {
    const meta = { closingBalanceMinor: null, closingBalanceDate: "" };
    for (let i = 0; i < headerIndex && i < records.length; i++) {
      const line = records[i].join(";");
      const low = line.toLowerCase();
      if (/kontostand|neuer saldo/.test(low)) {
        for (const cell of records[i]) {
          const amt = parseGermanAmount(cell);
          if (amt !== null) meta.closingBalanceMinor = amt;
        }
        const dm = line.match(/(\d{1,2}\.\d{1,2}\.\d{4})/);
        if (dm) meta.closingBalanceDate = parseGermanDate(dm[1]);
      }
      if (records[i][0] && /^saldo$/i.test(records[i][0].trim())) {
        const amt = parseGermanAmount(records[i][1]);
        if (amt !== null) meta.closingBalanceMinor = amt;
      }
      const z0 = String(records[i][0] || "").trim().toLowerCase();
      if (z0 === "zeitraum" || z0 === "abrechnungszeitraum") {
        const joined = records[i].join(";");
        const range = joined.match(/(\d{1,2}\.\d{1,2}\.\d{4})\s*-\s*(\d{1,2}\.\d{1,2}\.\d{4})/);
        if (range) meta.closingBalanceDate = parseGermanDate(range[2]);
      }
    }
    return meta;
  }

  const UNIFIED_FIELDS = ["date", "amount", "currency", "payee", "description", "category", "type"];

  function extractAiCsvPayload(text) {
    const src = String(text || "");
    let body = src.trim();
    const fence = body.match(/```(?:csv)?\s*([\s\S]*?)```/i);
    if (fence) body = fence[1].trim();
    let aiReport = null;
    const report = src.match(/ROWS\s*=\s*(\d+)\s+TOTAL\s*=\s*([-+]?\d+(?:\.\d+)?)/i);
    if (report) {
      aiReport = { rows: Number(report[1]), totalMinor: Math.round(Number(report[2]) * 100) };
    }
    body = body.replace(/^\s*ROWS\s*=\s*\d+\s+TOTAL\s*=\s*[-+]?\d+(?:\.\d+)?\s*$/gim, "").trim();
    return { body, aiReport };
  }

  function tryUnifiedParse(text) {
    const { body, aiReport } = extractAiCsvPayload(text);
    const records = splitCsvRecords(body, ",");
    let headerIndex = -1;
    let fieldMap = null;
    let columns = [];
    for (let i = 0; i < Math.min(records.length, 8); i++) {
      const cols = records[i].map(c => String(c || "").trim().toLowerCase());
      const have = new Set(cols);
      if (UNIFIED_FIELDS.every(f => have.has(f))) {
        headerIndex = i;
        columns = records[i].map(c => String(c || "").trim());
        fieldMap = Object.fromEntries(UNIFIED_FIELDS.map(f => [f, cols.indexOf(f)]));
        if (have.has("account")) fieldMap.account = cols.indexOf("account");
        break;
      }
    }
    if (headerIndex < 0 || !fieldMap) return null;
    const rows = records.slice(headerIndex + 1).filter(r => r.some(c => String(c || "").trim() !== ""));
    return { headerIndex, columns, rows, fieldMap, aiReport, delimiter: "," };
  }

  function resolveCategoryByLabel(ledger, label, lang) {
    const name = String(label || "").trim();
    if (!name) return "";
    const L = core();
    const base = L?.normalize ? L.normalize(ledger, { lang }) : ledger;
    const needle = name.toLowerCase();
    const hit = (base.categories || []).find(c => !c.archived && !c.isGroup && (
      (c.name || "").toLowerCase() === needle
      || (c.nameZh || "").toLowerCase() === needle
      || (c.nameDe || "").toLowerCase() === needle
      || (L?.localizedCategoryName && L.localizedCategoryName(c, lang).toLowerCase() === needle)
    ));
    return hit?.id || "";
  }

  function fallbackCategoryId(ledger, amountMinor) {
    const kind = amountMinor >= 0 ? "income" : "expense";
    const slug = kind === "income" ? "other-income" : "other";
    const categories = ledger.categories || [];
    const bySlug = categories.find(c => !c.archived && !c.isGroup && c.kind === kind && c.defaultSlug === slug);
    if (bySlug) return bySlug.id;
    return categories.find(c => !c.archived && !c.isGroup && c.kind === kind && /^(other|sonstiges|其他)$/i.test(c.name))?.id || "";
  }

  function personKey(name) {
    return String(name || "")
      .normalize("NFD").replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .split(" ")
      .filter(Boolean)
      .sort()
      .join(" ");
  }

  function payeeMatchesOwner(row, ledger) {
    const payeeKey = personKey(row?.payee);
    if (!payeeKey) return false;
    const owners = (ledger?.settings?.ownerNames || []).map(personKey).filter(Boolean);
    return owners.includes(payeeKey);
  }

  function isRepaymentTransferRow(row, ledger) {
    return payeeMatchesOwner(row, ledger);
  }

  function buildAiImportPrompt(ledger, options = {}) {
    const L = core();
    const lang = String(options.lang || "en").slice(0, 2);
    const base = L?.normalize ? L.normalize(ledger, { lang }) : ledger;
    const loc = cat => (L?.localizedCategoryName ? L.localizedCategoryName(cat, lang) : cat.name) || cat.name;
    const expense = base.categories.filter(c => c.kind === "expense" && !c.archived && !c.isGroup).map(loc);
    const income = base.categories.filter(c => c.kind === "income" && !c.archived && !c.isGroup).map(loc);
    const cc = base.categories.find(c => c.kind === "expense" && !c.archived && c.defaultSlug === "credit-card");
    const ccName = cc ? loc(cc) : ({ zh: "信用卡还款", de: "Kreditkartenabrechnung" }[lang] || "Credit card bill");
    const header = "date,amount,currency,payee,description,category,type,account";
    const intro = {
      zh: "请把这个月的全部账单（PDF、截图或 CSV）一起附上，并输出每一行。不要跳过或合并任何一行。",
      en: "Attach every statement for the month (PDF, screenshot, or CSV) and output every row. Do not skip or merge rows.",
      de: "Hänge alle Auszüge dieses Monats an (PDF, Screenshot oder CSV) und gib jede Zeile aus. Keine Zeilen auslassen oder zusammenfassen.",
    }[lang] || "Attach every statement for the month (PDF, screenshot, or CSV) and output every row. Do not skip or merge rows.";
    const rules = {
      zh: [
        `输出为 UTF-8 CSV，表头必须完全是：${header}`,
        "date：ISO 格式 YYYY-MM-DD",
        "amount：带符号的小数，点号分隔（支出为负，收入为正）",
        "currency：ISO 货币代码",
        "payee、description：原文尽量保留",
        `category：以下名称之一（当前界面语言），不确定则留空：\n支出：${expense.join("、")}\n收入：${income.join("、")}`,
        "type：按金额符号填 income 或 expense。不要自行判断转账，应用会把不同账单里符号相反、金额相同、日期接近的行配成一对。",
        "account：填写这一行来自哪一份账单或哪张卡。同一份账单用同一个名称；只有一份账单时可以留空。",
        `信用卡账单扣款（American Express、Visa、Mastercard 等）仍要输出，类别用「${ccName}」。`,
        "只在一个代码块内输出 CSV，不要其他说明",
        "代码块后单独一行：ROWS=<行数> TOTAL=<金额合计>",
      ],
      en: [
        `UTF-8 CSV, comma-separated, header exactly: ${header}`,
        "date: ISO YYYY-MM-DD; amount: signed decimal with a dot (expenses negative, income positive)",
        "currency: ISO code; payee and description: as on the statement",
        `category: one of these names (current UI language), or empty if unsure:\nExpenses: ${expense.join(", ")}\nIncome: ${income.join(", ")}`,
        "type: income or expense according to the sign. Do not try to detect transfers — the app pairs rows from different statements that have opposite signs, the same amount, and close dates.",
        "account: the statement or card name this row comes from. Use one name per statement; leave it empty when there is only one statement.",
        `Still output credit-card bill payments (American Express, Visa, Mastercard, …) and set category to "${ccName}".`,
        "Output ONLY the CSV inside one fenced code block",
        "After the block, one line: ROWS=<count> TOTAL=<sum of amounts>",
      ],
      de: [
        `UTF-8-CSV, kommagetrennt, Kopfzeile genau: ${header}`,
        "date: ISO YYYY-MM-DD; amount: vorzeichenbehaftete Dezimalzahl mit Punkt (Ausgaben negativ, Einnahmen positiv)",
        "currency: ISO-Code; payee und description: wie im Auszug",
        `category: einer dieser Namen (aktuelle UI-Sprache), sonst leer:\nAusgaben: ${expense.join(", ")}\nEinnahmen: ${income.join(", ")}`,
        "type: income oder expense nach dem Vorzeichen. Überweisungen nicht selbst erkennen — die App paart Zeilen aus verschiedenen Auszügen mit entgegengesetztem Vorzeichen, gleichem Betrag und nahem Datum.",
        "account: Name des Auszugs oder der Karte, aus dem die Zeile stammt. Pro Auszug derselbe Name; bei nur einem Auszug leer lassen.",
        `Kreditkartenabrechnungen (American Express, Visa, Mastercard …) trotzdem ausgeben, Kategorie „${ccName}“.`,
        "Nur die CSV in einem Codeblock ausgeben",
        "Danach eine Zeile: ROWS=<Anzahl> TOTAL=<Summe der Beträge>",
      ],
    }[lang] || [];
    return [intro, "", ...rules.map((line, i) => `${i + 1}. ${line}`)].join("\n");
  }

  function parseStatement(text) {
    const unified = tryUnifiedParse(text);
    if (unified) {
      return {
        unified: true,
        headerIndex: unified.headerIndex,
        delimiter: unified.delimiter,
        columns: unified.columns,
        rows: unified.rows,
        fieldMap: unified.fieldMap,
        guessedMapping: {},
        presetId: "unified",
        meta: { aiReport: unified.aiReport || null },
      };
    }
    const flat = String(text || "").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = flat.split("\n");
    const delimiter = detectDelimiter(lines);
    const records = splitCsvRecords(flat, delimiter);
    const { headerIndex, columns, preset } = findHeader(records);
    if (headerIndex < 0) {
      return { headerIndex: -1, delimiter, columns: [], rows: [], guessedMapping: {}, presetId: "generic", meta: {} };
    }
    const rows = records.slice(headerIndex + 1).filter(r => r.some(c => c !== ""));
    const presetId = preset?.id || "generic";
    const guessedMapping = preset ? preset.guess(columns) : guessGenericMapping(columns);
    const meta = extractMeta(records, headerIndex);
    return { headerIndex, delimiter, columns, rows, guessedMapping, presetId, meta };
  }

  function guessGenericMapping(columns) {
    const ix = re => columns.findIndex(c => re.test(c));
    return {
      date: ix(/buchung|beleg|datum|date/i),
      bookingDate: ix(/wertstell|value/i),
      payee: ix(/partner|empf|auftraggeber|beguenstigter/i),
      text: ix(/verwendungszweck|beschreibung|reference|zweck/i),
      amount: ix(/betrag|amount/i),
      soll: ix(/^soll$/i),
      haben: ix(/^haben$/i),
      status: ix(/status|info/i),
      currency: ix(/währung|waehrung|currency/i),
      bankId: ix(/referenz|id/i),
    };
  }

  function colVal(cols, index, fallback = "") {
    if (!Number.isInteger(index) || index < 0) return fallback;
    return cols[index] ?? fallback;
  }

  function rowPending(statusText, presetId) {
    const s = String(statusText || "").toLowerCase();
    return /vorgemerkt|pending|vorgem\.|nicht gebucht/.test(s);
  }

  function amountFromRow(cols, mapping, presetId) {
    const hasSollHaben = (Number.isInteger(mapping.soll) && mapping.soll >= 0)
      || (Number.isInteger(mapping.haben) && mapping.haben >= 0);
    if (hasSollHaben) {
      const haben = parseGermanAmount(colVal(cols, mapping.haben));
      const soll = parseGermanAmount(colVal(cols, mapping.soll));
      if (haben !== null && haben !== 0) return haben;
      if (soll !== null && soll !== 0) return -Math.abs(soll);
      return null;
    }
    const amtCol = mapping.amount;
    const raw = colVal(cols, amtCol);
    if (presetId === "amex-de") {
      const n = parseGermanAmount(raw);
      return n === null ? null : -n;
    }
    if (presetId === "n26") return parseDecimalAmount(raw);
    return parseGermanAmount(raw);
  }

  function applyMapping(parsed, mapping, accountId, options = {}) {
    if (parsed?.unified && parsed.fieldMap) {
      const lang = options.lang || "en";
      const ledger = options.ledger;
      const ix = parsed.fieldMap;
      const out = [];
      for (const cols of parsed.rows || []) {
        const date = String(cols[ix.date] || "").trim();
        if (!ISO_DATE.test(date)) continue;
        const amountMinor = parseDecimalAmount(cols[ix.amount]);
        if (amountMinor === null || amountMinor === 0) continue;
        const currency = String(cols[ix.currency] || "EUR").trim().toUpperCase().slice(0, 3) || "EUR";
        const payee = String(cols[ix.payee] || "").trim();
        const text = String(cols[ix.description] || "").trim();
        const categoryLabel = String(cols[ix.category] || "").trim();
        const categoryId = ledger ? resolveCategoryByLabel(ledger, categoryLabel, lang) : "";
        let sourceId = options.sourceId || "ai";
        if (Number.isInteger(ix.account) && ix.account >= 0) {
          const label = String(cols[ix.account] || "").trim();
          if (label) sourceId = label;
        }
        out.push({ date, bookingDate: date, amountMinor, currency, payee, text, pending: false, accountId, sourceId, categoryId });
      }
      return out;
    }
    const m = { ...parsed.guessedMapping, ...mapping };
    const out = [];
    const delim = parsed.delimiter || ";";
    parsed.unreadable = [];
    for (const cols of parsed.rows || []) {
      const date = parseGermanDate(colVal(cols, m.date));
      const bookingDate = parseGermanDate(colVal(cols, m.bookingDate)) || date;
      const amountMinor = amountFromRow(cols, m, parsed.presetId);
      if (!date || amountMinor === null || amountMinor === 0) {
        parsed.unreadable.push({ raw: cols.join(delim) });
        continue;
      }
      const payee = colVal(cols, m.payee);
      let text = colVal(cols, m.text);
      if (!text && Number.isInteger(m.text2) && m.text2 >= 0) text = colVal(cols, m.text2);
      const status = colVal(cols, m.status);
      const pending = rowPending(status, parsed.presetId) || rowPending(colVal(cols, m.text), parsed.presetId);
      const currency = colVal(cols, m.currency, "EUR") || "EUR";
      const bankId = colVal(cols, m.bankId, "") || "";
      const row = { date, bookingDate, amountMinor, currency, payee, text, pending, accountId, sourceId: options.sourceId || "", bankId: bankId || undefined };
      const partnerIban = String(colVal(cols, m.iban) || "").replace(/\s/g, "");
      if (partnerIban) row.counterpartyIban = partnerIban;
      if (parsed.presetId === "n26") {
        const oa = parseDecimalAmount(colVal(cols, m.originalAmount));
        const oc = colVal(cols, m.originalCurrency);
        const fx = Number(colVal(cols, m.fxRate));
        if (oa !== null && /^[A-Z]{3}$/.test(oc)) {
          row.originalAmountMinor = oa;
          row.originalCurrency = oc;
          if (Number.isFinite(fx) && fx > 0) row.fxRate = fx;
        }
      }
      out.push(row);
    }
    return out;
  }

  function normalizeFingerprintText(row) {
    const note = [row.payee, row.text].filter(Boolean).join(" ");
    const K = core()?.merchantKey;
    if (K) return K(note);
    return String(note || "").toLowerCase().replace(/\d+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
  }

  function fingerprint(row) {
    const base = [
      row.accountId || "",
      row.date || "",
      String(row.amountMinor),
      normalizeFingerprintText(row),
    ];
    if (row.bankId) base.push(row.bankId);
    return base.join("\u241e");
  }

  function fingerprintCounts(rows, accountId) {
    const counts = new Map();
    const use = rows.map(r => ({ ...r, accountId: accountId || r.accountId }));
    for (const row of use) {
      const fp = fingerprint(row);
      counts.set(fp, (counts.get(fp) || 0) + 1);
    }
    return counts;
  }

  function dayDiff(a, b) {
    if (!ISO_DATE.test(a) || !ISO_DATE.test(b)) return 999;
    const da = Date.parse(a + "T12:00:00Z");
    const db = Date.parse(b + "T12:00:00Z");
    return Math.round(Math.abs(da - db) / 86400000);
  }

  function eurAmountForTx(tx) {
    if (!tx) return null;
    return Number.isInteger(tx.amountMinor) ? tx.amountMinor : null;
  }

  function amountMatchesExact(bankMinor, tx, toleranceForeign = 0.03) {
    const txMinor = eurAmountForTx(tx);
    if (txMinor === null || bankMinor === null) return false;
    if (txMinor === bankMinor) return true;
    if (tx.originalCurrency && /^[A-Z]{3}$/.test(tx.originalCurrency) && tx.originalCurrency !== (tx.currency || "EUR")) {
      const est = txMinor;
      const diff = Math.abs(est - bankMinor);
      return diff <= Math.max(Math.abs(bankMinor) * toleranceForeign, 1);
    }
    return false;
  }

  function textSimilar(a, b) {
    const ka = normalizeFingerprintText({ payee: "", text: a });
    const kb = normalizeFingerprintText({ payee: "", text: b });
    if (!ka || !kb) return false;
    return ka === kb || ka.includes(kb) || kb.includes(ka);
  }

  function collectFingerprints(ledger, accountId) {
    const map = new Map();
    for (const tx of ledger.transactions || []) {
      if (tx.accountId !== accountId) continue;
      const fp = tx.bankFingerprint || buildTxFingerprint(tx);
      if (!fp) continue;
      const list = map.get(fp) || [];
      list.push(tx);
      map.set(fp, list);
    }
    return map;
  }

  function buildTxFingerprint(tx) {
    return fingerprint({
      accountId: tx.accountId,
      date: tx.date,
      amountMinor: tx.amountMinor,
      payee: "",
      text: tx.note || "",
      bankId: tx.bankId,
    });
  }

  function findManualCandidates(ledger, accountId, row, options) {
    const windowDays = Number.isInteger(options?.dateWindowDays) ? options.dateWindowDays : 3;
    const out = [];
    for (const tx of ledger.transactions || []) {
      if (tx.source === "import") continue;
      if (tx.bankFingerprint || tx.importBatchId) continue;
      if (tx.accountId && tx.accountId !== accountId) continue;
      if (!tx.accountId || tx.accountId === accountId) {
        if (Math.sign(tx.amountMinor) !== Math.sign(row.amountMinor)) continue;
        if (!amountMatchesExact(row.amountMinor, tx, options?.foreignTolerance ?? 0.03)) continue;
        if (dayDiff(tx.date, row.date) > windowDays) continue;
        out.push(tx);
      }
    }
    return out;
  }

  function findSuggestions(ledger, accountId, row) {
    const sugs = [];
    for (const tx of ledger.transactions || []) {
      if (tx.source === "import") continue;
      if (tx.bankFingerprint || tx.importBatchId) continue;
      if (tx.accountId && tx.accountId !== accountId) continue;
      if (Math.sign(tx.amountMinor) !== Math.sign(row.amountMinor)) continue;
      const days = dayDiff(tx.date, row.date);
      if (days > 10) continue;
      const exactAmt = amountMatchesExact(row.amountMinor, tx);
      const nearAmt = Math.abs(tx.amountMinor - row.amountMinor) <= Math.max(Math.abs(row.amountMinor) * 0.1, 1);
      const similar = textSimilar(tx.note, [row.payee, row.text].filter(Boolean).join(" "));
      if (exactAmt || nearAmt || similar) {
        sugs.push({ tx, near: nearAmt && !exactAmt, similar });
      }
    }
    return sugs;
  }

  function moneyCurrency(row) {
    return String(row?.currency || "EUR").trim().toUpperCase() || "EUR";
  }

  function txSourceKey(tx) {
    if (typeof tx?.sourceId === "string" && tx.sourceId) return tx.sourceId;
    if (typeof tx?.importBatchId === "string" && tx.importBatchId) return `batch:${tx.importBatchId}`;
    return "";
  }

  // ponytail: O(n^2) pair scan; index by amount if a month of statements gets large
  function detectTransfers(rows, ledger) {
    const WINDOW = 4;
    const candidates = [];
    for (let i = 0; i < rows.length; i++) {
      const a = rows[i];
      if (a.pending || !a.sourceId) continue;
      for (let j = i + 1; j < rows.length; j++) {
        const b = rows[j];
        if (b.pending || !b.sourceId || a.sourceId === b.sourceId) continue;
        if (moneyCurrency(a) !== moneyCurrency(b)) continue;
        if (Math.abs(a.amountMinor) !== Math.abs(b.amountMinor)) continue;
        if (Math.sign(a.amountMinor) === Math.sign(b.amountMinor)) continue;
        const days = dayDiff(a.date, b.date);
        if (days > WINDOW) continue;
        candidates.push({ rowA: i, rowB: j, days, amountMinor: Math.abs(a.amountMinor), dateA: a.date, dateB: b.date });
      }
    }
    candidates.sort((x, y) => x.days - y.days || x.rowA - y.rowA || x.rowB - y.rowB);
    const used = new Set();
    const pairs = [];
    for (const c of candidates) {
      if (used.has(c.rowA) || used.has(c.rowB)) continue;
      used.add(c.rowA);
      used.add(c.rowB);
      pairs.push(c);
    }
    const ledgerCands = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (used.has(i) || row.pending || !row.sourceId) continue;
      for (const tx of ledger.transactions || []) {
        if (tx.transfer === true) continue;
        if (tx.source !== "import" && !tx.importBatchId) continue;
        const key = txSourceKey(tx);
        if (!key || key === row.sourceId) continue;
        if (moneyCurrency(tx) !== moneyCurrency(row)) continue;
        if (Math.sign(tx.amountMinor) !== -Math.sign(row.amountMinor)) continue;
        if (Math.abs(tx.amountMinor) !== Math.abs(row.amountMinor)) continue;
        const days = dayDiff(tx.date, row.date);
        if (days > WINDOW) continue;
        ledgerCands.push({ rowIndex: i, txId: tx.id, days, amountMinor: Math.abs(row.amountMinor) });
      }
    }
    ledgerCands.sort((x, y) => x.days - y.days || x.rowIndex - y.rowIndex || String(x.txId).localeCompare(String(y.txId)));
    const usedTx = new Set();
    const cross = [];
    for (const c of ledgerCands) {
      if (used.has(c.rowIndex) || usedTx.has(c.txId)) continue;
      used.add(c.rowIndex);
      usedTx.add(c.txId);
      cross.push(c);
    }
    return { withinFile: pairs, withLedger: cross };
  }

  function planImport(ledger, accountId, rows, options = {}) {
    const base = core()?.normalize ? core().normalize(ledger) : clone(ledger);
    const skipPending = options.skipPending !== false;
    const fpInFile = new Map();
    const countsCache = new Map();
    const countsFor = accId => {
      if (!countsCache.has(accId)) {
        const counts = new Map();
        for (const [fp, list] of collectFingerprints(base, accId).entries()) counts.set(fp, list.length);
        countsCache.set(accId, counts);
      }
      return countsCache.get(accId);
    };

    const result = {
      new: [],
      matched: [],
      suggestions: [],
      possibleDuplicates: [],
      transfers: [],
      skipped: [],
    };

    const fallbackAccount = accountId || (base.accounts || []).find(a => !a.archived)?.id || "";
    const annotated = rows.map((row, index) => ({
      ...row,
      accountId: row.accountId || fallbackAccount,
      sourceId: row.sourceId || "",
      _index: index,
    }));
    const xfer = detectTransfers(annotated, base);
    const paired = new Set();
    for (const p of xfer.withinFile) {
      paired.add(p.rowA);
      paired.add(p.rowB);
    }
    for (const p of xfer.withLedger) paired.add(p.rowIndex);
    const ownIdx = new Set();
    for (const row of annotated) {
      if (paired.has(row._index) || row.pending) continue;
      if (payeeMatchesOwner(row, base)) ownIdx.add(row._index);
    }
    const claimedManual = new Set();

    for (const row of annotated) {
      if (paired.has(row._index) || ownIdx.has(row._index)) continue;
      if (row.pending && skipPending) {
        result.skipped.push({ row, index: row._index, reason: "pending" });
        continue;
      }
      const fp = fingerprint(row);
      const seen = (fpInFile.get(fp) || 0) + 1;
      fpInFile.set(fp, seen);
      const exists = countsFor(row.accountId).get(fp) || 0;
      if (seen <= exists) {
        result.possibleDuplicates.push({ row, index: row._index, fingerprint: fp, slot: seen });
        continue;
      }

      const exact = findManualCandidates(base, row.accountId, row, options).filter(t => !claimedManual.has(t.id));
      if (exact.length === 1) {
        claimedManual.add(exact[0].id);
        result.matched.push({ row, index: row._index, txId: exact[0].id, auto: true, fingerprint: fp });
        continue;
      }
      if (exact.length > 1) {
        result.suggestions.push({ row, index: row._index, fingerprint: fp, kind: "ambiguous", candidates: exact.map(t => t.id) });
        result.new.push({ row, index: row._index, fingerprint: fp });
        continue;
      }

      const sugs = findSuggestions(base, row.accountId, row);
      if (sugs.length) {
        result.suggestions.push({
          row,
          index: row._index,
          fingerprint: fp,
          kind: "near",
          candidates: sugs.map(s => ({ txId: s.tx.id, near: s.near, similar: s.similar })),
        });
      }
      result.new.push({ row, index: row._index, fingerprint: fp });
    }

    for (const row of annotated) {
      if (ownIdx.has(row._index)) result.transfers.push({ kind: "possible-own", row, index: row._index });
    }
    result.transfers = result.transfers.concat(xfer.withinFile.map(p => ({
      ...p,
      rowA: annotated[p.rowA],
      rowB: annotated[p.rowB],
      kind: "withinFile",
    })).concat(xfer.withLedger.map(p => ({
      ...p,
      row: annotated[p.rowIndex],
      kind: "ledger",
    }))));

    return result;
  }

  function guessCategory(ledger, row) {
    const note = [row.payee, row.text].filter(Boolean).join(" — ") || row.payee || row.text || "Import";
    if (row.categoryId) return { note, categoryId: row.categoryId };
    const lite = {
      categories: ledger.categories,
      settings: ledger.settings,
      meta: ledger.meta,
      accounts: ledger.accounts,
      transactions: [],
    };
    const g = core()?.guessCategory?.(lite, note, row.amountMinor);
    return { note, categoryId: g?.categoryId || "" };
  }

  function ensureImportMeta(ledger) {
    if (!ledger.meta) ledger.meta = {};
    if (!Array.isArray(ledger.meta.importBatches)) ledger.meta.importBatches = [];
    return ledger;
  }

  function commitImport(ledger, plan, selections = {}) {
    const L = core();
    let base = L?.normalize ? L.normalize(ledger) : clone(ledger);
    base = ensureImportMeta(base);
    const batchId = selections.batchId || createId();
    const batch = {
      id: batchId,
      accountId: selections.accountId,
      createdAt: Date.now(),
      newTxIds: [],
      merges: [],
      transferLinks: [],
    };

    const txById = new Map((base.transactions || []).map((t, i) => [t.id, i]));

    if (selections.linkTransfersOnly && (selections.transfers || []).length) {
      for (const link of selections.transfers) {
        const ids = (link.txIds || []).filter(id => typeof id === "string" && id !== "__pending__");
        if (ids.length >= 2) {
          const hadTransfer = Object.fromEntries(ids.map(id => {
            const i = txById.get(id);
            return [id, i !== undefined && base.transactions[i]?.transfer === true];
          }));
          batch.transferLinks.push({ txIds: ids, hadTransfer });
          for (const id of ids) {
            const i = txById.get(id);
            if (i !== undefined) base.transactions[i] = { ...base.transactions[i], transfer: true };
          }
        }
      }
      base.meta.importBatches.push(batch);
      if (L?.normalize) base = L.normalize(base);
      return { ledger: base, batchId };
    }

    const takeNew = new Set(selections.newIndices || (selections.includeNew ? (plan.new || []).map(n => n.index) : []));
    if (selections.includeNew === true && !selections.newIndices) {
      (plan.new || []).forEach(n => takeNew.add(n.index));
    }
    const merges = selections.merges || {};
    const takeDupes = new Set(selections.duplicateIndices || []);
    const transferConfirm = selections.transfers || [];
    const rowIndexToTxId = new Map();

    const applyBankFx = (prev, next, row) => {
      if (row.originalCurrency && row.originalAmountMinor) {
        next.originalAmountMinor = row.originalAmountMinor;
        next.originalCurrency = row.originalCurrency;
        if (row.fxRate) next.fxRate = row.fxRate;
        next.fxSource = "bank";
        next.fxDate = row.bookingDate || row.date;
      } else if (prev.originalCurrency && prev.originalCurrency !== (prev.currency || "EUR")) {
        next.fxSource = "bank";
        next.fxDate = row.bookingDate || row.date;
      }
    };

    const applyMerge = (item, txId) => {
      const idx = txById.get(txId);
      if (idx === undefined) return;
      const prev = clone(base.transactions[idx]);
      const row = item.row;
      const next = {
        ...prev,
        amountMinor: row.amountMinor,
        bookingDate: row.bookingDate,
        accountId: prev.accountId || selections.accountId || row.accountId,
        updatedAt: Date.now(),
      };
      applyBankFx(prev, next, row);
      next.bankFingerprint = item.fingerprint || fingerprint(row);
      if (row.bankId) next.bankId = row.bankId;
      batch.merges.push({ txId, before: prev, fingerprint: next.bankFingerprint });
      base.transactions[idx] = next;
    };

    const addTx = draft => {
      const now = Date.now();
      const tx = {
        id: createId(),
        accountId: draft.accountId,
        categoryId: draft.categoryId,
        amountMinor: draft.amountMinor,
        currency: draft.currency || base.settings?.defaultCurrency || "EUR",
        date: draft.date,
        note: String(draft.note || "").slice(0, 500),
        source: draft.source === "import" ? "import" : "manual",
        createdAt: now,
        updatedAt: now,
      };
      if (draft.recurringId) tx.recurringId = draft.recurringId;
      if (draft.bookingDate) tx.bookingDate = draft.bookingDate;
      if (draft.bankFingerprint) tx.bankFingerprint = draft.bankFingerprint;
      if (draft.bankId) tx.bankId = draft.bankId;
      if (draft.importBatchId) tx.importBatchId = draft.importBatchId;
      if (Number.isInteger(draft.originalAmountMinor) && /^[A-Z]{3}$/.test(draft.originalCurrency || "")) {
        tx.originalAmountMinor = draft.originalAmountMinor;
        tx.originalCurrency = draft.originalCurrency;
        tx.fxRate = Number(draft.fxRate) || 0;
        tx.fxSource = ["ecb", "manual", "bank"].includes(draft.fxSource) ? draft.fxSource : "estimate";
        tx.fxDate = draft.fxDate || draft.date;
      }
      if (draft.transfer === true) tx.transfer = true;
      if (typeof draft.sourceId === "string" && draft.sourceId) tx.sourceId = draft.sourceId.slice(0, 180);
      if (typeof draft.transferAccountId === "string" && draft.transferAccountId) tx.transferAccountId = draft.transferAccountId;
      txById.set(tx.id, base.transactions.length);
      base.transactions.push(tx);
      base.meta.lastEntryAt = now;
      return tx;
    };

    const mergeOps = [];
    for (const item of plan.matched || []) {
      const txId = merges[item.index] ?? (item.auto ? item.txId : null);
      if (txId) mergeOps.push({ item, txId });
    }
    for (const item of plan.new || []) {
      if (merges[item.index]) {
        mergeOps.push({ item, txId: merges[item.index] });
        takeNew.delete(item.index);
      }
    }
    for (const op of mergeOps) applyMerge(op.item, op.txId);

    const importItems = []
      .concat((plan.new || []).filter(n => takeNew.has(n.index)))
      .concat((plan.possibleDuplicates || []).filter(d => takeDupes.has(d.index)));

    const categoryOverrides = selections.categoryOverrides || {};
    for (const item of importItems) {
      const row = item.row;
      const { note, categoryId: guessed } = guessCategory(base, row);
      let categoryId = categoryOverrides[item.index] ?? guessed;
      if (!categoryId) categoryId = fallbackCategoryId(base, row.amountMinor);
      const fp = item.fingerprint || fingerprint(row);
      const tx = addTx({
        accountId: row.accountId || selections.accountId,
        categoryId,
        amountMinor: row.amountMinor,
        currency: row.currency || base.settings?.defaultCurrency || "EUR",
        date: row.date,
        bookingDate: row.bookingDate,
        note,
        source: "import",
        bankFingerprint: fp,
        bankId: row.bankId,
        importBatchId: batchId,
        sourceId: row.sourceId,
        ...(row.originalCurrency ? {
          originalAmountMinor: row.originalAmountMinor,
          originalCurrency: row.originalCurrency,
          fxRate: row.fxRate || 0,
          fxSource: "bank",
          fxDate: row.bookingDate || row.date,
        } : {}),
      });
      rowIndexToTxId.set(item.index, tx.id);
      batch.newTxIds.push(tx.id);
    }

    const rowFromPlan = index => {
      for (const item of plan.transfers || []) {
        if (item.row && (item.index ?? item.rowIndex ?? item.row._index) === index) return item.row;
        if (item.rowA?._index === index) return item.rowA;
        if (item.rowB?._index === index) return item.rowB;
      }
      for (const item of [].concat(plan.new || [], plan.matched || [], plan.possibleDuplicates || [])) {
        if (item.index === index) return item.row;
      }
      return null;
    };
    const ensureImportedTx = (index, opts = {}) => {
      if (rowIndexToTxId.has(index)) return rowIndexToTxId.get(index);
      const row = rowFromPlan(index);
      if (!row) return null;
      const { note, categoryId: guessed } = guessCategory(base, row);
      let categoryId = categoryOverrides[index] || opts.categoryId || guessed;
      if (!categoryId) categoryId = fallbackCategoryId(base, row.amountMinor);
      const tx = addTx({
        accountId: row.accountId || selections.accountId,
        categoryId,
        amountMinor: row.amountMinor,
        currency: row.currency || base.settings?.defaultCurrency || "EUR",
        date: row.date,
        bookingDate: row.bookingDate,
        note,
        source: "import",
        bankFingerprint: fingerprint(row),
        bankId: row.bankId,
        importBatchId: batchId,
        sourceId: row.sourceId,
        transfer: opts.asTransfer === true,
        transferAccountId: opts.transferAccountId,
        ...(row.originalCurrency ? {
          originalAmountMinor: row.originalAmountMinor,
          originalCurrency: row.originalCurrency,
          fxRate: row.fxRate || 0,
          fxSource: "bank",
          fxDate: row.bookingDate || row.date,
        } : {}),
      });
      rowIndexToTxId.set(index, tx.id);
      batch.newTxIds.push(tx.id);
      return tx.id;
    };

    const ownOn = new Set(selections.possibleOwnIndices || selections.repaymentIndices || []);
    const pairOn = item => (transferConfirm || []).some(link => {
      if (item.kind === "withinFile") return link.rowAIndex === item.rowA?._index && link.rowBIndex === item.rowB?._index;
      if (item.kind === "ledger") return link.rowIndex === item.rowIndex && link.ledgerTxId === item.txId;
      return false;
    });
    const linkIds = ids => {
      const hadTransfer = Object.fromEntries(ids.map(id => {
        const i = txById.get(id);
        return [id, i !== undefined && base.transactions[i]?.transfer === true];
      }));
      batch.transferLinks.push({ txIds: ids, hadTransfer });
      for (const id of ids) {
        const i = txById.get(id);
        if (i !== undefined) base.transactions[i] = { ...base.transactions[i], transfer: true };
      }
    };
    for (const item of plan.transfers || []) {
      if (item.kind === "possible-own") {
        ensureImportedTx(item.index, { asTransfer: ownOn.has(item.index) });
      } else if (item.kind === "withinFile") {
        const on = pairOn(item);
        const a = ensureImportedTx(item.rowA._index, { asTransfer: on });
        const b = ensureImportedTx(item.rowB._index, { asTransfer: on });
        if (on && a && b) linkIds([a, b]);
      } else if (item.kind === "ledger") {
        const on = pairOn(item);
        const a = ensureImportedTx(item.row?._index ?? item.rowIndex, { asTransfer: on });
        if (on && a && item.txId) linkIds([a, item.txId]);
      }
    }

    batch.accountId = batch.accountId || selections.accountId;
    base.meta.importBatches.push(batch);
    if (L?.normalize) base = L.normalize(base);
    return { ledger: base, batchId };
  }

  function undoImport(ledger, batchId) {
    const L = core();
    let base = L?.normalize ? L.normalize(ledger) : clone(ledger);
    if (!Array.isArray(base.meta?.importBatches)) return { ledger: base, undone: false };
    const idx = base.meta.importBatches.findIndex(b => b.id === batchId);
    if (idx < 0) return { ledger: base, undone: false };
    const batch = base.meta.importBatches[idx];
    const removeIds = new Set(batch.newTxIds || []);
    for (const m of batch.merges || []) {
      const txi = base.transactions.findIndex(t => t.id === m.txId);
      if (txi >= 0) base.transactions[txi] = clone(m.before);
    }
    for (const link of batch.transferLinks || []) {
      const had = link.hadTransfer || {};
      for (const id of link.txIds || []) {
        const txi = base.transactions.findIndex(t => t.id === id);
        if (txi >= 0) {
          const tx = { ...base.transactions[txi] };
          if (had[id]) tx.transfer = true;
          else delete tx.transfer;
          base.transactions[txi] = tx;
        }
      }
    }
    base.transactions = base.transactions.filter(t => !removeIds.has(t.id));
    base.meta.importBatches = base.meta.importBatches.filter(b => b.id !== batchId);
    if (L?.normalize) base = L.normalize(base);
    return { ledger: base, undone: true };
  }

  function accountBalance(ledger, accountId, asOfDate) {
    const account = (ledger.accounts || []).find(a => a.id === accountId);
    if (!account) return 0;
    let bal = Number.isInteger(account.openingBalanceMinor) ? account.openingBalanceMinor : 0;
    const open = account.openingDate || "";
    for (const tx of ledger.transactions || []) {
      if (tx.accountId !== accountId) continue;
      if (open && ISO_DATE.test(open) && tx.date < open) continue;
      if (asOfDate && ISO_DATE.test(asOfDate) && tx.date > asOfDate) continue;
      bal += tx.amountMinor;
    }
    return bal;
  }

  function checkClosingBalance(ledger, accountId, closingMinor, asOfDate) {
    const actual = accountBalance(ledger, accountId, asOfDate);
    const expected = Number.isInteger(closingMinor) ? closingMinor : null;
    if (expected === null) return { ok: true, actual, expected: null, diff: 0, warning: false };
    const diff = actual - expected;
    const ok = diff === 0;
    return { ok, actual, expected, diff, warning: !ok };
  }

  function rowsFromStatement(text, accountId, mapping) {
    const parsed = parseStatement(text);
    return applyMapping(parsed, mapping || parsed.guessedMapping, accountId);
  }

  function sumBookedRows(rows) {
    return rows.filter(r => !r.pending).reduce((s, r) => s + r.amountMinor, 0);
  }

  const exported = {
    decodeBytes,
    parseStatement,
    applyMapping,
    fingerprint,
    fingerprintCounts,
    planImport,
    commitImport,
    undoImport,
    accountBalance,
    checkClosingBalance,
    rowsFromStatement,
    sumBookedRows,
    guessCategory,
    buildAiImportPrompt,
    extractAiCsvPayload,
    tryUnifiedParse,
    isRepaymentTransferRow,
    resolveCategoryByLabel,
  };

  root.LifeLedgerBankImport = exported;
  if (typeof module !== "undefined" && module.exports) module.exports = exported;
})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : global);
