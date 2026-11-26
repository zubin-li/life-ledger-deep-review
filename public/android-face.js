/* Life Ledger Android 1.0 — Shell, Welcome, Empty States, Isolated Demo, Today & Capture Sheet (Phases 1–3)
   Activates ONLY when html[data-android-app="true"] is set (Android build or localhost ?platform=android).
   All calculations and data mutations stay in the shared core (window.LifeLedgerAndroidCore / ledger-core.js). */
(() => {
  const ONBOARDED_KEY = "life-ledger-android-onboarded-v1";
  const CARDS_PREF_KEY = "life-ledger-android-today-cards-v1";
  const SPLASH_PREFS_KEY = "life-ledger-android-splash-v1";
  const DISPLAY_PREFS_KEY = "life-ledger-android-display-v1";
  const SPLASH_MEDIA_IMAGE_DATE = "__splash_image__";
  const SPLASH_MEDIA_AUDIO_DATE = "__splash_audio__";
  const SPLASH_MEDIA_MAX_BYTES = 1_200_000;
  const SPLASH_DURATION_MS = 2500;
  const HISTORY_VIEWS = new Set(["timeline", "week", "review", "longrange"]);
  const PRIMARY_TABS = new Set(["today", "ledger", "timeline", "habits"]);
  const DEFAULT_TODAY_CARDS = ["quote", "weather", "mood", "habits", "focusSpend", "wall"];
  const ALL_TODAY_CARDS = ["quote", "weather", "mood", "habits", "focusSpend", "wall", "rhythm"];

  // SPEC §1b: 7 built-in weekday visual styles (0=Mon .. 6=Sun)
  const SPLASH_WEEKDAY_STYLES = [
    {
      index: 0,
      id: "dawn",
      isLight: true,
      name: { zh: "晨曦微光", en: "Dawn Mist", de: "Morgendunst" },
      short: { zh: "晨曦", en: "Dawn", de: "Morgen" },
      swatchBg: "linear-gradient(160deg,#E8F1EC,#F6EFE2)",
      swatchFg: "#1E2723",
    },
    {
      index: 1,
      id: "pine",
      isLight: false,
      name: { zh: "墨松林间", en: "Pine Ink", de: "Kieferntusche" },
      short: { zh: "墨松", en: "Pine", de: "Kiefer" },
      swatchBg: "linear-gradient(160deg,#1E2723,#2F453B)",
      swatchFg: "#E8F0EC",
    },
    {
      index: 2,
      id: "water",
      isLight: false,
      name: { zh: "静水微澜", en: "Still Water", de: "Stilles Wasser" },
      short: { zh: "静水", en: "Water", de: "Wasser" },
      swatchBg: "linear-gradient(160deg,#101B26,#1E3747)",
      swatchFg: "#8CE0B4",
    },
    {
      index: 3,
      id: "paper",
      isLight: true,
      name: { zh: "素纸笺墨", en: "Warm Paper", de: "Warmes Papier" },
      short: { zh: "素纸", en: "Paper", de: "Papier" },
      swatchBg: "linear-gradient(160deg,#F7F6F2,#ECEAE3)",
      swatchFg: "#2D312E",
    },
    {
      index: 4,
      id: "dusk",
      isLight: false,
      name: { zh: "暮色琥珀", en: "Dusk Amber", de: "Abendbernstein" },
      short: { zh: "暮珀", en: "Dusk", de: "Abend" },
      swatchBg: "linear-gradient(160deg,#1F2333,#4A3628)",
      swatchFg: "#FFD166",
    },
    {
      index: 5,
      id: "moss",
      isLight: false,
      name: { zh: "山岚青苔", en: "Moss Horizon", de: "Mooshorizont" },
      short: { zh: "山岚", en: "Moss", de: "Moos" },
      swatchBg: "linear-gradient(160deg,#9AB4A6,#1B2A23)",
      swatchFg: "#F2F6F3",
    },
    {
      index: 6,
      id: "night",
      isLight: false,
      name: { zh: "星夜回响", en: "Night Sky", de: "Sternennacht" },
      short: { zh: "星夜", en: "Night", de: "Nacht" },
      swatchBg: "linear-gradient(160deg,#11141B,#23293A)",
      swatchFg: "#CBD5E1",
    },
  ];

  // SPEC §1b: Exact 21 classic quotes (7 weekdays × zh/en/de, author + work)
  const SPLASH_QUOTES = [
    {
      weekday: 0,
      zh: { text: "千里之行，始于足下。", source: "老子《道德经·第六十四章》" },
      en: { text: "Write it on your heart that every day is the best day in the year.", source: 'Ralph Waldo Emerson, Society and Solitude ("Works and Days", 1870)' },
      de: { text: "Es ist nicht genug zu wissen, man muss auch anwenden; es ist nicht genug zu wollen, man muss auch tun.", source: "Johann Wolfgang von Goethe, Wilhelm Meisters Wanderjahre (1829)" },
    },
    {
      weekday: 1,
      zh: { text: "不积跬步，无以至千里。", source: "荀子《荀子·劝学》" },
      en: { text: "It is not enough to be busy; so are the ants. The question is: what are we busy about?", source: "Henry David Thoreau, Letter to H. G. O. Blake (1857)" },
      de: { text: "Habe Mut, dich deines eigenen Verstandes zu bedienen!", source: "Immanuel Kant, Beantwortung der Frage: Was ist Aufklärung? (1784)" },
    },
    {
      weekday: 2,
      zh: { text: "知止而后有定，定而后能静。", source: "《礼记·大学》" },
      en: { text: "The unexamined life is not worth living.", source: "Plato, Apology (38a, trans. Benjamin Jowett, 1871)" },
      de: { text: "Nach innen geht der geheimnisvolle Weg.", source: "Novalis, Blüthenstaub (Fragment 16, 1798)" },
    },
    {
      weekday: 3,
      zh: { text: "非淡泊无以明志，非宁静无以致远。", source: "诸葛亮《诫子书》" },
      en: { text: "Look within. Within is the fountain of good, and it will ever bubble up, if thou wilt ever dig.", source: "Marcus Aurelius, Meditations (VII.59, trans. George Long, 1862)" },
      de: { text: "Leben Sie jetzt die Fragen.", source: "Rainer Maria Rilke, Briefe an einen jungen Dichter (4. Brief, 1903)" },
    },
    {
      weekday: 4,
      zh: { text: "吾日三省吾身。", source: "曾子《论语·学而》" },
      en: { text: "While we are postponing, life speeds by.", source: "Seneca, Epistulae Morales ad Lucilium (Letter 1, trans. Richard M. Gummere, 1917)" },
      de: { text: "Nicht was wir erleben, sondern wie wir empfinden, was wir erleben, macht unser Schicksal aus.", source: "Marie von Ebner-Eschenbach, Aphorismen (1880)" },
    },
    {
      weekday: 5,
      zh: { text: "行到水穷处，坐看云起时。", source: "王维《终南别业》" },
      en: { text: "To see a World in a Grain of Sand, and a Heaven in a Wild Flower.", source: "William Blake, Auguries of Innocence (c. 1803)" },
      de: { text: "Dreifach ist der Schritt der Zeit: Zögernd kommt die Zukunft hergezogen, pfeilschnell ist das Jetzt entflogen, ewig still steht die Vergangenheit.", source: "Friedrich Schiller, Sprüche des Konfuzius (1795)" },
    },
    {
      weekday: 6,
      zh: { text: "往者不可谏，来者犹可追。", source: "《论语·微子》" },
      en: { text: "Life can only be understood backwards; but it must be lived forwards.", source: "Søren Kierkegaard, Journals (JJ:167, 1843)" },
      de: { text: "Schön ist eigentlich alles, was man mit Liebe betrachtet.", source: "Christian Morgenstern, Stufen (1918)" },
    },
  ];

  function isLocalHostname(hostname) {
    return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(String(hostname || ""));
  }

  function isAndroidFaceEnabled({ dataset, search, hostname, hasAndroidBridge } = {}) {
    if (dataset?.androidApp === "true") return true;
    if (hasAndroidBridge) return true;
    if (isLocalHostname(hostname)) {
      try {
        if (new URLSearchParams(search || "").get("platform") === "android") return true;
      } catch {}
    }
    return false;
  }

  function resolvePredictiveBackAction({
    splashOpen = false,
    sheetOpen = false,
    splashSettingsOpen = false,
    settingsOpen = false,
    focusOpen = false,
    dialogOpen = false,
    welcomeStep = 0,
    activeView = "today",
  } = {}) {
    if (splashOpen) return { handled: true, action: "close-splash" };
    if (sheetOpen) return { handled: true, action: "close-sheet" };
    if (splashSettingsOpen) return { handled: true, action: "close-splash-settings" };
    if (settingsOpen) return { handled: true, action: "close-settings" };
    if (focusOpen) return { handled: true, action: "close-focus" };
    if (dialogOpen) return { handled: true, action: "close-dialog" };
    if (welcomeStep === 2) return { handled: true, action: "welcome-prev" };
    if (activeView === "week" || activeView === "review" || activeView === "longrange") {
      return { handled: true, action: "to-timeline", targetView: "timeline" };
    }
    if (activeView !== "today") {
      return { handled: true, action: "to-today", targetView: "today" };
    }
    return { handled: false, action: "exit-app" };
  }

  function weekdayIndexFromIso(dateIso) {
    const dt = parseIsoDate(dateIso);
    return (dt.getDay() + 6) % 7; // 0=Mon .. 6=Sun
  }

  function dayNumberFromIso(dateIso) {
    const dt = parseIsoDate(dateIso);
    return Math.floor(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()) / 86400000);
  }

  function resolveAndroidLanguage({ stored = null, explicit = null, requested = null, languages = [] } = {}) {
    if (explicit !== "false" && ["en", "de", "zh"].includes(stored)) return stored;
    if (["en", "de", "zh"].includes(requested)) return requested;
    return languages.map(tag => /^(zh|de)(?:-|$)/i.exec(String(tag))?.[1]?.toLowerCase()).find(Boolean) || "en";
  }

  function shouldShowSplashOnLaunch({ frequency = "daily", lastShownDate = "", todayIso = "" } = {}) {
    const freq = frequency === "off" || frequency === "always" || frequency === "daily" ? frequency : "daily";
    if (freq === "off") return false;
    if (freq === "always") return true;
    return String(lastShownDate || "") !== String(todayIso || "");
  }

  function resolveSplashStyleAndQuote({ dateIso = "", weekdayOverride = null, lang = "zh", quoteSettings = null } = {}) {
    const language = lang === "zh" || lang === "de" ? lang : "en";
    const weekday =
      Number.isInteger(weekdayOverride) && weekdayOverride >= 0 && weekdayOverride <= 6
        ? weekdayOverride
        : weekdayIndexFromIso(dateIso);
    const style = SPLASH_WEEKDAY_STYLES[weekday] || SPLASH_WEEKDAY_STYLES[0];
    const row = SPLASH_QUOTES[weekday] || SPLASH_QUOTES[0];
    const builtIn = row[language] || row.en;
    const mode = quoteSettings?.mode === "custom" || quoteSettings?.mode === "mixed" ? quoteSettings.mode : "auto";
    const customItems = Array.isArray(quoteSettings?.items)
      ? quoteSettings.items.filter(it => it && String(it.text || "").trim())
      : [];

    let quote = { text: builtIn.text, source: builtIn.source };
    let fromCustom = false;
    if (weekdayOverride == null && customItems.length > 0) {
      const dayNum = Math.abs(dayNumberFromIso(dateIso));
      if (mode === "custom") {
        const picked = customItems[dayNum % customItems.length];
        quote = { text: String(picked.text || "").trim(), source: String(picked.source || "").trim() };
        fromCustom = true;
      } else if (mode === "mixed" && dayNum % 2 === 1) {
        const picked = customItems[Math.floor(dayNum / 2) % customItems.length];
        quote = { text: String(picked.text || "").trim(), source: String(picked.source || "").trim() };
        fromCustom = true;
      }
    }

    return {
      weekday,
      style,
      quote,
      fromCustom,
      mode,
    };
  }

  function shouldPlaySplashAudio({ musicEnabled = false, hasAudio = false, ringerSilent = true, forceSilent = false } = {}) {
    if (!musicEnabled || !hasAudio) return false;
    if (forceSilent === true) return false;
    // Fail-closed: only play when ringerSilent is explicitly false
    return ringerSilent === false;
  }

  function isSplashMediaBackupEntry(photoMeta) {
    const d = String(photoMeta?.date || "");
    return d === SPLASH_MEDIA_IMAGE_DATE || d === SPLASH_MEDIA_AUDIO_DATE;
  }

  function buildSplashMediaBackupEntry(record, url = "") {
    if (!record || !record.id) return null;
    const isAudio = record.kind === "audio";
    return {
      id: record.id,
      backupId: record.id,
      date: isAudio ? SPLASH_MEDIA_AUDIO_DATE : SPLASH_MEDIA_IMAGE_DATE,
      url,
      contentType: record.contentType || (isAudio ? "audio/mpeg" : "image/jpeg"),
      width: Number(record.width) || 0,
      height: Number(record.height) || 0,
      createdAt: Number(record.createdAt) || 0,
    };
  }

  function sortAndroidHabits(habits, completedIds) {
    const list = Array.isArray(habits) ? habits : [];
    const doneOrder = Array.isArray(completedIds) ? completedIds : [];
    const doneSet = new Set(doneOrder);
    const byId = new Map(list.map(h => [h.id, h]));
    const remaining = list.filter(h => !doneSet.has(h.id));
    const finished = doneOrder.map(id => byId.get(id)).filter(Boolean);
    const seen = new Set([...remaining, ...finished].map(h => h.id));
    const extra = list.filter(h => !seen.has(h.id));
    return [...remaining, ...finished, ...extra];
  }

  function shouldShowBackToToday(selectedDate, todayIso) {
    return Boolean(selectedDate && todayIso && String(selectedDate) !== String(todayIso));
  }

  function isAndroidDateReadOnly(selectedDate, todayIso) {
    return Boolean(selectedDate && todayIso && String(selectedDate) > String(todayIso));
  }

  function parseIsoDate(iso) {
    const [y, m, d] = String(iso || "").split("-").map(Number);
    if (y && m && d) return new Date(y, m - 1, d, 12, 0, 0, 0);
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  }

  function toIsoDate(dt) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function shiftIsoDate(iso, days) {
    const dt = parseIsoDate(iso);
    dt.setDate(dt.getDate() + days);
    return toIsoDate(dt);
  }

  function buildWeekDays(selectedDate, todayIso) {
    const sel = parseIsoDate(selectedDate || todayIso);
    const monOffset = (sel.getDay() + 6) % 7;
    const monday = new Date(sel);
    monday.setDate(sel.getDate() - monOffset);
    const days = [];
    for (let i = 0; i < 7; i += 1) {
      const dt = new Date(monday);
      dt.setDate(monday.getDate() + i);
      const iso = toIsoDate(dt);
      days.push({
        iso,
        dayNum: dt.getDate(),
        weekdayIndex: i, // 0=Mon .. 6=Sun
        isSelected: iso === selectedDate,
        isToday: iso === todayIso,
        isFuture: isAndroidDateReadOnly(iso, todayIso),
      });
    }
    return days;
  }

  function resolveAndroidTodayCards(savedIds) {
    if (!Array.isArray(savedIds)) return [...DEFAULT_TODAY_CARDS];
    const valid = [];
    const seen = new Set();
    for (const id of savedIds) {
      if (ALL_TODAY_CARDS.includes(id) && !seen.has(id)) {
        seen.add(id);
        valid.push(id);
      }
    }
    return valid;
  }

  function buildWeatherCurveModel(hours, cityNowStr, isToday) {
    const list = Array.isArray(hours) ? hours.filter(h => h && Number.isFinite(h.temperature)) : [];
    if (list.length < 2) return null;
    const left = 10;
    const right = 206;
    const top = 16;
    const bottom = 44;
    const baseY = 51;
    const temps = list.map(h => h.temperature);
    const minT = Math.min(...temps);
    const maxT = Math.max(...temps);
    const span = maxT - minT;
    const count = list.length - 1;
    const pts = list.map((h, i) => {
      const x = left + (i / count) * (right - left);
      const y = span < 0.01 ? (top + bottom) / 2 : bottom - ((h.temperature - minT) / span) * (bottom - top);
      return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, temp: h.temperature, i };
    });

    let linePath = `M${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i += 1) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cx = Math.round(((prev.x + curr.x) / 2) * 10) / 10;
      linePath += ` C${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    const areaPath = `${linePath} L${pts[pts.length - 1].x} ${baseY} L${pts[0].x} ${baseY} Z`;

    let maxPt = pts[0];
    let minPt = pts[0];
    for (const p of pts) {
      if (p.temp > maxPt.temp) maxPt = p;
      if (p.temp < minPt.temp) minPt = p;
    }

    let nowX = null;
    let nowY = null;
    if (isToday && cityNowStr && cityNowStr.length >= 16) {
      const hh = Number(cityNowStr.slice(11, 13));
      const mm = Number(cityNowStr.slice(14, 16));
      if (Number.isFinite(hh) && Number.isFinite(mm)) {
        const hourFloat = Math.max(0, Math.min(count, hh + mm / 60));
        nowX = Math.round((left + (hourFloat / count) * (right - left)) * 10) / 10;
        const lo = Math.floor(hourFloat);
        const hi = Math.min(count, lo + 1);
        const frac = hourFloat - lo;
        nowY = Math.round((pts[lo].y + (pts[hi].y - pts[lo].y) * frac) * 10) / 10;
      }
    }

    return {
      linePath,
      areaPath,
      baseY,
      maxPt: { x: Math.min(198, Math.max(18, maxPt.x)), y: Math.max(11, maxPt.y - 5), label: `${Math.round(maxPt.temp)}°` },
      minPt: { x: Math.min(198, Math.max(18, minPt.x)), y: Math.max(11, minPt.y - 4), label: `${Math.round(minPt.temp)}°`, show: Math.abs(maxPt.x - minPt.x) > 28 && span >= 1 },
      nowX,
      nowY,
      ticks: [
        { x: 12, label: "00" },
        { x: 59, label: "06" },
        { x: 108, label: "12" },
        { x: 157, label: "18" },
        { x: 204, label: "24" },
      ],
    };
  }

  function localeDecimalSeparator(language = "zh") {
    return String(language || "").toLowerCase().startsWith("de") ? "," : ".";
  }

  function parseSingleKeypadTermMinor(rawToken, parseMoneyInput) {
    const clean = String(rawToken || "").trim();
    if (!clean) return null;
    if (typeof parseMoneyInput === "function") {
      const fromCore = parseMoneyInput(clean);
      if (fromCore != null) return fromCore;
      // Allow zero token like "0" or "0.00" during expression evaluation
      if (/^0([.,]0{1,2})?$/.test(clean)) return 0;
      return null;
    }
    let s = clean.replace(/[\s€$¥]/g, "");
    if (!/^\d[\d.,]*$/.test(s)) return null;
    const lastSep = Math.max(s.lastIndexOf(","), s.lastIndexOf("."));
    if (lastSep >= 0 && s.length - lastSep - 1 <= 2) {
      s = `${s.slice(0, lastSep).replace(/[.,]/g, "")}.${s.slice(lastSep + 1)}`;
    } else {
      s = s.replace(/[.,]/g, "");
    }
    const v = Math.round(Number(s) * 100);
    return Number.isFinite(v) && v >= 0 ? v : null;
  }

  function evaluateKeypadExpression(expr, language = "zh", parseMoneyInput = null) {
    const sep = localeDecimalSeparator(language);
    const normalized = String(expr || "")
      .replace(/−/g, "-")
      .replace(/\s+/g, "")
      .trim();
    if (!normalized) {
      return { ok: false, amountMinor: 0, hasOperator: false, formattedDisplay: `0${sep}00`, previewText: "" };
    }
    const tokens = [];
    let sign = 1;
    let buf = "";
    let hasOperator = false;
    for (let i = 0; i < normalized.length; i += 1) {
      const ch = normalized[i];
      if ((ch === "+" || ch === "-") && i > 0) {
        hasOperator = true;
        if (buf) tokens.push({ sign, raw: buf });
        buf = "";
        sign = ch === "-" ? -1 : 1;
      } else if (ch === "+" && i === 0) {
        sign = 1;
      } else if (ch === "-" && i === 0) {
        sign = -1;
      } else {
        buf += ch;
      }
    }
    if (buf) tokens.push({ sign, raw: buf });
    if (!tokens.length) {
      return { ok: false, amountMinor: 0, hasOperator, formattedDisplay: `0${sep}00`, previewText: "" };
    }
    let totalMinor = 0;
    const previewParts = [];
    for (let idx = 0; idx < tokens.length; idx += 1) {
      const tk = tokens[idx];
      // Tolerate trailing decimal while typing e.g. "12." -> "12"
      const candidate = /[.,]$/.test(tk.raw) ? tk.raw.slice(0, -1) : tk.raw;
      const minor = parseSingleKeypadTermMinor(candidate, parseMoneyInput);
      if (minor == null) {
        return { ok: false, amountMinor: 0, hasOperator, formattedDisplay: normalized, previewText: "" };
      }
      totalMinor += tk.sign * minor;
      const shown = tk.raw.replace(/[.,]/g, sep);
      if (idx === 0) previewParts.push(tk.sign < 0 ? `−${shown}` : shown);
      else previewParts.push(`${tk.sign < 0 ? "−" : "+"} ${shown}`);
    }
    const ok = totalMinor > 0;
    const absMinor = Math.max(0, totalMinor);
    const majorStr = (absMinor / 100).toFixed(2).replace(".", sep);
    return {
      ok,
      amountMinor: totalMinor,
      hasOperator,
      formattedDisplay: majorStr,
      previewText: hasOperator ? previewParts.join(" ") : "",
    };
  }

  // Expose pure helpers even when Android face is inactive (zero side effects on Web/macOS).
  window.LifeLedgerAndroidFaceHelpers = {
    isLocalHostname,
    isAndroidFaceEnabled,
    resolvePredictiveBackAction,
    sortAndroidHabits,
    shouldShowBackToToday,
    isAndroidDateReadOnly,
    shiftIsoDate,
    buildWeekDays,
    resolveAndroidTodayCards,
    buildWeatherCurveModel,
    localeDecimalSeparator,
    evaluateKeypadExpression,
    SPLASH_WEEKDAY_STYLES,
    SPLASH_QUOTES,
    SPLASH_MEDIA_IMAGE_DATE,
    SPLASH_MEDIA_AUDIO_DATE,
    SPLASH_MEDIA_MAX_BYTES,
    weekdayIndexFromIso,
    shouldShowSplashOnLaunch,
    resolveAndroidLanguage,
    resolveSplashStyleAndQuote,
    shouldPlaySplashAudio,
    isSplashMediaBackupEntry,
    buildSplashMediaBackupEntry,
  };

  if (
    !isAndroidFaceEnabled({
      dataset: document.documentElement.dataset,
      search: location.search,
      hostname: location.hostname,
      hasAndroidBridge: Boolean(window.LifeLedgerAndroidBackup),
    })
  ) {
    return;
  }

  document.documentElement.dataset.androidApp = "true";

  const COPY = {
    zh: {
      tabs: { today: "今日", ledger: "记账", timeline: "时间轴", habits: "习惯" },
      subtabs: { timeline: "日度", week: "本周", review: "月度", longrange: "长期" },
      titles: { today: "今日", ledger: "记账", timeline: "时间轴", week: "时间轴", review: "时间轴", longrange: "时间轴", habits: "习惯" },
      weekdays: ["一", "二", "三", "四", "五", "六", "日"],
      backToday: "回到今天",
      cardLibAria: "卡片库",
      fabAria: "快速记录",
      settingsAria: "设置",
      demoTitle: "示例模式 · 3 个月体验数据",
      demoSub: "独立存储自由滑动，永不写入你的真实数据",
      demoExit: "结束观看",
      futureNotice: "未来日期仅可预览，不可提前记录",
      today: {
        moodTitle: "今天整体感觉如何？",
        moodTitlePast: "这一天整体感觉如何？",
        moods: { 很好: "很好", 平静: "平静", 低落: "低落" },
        notePrefix: "随记 · ",
        habitsTitle: "今日习惯",
        habitsTitlePast: "当日习惯",
        habitsDone: (d, n) => `已完成 ${d} / ${n}`,
        habitsEmpty: "还没有今日习惯",
        focusTitle: "专注",
        focusUnit: "分钟",
        focusEmptySub: "点此开启沉浸专注",
        spendTitle: "今日支出",
        spendTitlePast: "当日支出",
        spendCount: n => (n ? `${n} 笔` : "0 笔"),
        weatherCityDemo: "柏林",
        weatherCondDemoLight: "多云",
        weatherCondDemoDark: "微云",
        weatherRangeDemoLight: "↑11° · ↓4° · 降水 10%",
        weatherRangeDemoDark: "↑11° · ↓4° · 夜间清凉",
        weatherSlotCity: "北京",
        weatherSlotSub: "实时天气",
        weatherSlotRange: "点击选择城市",
        weatherOfflineBadge: "缓存",
        weatherOfflineSub: "离线 · 联网后更新",
        weatherPrecip: p => `降水 ${p}%`,
        weatherSettingsGroup: "今日与天气",
        weatherSettingsTitle: "实时天气城市",
        weatherSettingsHint: "按需联网 · 断网自动展示缓存",
        weatherSheetTitle: "实时天气城市",
        weatherSheetSub: "城市实时气温、当地时间与 00–24 时温度曲线，无网时优雅使用本地缓存。",
        weatherSearchPlaceholder: "搜索城市（如 柏林、上海、东京）",
        weatherSearchBtn: "搜索",
        weatherQuickTitle: "常用城市",
        weatherNoResults: "未找到匹配城市",
        weatherOfflineSearch: "当前离线，可直接点选下方常用城市，联网后自动刷新。",
        weatherRefresh: "刷新天气",
        weatherCredit: "数据来源：Open-Meteo · CC BY 4.0",
        wallEmptyTitle: "放一张喜欢的照片",
        wallEmptySub: "轻点添加并调节显示焦点",
        wallLightboxFocus: "调焦点",
        wallLightboxAdd: "更换照片",
        wallLightboxClose: "关闭",
        rhythmTitle: "近期节律",
        rhythmSub: "近 7 日基础习惯完成率",
      },
      cardLib: {
        title: "今日卡片库",
        sub: "按需开启或调整顺序，新增卡片仅从此处添加",
        added: "已显示",
        add: "添加",
        remove: "隐藏",
        done: "完成",
        names: {
          quote: "每日一句",
          weather: "实时天气",
          mood: "心情记录",
          habits: "今日习惯",
          focusSpend: "专注与支出",
          wall: "照片墙",
          rhythm: "近期节律",
        },
        descs: {
          quote: "与名言设置同源的单行每日一句",
          weather: "城市实时气温与 00–24 时温度曲线",
          mood: "三态心情与当日随记",
          habits: "横向滑动打卡，完成后平滑移至队尾",
          focusSpend: "整卡直达专注计时与今日支出 7 日小柱",
          wall: "全出血 6px 细框照片墙，支持焦点调节",
          rhythm: "近 7 天习惯完成率柱状概览（可选）",
        },
      },
      photoSheet: {
        title: "照片墙与焦点调节",
        hint: "轻点或拖动照片，选择卡片内展示的画面焦点",
        addPhoto: "从本机选择照片",
        removePhoto: "移除当前照片",
        demoNote: "示例模式调整仅作临时预览，不影响你的本机照片",
        done: "完成",
      },
      welcome: {
        skip: "跳过",
        backAria: "返回",
        pill1: "心情 · 3 秒速记",
        pill2: "习惯 · 一点即达",
        kicker1: "Android 1.0 · 本地随身版",
        title1: "记录当下，理解过去",
        tagline1: "Understand your past. Shape your future.",
        feat1t: "单手 3 秒速记",
        feat1s: "底栏中央一键记下心情、习惯与此刻随记",
        feat2t: "随手记一笔日常开销",
        feat2s: "计算器键盘与本地自动分类，账目清晰直观",
        feat3t: "手机轻记录，Mac 深复盘",
        feat3s: "全端共享同一数据格式，随时导出备份接力回看",
        next: "继续",
        lock: "本机存储 · 无需注册登录",
        kicker2: "本地存储版承诺",
        title2: "你的记录，只留在手机里",
        lead2: "个人日记、习惯与账目仅保存于本机，断网照常记录；可按需开启实时天气，随时导出备份带回 Mac。",
        p1t: "直接进入你自己的干净首页",
        p1s: "绝不混入虚拟示例数据；想先逛逛可随时点下方「看看示例」",
        p2t: "按需联网天气，无云端账号与 AI 上传",
        p2s: "实时天气自由设城市，断网自动展示缓存，隐私完全由你掌控",
        p3t: "一键导出 JSON 与媒体包 (.llmedia)",
        p3s: "经 Android 系统文件选择器备份，与 Mac / Web 端无缝互通",
        start: "开始使用",
        sample: "看看示例",
        importBackup: "导入备份",
      },
      emptyToday: {
        title: "空白的一天，刚刚开始",
        desc: "所有记录只保存在这台手机里。轻点下方按钮，用 3 秒记下今天的第一刻。",
        cta: "记下今天的第一刻",
        sample: "先看看 3 个月示例",
      },
      sheet: {
        title: "快速记录",
        todayPrefix: "今天",
        segMood: "心情与习惯",
        segMoney: "记一笔 €",
        segFocus: "专注计时",
        step1: "1. 此刻感觉如何？",
        step2: "2. 顺手打卡习惯",
        step3: "3. 写一句此刻（选填）",
        selectedPrefix: "已选",
        notSelected: "未选择",
        doneCount: (d, t) => `今日已完成 ${d} / ${t}`,
        moods: { 很好: "很好", 平静: "平静", 低落: "低落" },
        notePlaceholder: "记下一件小事、想法或今天的状态…",
        photoAttach: "照片墙 · 调焦点",
        photoAdd: "添加本机照片",
        chars: n => `${n} 字`,
        save: "完成记录",
        moneyBridgeTitle: "快速记一笔开销或收入",
        moneyBridgeDesc: "前往「记账」页录入交易、查看分类占比与当月结余。",
        moneyBridgeCta: "打开记账页",
        focusBridgeTitle: "开启一段沉浸专注",
        focusBridgeDesc: "开启专注倒计时，只统计今日累计专注分钟与主题分布。",
        focusBridgeCta: "打开专注计时",
      },
      undo: "撤销",
      money: {
        balanceLabel: c => `本月结余 · ${c}`,
        addBtn: "+ 记一笔",
        income: "本月收入",
        expense: "本月支出",
        budgetLabel: a => `月度支出预算 ${a}`,
        budgetUsed: (pct, left) => `已用 ${pct}% · 剩 ${left}`,
        budgetOver: pct => `已用 ${pct}% · 超出预算`,
        breakdownTitle: "支出分类占比",
        breakdownHint: "点分类下钻明细",
        clearFilter: "清除筛选",
        todayLabel: "今天",
        yesterdayLabel: "昨天",
        dayExpense: a => `支出 −${a}`,
        billFlow: "账单流水",
        subReadOnly: "订阅 · 只读",
        deleteLabel: "删除",
        deletedUndo: "已删除这笔记录",
        emptyTitle: "本月还没有记账记录",
        emptyDesc: "用 4×4 计算器键盘 5 秒记一笔，或从银行账单导入本月流水。",
        emptyCta: "记下本月第一笔",
        moreTitle: "记账工具",
        bankImport: "导入银行账单 (CSV / PDF)",
        bankImportSub: "核对储蓄卡或信用卡账单并自动归类",
        subDetailTitle: "固定订阅 · 只读",
        subDetailNote: "该条目来自银行账单或固定周期扣款，手机端仅支持查看详情，不提供修改或删除。",
        subFieldAmount: "金额",
        subFieldDate: "日期",
        subFieldCategory: "分类",
        subFieldSource: "来源",
        subSourceImport: "银行账单导入",
        subSourceRecurring: "固定订阅扣款",
      },
      keypad: {
        expense: "支出",
        income: "收入",
        exprPrefix: "算式 ",
        autoCat: "自动归类",
        manualCat: "分类",
        notePlaceholder: "备注（例如：手冲咖啡、超市采购…）",
        noteLabel: "备注",
        save: "记一笔",
        hint: "支持 + / − 实时算式 · 小数点随语言切换（中/英 . · 德语 ,）",
      },
      history: {
        goodShort: "好",
        calmShort: "平",
        lowShort: "低",
        dailyRecorded: (m, n) => `日度记录 · ${m}月已记录 ${n} 天`,
        pureMoodFiltered: "已过滤纯心情日",
        dailyEmpty: "本月暂无带文字随记的记录（纯心情日已自动过滤）。",
        statHabit: (d, t) => `习惯 ${d}/${t}`,
        statFocus: m => `专注 ${m} 分钟`,
        statSpend: a => `支出 ${a}`,
        weekTitle: "本周",
        weekRhythm: "本周节律",
        weekNum: (n, cur) => `第 ${n} 周${cur ? " · 进行中" : ""}`,
        weekHabitRate: "习惯完成率",
        weekTimes: (d, t) => `${d} / ${t} 次`,
        weekFocus: "累计专注",
        weekFocusDelta: m => (m === 0 ? "与上周持平" : `较上周 ${m > 0 ? "+" : ""}${(m / 60).toFixed(1)} h`),
        weekMood: "本周心情",
        weekMoodSummary: (g, c) => `${g}好 ${c}平`,
        weekMoodLow: l => `低落 ${l} 天`,
        weekGoals: "本周目标",
        goalsDone: (d, t) => `已完成 ${d} / ${t}`,
        addGoalPlaceholder: "加一个本周要推进的小目标…",
        addGoalBtn: "添加",
        goalDeletedUndo: "已移除本周目标",
        weekReviewTitle: "本周复盘",
        weekReviewAction: "继续写",
        weekReviewPlaceholder: "这周什么节奏最顺手？下周想微调什么？",
        savedLocal: "已保存至本机",
        monthUnwrittenTitle: m => `${m}月月度复盘 · 尚未撰写`,
        monthUnwrittenSub: "未手写保持留白，绝不自动拼凑周复盘",
        goWrite: "去撰写 →",
        monthOverview: "本月概览",
        monthHabitRate: "习惯完成率",
        monthFocusTotal: "累计专注",
        monthSpend: "本月支出",
        monthHabitsTitle: "本月习惯表现",
        monthReviewTitle: m => `${m}月月度复盘`,
        monthReviewEmpty: m => `${m}月复盘尚未开始，留白等你亲手写下`,
        monthReviewPlaceholder: "这个月哪些变化值得保留？下个月最想调整什么？",
        horizonPhaseKicker: "当前阶段",
        horizonNoPhase: "暂未设定长期阶段，复杂规划可在 Mac 端整理。",
        horizonPlansTitle: "长期方向与步骤",
        horizonEmpty: "还没有长期计划，在 Mac 端建立阶段与方向后会同步呈现在这里。",
      },
      habits: {
        addBtn: "+ 新增习惯",
        filterAll: n => `全部 ${n}`,
        filterDaily: n => `每日 ${n}`,
        filterPeriodic: n => `周期 ${n}`,
        filterPaused: n => `已暂停 ${n}`,
        reminderTitle: "每日复盘与打卡提醒",
        reminderOn: time => `${time} 开启 ›`,
        reminderOff: "未开启 ›",
        dailyMeta: (streak, detail) => `每日 · 连续 ${streak} 天 · ${detail}`,
        checklist: "清单打卡",
        periodicMeta: (period, target, done) => `周期 · ${period} ${target} 次 · 本周 ${done} / ${target} 次`,
        perWeek: "每周",
        perMonth: "每月",
        ago14: "14 天前",
        doneToday: "今日已完成",
        todoToday: "今日待打卡",
        monthDist: m => `${m}月频次分布`,
        monthProgress: (d, t) => `本月已完 ${d} / ${t} 次`,
        pause: "暂停",
        resume: "恢复",
        pausedUndo: name => `已暂停「${name}」`,
        resumedUndo: name => `已恢复「${name}」`,
        footerHint: "修改规则可设为「从今天生效」，不改历史",
        emptyTitle: "还没有设置习惯",
        emptyDesc: "从 1–3 个最轻的小习惯开始，慢慢养出自己的节奏。",
        emptyCta: "添加第一个习惯",
      },
      focus: {
        runningBadge: m => `专注进行中 · 已计入 ${m} 分钟`,
        pausedBadge: "专注已暂停",
        readyBadge: "准备开启专注",
        breakBadge: "休息中 · 不计入专注统计",
        remainingSub: m => `剩余时间 · ${m} 分钟段`,
        readySub: m => `计划时长 · ${m} 分钟`,
        plus5: "+5 分钟",
        start: "开始专注",
        pause: "暂停",
        resume: "继续",
        end: "结束",
        startBreak: "开始休息",
        skipBreak: "跳过休息",
        todayTotal: "今日累计专注时长",
        unitMin: "分钟",
        breakNote: "休息时长不计入专注统计",
        topicsNote: "主题在「设置」中维护",
        defaultTopic: "深度工作",
        presetTopics: ["深度工作", "德语 B2", "阅读", "个人写作"],
        chooseTopic: "选择专注主题",
        customTopicPlaceholder: "或输入新主题…",
        capsuleAria: "返回专注计时",
      },
      splash: {
        settingsTitle: "开机名言与每日一句",
        previewBtn: "预览",
        masterTitle: "冷启动展示开机名言画面",
        masterDesc: "停留约 2.5 秒，轻触任意处立即进入今日页；遵循系统「减弱动态效果」。",
        freqOff: "关闭",
        freqDaily: "每天首次",
        freqAlways: "每次打开",
        stylesTitle: "内置 7 日场景风格（周一至周日）",
        stylesBadge: "21 条三语经典",
        todayBadge: "今日生效",
        previewDayBadge: "风格预览",
        syncSourceNote: "与今日页名言条同源",
        tapHint: "轻触任意处进入",
        todayTag: "今日",
        weekdaysFull: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
        quoteLibLabel: "名言库（复用共享 quoteSettings）",
        modeAuto: "内置 7 日",
        modeCustom: "自定义",
        modeMixed: "混合轮换",
        manageCustomTitle: "管理我的自定义名言",
        manageCustomSub: "与 Mac / Web 端共享同一名言配置",
        customCount: n => (n ? `已添 ${n} 条` : "去添加"),
        customSheetTitle: "自定义名言",
        customSheetSub: "每行一条，出处写在 —— 后面，直接保存至共享 quoteSettings。",
        customPlaceholder: "例如：\n慎终如始，则无败事。——《道德经》",
        save: "保存",
        mediaSectionLabel: "自定义场景图与音乐（本机存储）",
        customImgTitle: "自定义背景图片",
        customImgSub: "保存于本机并随 .llmedia 备份导出",
        imgCount: n => (n ? `${n} 张` : "未添加"),
        addImg: "添加图片",
        useBuiltInBg: "内置风格",
        musicTitle: "启动背景音乐",
        musicSub: "默认关闭 · 可选本机 MP3 / M4A",
        musicPick: "选择音频",
        musicRemove: "移除音频",
        musicTooLarge: "音频文件请控制在 1.2 MB 以内，以便随 .llmedia 完整备份。",
        musicReady: name => `已选：${name}`,
        silentNote: "手机处于静音或振动模式时绝不发声；音频仅存本机并纳入 .llmedia 备份。",
        footerNote: "自定义图片与音频不上传云端，通过 SAF 随 .llmedia 备份一并迁移",
        demoMediaNote: "示例模式下不改动你的本机图片与音频",
        statusChipOff: "已关闭",
        statusChipDaily: "每日首次 · 7日风格",
        statusChipAlways: "每次打开 · 7日风格",
      },
      settings: {
        title: "设置与本地备份",
        backupPill: "本机存储 · 随时导出",
        backupTitle: "数据完全归你所有",
        backupMeta: (lastStr, days, sizeStr) => `${lastStr} · ${days} 天 · ${sizeStr}`,
        lastBackupNever: "尚未备份",
        lastBackupOn: d => `上次备份：${d}`,
        exportBtn: "导出 .json / .llmedia",
        importBtn: "从备份恢复",
        syncNote: "所有文件保存于本机 · 云同步将在后续版本推出",
        secAppear: "外观与体验",
        theme: "外观主题",
        themeVals: { system: "跟随系统", light: "浅色", dark: "深色" },
        language: "界面语言",
        languageVal: "简体中文 / EN / DE",
        splash: "开机名言与每日一句",
        display: "字号与动效",
        fontNormal: "标准",
        fontLarge: "大字号",
        motionFull: "完整动效",
        motionReduced: "减弱动效",
        secModules: "今日与模块设置",
        weatherCity: "实时天气城市",
        cardLib: "今日卡片库",
        cardLibVal: n => `已启用 ${n} 张`,
        focusTopics: "专注主题分类",
        focusTopicsVal: n => `${n} 个主题`,
        currencyBill: "记账币种与账单",
        currencyVal: (cur, multi) => `${cur} · ${multi ? "按笔选币开" : "单币种"}`,
        reminder: "每日本地提醒",
        reminderOff: "未开启",
        enterDemo: "进入示例模式",
        enterDemoVal: "3 个月独立预览",
        exitDemo: "退出示例模式",
        exitDemoVal: "回到我的数据",
        clearLocal: "清空本机数据",
        verLine1: "Life Ledger Android 1.0 (android-v1.0.0) · 本地存储版 · Schema v3",
        verLine2: "通过 Android SAF 与 Mac 端互通 JSON 与流式 .llmedia 备份",
        exportSheetTitle: "导出本机备份",
        exportSheetSub: "通过 Android SAF 自由选择保存位置，可直接发往 Mac 或 Web 端恢复。",
        exportJsonTitle: "导出 JSON 数据备份（.json）",
        exportJsonDesc: "含全部心情、习惯、复盘、专注、记账与自定义名言（Schema v3）",
        exportMediaTitle: "导出完整媒体包（.llmedia）",
        exportMediaDesc: "流式打包数据、本地照片与自定义开机名言图片/音频（无 160 MiB 上限）",
        exportDone: name => `已导出备份：${name}`,
        exportFailed: "导出失败，请重试",
        importSheetTitle: "从备份恢复",
        importSheetSub: "支持 Android SAF 选择 .json 或 .llmedia 备份文件；高于当前版本的备份会被安全拦截。",
        pickBackupBtn: "选择备份文件（.json / .llmedia）",
        confirmRestoreBtn: "确认恢复到本机",
        restoreDone: "已从备份恢复本机数据",
        restoreUnsupported: "该备份来自更新版本（Schema > 3），请先更新客户端，现有数据未被改动。",
        restoreInvalid: "无法解析该备份文件，现有本机数据保持完好。",
        mediaItemsCount: n => `含 ${n} 项本地媒体附件`,
        displaySheetTitle: "字号与动效",
        fontLabel: "界面字号",
        motionLabel: "界面动效",
        topicsSheetTitle: "专注主题分类",
        topicsSheetSub: "专注计时页可直接切换以下主题；休息时长始终不计入专注统计。",
        topicsPlaceholder: "添加新主题（如 德语 B2）",
        topicsAdd: "添加",
        reminderSheetTitle: "每日本地提醒",
        reminderEnable: "开启每日复盘提醒",
        reminderTimeLabel: "提醒时间",
        reminderSaved: "提醒设置已保存",
        clearTitle: "清空本机数据？",
        clearDesc: "此操作将永久删除这台手机上的全部记录、本地照片以及自定义开机名言媒体（外观与语言设置保留），且无法撤销。建议先导出 .json / .llmedia 备份。",
        clearCancel: "取消",
        clearConfirm: "确认清空本机数据",
        multiCurrencyLabel: "允许按笔切换币种",
        bankImportRow: "导入银行账单（CSV / PDF）",
      },
    },
    en: {
      tabs: { today: "Today", ledger: "Money", timeline: "History", habits: "Habits" },
      subtabs: { timeline: "Daily", week: "Week", review: "Month", longrange: "Horizon" },
      titles: { today: "Today", ledger: "Money", timeline: "History", week: "History", review: "History", longrange: "History", habits: "Habits" },
      weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      backToday: "Today",
      cardLibAria: "Card library",
      fabAria: "Quick capture",
      settingsAria: "Settings",
      demoTitle: "Demo mode · 3-month sample",
      demoSub: "Isolated preview — never touches your real data",
      demoExit: "Exit demo",
      futureNotice: "Future date — preview only",
      today: {
        moodTitle: "How did today feel?",
        moodTitlePast: "How did this day feel?",
        moods: { 很好: "Good", 平静: "Calm", 低落: "Low" },
        notePrefix: "Note · ",
        habitsTitle: "Today's habits",
        habitsTitlePast: "Day's habits",
        habitsDone: (d, n) => `${d} / ${n} done`,
        habitsEmpty: "No habits for this day",
        focusTitle: "Focus",
        focusUnit: "min",
        focusEmptySub: "Tap to start a session",
        spendTitle: "Spend",
        spendTitlePast: "Spend",
        spendCount: n => (n ? `${n}×` : "0"),
        weatherCityDemo: "Berlin",
        weatherCondDemoLight: "Cloudy",
        weatherCondDemoDark: "Partly clear",
        weatherRangeDemoLight: "↑11° · ↓4° · 10%",
        weatherRangeDemoDark: "↑11° · ↓4° · Cool night",
        weatherSlotCity: "London",
        weatherSlotSub: "Live weather",
        weatherSlotRange: "Tap to choose city",
        weatherOfflineBadge: "Cached",
        weatherOfflineSub: "Offline · updates online",
        weatherPrecip: p => `Rain ${p}%`,
        weatherSettingsGroup: "Today & weather",
        weatherSettingsTitle: "Live weather city",
        weatherSettingsHint: "On-demand network · cached offline",
        weatherSheetTitle: "Live weather city",
        weatherSheetSub: "Local city time, temperature and 00–24h curve with automatic offline cache fallback.",
        weatherSearchPlaceholder: "Search city (e.g. Berlin, London, Tokyo)",
        weatherSearchBtn: "Search",
        weatherQuickTitle: "Quick cities",
        weatherNoResults: "No matching city found",
        weatherOfflineSearch: "Currently offline — pick a city below and weather updates once back online.",
        weatherRefresh: "Refresh weather",
        weatherCredit: "Source: Open-Meteo · CC BY 4.0",
        wallEmptyTitle: "Add a photo you love",
        wallEmptySub: "Tap to pick and frame its focus point",
        wallLightboxFocus: "Focus point",
        wallLightboxAdd: "Change photo",
        wallLightboxClose: "Close",
        rhythmTitle: "Recent rhythm",
        rhythmSub: "7-day habit completion",
      },
      cardLib: {
        title: "Card library",
        sub: "Toggle cards or change order — new cards are added only here",
        added: "Shown",
        add: "Add",
        remove: "Hide",
        done: "Done",
        names: {
          quote: "Daily quote",
          weather: "Live weather",
          mood: "Mood & note",
          habits: "Today's habits",
          focusSpend: "Focus & spend",
          wall: "Photo wall",
          rhythm: "Recent rhythm",
        },
        descs: {
          quote: "Single-line quote synced with your quote settings",
          weather: "Local city weather & 00–24h temperature curve",
          mood: "Three-state mood picker and daily note",
          habits: "Horizontal rail; completed habits move to the end",
          focusSpend: "Whole-card tap for focus timer and 7-day spend",
          wall: "Full-bleed 6px frame with adjustable focus point",
          rhythm: "Optional 7-day habit rhythm bar card",
        },
      },
      photoSheet: {
        title: "Photo wall & focus point",
        hint: "Tap or drag the preview to set what stays centered in the frame",
        addPhoto: "Choose local photo",
        removePhoto: "Remove photo",
        demoNote: "Demo preview changes stay temporary and never touch your files",
        done: "Done",
      },
      welcome: {
        skip: "Skip",
        backAria: "Back",
        pill1: "Mood · 3s capture",
        pill2: "Habits · 1 tap",
        kicker1: "Android 1.0 · Local Edition",
        title1: "Capture now, understand your past",
        tagline1: "Understand your past. Shape your future.",
        feat1t: "One-hand 3-second capture",
        feat1s: "Log mood, habits and a quick note right from the center button",
        feat2t: "Jot down everyday spending",
        feat2s: "Calculator keypad and local auto-categories keep totals clear",
        feat3t: "Light on phone, deep on Mac",
        feat3s: "One shared data format across devices — export backups anytime",
        next: "Continue",
        lock: "Stored on device · No account needed",
        kicker2: "Local storage promise",
        title2: "Your records stay on this phone",
        lead2: "Journal, habits and expenses live locally and work offline. Turn on weather if you like, and export backups for Mac anytime.",
        p1t: "Start in your own clean home",
        p1s: "Sample data is never mixed in; explore safely via See sample anytime",
        p2t: "On-demand weather, no cloud or AI uploads",
        p2s: "Pick any city with offline cache fallback; your data stays private",
        p3t: "One-tap JSON & media backup (.llmedia)",
        p3s: "Saved via Android system picker, seamlessly compatible with Mac & Web",
        start: "Start using",
        sample: "See sample",
        importBackup: "Import backup",
      },
      emptyToday: {
        title: "A quiet day, ready for you",
        desc: "Everything stays on this phone. Tap below to capture your first moment in seconds.",
        cta: "Capture your first moment",
        sample: "Explore 3-month sample",
      },
      sheet: {
        title: "Quick capture",
        todayPrefix: "Today",
        segMood: "Mood & Habits",
        segMoney: "Expense €",
        segFocus: "Focus",
        step1: "1. How do you feel right now?",
        step2: "2. Check off habits",
        step3: "3. Add a short note (optional)",
        selectedPrefix: "Selected",
        notSelected: "None yet",
        doneCount: (d, t) => `${d} / ${t} done today`,
        moods: { 很好: "Good", 平静: "Calm", 低落: "Low" },
        notePlaceholder: "Capture a thought, moment, or highlight…",
        photoAttach: "Photo wall · focus",
        photoAdd: "Add local photo",
        chars: n => `${n} chars`,
        save: "Save entry",
        moneyBridgeTitle: "Record an expense or income",
        moneyBridgeDesc: "Jump to Money to log a transaction and review your monthly totals.",
        moneyBridgeCta: "Open Money",
        focusBridgeTitle: "Start a focus session",
        focusBridgeDesc: "Start the focus timer — tracking only total focused minutes.",
        focusBridgeCta: "Open Focus",
      },
      undo: "Undo",
      money: {
        balanceLabel: c => `Balance · ${c}`,
        addBtn: "+ Add",
        income: "Income",
        expense: "Expense",
        budgetLabel: a => `Monthly budget ${a}`,
        budgetUsed: (pct, left) => `${pct}% used · ${left} left`,
        budgetOver: pct => `${pct}% used · over budget`,
        breakdownTitle: "Spending by category",
        breakdownHint: "Tap to drill down",
        clearFilter: "Clear filter",
        todayLabel: "Today",
        yesterdayLabel: "Yesterday",
        dayExpense: a => `Spent −${a}`,
        billFlow: "Statement",
        subReadOnly: "Subscription · read-only",
        deleteLabel: "Delete",
        deletedUndo: "Entry removed",
        emptyTitle: "No entries this month",
        emptyDesc: "Log an expense in 5 seconds with the keypad, or import a bank statement.",
        emptyCta: "Add first entry",
        moreTitle: "Money tools",
        bankImport: "Import bank statement (CSV / PDF)",
        bankImportSub: "Reconcile bank or card statements locally",
        subDetailTitle: "Subscription · read-only",
        subDetailNote: "Imported or recurring subscriptions are read-only on phone to keep bank records intact.",
        subFieldAmount: "Amount",
        subFieldDate: "Date",
        subFieldCategory: "Category",
        subFieldSource: "Source",
        subSourceImport: "Bank statement import",
        subSourceRecurring: "Recurring subscription",
      },
      keypad: {
        expense: "Expense",
        income: "Income",
        exprPrefix: "Calc ",
        autoCat: "Auto",
        manualCat: "Category",
        notePlaceholder: "Note (e.g. Coffee, Groceries…)",
        noteLabel: "Note",
        save: "Save",
        hint: "Supports + / − live math · locale decimal (. / ,)",
      },
      history: {
        goodShort: "Good",
        calmShort: "Calm",
        lowShort: "Low",
        dailyRecorded: (m, n) => `Daily · ${n} days in ${m}`,
        pureMoodFiltered: "Mood-only skipped",
        dailyEmpty: "No written entries this month (mood-only days are skipped).",
        statHabit: (d, t) => `Habits ${d}/${t}`,
        statFocus: m => `Focus ${m} min`,
        statSpend: a => `Spend ${a}`,
        weekTitle: "Week",
        weekRhythm: "Weekly rhythm",
        weekNum: (n, cur) => `Week ${n}${cur ? " · Active" : ""}`,
        weekHabitRate: "Habit rate",
        weekTimes: (d, t) => `${d} / ${t}`,
        weekFocus: "Focused",
        weekFocusDelta: m => (m === 0 ? "Same as last wk" : `${m > 0 ? "+" : ""}${(m / 60).toFixed(1)} h vs last`),
        weekMood: "Mood",
        weekMoodSummary: (g, c) => `${g} Good · ${c} Calm`,
        weekMoodLow: l => `${l} Low days`,
        weekGoals: "Weekly goals",
        goalsDone: (d, t) => `${d} / ${t} done`,
        addGoalPlaceholder: "Add a goal for this week…",
        addGoalBtn: "Add",
        goalDeletedUndo: "Weekly goal removed",
        weekReviewTitle: "Weekly review",
        weekReviewAction: "Edit",
        weekReviewPlaceholder: "What worked well this week? What deserves adjustment next week?",
        savedLocal: "Saved locally",
        monthUnwrittenTitle: m => `${m} review · unwritten`,
        monthUnwrittenSub: "Stays blank until written — never assembled from weeks",
        goWrite: "Write →",
        monthOverview: "Monthly overview",
        monthHabitRate: "Habit rate",
        monthFocusTotal: "Focused",
        monthSpend: "Spent",
        monthHabitsTitle: "Habits this month",
        monthReviewTitle: m => `${m} monthly review`,
        monthReviewEmpty: m => `${m} review has not started yet — blank space waiting for you`,
        monthReviewPlaceholder: "What changed this month? What stays and what shifts next month?",
        horizonPhaseKicker: "CURRENT PHASE",
        horizonNoPhase: "No active phase yet — organize long-term phases on Mac.",
        horizonPlansTitle: "Plans & steps",
        horizonEmpty: "No long-term plans yet.",
      },
      habits: {
        addBtn: "+ Add habit",
        filterAll: n => `All ${n}`,
        filterDaily: n => `Daily ${n}`,
        filterPeriodic: n => `Periodic ${n}`,
        filterPaused: n => `Paused ${n}`,
        reminderTitle: "Daily review reminder",
        reminderOn: time => `${time} On ›`,
        reminderOff: "Off ›",
        dailyMeta: (streak, detail) => `Daily · ${streak}d streak · ${detail}`,
        checklist: "Checklist",
        periodicMeta: (period, target, done) => `Periodic · ${target}/${period} · ${done}/${target}`,
        perWeek: "wk",
        perMonth: "mo",
        ago14: "14d ago",
        doneToday: "Done today",
        todoToday: "Due today",
        monthDist: m => `${m} distribution`,
        monthProgress: (d, t) => `${d} / ${t} this month`,
        pause: "Pause",
        resume: "Resume",
        pausedUndo: name => `Paused "${name}"`,
        resumedUndo: name => `Resumed "${name}"`,
        footerHint: "Edits can take effect from today without changing history",
        emptyTitle: "No habits yet",
        emptyDesc: "Start with 1–3 small daily anchors to build your own rhythm.",
        emptyCta: "Add first habit",
      },
      focus: {
        runningBadge: m => `Focusing · ${m} min logged`,
        pausedBadge: "Paused",
        readyBadge: "Ready to focus",
        breakBadge: "Break · not counted in focus",
        remainingSub: m => `Remaining · ${m} min block`,
        readySub: m => `Planned · ${m} min`,
        plus5: "+5 min",
        start: "Start focus",
        pause: "Pause",
        resume: "Resume",
        end: "End",
        startBreak: "Start break",
        skipBreak: "Skip break",
        todayTotal: "Focused today",
        unitMin: "min",
        breakNote: "Break time is not counted",
        topicsNote: "Manage topics in Settings",
        defaultTopic: "Deep work",
        presetTopics: ["Deep work", "German B2", "Reading", "Writing"],
        chooseTopic: "Choose focus topic",
        customTopicPlaceholder: "Or enter a topic…",
        capsuleAria: "Return to focus timer",
      },
      splash: {
        settingsTitle: "Launch quote & daily line",
        previewBtn: "Preview",
        masterTitle: "Show quote splash on launch",
        masterDesc: "Stays ~2.5 s, tap anywhere to continue; honours system reduced motion.",
        freqOff: "Off",
        freqDaily: "First open / day",
        freqAlways: "Every open",
        stylesTitle: "7 weekday scenes (Mon–Sun)",
        stylesBadge: "21 classic quotes",
        todayBadge: "Active today",
        previewDayBadge: "Preview",
        syncSourceNote: "Same quote as Today",
        tapHint: "Tap anywhere to enter",
        todayTag: "Today",
        weekdaysFull: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        quoteLibLabel: "Quote source (shared quoteSettings)",
        modeAuto: "Built-in 7d",
        modeCustom: "Custom",
        modeMixed: "Mixed",
        manageCustomTitle: "Manage my custom quotes",
        manageCustomSub: "Shared with Mac & Web via quoteSettings",
        customCount: n => (n ? `${n} saved` : "Add"),
        customSheetTitle: "Custom quotes",
        customSheetSub: "One per line. Put the source after —. Saved to shared quoteSettings.",
        customPlaceholder: "Example:\nWell begun is half done. — Aristotle",
        save: "Save",
        mediaSectionLabel: "Custom background & music (local only)",
        customImgTitle: "Custom background images",
        customImgSub: "Stored locally & included in .llmedia backup",
        imgCount: n => (n ? `${n} saved` : "None"),
        addImg: "Add image",
        useBuiltInBg: "Built-in",
        musicTitle: "Launch background music",
        musicSub: "Off by default · local MP3 / M4A",
        musicPick: "Pick audio",
        musicRemove: "Remove audio",
        musicTooLarge: "Keep launch audio under 1.2 MB so it stays within .llmedia backup limits.",
        musicReady: name => `Track: ${name}`,
        silentNote: "Never plays in silent, vibrate, or Do Not Disturb mode; stored locally & included in .llmedia backup.",
        footerNote: "Custom images and audio never leave your phone; migrated via SAF .llmedia backup",
        demoMediaNote: "Demo mode does not modify your local splash media",
        statusChipOff: "Off",
        statusChipDaily: "Daily · 7 styles",
        statusChipAlways: "Every open · 7 styles",
      },
      settings: {
        title: "Settings & Backup",
        backupPill: "Local storage · Export anytime",
        backupTitle: "Your data stays yours",
        backupMeta: (lastStr, days, sizeStr) => `${lastStr} · ${days} days · ${sizeStr}`,
        lastBackupNever: "Not backed up yet",
        lastBackupOn: d => `Last backup: ${d}`,
        exportBtn: "Export .json / .llmedia",
        importBtn: "Restore backup",
        syncNote: "All files stay on this device · Cloud sync coming later",
        secAppear: "Appearance & Experience",
        theme: "Appearance",
        themeVals: { system: "System", light: "Light", dark: "Dark" },
        language: "Language",
        languageVal: "English / 中文 / DE",
        splash: "Launch quote & daily line",
        display: "Text & motion",
        fontNormal: "Standard",
        fontLarge: "Large",
        motionFull: "Full motion",
        motionReduced: "Reduced",
        secModules: "Today & Modules",
        weatherCity: "Weather city",
        cardLib: "Today card library",
        cardLibVal: n => `${n} enabled`,
        focusTopics: "Focus topics",
        focusTopicsVal: n => `${n} topics`,
        currencyBill: "Currency & bank import",
        currencyVal: (cur, multi) => `${cur} · ${multi ? "Per-tx on" : "Single"}`,
        reminder: "Daily local reminder",
        reminderOff: "Off",
        enterDemo: "Enter demo mode",
        enterDemoVal: "3-month isolated preview",
        exitDemo: "Exit demo mode",
        exitDemoVal: "Return to your data",
        clearLocal: "Clear local data",
        verLine1: "Life Ledger Android 1.0 (android-v1.0.0) · Local-Storage · Schema v3",
        verLine2: "Compatible with Mac & Web via SAF JSON and streaming .llmedia backups",
        exportSheetTitle: "Export local backup",
        exportSheetSub: "Choose where to save via Android SAF; ready to restore on Mac or Web.",
        exportJsonTitle: "Export JSON backup (.json)",
        exportJsonDesc: "All moods, habits, reviews, focus, ledger & quoteSettings (Schema v3)",
        exportMediaTitle: "Export media bundle (.llmedia)",
        exportMediaDesc: "Streams records, local photos & custom splash images/audio (no 160 MiB cap)",
        exportDone: name => `Backup exported: ${name}`,
        exportFailed: "Export failed. Please try again.",
        importSheetTitle: "Restore from backup",
        importSheetSub: "Pick a .json or .llmedia file via Android SAF; newer schemas are safely blocked.",
        pickBackupBtn: "Choose backup file (.json / .llmedia)",
        confirmRestoreBtn: "Restore to this device",
        restoreDone: "Local data restored from backup",
        restoreUnsupported: "This backup was created by a newer version (Schema > 3). Update the app first; existing data was untouched.",
        restoreInvalid: "Could not read this backup file. Existing data is untouched.",
        mediaItemsCount: n => `Includes ${n} local media item(s)`,
        displaySheetTitle: "Text & motion",
        fontLabel: "Text size",
        motionLabel: "Motion",
        topicsSheetTitle: "Focus topics",
        topicsSheetSub: "Available in the Focus timer; break time is never counted as focus.",
        topicsPlaceholder: "Add a topic (e.g. German B2)",
        topicsAdd: "Add",
        reminderSheetTitle: "Daily local reminder",
        reminderEnable: "Enable daily check-in reminder",
        reminderTimeLabel: "Reminder time",
        reminderSaved: "Reminder saved",
        clearTitle: "Clear all local data?",
        clearDesc: "This permanently removes all records, local photos, and custom launch media on this device (appearance & language stay). Export a backup first if needed.",
        clearCancel: "Cancel",
        clearConfirm: "Clear local data",
        multiCurrencyLabel: "Allow per-transaction currency",
        bankImportRow: "Import bank statement (CSV / PDF)",
      },
    },
    de: {
      tabs: { today: "Heute", ledger: "Geld", timeline: "Verlauf", habits: "Routine" },
      subtabs: { timeline: "Tag", week: "Woche", review: "Monat", longrange: "Langfrist" },
      titles: { today: "Heute", ledger: "Geld", timeline: "Verlauf", week: "Verlauf", review: "Verlauf", longrange: "Verlauf", habits: "Routine" },
      weekdays: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
      backToday: "Heute",
      cardLibAria: "Kartenbibliothek",
      fabAria: "Schnelleintrag",
      settingsAria: "Einstellungen",
      demoTitle: "Beispielmodus · 3 Monate Vorschau",
      demoSub: "Getrennt gespeichert · keine echten Daten",
      demoExit: "Beenden",
      futureNotice: "Zukünftiges Datum · nur Vorschau",
      today: {
        moodTitle: "Heutige Stimmung",
        moodTitlePast: "Stimmung an diesem Tag",
        moods: { 很好: "Super", 平静: "Ruhig", 低落: "Tief" },
        notePrefix: "",
        habitsTitle: "Heutige Routinen",
        habitsTitlePast: "Routinen",
        habitsDone: (d, n) => `${d} / ${n} erledigt`,
        habitsEmpty: "Noch keine Routinen",
        focusTitle: "Fokuszeit",
        focusUnit: "Min.",
        focusEmptySub: "Tippen für Fokus-Timer",
        spendTitle: "Ausgaben",
        spendTitlePast: "Ausgaben",
        spendCount: n => (n ? `${n}×` : "0×"),
        weatherCityDemo: "Berlin",
        weatherCondDemoLight: "Bewölkt",
        weatherCondDemoDark: "Leicht bewölkt",
        weatherRangeDemoLight: "↑11° · ↓4° · 10%",
        weatherRangeDemoDark: "↑11° · ↓4° · Kühl",
        weatherSlotCity: "Berlin",
        weatherSlotSub: "Wetter",
        weatherSlotRange: "Stadt wählen",
        weatherOfflineBadge: "Cache",
        weatherOfflineSub: "Offline · aktualisiert online",
        weatherPrecip: p => `${p}%`,
        weatherSettingsGroup: "Heute & Wetter",
        weatherSettingsTitle: "Wetter-Stadt",
        weatherSettingsHint: "Bei Bedarf online · offline aus Cache",
        weatherSheetTitle: "Wetter-Stadt",
        weatherSheetSub: "Ortszeit, Temperatur und 00–24 Uhr Kurve mit automatischem Offline-Cache.",
        weatherSearchPlaceholder: "Stadt suchen (z. B. Berlin, München)",
        weatherSearchBtn: "Suchen",
        weatherQuickTitle: "Schnellauswahl",
        weatherNoResults: "Keine passende Stadt gefunden",
        weatherOfflineSearch: "Offline — Stadt unten wählen, Prognose aktualisiert sich bei Verbindung.",
        weatherRefresh: "Aktualisieren",
        weatherCredit: "Quelle: Open-Meteo · CC BY 4.0",
        wallEmptyTitle: "Lieblingsfoto hinzufügen",
        wallEmptySub: "Tippen zum Auswählen und Fokuspunkt setzen",
        wallLightboxFocus: "Fokuspunkt",
        wallLightboxAdd: "Foto ändern",
        wallLightboxClose: "Schließen",
        rhythmTitle: "Letzte 7 Tage",
        rhythmSub: "7-Tage-Routinequote",
      },
      cardLib: {
        title: "Kartenbibliothek",
        sub: "Karten einblenden oder sortieren — neue Karten nur von hier",
        added: "Aktiv",
        add: "Hinzufügen",
        remove: "Ausblenden",
        done: "Fertig",
        names: {
          quote: "Tageszitat",
          weather: "Wetter",
          mood: "Stimmung",
          habits: "Heutige Routinen",
          focusSpend: "Fokus & Ausgaben",
          wall: "Fotowand",
          rhythm: "Letzte 7 Tage",
        },
        descs: {
          quote: "Einzeiliges Zitat aus deinen Zitat-Einstellungen",
          weather: "Ortswetter mit 00–24 Uhr Temperaturkurve",
          mood: "Dreistufige Stimmung und Tagesnotiz",
          habits: "Horizontale Leiste, erledigte rücken ans Ende",
          focusSpend: "Ganze Karte tippen für Fokuszeit & 7-Tage-Ausgaben",
          wall: "Randlose Fotowand mit 6px Rahmen & Fokuspunkt",
          rhythm: "Optionale 7-Tage-Rhythmuskarte",
        },
      },
      photoSheet: {
        title: "Fotowand & Fokuspunkt",
        hint: "Tippe oder ziehe im Bild, um den sichtbaren Ausschnitt festzulegen",
        addPhoto: "Lokales Foto wählen",
        removePhoto: "Foto entfernen",
        demoNote: "Änderungen im Beispielmodus bleiben temporär",
        done: "Fertig",
      },
      welcome: {
        skip: "Überspringen",
        backAria: "Zurück",
        pill1: "Stimmung · 3 Sek.",
        pill2: "Routine · 1 Tipp",
        kicker1: "Android 1.0 · Lokale Version",
        title1: "Jetzt festhalten, dich verstehen",
        tagline1: "Understand your past. Shape your future.",
        feat1t: "In 3 Sek. einhändig erfassen",
        feat1s: "Stimmung, Routinen und Notiz direkt über die Mitte festhalten",
        feat2t: "Ausgaben nebenbei erfassen",
        feat2s: "Rechner-Tastatur und lokale Kategorien halten alles übersichtlich",
        feat3t: "Mobil leicht, am Mac tief",
        feat3s: "Ein Datenformat auf allen Geräten, jederzeit als Backup exportierbar",
        next: "Weiter",
        lock: "Lokal gespeichert · Kein Konto nötig",
        kicker2: "Lokaler Speicher",
        title2: "Deine Daten bleiben auf dem Handy",
        lead2: "Einträge, Routinen und Ausgaben liegen lokal und funktionieren offline; Wetter bei Bedarf, Backup jederzeit für den Mac.",
        p1t: "Start in dein leeres Tagebuch",
        p1s: "Keine Beispieldaten im Speicher; Vorschau jederzeit über „Beispiel“",
        p2t: "Wetter bei Bedarf, ohne Cloud & KI",
        p2s: "Stadt frei wählbar, offline aus dem Cache, volle Kontrolle",
        p3t: "Export als JSON & Medienpaket (.llmedia)",
        p3s: "Über den Android-Dateiwähler, kompatibel mit Mac & Web",
        start: "Jetzt starten",
        sample: "Beispiel",
        importBackup: "Backup laden",
      },
      emptyToday: {
        title: "Ein ruhiger Tag für deinen Start",
        desc: "Alles bleibt lokal auf diesem Gerät. Halte deinen ersten Moment in wenigen Sekunden fest.",
        cta: "Ersten Moment festhalten",
        sample: "3-Monats-Beispiel ansehen",
      },
      sheet: {
        title: "Schnelleintrag",
        todayPrefix: "Heute",
        segMood: "Stimmung",
        segMoney: "Ausgabe €",
        segFocus: "Fokus",
        step1: "1. Wie fühlst du dich gerade?",
        step2: "2. Routinen abhaken",
        step3: "3. Kurze Notiz (optional)",
        selectedPrefix: "Gewählt",
        notSelected: "Noch offen",
        doneCount: (d, t) => `${d} / ${t} erledigt`,
        moods: { 很好: "Super", 平静: "Ruhig", 低落: "Tief" },
        notePlaceholder: "Ein Gedanke, Moment oder kurzer Rückblick…",
        photoAttach: "Fotowand · Fokus",
        photoAdd: "Lokales Foto",
        chars: n => `${n} Zeichen`,
        save: "Speichern",
        moneyBridgeTitle: "Ausgabe oder Einnahme erfassen",
        moneyBridgeDesc: "Öffne den Bereich Geld für Buchungen, Kategorien und Monatsstand.",
        moneyBridgeCta: "Zu Geld wechseln",
        focusBridgeTitle: "Fokuszeit starten",
        focusBridgeDesc: "Starte den Fokus-Timer — gezählt werden nur Fokusminuten.",
        focusBridgeCta: "Fokus öffnen",
      },
      undo: "Rückgängig",
      money: {
        balanceLabel: c => `Saldo · ${c}`,
        addBtn: "+ Neu",
        income: "Einnahmen",
        expense: "Ausgaben",
        budgetLabel: a => `Monatsbudget ${a}`,
        budgetUsed: (pct, left) => `${pct} % · Rest ${left}`,
        budgetOver: pct => `${pct} % · über Budget`,
        breakdownTitle: "Ausgaben nach Kategorie",
        breakdownHint: "Tippen zum Filtern",
        clearFilter: "Filter löschen",
        todayLabel: "Heute",
        yesterdayLabel: "Gestern",
        dayExpense: a => `Ausgaben −${a}`,
        billFlow: "Kontoauszug",
        subReadOnly: "Abo · schreibgeschützt",
        deleteLabel: "Löschen",
        deletedUndo: "Buchung gelöscht",
        emptyTitle: "Noch keine Buchungen",
        emptyDesc: "In 5 Sek. über die Rechner-Tastatur erfassen oder Bank-CSV importieren.",
        emptyCta: "Erste Buchung",
        moreTitle: "Finanz-Werkzeuge",
        bankImport: "Bankauszug importieren (CSV / PDF)",
        bankImportSub: "Konto- oder Kreditkartenbuchungen lokal abgleichen",
        subDetailTitle: "Abo · schreibgeschützt",
        subDetailNote: "Importierte oder wiederkehrende Abos sind auf dem Handy schreibgeschützt.",
        subFieldAmount: "Betrag",
        subFieldDate: "Datum",
        subFieldCategory: "Kategorie",
        subFieldSource: "Quelle",
        subSourceImport: "Bankimport",
        subSourceRecurring: "Wiederkehrendes Abo",
      },
      keypad: {
        expense: "Ausgabe",
        income: "Einnahme",
        exprPrefix: "Rechnung ",
        autoCat: "Auto",
        manualCat: "Kategorie",
        notePlaceholder: "Notiz (z. B. Kaffee, REWE…)",
        noteLabel: "Notiz",
        save: "Buchen",
        hint: "Mit + / − Live-Rechner · Dezimalkomma (,) für Deutsch",
      },
      history: {
        goodShort: "Super",
        calmShort: "Ruhig",
        lowShort: "Tief",
        dailyRecorded: (m, n) => `Tag · ${n} Tage erfasst`,
        pureMoodFiltered: "Ohne reine Stimmung",
        dailyEmpty: "Keine Einträge mit Notiz in diesem Monat.",
        statHabit: (d, t) => `Routine ${d}/${t}`,
        statFocus: m => `Fokus ${m} Min.`,
        statSpend: a => `Ausgaben ${a}`,
        weekTitle: "Woche",
        weekRhythm: "Wochenrhythmus",
        weekNum: (n, cur) => `KW ${n}${cur ? " · Aktiv" : ""}`,
        weekHabitRate: "Routinequote",
        weekTimes: (d, t) => `${d} / ${t}`,
        weekFocus: "Fokuszeit",
        weekFocusDelta: m => (m === 0 ? "Wie Vorwoche" : `${m > 0 ? "+" : ""}${(m / 60).toFixed(1).replace(".", ",")} h gg. Vorw.`),
        weekMood: "Stimmung",
        weekMoodSummary: (g, c) => `${g} Super · ${c} Ruh.`,
        weekMoodLow: l => `${l} Tief`,
        weekGoals: "Wochenziele",
        goalsDone: (d, t) => `${d} / ${t} erledigt`,
        addGoalPlaceholder: "Neues Wochenziel hinzufügen…",
        addGoalBtn: "Hinzufügen",
        goalDeletedUndo: "Wochenziel entfernt",
        weekReviewTitle: "Wochenrückblick",
        weekReviewAction: "Schreiben",
        weekReviewPlaceholder: "Was lief diese Woche rund? Was soll nächste Woche anders sein?",
        savedLocal: "Lokal gespeichert",
        monthUnwrittenTitle: m => `Monatsrückblick · noch leer`,
        monthUnwrittenSub: "Bleibt leer bis selbst geschrieben — kein Wochen-Mix",
        goWrite: "Schreiben →",
        monthOverview: "Monatsübersicht",
        monthHabitRate: "Routinequote",
        monthFocusTotal: "Fokuszeit",
        monthSpend: "Ausgaben",
        monthHabitsTitle: "Routinen im Monat",
        monthReviewTitle: m => `Monatsrückblick ${m}`,
        monthReviewEmpty: m => `Monatsrückblick noch leer — Platz für deine eigenen Worte`,
        monthReviewPlaceholder: "Was hat sich diesen Monat verändert? Was bleibt?",
        horizonPhaseKicker: "AKTUELLE PHASE",
        horizonNoPhase: "Noch keine aktive Phase — langfristige Planung am Mac.",
        horizonPlansTitle: "Pläne & Schritte",
        horizonEmpty: "Noch keine langfristigen Pläne.",
      },
      habits: {
        addBtn: "+ Neu",
        filterAll: n => `Alle ${n}`,
        filterDaily: n => `Täglich ${n}`,
        filterPeriodic: n => `Zyklus ${n}`,
        filterPaused: n => `Pausiert ${n}`,
        reminderTitle: "Tägliche Erinnerung",
        reminderOn: time => `${time} Ein ›`,
        reminderOff: "Aus ›",
        dailyMeta: (streak, detail) => `Täglich · ${streak} T. Serie · ${detail}`,
        checklist: "Checkliste",
        periodicMeta: (period, target, done) => `Zyklus · ${target}/${period} · ${done}/${target}`,
        perWeek: "Wo.",
        perMonth: "Mon.",
        ago14: "Vor 14 T.",
        doneToday: "Heute erledigt",
        todoToday: "Heute offen",
        monthDist: m => `Monatsverteilung`,
        monthProgress: (d, t) => `${d} / ${t} im Monat`,
        pause: "Pausieren",
        resume: "Aktivieren",
        pausedUndo: name => `„${name}“ pausiert`,
        resumedUndo: name => `„${name}“ aktiviert`,
        footerHint: "Änderungen ab heute gültig — Verlauf bleibt unverändert",
        emptyTitle: "Noch keine Routinen",
        emptyDesc: "Starte mit 1–3 kleinen täglichen Routinen.",
        emptyCta: "Erste Routine",
      },
      focus: {
        runningBadge: m => `Fokus aktiv · ${m} Min. erfasst`,
        pausedBadge: "Pausiert",
        readyBadge: "Bereit für Fokus",
        breakBadge: "Pause · zählt nicht zur Fokuszeit",
        remainingSub: m => `Restzeit · ${m}-Min.-Block`,
        readySub: m => `Geplant · ${m} Min.`,
        plus5: "+5 Min.",
        start: "Fokus starten",
        pause: "Pause",
        resume: "Weiter",
        end: "Beenden",
        startBreak: "Pause starten",
        skipBreak: "Pause überspringen",
        todayTotal: "Fokuszeit heute",
        unitMin: "Min.",
        breakNote: "Pausenzeit wird nicht gezählt",
        topicsNote: "Themen in Einstellungen",
        defaultTopic: "Fokusarbeit",
        presetTopics: ["Fokusarbeit", "Deutsch B2", "Lesen", "Schreiben"],
        chooseTopic: "Fokusthema wählen",
        customTopicPlaceholder: "Oder eigenes Thema…",
        capsuleAria: "Zum Fokus-Timer zurück",
      },
      splash: {
        settingsTitle: "Startzitat & Spruch",
        previewBtn: "Vorschau",
        masterTitle: "Startzitat beim Öffnen zeigen",
        masterDesc: "Bleibt ca. 2,5 s, tippen überspringt sofort; respektiert „Bewegung reduzieren“.",
        freqOff: "Aus",
        freqDaily: "1× täglich",
        freqAlways: "Jedes Öffnen",
        stylesTitle: "7 Wochentags-Stile (Mo–So)",
        stylesBadge: "21 Klassiker",
        todayBadge: "Heute aktiv",
        previewDayBadge: "Vorschau",
        syncSourceNote: "Identisch mit Heute-Zitat",
        tapHint: "Zum Öffnen tippen",
        todayTag: "Heute",
        weekdaysFull: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
        quoteLibLabel: "Zitatquelle (gemeinsame quoteSettings)",
        modeAuto: "7-Tage-Stil",
        modeCustom: "Eigene",
        modeMixed: "Gemischt",
        manageCustomTitle: "Eigene Zitate verwalten",
        manageCustomSub: "Synchron mit Mac & Web über quoteSettings",
        customCount: n => (n ? `${n} Zitate` : "Hinzufügen"),
        customSheetTitle: "Eigene Zitate",
        customSheetSub: "Eins pro Zeile, Quelle nach —. Direkt in gemeinsamen quoteSettings gespeichert.",
        customPlaceholder: "Beispiel:\nAller Anfang ist schwer. — Sprichwort",
        save: "Speichern",
        mediaSectionLabel: "Eigene Bilder & Musik (nur lokal)",
        customImgTitle: "Eigene Hintergrundbilder",
        customImgSub: "Lokal gespeichert & im .llmedia-Backup enthalten",
        imgCount: n => (n ? `${n} Bild(er)` : "Keine"),
        addImg: "Bild",
        useBuiltInBg: "Standard",
        musicTitle: "Startmusik",
        musicSub: "Standardmäßig aus · lokale MP3 / M4A",
        musicPick: "Audio wählen",
        musicRemove: "Entfernen",
        musicTooLarge: "Audiodatei bitte unter 1,2 MB halten für das .llmedia-Backup.",
        musicReady: name => `Titel: ${name}`,
        silentNote: "Spielt im Lautlos-, Vibrations- oder Bitte-nicht-stören-Modus niemals ab; lokal im .llmedia-Backup.",
        footerNote: "Eigene Bilder & Audios verlassen das Gerät nicht; Migration per SAF-.llmedia-Backup",
        demoMediaNote: "Im Beispielmodus bleiben deine lokalen Medien unverändert",
        statusChipOff: "Aus",
        statusChipDaily: "1× täglich · 7 Stile",
        statusChipAlways: "Immer · 7 Stile",
      },
      settings: {
        title: "Einstellungen & Backup",
        backupPill: "Lokal · Jederzeit exportieren",
        backupTitle: "Deine Daten gehören dir",
        backupMeta: (lastStr, days, sizeStr) => `${lastStr} · ${days} T. · ${sizeStr}`,
        lastBackupNever: "Noch kein Backup",
        lastBackupOn: d => `Letztes Backup: ${d}`,
        exportBtn: "Export .json / .llmedia",
        importBtn: "Wiederherstellen",
        syncNote: "Alle Daten bleiben lokal · Cloud-Sync folgt später",
        secAppear: "Darstellung & Erlebnis",
        theme: "Erscheinungsbild",
        themeVals: { system: "System", light: "Hell", dark: "Dunkel" },
        language: "Sprache",
        languageVal: "Deutsch / 中文 / EN",
        splash: "Startzitat & Spruch",
        display: "Text & Bewegung",
        fontNormal: "Standard",
        fontLarge: "Groß",
        motionFull: "Voll",
        motionReduced: "Reduziert",
        secModules: "Heute & Module",
        weatherCity: "Wetter-Stadt",
        cardLib: "Heute-Karten",
        cardLibVal: n => `${n} aktiv`,
        focusTopics: "Fokus-Themen",
        focusTopicsVal: n => `${n} Themen`,
        currencyBill: "Währung & Kontoauszug",
        currencyVal: (cur, multi) => `${cur} · ${multi ? "Pro Buchung" : "Einzeln"}`,
        reminder: "Tägliche Erinnerung",
        reminderOff: "Aus",
        enterDemo: "Beispielmodus öffnen",
        enterDemoVal: "3-Monats-Vorschau",
        exitDemo: "Beispielmodus beenden",
        exitDemoVal: "Zu deinen Daten",
        clearLocal: "Lokale Daten löschen",
        verLine1: "Life Ledger Android 1.0 (android-v1.0.0) · Lokal · Schema v3",
        verLine2: "SAF-Backup (.json & Streaming-.llmedia) kompatibel mit Mac & Web",
        exportSheetTitle: "Lokales Backup exportieren",
        exportSheetSub: "Über Android SAF lokal speichern – direkt kompatibel mit Mac & Web.",
        exportJsonTitle: "JSON-Backup exportieren (.json)",
        exportJsonDesc: "Alle Einträge, Routinen, Rückblicke, Fokus, Geld & quoteSettings (Schema v3)",
        exportMediaTitle: "Medienpaket exportieren (.llmedia)",
        exportMediaDesc: "Streamt Daten, lokale Fotos & Startzitat-Medien ohne 160-MiB-Limit",
        exportDone: name => `Backup exportiert: ${name}`,
        exportFailed: "Export fehlgeschlagen. Bitte erneut versuchen.",
        importSheetTitle: "Aus Backup wiederherstellen",
        importSheetSub: ".json oder .llmedia via Android SAF wählen; neuere Schemas werden sicher abgelehnt.",
        pickBackupBtn: "Backupdatei wählen (.json / .llmedia)",
        confirmRestoreBtn: "Auf diesem Gerät wiederherstellen",
        restoreDone: "Lokale Daten wiederhergestellt",
        restoreUnsupported: "Dieses Backup stammt aus einer neueren Version (Schema > 3). Bitte zuerst aktualisieren.",
        restoreInvalid: "Backupdatei ungültig. Bestehende Daten bleiben unverändert.",
        mediaItemsCount: n => `Enthält ${n} lokale Mediendatei(en)`,
        displaySheetTitle: "Text & Bewegung",
        fontLabel: "Textgröße",
        motionLabel: "Bewegung",
        topicsSheetTitle: "Fokus-Themen",
        topicsSheetSub: "Im Fokus-Timer wählbar; Pausenzeit wird nie als Fokus gezählt.",
        topicsPlaceholder: "Neues Thema (z. B. Deutsch B2)",
        topicsAdd: "Hinzufügen",
        reminderSheetTitle: "Tägliche Erinnerung",
        reminderEnable: "Tägliche Erinnerung aktivieren",
        reminderTimeLabel: "Uhrzeit",
        reminderSaved: "Erinnerung gespeichert",
        clearTitle: "Alle lokalen Daten löschen?",
        clearDesc: "Löscht dauerhaft alle Einträge, lokalen Fotos und eigenen Startmedien auf diesem Gerät (Darstellung & Sprache bleiben). Vorher bei Bedarf sichern.",
        clearCancel: "Abbrechen",
        clearConfirm: "Lokale Daten löschen",
        multiCurrencyLabel: "Währung pro Buchung wählen",
        bankImportRow: "Kontoauszug importieren (CSV / PDF)",
      },
    },
  };

  function core() {
    return window.LifeLedgerAndroidCore;
  }

  function lang() {
    const l = core()?.getLang?.() || resolveAndroidLanguage({
      stored: localStorage.getItem("life-ledger-language"),
      explicit: localStorage.getItem("life-ledger-language-preference-set"),
      requested: new URLSearchParams(location.search).get("lang"),
      languages: navigator.languages || [navigator.language],
    });
    if (l.startsWith("de")) return "de";
    if (l.startsWith("en")) return "en";
    return "zh";
  }

  function t() {
    return COPY[lang()] || COPY.zh;
  }

  function isDark() {
    return document.documentElement.dataset.theme === "dark";
  }

  function isReducedMotion() {
    return (
      document.documentElement.classList.contains("motion-reduced") ||
      Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches)
    );
  }

  function formatTopDate(iso) {
    const dt = parseIsoDate(iso);
    const l = lang();
    if (l === "zh") {
      const wd = new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(dt);
      return `${dt.getMonth() + 1}月${dt.getDate()}日 · ${wd}`;
    }
    if (l === "de") {
      return new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "numeric", month: "short" }).format(dt);
    }
    return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" }).format(dt);
  }

  function formatShortDate(iso) {
    const dt = parseIsoDate(iso);
    const l = lang();
    if (l === "zh") return `${dt.getMonth() + 1}月${dt.getDate()}日`;
    if (l === "de") return `${dt.getDate()}. ${new Intl.DateTimeFormat("de-DE", { month: "short" }).format(dt)}`;
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(dt);
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function shortHabitLabel(name) {
    const raw = String(name || "").trim();
    if (!raw) return "";
    if (lang() === "zh") {
      if (raw.includes("23:30")) return "23:30睡";
      return raw.length > 5 ? raw.slice(0, 5) : raw;
    }
    if (lang() === "de") {
      if (/schlaf|23:30/i.test(raw)) return "Schlaf";
      if (/wasser/i.test(raw)) return "Wasser";
      if (/bewegung|sport/i.test(raw)) return "Sport";
      if (/sprache/i.test(raw)) return "Sprache";
      if (/kraft/i.test(raw)) return "Kraft";
      if (/deep work/i.test(raw)) return "Fokus";
      return raw.split(/\s+/)[0].slice(0, 10);
    }
    if (/sleep|23:30/i.test(raw)) return "Sleep";
    if (/water/i.test(raw)) return "Water";
    if (/language/i.test(raw)) return "Language";
    if (/strength/i.test(raw)) return "Strength";
    return raw.length > 10 ? raw.split(/\s+/)[0] : raw;
  }

  function habitIconTone(key) {
    const map = {
      book: { bg: "var(--a-good-soft)", fg: "var(--a-good-fg)" },
      bed: { bg: "var(--a-sleep-soft)", fg: "var(--a-sleep-fg)" },
      moon: { bg: "var(--a-sleep-soft)", fg: "var(--a-sleep-fg)" },
      running: { bg: "var(--a-expense-soft)", fg: "var(--a-expense)" },
      dumbbell: { bg: "var(--a-expense-soft)", fg: "var(--a-expense)" },
      bike: { bg: "var(--a-expense-soft)", fg: "var(--a-expense)" },
      footprints: { bg: "var(--a-expense-soft)", fg: "var(--a-expense)" },
      droplets: { bg: "var(--a-sky-soft)", fg: "var(--a-sky)" },
      timer: { bg: "var(--a-focus-soft)", fg: "var(--a-focus)" },
      brain: { bg: "var(--a-focus-soft)", fg: "var(--a-focus)" },
      sunrise: { bg: "var(--a-good-soft)", fg: "var(--a-good-fg)" },
      pen: { bg: "var(--a-primary-soft)", fg: "var(--a-primary)" },
      apple: { bg: "var(--a-primary-soft)", fg: "var(--a-primary)" },
      heart: { bg: "var(--a-expense-soft)", fg: "var(--a-expense)" },
    };
    return map[key] || { bg: "var(--a-primary-soft)", fg: "var(--a-primary)" };
  }

  function habitIconSvg(habit, size = 16) {
    const path = core()?.getHabitIconPath?.(habit) || '<circle cx="12" cy="12" r="8"/>';
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  }

  const ICONS = {
    today: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>',
    ledger: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18"/></svg>',
    timeline: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>',
    habits: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 12.2l2.4 2.4 4.8-5.2"/></svg>',
    plus: '<svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    cardLib: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><path d="M17.5 14v7M14 17.5h7"/></svg>',
    settings: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    moodGood: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
    moodCalm: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
    moodLow: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12a10.06 10.06 0 0 0-20 0Z"/><path d="M12 12v8a2 2 0 0 0 4 0"/><path d="M12 2v1"/></svg>',
    moodGoodLg: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
    moodCalmLg: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
    moodLowLg: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12a10.06 10.06 0 0 0-20 0Z"/><path d="M12 12v8a2 2 0 0 0 4 0"/><path d="M12 2v1"/></svg>',
    check: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 13l4 4L19 7"/></svg>',
    checkSm: '<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M5 13l4 4L19 7"/></svg>',
    cloud: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M17.5 19H7a5 5 0 0 1-.5-9.98A6 6 0 0 1 18.2 10.5 4.2 4.2 0 0 1 17.5 19z"/></svg>',
    sunSmall: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    rainSmall: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M16 13V8.5A4.5 4.5 0 0 0 7.2 7 4 4 0 0 0 7 15h10a3 3 0 0 0 0-6"/><path d="M8 19v2M12 18v2M16 19v2"/></svg>',
    snowSmall: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M17.5 13A4.5 4.5 0 0 0 16 4.3 6 6 0 0 0 4 9a4 4 0 0 0 3 4"/><path d="M8 17h.01M12 19h.01M16 17h.01"/></svg>',
    stormSmall: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M6 16.3A4.5 4.5 0 0 1 7.5 7.6 6 6 0 0 1 19 9a4 4 0 0 1-1 7.6"/><path d="m13 12-3 5h4l-3 5"/></svg>',
    moonSmall: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    focusIc: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9 2h6"/></svg>',
    euroIc: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M17 6.5A6.5 6.5 0 1 0 17 17.5M5 10h9M5 14h8"/></svg>',
    chevron: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
    photoIc: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="1.5"/><path d="M21 16l-5-5-6 6"/></svg>',
    rhythmIc: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 12h4l3-7 4 14 3-7h4"/></svg>',
    quoteHorizon: '<svg width="18" height="14" viewBox="0 0 160 120" fill="none" stroke-linecap="round" style="flex-shrink:0;opacity:0.85;" aria-hidden="true"><path d="M24 94h112M34 94c14-34 78-34 92 0" stroke="var(--a-primary)" stroke-width="8"/><circle cx="80" cy="48" r="16" stroke="var(--a-good)" stroke-width="8"/></svg>',
    eye: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    dotsVert: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>',
    chevDown: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    cup: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/></svg>',
    bell: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
    backspace: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="M18 9l-6 6M12 9l6 6"/></svg>',
    arrowUp: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    arrowDown: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    trash: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
    lockSm: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    pauseIc: '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.4"/><rect x="14" y="5" width="4" height="14" rx="1.4"/></svg>',
    playIc: '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5.5v13l11-6.5z"/></svg>',
    upload: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/></svg>',
    appIcon: '<svg width="24" height="24" viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="116" fill="#1E2723"/><circle cx="392" cy="92" r="112" fill="#36504A" opacity=".45"/><path d="M66 424c97-70 225-82 380-30" fill="none" stroke="#86A993" stroke-width="24" stroke-linecap="round" opacity=".78"/><circle cx="258" cy="96" r="28" fill="#FFF9F1"/><path d="m246 139-35 70 48 24 23 145M246 145l62 46 46-23M212 208l-62 139" fill="none" stroke="#FFF9F1" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    morningArt: '<svg width="176" height="132" viewBox="0 0 160 120" fill="none" stroke-linecap="round" stroke-linejoin="round" style="position:relative;z-index:1;" aria-hidden="true"><g stroke="currentColor" stroke-width="1.6"><path d="M36 96h88"/><path d="M40 96c14-28 66-28 80 0"/></g><g stroke="var(--a-on-surface-variant)" stroke-width="1.5"><path d="M80 48V28"/><path d="M62 58l-12-8"/><path d="M98 58l12-8"/><path d="M56 42l-8-12"/><path d="M104 42l8-12"/></g><g stroke="var(--a-primary)" stroke-width="2.1"><circle cx="80" cy="52" r="14" fill="rgba(244, 169, 0, 0.16)"/></g></svg>',
    localArt: '<svg width="148" height="106" viewBox="0 0 160 120" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g stroke="currentColor" stroke-width="1.7"><rect x="34" y="24" width="92" height="64" rx="12" fill="var(--a-surface-card)" fill-opacity="0.85"/><path d="M34 42h92"/></g><g stroke="var(--a-on-surface-variant)" stroke-width="1.6"><circle cx="48" cy="33" r="2.2"/><circle cx="58" cy="33" r="2.2"/><path d="M52 78h56" opacity="0.5"/></g><g stroke="var(--a-primary)" stroke-width="2.2"><circle cx="80" cy="60" r="14" fill="rgba(46, 125, 91, 0.12)"/><path d="M73.5 60l4.5 4.5 9-10"/></g></svg>',
    firstRunArt: '<svg viewBox="0 0 160 120" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g stroke="currentColor" stroke-width="1.6"><path d="M34 94h92"/><path d="M48 94V44a10 10 0 0 1 10-10h44a10 10 0 0 1 10 10v50"/></g><g stroke="var(--a-on-surface-variant)" stroke-width="1.5"><path d="M62 56h36M62 68h26M62 80h18"/></g><g stroke="var(--a-primary)" stroke-width="2"><circle cx="114" cy="40" r="12" fill="var(--a-primary-soft)"/><path d="M114 35v10M109 40h10"/></g></svg>',
  };

  // Local photo wall IndexedDB bridge (same DB as today-widgets.js; untouched in Demo Mode)
  const wallDb = (() => {
    let db;
    const open = () =>
      (db ||= new Promise((ok, no) => {
        const req = indexedDB.open("life-ledger-wall", 1);
        req.onupgradeneeded = () => {
          if (!req.result.objectStoreNames.contains("photos")) {
            req.result.createObjectStore("photos", { keyPath: "id" });
          }
        };
        req.onsuccess = () => {
          req.result.onversionchange = () => {
            req.result.close();
            db = null;
          };
          ok(req.result);
        };
        req.onerror = () => no(req.error);
      }));
    const run = (mode, fn) =>
      open().then(
        d =>
          new Promise((ok, no) => {
            const tx = d.transaction("photos", mode);
            const q = fn(tx.objectStore("photos"));
            tx.oncomplete = () => ok(q.result);
            tx.onerror = tx.onabort = () => no(tx.error || q.error);
          }),
      );
    return {
      all: () => run("readonly", s => s.getAll()),
      put: row => run("readwrite", s => s.put(row)),
      delete: id => run("readwrite", s => s.delete(id)),
    };
  })();

  // Phase 6: Local splash custom media IndexedDB store (images + audio, included in .llmedia backup)
  const splashMediaDb = (() => {
    let db;
    const open = () =>
      (db ||= new Promise((ok, no) => {
        const req = indexedDB.open("life-ledger-splash-media", 1);
        req.onupgradeneeded = () => {
          if (!req.result.objectStoreNames.contains("media")) {
            req.result.createObjectStore("media", { keyPath: "id" });
          }
        };
        req.onsuccess = () => {
          req.result.onversionchange = () => {
            req.result.close();
            db = null;
          };
          ok(req.result);
        };
        req.onerror = () => no(req.error);
      }));
    const run = (mode, fn) =>
      open().then(
        d =>
          new Promise((ok, no) => {
            const tx = d.transaction("media", mode);
            const q = fn(tx.objectStore("media"));
            tx.oncomplete = () => ok(q.result);
            tx.onerror = tx.onabort = () => no(tx.error || q.error);
          }),
      );
    return {
      all: () => run("readonly", s => s.getAll()),
      put: row => run("readwrite", s => s.put(row)),
      delete: id => run("readwrite", s => s.delete(id)),
      clear: () => run("readwrite", s => s.clear()),
    };
  })();

  let splashOpen = false;
  let splashSettingsOpen = false;
  let settingsOpen = false;
  let pendingBackupImportPreview = null;
  let backupImportError = "";
  let splashTimer = 0;
  let launchPrepared = false;
  let launchSplashDeadline = 0;
  let splashAudioEl = null;
  let splashPreviewWeekday = null; // 0..6 when inspecting a weekday in splash settings
  let splashMediaItems = [];
  let splashMediaLoaded = false;
  let splashMediaObjectUrls = [];

  function loadSplashPrefs() {
    try {
      const raw = JSON.parse(localStorage.getItem(SPLASH_PREFS_KEY) || "null") || {};
      const frequency = raw.frequency === "off" || raw.frequency === "always" || raw.frequency === "daily" ? raw.frequency : "daily";
      return {
        frequency,
        lastShownDate: String(raw.lastShownDate || ""),
        musicEnabled: Boolean(raw.musicEnabled === true), // default OFF
        activeImageId: String(raw.activeImageId || ""),
        activeAudioId: String(raw.activeAudioId || ""),
      };
    } catch {
      return { frequency: "daily", lastShownDate: "", musicEnabled: false, activeImageId: "", activeAudioId: "" };
    }
  }

  function saveSplashPrefs(patch) {
    const next = { ...loadSplashPrefs(), ...(patch || {}) };
    try {
      localStorage.setItem(SPLASH_PREFS_KEY, JSON.stringify(next));
    } catch {}
    return next;
  }

  async function refreshSplashMediaCache() {
    try {
      const rows = await splashMediaDb.all();
      splashMediaObjectUrls.forEach(u => URL.revokeObjectURL(u));
      splashMediaObjectUrls = [];
      splashMediaItems = (rows || [])
        .filter(r => r && r.id && r.bytes)
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
        .map(r => {
          const blob = new Blob([r.bytes], { type: r.contentType || "application/octet-stream" });
          const url = URL.createObjectURL(blob);
          splashMediaObjectUrls.push(url);
          return { ...r, url, size: blob.size };
        });
      splashMediaLoaded = true;
    } catch {
      splashMediaItems = [];
      splashMediaLoaded = true;
    }
    return splashMediaItems;
  }

  async function compressSplashImageFile(file) {
    if (window.LifeLedgerPhotoMemories?.compressPhoto) {
      const res = await window.LifeLedgerPhotoMemories.compressPhoto(file);
      return { blob: res.blob, width: res.width || 0, height: res.height || 0 };
    }
    if (file.size <= SPLASH_MEDIA_MAX_BYTES) {
      return { blob: file, width: 0, height: 0 };
    }
    throw new Error("image-too-large");
  }

  window.LifeLedgerSplashMedia = {
    async list() {
      return refreshSplashMediaCache();
    },
    async saveImage(file) {
      const { blob, width, height } = await compressSplashImageFile(file);
      if (blob.size > SPLASH_MEDIA_MAX_BYTES) throw new Error("image-too-large");
      const bytes = await blob.arrayBuffer();
      const record = {
        id: `splash-img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        kind: "image",
        name: String(file.name || "splash-image").slice(0, 80),
        contentType: blob.type || "image/jpeg",
        bytes,
        width,
        height,
        createdAt: Date.now(),
      };
      await splashMediaDb.put(record);
      saveSplashPrefs({ activeImageId: record.id });
      await refreshSplashMediaCache();
      return record;
    },
    async saveAudio(file) {
      if (!file || file.size < 1) throw new Error("invalid-audio");
      if (file.size > SPLASH_MEDIA_MAX_BYTES) throw new Error("audio-too-large");
      const bytes = await file.arrayBuffer();
      const record = {
        id: `splash-aud-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        kind: "audio",
        name: String(file.name || "launch-audio").slice(0, 80),
        contentType: file.type || "audio/mpeg",
        bytes,
        width: 0,
        height: 0,
        createdAt: Date.now(),
      };
      await splashMediaDb.put(record);
      saveSplashPrefs({ activeAudioId: record.id });
      await refreshSplashMediaCache();
      return record;
    },
    async remove(id) {
      await splashMediaDb.delete(id);
      const prefs = loadSplashPrefs();
      if (prefs.activeImageId === id) saveSplashPrefs({ activeImageId: "" });
      if (prefs.activeAudioId === id) saveSplashPrefs({ activeAudioId: "" });
      await refreshSplashMediaCache();
    },
    async clearAll() {
      await splashMediaDb.clear();
      await refreshSplashMediaCache();
    },
    async listForBackup() {
      const items = await refreshSplashMediaCache();
      return items
        .filter(item => item.size > 0 && item.size <= SPLASH_MEDIA_MAX_BYTES)
        .map(item => buildSplashMediaBackupEntry(item, item.url))
        .filter(Boolean);
    },
    async restoreFromBackup(photoMeta, blob) {
      if (!photoMeta || !blob || !isSplashMediaBackupEntry(photoMeta)) return null;
      const kind = photoMeta.date === SPLASH_MEDIA_AUDIO_DATE ? "audio" : "image";
      const bytes = await blob.arrayBuffer();
      const record = {
        id: photoMeta.backupId || photoMeta.id || `splash-${kind}-${Date.now().toString(36)}`,
        kind,
        name: kind === "audio" ? "restored-audio" : "restored-image",
        contentType: photoMeta.contentType || blob.type || (kind === "audio" ? "audio/mpeg" : "image/jpeg"),
        bytes,
        width: Number(photoMeta.width) || 0,
        height: Number(photoMeta.height) || 0,
        createdAt: Number(photoMeta.createdAt) || Date.now(),
      };
      await splashMediaDb.put(record);
      await refreshSplashMediaCache();
      return record;
    },
  };

  let mounted = false;
  let welcomeStep = 0; // 0 = hidden, 1 = screen 1, 2 = screen 2
  let sheetOpen = false;
  let sheetMode = "capture"; // "capture" | "cardlib" | "photo" | "weather" | "keypad" | "subdetail" | "moneymenu" | "focustopic"
  let sheetSegment = "mood";
  let sheetTargetDate = "";
  let draftMood = "";
  let draftHabits = new Set();
  let draftNote = "";

  // Phase 5 UI state (views, keypad, focus overlay, snackbar)
  let moneyYm = "";
  let moneyDrillCatId = "";
  let keypadState = { kind: "expense", expr: "", note: "", categoryId: "", date: "", currency: "EUR" };
  let activeSubDetailTx = null;
  let timelineYm = "";
  let weekKeySel = "";
  let monthReviewYm = "";
  let habitsFilter = "all"; // "all" | "daily" | "periodic" | "paused"
  let focusOpen = false;
  let focusRevision = 0;
  let weatherRevision = 0;
  let focusStructure = "";
  let focusTopicDraft = "";
  let focusDurationDraft = 25;
  let snackbarTimer = 0;
  let snackbarUndoFn = null;

  // Today cards visibility & order (isolated in-memory during Demo Mode)
  let userCardsPref = null;
  let demoCardsPref = [...DEFAULT_TODAY_CARDS];

  // Photo wall state (demo vs real user)
  let demoWallPhotos = [
    { id: "demo-cafe-reading", url: "./assets/demo-memories/cafe-reading.jpg", x: 50, y: 52, alt: "Cafe reading" },
    { id: "demo-spree-sunset", url: "./assets/demo-memories/spree-sunset.jpg", x: 50, y: 45, alt: "Spree sunset" },
    { id: "demo-analyst-desk", url: "./assets/demo-memories/analyst-desk.jpg", x: 50, y: 50, alt: "Analyst desk" },
  ];
  let userWallPhotos = [];
  let userWallLoaded = false;
  let wallIndex = 0;
  let wallObjectUrls = [];
  let lightboxOpen = false;

  // Habit FLIP animation state
  let habitAnimInFlight = false;
  let pendingFlip = null; // { id, firstRects }
  let habitRailScrollLeft = 0;

  let els = {};
  let syncQueued = false;
  const regionInputs = new WeakMap();
  const regionMarkup = new WeakMap();

  // Let the pressed state reach the screen before statistics or DOM work starts.
  function afterNextPaint(work) {
    requestAnimationFrame(() => setTimeout(work, 0));
  }

  function whenIdle(work) {
    if (window.requestIdleCallback) window.requestIdleCallback(work, { timeout: 1500 });
    else setTimeout(work, 120);
  }

  function regionChanged(node, inputs) {
    const signature = JSON.stringify(inputs);
    if (regionInputs.get(node) === signature) return false;
    regionInputs.set(node, signature);
    return true;
  }

  function panelChanged(node, inputs) {
    const c = core();
    return regionChanged(node, [lang(), isDark(), c?.isIsolatedDemoActive?.(), c?.getTodayIso?.(), ...inputs]);
  }

  // Retain unchanged Today cards (and their listeners, scroll and image state).
  function updateTodayRegion(parent, key, html, selectedDate, isFuture) {
    let node = [...parent.children].find(child => child.dataset.aRegion === key);
    const signature = selectedDate + html;
    if (node && regionMarkup.get(node) === signature) return node;
    const template = document.createElement("template");
    template.innerHTML = html;
    const next = template.content.firstElementChild;
    if (!next) { node?.remove(); return null; }
    next.dataset.aRegion = key;
    regionMarkup.set(next, signature);
    if (node) node.replaceWith(next);
    else parent.append(next);
    // Scope listeners to newly inserted regions; retained cards keep theirs.
    const scope = { querySelector: selector => next.matches(selector) ? next : next.querySelector(selector),
      querySelectorAll: selector => [...(next.matches(selector) ? [next] : []), ...next.querySelectorAll(selector)] };
    wireTodayEvents(selectedDate, isFuture, scope);
    return next;
  }

  function getActiveView() {
    return document.body.dataset.activeView || "today";
  }

  function loadCardsPref() {
    if (core()?.isIsolatedDemoActive?.()) return demoCardsPref;
    if (userCardsPref) return userCardsPref;
    try {
      const parsed = JSON.parse(localStorage.getItem(CARDS_PREF_KEY) || "null");
      userCardsPref = resolveAndroidTodayCards(parsed);
    } catch {
      userCardsPref = [...DEFAULT_TODAY_CARDS];
    }
    return userCardsPref;
  }

  function saveCardsPref(next) {
    const clean = resolveAndroidTodayCards(next);
    if (core()?.isIsolatedDemoActive?.()) {
      demoCardsPref = clean;
      return;
    }
    userCardsPref = clean;
    try {
      localStorage.setItem(CARDS_PREF_KEY, JSON.stringify(clean));
    } catch {}
  }

  function activeWallList() {
    return core()?.isIsolatedDemoActive?.() ? demoWallPhotos : userWallPhotos;
  }

  function currentWallPhoto() {
    const list = activeWallList();
    if (!list.length) return null;
    wallIndex = Math.max(0, Math.min(wallIndex, list.length - 1));
    return list[wallIndex];
  }

  async function ensureUserWallLoaded() {
    if (userWallLoaded || core()?.isIsolatedDemoActive?.()) return;
    userWallLoaded = true;
    try {
      const rows = await wallDb.all();
      wallObjectUrls.forEach(u => URL.revokeObjectURL(u));
      wallObjectUrls = [];
      userWallPhotos = (rows || [])
        .filter(r => r && r.blob && String(r.type || "").startsWith("image/"))
        .sort((a, b) => (a.created || 0) - (b.created || 0))
        .map(r => {
          const url = URL.createObjectURL(r.blob);
          wallObjectUrls.push(url);
          return { ...r, url, x: Number.isFinite(r.x) ? r.x : 50, y: Number.isFinite(r.y) ? r.y : 50 };
        });
      syncUI();
    } catch {
      userWallPhotos = [];
    }
  }

  function buildShell() {
    if (mounted) return;
    mounted = true;
    const shell = document.querySelector(".app-shell");
    const main = document.querySelector(".main-content");
    if (!shell || !main) return;

    // 1. Persistent Demo Ribbon
    const ribbon = document.createElement("aside");
    ribbon.id = "androidDemoRibbon";
    ribbon.className = "a-demo-ribbon";
    ribbon.hidden = true;
    ribbon.setAttribute("role", "status");
    ribbon.setAttribute("aria-live", "polite");
    ribbon.innerHTML = `
      <div class="a-demo-left">
        <span class="a-demo-dot" aria-hidden="true"></span>
        <div class="a-demo-copy">
          <span class="a-demo-title" id="androidDemoTitle"></span>
          <span class="a-demo-sub" id="androidDemoSub"></span>
        </div>
      </div>
      <button type="button" class="a-demo-exit" id="androidDemoExit"></button>
    `;
    shell.prepend(ribbon);

    // 2. Android Top Bar (Title + Date + Back-to-Today + Focus Capsule + Context Actions + Settings)
    const topbar = document.createElement("header");
    topbar.id = "androidTopbar";
    topbar.className = "a-topbar";
    topbar.innerHTML = `
      <div class="a-title-wrap">
        <h1 class="a-page-title" id="androidPageTitle"></h1>
        <span class="a-date-sub" id="androidDateSub"></span>
        <button type="button" class="a-back-today-pill" id="androidBackTodayBtn" hidden></button>
      </div>
      <div class="a-top-actions">
        <button type="button" class="a-focus-capsule" id="androidFocusCapsule" hidden>
          <span class="a-focus-cap-dot" aria-hidden="true"></span>
          <span class="a-focus-cap-time" id="androidFocusCapTime">25:00</span>
        </button>
        <div class="a-period-pill" id="androidPeriodPill" hidden>
          <button type="button" class="a-period-nav" id="androidPeriodPrev" aria-label="Previous">‹</button>
          <span class="a-period-label" id="androidPeriodLabel"></span>
          <button type="button" class="a-period-nav" id="androidPeriodNext" aria-label="Next">›</button>
        </div>
        <button type="button" class="a-topbar-cta" id="androidHabitsAddBtn" hidden></button>
        <button type="button" class="a-icon-btn" id="androidMoneyMoreBtn" hidden>${ICONS.dotsVert}</button>
        <button type="button" class="a-icon-btn" id="androidCardLibBtn">${ICONS.cardLib}</button>
        <button type="button" class="a-icon-btn" id="androidSettingsBtn">${ICONS.settings}</button>
      </div>
    `;
    main.prepend(topbar);

    const subtabs = document.createElement("div");
    subtabs.id = "androidHistorySubtabs";
    subtabs.className = "a-subtabs";
    subtabs.hidden = true;
    subtabs.setAttribute("role", "tablist");
    subtabs.innerHTML = ["timeline", "week", "review", "longrange"]
      .map(v => `<button type="button" class="a-subtab" role="tab" data-a-subview="${v}"></button>`)
      .join("");
    topbar.after(subtabs);

    // 3. Today View: Empty Today Card + New Phase-3 Android Today Container
    const todayView = document.getElementById("todayView");
    const emptyToday = document.createElement("section");
    emptyToday.id = "androidTodayEmpty";
    emptyToday.className = "a-empty-card";
    emptyToday.hidden = true;
    emptyToday.innerHTML = `
      <div class="a-empty-art">${ICONS.firstRunArt}</div>
      <h2 class="a-empty-title" id="androidEmptyTodayTitle"></h2>
      <p class="a-empty-desc" id="androidEmptyTodayDesc"></p>
      <div class="a-empty-actions">
        <button type="button" class="a-btn-primary" id="androidEmptyTodayCta"></button>
        <button type="button" class="a-empty-link" id="androidEmptyTodaySample">${ICONS.eye}<span></span></button>
      </div>
    `;

    const todayRoot = document.createElement("div");
    todayRoot.id = "androidTodayRoot";
    todayRoot.className = "a-today-root";
    todayRoot.hidden = true;
    todayView?.prepend(todayRoot);
    todayView?.prepend(emptyToday);

    // 3b. Phase 5 dedicated view roots inside shared view sections
    const mountRoot = (parentId, id, cls) => {
      const parent = document.getElementById(parentId);
      const el = document.createElement("div");
      el.id = id;
      el.className = cls;
      el.hidden = true;
      parent?.prepend(el);
      return el;
    };
    const moneyRoot = mountRoot("ledgerView", "androidMoneyRoot", "a-view-root a-money-root");
    const timelineRoot = mountRoot("timelineView", "androidTimelineRoot", "a-view-root a-timeline-root");
    const weekRoot = mountRoot("weekView", "androidWeekRoot", "a-view-root a-week-root");
    const monthRoot = mountRoot("reviewView", "androidMonthRoot", "a-view-root a-month-root");
    const horizonRoot = mountRoot("longrangeView", "androidHorizonRoot", "a-view-root a-horizon-root");
    const habitsRoot = mountRoot("habitsView", "androidHabitsRoot", "a-view-root a-habits-root");

    // 4. 4-Tab + Center FAB Bottom Navigation Bar
    const bottomNav = document.createElement("nav");
    bottomNav.id = "androidBottomNav";
    bottomNav.className = "a-bottom-nav";
    bottomNav.setAttribute("aria-label", "Navigation");
    bottomNav.innerHTML = `
      <button type="button" class="a-nav-item" data-a-tab="today"><span class="a-nav-pill">${ICONS.today}</span><span class="a-nav-label"></span></button>
      <button type="button" class="a-nav-item" data-a-tab="ledger"><span class="a-nav-pill">${ICONS.ledger}</span><span class="a-nav-label"></span></button>
      <div class="a-fab-slot"><button type="button" class="a-fab" id="androidFab">${ICONS.plus}</button></div>
      <button type="button" class="a-nav-item" data-a-tab="timeline"><span class="a-nav-pill">${ICONS.timeline}</span><span class="a-nav-label"></span></button>
      <button type="button" class="a-nav-item" data-a-tab="habits"><span class="a-nav-pill">${ICONS.habits}</span><span class="a-nav-label"></span></button>
    `;
    document.body.append(bottomNav);

    // 5. 2-Screen Welcome Overlay
    const welcome = document.createElement("section");
    welcome.id = "androidWelcome";
    welcome.className = "a-welcome";
    welcome.hidden = true;
    welcome.setAttribute("role", "dialog");
    welcome.setAttribute("aria-modal", "true");
    document.body.append(welcome);

    // 6. Draggable Bottom Sheet Primitive (Capture / Card Library / Photo Focus)
    const sheetBackdrop = document.createElement("div");
    sheetBackdrop.id = "androidSheetBackdrop";
    sheetBackdrop.className = "a-sheet-backdrop";
    sheetBackdrop.setAttribute("aria-hidden", "true");
    sheetBackdrop.inert = true;
    sheetBackdrop.innerHTML = `
      <div class="a-sheet" id="androidSheet" role="dialog" aria-modal="true" aria-labelledby="androidSheetTitle">
        <div class="a-sheet-handle-zone" id="androidSheetHandle"><span class="a-sheet-handle" aria-hidden="true"></span></div>
        <div id="androidSheetBody"></div>
      </div>
    `;
    document.body.append(sheetBackdrop);

    // 7. Full-screen Photo Lightbox (l014: tap outside to dismiss, zero buttons on card face)
    const lightbox = document.createElement("div");
    lightbox.id = "androidPhotoLightbox";
    lightbox.className = "a-lightbox";
    lightbox.hidden = true;
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    document.body.append(lightbox);

    // 8. Phase 5 Full-Screen Focus Timer Overlay (10-focus, l019)
    const focusOverlay = document.createElement("section");
    focusOverlay.id = "androidFocusOverlay";
    focusOverlay.className = "a-focus-overlay";
    focusOverlay.hidden = true;
    focusOverlay.setAttribute("role", "dialog");
    focusOverlay.setAttribute("aria-modal", "true");
    document.body.append(focusOverlay);

    // 9. Phase 5 Undo Snackbar (5 s, above bottom bar, never covers FAB)
    const snackbar = document.createElement("div");
    snackbar.id = "androidSnackbar";
    snackbar.className = "a-snackbar";
    snackbar.hidden = true;
    snackbar.setAttribute("role", "status");
    snackbar.setAttribute("aria-live", "polite");
    snackbar.innerHTML = `<span class="a-snackbar-msg" id="androidSnackbarMsg"></span><button type="button" class="a-snackbar-undo" id="androidSnackbarUndo"></button>`;
    document.body.append(snackbar);

    // 10. Phase 6 Launch Quote Splash Overlay (full-screen) & Splash Settings Sub-page
    const splashOverlay = document.createElement("section");
    splashOverlay.id = "androidSplashOverlay";
    splashOverlay.className = "a-splash-overlay";
    splashOverlay.hidden = true;
    splashOverlay.setAttribute("role", "dialog");
    splashOverlay.setAttribute("aria-modal", "true");
    document.body.append(splashOverlay);

    const splashSettingsOverlay = document.createElement("section");
    splashSettingsOverlay.id = "androidSplashSettingsOverlay";
    splashSettingsOverlay.className = "a-subpage-overlay a-splash-settings-overlay";
    splashSettingsOverlay.hidden = true;
    splashSettingsOverlay.setAttribute("role", "dialog");
    splashSettingsOverlay.setAttribute("aria-modal", "true");
    document.body.append(splashSettingsOverlay);

    // 11. Phase 7 Full-Screen Settings & Local Backup Overlay (11-settings-backup)
    const settingsOverlay = document.createElement("section");
    settingsOverlay.id = "androidSettingsOverlay";
    settingsOverlay.className = "a-subpage-overlay a-settings-overlay";
    settingsOverlay.hidden = true;
    settingsOverlay.setAttribute("role", "dialog");
    settingsOverlay.setAttribute("aria-modal", "true");
    document.body.append(settingsOverlay);

    els = {
      ribbon,
      topbar,
      subtabs,
      emptyToday,
      todayRoot,
      moneyRoot,
      timelineRoot,
      weekRoot,
      monthRoot,
      horizonRoot,
      habitsRoot,
      bottomNav,
      fab: bottomNav.querySelector("#androidFab"),
      welcome,
      sheetBackdrop,
      sheet: sheetBackdrop.querySelector("#androidSheet"),
      sheetHandle: sheetBackdrop.querySelector("#androidSheetHandle"),
      sheetBody: sheetBackdrop.querySelector("#androidSheetBody"),
      lightbox,
      focusOverlay,
      snackbar,
      splashOverlay,
      splashSettingsOverlay,
      settingsOverlay,
    };

    bindEvents();
  }

  function bindEvents() {
    els.ribbon.querySelector("#androidDemoExit").addEventListener("click", () => exitDemo());
    els.topbar.querySelector("#androidSettingsBtn").addEventListener("click", () => openSettingsOverlay());
    els.topbar.querySelector("#androidCardLibBtn").addEventListener("click", () => openCardLibrarySheet());
    els.topbar.querySelector("#androidBackTodayBtn").addEventListener("click", () => {
      const todayIso = core()?.getTodayIso?.();
      if (todayIso) core()?.selectDate?.(todayIso);
    });
    els.topbar.querySelector("#androidFocusCapsule").addEventListener("click", () => openFocusOverlay());
    els.topbar.querySelector("#androidMoneyMoreBtn").addEventListener("click", () => openMoneyMenuSheet());
    els.topbar.querySelector("#androidHabitsAddBtn").addEventListener("click", () => core()?.openAddHabit?.());
    els.topbar.querySelector("#androidPeriodPrev").addEventListener("click", () => shiftActivePeriod(-1));
    els.topbar.querySelector("#androidPeriodNext").addEventListener("click", () => shiftActivePeriod(1));
    els.snackbar.querySelector("#androidSnackbarUndo").addEventListener("click", () => {
      const fn = snackbarUndoFn;
      hideSnackbar();
      if (typeof fn === "function") fn();
    });

    els.bottomNav.addEventListener("click", e => {
      const tabBtn = e.target.closest("[data-a-tab]");
      if (tabBtn) {
        const target = tabBtn.dataset.aTab;
        if (target && PRIMARY_TABS.has(target)) {
          core()?.switchToView?.(target);
          syncUI();
          pushBackStateIfNeeded();
        }
        return;
      }
      if (e.target.closest("#androidFab")) {
        openSheet("mood", { fromFab: true });
      }
    });

    els.subtabs.addEventListener("click", e => {
      const btn = e.target.closest("[data-a-subview]");
      if (!btn) return;
      core()?.switchToView?.(btn.dataset.aSubview);
      syncUI();
      pushBackStateIfNeeded();
    });

    els.emptyToday.querySelector("#androidEmptyTodayCta").addEventListener("click", () => openSheet("mood", { fromFab: false }));
    els.emptyToday.querySelector("#androidEmptyTodaySample").addEventListener("click", () => enterDemo());

    // Sheet backdrop tap-to-close
    els.sheetBackdrop.addEventListener("click", e => {
      if (e.target === els.sheetBackdrop) closeSheet();
    });

    // Lightbox tap outside to close
    els.lightbox.addEventListener("click", e => {
      if (e.target === els.lightbox || e.target.closest("[data-lb-close]")) {
        closeLightbox();
        return;
      }
      if (e.target.closest("[data-lb-focus]")) {
        closeLightbox();
        openPhotoFocusSheet();
        return;
      }
      if (e.target.closest("[data-lb-prev]")) {
        const list = activeWallList();
        if (list.length > 1) {
          wallIndex = (wallIndex - 1 + list.length) % list.length;
          renderLightbox();
          syncUI();
        }
        return;
      }
      if (e.target.closest("[data-lb-next]")) {
        const list = activeWallList();
        if (list.length > 1) {
          wallIndex = (wallIndex + 1) % list.length;
          renderLightbox();
          syncUI();
        }
      }
    });

    // Sheet drag-to-dismiss with damping
    let dragStartY = 0;
    let dragDelta = 0;
    let dragging = false;
    els.sheetHandle.addEventListener("pointerdown", e => {
      dragging = true;
      dragStartY = e.clientY;
      dragDelta = 0;
      els.sheet.classList.add("is-dragging");
      els.sheetHandle.setPointerCapture?.(e.pointerId);
    });
    els.sheetHandle.addEventListener("pointermove", e => {
      if (!dragging) return;
      dragDelta = Math.max(0, e.clientY - dragStartY);
      els.sheet.style.transform = `translateY(${dragDelta}px)`;
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      els.sheet.classList.remove("is-dragging");
      els.sheet.style.transform = "";
      if (dragDelta > 76) closeSheet();
      dragDelta = 0;
    };
    els.sheetHandle.addEventListener("pointerup", endDrag);
    els.sheetHandle.addEventListener("pointercancel", endDrag);

    // Predictive Back via keyboard Escape / BrowserBack & popstate
    window.addEventListener("keydown", e => {
      if (e.key === "Escape" || e.key === "BrowserBack") {
        if (lightboxOpen || sheetOpen || window.LifeLedgerMoneyUI?._ui?.import?.open || welcomeStep === 2) {
          e.preventDefault();
          handleBack();
        }
      }
    });
    window.addEventListener("popstate", () => {
      handleBack({ fromPopstate: true });
    });

    // Re-sync whenever shared core re-renders (language/theme/state/view changes)
    window.addEventListener("life-ledger-rendered", () => syncUI());
    window.addEventListener("life-ledger-weather-updated", () => {
      weatherRevision += 1;
      syncSettingsWeatherRow();
      syncUI();
      if (sheetOpen && sheetMode === "weather") renderWeatherSheetContent();
    });
    window.addEventListener("online", () => {
      window.LifeLedgerTodayWidgets?.weather?.refresh?.(true);
    });
    window.addEventListener("offline", () => {
      weatherRevision += 1;
      syncSettingsWeatherRow();
      syncUI();
    });
    window.addEventListener("life-ledger-focus-tick", () => {
      focusRevision += 1;
      afterNextPaint(() => {
        syncFocusCapsule();
        if (focusOpen) renderFocusOverlay();
        const fs = core()?.getFocusState?.();
        const clock = els.todayRoot?.querySelector("#androidFocusCard .a-big-val");
        if (clock && fs?.snapshot) clock.textContent = fs.remainingText;
        else if (getActiveView() === "today" && clock?.dataset.running === "true") syncUI();
        if (clock) clock.dataset.running = String(Boolean(fs?.snapshot));
      });
    });
  }

  function pushBackStateIfNeeded() {
    try {
      if (location.protocol !== "file:") {
        history.pushState({ androidBackGuard: true }, "", location.href);
      }
    } catch {}
  }

  /* ============================================================================
     Phase 3: Rebuilt Android Today View
     ============================================================================ */

  function weatherBridge() {
    return window.LifeLedgerTodayWidgets?.weather || null;
  }

  function localizedCityName(rawName) {
    const name = String(rawName || "").trim();
    if (!name) return t().today.weatherSlotCity;
    if (lang() === "zh") {
      if (name === "Berlin") return "柏林";
      if (name === "London") return "伦敦";
      if (name === "Beijing") return "北京";
      if (name === "Munich") return "慕尼黑";
      if (name === "Tokyo") return "东京";
      if (name === "New York") return "纽约";
    }
    if (lang() === "de" && name === "Munich") return "München";
    return name;
  }

  function weatherKindIcon(kindKey, hourNum) {
    const night = Number.isFinite(hourNum) && (hourNum >= 20 || hourNum < 6);
    if (kindKey === "rain") return ICONS.rainSmall;
    if (kindKey === "snow") return ICONS.snowSmall;
    if (kindKey === "storm") return ICONS.stormSmall;
    if (kindKey === "clear") return night ? ICONS.moonSmall : ICONS.sunSmall;
    return night ? ICONS.moonSmall : ICONS.cloud;
  }

  function renderWeatherSlot(copy, selectedDate) {
    const dark = isDark();
    const gradId = dark ? "aWFillD" : "aWFillL";
    const strokeCol = dark ? "#7BB5FF" : "#3B82C4";
    const mutedCol = dark ? "#9CA3AF" : "#5B625E";
    const baseCol = dark ? "rgba(240,246,244,0.1)" : "rgba(24,34,30,0.08)";
    const dotFill = dark ? "#152130" : "#FFFFFF";

    const snap = weatherBridge()?.getSnapshot?.(selectedDate) || null;
    const city = localizedCityName(snap?.city?.name || copy.today.weatherSlotCity);
    const win = snap?.window || null;
    const curve = win ? buildWeatherCurveModel(win.hours, snap.cityNow, win.isToday) : null;
    const isOffline = Boolean(snap?.offline);
    const hasLive = Boolean(snap?.forecast && win && curve);

    let timeStr = "";
    let tempStr = "—°";
    let condStr = isOffline ? copy.today.weatherOfflineSub : copy.today.weatherSlotSub;
    let rangeStr = copy.today.weatherSlotRange;
    let weatherIcon = dark ? ICONS.moonSmall : ICONS.cloud;

    if (hasLive) {
      const nowStr = snap.cityNow || snap.forecast.current?.time || "";
      const hh = Number(nowStr.slice(11, 13));
      timeStr = win.isToday && nowStr.length >= 16 ? nowStr.slice(11, 16) : formatShortDate(win.day);
      const curIdx = win.isToday
        ? Math.max(0, win.hours.findIndex(h => h.time.slice(0, 13) === nowStr.slice(0, 13)))
        : Math.min(12, win.hours.length - 1);
      const refHour = win.hours[curIdx] || win.hours[0];
      const tempVal = win.isToday && Number.isFinite(snap.forecast.current?.temperature_2m)
        ? snap.forecast.current.temperature_2m
        : refHour.temperature;
      const codeVal = win.isToday && Number.isFinite(snap.forecast.current?.weather_code)
        ? snap.forecast.current.weather_code
        : refHour.code;
      const k = snap.kind ? snap.kind(codeVal ?? 0) : "cloud";
      tempStr = `${Math.round(tempVal)}°`;
      condStr = snap.label ? snap.label(k) : k;
      weatherIcon = weatherKindIcon(k, win.isToday ? hh : 12);

      const maxProb = Math.max(0, ...win.hours.map(h => Number(h.probability) || 0));
      const parts = [];
      if (win.high != null) parts.push(`↑${Math.round(win.high)}°`);
      if (win.low != null) parts.push(`↓${Math.round(win.low)}°`);
      if (!isOffline && maxProb > 0) parts.push(copy.today.weatherPrecip(Math.round(maxProb)));
      rangeStr = parts.join(" · ") || copy.today.weatherSlotRange;
    }

    const offlinePill = isOffline
      ? `<span class="a-w-offline-pill" id="androidWeatherOfflinePill">${escapeHtml(copy.today.weatherOfflineBadge)}</span>`
      : "";

    const svgInner = curve
      ? `
        <line x1="10" y1="${curve.baseY}" x2="206" y2="${curve.baseY}" stroke="${baseCol}" stroke-width="1"/>
        <path d="${curve.areaPath}" fill="url(#${gradId})"/>
        <path d="${curve.linePath}" stroke="${strokeCol}" stroke-width="2.1" stroke-linecap="round"/>
        <text x="${curve.maxPt.x}" y="${curve.maxPt.y}" font-size="9.5" font-weight="700" fill="${strokeCol}" text-anchor="middle">${curve.maxPt.label}</text>
        ${curve.minPt.show ? `<text x="${curve.minPt.x}" y="${curve.minPt.y}" font-size="9" font-weight="600" fill="${mutedCol}" text-anchor="middle">${curve.minPt.label}</text>` : ""}
        ${curve.nowX != null ? `<line x1="${curve.nowX}" y1="10" x2="${curve.nowX}" y2="${curve.baseY}" stroke="${strokeCol}" stroke-width="1.3" stroke-dasharray="3 2.5"/>` : ""}
        ${curve.nowX != null && curve.nowY != null ? `<circle cx="${curve.nowX}" cy="${curve.nowY}" r="4.3" fill="${dotFill}" stroke="${strokeCol}" stroke-width="2.2"/>` : ""}
        <g font-size="9.5" font-weight="600" fill="${mutedCol}" text-anchor="middle">
          ${curve.ticks.map(tk => `<text x="${tk.x}" y="63">${tk.label}</text>`).join("")}
        </g>
      `
      : `
        <line x1="10" y1="51" x2="206" y2="51" stroke="${baseCol}" stroke-width="1"/>
        <path d="M10 38 C52 38, 86 24, 108 24 C132 24, 164 36, 206 38" stroke="${strokeCol}" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="4 3" opacity="0.5"/>
        <g font-size="9.5" font-weight="600" fill="${mutedCol}" text-anchor="middle">
          <text x="12" y="63">00</text>
          <text x="59" y="63">06</text>
          <text x="108" y="63">12</text>
          <text x="157" y="63">18</text>
          <text x="204" y="63">24</text>
        </g>
      `;

    return `
      <button type="button" class="a-weather-card${hasLive ? "" : " is-placeholder"}${isOffline ? " is-offline" : ""}" data-a-card="weather" id="androidWeatherCard" aria-label="${escapeHtml(`${copy.cardLib.names.weather} · ${city}`)}">
        <div class="a-w-left">
          <div class="a-w-city-row">
            <span class="a-chip-ic a-chip-sky">${weatherIcon}</span>
            <span class="a-w-city">${escapeHtml(city)}</span>
            ${timeStr ? `<span class="a-w-time">${escapeHtml(timeStr)}</span>` : ""}
          </div>
          <div class="a-w-temp-row">
            <span class="a-w-temp">${escapeHtml(tempStr)}</span>
            <span class="a-w-cond">${escapeHtml(condStr)}</span>
          </div>
          <div class="a-w-range"><span>${escapeHtml(rangeStr)}</span>${offlinePill}</div>
        </div>
        <div class="a-w-chart-wrap" aria-hidden="true">
          <svg viewBox="0 0 216 68" width="100%" height="100%" preserveAspectRatio="none" fill="none">
            <defs>
              <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${strokeCol}" stop-opacity="${dark ? "0.28" : "0.22"}"/>
                <stop offset="100%" stop-color="${strokeCol}" stop-opacity="0.01"/>
              </linearGradient>
            </defs>
            ${svgInner}
          </svg>
        </div>
      </button>
    `;
  }

  function renderToday() {
    if (!els.todayRoot) return;
    const c = core();
    const copy = t();
    const view = getActiveView();
    const demoActive = Boolean(c?.isIsolatedDemoActive?.());
    const hasUserData = Boolean(c?.hasUserData?.());

    if (view !== "today" || (!demoActive && !hasUserData)) {
      els.todayRoot.hidden = true;
      return;
    }

    els.todayRoot.hidden = false;
    if (!demoActive && !userWallLoaded) whenIdle(() => { void ensureUserWallLoaded(); });

    const todayIso = c?.getTodayIso?.() || toIsoDate(new Date());
    const selectedDate = c?.getSelectedDate?.() || todayIso;
    const isFuture = isAndroidDateReadOnly(selectedDate, todayIso);
    const isOffToday = shouldShowBackToToday(selectedDate, todayIso);
    const log = c?.getLog?.(selectedDate) || { mood: "", completed: [], note: "", moodReason: "" };
    const raw = c?.getState?.() || {};
    if (!panelChanged(els.todayRoot, [selectedDate, raw.logs, raw.habits, raw.focusSessions,
      raw.ledger, raw.quoteSettings, loadCardsPref(), currentWallPhoto(), weatherRevision, focusRevision])) return;

    // Preserve horizontal scroll position of habit rail across re-renders
    const prevRail = els.todayRoot.querySelector("#androidHabitRail");
    if (prevRail) habitRailScrollLeft = prevRail.scrollLeft;

    // 1. 7-Day Swipeable Date Strip
    const weekDays = buildWeekDays(selectedDate, todayIso);
    const dateStripHtml = `
      <div class="a-date-strip" id="androidDateStrip" role="tablist" aria-label="${escapeHtml(copy.titles.today)}">
        ${weekDays
          .map(d => {
            const dLog = c?.getLog?.(d.iso) || {};
            const moodColor =
              dLog.mood === "很好"
                ? "var(--a-good)"
                : dLog.mood === "平静"
                  ? "var(--a-calm)"
                  : dLog.mood === "低落"
                    ? "var(--a-low)"
                    : "";
            const dotStyle = d.isFuture ? "" : moodColor ? `background:${moodColor}` : "background:var(--a-outline-strong);opacity:0.45";
            return `
              <button type="button" class="a-day-pill${d.isSelected ? " is-active" : ""}${d.isFuture ? " is-future" : ""}" data-a-date="${d.iso}" role="tab" aria-selected="${d.isSelected}">
                <span class="a-dow">${escapeHtml(copy.weekdays[d.weekdayIndex] || "")}</span>
                <span class="a-num">${d.dayNum}</span>
                <span class="a-mdot" style="${dotStyle}" aria-hidden="true"></span>
              </button>
            `;
          })
          .join("")}
      </div>
    `;

    const futureBannerHtml = isFuture
      ? `<div class="a-future-banner" id="androidFutureBanner" role="status">${ICONS.eye}<span>${escapeHtml(copy.futureNotice)}</span></div>`
      : "";

    // Build cards according to Android Card Library order (l029)
    const activeCards = loadCardsPref();
    const cardHtmlMap = {};

    // Quote line (same source as Launch Quote Splash & shared quoteSettings)
    const resolvedQuote = resolveSplashStyleAndQuote({
      dateIso: selectedDate,
      lang: lang(),
      quoteSettings: c?.getQuoteSettings?.() || null,
    });
    const quote = resolvedQuote.quote || { text: "", source: "" };
    const cleanQuote = String(quote.text || "").replace(/\s+/g, " ").trim();
    const cleanSource = String(quote.source || "").trim();
    const shortSource = cleanSource.length > 18 ? cleanSource.split(",")[0].trim() : cleanSource;
    cardHtmlMap.quote = cleanQuote
      ? `
      <button type="button" class="a-quote-strip" data-a-card="quote" id="androidQuoteStrip">
        <span class="a-quote-left">
          ${ICONS.quoteHorizon}
          <span class="a-quote-text">${escapeHtml(cleanQuote)}</span>
        </span>
        ${shortSource ? `<span class="a-quote-src">${escapeHtml(shortSource)}</span>` : ""}
      </button>
    `
      : "";

    // Weather card (Phase 4: live weather wired to weather-widget.js & today-widgets.js + offline cache fallback)
    cardHtmlMap.weather = renderWeatherSlot(copy, selectedDate);

    // Mood Card
    const moodTitle = isOffToday ? copy.today.moodTitlePast : copy.today.moodTitle;
    const moodDefs = [
      { key: "很好", icon: ICONS.moodGood, tone: "good" },
      { key: "平静", icon: ICONS.moodCalm, tone: "calm" },
      { key: "低落", icon: ICONS.moodLow, tone: "low" },
    ];
    const dayNoteText = String(log.note || log.moodReason || "").replace(/\s+/g, " ").trim();
    cardHtmlMap.mood = `
      <section class="a-card a-mood-card${isFuture ? " is-readonly" : ""}" data-a-card="mood">
        <div class="a-card-head">
          <div class="a-card-title-row">
            <span class="a-chip-ic a-chip-good">${ICONS.moodGood}</span>
            <h2 class="a-card-title">${escapeHtml(moodTitle)}</h2>
          </div>
        </div>
        <div class="a-mood-grid">
          ${moodDefs
            .map(m => {
              const sel = log.mood === m.key;
              return `
                <button type="button" class="a-mood-btn a-mood-${m.tone}${sel ? " is-selected" : ""}" data-a-today-mood="${m.key}" aria-pressed="${sel}" ${isFuture ? "disabled" : ""}>
                  <span class="a-mood-btn-ic">${m.icon}</span>
                  <span>${escapeHtml(copy.today.moods[m.key])}</span>
                </button>
              `;
            })
            .join("")}
        </div>
        ${
          dayNoteText
            ? `<button type="button" class="a-mood-note" id="androidMoodNoteBtn" ${isFuture ? "disabled" : ""}>${escapeHtml(copy.today.notePrefix + dayNoteText)}</button>`
            : ""
        }
      </section>
    `;

    // Horizontal Habit Strip (l03: completed sorted to end, tap bounce + FLIP)
    const rawHabits = c?.activeHabitsForDate?.(selectedDate) || [];
    const sortedHabits = sortAndroidHabits(rawHabits, log.completed || []);
    const doneSet = new Set(log.completed || []);
    const doneCount = rawHabits.filter(h => doneSet.has(h.id)).length;
    const habitsTitle = isOffToday ? copy.today.habitsTitlePast : copy.today.habitsTitle;

    cardHtmlMap.habits = `
      <section class="a-card a-habits-card${isFuture ? " is-readonly" : ""}" data-a-card="habits">
        <div class="a-card-head">
          <div class="a-card-title-row">
            <span class="a-chip-ic a-chip-primary">${ICONS.check}</span>
            <h2 class="a-card-title">${escapeHtml(habitsTitle)}</h2>
          </div>
          <span class="a-card-meta">${escapeHtml(copy.today.habitsDone(doneCount, rawHabits.length))}</span>
        </div>
        ${
          sortedHabits.length
            ? `
          <div class="a-habit-rail-wrap">
            <div class="a-habit-rail" id="androidHabitRail">
              ${sortedHabits
                .map(h => {
                  const done = doneSet.has(h.id);
                  const key = c?.getHabitIconKey?.(h) || "target";
                  const tone = habitIconTone(key);
                  const fullName = c?.displayHabitName?.(h) || h.name;
                  const shortName = shortHabitLabel(fullName);
                  return `
                    <button type="button" class="a-h-tile${done ? " is-done" : ""}" data-a-today-habit="${escapeHtml(h.id)}" aria-pressed="${done}" aria-label="${escapeHtml(fullName)}" ${isFuture ? "disabled" : ""}>
                      ${done ? `<span class="a-h-check" aria-hidden="true">${ICONS.checkSm}</span>` : ""}
                      <span class="a-h-ic" style="background:${tone.bg};color:${tone.fg};">${habitIconSvg(h, 16)}</span>
                      <span class="a-h-name">${escapeHtml(shortName)}</span>
                    </button>
                  `;
                })
                .join("")}
            </div>
          </div>
        `
            : `<p class="a-card-empty">${escapeHtml(copy.today.habitsEmpty)}</p>`
        }
      </section>
    `;

    // 2-Up Whole-Card-Tap Row: Focus (l019) + Today Spend (R2 + C110)
    const focusSum = c?.getFocusDaySummary?.(selectedDate) || { totalMinutes: 0, topics: [], running: false, remainingText: "" };
    const focusTopicsLine = focusSum.topics.length
      ? focusSum.topics.map(tp => `${tp.label} ${tp.minutes}`).join(" · ")
      : copy.today.focusEmptySub;
    const spendSum = c?.getSpendDaySummary?.(selectedDate) || { totalMinor: 0, formatted: "€0.00", count: 0, spark7: [] };
    const spendTitle = isOffToday ? copy.today.spendTitlePast : copy.today.spendTitle;
    const sparkBars = (spendSum.spark7 || []).length
      ? spendSum.spark7
      : Array.from({ length: 7 }, (_, i) => ({ heightPct: 16, isSelected: i === 6 }));

    cardHtmlMap.focusSpend = `
      <div class="a-two-up" data-a-card="focusSpend">
        <button type="button" class="a-mini-card a-focus-card" id="androidFocusCard">
          <div class="a-mini-head">
            <span class="a-mini-title">
              <span class="a-chip-ic a-chip-focus">${ICONS.focusIc}</span>
              <span>${escapeHtml(copy.today.focusTitle)}</span>
            </span>
            <span class="a-mini-chev" aria-hidden="true">${ICONS.chevron}</span>
          </div>
          <div class="a-mini-body">
            <div class="a-big-val">${focusSum.running && focusSum.remainingText ? escapeHtml(focusSum.remainingText) : `${focusSum.totalMinutes}<small>${escapeHtml(copy.today.focusUnit)}</small>`}</div>
            <div class="a-mini-sub">${escapeHtml(focusTopicsLine)}</div>
          </div>
        </button>

        <button type="button" class="a-mini-card a-spend-card" id="androidSpendCard">
          <div class="a-mini-head">
            <span class="a-mini-title">
              <span class="a-chip-ic a-chip-coral">${ICONS.euroIc}</span>
              <span>${escapeHtml(spendTitle)}</span>
            </span>
            <span class="a-mini-meta">${escapeHtml(copy.today.spendCount(spendSum.count))}</span>
          </div>
          <div class="a-mini-body">
            <div class="a-big-val is-coral">${escapeHtml(spendSum.formatted)}</div>
            <div class="a-spark7" aria-hidden="true">
              ${sparkBars
                .map(b => `<span class="a-sp-b${b.isSelected ? " is-today" : ""}" style="height:${b.heightPct}%"></span>`)
                .join("")}
            </div>
          </div>
        </button>
      </div>
    `;

    // Full-Bleed Photo Wall Card (l014: 6px thin border, zero buttons on face, focus point)
    const wallPhoto = currentWallPhoto();
    cardHtmlMap.wall = wallPhoto
      ? `
      <div class="a-photo-card" data-a-card="wall" id="androidPhotoWallCard" role="button" tabindex="0" aria-label="${escapeHtml(copy.cardLib.names.wall)}">
        <div class="a-photo-frame">
          <img src="${escapeHtml(wallPhoto.url)}" alt="${escapeHtml(wallPhoto.alt || copy.cardLib.names.wall)}" style="object-position:${wallPhoto.x ?? 50}% ${wallPhoto.y ?? 50}%;">
        </div>
      </div>
    `
      : `
      <button type="button" class="a-photo-card is-empty" data-a-card="wall" id="androidPhotoWallCard">
        <div class="a-photo-frame a-photo-empty-frame">
          <span class="a-photo-empty-ic">${ICONS.photoIc}</span>
          <strong>${escapeHtml(copy.today.wallEmptyTitle)}</strong>
          <span>${escapeHtml(copy.today.wallEmptySub)}</span>
        </div>
      </button>
    `;

    // Optional Card-Library-only Card: 7-Day Rhythm (l029: disabled by default)
    if (activeCards.includes("rhythm")) {
      const rhythmSum = c?.getRhythm7Summary?.(selectedDate) || { pct: 0, days: [] };
      cardHtmlMap.rhythm = `
        <section class="a-card a-rhythm-card" data-a-card="rhythm">
          <div class="a-card-head">
            <div class="a-card-title-row">
              <span class="a-chip-ic a-chip-primary">${ICONS.rhythmIc}</span>
              <h2 class="a-card-title">${escapeHtml(copy.today.rhythmTitle)}</h2>
            </div>
            <span class="a-card-meta">${rhythmSum.pct}%</span>
          </div>
          <div class="a-rhythm-bars">
            ${(rhythmSum.days || [])
              .map(d => {
                const dt = parseIsoDate(d.date);
                const wd = copy.weekdays[(dt.getDay() + 6) % 7] || "";
                return `<div class="a-rhythm-col${d.date === selectedDate ? " is-sel" : ""}"><div class="a-rhythm-track"><span style="height:${Math.max(8, d.pct)}%"></span></div><small>${escapeHtml(wd)}</small></div>`;
              })
              .join("")}
          </div>
        </section>
      `;
    }

    updateTodayRegion(els.todayRoot, "dates", dateStripHtml, selectedDate, isFuture);
    let content = els.todayRoot.querySelector(".a-today-content");
    if (!content) {
      content = document.createElement("div");
      content.className = "a-today-content";
      els.todayRoot.append(content);
    }
    const banner = updateTodayRegion(content, "future", futureBannerHtml, selectedDate, isFuture);
    if (banner && content.firstElementChild !== banner) content.prepend(banner);
    const shown = new Set(["future", ...activeCards]);
    for (const child of [...content.children]) if (!shown.has(child.dataset.aRegion)) child.remove();
    let index = banner ? 1 : 0;
    for (const id of activeCards) {
      const card = updateTodayRegion(content, id, cardHtmlMap[id] || "", selectedDate, isFuture);
      if (!card) continue;
      // Move only when the order changed; retained controls keep their state.
      if (content.children[index] !== card) content.insertBefore(card, content.children[index] || null);
      index += 1;
    }

    // Restore habit rail scroll & run pending FLIP animation if triggered
    const rail = els.todayRoot.querySelector("#androidHabitRail");
    if (rail) {
      rail.scrollLeft = habitRailScrollLeft;
      if (pendingFlip && !isReducedMotion()) {
        const { id: flippedId, firstRects } = pendingFlip;
        pendingFlip = null;
        runHabitFlipPlay(rail, flippedId, firstRects);
      } else {
        pendingFlip = null;
      }
    }
  }

  function runHabitFlipPlay(rail, flippedId, firstRects) {
    const tiles = [...rail.querySelectorAll("[data-a-today-habit]")];
    const moving = [];
    tiles.forEach(tile => {
      const id = tile.dataset.aTodayHabit;
      const first = firstRects.get(id);
      if (!first) return;
      const last = tile.getBoundingClientRect();
      const dx = first.left - last.left;
      if (Math.abs(dx) > 1 || id === flippedId) {
        tile.style.transition = "none";
        tile.style.transform = `translateX(${dx}px)${id === flippedId ? " scale(1.05)" : ""}`;
        if (id === flippedId) tile.classList.add("is-flip-moving");
        moving.push(tile);
      }
    });
    if (!moving.length) {
      habitAnimInFlight = false;
      return;
    }
    rail.dataset.animating = "habit-flip";
    void rail.offsetWidth; // force reflow before playing spring
    requestAnimationFrame(() => {
      moving.forEach(tile => {
        tile.style.transition = "transform 350ms var(--a-spring-fast)";
        tile.style.transform = "translateX(0) scale(1)";
      });
      setTimeout(() => {
        moving.forEach(tile => {
          tile.style.transition = "";
          tile.style.transform = "";
          tile.classList.remove("is-flip-moving");
        });
        delete rail.dataset.animating;
        habitAnimInFlight = false;
      }, 390);
    });
  }

  function wireTodayEvents(selectedDate, isFuture, root = els.todayRoot) {
    // 1. Date strip taps & horizontal week swipe
    const strip = root.querySelector("#androidDateStrip");
    if (strip) {
      let startX = null;
      let swiped = false;
      strip.addEventListener("pointerdown", e => {
        startX = e.clientX;
        swiped = false;
      });
      strip.addEventListener("pointerup", e => {
        if (startX === null) return;
        const dx = e.clientX - startX;
        startX = null;
        if (Math.abs(dx) > 48) {
          swiped = true;
          core()?.selectDate?.(shiftIsoDate(selectedDate, dx < 0 ? 7 : -7));
        }
      });
      strip.addEventListener("pointercancel", () => {
        startX = null;
      });
      strip.addEventListener("click", e => {
        if (swiped) {
          swiped = false;
          return;
        }
        const btn = e.target.closest("[data-a-date]");
        if (!btn) return;
        core()?.selectDate?.(btn.dataset.aDate);
      });
    }

    // 2. Quote tap -> Splash & Quote Settings (18-splash-settings); Weather card tap -> Weather City sheet
    root.querySelector("#androidQuoteStrip")?.addEventListener("click", () => {
      openSplashSettings();
    });
    root.querySelector("#androidWeatherCard")?.addEventListener("click", () => {
      openWeatherSheet();
    });

    // 3. Direct 1-tap Mood buttons (read-only on future dates)
    root.querySelectorAll("[data-a-today-mood]").forEach(btn => {
      btn.addEventListener("click", () => {
        if (isFuture) return;
        const mood = btn.dataset.aTodayMood;
        const cur = core()?.getLog?.(selectedDate)?.mood || "";
        core()?.setMood?.(selectedDate, cur === mood ? "" : mood);
      });
    });

    // 4. Mood note tap -> open Capture Sheet
    root.querySelector("#androidMoodNoteBtn")?.addEventListener("click", () => {
      if (isFuture) return;
      openSheet("mood", { fromFab: false });
    });

    // 5. Horizontal Habit tiles: bounce + FLIP move-to-end (l03)
    const rail = root.querySelector("#androidHabitRail");
    if (rail) {
      rail.addEventListener("scroll", () => {
        habitRailScrollLeft = rail.scrollLeft;
      });
      rail.querySelectorAll("[data-a-today-habit]").forEach(tile => {
        tile.addEventListener("click", () => {
          if (isFuture || habitAnimInFlight) return;
          const id = tile.dataset.aTodayHabit;
          if (!id) return;
          if (isReducedMotion()) {
            core()?.toggleHabitImmediate?.(selectedDate, id);
            return;
          }
          habitAnimInFlight = true;
          const firstRects = new Map();
          rail.querySelectorAll("[data-a-today-habit]").forEach(el => {
            firstRects.set(el.dataset.aTodayHabit, el.getBoundingClientRect());
          });
          const willBeDone = !tile.classList.contains("is-done");
          tile.classList.add("is-bouncing");
          if (willBeDone) {
            tile.classList.add("is-done-preview");
            if (!tile.querySelector(".a-h-check")) {
              tile.insertAdjacentHTML("afterbegin", `<span class="a-h-check" aria-hidden="true">${ICONS.checkSm}</span>`);
            }
          }
          rail.dataset.animating = "habit-bounce";
          setTimeout(() => {
            pendingFlip = { id, firstRects };
            core()?.toggleHabitImmediate?.(selectedDate, id);
          }, 160);
        });
      });
    }

    // 6. Whole-card tap: Focus & Today Spend (C110)
    root.querySelector("#androidFocusCard")?.addEventListener("click", () => {
      core()?.openFocus?.();
    });
    root.querySelector("#androidSpendCard")?.addEventListener("click", () => {
      core()?.openSpend?.(selectedDate);
    });

    // 7. Full-bleed Photo Wall: tap opens lightbox (or picker if empty); long-press opens focus adjuster
    const wallEl = root.querySelector("#androidPhotoWallCard");
    if (wallEl) {
      let pressTimer = 0;
      let longPressed = false;
      wallEl.addEventListener("pointerdown", () => {
        longPressed = false;
        if (!currentWallPhoto()) return;
        pressTimer = setTimeout(() => {
          longPressed = true;
          openPhotoFocusSheet();
        }, 460);
      });
      const cancelPress = () => {
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = 0;
        }
      };
      wallEl.addEventListener("pointerup", cancelPress);
      wallEl.addEventListener("pointercancel", cancelPress);
      wallEl.addEventListener("pointermove", cancelPress);
      wallEl.addEventListener("click", () => {
        if (longPressed) {
          longPressed = false;
          return;
        }
        if (!currentWallPhoto()) {
          openPhotoFocusSheet();
        } else {
          openLightbox();
        }
      });
      wallEl.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!currentWallPhoto()) openPhotoFocusSheet();
          else openLightbox();
        }
      });
    }
  }

  /* ============================================================================
     Photo Lightbox & Focus-Point Adjuster Sheet (l014)
     ============================================================================ */

  function openLightbox() {
    if (!currentWallPhoto()) return;
    lightboxOpen = true;
    renderLightbox();
    els.lightbox.hidden = false;
    requestAnimationFrame(() => els.lightbox.classList.add("is-open"));
    pushBackStateIfNeeded();
  }

  function closeLightbox() {
    if (!lightboxOpen) return;
    lightboxOpen = false;
    els.lightbox.classList.remove("is-open");
    setTimeout(() => {
      if (!lightboxOpen) els.lightbox.hidden = true;
    }, isReducedMotion() ? 0 : 200);
  }

  function renderLightbox() {
    const photo = currentWallPhoto();
    if (!photo || !els.lightbox) return;
    const copy = t().today;
    const list = activeWallList();
    els.lightbox.innerHTML = `
      <div class="a-lb-inner">
        <img class="a-lb-img" src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.alt || "")}">
        <div class="a-lb-bar">
          ${list.length > 1 ? `<button type="button" class="a-lb-btn" data-lb-prev aria-label="Previous">‹</button>` : ""}
          <button type="button" class="a-lb-btn" data-lb-focus>${ICONS.photoIc}<span>${escapeHtml(copy.wallLightboxFocus)}</span></button>
          ${list.length > 1 ? `<button type="button" class="a-lb-btn" data-lb-next aria-label="Next">›</button>` : ""}
          <button type="button" class="a-lb-btn is-close" data-lb-close>${escapeHtml(copy.wallLightboxClose)}</button>
        </div>
      </div>
    `;
  }

  /* ============================================================================
     Welcome (2-Screen Onboarding)
     ============================================================================ */

  function renderWelcome() {
    if (!els.welcome || splashOpen || !els.splashOverlay.hidden) return;
    els.welcome.hidden = welcomeStep === 0;
    els.bottomNav.hidden = welcomeStep !== 0;
    if (welcomeStep === 0) {
      els.welcome.replaceChildren();
      return;
    }
    const w = t().welcome;
    els.welcome.innerHTML = welcomeStep === 1 ? `
      <div class="a-welcome-step" data-step="1">
        <div class="a-w-topbar">
          <div class="a-brand-pill">${ICONS.appIcon}<span>Life Ledger</span></div>
          <button type="button" class="a-skip-btn" data-w-action="start">${escapeHtml(w.skip)}</button>
        </div>
        <div class="a-w-body">
          <div class="a-hero-art">
            <div class="a-float-pill tl"><span class="a-pill-dot" style="background:var(--a-good)"></span>${escapeHtml(w.pill1)}</div>
            ${ICONS.morningArt}
            <div class="a-float-pill br"><span class="a-pill-dot" style="background:var(--a-calm)"></span>${escapeHtml(w.pill2)}</div>
          </div>
          <div class="a-w-kicker">${escapeHtml(w.kicker1)}</div>
          <h1 class="a-w-title">${escapeHtml(w.title1)}</h1>
          <div class="a-w-tagline">${escapeHtml(w.tagline1)}</div>
          <div class="a-features">
            <div class="a-feat">
              <div class="a-feat-ic" style="background:var(--a-good-soft);color:var(--a-good-fg);">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>
              </div>
              <div class="a-feat-copy">
                <div class="a-feat-title">${escapeHtml(w.feat1t)}</div>
                <div class="a-feat-sub">${escapeHtml(w.feat1s)}</div>
              </div>
            </div>
            <div class="a-feat">
              <div class="a-feat-ic" style="background:var(--a-primary-soft);color:var(--a-primary);">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18"/><path d="M7 15h4"/></svg>
              </div>
              <div class="a-feat-copy">
                <div class="a-feat-title">${escapeHtml(w.feat2t)}</div>
                <div class="a-feat-sub">${escapeHtml(w.feat2s)}</div>
              </div>
            </div>
            <div class="a-feat">
              <div class="a-feat-ic" style="background:var(--a-focus-soft);color:var(--a-focus);">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2.5"/><path d="M8 20h8M12 16v4"/></svg>
              </div>
              <div class="a-feat-copy">
                <div class="a-feat-title">${escapeHtml(w.feat3t)}</div>
                <div class="a-feat-sub">${escapeHtml(w.feat3s)}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="a-w-footer">
          <div class="a-dots" aria-hidden="true"><span class="a-dot is-active"></span><span class="a-dot"></span></div>
          <button type="button" class="a-btn-primary" data-w-action="next">${escapeHtml(w.next)} <span aria-hidden="true">→</span></button>
        </div>
      </div>
    ` : `
      <div class="a-welcome-step" data-step="2">
        <div class="a-w-topbar">
          <button type="button" class="a-back-btn" data-w-action="prev" aria-label="${escapeHtml(w.backAria)}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        </div>
        <div class="a-w-body">
          <div class="a-art-card">
            ${ICONS.localArt}
            <div class="a-lock-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
              <span>${escapeHtml(w.lock)}</span>
            </div>
          </div>
          <div class="a-w-kicker">${escapeHtml(w.kicker2)}</div>
          <h1 class="a-w-title">${escapeHtml(w.title2)}</h1>
          <div class="a-w-tagline">${escapeHtml(w.lead2)}</div>
          <div class="a-promise-card">
            <div class="a-p-row">
              <div class="a-p-ic">${ICONS.check}</div>
              <div>
                <div class="a-p-title">${escapeHtml(w.p1t)}</div>
                <div class="a-p-desc">${escapeHtml(w.p1s)}</div>
              </div>
            </div>
            <div class="a-p-row">
              <div class="a-p-ic sky"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M17.5 19H7a5 5 0 0 1-.5-9.98A6 6 0 0 1 18.2 10.5 4.2 4.2 0 0 1 17.5 19z"/></svg></div>
              <div>
                <div class="a-p-title">${escapeHtml(w.p2t)}</div>
                <div class="a-p-desc">${escapeHtml(w.p2s)}</div>
              </div>
            </div>
            <div class="a-p-row">
              <div class="a-p-ic">${ICONS.check}</div>
              <div>
                <div class="a-p-title">${escapeHtml(w.p3t)}</div>
                <div class="a-p-desc">${escapeHtml(w.p3s)}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="a-w-footer">
          <div class="a-dots" aria-hidden="true"><span class="a-dot"></span><span class="a-dot is-active"></span></div>
          <button type="button" class="a-btn-primary" data-w-action="start">${escapeHtml(w.start)} <span aria-hidden="true">→</span></button>
          <div class="a-btn-row">
            <button type="button" class="a-btn-secondary is-demo" data-w-action="sample">${ICONS.eye}<span>${escapeHtml(w.sample)}</span></button>
            <button type="button" class="a-btn-secondary" data-w-action="import">${ICONS.upload}<span>${escapeHtml(w.importBackup)}</span></button>
          </div>
        </div>
      </div>
    `;
    els.welcome.querySelectorAll("[data-w-action]").forEach(btn => {
      btn.addEventListener("click", () => {
        const act = btn.dataset.wAction;
        if (act === "next") {
          welcomeStep = 2;
          renderWelcome();
          pushBackStateIfNeeded();
        } else if (act === "prev") {
          welcomeStep = 1;
          renderWelcome();
        } else if (act === "start") {
          completeWelcome();
        } else if (act === "sample") {
          completeWelcome();
          enterDemo();
        } else if (act === "import") {
          completeWelcome();
          openBackupImportSheet();
        }
      });
    });
  }

  function completeWelcome() {
    try { localStorage.setItem(ONBOARDED_KEY, "1"); } catch {}
    welcomeStep = 0;
    renderWelcome();
    syncUI();
  }

  function showWelcome(step = 1) {
    welcomeStep = step === 2 ? 2 : 1;
    renderWelcome();
  }

  /* ============================================================================
     Bottom Sheet (Capture Sheet with FAB Morph, Card Library, Photo Focus)
     ============================================================================ */

  function presentSheet({ fromFab = false } = {}) {
    sheetOpen = true;
    els.sheet.classList.toggle("is-from-fab", Boolean(fromFab && !isReducedMotion()));
    if (els.fab && fromFab) els.fab.classList.add("is-morphed");
    document.documentElement.classList.add("a-sheet-open");
    els.sheetBackdrop.classList.add("is-open");
    els.sheetBackdrop.inert = false;
    els.sheetBackdrop.setAttribute("aria-hidden", "false");
    pushBackStateIfNeeded();
  }

  function openSheet(segment = "mood", { fromFab = false } = {}) {
    const c = core();
    const todayIso = c?.getTodayIso?.() || toIsoDate(new Date());
    const sel = c?.getSelectedDate?.() || todayIso;
    // Future dates are read-only; capturing always targets today when browsing a future date
    sheetTargetDate = isAndroidDateReadOnly(sel, todayIso) ? todayIso : sel;
    const log = c?.getLog?.(sheetTargetDate) || { mood: "", completed: [], note: "" };
    sheetMode = "capture";
    sheetSegment = segment;
    draftMood = log.mood || "";
    draftHabits = new Set(log.completed || []);
    draftNote = log.note || "";
    renderSheetContent();
    presentSheet({ fromFab });
  }

  function openCardLibrarySheet() {
    sheetMode = "cardlib";
    renderSheetContent();
    presentSheet({ fromFab: false });
  }

  function openPhotoFocusSheet() {
    sheetMode = "photo";
    renderSheetContent();
    presentSheet({ fromFab: false });
  }

  function openWeatherSheet() {
    sheetMode = "weather";
    renderSheetContent();
    presentSheet({ fromFab: false });
  }

  const WEATHER_PRESETS = [
    { name: "Berlin", zh: "柏林", de: "Berlin", latitude: 52.52, longitude: 13.405 },
    { name: "北京", zh: "北京", de: "Peking", en: "Beijing", latitude: 39.9042, longitude: 116.4074 },
    { name: "London", zh: "伦敦", de: "London", latitude: 51.5072, longitude: -0.1276 },
    { name: "Munich", zh: "慕尼黑", de: "München", latitude: 48.1351, longitude: 11.582 },
    { name: "Tokyo", zh: "东京", de: "Tokio", latitude: 35.6762, longitude: 139.6503 },
    { name: "New York", zh: "纽约", de: "New York", latitude: 40.7128, longitude: -74.006 },
  ];

  let weatherSearchAbort = null;

  function renderWeatherSheetContent() {
    const copy = t().today;
    const wb = weatherBridge();
    const snap = wb?.getSnapshot?.() || null;
    const activeCityName = localizedCityName(snap?.city?.name || copy.weatherSlotCity);
    const l = lang();
    const offline = Boolean(snap?.offline);

    els.sheetBody.innerHTML = `
      <div class="a-sheet-head">
        <h2 class="a-sheet-title" id="androidSheetTitle">${escapeHtml(copy.weatherSheetTitle)}</h2>
        ${offline ? `<span class="a-w-offline-pill">${escapeHtml(copy.weatherOfflineBadge)}</span>` : ""}
      </div>
      <p class="a-lib-sub">${escapeHtml(copy.weatherSheetSub)}</p>
      <div class="a-sheet-scroll">
        <div class="a-weather-search-row">
          <input type="search" id="androidWeatherSearchInput" class="a-weather-search-input" maxlength="100" autocomplete="off" value="${escapeHtml(activeCityName)}" placeholder="${escapeHtml(copy.weatherSearchPlaceholder)}">
          <button type="button" class="a-weather-search-btn" id="androidWeatherSearchBtn">${escapeHtml(copy.weatherSearchBtn)}</button>
        </div>
        <div class="a-weather-results" id="androidWeatherResults" aria-live="polite">
          ${offline ? `<p class="a-weather-hint">${escapeHtml(copy.weatherOfflineSearch)}</p>` : ""}
        </div>
        <div class="a-sec-head" style="margin-top:14px;"><span class="a-sec-label">${escapeHtml(copy.weatherQuickTitle)}</span></div>
        <div class="a-chip-wrap a-weather-presets">
          ${WEATHER_PRESETS.map((p, idx) => {
            const label = p[l] || p.name;
            const sel = snap?.city && Math.abs(snap.city.latitude - p.latitude) < 0.05 && Math.abs(snap.city.longitude - p.longitude) < 0.05;
            return `<button type="button" class="a-h-chip${sel ? " is-done" : ""}" data-weather-preset="${idx}">${escapeHtml(label)}</button>`;
          }).join("")}
        </div>
        <div class="a-weather-credit-row">
          <a class="a-weather-credit" href="https://open-meteo.com/" target="_blank" rel="noreferrer">${escapeHtml(copy.weatherCredit)}</a>
          ${!offline ? `<button type="button" class="a-weather-refresh-btn" id="androidWeatherRefreshBtn">${escapeHtml(copy.weatherRefresh)}</button>` : ""}
        </div>
      </div>
      <div class="a-sheet-cta-wrap">
        <button type="button" class="a-btn-primary" id="androidWeatherDone">${escapeHtml(t().cardLib.done)}</button>
      </div>
    `;

    const input = els.sheetBody.querySelector("#androidWeatherSearchInput");
    const resultsEl = els.sheetBody.querySelector("#androidWeatherResults");
    const runSearch = async () => {
      const q = input?.value?.trim() || "";
      if (q.length < 2 || !resultsEl) return;
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        resultsEl.innerHTML = `<p class="a-weather-hint">${escapeHtml(copy.weatherOfflineSearch)}</p>`;
        return;
      }
      weatherSearchAbort?.abort();
      weatherSearchAbort = new AbortController();
      const places = (await wb?.searchCities?.(q, weatherSearchAbort.signal)) || [];
      if (!places.length) {
        resultsEl.innerHTML = `<p class="a-weather-hint">${escapeHtml(copy.weatherNoResults)}</p>`;
        return;
      }
      resultsEl.innerHTML = places
        .map((p, i) => `<button type="button" class="a-weather-result-btn" data-w-res="${i}">${escapeHtml([p.name, p.admin1, p.country].filter(Boolean).join(" · "))}</button>`)
        .join("");
      resultsEl.querySelectorAll("[data-w-res]").forEach(btn => {
        btn.addEventListener("click", () => {
          const picked = places[Number(btn.dataset.wRes)];
          if (!picked) return;
          wb?.setCity?.(picked);
          syncSettingsWeatherRow();
          syncUI();
          closeSheet();
        });
      });
    };

    els.sheetBody.querySelector("#androidWeatherSearchBtn")?.addEventListener("click", () => { void runSearch(); });
    input?.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        void runSearch();
      }
    });
    els.sheetBody.querySelectorAll("[data-weather-preset]").forEach(btn => {
      btn.addEventListener("click", () => {
        const p = WEATHER_PRESETS[Number(btn.dataset.weatherPreset)];
        if (!p) return;
        const label = p[l] || p.name;
        wb?.setCity?.({ name: label, latitude: p.latitude, longitude: p.longitude });
        syncSettingsWeatherRow();
        syncUI();
        closeSheet();
      });
    });
    els.sheetBody.querySelector("#androidWeatherRefreshBtn")?.addEventListener("click", () => {
      void wb?.refresh?.(true);
    });
    els.sheetBody.querySelector("#androidWeatherDone")?.addEventListener("click", () => closeSheet());
  }

  function syncSettingsWeatherRow() {
    const dialog = document.getElementById("settingsDialog");
    const form = dialog?.querySelector(".settings-form");
    if (!dialog || !form) return;
    let group = document.getElementById("androidSettingsWeatherGroup");
    if (!group) {
      group = document.createElement("section");
      group.id = "androidSettingsWeatherGroup";
      group.className = "settings-group a-settings-weather-group";
      group.innerHTML = `
        <h3 id="androidSettingsWeatherGroupTitle"></h3>
        <button type="button" class="a-settings-row-btn" id="androidSettingsWeatherRow">
          <span class="a-settings-row-left">
            <span class="a-settings-row-ic a-chip-sky">${ICONS.cloud}</span>
            <span class="a-settings-row-copy">
              <strong id="androidSettingsWeatherTitle"></strong>
              <small id="androidSettingsWeatherHint"></small>
            </span>
          </span>
          <span class="a-settings-row-right">
            <span class="a-settings-row-val" id="androidSettingsWeatherVal"></span>
            <span class="a-settings-row-chev" aria-hidden="true">${ICONS.chevron}</span>
          </span>
        </button>
      `;
      const firstGroup = form.querySelector(".settings-group");
      if (firstGroup) firstGroup.after(group);
      else form.append(group);
      group.querySelector("#androidSettingsWeatherRow")?.addEventListener("click", () => {
        dialog.close();
        openWeatherSheet();
      });
    }
    const copy = t().today;
    const snap = weatherBridge()?.getSnapshot?.() || null;
    const cityName = localizedCityName(snap?.city?.name || copy.weatherSlotCity);
    let valText = cityName;
    if (snap?.forecast && Number.isFinite(snap.forecast.current?.temperature_2m)) {
      const temp = `${Math.round(snap.forecast.current.temperature_2m)}°`;
      valText = snap.offline ? `${cityName} · ${temp} · ${copy.weatherOfflineBadge}` : `${cityName} · ${temp}`;
    } else if (snap?.offline) {
      valText = `${cityName} · ${copy.weatherOfflineBadge}`;
    }
    group.querySelector("#androidSettingsWeatherGroupTitle").textContent = copy.weatherSettingsGroup;
    group.querySelector("#androidSettingsWeatherTitle").textContent = copy.weatherSettingsTitle;
    group.querySelector("#androidSettingsWeatherHint").textContent = copy.weatherSettingsHint;
    group.querySelector("#androidSettingsWeatherVal").textContent = valText;
  }

  function closeSheet() {
    if (!sheetOpen) return;
    sheetOpen = false;
    document.documentElement.classList.remove("a-sheet-open");
    els.sheetBackdrop.classList.remove("is-open");
    els.sheetBackdrop.inert = true;
    els.sheetBackdrop.setAttribute("aria-hidden", "true");
    els.fab?.classList.remove("is-morphed");
    setTimeout(() => {
      if (!sheetOpen) els.sheet.classList.remove("is-from-fab");
    }, 320);
  }

  function renderSheetContent() {
    regionChanged(els.sheetBody, [lang(), isDark(), sheetMode]);
    if (!els.sheetBody) return;
    if (sheetMode === "cardlib") {
      renderCardLibraryContent();
      return;
    }
    if (sheetMode === "photo") {
      renderPhotoSheetContent();
      return;
    }
    if (sheetMode === "weather") {
      renderWeatherSheetContent();
      return;
    }
    if (sheetMode === "keypad") {
      renderKeypadSheetContent();
      return;
    }
    if (sheetMode === "subdetail") {
      renderSubDetailSheetContent();
      return;
    }
    if (sheetMode === "moneymenu") {
      renderMoneyMenuSheetContent();
      return;
    }
    if (sheetMode === "customquotes") {
      renderCustomQuotesSheetContent();
      return;
    }
    if (sheetMode === "backup-export") {
      renderBackupExportSheetContent();
      return;
    }
    if (sheetMode === "backup-import") {
      renderBackupImportSheetContent();
      return;
    }
    if (sheetMode === "theme") {
      renderThemeSheetContent();
      return;
    }
    if (sheetMode === "language") {
      renderLanguageSheetContent();
      return;
    }
    if (sheetMode === "display") {
      renderDisplaySheetContent();
      return;
    }
    if (sheetMode === "focustopics-manage") {
      renderFocusTopicsManageSheetContent();
      return;
    }
    if (sheetMode === "reminder") {
      renderReminderSheetContent();
      return;
    }
    if (sheetMode === "clear-confirm") {
      renderClearConfirmSheetContent();
      return;
    }
    if (sheetMode === "focustopic") {
      renderFocusTopicSheetContent();
      return;
    }

    const c = core();
    const s = t().sheet;
    const todayIso = c?.getTodayIso?.() || toIsoDate(new Date());
    const date = sheetTargetDate || todayIso;
    const rawHabits = (c?.activeHabitsForDate?.(date) || []).slice(0, 12);
    const habits = sortAndroidHabits(rawHabits, [...draftHabits]);
    const doneCount = rawHabits.filter(h => draftHabits.has(h.id)).length;
    const dateLabel = date === todayIso ? `${s.todayPrefix} ${formatShortDate(date)}` : formatShortDate(date);
    const hasPhoto = Boolean(currentWallPhoto());

    let scrollHtml = "";
    let footerHtml = "";
    if (sheetSegment === "mood") {
      const moodDefs = [
        { key: "很好", icon: ICONS.moodGoodLg, soft: "var(--a-good-soft)", fg: "var(--a-good)" },
        { key: "平静", icon: ICONS.moodCalmLg, soft: "var(--a-calm-soft)", fg: "var(--a-calm)" },
        { key: "低落", icon: ICONS.moodLowLg, soft: "var(--a-low-soft)", fg: "var(--a-low)" },
      ];
      scrollHtml = `
        <div class="a-sec-head">
          <span class="a-sec-label">${escapeHtml(s.step1)}</span>
          <span class="a-sec-hint">${draftMood ? `${escapeHtml(s.selectedPrefix)} · ${escapeHtml(s.moods[draftMood] || draftMood)}` : escapeHtml(s.notSelected)}</span>
        </div>
        <div class="a-mood-row">
          ${moodDefs
            .map(m => {
              const sel = draftMood === m.key;
              return `<button type="button" class="a-m-card${sel ? " is-selected" : ""}" data-mood="${m.key}" aria-pressed="${sel}">
                <span class="a-m-ic" style="background:${sel ? "var(--a-surface-card)" : m.soft};color:${m.fg};">${m.icon}</span>
                <span>${escapeHtml(s.moods[m.key])}</span>
              </button>`;
            })
            .join("")}
        </div>
        <div class="a-sec-head">
          <span class="a-sec-label">${escapeHtml(s.step2)}</span>
          <span class="a-sec-hint">${escapeHtml(s.doneCount(doneCount, rawHabits.length))}</span>
        </div>
        <div class="a-chip-wrap">
          ${habits
            .map(h => {
              const done = draftHabits.has(h.id);
              const name = c?.displayHabitName?.(h) || h.name;
              const tone = habitIconTone(c?.getHabitIconKey?.(h) || "target");
              return `<button type="button" class="a-h-chip${done ? " is-done" : ""}" data-a-habit="${escapeHtml(h.id)}" aria-pressed="${done}">
                ${done ? `<span class="a-chk-dot">${ICONS.check}</span>` : `<span class="a-chip-h-ic" style="color:${tone.fg};">${habitIconSvg(h, 15)}</span>`}
                <span>${escapeHtml(name)}</span>
              </button>`;
            })
            .join("")}
        </div>
        <div class="a-sec-head"><span class="a-sec-label">${escapeHtml(s.step3)}</span></div>
        <div class="a-note-box">
          <textarea class="a-note-input" id="androidCaptureNote" rows="2" placeholder="${escapeHtml(s.notePlaceholder)}">${escapeHtml(draftNote)}</textarea>
          <div class="a-note-foot">
            <button type="button" class="a-photo-pill-btn" id="androidCapturePhotoBtn">${ICONS.photoIc}<span>${escapeHtml(hasPhoto ? s.photoAttach : s.photoAdd)}</span></button>
            <span id="androidCaptureCount">${escapeHtml(s.chars(draftNote.length))}</span>
          </div>
        </div>
      `;
      footerHtml = `
        <button type="button" class="a-btn-primary" id="androidCaptureSave">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--a-cta-check)" stroke-width="2.6" stroke-linecap="round"><path d="M5 13l4 4L19 7"/></svg>
          <span>${escapeHtml(s.save)}</span>
        </button>
      `;
    } else if (sheetSegment === "money") {
      scrollHtml = `
        <div class="a-sheet-bridge">
          <strong>${escapeHtml(s.moneyBridgeTitle)}</strong>
          <p>${escapeHtml(s.moneyBridgeDesc)}</p>
        </div>
      `;
      footerHtml = `<button type="button" class="a-btn-primary" id="androidBridgeMoney">${escapeHtml(s.moneyBridgeCta)} →</button>`;
    } else {
      scrollHtml = `
        <div class="a-sheet-bridge">
          <strong>${escapeHtml(s.focusBridgeTitle)}</strong>
          <p>${escapeHtml(s.focusBridgeDesc)}</p>
        </div>
      `;
      footerHtml = `<button type="button" class="a-btn-primary" id="androidBridgeFocus">${escapeHtml(s.focusBridgeCta)} →</button>`;
    }

    els.sheetBody.innerHTML = `
      <div class="a-sheet-head">
        <h2 class="a-sheet-title" id="androidSheetTitle">${escapeHtml(s.title)}</h2>
        <span class="a-time-pill">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
          <span>${escapeHtml(dateLabel)}</span>
        </span>
      </div>
      <div class="a-seg" role="tablist">
        <button type="button" class="a-seg-btn${sheetSegment === "mood" ? " is-active" : ""}" role="tab" aria-selected="${sheetSegment === "mood"}" data-a-seg="mood">${escapeHtml(s.segMood)}</button>
        <button type="button" class="a-seg-btn${sheetSegment === "money" ? " is-active" : ""}" role="tab" aria-selected="${sheetSegment === "money"}" data-a-seg="money">${escapeHtml(s.segMoney)}</button>
        <button type="button" class="a-seg-btn${sheetSegment === "focus" ? " is-active" : ""}" role="tab" aria-selected="${sheetSegment === "focus"}" data-a-seg="focus">${escapeHtml(s.segFocus)}</button>
      </div>
      <div class="a-sheet-scroll">${scrollHtml}</div>
      <div class="a-sheet-cta-wrap">${footerHtml}</div>
    `;

    els.sheetBody.querySelectorAll("[data-a-seg]").forEach(btn => {
      btn.addEventListener("click", () => {
        const seg = btn.dataset.aSeg;
        if (seg === "money") {
          openKeypadSheet({ date: sheetTargetDate });
          return;
        }
        if (seg === "focus") {
          closeSheet();
          openFocusOverlay();
          return;
        }
        sheetSegment = seg;
        renderSheetContent();
      });
    });
    els.sheetBody.querySelectorAll("[data-mood]").forEach(btn => {
      btn.addEventListener("click", () => {
        draftMood = draftMood === btn.dataset.mood ? "" : btn.dataset.mood;
        renderSheetContent();
      });
    });
    els.sheetBody.querySelectorAll("[data-a-habit]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.aHabit;
        if (draftHabits.has(id)) draftHabits.delete(id);
        else draftHabits.add(id);
        renderSheetContent();
      });
    });
    const noteInput = els.sheetBody.querySelector("#androidCaptureNote");
    if (noteInput) {
      noteInput.addEventListener("input", () => {
        draftNote = noteInput.value;
        const countEl = els.sheetBody.querySelector("#androidCaptureCount");
        if (countEl) countEl.textContent = s.chars(draftNote.length);
      });
    }
    els.sheetBody.querySelector("#androidCapturePhotoBtn")?.addEventListener("click", () => {
      sheetMode = "photo";
      renderSheetContent();
    });
    els.sheetBody.querySelector("#androidCaptureSave")?.addEventListener("click", () => {
      const cc = core();
      const targetDate = sheetTargetDate || cc?.getTodayIso?.() || "";
      const existing = cc?.getLog?.(targetDate) || { mood: "", completed: [], note: "" };
      if (draftMood !== (existing.mood || "")) cc?.setMood?.(targetDate, draftMood);
      const prevSet = new Set(existing.completed || []);
      const allIds = new Set([...prevSet, ...draftHabits]);
      allIds.forEach(id => {
        if (prevSet.has(id) !== draftHabits.has(id)) cc?.toggleHabitImmediate?.(targetDate, id);
      });
      if (draftNote.trim() !== String(existing.note || "").trim()) {
        cc?.setDayNote?.(targetDate, draftNote);
      }
      closeSheet();
      syncUI();
    });
    els.sheetBody.querySelector("#androidBridgeMoney")?.addEventListener("click", () => {
      closeSheet();
      core()?.openSpend?.(sheetTargetDate);
      syncUI();
    });
    els.sheetBody.querySelector("#androidBridgeFocus")?.addEventListener("click", () => {
      closeSheet();
      core()?.openFocus?.();
      syncUI();
    });
  }

  function renderCardLibraryContent() {
    const cl = t().cardLib;
    const active = loadCardsPref();
    const activeSet = new Set(active);
    const orderedAll = [...active, ...ALL_TODAY_CARDS.filter(id => !activeSet.has(id))];

    els.sheetBody.innerHTML = `
      <div class="a-sheet-head">
        <h2 class="a-sheet-title" id="androidSheetTitle">${escapeHtml(cl.title)}</h2>
      </div>
      <p class="a-lib-sub">${escapeHtml(cl.sub)}</p>
      <div class="a-sheet-scroll">
        <div class="a-lib-list">
          ${orderedAll
            .map(id => {
              const on = activeSet.has(id);
              const idx = active.indexOf(id);
              return `
                <div class="a-lib-row${on ? " is-on" : ""}">
                  <div class="a-lib-copy">
                    <strong>${escapeHtml(cl.names[id] || id)}</strong>
                    <span>${escapeHtml(cl.descs[id] || "")}</span>
                  </div>
                  <div class="a-lib-actions">
                    ${
                      on
                        ? `
                      <button type="button" class="a-lib-move" data-lib-up="${id}" ${idx <= 0 ? "disabled" : ""} aria-label="Up">↑</button>
                      <button type="button" class="a-lib-move" data-lib-down="${id}" ${idx >= active.length - 1 ? "disabled" : ""} aria-label="Down">↓</button>
                      <button type="button" class="a-lib-toggle is-on" data-lib-toggle="${id}">${escapeHtml(cl.remove)}</button>
                    `
                        : `<button type="button" class="a-lib-toggle" data-lib-toggle="${id}">＋ ${escapeHtml(cl.add)}</button>`
                    }
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
      <div class="a-sheet-cta-wrap">
        <button type="button" class="a-btn-primary" id="androidCardLibDone">${escapeHtml(cl.done)}</button>
      </div>
    `;

    els.sheetBody.querySelectorAll("[data-lib-toggle]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.libToggle;
        const cur = [...loadCardsPref()];
        const i = cur.indexOf(id);
        if (i >= 0) cur.splice(i, 1);
        else cur.push(id);
        saveCardsPref(cur);
        renderCardLibraryContent();
        syncUI();
      });
    });
    els.sheetBody.querySelectorAll("[data-lib-up]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.libUp;
        const cur = [...loadCardsPref()];
        const i = cur.indexOf(id);
        if (i > 0) {
          [cur[i - 1], cur[i]] = [cur[i], cur[i - 1]];
          saveCardsPref(cur);
          renderCardLibraryContent();
          syncUI();
        }
      });
    });
    els.sheetBody.querySelectorAll("[data-lib-down]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.libDown;
        const cur = [...loadCardsPref()];
        const i = cur.indexOf(id);
        if (i >= 0 && i < cur.length - 1) {
          [cur[i + 1], cur[i]] = [cur[i], cur[i + 1]];
          saveCardsPref(cur);
          renderCardLibraryContent();
          syncUI();
        }
      });
    });
    els.sheetBody.querySelector("#androidCardLibDone")?.addEventListener("click", () => closeSheet());
  }

  function renderPhotoSheetContent() {
    const ps = t().photoSheet;
    const demo = Boolean(core()?.isIsolatedDemoActive?.());
    const photo = currentWallPhoto();

    els.sheetBody.innerHTML = `
      <div class="a-sheet-head">
        <h2 class="a-sheet-title" id="androidSheetTitle">${escapeHtml(ps.title)}</h2>
      </div>
      <div class="a-sheet-scroll">
        ${
          photo
            ? `
          <div class="a-focus-preview" id="androidFocusPreview" tabindex="0">
            <img src="${escapeHtml(photo.url)}" alt="" style="object-position:${photo.x ?? 50}% ${photo.y ?? 50}%;">
            <span class="a-focus-pin" id="androidFocusPin" style="left:${photo.x ?? 50}%;top:${photo.y ?? 50}%;" aria-hidden="true"></span>
          </div>
          <p class="a-lib-sub">${escapeHtml(ps.hint)}</p>
        `
            : ""
        }
        ${demo ? `<p class="a-lib-sub">${escapeHtml(ps.demoNote)}</p>` : ""}
        <div class="a-photo-sheet-actions">
          ${
            !demo
              ? `
            <button type="button" class="a-btn-secondary" id="androidPhotoPickBtn">${ICONS.photoIc}<span>${escapeHtml(ps.addPhoto)}</span></button>
            <input type="file" id="androidPhotoFileInput" accept="image/jpeg,image/png,image/webp,image/gif" hidden>
            ${photo ? `<button type="button" class="a-btn-secondary" id="androidPhotoRemoveBtn">${escapeHtml(ps.removePhoto)}</button>` : ""}
          `
              : ""
          }
        </div>
      </div>
      <div class="a-sheet-cta-wrap">
        <button type="button" class="a-btn-primary" id="androidPhotoSheetDone">${escapeHtml(ps.done)}</button>
      </div>
    `;

    const preview = els.sheetBody.querySelector("#androidFocusPreview");
    const pin = els.sheetBody.querySelector("#androidFocusPin");
    if (preview && photo) {
      const updatePoint = e => {
        const rect = preview.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = Math.round(Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)));
        const y = Math.round(Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100)));
        photo.x = x;
        photo.y = y;
        const img = preview.querySelector("img");
        if (img) img.style.objectPosition = `${x}% ${y}%`;
        if (pin) {
          pin.style.left = `${x}%`;
          pin.style.top = `${y}%`;
        }
      };
      const commitPoint = () => {
        if (!demo && photo.blob) {
          const { url, ...row } = photo;
          void wallDb.put(row).catch(() => {});
        }
        syncUI();
      };
      preview.addEventListener("pointerdown", e => {
        preview.setPointerCapture?.(e.pointerId);
        updatePoint(e);
      });
      preview.addEventListener("pointermove", e => {
        if (preview.hasPointerCapture?.(e.pointerId)) updatePoint(e);
      });
      preview.addEventListener("pointerup", commitPoint);
    }

    const fileInput = els.sheetBody.querySelector("#androidPhotoFileInput");
    els.sheetBody.querySelector("#androidPhotoPickBtn")?.addEventListener("click", () => fileInput?.click());
    fileInput?.addEventListener("change", async e => {
      const file = e.target.files?.[0];
      if (!file || demo) return;
      try {
        const row = {
          id: crypto?.randomUUID?.() || `wall-${Date.now()}`,
          name: file.name || "photo",
          type: file.type || "image/jpeg",
          blob: file,
          created: Date.now(),
          x: 50,
          y: 50,
        };
        await wallDb.put(row);
        const url = URL.createObjectURL(file);
        wallObjectUrls.push(url);
        userWallPhotos.push({ ...row, url });
        wallIndex = userWallPhotos.length - 1;
        // Make sure wall card is enabled when user explicitly adds a photo
        const cards = loadCardsPref();
        if (!cards.includes("wall")) saveCardsPref([...cards, "wall"]);
        renderPhotoSheetContent();
        syncUI();
      } catch {}
    });

    els.sheetBody.querySelector("#androidPhotoRemoveBtn")?.addEventListener("click", async () => {
      if (demo || !photo) return;
      try {
        await wallDb.delete(photo.id);
        userWallPhotos = userWallPhotos.filter(p => p.id !== photo.id);
        wallIndex = Math.max(0, Math.min(wallIndex, userWallPhotos.length - 1));
        renderPhotoSheetContent();
        syncUI();
      } catch {}
    });

    els.sheetBody.querySelector("#androidPhotoSheetDone")?.addEventListener("click", () => closeSheet());
  }

  /* ============================================================================
     Phase 5: Undo Snackbar (5s), Money + 4×4 Keypad, Timeline (4 Segments),
              Habits (14-Day Grid), Full-Screen Focus + Top-Bar Capsule
     ============================================================================ */

  function showUndoSnackbar(message, onUndo) {
    if (!els.snackbar) return;
    if (snackbarTimer) {
      clearTimeout(snackbarTimer);
      snackbarTimer = 0;
    }
    snackbarUndoFn = typeof onUndo === "function" ? onUndo : null;
    els.snackbar.querySelector("#androidSnackbarMsg").textContent = message;
    const undoBtn = els.snackbar.querySelector("#androidSnackbarUndo");
    undoBtn.textContent = t().undo;
    undoBtn.hidden = !snackbarUndoFn;
    els.snackbar.hidden = false;
    requestAnimationFrame(() => els.snackbar.classList.add("is-open"));
    snackbarTimer = setTimeout(() => hideSnackbar(), 5000);
  }

  function hideSnackbar() {
    if (snackbarTimer) {
      clearTimeout(snackbarTimer);
      snackbarTimer = 0;
    }
    snackbarUndoFn = null;
    if (!els.snackbar) return;
    els.snackbar.classList.remove("is-open");
    setTimeout(() => {
      if (!els.snackbar.classList.contains("is-open")) els.snackbar.hidden = true;
    }, isReducedMotion() ? 0 : 200);
  }

  function localeTag() {
    return ({ zh: "zh-CN", en: "en-GB", de: "de-DE" }[lang()] || "zh-CN");
  }

  function formatYmLabel(ym) {
    const [y, m] = String(ym || "").split("-").map(Number);
    if (!y || !m) return String(ym || "");
    if (lang() === "zh") return `${y}年${m}月`;
    return new Intl.DateTimeFormat(localeTag(), { month: "short", year: "numeric" }).format(new Date(y, m - 1, 1, 12));
  }

  function formatWeekRangeLabel(startIso, endIso) {
    const s = parseIsoDate(startIso);
    const e = parseIsoDate(endIso);
    if (lang() === "zh") {
      if (s.getMonth() === e.getMonth()) return `${s.getMonth() + 1}月${s.getDate()}日 – ${e.getDate()}日`;
      return `${s.getMonth() + 1}月${s.getDate()}日 – ${e.getMonth() + 1}月${e.getDate()}日`;
    }
    const loc = localeTag();
    const m1 = new Intl.DateTimeFormat(loc, { day: "numeric", month: "short" }).format(s);
    const m2 = new Intl.DateTimeFormat(loc, { day: "numeric", month: "short" }).format(e);
    return `${m1} – ${m2}`;
  }

  function shiftActivePeriod(delta) {
    const view = getActiveView();
    const L = window.LifeLedgerLedger;
    if (view === "ledger") {
      const cur = moneyYm || (core()?.getTodayIso?.() || toIsoDate(new Date())).slice(0, 7);
      moneyYm = L?.shiftYm ? L.shiftYm(cur, delta) : cur;
      moneyDrillCatId = "";
      syncUI();
    } else if (view === "timeline") {
      const cur = timelineYm || (core()?.getTodayIso?.() || toIsoDate(new Date())).slice(0, 7);
      timelineYm = L?.shiftYm ? L.shiftYm(cur, delta) : cur;
      syncUI();
    } else if (view === "week") {
      const data = core()?.getWeekData?.(weekKeySel);
      if (data) weekKeySel = delta < 0 ? data.prevWeekKey : data.nextWeekKey;
      syncUI();
    } else if (view === "review") {
      const cur = monthReviewYm || (core()?.getTodayIso?.() || toIsoDate(new Date())).slice(0, 7);
      monthReviewYm = L?.shiftYm ? L.shiftYm(cur, delta) : cur;
      syncUI();
    }
  }

  const MONEY_CAT_PALETTE = [
    { color: "#D97706", soft: "rgba(217,119,6,0.14)" },
    { color: "#C85A3F", soft: "rgba(200,90,63,0.14)" },
    { color: "#2B72B8", soft: "rgba(43,114,184,0.14)" },
    { color: "#6D5ACF", soft: "rgba(109,90,207,0.14)" },
    { color: "#2E7D5B", soft: "rgba(46,125,91,0.14)" },
  ];

  function moneyCatAccent(index) {
    return MONEY_CAT_PALETTE[index % MONEY_CAT_PALETTE.length];
  }

  function openKeypadSheet({ date = "", kind = "expense" } = {}) {
    const c = core();
    const L = window.LifeLedgerLedger;
    const ledger = c?.getLedger?.();
    const todayIso = c?.getTodayIso?.() || toIsoDate(new Date());
    const targetDate = date && !isAndroidDateReadOnly(date, todayIso) ? date : todayIso;
    const defaultCurrency = ledger?.settings?.defaultCurrency || "EUR";
    keypadState = {
      kind: kind === "income" ? "income" : "expense",
      expr: "",
      note: "",
      categoryId: "",
      date: targetDate,
      currency: defaultCurrency,
    };
    sheetMode = "keypad";
    renderSheetContent();
    presentSheet({ fromFab: false });
  }

  function openMoneyMenuSheet() {
    sheetMode = "moneymenu";
    renderSheetContent();
    presentSheet({ fromFab: false });
  }

  function openSubDetailSheet(tx) {
    activeSubDetailTx = tx;
    sheetMode = "subdetail";
    renderSheetContent();
    presentSheet({ fromFab: false });
  }

  function renderMoneyMenuSheetContent() {
    const m = t().money;
    els.sheetBody.innerHTML = `
      <div class="a-sheet-head">
        <h2 class="a-sheet-title" id="androidSheetTitle">${escapeHtml(m.moreTitle)}</h2>
      </div>
      <div class="a-sheet-scroll">
        <button type="button" class="a-menu-sheet-row" id="androidBankImportBtn">
          <span class="a-menu-sheet-ic a-chip-primary">${ICONS.upload}</span>
          <span class="a-menu-sheet-copy">
            <strong>${escapeHtml(m.bankImport)}</strong>
            <small>${escapeHtml(m.bankImportSub)}</small>
          </span>
          <span class="a-mini-chev" aria-hidden="true">${ICONS.chevron}</span>
        </button>
      </div>
      <div class="a-sheet-cta-wrap">
        <button type="button" class="a-btn-primary" id="androidMoneyMenuDone">${escapeHtml(t().cardLib.done)}</button>
      </div>
    `;
    els.sheetBody.querySelector("#androidBankImportBtn")?.addEventListener("click", () => {
      closeSheet();
      void core()?.openBankImport?.().catch(error => showUndoSnackbar(error.message));
    });
    els.sheetBody.querySelector("#androidMoneyMenuDone")?.addEventListener("click", () => closeSheet());
  }

  function renderSubDetailSheetContent() {
    const m = t().money;
    const tx = activeSubDetailTx;
    const L = window.LifeLedgerLedger;
    const ledger = core()?.getLedger?.();
    if (!tx || !L || !ledger) {
      closeSheet();
      return;
    }
    const cur = tx.currency || ledger.settings.defaultCurrency || "EUR";
    const cat = ledger.categories.find(c => c.id === tx.categoryId);
    const catLabel = cat ? L.localizedCategoryName(cat, lang()) : "";
    const amtText = L.formatMoney(Math.abs(tx.amountMinor), cur, localeTag());
    const sourceText = tx.source === "import" ? m.subSourceImport : m.subSourceRecurring;

    els.sheetBody.innerHTML = `
      <div class="a-sheet-head">
        <h2 class="a-sheet-title" id="androidSheetTitle">${escapeHtml(m.subDetailTitle)}</h2>
        <span class="a-sub-badge">${ICONS.lockSm}<span>${escapeHtml(m.subReadOnly)}</span></span>
      </div>
      <div class="a-sheet-scroll">
        <div class="a-sub-detail-card">
          <div class="a-sub-detail-title">${escapeHtml(tx.note || catLabel)}</div>
          <div class="a-sub-detail-amt is-coral">−${escapeHtml(amtText)}</div>
          <div class="a-sub-detail-rows">
            <div><span>${escapeHtml(m.subFieldDate)}</span><strong>${escapeHtml(tx.date)}</strong></div>
            <div><span>${escapeHtml(m.subFieldCategory)}</span><strong>${escapeHtml(catLabel || "—")}</strong></div>
            <div><span>${escapeHtml(m.subFieldSource)}</span><strong>${escapeHtml(sourceText)}</strong></div>
          </div>
          <p class="a-sub-detail-note">${escapeHtml(m.subDetailNote)}</p>
        </div>
      </div>
      <div class="a-sheet-cta-wrap">
        <button type="button" class="a-btn-primary" id="androidSubDetailDone">${escapeHtml(t().cardLib.done)}</button>
      </div>
    `;
    els.sheetBody.querySelector("#androidSubDetailDone")?.addEventListener("click", () => closeSheet());
  }

  function renderKeypadSheetContent() {
    const k = t().keypad;
    const L = window.LifeLedgerLedger;
    const ledger = core()?.getLedger?.();
    const l = lang();
    const sep = localeDecimalSeparator(l);
    const cur = keypadState.currency || ledger?.settings?.defaultCurrency || "EUR";
    const curSym = cur === "USD" ? "$" : cur === "CNY" ? "¥" : "€";
    const evalRes = evaluateKeypadExpression(keypadState.expr, l, L?.parseMoneyInput);

    // Categories from ledger-core (leafs for selected kind)
    const allCats = (ledger?.categories || []).filter(c => !c.archived && !c.isGroup && c.kind === keypadState.kind);
    const guessedId = keypadState.kind === "expense" && L?.guessCategory && ledger && keypadState.note.trim()
      ? L.guessCategory(ledger, keypadState.note, evalRes.amountMinor || -1)
      : "";
    const effectiveCatId = keypadState.categoryId || guessedId || allCats[0]?.id || "";
    const activeCat = allCats.find(c => c.id === effectiveCatId) || allCats[0];
    const activeCatName = activeCat && L ? L.localizedCategoryName(activeCat, l) : "";
    const isAuto = !keypadState.categoryId && Boolean(guessedId);

    const displayNumber = keypadState.expr
      ? (evalRes.hasOperator ? evalRes.formattedDisplay : keypadState.expr.replace(/[.,]/g, sep))
      : `0${sep}00`;

    els.sheetBody.innerHTML = `
      <div class="a-kp-top">
        <div class="a-kp-kind" role="tablist">
          <button type="button" class="a-kp-kind-btn${keypadState.kind === "expense" ? " is-active is-expense" : ""}" data-kp-kind="expense" aria-selected="${keypadState.kind === "expense"}">${escapeHtml(k.expense)}</button>
          <button type="button" class="a-kp-kind-btn${keypadState.kind === "income" ? " is-active is-income" : ""}" data-kp-kind="income" aria-selected="${keypadState.kind === "income"}">${escapeHtml(k.income)}</button>
        </div>
        <div class="a-kp-pills">
          <span class="a-kp-meta-pill">${escapeHtml(cur)}</span>
          <span class="a-kp-meta-pill">${escapeHtml(formatShortDate(keypadState.date))}</span>
        </div>
      </div>

      <div class="a-kp-display">
        <div class="a-kp-expr" id="androidKpExpr" ${evalRes.previewText ? "" : "hidden"}>${escapeHtml(k.exprPrefix + evalRes.previewText)}</div>
        <div class="a-kp-amount-row">
          <span class="a-kp-cur ${keypadState.kind === "income" ? "is-income" : "is-expense"}">${escapeHtml(curSym)}</span>
          <span class="a-kp-num" id="androidKpDisplay">${escapeHtml(displayNumber)}</span>
          <span class="a-kp-caret" aria-hidden="true"></span>
        </div>
        ${
          activeCatName
            ? `<div class="a-kp-cat-badge"><span class="a-kp-cat-tag">${escapeHtml(isAuto ? k.autoCat : k.manualCat)}</span><strong>${escapeHtml(activeCatName)}</strong></div>`
            : ""
        }
      </div>

      <div class="a-kp-cat-rail" role="listbox" aria-label="${escapeHtml(k.manualCat)}">
        ${allCats
          .slice(0, 10)
          .map(cat => {
            const name = L ? L.localizedCategoryName(cat, l) : cat.name;
            const sel = cat.id === effectiveCatId;
            return `<button type="button" class="a-kp-cat-chip${sel ? " is-active" : ""}" data-kp-cat="${escapeHtml(cat.id)}" aria-selected="${sel}">${escapeHtml(name)}</button>`;
          })
          .join("")}
      </div>

      <div class="a-kp-note-row">
        <input type="text" id="androidKpNote" class="a-kp-note-input" maxlength="120" value="${escapeHtml(keypadState.note)}" placeholder="${escapeHtml(k.notePlaceholder)}" aria-label="${escapeHtml(k.noteLabel)}">
        <span class="a-kp-note-tag">${escapeHtml(k.noteLabel)}</span>
      </div>

      <div class="a-kp-grid" id="androidKpGrid">
        <button type="button" class="a-kp-key" data-kp-key="7">7</button>
        <button type="button" class="a-kp-key" data-kp-key="8">8</button>
        <button type="button" class="a-kp-key" data-kp-key="9">9</button>
        <button type="button" class="a-kp-key is-op" data-kp-key="back" aria-label="Backspace">${ICONS.backspace}</button>

        <button type="button" class="a-kp-key" data-kp-key="4">4</button>
        <button type="button" class="a-kp-key" data-kp-key="5">5</button>
        <button type="button" class="a-kp-key" data-kp-key="6">6</button>
        <button type="button" class="a-kp-key is-op" data-kp-key="+" aria-label="Plus">+</button>

        <button type="button" class="a-kp-key" data-kp-key="1">1</button>
        <button type="button" class="a-kp-key" data-kp-key="2">2</button>
        <button type="button" class="a-kp-key" data-kp-key="3">3</button>
        <button type="button" class="a-kp-key is-op" data-kp-key="-" aria-label="Minus">−</button>

        <button type="button" class="a-kp-key" data-kp-key="dec" id="androidKpDecimalKey">${escapeHtml(sep)}</button>
        <button type="button" class="a-kp-key" data-kp-key="0">0</button>
        <button type="button" class="a-kp-key" data-kp-key="00">00</button>
        <button type="button" class="a-kp-key is-submit" id="androidKpSubmit" ${evalRes.ok ? "" : "disabled"}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--a-cta-check)" stroke-width="2.8" stroke-linecap="round"><path d="M5 13l4 4L19 7"/></svg>
          <span>${escapeHtml(k.save)}</span>
        </button>
      </div>
      <p class="a-kp-hint">${escapeHtml(k.hint)}</p>
    `;

    els.sheetBody.querySelectorAll("[data-kp-kind]").forEach(btn => {
      btn.addEventListener("click", () => {
        keypadState.kind = btn.dataset.kpKind === "income" ? "income" : "expense";
        keypadState.categoryId = "";
        renderKeypadSheetContent();
      });
    });
    els.sheetBody.querySelectorAll("[data-kp-cat]").forEach(btn => {
      btn.addEventListener("click", () => {
        keypadState.categoryId = btn.dataset.kpCat;
        renderKeypadSheetContent();
      });
    });
    const noteEl = els.sheetBody.querySelector("#androidKpNote");
    noteEl?.addEventListener("input", () => {
      keypadState.note = noteEl.value;
      // Refresh auto-category badge cleanly without losing input focus
      if (!keypadState.categoryId && L?.guessCategory && ledger) {
        const gId = L.guessCategory(ledger, keypadState.note, evalRes.amountMinor || -1);
        const cat = allCats.find(c => c.id === gId);
        const badgeStrong = els.sheetBody.querySelector(".a-kp-cat-badge strong");
        if (cat && badgeStrong) badgeStrong.textContent = L.localizedCategoryName(cat, l);
      }
    });

    const handleKey = key => {
      let expr = keypadState.expr;
      if (key === "back") {
        keypadState.expr = expr.slice(0, -1);
      } else if (key === "+" || key === "-") {
        if (!expr) return;
        if (/[+-]$/.test(expr)) keypadState.expr = expr.slice(0, -1) + key;
        else keypadState.expr = expr + key;
      } else if (key === "dec") {
        const lastPart = expr.split(/[+-]/).pop() || "";
        if (lastPart.includes(".") || lastPart.includes(",")) return;
        keypadState.expr = !lastPart ? `${expr}0${sep}` : `${expr}${sep}`;
      } else {
        const lastPart = expr.split(/[+-]/).pop() || "";
        const decIdx = Math.max(lastPart.indexOf("."), lastPart.indexOf(","));
        if (decIdx >= 0 && lastPart.length - decIdx - 1 >= 2) return;
        if (lastPart.length >= 10) return;
        if (key === "00" && (!lastPart || lastPart === "0")) {
          keypadState.expr = expr || "0";
        } else if (lastPart === "0" && key !== "00") {
          keypadState.expr = expr.slice(0, -1) + key;
        } else {
          keypadState.expr = expr + key;
        }
      }
      renderKeypadSheetContent();
    };

    els.sheetBody.querySelectorAll("[data-kp-key]").forEach(btn => {
      btn.addEventListener("click", () => handleKey(btn.dataset.kpKey));
    });

    els.sheetBody.querySelector("#androidKpSubmit")?.addEventListener("click", () => {
      const res = evaluateKeypadExpression(keypadState.expr, l, L?.parseMoneyInput);
      if (!res.ok || res.amountMinor <= 0) return;
      const signedMinor = keypadState.kind === "income" ? res.amountMinor : -res.amountMinor;
      const finalCatId = keypadState.categoryId || guessedId || allCats[0]?.id || "";
      core()?.addLedgerTransaction?.({
        amountMinor: signedMinor,
        date: keypadState.date,
        note: keypadState.note.trim() || activeCatName || (keypadState.kind === "income" ? k.income : k.expense),
        categoryId: finalCatId,
        currency: cur,
      });
      closeSheet();
      syncUI();
    });
  }

  function renderMoney() {
    if (!els.moneyRoot) return;
    const view = getActiveView();
    if (view !== "ledger") {
      els.moneyRoot.hidden = true;
      return;
    }
    els.moneyRoot.hidden = false;

    const raw = core()?.getState?.() || {};
    if (!panelChanged(els.moneyRoot, [raw.ledger, moneyYm, moneyDrillCatId])) return;
    const c = core();
    const L = window.LifeLedgerLedger;
    const ledger = c?.getLedger?.();
    if (!L || !ledger) return;

    const mCopy = t().money;
    const l = lang();
    const loc = localeTag();
    const todayIso = c?.getTodayIso?.() || toIsoDate(new Date());
    const yesterdayIso = shiftIsoDate(todayIso, -1);
    if (!moneyYm) moneyYm = todayIso.slice(0, 7);

    const cur = ledger.settings.defaultCurrency || "EUR";
    const summary = L.moneyMonth(ledger, moneyYm);
    const balanceMinor = summary.incomeMinor - summary.expenseMinor;
    const balanceFmt = L.formatMoney(balanceMinor, cur, loc);
    const incomeFmt = L.formatMoney(summary.incomeMinor, cur, loc);
    const expenseFmt = L.formatMoney(summary.expenseMinor, cur, loc);

    // Budget bar (only via ledger-core.js: align spentMinor with the same scope as limitMinor)
    const explicitBudget = Number(ledger.settings?.monthlyBudgetMinor || 0);
    const catBudgets = L.budgetProgress ? L.budgetProgress(ledger, moneyYm) : [];
    let budgetTotal = 0;
    let budgetSpent = 0;
    if (explicitBudget > 0) {
      budgetTotal = explicitBudget;
      budgetSpent = summary.expenseMinor;
    } else if (catBudgets.length) {
      budgetTotal = catBudgets.reduce((s, b) => s + (b.limitMinor || 0), 0);
      budgetSpent = catBudgets.reduce((s, b) => s + (b.spentMinor || 0), 0);
    } else if (L.budgetHint) {
      budgetTotal = L.budgetHint(ledger, moneyYm);
      budgetSpent = summary.variableMinor;
    }
    const budgetPct = budgetTotal > 0 ? Math.round((budgetSpent / budgetTotal) * 1000) / 10 : 0;
    const budgetLeft = Math.max(0, budgetTotal - budgetSpent);

    // Category breakdown grouped cleanly (top 3 + other or top 4) using ledger-core categories
    const catById = new Map(ledger.categories.map(cat => [cat.id, cat]));
    const groupedTotals = new Map();
    for (const item of summary.categories) {
      const cat = catById.get(item.categoryId);
      const topId = cat?.parentId && catById.has(cat.parentId) ? cat.parentId : item.categoryId;
      const topCat = catById.get(topId) || cat;
      const entry = groupedTotals.get(topId) || {
        id: topId,
        name: topCat ? L.localizedCategoryName(topCat, l) : item.categoryId,
        amountMinor: 0,
      };
      entry.amountMinor += item.amountMinor;
      groupedTotals.set(topId, entry);
    }
    const topCats = [...groupedTotals.values()]
      .sort((a, b) => b.amountMinor - a.amountMinor)
      .slice(0, 4)
      .map((item, idx) => ({
        ...item,
        pct: summary.expenseMinor > 0 ? Math.max(1, Math.round((item.amountMinor / summary.expenseMinor) * 100)) : 0,
        accent: moneyCatAccent(idx),
      }));

    // Filtered daily grouped transactions via ledger-core.js
    const dayGroups = L.filterMoneyRows(ledger, moneyYm, {
      hideTransfers: true,
      categoryId: moneyDrillCatId || "",
    });
    const activeDrillName = moneyDrillCatId && catById.has(moneyDrillCatId)
      ? L.localizedCategoryName(catById.get(moneyDrillCatId), l)
      : "";

    const hasAnyTx = summary.incomeMinor > 0 || summary.expenseMinor > 0 || dayGroups.length > 0;

    els.moneyRoot.innerHTML = `
      <section class="a-balance-card">
        <div class="a-bal-top">
          <div class="a-bal-copy">
            <span class="a-bal-kicker">${escapeHtml(mCopy.balanceLabel(cur))}</span>
            <div class="a-bal-val">${escapeHtml(balanceFmt)}</div>
          </div>
          <button type="button" class="a-bal-add" id="androidMoneyAddBtn">${escapeHtml(mCopy.addBtn)}</button>
        </div>
        <div class="a-bal-split">
          <div class="a-bal-side">
            <span class="a-bal-ic is-in">${ICONS.arrowUp}</span>
            <div>
              <small>${escapeHtml(mCopy.income)}</small>
              <strong class="is-in">+${escapeHtml(incomeFmt)}</strong>
            </div>
          </div>
          <div class="a-bal-side">
            <span class="a-bal-ic is-out">${ICONS.arrowDown}</span>
            <div>
              <small>${escapeHtml(mCopy.expense)}</small>
              <strong class="is-out">−${escapeHtml(expenseFmt)}</strong>
            </div>
          </div>
        </div>
        ${
          budgetTotal > 0
            ? `
          <div class="a-bal-budget">
            <div class="a-bal-budget-head">
              <span>${escapeHtml(mCopy.budgetLabel(L.formatMoney(budgetTotal, cur, loc)))}</span>
              <span>${escapeHtml(budgetPct > 100 ? mCopy.budgetOver(budgetPct) : mCopy.budgetUsed(budgetPct, L.formatMoney(budgetLeft, cur, loc)))}</span>
            </div>
            <div class="a-bal-budget-track"><span style="width:${Math.min(100, Math.max(4, budgetPct))}%"></span></div>
          </div>
        `
            : ""
        }
      </section>

      ${
        topCats.length
          ? `
        <section class="a-card a-money-cat-card">
          <div class="a-card-head">
            <h2 class="a-card-title">${escapeHtml(mCopy.breakdownTitle)}</h2>
            ${
              moneyDrillCatId
                ? `<button type="button" class="a-drill-clear" id="androidMoneyClearDrill">${escapeHtml(`${activeDrillName} · ${mCopy.clearFilter} ✕`)}</button>`
                : `<span class="a-drill-hint">${escapeHtml(mCopy.breakdownHint)}</span>`
            }
          </div>
          <div class="a-cat-bar" aria-hidden="true">
            ${topCats.map(ct => `<span style="flex:${ct.amountMinor};background:${ct.accent.color};opacity:${moneyDrillCatId && moneyDrillCatId !== ct.id ? "0.28" : "1"}"></span>`).join("")}
          </div>
          <div class="a-cat-grid">
            ${topCats
              .map(ct => {
                const sel = moneyDrillCatId === ct.id;
                return `
                  <button type="button" class="a-cat-tile${sel ? " is-selected" : ""}" data-money-cat="${escapeHtml(ct.id)}" aria-pressed="${sel}">
                    <span class="a-cat-tile-top"><i style="background:${ct.accent.color}"></i><span>${escapeHtml(ct.name)}</span></span>
                    <strong>${ct.pct}%</strong>
                  </button>
                `;
              })
              .join("")}
          </div>
        </section>
      `
          : ""
      }

      ${
        !hasAnyTx
          ? `
        <section class="a-empty-card">
          <div class="a-empty-art">${ICONS.firstRunArt}</div>
          <h2 class="a-empty-title">${escapeHtml(mCopy.emptyTitle)}</h2>
          <p class="a-empty-desc">${escapeHtml(mCopy.emptyDesc)}</p>
          <div class="a-empty-actions">
            <button type="button" class="a-btn-primary" id="androidMoneyEmptyAdd">${escapeHtml(mCopy.emptyCta)}</button>
            <button type="button" class="a-empty-link" id="androidMoneyEmptyImport">${ICONS.upload}<span>${escapeHtml(mCopy.bankImport)}</span></button>
          </div>
        </section>
      `
          : dayGroups
              .map(group => {
                const dayTitle =
                  group.date === todayIso
                    ? `${mCopy.todayLabel} · ${formatShortDate(group.date)}`
                    : group.date === yesterdayIso
                      ? `${mCopy.yesterdayLabel} · ${formatShortDate(group.date)}`
                      : formatShortDate(group.date);
                const daySub = group.expenseMinor > 0 ? mCopy.dayExpense(L.formatMoney(group.expenseMinor, cur, loc)) : "";
                return `
                  <div class="a-tx-day-head">
                    <span>${escapeHtml(dayTitle)}</span>
                    ${daySub ? `<span>${escapeHtml(daySub)}</span>` : ""}
                  </div>
                  <section class="a-card a-tx-card">
                    ${group.rows
                      .map((tx, idx) => {
                        const isReadOnly = L.isFixedTx(ledger, tx) || tx.source === "import" || Boolean(tx.recurringId);
                        const cat = catById.get(tx.categoryId);
                        const catName = cat ? L.localizedCategoryName(cat, l) : "";
                        const txCur = tx.currency || cur;
                        const isIncome = tx.amountMinor > 0;
                        const amtStr = `${isIncome ? "+" : "−"}${L.formatMoney(Math.abs(tx.amountMinor), txCur, loc)}`;
                        const accent = moneyCatAccent(idx);
                        return `
                          <div class="a-tx-row${isReadOnly ? " is-readonly" : ""}" data-tx-id="${escapeHtml(tx.id)}" data-tx-ro="${isReadOnly ? "1" : "0"}">
                            <span class="a-tx-ic" style="background:${accent.soft};color:${accent.color};">${ICONS.euroIc}</span>
                            <div class="a-tx-copy">
                              <div class="a-tx-title">${escapeHtml(tx.note || catName || mCopy.expense)}</div>
                              <div class="a-tx-meta">
                                ${
                                  isReadOnly
                                    ? `<span>${escapeHtml(mCopy.billFlow)}</span><span class="a-sub-pill">${escapeHtml(mCopy.subReadOnly)}</span>`
                                    : `${catName ? `<span class="a-tx-cat-pill">${escapeHtml(catName)}</span>` : ""}`
                                }
                              </div>
                            </div>
                            <div class="a-tx-right">
                              <span class="a-tx-amt ${isIncome ? "is-in" : "is-out"}">${escapeHtml(amtStr)}</span>
                              ${
                                !isReadOnly
                                  ? `<button type="button" class="a-tx-del-btn" data-tx-del="${escapeHtml(tx.id)}" aria-label="${escapeHtml(mCopy.deleteLabel)}">${ICONS.trash}</button>`
                                  : ""
                              }
                            </div>
                          </div>
                        `;
                      })
                      .join("")}
                  </section>
                `;
              })
              .join("")
      }
    `;

    els.moneyRoot.querySelector("#androidMoneyAddBtn")?.addEventListener("click", () => openKeypadSheet({ date: todayIso }));
    els.moneyRoot.querySelector("#androidMoneyEmptyAdd")?.addEventListener("click", () => openKeypadSheet({ date: todayIso }));
    els.moneyRoot.querySelector("#androidMoneyEmptyImport")?.addEventListener("click", () => { void core()?.openBankImport?.().catch(error => showUndoSnackbar(error.message)); });
    els.moneyRoot.querySelector("#androidMoneyClearDrill")?.addEventListener("click", () => {
      moneyDrillCatId = "";
      syncUI();
    });
    els.moneyRoot.querySelectorAll("[data-money-cat]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.moneyCat;
        moneyDrillCatId = moneyDrillCatId === id ? "" : id;
        syncUI();
      });
    });
    const txById = new Map(dayGroups.flatMap(g => g.rows).map(tx => [tx.id, tx]));
    els.moneyRoot.querySelectorAll("[data-tx-del]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const id = btn.dataset.txDel;
        const removedInfo = core()?.removeLedgerTransaction?.(id);
        if (removedInfo?.removed) {
          showUndoSnackbar(mCopy.deletedUndo, () => {
            core()?.restoreLedgerTransaction?.(removedInfo.removed, removedInfo.index);
          });
        }
      });
    });
    els.moneyRoot.querySelectorAll('.a-tx-row[data-tx-ro="1"]').forEach(row => {
      row.addEventListener("click", () => {
        const tx = txById.get(row.dataset.txId);
        if (tx) openSubDetailSheet(tx);
      });
    });
  }

  function renderTimelineDaily() {
    if (!els.timelineRoot) return;
    if (getActiveView() !== "timeline") {
      els.timelineRoot.hidden = true;
      return;
    }
    els.timelineRoot.hidden = false;

    const raw = core()?.getState?.() || {};
    if (!panelChanged(els.timelineRoot, [raw.logs, raw.habits, raw.focusSessions, raw.ledger, timelineYm])) return;
    const c = core();
    const copy = t();
    const hCopy = copy.history;
    const todayIso = c?.getTodayIso?.() || toIsoDate(new Date());
    if (!timelineYm) timelineYm = todayIso.slice(0, 7);
    const data = c?.getMonthTimelineData?.(timelineYm);
    if (!data) return;

    const mNum = Number(data.ym.slice(5, 7));
    const monthShort = lang() === "zh" ? `${mNum}` : new Intl.DateTimeFormat(localeTag(), { month: "short" }).format(new Date(Number(data.ym.slice(0, 4)), mNum - 1, 1, 12));

    const moodMeta = mood => {
      if (mood === "很好") return { cls: "good", icon: ICONS.moodGood, label: copy.today.moods["很好"] };
      if (mood === "平静") return { cls: "calm", icon: ICONS.moodCalm, label: copy.today.moods["平静"] };
      if (mood === "低落") return { cls: "low", icon: ICONS.moodLow, label: copy.today.moods["低落"] };
      return { cls: "none", icon: ICONS.moodCalm, label: "" };
    };

    const spacers = Array.from({ length: data.firstDow }, () => `<span class="a-cal-cell is-spacer" aria-hidden="true"></span>`).join("");
    const demoThumb = c?.isIsolatedDemoActive?.() ? "./assets/demo-memories/cafe-reading.jpg" : "";

    els.timelineRoot.innerHTML = `
      <section class="a-card a-cal-card">
        <div class="a-cal-head">
          <strong class="a-cal-month">${escapeHtml(formatYmLabel(data.ym))}</strong>
          <div class="a-cal-legend">
            <span><i style="background:var(--a-good)"></i>${escapeHtml(hCopy.goodShort)} ${data.counts.good}</span>
            <span><i style="background:var(--a-calm)"></i>${escapeHtml(hCopy.calmShort)} ${data.counts.calm}</span>
            <span><i style="background:var(--a-low)"></i>${escapeHtml(hCopy.lowShort)} ${data.counts.low}</span>
          </div>
        </div>
        <div class="a-cal-scroll">
        <div class="a-cal-dow">${copy.weekdays.map(w => `<span>${escapeHtml(w)}</span>`).join("")}</div>
        <div class="a-cal-grid">
          ${spacers}
          ${data.calendarDays
            .map(d => {
              const moodCls =
                d.mood === "很好" ? "is-good" : d.mood === "平静" ? "is-calm" : d.mood === "低落" ? "is-low" : d.isFuture ? "is-future" : "is-blank";
              return `<button type="button" class="a-cal-cell ${moodCls}${d.isToday ? " is-today" : ""}" data-cal-date="${d.iso}" ${d.isFuture ? "disabled" : ""}>${d.day}</button>`;
            })
            .join("")}
        </div>
        </div>
      </section>

      <div class="a-tl-sec-head">
        <span>${escapeHtml(hCopy.dailyRecorded(monthShort, data.recordedDays))}</span>
        <span class="a-tl-filter-tag">${escapeHtml(hCopy.pureMoodFiltered)}</span>
      </div>

      ${
        data.entries.length
          ? `
        <div class="a-tl-feed">
          ${data.entries
            .slice(0, 20)
            .map((entry, idx) => {
              const mm = moodMeta(entry.mood);
              const stats = [
                hCopy.statHabit(entry.doneCount, entry.totalHabits),
                entry.focusMinutes > 0 ? hCopy.statFocus(entry.focusMinutes) : "",
                entry.spendFormatted ? hCopy.statSpend(entry.spendFormatted) : "",
              ].filter(Boolean);
              const showThumb = idx === 0 && demoThumb;
              return `
                <article class="a-tl-item" data-tl-date="${entry.date}">
                  <div class="a-tl-rail">
                    <span class="a-tl-node is-${mm.cls}">${mm.icon}</span>
                    <span class="a-tl-line" aria-hidden="true"></span>
                  </div>
                  <button type="button" class="a-card a-tl-card" data-tl-open="${entry.date}">
                    <div class="a-tl-card-head">
                      <strong>${escapeHtml(formatTopDate(entry.date))}</strong>
                      ${mm.label ? `<span class="a-tl-mood-pill is-${mm.cls}">${mm.icon}<span>${escapeHtml(mm.label)}</span></span>` : ""}
                    </div>
                    <div class="a-tl-body">
                      ${showThumb ? `<img class="a-tl-thumb" src="${demoThumb}" alt="">` : ""}
                      <p class="a-tl-excerpt">${escapeHtml(entry.text)}</p>
                    </div>
                    <div class="a-tl-stats">${stats.map(s => `<span>${escapeHtml(s)}</span>`).join("")}</div>
                  </button>
                </article>
              `;
            })
            .join("")}
        </div>
      `
          : `<section class="a-card a-tl-empty-card"><p>${escapeHtml(hCopy.dailyEmpty)}</p></section>`
      }
    `;

    els.timelineRoot.querySelectorAll("[data-cal-date], [data-tl-open]").forEach(btn => {
      btn.addEventListener("click", () => {
        const dt = btn.dataset.calDate || btn.dataset.tlOpen;
        if (!dt) return;
        c?.selectDate?.(dt);
        openSheet("mood", { fromFab: false });
      });
    });
  }

  function renderTimelineWeek() {
    if (!els.weekRoot) return;
    if (getActiveView() !== "week") {
      els.weekRoot.hidden = true;
      return;
    }
    els.weekRoot.hidden = false;

    const raw = core()?.getState?.() || {};
    if (!panelChanged(els.weekRoot, [raw.logs, raw.habits, raw.focusSessions, raw.weeklyOutputs, raw.weeklyGoals, raw.reviews, weekKeySel])) return;
    const c = core();
    const copy = t();
    const h = copy.history;
    const data = c?.getWeekData?.(weekKeySel);
    if (!data) return;
    weekKeySel = data.weekKey;

    const focusHoursText = `${(data.focusMinutes / 60).toFixed(1).replace(".", localeDecimalSeparator(lang()))} h`;
    const goalsDone = data.goals.filter(g => g.done).length;
    const mNum = Number(data.monthYm.slice(5, 7));
    const monthShort = lang() === "zh" ? `${mNum}` : new Intl.DateTimeFormat(localeTag(), { month: "short" }).format(new Date(Number(data.monthYm.slice(0, 4)), mNum - 1, 1, 12));

    els.weekRoot.innerHTML = `
      <section class="a-card a-wk-rhythm-card">
        <div class="a-card-head">
          <div class="a-card-title-row">
            <span class="a-chip-ic a-chip-primary">${ICONS.rhythmIc}</span>
            <h2 class="a-card-title">${escapeHtml(h.weekRhythm)}</h2>
          </div>
          <span class="a-card-meta">${escapeHtml(h.weekNum(data.weekNum, data.isCurrent))}</span>
        </div>
        <div class="a-wk-bars">
          ${data.days
            .map(d => {
              const dotCol = d.mood === "很好" ? "var(--a-good)" : d.mood === "平静" ? "var(--a-calm)" : d.mood === "低落" ? "var(--a-low)" : "";
              return `
                <div class="a-wk-col${d.future ? " is-future" : ""}">
                  <div class="a-wk-track">${!d.future && d.pct > 0 ? `<span style="height:${Math.max(12, d.pct)}%"></span>` : ""}</div>
                  <span class="a-mdot" style="${dotCol ? `background:${dotCol}` : ""}"></span>
                  <small>${escapeHtml(copy.weekdays[d.weekdayIndex] || "")}</small>
                </div>
              `;
            })
            .join("")}
        </div>
        <div class="a-wk-kpis">
          <div class="a-wk-kpi">
            <small>${escapeHtml(h.weekHabitRate)}</small>
            <strong>${data.completionPct}%</strong>
            <span>${escapeHtml(h.weekTimes(data.totalDone, data.totalPossible))}</span>
          </div>
          <div class="a-wk-kpi">
            <small>${escapeHtml(h.weekFocus)}</small>
            <strong class="is-focus">${escapeHtml(focusHoursText)}</strong>
            <span>${escapeHtml(h.weekFocusDelta(data.focusDeltaMinutes))}</span>
          </div>
          <div class="a-wk-kpi">
            <small>${escapeHtml(h.weekMood)}</small>
            <strong class="is-sm a-wk-mood-dots">
              <span><i style="background:var(--a-good)"></i>${data.moodCounts.good}</span>
              <span><i style="background:var(--a-calm)"></i>${data.moodCounts.calm}</span>
            </strong>
            <span>${escapeHtml(h.weekMoodLow(data.moodCounts.low))}</span>
          </div>
        </div>
      </section>

      <section class="a-card a-wk-goals-card">
        <div class="a-card-head">
          <div class="a-card-title-row">
            <span class="a-chip-ic a-chip-good">${ICONS.check}</span>
            <h2 class="a-card-title">${escapeHtml(h.weekGoals)}</h2>
          </div>
          <span class="a-card-meta">${escapeHtml(h.goalsDone(goalsDone, data.goals.length))}</span>
        </div>
        <div class="a-wk-goal-list">
          ${data.goals
            .map(g => `
              <div class="a-wk-goal-row${g.done ? " is-done" : ""}">
                <button type="button" class="a-wk-goal-toggle" data-wk-goal="${escapeHtml(g.id)}" aria-pressed="${Boolean(g.done)}">
                  <span class="a-wk-chk">${g.done ? ICONS.check : ""}</span>
                  <span class="a-wk-goal-text">${escapeHtml(g.text)}</span>
                </button>
                <button type="button" class="a-tx-del-btn" data-wk-goal-del="${escapeHtml(g.id)}" aria-label="${escapeHtml(copy.money.deleteLabel)}">${ICONS.trash}</button>
              </div>
            `)
            .join("")}
        </div>
        <form class="a-wk-goal-add" id="androidWkGoalForm">
          <input type="text" id="androidWkGoalInput" maxlength="120" placeholder="${escapeHtml(h.addGoalPlaceholder)}">
          <button type="submit">${escapeHtml(h.addGoalBtn)}</button>
        </form>
      </section>

      <section class="a-card a-wk-review-card">
        <div class="a-card-head">
          <h2 class="a-card-title">${escapeHtml(h.weekReviewTitle)}</h2>
          <span class="a-wk-badge">${escapeHtml(h.weekReviewAction)}</span>
        </div>
        <textarea class="a-review-textarea" id="androidWkReviewInput" rows="4" placeholder="${escapeHtml(h.weekReviewPlaceholder)}">${escapeHtml(data.output)}</textarea>
        <div class="a-review-foot">
          <span>${escapeHtml(h.savedLocal)}</span>
          <span id="androidWkReviewCount">${escapeHtml(copy.sheet.chars(data.output.length))}</span>
        </div>
      </section>

      ${
        !data.monthWritten
          ? `
        <button type="button" class="a-month-blank-banner" id="androidGoMonthReview">
          <div class="a-month-blank-copy">
            <strong>${escapeHtml(h.monthUnwrittenTitle(monthShort))}</strong>
            <span>${escapeHtml(h.monthUnwrittenSub)}</span>
          </div>
          <span class="a-month-blank-cta">${escapeHtml(h.goWrite)}</span>
        </button>
      `
          : ""
      }
    `;

    els.weekRoot.querySelectorAll("[data-wk-goal]").forEach(btn => {
      btn.addEventListener("click", () => c?.toggleWeeklyGoal?.(data.weekKey, btn.dataset.wkGoal));
    });
    els.weekRoot.querySelectorAll("[data-wk-goal-del]").forEach(btn => {
      btn.addEventListener("click", () => {
        const res = c?.removeWeeklyGoal?.(data.weekKey, btn.dataset.wkGoalDel);
        if (res?.removed) {
          showUndoSnackbar(h.goalDeletedUndo, () => {
            c?.restoreWeeklyGoal?.(data.weekKey, res.removed, res.index);
          });
        }
      });
    });
    els.weekRoot.querySelector("#androidWkGoalForm")?.addEventListener("submit", e => {
      e.preventDefault();
      const inp = els.weekRoot.querySelector("#androidWkGoalInput");
      if (inp?.value?.trim()) {
        c?.addWeeklyGoal?.(data.weekKey, inp.value.trim());
      }
    });
    const wkText = els.weekRoot.querySelector("#androidWkReviewInput");
    wkText?.addEventListener("input", () => {
      c?.setWeeklyOutput?.(data.weekKey, wkText.value);
      const cnt = els.weekRoot.querySelector("#androidWkReviewCount");
      if (cnt) cnt.textContent = copy.sheet.chars(wkText.value.length);
    });
    els.weekRoot.querySelector("#androidGoMonthReview")?.addEventListener("click", () => {
      monthReviewYm = data.monthYm;
      c?.switchToView?.("review");
      syncUI();
    });
  }

  function renderTimelineMonth() {
    if (!els.monthRoot) return;
    if (getActiveView() !== "review") {
      els.monthRoot.hidden = true;
      return;
    }
    els.monthRoot.hidden = false;

    const raw = core()?.getState?.() || {};
    if (!panelChanged(els.monthRoot, [raw.logs, raw.habits, raw.focusSessions, raw.ledger, raw.reviews, monthReviewYm])) return;
    const c = core();
    const copy = t();
    const h = copy.history;
    const todayIso = c?.getTodayIso?.() || toIsoDate(new Date());
    if (!monthReviewYm) monthReviewYm = todayIso.slice(0, 7);
    const data = c?.getMonthReviewData?.(monthReviewYm);
    if (!data) return;

    const mNum = Number(data.ym.slice(5, 7));
    const monthShort = lang() === "zh" ? `${mNum}` : new Intl.DateTimeFormat(localeTag(), { month: "short" }).format(new Date(Number(data.ym.slice(0, 4)), mNum - 1, 1, 12));
    const isUnwritten = !data.reviewText.trim();

    els.monthRoot.innerHTML = `
      <section class="a-card">
        <div class="a-card-head">
          <h2 class="a-card-title">${escapeHtml(h.monthOverview)}</h2>
          <span class="a-card-meta">${escapeHtml(formatYmLabel(data.ym))}</span>
        </div>
        <div class="a-wk-kpis">
          <div class="a-wk-kpi">
            <small>${escapeHtml(h.monthHabitRate)}</small>
            <strong>${data.completionPct}%</strong>
          </div>
          <div class="a-wk-kpi">
            <small>${escapeHtml(h.monthFocusTotal)}</small>
            <strong class="is-focus">${data.focusMinutes} ${escapeHtml(copy.focus.unitMin)}</strong>
          </div>
          <div class="a-wk-kpi">
            <small>${escapeHtml(h.monthSpend)}</small>
            <strong class="is-sm">${escapeHtml(data.expenseFormatted)}</strong>
          </div>
        </div>
      </section>

      <section class="a-card">
        <div class="a-card-head">
          <h2 class="a-card-title">${escapeHtml(h.monthHabitsTitle)}</h2>
        </div>
        <div class="a-mo-habit-list">
          ${data.habitRows
            .map(row => `
              <div class="a-mo-habit-row">
                <div class="a-mo-habit-top">
                  <span class="a-mo-habit-name">${escapeHtml(row.name)}</span>
                  <span class="a-mo-habit-stat">${row.done} / ${row.total} · ${row.pct}%</span>
                </div>
                <div class="a-mo-habit-bar"><span style="width:${Math.max(3, row.pct)}%"></span></div>
              </div>
            `)
            .join("")}
        </div>
      </section>

      <section class="a-card a-mo-review-card">
        <div class="a-card-head">
          <h2 class="a-card-title">${escapeHtml(h.monthReviewTitle(monthShort))}</h2>
        </div>
        ${isUnwritten ? `<p class="a-mo-blank-hint" id="androidMonthBlankHint">${escapeHtml(h.monthReviewEmpty(monthShort))}</p>` : ""}
        <textarea class="a-review-textarea" id="androidMonthReviewInput" rows="5" placeholder="${escapeHtml(h.monthReviewPlaceholder)}">${escapeHtml(data.reviewText)}</textarea>
        <div class="a-review-foot">
          <span>${escapeHtml(h.savedLocal)}</span>
          <span id="androidMonthReviewCount">${escapeHtml(copy.sheet.chars(data.reviewText.length))}</span>
        </div>
      </section>
    `;

    const inp = els.monthRoot.querySelector("#androidMonthReviewInput");
    inp?.addEventListener("input", () => {
      c?.setMonthlyReview?.(data.ym, inp.value);
      const hint = els.monthRoot.querySelector("#androidMonthBlankHint");
      if (hint) hint.hidden = Boolean(inp.value.trim());
      const cnt = els.monthRoot.querySelector("#androidMonthReviewCount");
      if (cnt) cnt.textContent = copy.sheet.chars(inp.value.length);
    });
  }

  function renderTimelineHorizon() {
    if (!els.horizonRoot) return;
    if (getActiveView() !== "longrange") {
      els.horizonRoot.hidden = true;
      return;
    }
    els.horizonRoot.hidden = false;

    const raw = core()?.getState?.() || {};
    if (!panelChanged(els.horizonRoot, [raw.planning, raw.longTermGoals])) return;
    const c = core();
    const h = t().history;
    const data = c?.getHorizonData?.() || { phases: [], currentPhase: null, goals: [] };
    const phase = data.currentPhase;

    els.horizonRoot.innerHTML = `
      ${
        phase
          ? `
        <section class="a-card a-hz-phase-card">
          <span class="a-w-kicker" style="margin-top:0">${escapeHtml(h.horizonPhaseKicker)}</span>
          <h2 class="a-hz-phase-title">${escapeHtml(phase.name)}</h2>
          <div class="a-hz-dates">${escapeHtml(`${phase.startDate} — ${phase.endDate}`)}</div>
          ${phase.focus ? `<p class="a-hz-focus">${escapeHtml(phase.focus)}</p>` : ""}
        </section>
      `
          : `<section class="a-card a-tl-empty-card"><p>${escapeHtml(h.horizonNoPhase)}</p></section>`
      }

      ${
        data.goals.length
          ? `
        <div class="a-tl-sec-head"><span>${escapeHtml(h.horizonPlansTitle)}</span><span>${data.goals.length}</span></div>
        <div class="a-hz-list">
          ${data.goals
            .map(g => {
              const steps = Array.isArray(g.steps) ? g.steps : [];
              const done = steps.filter(s => s.done).length;
              const pct = steps.length ? Math.round((done / steps.length) * 100) : g.status === "completed" ? 100 : 0;
              return `
                <section class="a-card a-hz-goal-card">
                  <div class="a-card-head">
                    <h3 class="a-card-title">${escapeHtml(g.name)}</h3>
                    <span class="a-card-meta">${steps.length ? `${done}/${steps.length}` : `${pct}%`}</span>
                  </div>
                  <div class="a-mo-habit-bar" style="margin-bottom:8px;"><span style="width:${Math.max(4, pct)}%"></span></div>
                  ${g.nextAction ? `<p class="a-hz-next">${escapeHtml(g.nextAction)}</p>` : ""}
                  ${
                    steps.length
                      ? `<div class="a-wk-goal-list">
                          ${steps
                            .slice(0, 4)
                            .map(st => `
                              <button type="button" class="a-wk-goal-toggle${st.done ? " is-done" : ""}" data-hz-goal="${escapeHtml(g.id)}" data-hz-step="${escapeHtml(st.id)}" aria-pressed="${Boolean(st.done)}">
                                <span class="a-wk-chk">${st.done ? ICONS.check : ""}</span>
                                <span class="a-wk-goal-text">${escapeHtml(st.text)}</span>
                              </button>
                            `)
                            .join("")}
                        </div>`
                      : ""
                  }
                </section>
              `;
            })
            .join("")}
        </div>
      `
          : `<section class="a-card a-tl-empty-card"><p>${escapeHtml(h.horizonEmpty)}</p></section>`
      }
    `;

    els.horizonRoot.querySelectorAll("[data-hz-step]").forEach(btn => {
      btn.addEventListener("click", () => c?.toggleHorizonStep?.(btn.dataset.hzGoal, btn.dataset.hzStep));
    });
  }

  function renderHabits() {
    if (!els.habitsRoot) return;
    if (getActiveView() !== "habits") {
      els.habitsRoot.hidden = true;
      return;
    }
    els.habitsRoot.hidden = false;

    const raw = core()?.getState?.() || {};
    if (!panelChanged(els.habitsRoot, [raw.logs, raw.habits, core()?.getReminderSettings?.(), habitsFilter])) return;
    const c = core();
    const copy = t();
    const hb = copy.habits;
    const data = c?.getHabitsListData?.();
    if (!data) return;

    const allItems = data.items || [];
    const activeItems = allItems.filter(it => it.active);
    const dailyItems = activeItems.filter(it => it.frequency === "daily");
    const periodicItems = activeItems.filter(it => it.frequency !== "daily");
    const pausedItems = allItems.filter(it => !it.active);

    const visible =
      habitsFilter === "daily"
        ? dailyItems
        : habitsFilter === "periodic"
          ? periodicItems
          : habitsFilter === "paused"
            ? pausedItems
            : activeItems;

    const mNum = Number(data.ym.slice(5, 7));
    const monthShort = lang() === "zh" ? `${mNum}` : new Intl.DateTimeFormat(localeTag(), { month: "short" }).format(new Date(Number(data.ym.slice(0, 4)), mNum - 1, 1, 12));

    els.habitsRoot.innerHTML = `
      <div class="a-hb-filters" role="tablist">
        <button type="button" class="a-hb-pill${habitsFilter === "all" ? " is-active" : ""}" data-hb-filter="all">${escapeHtml(hb.filterAll(activeItems.length))}</button>
        <button type="button" class="a-hb-pill${habitsFilter === "daily" ? " is-active" : ""}" data-hb-filter="daily">${escapeHtml(hb.filterDaily(dailyItems.length))}</button>
        <button type="button" class="a-hb-pill${habitsFilter === "periodic" ? " is-active" : ""}" data-hb-filter="periodic">${escapeHtml(hb.filterPeriodic(periodicItems.length))}</button>
        <button type="button" class="a-hb-pill${habitsFilter === "paused" ? " is-active" : ""}" data-hb-filter="paused">${escapeHtml(hb.filterPaused(pausedItems.length))}</button>
      </div>

      <button type="button" class="a-hb-reminder" id="androidHabitsReminderBtn">
        <span class="a-hb-rem-left">${ICONS.bell}<span>${escapeHtml(hb.reminderTitle)}</span></span>
        <span class="a-hb-rem-right">${escapeHtml(data.reminder?.enabled ? hb.reminderOn(data.reminder.time || "21:30") : hb.reminderOff)}</span>
      </button>

      ${
        !visible.length
          ? `
        <section class="a-empty-card">
          <div class="a-empty-art">${ICONS.firstRunArt}</div>
          <h2 class="a-empty-title">${escapeHtml(hb.emptyTitle)}</h2>
          <p class="a-empty-desc">${escapeHtml(hb.emptyDesc)}</p>
          <div class="a-empty-actions">
            <button type="button" class="a-btn-primary" id="androidHabitsEmptyAdd">${escapeHtml(hb.emptyCta)}</button>
          </div>
        </section>
      `
          : visible
              .map(it => {
                const tone = habitIconTone(it.iconKey);
                const isPeriodic = it.frequency !== "daily";
                const detailText = it.trackingMode === "measured" && it.target ? `${it.target} ${it.unit}`.trim() : hb.checklist;
                const periodWord = it.frequency === "monthly" ? hb.perMonth : hb.perWeek;
                const metaLine = isPeriodic
                  ? hb.periodicMeta(periodWord, it.periodTarget, it.frequency === "monthly" ? it.monthDone : it.weekDone)
                  : hb.dailyMeta(it.streak, detailText);
                const monthTarget = it.frequency === "weekly" ? it.periodTarget * 4 : it.periodTarget;
                return `
                  <article class="a-card a-hb-card${!it.active ? " is-paused" : ""}" data-hb-id="${escapeHtml(it.id)}">
                    <div class="a-hb-top">
                      <button type="button" class="a-hb-info" data-hb-edit="${escapeHtml(it.id)}">
                        <span class="a-hb-ic" style="background:${tone.bg};color:${tone.fg};">${habitIconSvg(it.habit, 19)}</span>
                        <span class="a-hb-copy">
                          <strong>${escapeHtml(it.name)}</strong>
                          <small>${escapeHtml(metaLine)}</small>
                        </span>
                      </button>
                      <button type="button" class="a-hb-check${it.todayDone ? " is-done" : ""}" style="${it.todayDone ? `background:${tone.fg};border-color:${tone.fg};` : ""}" data-hb-toggle="${escapeHtml(it.id)}" aria-pressed="${it.todayDone}" aria-label="${escapeHtml(it.name)}">
                        ${it.todayDone ? ICONS.check : ""}
                      </button>
                    </div>
                    ${
                      isPeriodic
                        ? `
                      <div class="a-hb-dots" aria-hidden="true">
                        ${it.monthDots
                          .map(d => `<span class="a-hb-dot${d.done ? " is-done" : d.future ? " is-future" : ""}" style="${d.done ? `background:${tone.fg};` : ""}"></span>`)
                          .join("")}
                      </div>
                      <div class="a-hb-foot">
                        <span>${escapeHtml(hb.monthDist(monthShort))}</span>
                        <div class="a-hb-foot-right">
                          <span style="color:${tone.fg};font-weight:600;">${escapeHtml(hb.monthProgress(it.monthDone, monthTarget))}</span>
                          <button type="button" class="a-hb-pause-btn" data-hb-pause="${escapeHtml(it.id)}" data-hb-name="${escapeHtml(it.name)}" data-hb-active="${it.active ? "1" : "0"}">${escapeHtml(it.active ? hb.pause : hb.resume)}</button>
                        </div>
                      </div>
                    `
                        : `
                      <div class="a-hb-grid14" aria-hidden="true">
                        ${it.grid14
                          .map(d => `<span class="a-hb-tile${d.done ? " is-done" : d.isToday ? " is-today-todo" : ""}" style="${d.done ? `background:${tone.fg};` : ""}"></span>`)
                          .join("")}
                      </div>
                      <div class="a-hb-foot">
                        <span>${escapeHtml(hb.ago14)}</span>
                        <div class="a-hb-foot-right">
                          <span class="${it.todayDone ? "is-done-txt" : "is-todo-txt"}">${escapeHtml(it.todayDone ? hb.doneToday : hb.todoToday)}</span>
                          <button type="button" class="a-hb-pause-btn" data-hb-pause="${escapeHtml(it.id)}" data-hb-name="${escapeHtml(it.name)}" data-hb-active="${it.active ? "1" : "0"}">${escapeHtml(it.active ? hb.pause : hb.resume)}</button>
                        </div>
                      </div>
                    `
                    }
                  </article>
                `;
              })
              .join("")
      }

      <p class="a-hb-hint">${escapeHtml(hb.footerHint)}</p>
    `;

    els.habitsRoot.querySelectorAll("[data-hb-filter]").forEach(btn => {
      btn.addEventListener("click", () => {
        habitsFilter = btn.dataset.hbFilter;
        syncUI();
      });
    });
    els.habitsRoot.querySelector("#androidHabitsReminderBtn")?.addEventListener("click", () => { sheetMode = "reminder"; renderSheetContent(); presentSheet({ fromFab: false }); });
    els.habitsRoot.querySelector("#androidHabitsEmptyAdd")?.addEventListener("click", () => c?.openAddHabit?.());
    els.habitsRoot.querySelectorAll("[data-hb-toggle]").forEach(btn => {
      btn.addEventListener("click", () => c?.toggleHabitImmediate?.(data.todayCap, btn.dataset.hbToggle));
    });
    els.habitsRoot.querySelectorAll("[data-hb-edit]").forEach(btn => {
      btn.addEventListener("click", () => c?.openEditHabit?.(btn.dataset.hbEdit));
    });
    els.habitsRoot.querySelectorAll("[data-hb-pause]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.hbPause;
        const name = btn.dataset.hbName;
        const wasActive = btn.dataset.hbActive === "1";
        c?.setHabitActive?.(id, !wasActive);
        showUndoSnackbar(wasActive ? hb.pausedUndo(name) : hb.resumedUndo(name), () => {
          c?.setHabitActive?.(id, wasActive);
        });
      });
    });
  }

  /* ============================================================================
     Phase 5: Full-Screen Focus Timer (10-focus, l019) + Top-Bar Focus Capsule
     ============================================================================ */

  function openFocusOverlay() {
    focusOpen = true;
    const fs = core()?.getFocusState?.();
    if (fs?.snapshot?.label) focusTopicDraft = fs.snapshot.label;
    else if (!focusTopicDraft) focusTopicDraft = fs?.settings?.defaultTopic || t().focus.defaultTopic;
    if (fs?.settings?.focusMinutes) focusDurationDraft = fs.settings.focusMinutes;
    els.focusOverlay.hidden = false;
    renderFocusOverlay();
    syncFocusCapsule();
    pushBackStateIfNeeded();
  }

  function closeFocusOverlay() {
    if (!focusOpen) return;
    focusOpen = false;
    els.focusOverlay.hidden = true;
    syncFocusCapsule();
    syncUI();
  }

  function syncFocusCapsule() {
    const cap = els.topbar?.querySelector("#androidFocusCapsule");
    if (!cap) return;
    const fs = core()?.getFocusState?.();
    const snap = fs?.snapshot || null;
    const show = Boolean(snap) && !focusOpen;
    cap.hidden = !show;
    if (show) {
      cap.setAttribute("aria-label", `${t().focus.capsuleAria} · ${fs.remainingText}`);
      cap.classList.toggle("is-paused", snap.status === "paused");
      cap.querySelector("#androidFocusCapTime").textContent = fs.remainingText || "00:00";
    }
  }

  function renderFocusTopicSheetContent() {
    const f = t().focus;
    const fs = core()?.getFocusState?.();
    const topics = [...new Set([...f.presetTopics, ...(fs?.recentTopics || [])])].slice(0, 8);
    els.sheetBody.innerHTML = `
      <div class="a-sheet-head">
        <h2 class="a-sheet-title" id="androidSheetTitle">${escapeHtml(f.chooseTopic)}</h2>
      </div>
      <div class="a-sheet-scroll">
        <div class="a-chip-wrap">
          ${topics
            .map(tp => `<button type="button" class="a-h-chip${tp === focusTopicDraft ? " is-done" : ""}" data-ft-pick="${escapeHtml(tp)}">${escapeHtml(tp)}</button>`)
            .join("")}
        </div>
        <div class="a-weather-search-row" style="margin-top:8px;">
          <input type="text" id="androidFocusCustomTopic" class="a-weather-search-input" maxlength="60" placeholder="${escapeHtml(f.customTopicPlaceholder)}" value="${escapeHtml(focusTopicDraft)}">
          <button type="button" class="a-weather-search-btn" id="androidFocusCustomApply">${escapeHtml(t().cardLib.done)}</button>
        </div>
      </div>
    `;
    els.sheetBody.querySelectorAll("[data-ft-pick]").forEach(btn => {
      btn.addEventListener("click", () => {
        focusTopicDraft = btn.dataset.ftPick;
        closeSheet();
        if (focusOpen) renderFocusOverlay();
      });
    });
    els.sheetBody.querySelector("#androidFocusCustomApply")?.addEventListener("click", () => {
      const v = els.sheetBody.querySelector("#androidFocusCustomTopic")?.value?.trim();
      if (v) focusTopicDraft = v;
      closeSheet();
      if (focusOpen) renderFocusOverlay();
    });
  }

  function renderFocusOverlay() {
    if (!els.focusOverlay || !focusOpen) return;
    const c = core();
    const f = t().focus;
    const fs = c?.getFocusState?.() || { snapshot: null, remainingText: "", settings: { focusMinutes: 25, breakMinutes: 5 }, totalMinutes: 0, topics: [] };
    const snap = fs.snapshot;
    const isBreak = snap?.phase === "break";
    const isRunning = snap?.status === "running";
    const isPaused = snap?.status === "paused";
    const isReadyBreak = isBreak && snap?.status === "ready";
    const durationMs = snap ? Math.max(60000, Number(snap.durationMs) || 25 * 60000) : focusDurationDraft * 60000;
    const remainingMs = snap ? Number(snap.remainingMs) || 0 : durationMs;
    const progress = snap ? Math.max(isRunning ? 0.04 : 0, Math.min(1, 1 - remainingMs / durationMs)) : 0;
    const elapsedMin = snap && !isBreak ? Math.max(0, Math.round((durationMs - remainingMs) / 60000)) : 0;
    const plannedMin = Math.round(durationMs / 60000);
    const timeDisplay = snap ? fs.remainingText : `${String(focusDurationDraft).padStart(2, "0")}:00`;
    const activeTopic = snap?.label || focusTopicDraft || f.defaultTopic;

    const statusBadge = isBreak
      ? f.breakBadge
      : isRunning
        ? f.runningBadge(elapsedMin)
        : isPaused
          ? f.pausedBadge
          : f.readyBadge;

    const r = 98;
    const circ = Math.round(2 * Math.PI * r * 10) / 10;
    const dashOffset = Math.round(circ * (1 - progress) * 10) / 10;
    const topicColors = ["#6D5ACF", "#2B72B8", "#D97706", "#2E7D5B"];

    const structure = JSON.stringify([lang(), isDark(), snap?.phase, snap?.status, snap?.durationMs, activeTopic, focusDurationDraft, fs.totalMinutes, fs.topics]);
    if (focusStructure === structure && els.focusOverlay.querySelector("#androidFocusClock")) {
      const clock = els.focusOverlay.querySelector("#androidFocusClock");
      if (clock.textContent !== timeDisplay) clock.textContent = timeDisplay;
      const badge = els.focusOverlay.querySelector(".a-focus-status-pill > span:last-child");
      if (badge.textContent !== statusBadge) badge.textContent = statusBadge;
      els.focusOverlay.querySelector(".a-focus-ring-prog")?.setAttribute("stroke-dashoffset", String(dashOffset));
      return;
    }
    focusStructure = structure;

    els.focusOverlay.innerHTML = `
      <div class="a-focus-shell">
        <header class="a-focus-top">
          <button type="button" class="a-icon-btn a-focus-min" id="androidFocusMinBtn" aria-label="Minimize">${ICONS.chevDown}</button>
          <button type="button" class="a-focus-topic-pill" id="androidFocusTopicBtn">
            <span class="a-focus-dot" aria-hidden="true"></span>
            <span>${escapeHtml(activeTopic)}</span>
            <span aria-hidden="true">▾</span>
          </button>
          <button type="button" class="a-icon-btn a-focus-break-btn" id="androidFocusBreakBtn" aria-label="${escapeHtml(f.startBreak)}">${ICONS.cup}</button>
        </header>

        <div class="a-focus-center">
          <div class="a-focus-status-pill">
            <span class="a-focus-dot${isRunning ? " is-live" : ""}" aria-hidden="true"></span>
            <span>${escapeHtml(statusBadge)}</span>
          </div>

          <div class="a-focus-ring-wrap">
            <svg class="a-focus-ring-svg" viewBox="0 0 228 228" aria-hidden="true">
              <circle class="a-focus-ring-track" cx="114" cy="114" r="${r}" />
              <circle class="a-focus-ring-prog" cx="114" cy="114" r="${r}" stroke-dasharray="${circ}" stroke-dashoffset="${dashOffset}" />
            </svg>
            <div class="a-focus-ring-inner">
              <strong class="a-focus-clock" id="androidFocusClock">${escapeHtml(timeDisplay)}</strong>
              <span class="a-focus-sub">${escapeHtml(snap ? f.remainingSub(plannedMin) : f.readySub(focusDurationDraft))}</span>
            </div>
          </div>

          ${
            !snap
              ? `
            <div class="a-focus-presets">
              ${[25, 35, 50]
                .map(m => `<button type="button" class="a-hb-pill${focusDurationDraft === m ? " is-active" : ""}" data-focus-dur="${m}">${m} ${escapeHtml(f.unitMin)}</button>`)
                .join("")}
            </div>
          `
              : ""
          }

          <div class="a-focus-controls">
            ${
              !snap
                ? `<button type="button" class="a-focus-btn-primary" id="androidFocusStartBtn">${ICONS.playIc}<span>${escapeHtml(f.start)}</span></button>`
                : isBreak
                  ? `
                    ${isReadyBreak ? `<button type="button" class="a-focus-btn-primary" id="androidFocusStartBreakBtn">${ICONS.playIc}<span>${escapeHtml(f.startBreak)}</span></button>` : ""}
                    <button type="button" class="a-focus-btn-sec" id="androidFocusSkipBreakBtn">${escapeHtml(f.skipBreak)}</button>
                  `
                  : `
                    <button type="button" class="a-focus-btn-sec" id="androidFocusPlus5Btn">${escapeHtml(f.plus5)}</button>
                    <button type="button" class="a-focus-btn-primary" id="androidFocusPauseBtn">${isRunning ? ICONS.pauseIc : ICONS.playIc}<span>${escapeHtml(isRunning ? f.pause : f.resume)}</span></button>
                    <button type="button" class="a-focus-btn-end" id="androidFocusEndBtn">${escapeHtml(f.end)}</button>
                  `
            }
          </div>
        </div>

        <section class="a-card a-focus-summary-card">
          <div class="a-focus-sum-head">
            <span class="a-focus-sum-title"><span class="a-chip-ic a-chip-focus">${ICONS.focusIc}</span><span>${escapeHtml(f.todayTotal)}</span></span>
            <strong class="a-focus-sum-val">${fs.totalMinutes}<small>${escapeHtml(f.unitMin)}</small></strong>
          </div>
          ${
            fs.topics.length
              ? `
            <div class="a-cat-bar" aria-hidden="true">
              ${fs.topics.map((tp, idx) => `<span style="flex:${tp.minutes};background:${topicColors[idx % topicColors.length]}"></span>`).join("")}
            </div>
            <div class="a-focus-topic-chips">
              ${fs.topics
                .map((tp, idx) => `<span class="a-focus-t-chip"><i style="background:${topicColors[idx % topicColors.length]}"></i>${escapeHtml(`${tp.label} ${tp.minutes} ${f.unitMin}`)}</span>`)
                .join("")}
            </div>
          `
              : ""
          }
          <div class="a-focus-sum-foot">
            <span>${escapeHtml(f.breakNote)}</span>
            <span>${escapeHtml(f.topicsNote)}</span>
          </div>
        </section>
      </div>
    `;

    els.focusOverlay.querySelector("#androidFocusMinBtn")?.addEventListener("click", () => closeFocusOverlay());
    els.focusOverlay.querySelector("#androidFocusTopicBtn")?.addEventListener("click", () => {
      if (snap) return;
      sheetMode = "focustopic";
      renderSheetContent();
      presentSheet({ fromFab: false });
    });
    els.focusOverlay.querySelectorAll("[data-focus-dur]").forEach(btn => {
      btn.addEventListener("click", () => {
        focusDurationDraft = Number(btn.dataset.focusDur) || 25;
        renderFocusOverlay();
      });
    });
    els.focusOverlay.querySelector("#androidFocusStartBtn")?.addEventListener("click", () => {
      c?.startFocus?.({ label: activeTopic, durationMinutes: focusDurationDraft, breakMinutes: 5 });
      renderFocusOverlay();
      syncFocusCapsule();
    });
    els.focusOverlay.querySelector("#androidFocusPauseBtn")?.addEventListener("click", () => {
      if (isRunning) c?.pauseFocus?.();
      else c?.resumeFocus?.();
      renderFocusOverlay();
      syncFocusCapsule();
    });
    els.focusOverlay.querySelector("#androidFocusPlus5Btn")?.addEventListener("click", () => {
      c?.extendFocus?.(5);
      renderFocusOverlay();
      syncFocusCapsule();
    });
    els.focusOverlay.querySelector("#androidFocusEndBtn")?.addEventListener("click", () => {
      c?.endFocus?.();
      renderFocusOverlay();
      syncFocusCapsule();
    });
    els.focusOverlay.querySelector("#androidFocusStartBreakBtn")?.addEventListener("click", () => {
      c?.startFocusBreak?.();
      renderFocusOverlay();
    });
    els.focusOverlay.querySelector("#androidFocusSkipBreakBtn")?.addEventListener("click", () => {
      c?.skipFocusBreak?.();
      renderFocusOverlay();
      syncFocusCapsule();
    });
    els.focusOverlay.querySelector("#androidFocusBreakBtn")?.addEventListener("click", () => {
      if (isReadyBreak) c?.startFocusBreak?.();
      else if (isBreak) c?.skipFocusBreak?.();
      renderFocusOverlay();
    });
  }

  /* ============================================================================
     Phase 6: Launch Quote Splash (15-17) + Splash Settings (18-splash-settings)
     ============================================================================ */

  function splashArtworkHtml(styleId) {
    if (styleId === "dawn") {
      return `
        <div class="a-sp-glow a-sp-glow-dawn" aria-hidden="true"></div>
        <div class="a-sp-art" aria-hidden="true">
          <svg width="360" height="240" viewBox="0 0 360 240" fill="none">
            <circle cx="180" cy="146" r="54" stroke="#E59600" stroke-opacity="0.28" stroke-width="1.2"/>
            <circle cx="180" cy="146" r="88" stroke="#276E4E" stroke-opacity="0.14" stroke-width="1"/>
            <circle cx="180" cy="146" r="126" stroke="#276E4E" stroke-opacity="0.08" stroke-width="1" stroke-dasharray="4 6"/>
            <path d="M30 166 C110 132, 250 132, 330 166" stroke="#1E2723" stroke-opacity="0.16" stroke-width="1.4" stroke-linecap="round"/>
            <path d="M62 184 C135 162, 225 162, 298 184" stroke="#276E4E" stroke-opacity="0.14" stroke-width="1.2" stroke-linecap="round"/>
            <circle cx="180" cy="146" r="24" fill="rgba(244, 169, 0, 0.16)" stroke="#E59600" stroke-opacity="0.45" stroke-width="1.4"/>
          </svg>
        </div>
      `;
    }
    if (styleId === "pine") {
      return `
        <div class="a-sp-glow a-sp-glow-pine" aria-hidden="true"></div>
        <div class="a-sp-art" aria-hidden="true">
          <svg width="360" height="230" viewBox="0 0 360 230" fill="none">
            <path d="M26 178 C118 118, 242 114, 334 166" stroke="#8CE0B4" stroke-opacity="0.34" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M46 150 C130 102, 232 100, 316 144" stroke="#8CE0B4" stroke-opacity="0.18" stroke-width="1.2" stroke-linecap="round"/>
            <circle cx="246" cy="96" r="56" stroke="#8CE0B4" stroke-opacity="0.15" stroke-width="1" stroke-dasharray="4 6"/>
            <circle cx="246" cy="96" r="22" fill="rgba(140, 224, 180, 0.12)" stroke="#8CE0B4" stroke-opacity="0.32" stroke-width="1.2"/>
          </svg>
        </div>
      `;
    }
    if (styleId === "water") {
      return `
        <div class="a-sp-glow a-sp-glow-water" aria-hidden="true"></div>
        <div class="a-sp-art" aria-hidden="true">
          <svg width="380" height="230" viewBox="0 0 380 230" fill="none">
            <ellipse cx="190" cy="126" rx="164" ry="44" stroke="#7BB5FF" stroke-opacity="0.14" stroke-width="1"/>
            <ellipse cx="190" cy="126" rx="122" ry="31" stroke="#7BB5FF" stroke-opacity="0.24" stroke-width="1.1"/>
            <ellipse cx="190" cy="126" rx="78" ry="19" stroke="#8CE0B4" stroke-opacity="0.34" stroke-width="1.2"/>
            <ellipse cx="190" cy="126" rx="34" ry="8" stroke="#FFFFFF" stroke-opacity="0.48" stroke-width="1.3"/>
            <line x1="190" y1="54" x2="190" y2="112" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="3 4"/>
            <circle cx="190" cy="126" r="3.5" fill="#8CE0B4"/>
          </svg>
        </div>
      `;
    }
    if (styleId === "paper") {
      return `
        <div class="a-sp-art" aria-hidden="true">
          <svg width="360" height="220" viewBox="0 0 360 220" fill="none">
            <line x1="48" y1="156" x2="312" y2="156" stroke="#2D312E" stroke-opacity="0.14" stroke-width="1.2"/>
            <path d="M90 144 C150 94, 210 94, 270 144" stroke="#276E4E" stroke-opacity="0.28" stroke-width="1.4" stroke-linecap="round"/>
            <circle cx="180" cy="108" r="34" stroke="#2D312E" stroke-opacity="0.10" stroke-width="1" stroke-dasharray="3 5"/>
          </svg>
        </div>
      `;
    }
    if (styleId === "dusk") {
      return `
        <div class="a-sp-glow a-sp-glow-dusk" aria-hidden="true"></div>
        <div class="a-sp-art" aria-hidden="true">
          <svg width="360" height="230" viewBox="0 0 360 230" fill="none">
            <path d="M24 166 C110 124, 250 124, 336 166" stroke="#FFD166" stroke-opacity="0.38" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="180" cy="140" r="46" fill="rgba(255, 209, 102, 0.12)" stroke="#FFD166" stroke-opacity="0.32" stroke-width="1.2"/>
            <circle cx="180" cy="140" r="88" stroke="#FFD166" stroke-opacity="0.14" stroke-width="1" stroke-dasharray="4 6"/>
          </svg>
        </div>
      `;
    }
    if (styleId === "moss") {
      return `
        <svg class="a-sp-mountain-bg" viewBox="0 0 412 915" preserveAspectRatio="none" fill="none" aria-hidden="true">
          <defs>
            <radialGradient id="aSatMistGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.52"/>
              <stop offset="55%" stop-color="#FFFFFF" stop-opacity="0.16"/>
              <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
            </radialGradient>
            <linearGradient id="aSatCloudBand" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0"/>
              <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.32"/>
              <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <circle cx="298" cy="192" r="92" fill="url(#aSatMistGlow)"/>
          <rect x="24" y="226" width="236" height="14" rx="7" fill="url(#aSatCloudBand)"/>
          <rect x="148" y="256" width="240" height="10" rx="5" fill="url(#aSatCloudBand)" opacity="0.7"/>
          <path d="M0 326 Q98 258, 198 302 T412 276 L412 915 L0 915 Z" fill="#547566" fill-opacity="0.42"/>
          <path d="M0 398 Q128 326, 252 378 T412 356 L412 915 L0 915 Z" fill="#2E4A3E" fill-opacity="0.72"/>
          <path d="M0 478 Q112 436, 232 468 T412 444 L412 915 L0 915 Z" fill="#1B2A23"/>
          <path d="M24 476 C126 426, 272 430, 390 462" stroke="#8CE0B4" stroke-opacity="0.34" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
      `;
    }
    return `
      <div class="a-sp-glow a-sp-glow-night" aria-hidden="true"></div>
      <div class="a-sp-art" aria-hidden="true">
        <svg width="360" height="230" viewBox="0 0 360 230" fill="none">
          <circle cx="180" cy="126" r="96" stroke="#CBD5E1" stroke-opacity="0.16" stroke-width="1" stroke-dasharray="3 6"/>
          <circle cx="180" cy="126" r="62" stroke="#8CE0B4" stroke-opacity="0.24" stroke-width="1.1"/>
          <circle cx="122" cy="78" r="2.2" fill="#FFFFFF" fill-opacity="0.78"/>
          <circle cx="242" cy="96" r="1.8" fill="#8CE0B4" fill-opacity="0.85"/>
          <circle cx="212" cy="60" r="1.5" fill="#CBD5E1" fill-opacity="0.65"/>
          <circle cx="148" cy="158" r="1.6" fill="#FFFFFF" fill-opacity="0.55"/>
        </svg>
      </div>
    `;
  }

  function formatSplashQuoteMain(text, language) {
    const clean = String(text || "").trim();
    if (language === "zh" && clean.length >= 8 && clean.length <= 18) {
      const commaIdx = clean.indexOf("，");
      if (commaIdx > 2 && commaIdx < clean.length - 3) {
        return `${escapeHtml(clean.slice(0, commaIdx + 1))}<br>${escapeHtml(clean.slice(commaIdx + 1))}`;
      }
    }
    return escapeHtml(clean);
  }

  function stopSplashAudio() {
    if (splashAudioEl) {
      try {
        splashAudioEl.pause();
        splashAudioEl.currentTime = 0;
      } catch {}
      splashAudioEl = null;
    }
  }

  async function maybeStartSplashAudio(prefs) {
    if (!prefs?.musicEnabled) return;
    if (!splashMediaLoaded) await refreshSplashMediaCache();
    const audioItems = splashMediaItems.filter(it => it.kind === "audio");
    const track = audioItems.find(it => it.id === prefs.activeAudioId) || audioItems[0] || null;
    if (!track) return;

    // Query Android native ringer mode via minimal Tauri/Kotlin bridge (fail-closed!)
    let ringerSilent = true;
    try {
      if (typeof window.__LL_RINGER_SILENT__ === "boolean") {
        ringerSilent = window.__LL_RINGER_SILENT__;
      } else if (window.LifeLedgerAndroidBackup?.getRingerMode) {
        const res = await window.LifeLedgerAndroidBackup.getRingerMode();
        ringerSilent = res?.silent !== false;
      }
    } catch {
      ringerSilent = true;
    }

    if (!shouldPlaySplashAudio({ musicEnabled: prefs.musicEnabled, hasAudio: Boolean(track), ringerSilent })) {
      return;
    }
    if (!splashOpen) return;
    try {
      const audio = new Audio(track.url);
      audio.volume = 0.55;
      splashAudioEl = audio;
      await audio.play().catch(() => {});
    } catch {}
  }

  function dismissSplashOverlay() {
    if (!splashOpen) return;
    splashOpen = false;
    clearTimeout(splashTimer);
    splashTimer = 0;
    stopSplashAudio();
    if (!els.splashOverlay) return;
    if (isReducedMotion()) {
      els.splashOverlay.hidden = true;
      els.splashOverlay.replaceChildren();
      els.splashOverlay.classList.remove("is-leaving", "is-entering");
      syncUI();
      return;
    }
    els.splashOverlay.classList.add("is-leaving");
    setTimeout(() => {
      if (!splashOpen && els.splashOverlay) {
        els.splashOverlay.hidden = true;
        els.splashOverlay.replaceChildren();
        els.splashOverlay.classList.remove("is-leaving", "is-entering");
        syncUI();
      }
    }, 320);
  }

  function showSplashOverlay({ weekdayOverride = null, preview = false, hold = false, progressPct = null, durationMs = SPLASH_DURATION_MS } = {}) {
    if (!els.splashOverlay) return;
    const c = core();
    const l = lang();
    const sp = t().splash;
    const todayIso = c?.getTodayIso?.() || toIsoDate(new Date());
    const todayWeekday = weekdayIndexFromIso(todayIso);
    const targetWeekday = Number.isInteger(weekdayOverride) && weekdayOverride >= 0 && weekdayOverride <= 6 ? weekdayOverride : todayWeekday;
    const offsetDays = targetWeekday - todayWeekday;
    const displayIso = offsetDays === 0 ? todayIso : shiftIsoDate(todayIso, offsetDays);
    const resolved = resolveSplashStyleAndQuote({
      dateIso: displayIso,
      weekdayOverride: preview && weekdayOverride != null ? targetWeekday : null,
      lang: l,
      quoteSettings: preview && weekdayOverride != null ? null : (c?.getQuoteSettings?.() || null),
    });

    const prefs = loadSplashPrefs();
    const customImg =
      !preview && prefs.activeImageId
        ? splashMediaItems.find(it => it.kind === "image" && it.id === prefs.activeImageId) || null
        : null;

    const style = resolved.style;
    const styleLabel = `${style.name[l] || style.name.en} · ${style.index + 1}/7`;
    const isTodaySplash = targetWeekday === todayWeekday;
    const weekdayName = sp.weekdaysFull[targetWeekday] || "";
    const datePart = formatShortDate(displayIso);
    const badgeText = isTodaySplash ? `${weekdayName} · ${datePart} · ${sp.todayTag}` : `${weekdayName} · ${datePart}`;
    const quoteMainHtml = formatSplashQuoteMain(resolved.quote.text, l);
    const isLongQuote = resolved.quote.text.length > 48;

    const subNoteHtml =
      style.id === "dawn" && !customImg
        ? `<div class="a-sp-en-sub">Understand your past. Shape your future.</div>`
        : isTodaySplash
          ? `<div class="a-sp-sync-note">${ICONS.check}<span>${escapeHtml(sp.syncSourceNote)}</span></div>`
          : "";

    const duration = Math.max(0, Math.min(SPLASH_DURATION_MS, durationMs));
    const reduced = isReducedMotion();
    const fixedPct = Number.isFinite(progressPct) ? Math.max(0, Math.min(100, progressPct)) : null;

    splashOpen = true;
    clearTimeout(splashTimer);
    stopSplashAudio();

    els.splashOverlay.className = `a-splash-overlay a-sp-style-${style.id}${customImg ? " has-custom-bg" : ""}${reduced ? " is-reduced" : ""}`;
    els.splashOverlay.dataset.splashStyle = style.id;
    els.splashOverlay.dataset.splashWeekday = String(targetWeekday);
    els.splashOverlay.hidden = false;
    els.splashOverlay.innerHTML = `
      ${customImg ? `<div class="a-sp-custom-bg" style="background-image:url('${escapeHtml(customImg.url)}')" aria-hidden="true"></div><div class="a-sp-custom-scrim" aria-hidden="true"></div>` : splashArtworkHtml(style.id)}
      <div class="a-sp-top">
        <div class="a-sp-day-badge">
          <span class="a-sp-badge-dot" aria-hidden="true"></span>
          <span>${escapeHtml(badgeText)}</span>
        </div>
        <span class="a-sp-style-name">${escapeHtml(styleLabel)}</span>
      </div>
      <div class="a-sp-center">
        <div class="a-sp-quote-mark" aria-hidden="true"></div>
        <div class="a-sp-quote-main${isLongQuote ? " is-long" : ""}">${quoteMainHtml}</div>
        ${resolved.quote.source ? `<div class="a-sp-quote-author">— ${escapeHtml(resolved.quote.source)}</div>` : ""}
        ${subNoteHtml}
      </div>
      <div class="a-sp-bottom">
        <div class="a-sp-brand-row">
          <div class="a-sp-brand-mini">
            ${ICONS.appIcon}
            <span>Life Ledger</span>
          </div>
          <button type="button" class="a-sp-tap-hint">${escapeHtml(sp.tapHint)}</button>
        </div>
        <div class="a-sp-progress-track" aria-hidden="true">
          <div class="a-sp-progress-fill" id="androidSplashProgFill" style="${fixedPct != null ? `width:${fixedPct}%;transition:none;` : ""}"></div>
        </div>
      </div>
    `;

    els.splashOverlay.onclick = () => dismissSplashOverlay();

    if (!preview) {
      saveSplashPrefs({ lastShownDate: todayIso });
    }

    if (fixedPct == null) {
      const fill = els.splashOverlay.querySelector("#androidSplashProgFill");
      if (fill) {
        if (reduced) {
          fill.style.width = "100%";
        } else {
          fill.style.width = `${100 * (1 - duration / SPLASH_DURATION_MS)}%`;
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (splashOpen && fill) {
                fill.style.transition = `width ${duration}ms linear`;
                fill.style.width = "100%";
              }
            });
          });
        }
      }
    }

    if (!hold) {
      splashTimer = setTimeout(() => dismissSplashOverlay(), duration);
    }

    if (!preview) {
      void maybeStartSplashAudio(prefs);
    }
  }

  function openSplashSettings() {
    splashSettingsOpen = true;
    const todayIso = core()?.getTodayIso?.() || toIsoDate(new Date());
    splashPreviewWeekday = weekdayIndexFromIso(todayIso);
    els.splashSettingsOverlay.hidden = false;
    renderSplashSettings();
    if (!splashMediaLoaded) {
      void refreshSplashMediaCache().then(() => {
        if (splashSettingsOpen) renderSplashSettings();
      });
    }
    pushBackStateIfNeeded();
  }

  function closeSplashSettings() {
    if (!splashSettingsOpen) return;
    splashSettingsOpen = false;
    els.splashSettingsOverlay.hidden = true;
    syncUI();
  }

  function renderSplashSettings() {
    if (!els.splashSettingsOverlay || !splashSettingsOpen) return;
    const c = core();
    const l = lang();
    const sp = t().splash;
    const prefs = loadSplashPrefs();
    const demoActive = Boolean(c?.isIsolatedDemoActive?.());
    const todayIso = c?.getTodayIso?.() || toIsoDate(new Date());
    const todayWd = weekdayIndexFromIso(todayIso);
    const activeWd = Number.isInteger(splashPreviewWeekday) ? splashPreviewWeekday : todayWd;
    const qs = c?.getQuoteSettings?.() || { mode: "auto", items: [] };
    const previewRes = resolveSplashStyleAndQuote({
      dateIso: todayIso,
      weekdayOverride: activeWd,
      lang: l,
      quoteSettings: null,
    });
    const isEnabled = prefs.frequency !== "off";
    const images = splashMediaItems.filter(it => it.kind === "image");
    const audios = splashMediaItems.filter(it => it.kind === "audio");
    const activeAudio = audios.find(it => it.id === prefs.activeAudioId) || audios[0] || null;
    const previewStyle = previewRes.style;
    const previewDarkBg = previewStyle.isLight
      ? "linear-gradient(135deg, #1E2723 0%, #2C3D34 100%)"
      : previewStyle.swatchBg;

    els.splashSettingsOverlay.innerHTML = `
      <div class="a-subpage-shell">
        <header class="a-subpage-top">
          <div class="a-subpage-top-left">
            <button type="button" class="a-back-btn" id="androidSplashSettingsBack" aria-label="${escapeHtml(t().welcome.backAria)}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <h1 class="a-subpage-title">${escapeHtml(sp.settingsTitle)}</h1>
          </div>
          <button type="button" class="a-sp-preview-pill" id="androidSplashPreviewBtn">
            ${ICONS.playIc}
            <span>${escapeHtml(sp.previewBtn)}</span>
          </button>
        </header>

        <div class="a-subpage-content">
          <section class="a-card a-sp-card">
            <div class="a-sp-sw-row">
              <div class="a-sp-sw-copy">
                <div class="a-sp-sw-title">${escapeHtml(sp.masterTitle)}</div>
                <div class="a-sp-sw-desc">${escapeHtml(sp.masterDesc)}</div>
              </div>
              <button type="button" class="a-toggle${isEnabled ? " is-on" : ""}" id="androidSplashMasterToggle" role="switch" aria-checked="${isEnabled}" aria-label="${escapeHtml(sp.masterTitle)}">
                <span class="a-toggle-knob"></span>
              </button>
            </div>
            <div class="a-sp-freq-seg" role="radiogroup" aria-label="${escapeHtml(sp.masterTitle)}">
              ${[
                { id: "off", label: sp.freqOff },
                { id: "daily", label: sp.freqDaily },
                { id: "always", label: sp.freqAlways },
              ]
                .map(
                  opt =>
                    `<button type="button" class="a-sp-seg-btn${prefs.frequency === opt.id ? " is-active" : ""}" data-sp-freq="${opt.id}" role="radio" aria-checked="${prefs.frequency === opt.id}">${escapeHtml(opt.label)}</button>`,
                )
                .join("")}
            </div>
          </section>

          <section class="a-card a-sp-card">
            <div class="a-sp-subhead">
              <strong>${escapeHtml(sp.stylesTitle)}</strong>
              <span>${escapeHtml(sp.stylesBadge)}</span>
            </div>
            <div class="a-sp-styles-grid">
              ${SPLASH_WEEKDAY_STYLES.map(
                st => `
                <button type="button" class="a-sp-st-item${st.index === activeWd ? " is-active" : ""}" data-sp-wd="${st.index}">
                  <span class="a-sp-st-swatch" style="background:${st.swatchBg};color:${st.swatchFg};">${escapeHtml(st.short[l] || st.short.en)}</span>
                  <span class="a-sp-st-dow">${escapeHtml(t().weekdays[st.index])}</span>
                </button>
              `,
              ).join("")}
            </div>
            <div class="a-sp-today-preview" style="background:${previewDarkBg};">
              <div class="a-sp-tp-copy">
                <div class="a-sp-tp-q">${escapeHtml(l === "zh" ? `「${previewRes.quote.text}」` : `“${previewRes.quote.text}”`)}</div>
                <div class="a-sp-tp-src">${escapeHtml(`${sp.weekdaysFull[activeWd]} · ${previewRes.quote.source} · ${sp.syncSourceNote}`)}</div>
              </div>
              <span class="a-sp-tp-badge">${escapeHtml(activeWd === todayWd ? sp.todayBadge : sp.previewDayBadge)}</span>
            </div>
          </section>

          <div class="a-sp-sec-lbl">${escapeHtml(sp.quoteLibLabel)}</div>
          <section class="a-card a-sp-card">
            <div class="a-sp-freq-seg" role="radiogroup">
              ${[
                { id: "auto", label: sp.modeAuto },
                { id: "custom", label: sp.modeCustom },
                { id: "mixed", label: sp.modeMixed },
              ]
                .map(
                  opt =>
                    `<button type="button" class="a-sp-seg-btn${qs.mode === opt.id ? " is-active" : ""}" data-sp-qmode="${opt.id}" role="radio" aria-checked="${qs.mode === opt.id}">${escapeHtml(opt.label)}</button>`,
                )
                .join("")}
            </div>
            <button type="button" class="a-sp-row-btn" id="androidSplashManageQuotes">
              <span class="a-sp-row-left">
                <span class="a-sp-row-ic is-sage"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4z"/></svg></span>
                <span class="a-sp-row-copy">
                  <strong>${escapeHtml(sp.manageCustomTitle)}</strong>
                  <small>${escapeHtml(sp.manageCustomSub)}</small>
                </span>
              </span>
              <span class="a-sp-row-val">${escapeHtml(sp.customCount(qs.items.length))} ›</span>
            </button>
          </section>

          <div class="a-sp-sec-lbl">${escapeHtml(sp.mediaSectionLabel)}</div>
          <section class="a-card a-sp-card">
            <div class="a-sp-row-static">
              <div class="a-sp-row-left">
                <span class="a-sp-row-ic is-amber">${ICONS.photoIc}</span>
                <div class="a-sp-row-copy">
                  <strong>${escapeHtml(sp.customImgTitle)}</strong>
                  <small>${escapeHtml(sp.customImgSub)}</small>
                </div>
              </div>
              <span class="a-sp-row-val">${escapeHtml(sp.imgCount(images.length))}</span>
            </div>
            <div class="a-sp-img-strip">
              <button type="button" class="a-sp-img-default${!prefs.activeImageId ? " is-selected" : ""}" id="androidSplashUseBuiltInBg">
                <span>${escapeHtml(sp.useBuiltInBg)}</span>
              </button>
              ${images
                .map(
                  img => `
                <div class="a-sp-img-thumb${prefs.activeImageId === img.id ? " is-selected" : ""}">
                  <button type="button" class="a-sp-img-pick" data-sp-img-pick="${escapeHtml(img.id)}" aria-label="${escapeHtml(img.name)}">
                    <img src="${escapeHtml(img.url)}" alt="">
                  </button>
                  <button type="button" class="a-sp-img-del" data-sp-img-del="${escapeHtml(img.id)}" aria-label="Remove">×</button>
                </div>
              `,
                )
                .join("")}
              <label class="a-sp-img-add" for="androidSplashImgInput">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                <span>${escapeHtml(sp.addImg)}</span>
                <input type="file" id="androidSplashImgInput" accept="image/*" hidden ${demoActive ? "disabled" : ""}>
              </label>
            </div>

            <div class="a-sp-row-static a-sp-row-divider">
              <div class="a-sp-row-left">
                <span class="a-sp-row-ic is-sky"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></span>
                <div class="a-sp-row-copy">
                  <strong>${escapeHtml(sp.musicTitle)}</strong>
                  <small>${escapeHtml(activeAudio ? sp.musicReady(activeAudio.name) : sp.musicSub)}</small>
                </div>
              </div>
              <button type="button" class="a-toggle${prefs.musicEnabled ? " is-on" : ""}" id="androidSplashMusicToggle" role="switch" aria-checked="${prefs.musicEnabled}" aria-label="${escapeHtml(sp.musicTitle)}">
                <span class="a-toggle-knob"></span>
              </button>
            </div>
            <div class="a-sp-audio-actions">
              <label class="a-sp-audio-btn" for="androidSplashAudioInput">
                <span>${escapeHtml(sp.musicPick)}</span>
                <input type="file" id="androidSplashAudioInput" accept="audio/*" hidden ${demoActive ? "disabled" : ""}>
              </label>
              ${activeAudio ? `<button type="button" class="a-sp-audio-btn is-danger" id="androidSplashAudioRemove">${escapeHtml(sp.musicRemove)}</button>` : ""}
            </div>
            <div class="a-sp-silent-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--a-primary)" stroke-width="2" stroke-linecap="round" style="flex-shrink:0;"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              <span>${escapeHtml(sp.silentNote)}</span>
            </div>
          </section>

          <p class="a-sp-foot-note">${escapeHtml(sp.footerNote)}</p>
        </div>
      </div>
    `;

    els.splashSettingsOverlay.querySelector("#androidSplashSettingsBack")?.addEventListener("click", () => closeSplashSettings());
    els.splashSettingsOverlay.querySelector("#androidSplashPreviewBtn")?.addEventListener("click", () => {
      showSplashOverlay({ weekdayOverride: activeWd, preview: true });
    });
    els.splashSettingsOverlay.querySelector("#androidSplashMasterToggle")?.addEventListener("click", () => {
      const cur = loadSplashPrefs();
      saveSplashPrefs({ frequency: cur.frequency === "off" ? "daily" : "off" });
      renderSplashSettings();
    });
    els.splashSettingsOverlay.querySelectorAll("[data-sp-freq]").forEach(btn => {
      btn.addEventListener("click", () => {
        saveSplashPrefs({ frequency: btn.dataset.spFreq });
        renderSplashSettings();
      });
    });
    els.splashSettingsOverlay.querySelectorAll("[data-sp-wd]").forEach(btn => {
      btn.addEventListener("click", () => {
        splashPreviewWeekday = Number(btn.dataset.spWd);
        renderSplashSettings();
      });
    });
    els.splashSettingsOverlay.querySelectorAll("[data-sp-qmode]").forEach(btn => {
      btn.addEventListener("click", () => {
        const nextMode = btn.dataset.spQmode;
        c?.setQuoteSettings?.({ mode: nextMode, items: qs.items });
        renderSplashSettings();
      });
    });
    els.splashSettingsOverlay.querySelector("#androidSplashManageQuotes")?.addEventListener("click", () => {
      sheetMode = "customquotes";
      renderSheetContent();
      presentSheet({ fromFab: false });
    });
    els.splashSettingsOverlay.querySelector("#androidSplashUseBuiltInBg")?.addEventListener("click", () => {
      saveSplashPrefs({ activeImageId: "" });
      renderSplashSettings();
    });
    els.splashSettingsOverlay.querySelectorAll("[data-sp-img-pick]").forEach(btn => {
      btn.addEventListener("click", () => {
        saveSplashPrefs({ activeImageId: btn.dataset.spImgPick });
        renderSplashSettings();
      });
    });
    els.splashSettingsOverlay.querySelectorAll("[data-sp-img-del]").forEach(btn => {
      btn.addEventListener("click", async () => {
        await window.LifeLedgerSplashMedia.remove(btn.dataset.spImgDel);
        renderSplashSettings();
      });
    });
    els.splashSettingsOverlay.querySelector("#androidSplashImgInput")?.addEventListener("change", async e => {
      const file = e.target.files?.[0];
      if (!file || demoActive) return;
      try {
        await window.LifeLedgerSplashMedia.saveImage(file);
        renderSplashSettings();
      } catch {}
    });
    els.splashSettingsOverlay.querySelector("#androidSplashMusicToggle")?.addEventListener("click", () => {
      const cur = loadSplashPrefs();
      saveSplashPrefs({ musicEnabled: !cur.musicEnabled });
      renderSplashSettings();
    });
    els.splashSettingsOverlay.querySelector("#androidSplashAudioInput")?.addEventListener("change", async e => {
      const file = e.target.files?.[0];
      if (!file || demoActive) return;
      try {
        await window.LifeLedgerSplashMedia.saveAudio(file);
        renderSplashSettings();
      } catch (err) {
        if (String(err?.message || "").includes("audio-too-large")) {
          showUndoSnackbar(sp.musicTooLarge, null);
        }
      }
    });
    els.splashSettingsOverlay.querySelector("#androidSplashAudioRemove")?.addEventListener("click", async () => {
      if (!activeAudio) return;
      await window.LifeLedgerSplashMedia.remove(activeAudio.id);
      renderSplashSettings();
    });
  }

  function renderCustomQuotesSheetContent() {
    const c = core();
    const sp = t().splash;
    const qs = c?.getQuoteSettings?.() || { mode: "auto", items: [] };
    const textVal = (qs.items || []).map(it => (it.source ? `${it.text}——${it.source}` : it.text)).join("\n");
    els.sheetBody.innerHTML = `
      <div class="a-sheet-head">
        <h2 class="a-sheet-title" id="androidSheetTitle">${escapeHtml(sp.customSheetTitle)}</h2>
      </div>
      <p class="a-lib-sub">${escapeHtml(sp.customSheetSub)}</p>
      <div class="a-note-box">
        <textarea id="androidCustomQuotesInput" class="a-note-input a-cq-textarea" rows="5" placeholder="${escapeHtml(sp.customPlaceholder)}">${escapeHtml(textVal)}</textarea>
      </div>
      <div class="a-sheet-cta-wrap">
        <button type="button" class="a-btn-primary" id="androidCustomQuotesSave">${escapeHtml(sp.save)}</button>
      </div>
    `;
    els.sheetBody.querySelector("#androidCustomQuotesSave")?.addEventListener("click", () => {
      const raw = els.sheetBody.querySelector("#androidCustomQuotesInput")?.value || "";
      const parsed = c?.parseCustomQuotes?.(raw) || [];
      const nextMode = parsed.length && qs.mode === "auto" ? "custom" : qs.mode;
      c?.setQuoteSettings?.({ mode: nextMode, items: parsed });
      closeSheet();
      if (splashSettingsOpen) renderSplashSettings();
    });
  }

  /* ============================================================================
     Phase 7: Full-Screen Settings & Local SAF Backup (11-settings-backup)
     ============================================================================ */

  function loadDisplayPrefs() {
    try {
      const raw = JSON.parse(localStorage.getItem(DISPLAY_PREFS_KEY) || "null") || {};
      return {
        fontScale: raw.fontScale === "large" ? "large" : "normal",
        reducedMotion: Boolean(raw.reducedMotion === true),
      };
    } catch {
      return { fontScale: "normal", reducedMotion: false };
    }
  }

  function applyDisplayPrefs(prefs) {
    const p = prefs || loadDisplayPrefs();
    if (p.fontScale === "large") document.documentElement.dataset.androidFontScale = "large";
    else delete document.documentElement.dataset.androidFontScale;
    document.documentElement.classList.toggle("motion-reduced", Boolean(p.reducedMotion));
    return p;
  }

  function saveDisplayPrefs(patch) {
    const next = { ...loadDisplayPrefs(), ...(patch || {}) };
    try {
      localStorage.setItem(DISPLAY_PREFS_KEY, JSON.stringify(next));
    } catch {}
    return applyDisplayPrefs(next);
  }

  function formatBytesCompact(bytes) {
    const b = Math.max(0, Number(bytes) || 0);
    if (b >= 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    if (b >= 1024) return `${Math.max(1, Math.round(b / 1024))} KB`;
    return `${b} B`;
  }

  function openSettingsOverlay() {
    settingsOpen = true;
    els.settingsOverlay.hidden = false;
    renderSettingsOverlay();
    pushBackStateIfNeeded();
    syncNativeBackState();
  }

  function closeSettingsOverlay() {
    if (!settingsOpen) return;
    settingsOpen = false;
    els.settingsOverlay.hidden = true;
    syncUI();
  }

  function openBackupExportSheet() {
    sheetMode = "backup-export";
    renderSheetContent();
    presentSheet({ fromFab: false });
  }

  function openBackupImportSheet() {
    pendingBackupImportPreview = null;
    backupImportError = "";
    sheetMode = "backup-import";
    renderSheetContent();
    presentSheet({ fromFab: false });
  }

  function renderSettingsOverlay() {
    if (!els.settingsOverlay || !settingsOpen) return;
    const c = core();
    const copy = t();
    const s = copy.settings;
    const sp = copy.splash;
    const demoActive = Boolean(c?.isIsolatedDemoActive?.());
    const stats = c?.getBackupStats?.() || { days: 0, approxBytes: 0, lastBackupAt: "" };
    const lastStr = stats.lastBackupAt
      ? s.lastBackupOn(formatShortDate(stats.lastBackupAt.slice(0, 10)))
      : s.lastBackupNever;
    const themeChoice = c?.getThemeChoice?.() || "system";
    const themeVal = s.themeVals[themeChoice] || s.themeVals.system;
    const splashPrefs = loadSplashPrefs();
    const splashChip =
      splashPrefs.frequency === "off"
        ? sp.statusChipOff
        : splashPrefs.frequency === "always"
          ? sp.statusChipAlways
          : sp.statusChipDaily;
    const disp = loadDisplayPrefs();
    const dispVal = `${disp.fontScale === "large" ? s.fontLarge : s.fontNormal} · ${disp.reducedMotion ? s.motionReduced : s.motionFull}`;

    const wb = weatherBridge();
    const wSnap = wb?.getSnapshot?.() || null;
    const wCity = localizedCityName(wSnap?.city?.name || copy.today.weatherSlotCity);
    const wTemp = Number.isFinite(wSnap?.forecast?.current?.temperature_2m) ? `${Math.round(wSnap.forecast.current.temperature_2m)}°` : "";
    const weatherVal = wTemp ? `${wCity} · ${wTemp}` : wCity;

    const cardsPref = loadCardsPref();
    const cardsCount = cardsPref.length;
    const focusTopics = c?.getFocusTopics?.() || { custom: [], recent: [] };
    const topicSet = new Set([...(copy.focus.presetTopics || []), ...(focusTopics.custom || []), ...(focusTopics.recent || [])]);
    const ledger = c?.getLedger?.();
    const curCode = ledger?.settings?.defaultCurrency || "EUR";
    const multiCur = Boolean(ledger?.settings?.allowMultiCurrency !== false);
    const rem = c?.getReminderSettings?.() || { enabled: false, time: "21:30" };
    const remVal = rem.enabled ? (rem.time || "21:30") : s.reminderOff;

    // These are the exact live inputs used above to render this page.
    if (!regionChanged(els.settingsOverlay, [lang(), isDark(), demoActive, stats, themeChoice,
      splashPrefs, disp, wSnap, weatherRevision, cardsPref, focusTopics, ledger, rem])) return;
    els.settingsOverlay.innerHTML = `
      <div class="a-subpage-shell">
        <header class="a-subpage-top">
          <div class="a-subpage-top-left">
            <button type="button" class="a-back-btn" id="androidSettingsBack" aria-label="${escapeHtml(copy.welcome.backAria)}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <h1 class="a-subpage-title">${escapeHtml(s.title)}</h1>
          </div>
        </header>

        <div class="a-subpage-content a-set-content">
          <section class="a-bk-hero-card">
            <div class="a-bk-top">
              <div class="a-bk-art" aria-hidden="true">
                <svg width="42" height="32" viewBox="0 0 160 120" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="28" y="24" width="104" height="72" rx="14" stroke="var(--a-on-surface)" stroke-width="4"/>
                  <path d="M28 48h104" stroke="var(--a-on-surface)" stroke-width="3.5"/>
                  <path d="M80 60v24M71 69l9-9 9 9" stroke="var(--a-primary)" stroke-width="4.5"/>
                </svg>
              </div>
              <div class="a-bk-copy">
                <span class="a-bk-pill">${escapeHtml(s.backupPill)}</span>
                <div class="a-bk-title">${escapeHtml(s.backupTitle)}</div>
                <div class="a-bk-meta">${escapeHtml(s.backupMeta(lastStr, stats.days, formatBytesCompact(stats.approxBytes)))}</div>
              </div>
            </div>
            <div class="a-bk-btns">
              <button type="button" class="a-bk-btn-exp" id="androidSetExportBtn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg>
                <span>${escapeHtml(s.exportBtn)}</span>
              </button>
              <button type="button" class="a-bk-btn-imp" id="androidSetImportBtn">
                ${ICONS.upload}
                <span>${escapeHtml(s.importBtn)}</span>
              </button>
            </div>
            <div class="a-bk-sync-note">${escapeHtml(s.syncNote)}</div>
          </section>

          <div class="a-sp-sec-lbl">${escapeHtml(s.secAppear)}</div>
          <section class="a-card a-set-list-card">
            <button type="button" class="a-set-row" id="androidSetThemeBtn">
              <span class="a-set-left">
                <span class="a-set-ic">${ICONS.sunSmall}</span>
                <span class="a-set-title">${escapeHtml(s.theme)}</span>
              </span>
              <span class="a-set-val"><span class="a-set-chip">${escapeHtml(themeVal)}</span>›</span>
            </button>
            <button type="button" class="a-set-row" id="androidSetLangBtn">
              <span class="a-set-left">
                <span class="a-set-ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg></span>
                <span class="a-set-title">${escapeHtml(s.language)}</span>
              </span>
              <span class="a-set-val">${escapeHtml(s.languageVal)} ›</span>
            </button>
            <button type="button" class="a-set-row" id="androidSetSplashBtn">
              <span class="a-set-left">
                <span class="a-set-ic is-sage"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 17h3l2-4V7H5v6h3M15 17h3l2-4V7h-6v6h3"/></svg></span>
                <span class="a-set-title">${escapeHtml(s.splash)}</span>
              </span>
              <span class="a-set-val"><span class="a-set-chip${splashPrefs.frequency !== "off" ? " is-on" : ""}">${escapeHtml(splashChip)}</span>›</span>
            </button>
            <button type="button" class="a-set-row" id="androidSetDisplayBtn">
              <span class="a-set-left">
                <span class="a-set-ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7V4h16v3M12 4v16M9 20h6"/></svg></span>
                <span class="a-set-title">${escapeHtml(s.display)}</span>
              </span>
              <span class="a-set-val">${escapeHtml(dispVal)} ›</span>
            </button>
          </section>

          <div class="a-sp-sec-lbl">${escapeHtml(s.secModules)}</div>
          <section class="a-card a-set-list-card">
            <button type="button" class="a-set-row" id="androidSetWeatherBtn">
              <span class="a-set-left">
                <span class="a-set-ic is-sky">${ICONS.cloud}</span>
                <span class="a-set-title">${escapeHtml(s.weatherCity)}</span>
              </span>
              <span class="a-set-val">${escapeHtml(weatherVal)} ›</span>
            </button>
            <button type="button" class="a-set-row" id="androidSetCardLibBtn">
              <span class="a-set-left">
                <span class="a-set-ic">${ICONS.cardLib}</span>
                <span class="a-set-title">${escapeHtml(s.cardLib)}</span>
              </span>
              <span class="a-set-val">${escapeHtml(s.cardLibVal(cardsCount))} ›</span>
            </button>
            <button type="button" class="a-set-row" id="androidSetTopicsBtn">
              <span class="a-set-left">
                <span class="a-set-ic">${ICONS.focusIc}</span>
                <span class="a-set-title">${escapeHtml(s.focusTopics)}</span>
              </span>
              <span class="a-set-val">${escapeHtml(s.focusTopicsVal(topicSet.size))} ›</span>
            </button>
            <button type="button" class="a-set-row" id="androidSetCurrencyBtn">
              <span class="a-set-left">
                <span class="a-set-ic">${ICONS.euroIc}</span>
                <span class="a-set-title">${escapeHtml(s.currencyBill)}</span>
              </span>
              <span class="a-set-val">${escapeHtml(s.currencyVal(curCode, multiCur))} ›</span>
            </button>
            <button type="button" class="a-set-row" id="androidSetReminderBtn">
              <span class="a-set-left">
                <span class="a-set-ic">${ICONS.bell}</span>
                <span class="a-set-title">${escapeHtml(s.reminder)}</span>
              </span>
              <span class="a-set-val">${escapeHtml(remVal)} ›</span>
            </button>
          </section>

          <section class="a-card a-set-list-card">
            <button type="button" class="a-set-row" id="androidSetDemoBtn">
              <span class="a-set-left">
                <span class="a-set-ic is-sage">${ICONS.eye}</span>
                <span class="a-set-title">${escapeHtml(demoActive ? s.exitDemo : s.enterDemo)}</span>
              </span>
              <span class="a-set-val">${escapeHtml(demoActive ? s.exitDemoVal : s.enterDemoVal)} ›</span>
            </button>
            <button type="button" class="a-set-row is-danger" id="androidSetClearBtn">
              <span class="a-set-left">
                <span class="a-set-ic">${ICONS.trash}</span>
                <span class="a-set-title">${escapeHtml(s.clearLocal)}</span>
              </span>
              <span class="a-set-val">›</span>
            </button>
          </section>

          <footer class="a-set-ver-foot">
            <div>${escapeHtml(s.verLine1)}</div>
            <div>${escapeHtml(s.verLine2)}</div>
          </footer>
        </div>
      </div>
    `;

    els.settingsOverlay.querySelector("#androidSettingsBack")?.addEventListener("click", () => closeSettingsOverlay());
    els.settingsOverlay.querySelector("#androidSetExportBtn")?.addEventListener("click", () => openBackupExportSheet());
    els.settingsOverlay.querySelector("#androidSetImportBtn")?.addEventListener("click", () => openBackupImportSheet());
    els.settingsOverlay.querySelector("#androidSetThemeBtn")?.addEventListener("click", () => {
      sheetMode = "theme";
      renderSheetContent();
      presentSheet({ fromFab: false });
    });
    els.settingsOverlay.querySelector("#androidSetLangBtn")?.addEventListener("click", () => {
      sheetMode = "language";
      renderSheetContent();
      presentSheet({ fromFab: false });
    });
    els.settingsOverlay.querySelector("#androidSetSplashBtn")?.addEventListener("click", () => openSplashSettings());
    els.settingsOverlay.querySelector("#androidSetDisplayBtn")?.addEventListener("click", () => {
      sheetMode = "display";
      renderSheetContent();
      presentSheet({ fromFab: false });
    });
    els.settingsOverlay.querySelector("#androidSetWeatherBtn")?.addEventListener("click", () => openWeatherSheet());
    els.settingsOverlay.querySelector("#androidSetCardLibBtn")?.addEventListener("click", () => openCardLibrarySheet());
    els.settingsOverlay.querySelector("#androidSetTopicsBtn")?.addEventListener("click", () => {
      sheetMode = "focustopics-manage";
      renderSheetContent();
      presentSheet({ fromFab: false });
    });
    els.settingsOverlay.querySelector("#androidSetCurrencyBtn")?.addEventListener("click", () => openMoneyMenuSheet());
    els.settingsOverlay.querySelector("#androidSetReminderBtn")?.addEventListener("click", () => {
      sheetMode = "reminder";
      renderSheetContent();
      presentSheet({ fromFab: false });
    });
    els.settingsOverlay.querySelector("#androidSetDemoBtn")?.addEventListener("click", () => {
      closeSettingsOverlay();
      if (demoActive) exitDemo();
      else enterDemo();
    });
    els.settingsOverlay.querySelector("#androidSetClearBtn")?.addEventListener("click", () => {
      sheetMode = "clear-confirm";
      renderSheetContent();
      presentSheet({ fromFab: false });
    });
  }

  function renderBackupExportSheetContent() {
    const s = t().settings;
    els.sheetBody.innerHTML = `
      <div class="a-sheet-head">
        <h2 class="a-sheet-title" id="androidSheetTitle">${escapeHtml(s.exportSheetTitle)}</h2>
      </div>
      <p class="a-lib-sub">${escapeHtml(s.exportSheetSub)}</p>
      <div class="a-bk-opt-list">
        <button type="button" class="a-bk-opt-card" id="androidExportJsonOpt">
          <span class="a-bk-opt-badge">JSON</span>
          <span class="a-bk-opt-copy">
            <strong>${escapeHtml(s.exportJsonTitle)}</strong>
            <small>${escapeHtml(s.exportJsonDesc)}</small>
          </span>
        </button>
        <button type="button" class="a-bk-opt-card is-media" id="androidExportMediaOpt">
          <span class="a-bk-opt-badge is-sage">MEDIA</span>
          <span class="a-bk-opt-copy">
            <strong>${escapeHtml(s.exportMediaTitle)}</strong>
            <small>${escapeHtml(s.exportMediaDesc)}</small>
          </span>
        </button>
      </div>
    `;
    const runExport = async format => {
      try {
        const res = await core()?.exportAndroidBackup?.({ format, scope: "all" });
        if (!res || res.cancelled) return;
        closeSheet();
        if (settingsOpen) renderSettingsOverlay();
        showUndoSnackbar(s.exportDone(res.filename), null);
      } catch {
        showUndoSnackbar(s.exportFailed, null);
      }
    };
    els.sheetBody.querySelector("#androidExportJsonOpt")?.addEventListener("click", () => { void runExport("json"); });
    els.sheetBody.querySelector("#androidExportMediaOpt")?.addEventListener("click", () => { void runExport("llmedia"); });
  }

  function renderBackupImportSheetContent() {
    const s = t().settings;
    const hasNativeSaf = Boolean(window.LifeLedgerAndroidBackup?.pickImport);
    const prev = pendingBackupImportPreview;
    els.sheetBody.innerHTML = `
      <div class="a-sheet-head">
        <h2 class="a-sheet-title" id="androidSheetTitle">${escapeHtml(s.importSheetTitle)}</h2>
      </div>
      <p class="a-lib-sub">${escapeHtml(s.importSheetSub)}</p>
      ${backupImportError ? `<div class="a-bk-error" role="alert">${escapeHtml(backupImportError)}</div>` : ""}
      ${
        prev
          ? `
        <div class="a-bk-preview-box">
          <div class="a-bk-preview-head">
            <span class="a-bk-opt-badge${prev.kind === "llmedia" ? " is-sage" : ""}">${prev.kind === "llmedia" ? "MEDIA" : "JSON"}</span>
            <strong>${escapeHtml(prev.fileName)}</strong>
          </div>
          <p class="a-bk-preview-sum">${escapeHtml(prev.summary)}</p>
          ${prev.mediaCount > 0 ? `<p class="a-bk-preview-media">${escapeHtml(s.mediaItemsCount(prev.mediaCount))}</p>` : ""}
        </div>
        <div class="a-sheet-cta-wrap">
          <button type="button" class="a-btn-primary" id="androidConfirmImportBtn">${escapeHtml(s.confirmRestoreBtn)}</button>
        </div>
      `
          : `
        <div class="a-sheet-cta-wrap">
          ${
            hasNativeSaf
              ? `<button type="button" class="a-btn-primary" id="androidPickImportSaf">${escapeHtml(s.pickBackupBtn)}</button>`
              : `<label class="a-btn-primary" for="androidPickImportInput">${escapeHtml(s.pickBackupBtn)}<input type="file" id="androidPickImportInput" accept=".json,.llmedia,.llbackup,application/json,application/octet-stream" hidden></label>`
          }
        </div>
      `
      }
    `;
    const handlePreview = async file => {
      backupImportError = "";
      try {
        const res = await core()?.pickAndPreviewAndroidImport?.(file || null);
        if (!res || res.cancelled) return;
        pendingBackupImportPreview = res;
        renderBackupImportSheetContent();
      } catch (err) {
        const msg = String(err?.message || "");
        backupImportError = msg.includes("unsupported-backup-version") ? s.restoreUnsupported : s.restoreInvalid;
        pendingBackupImportPreview = null;
        renderBackupImportSheetContent();
      }
    };
    els.sheetBody.querySelector("#androidPickImportSaf")?.addEventListener("click", () => { void handlePreview(null); });
    els.sheetBody.querySelector("#androidPickImportInput")?.addEventListener("change", e => {
      const f = e.target.files?.[0];
      if (f) void handlePreview(f);
    });
    els.sheetBody.querySelector("#androidConfirmImportBtn")?.addEventListener("click", async () => {
      if (!pendingBackupImportPreview) return;
      try {
        await core()?.applyAndroidImport?.(pendingBackupImportPreview);
        pendingBackupImportPreview = null;
        closeSheet();
        if (settingsOpen) renderSettingsOverlay();
        showUndoSnackbar(s.restoreDone, null);
      } catch {
        backupImportError = s.restoreInvalid;
        renderBackupImportSheetContent();
      }
    });
  }

  function renderThemeSheetContent() {
    const s = t().settings;
    const cur = core()?.getThemeChoice?.() || "system";
    els.sheetBody.innerHTML = `
      <div class="a-sheet-head"><h2 class="a-sheet-title" id="androidSheetTitle">${escapeHtml(s.theme)}</h2></div>
      <div class="a-bk-opt-list">
        ${["system", "light", "dark"]
          .map(
            id => `<button type="button" class="a-set-pick-row${cur === id ? " is-active" : ""}" data-pick-theme="${id}"><span>${escapeHtml(s.themeVals[id])}</span>${cur === id ? ICONS.check : ""}</button>`,
          )
          .join("")}
      </div>
    `;
    els.sheetBody.querySelectorAll("[data-pick-theme]").forEach(btn => {
      btn.addEventListener("click", () => {
        core()?.setThemeChoice?.(btn.dataset.pickTheme);
        closeSheet();
        if (settingsOpen) renderSettingsOverlay();
      });
    });
  }

  function renderLanguageSheetContent() {
    const s = t().settings;
    const cur = lang();
    const opts = [
      { id: "zh", label: "简体中文" },
      { id: "en", label: "English" },
      { id: "de", label: "Deutsch" },
    ];
    els.sheetBody.innerHTML = `
      <div class="a-sheet-head"><h2 class="a-sheet-title" id="androidSheetTitle">${escapeHtml(s.language)}</h2></div>
      <div class="a-bk-opt-list">
        ${opts
          .map(
            opt => `<button type="button" class="a-set-pick-row${cur === opt.id ? " is-active" : ""}" data-pick-lang="${opt.id}"><span>${escapeHtml(opt.label)}</span>${cur === opt.id ? ICONS.check : ""}</button>`,
          )
          .join("")}
      </div>
    `;
    els.sheetBody.querySelectorAll("[data-pick-lang]").forEach(btn => {
      btn.addEventListener("click", () => {
        core()?.setLanguage?.(btn.dataset.pickLang);
        closeSheet();
        if (settingsOpen) renderSettingsOverlay();
      });
    });
  }

  function renderDisplaySheetContent() {
    const s = t().settings;
    const disp = loadDisplayPrefs();
    els.sheetBody.innerHTML = `
      <div class="a-sheet-head"><h2 class="a-sheet-title" id="androidSheetTitle">${escapeHtml(s.displaySheetTitle)}</h2></div>
      <div class="a-sp-sec-lbl">${escapeHtml(s.fontLabel)}</div>
      <div class="a-sp-freq-seg" style="grid-template-columns:repeat(2,minmax(0,1fr));margin-top:6px;margin-bottom:14px;">
        <button type="button" class="a-sp-seg-btn${disp.fontScale === "normal" ? " is-active" : ""}" data-disp-font="normal">${escapeHtml(s.fontNormal)}</button>
        <button type="button" class="a-sp-seg-btn${disp.fontScale === "large" ? " is-active" : ""}" data-disp-font="large">${escapeHtml(s.fontLarge)}</button>
      </div>
      <div class="a-sp-sec-lbl">${escapeHtml(s.motionLabel)}</div>
      <div class="a-sp-freq-seg" style="grid-template-columns:repeat(2,minmax(0,1fr));margin-top:6px;margin-bottom:14px;">
        <button type="button" class="a-sp-seg-btn${!disp.reducedMotion ? " is-active" : ""}" data-disp-motion="0">${escapeHtml(s.motionFull)}</button>
        <button type="button" class="a-sp-seg-btn${disp.reducedMotion ? " is-active" : ""}" data-disp-motion="1">${escapeHtml(s.motionReduced)}</button>
      </div>
      <div class="a-sheet-cta-wrap">
        <button type="button" class="a-btn-primary" id="androidDisplayDone">${escapeHtml(t().cardLib.done)}</button>
      </div>
    `;
    els.sheetBody.querySelectorAll("[data-disp-font]").forEach(btn => {
      btn.addEventListener("click", () => {
        saveDisplayPrefs({ fontScale: btn.dataset.dispFont });
        renderDisplaySheetContent();
        if (settingsOpen) renderSettingsOverlay();
      });
    });
    els.sheetBody.querySelectorAll("[data-disp-motion]").forEach(btn => {
      btn.addEventListener("click", () => {
        saveDisplayPrefs({ reducedMotion: btn.dataset.dispMotion === "1" });
        renderDisplaySheetContent();
        if (settingsOpen) renderSettingsOverlay();
      });
    });
    els.sheetBody.querySelector("#androidDisplayDone")?.addEventListener("click", () => closeSheet());
  }

  function renderFocusTopicsManageSheetContent() {
    const s = t().settings;
    const c = core();
    const ft = c?.getFocusTopics?.() || { custom: [], recent: [] };
    const customList = ft.custom || [];
    const presets = t().focus.presetTopics || [];
    els.sheetBody.innerHTML = `
      <div class="a-sheet-head"><h2 class="a-sheet-title" id="androidSheetTitle">${escapeHtml(s.topicsSheetTitle)}</h2></div>
      <p class="a-lib-sub">${escapeHtml(s.topicsSheetSub)}</p>
      <div class="a-weather-search-row" style="margin-bottom:12px;">
        <input type="text" id="androidTopicNewInput" class="a-weather-search-input" maxlength="60" placeholder="${escapeHtml(s.topicsPlaceholder)}">
        <button type="button" class="a-weather-search-btn" id="androidTopicAddBtn">${escapeHtml(s.topicsAdd)}</button>
      </div>
      <div class="a-chip-wrap">
        ${presets.map(p => `<span class="a-h-chip">${escapeHtml(p)}</span>`).join("")}
        ${customList.map(tp => `<button type="button" class="a-h-chip is-done" data-topic-del="${escapeHtml(tp)}">${escapeHtml(tp)} ×</button>`).join("")}
      </div>
    `;
    els.sheetBody.querySelector("#androidTopicAddBtn")?.addEventListener("click", () => {
      const val = els.sheetBody.querySelector("#androidTopicNewInput")?.value?.trim();
      if (!val) return;
      c?.setFocusTopics?.([...customList, val]);
      renderFocusTopicsManageSheetContent();
      if (settingsOpen) renderSettingsOverlay();
    });
    els.sheetBody.querySelectorAll("[data-topic-del]").forEach(btn => {
      btn.addEventListener("click", () => {
        c?.setFocusTopics?.(customList.filter(x => x !== btn.dataset.topicDel));
        renderFocusTopicsManageSheetContent();
        if (settingsOpen) renderSettingsOverlay();
      });
    });
  }

  function renderReminderSheetContent() {
    const s = t().settings;
    const c = core();
    const rem = c?.getReminderSettings?.() || { enabled: false, time: "21:30" };
    els.sheetBody.innerHTML = `
      <div class="a-sheet-head"><h2 class="a-sheet-title" id="androidSheetTitle">${escapeHtml(s.reminderSheetTitle)}</h2></div>
      <div class="a-sp-sw-row" style="margin-bottom:14px;">
        <span class="a-sp-sw-title">${escapeHtml(s.reminderEnable)}</span>
        <button type="button" class="a-toggle${rem.enabled ? " is-on" : ""}" id="androidRemToggle" role="switch" aria-checked="${rem.enabled}"><span class="a-toggle-knob"></span></button>
      </div>
      <div class="a-sp-sw-row" style="margin-bottom:14px;">
        <label class="a-sp-sw-title" for="androidRemTimeInput">${escapeHtml(s.reminderTimeLabel)}</label>
        <input type="time" id="androidRemTimeInput" class="a-rem-time-input" value="${escapeHtml(rem.time || "21:30")}">
      </div>
      <div class="a-sheet-cta-wrap">
        <button type="button" class="a-btn-primary" id="androidRemSaveBtn">${escapeHtml(t().splash.save)}</button>
      </div>
    `;
    let nextEnabled = Boolean(rem.enabled);
    els.sheetBody.querySelector("#androidRemToggle")?.addEventListener("click", e => {
      nextEnabled = !nextEnabled;
      e.currentTarget.classList.toggle("is-on", nextEnabled);
      e.currentTarget.setAttribute("aria-checked", String(nextEnabled));
    });
    els.sheetBody.querySelector("#androidRemSaveBtn")?.addEventListener("click", () => {
      const timeVal = els.sheetBody.querySelector("#androidRemTimeInput")?.value || "21:30";
      c?.setReminderSettings?.({ enabled: nextEnabled, time: timeVal });
      closeSheet();
      if (settingsOpen) renderSettingsOverlay();
      showUndoSnackbar(s.reminderSaved, null);
    });
  }

  function renderClearConfirmSheetContent() {
    const s = t().settings;
    els.sheetBody.innerHTML = `
      <div class="a-sheet-head"><h2 class="a-sheet-title is-danger" id="androidSheetTitle">${escapeHtml(s.clearTitle)}</h2></div>
      <p class="a-lib-sub">${escapeHtml(s.clearDesc)}</p>
      <div class="a-clear-actions">
        <button type="button" class="a-btn-secondary" id="androidClearCancel">${escapeHtml(s.clearCancel)}</button>
        <button type="button" class="a-btn-danger" id="androidClearConfirm">${escapeHtml(s.clearConfirm)}</button>
      </div>
    `;
    els.sheetBody.querySelector("#androidClearCancel")?.addEventListener("click", () => closeSheet());
    els.sheetBody.querySelector("#androidClearConfirm")?.addEventListener("click", () => {
      closeSheet();
      void core()?.clearAllLocalData?.();
    });
  }

  function syncNativeBackState() {
    const openDialog =
      Boolean(window.LifeLedgerMoneyUI?._ui?.import?.open) ||
      Boolean(document.querySelector("dialog[open]")) ||
      Boolean(document.getElementById("dayDrawer")?.classList.contains("open"));
    const decision = resolvePredictiveBackAction({
      splashOpen,
      sheetOpen: sheetOpen || lightboxOpen,
      splashSettingsOpen,
      settingsOpen,
      focusOpen,
      dialogOpen: openDialog,
      welcomeStep,
      activeView: getActiveView(),
    });
    try {
      window.LifeLedgerAndroidBackup?.setBackEnabled?.(Boolean(decision.handled));
    } catch {}
  }

  /* ============================================================================
     Demo Mode & Predictive Back
     ============================================================================ */

  function enterDemo() {
    const ok = core()?.enterIsolatedDemo?.();
    if (!ok) return false;
    wallIndex = 0;
    moneyYm = "";
    moneyDrillCatId = "";
    timelineYm = "";
    weekKeySel = "";
    monthReviewYm = "";
    demoCardsPref = [...DEFAULT_TODAY_CARDS];
    document.documentElement.classList.add("a-demo-on");
    syncUI();
    return true;
  }

  function exitDemo() {
    const ok = core()?.exitIsolatedDemo?.();
    wallIndex = 0;
    moneyYm = "";
    moneyDrillCatId = "";
    timelineYm = "";
    weekKeySel = "";
    monthReviewYm = "";
    document.documentElement.classList.remove("a-demo-on");
    syncUI();
    return ok;
  }

  function closeTopmostNativeOverlay() {
    const openDialogs = [...document.querySelectorAll("dialog[open]")];
    if (openDialogs.length) {
      openDialogs[openDialogs.length - 1].close();
      return true;
    }
    const drawer = document.getElementById("dayDrawer");
    if (drawer?.classList.contains("open")) {
      document.getElementById("closeDrawer")?.click();
      return true;
    }
    return false;
  }

  let bankImportLoad;
  async function loadBankImport() {
    if (!bankImportLoad) {
      bankImportLoad = (async () => {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "./android-bank/money.css";
        await new Promise((resolve, reject) => {
          css.onload = resolve;
          css.onerror = () => { css.remove(); reject(new Error("Bank import stylesheet failed to load")); };
          document.head.append(css);
        });
        for (const asset of ["bank-import.js", "money-ui.js"]) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = `./android-bank/${asset}`;
            script.onload = resolve;
            script.onerror = () => { script.remove(); reject(new Error(`Bank import ${asset} failed to load`)); };
            document.head.append(script);
          });
        }
      })().catch(error => { bankImportLoad = null; throw error; });
    }
    return bankImportLoad;
  }

  function handleBack() {
    if (window.LifeLedgerMoneyUI?._ui?.import?.open) {
      window.LifeLedgerMoneyUI.closeImport();
      syncNativeBackState();
      return true;
    }
    if (splashOpen) {
      dismissSplashOverlay();
      return true;
    }
    if (lightboxOpen) {
      closeLightbox();
      return true;
    }
    const openDialog =
      Boolean(window.LifeLedgerMoneyUI?._ui?.import?.open) ||
      Boolean(document.querySelector("dialog[open]")) ||
      Boolean(document.getElementById("dayDrawer")?.classList.contains("open"));
    const decision = resolvePredictiveBackAction({
      splashOpen,
      sheetOpen,
      splashSettingsOpen,
      settingsOpen,
      focusOpen,
      dialogOpen: openDialog,
      welcomeStep,
      activeView: getActiveView(),
    });
    if (!decision.handled) return false;
    if (decision.action === "close-splash") {
      dismissSplashOverlay();
      syncNativeBackState();
      return true;
    }
    if (decision.action === "close-sheet") {
      closeSheet();
      syncNativeBackState();
      return true;
    }
    if (decision.action === "close-splash-settings") {
      closeSplashSettings();
      syncNativeBackState();
      return true;
    }
    if (decision.action === "close-settings") {
      closeSettingsOverlay();
      syncNativeBackState();
      return true;
    }
    if (decision.action === "close-focus") {
      closeFocusOverlay();
      syncNativeBackState();
      return true;
    }
    if (decision.action === "close-dialog") {
      return closeTopmostNativeOverlay();
    }
    if (decision.action === "welcome-prev") {
      welcomeStep = 1;
      renderWelcome();
      return true;
    }
    if (decision.action === "to-timeline" || decision.action === "to-today") {
      core()?.switchToView?.(decision.targetView);
      syncUI();
      return true;
    }
    return false;
  }

  function syncUI() {
    if (!mounted || syncQueued) return;
    syncQueued = true;
    afterNextPaint(() => {
      syncQueued = false;
      performSyncUI();
    });
  }

  function performSyncUI() {
    if (!mounted || !core() || splashOpen || !els.splashOverlay.hidden) return;
    const copy = t();
    const view = getActiveView();
    const demoActive = Boolean(core()?.isIsolatedDemoActive?.());
    const hasUserData = Boolean(core()?.hasUserData?.());
    const todayIso = core()?.getTodayIso?.() || toIsoDate(new Date());
    const selectedDate = core()?.getSelectedDate?.() || todayIso;

    const shellChanged = regionChanged(els.topbar, [lang(), isDark(), view, demoActive, hasUserData, todayIso, selectedDate, moneyYm, weekKeySel, monthReviewYm]);
    if (shellChanged) {
      // Demo ribbon
      document.documentElement.classList.toggle("a-demo-on", demoActive);
      els.ribbon.hidden = !demoActive;
      els.ribbon.querySelector("#androidDemoTitle").textContent = copy.demoTitle;
      els.ribbon.querySelector("#androidDemoSub").textContent = copy.demoSub;
      els.ribbon.querySelector("#androidDemoExit").textContent = copy.demoExit;

      // Top bar
      const titleText = view === "week" ? copy.history.weekTitle : (copy.titles[view] || copy.titles.today);
      els.topbar.querySelector("#androidPageTitle").textContent = titleText;
      const dateSub = els.topbar.querySelector("#androidDateSub");
      dateSub.textContent = view === "today" ? formatTopDate(selectedDate) : "";
      dateSub.hidden = view !== "today";

      // Back-to-Today capsule: visible ONLY off-today on Today view
      const backBtn = els.topbar.querySelector("#androidBackTodayBtn");
      const showBackToday = view === "today" && (demoActive || hasUserData) && shouldShowBackToToday(selectedDate, todayIso);
      backBtn.hidden = !showBackToday;
      backBtn.textContent = copy.backToday;

      // Period switcher pill in topbar for Money / Week / Month
      const periodPill = els.topbar.querySelector("#androidPeriodPill");
      const periodLabel = els.topbar.querySelector("#androidPeriodLabel");
      let showPeriod = false;
      if (view === "ledger") {
        showPeriod = true;
        periodLabel.textContent = formatYmLabel(moneyYm || todayIso.slice(0, 7));
      } else if (view === "week") {
        const wd = core()?.getWeekData?.(weekKeySel);
        if (wd) {
          showPeriod = true;
          periodLabel.textContent = formatWeekRangeLabel(wd.startIso, wd.endIso);
        }
      } else if (view === "review") {
        showPeriod = true;
        periodLabel.textContent = formatYmLabel(monthReviewYm || todayIso.slice(0, 7));
      }
      periodPill.hidden = !showPeriod;

      // Context topbar buttons
      const habitsAddBtn = els.topbar.querySelector("#androidHabitsAddBtn");
      habitsAddBtn.hidden = view !== "habits";
      habitsAddBtn.textContent = copy.habits.addBtn;

      const moneyMoreBtn = els.topbar.querySelector("#androidMoneyMoreBtn");
      moneyMoreBtn.hidden = view !== "ledger";
      moneyMoreBtn.setAttribute("aria-label", copy.money.moreTitle);

      const cardLibBtn = els.topbar.querySelector("#androidCardLibBtn");
      cardLibBtn.hidden = view !== "today" || (!demoActive && !hasUserData);
      cardLibBtn.setAttribute("aria-label", copy.cardLibAria);

      const settingsBtn = els.topbar.querySelector("#androidSettingsBtn");
      settingsBtn.hidden = view === "ledger" || view === "habits" || view === "week" || view === "review";
      settingsBtn.setAttribute("aria-label", copy.settingsAria);

      // History subtabs
      const onHistory = HISTORY_VIEWS.has(view);
      els.subtabs.hidden = !onHistory;
      els.subtabs.querySelectorAll("[data-a-subview]").forEach(btn => {
        const sub = btn.dataset.aSubview;
        btn.textContent = copy.subtabs[sub] || sub;
        const active = sub === view;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-selected", String(active));
      });

      // Bottom nav labels & active state
      const activeTab = HISTORY_VIEWS.has(view) ? "timeline" : PRIMARY_TABS.has(view) ? view : "today";
      els.bottomNav.querySelectorAll("[data-a-tab]").forEach(btn => {
        const tab = btn.dataset.aTab;
        btn.querySelector(".a-nav-label").textContent = copy.tabs[tab] || tab;
        const active = tab === activeTab;
        btn.classList.toggle("is-active", active);
        if (active) btn.setAttribute("aria-current", "page");
        else btn.removeAttribute("aria-current");
      });
      els.bottomNav.querySelector("#androidFab").setAttribute("aria-label", copy.fabAria);

      // Empty Today state vs Rebuilt Today
      const showEmptyToday = !demoActive && !hasUserData && view === "today";
      document.documentElement.classList.toggle("a-today-empty", showEmptyToday);
      els.emptyToday.hidden = !showEmptyToday;
      els.emptyToday.querySelector("#androidEmptyTodayTitle").textContent = copy.emptyToday.title;
      els.emptyToday.querySelector("#androidEmptyTodayDesc").textContent = copy.emptyToday.desc;
      els.emptyToday.querySelector("#androidEmptyTodayCta").textContent = copy.emptyToday.cta;
      els.emptyToday.querySelector("#androidEmptyTodaySample span").textContent = copy.emptyToday.sample;

    }
    syncFocusCapsule();
    // Hidden tabs do no statistics or markup work until the user visits them.
    const panels = {
      today: [els.todayRoot, renderToday], ledger: [els.moneyRoot, renderMoney],
      timeline: [els.timelineRoot, renderTimelineDaily], week: [els.weekRoot, renderTimelineWeek],
      review: [els.monthRoot, renderTimelineMonth], longrange: [els.horizonRoot, renderTimelineHorizon],
      habits: [els.habitsRoot, renderHabits],
    };
    for (const [tab, [root]] of Object.entries(panels)) root.hidden = tab !== view;
    panels[view]?.[1]();

    if (focusOpen) renderFocusOverlay();
    const state = core()?.getState?.() || {};
    if (settingsOpen) renderSettingsOverlay();
    if (splashSettingsOpen && regionChanged(els.splashSettingsOverlay, [lang(), isDark(), loadSplashPrefs(), state.quoteSettings])) renderSplashSettings();
    if (welcomeStep > 0 && regionChanged(els.welcome, [lang(), isDark(), welcomeStep])) renderWelcome();
    // Capture drafts remain owned by the sheet. Only a language/theme change
    // requires rebuilding an already-open sheet during a core notification.
    if (sheetOpen && regionChanged(els.sheetBody, [lang(), isDark(), sheetMode])) renderSheetContent();
    syncNativeBackState();
  }

  function installLayerAccessibility() {
    const layers = [...document.body.children].filter(el =>
      el.matches('.app-shell, dialog, [id^="android"]'));
    const views = [...document.querySelectorAll(".view")];
    const update = () => {
      const modal = [...document.querySelectorAll("dialog[open]")].pop() || layers.filter(el =>
        el.matches('[role="dialog"], dialog[open], .a-sheet-backdrop.is-open') &&
        !el.hidden && el.getAttribute("aria-hidden") !== "true" &&
        (!el.matches("dialog") || el.open))
        .sort((a, b) => Number(getComputedStyle(b).zIndex) - Number(getComputedStyle(a).zIndex))[0];
      for (const layer of layers) {
        layer.inert = layer.hidden || layer.getAttribute("aria-hidden") === "true" ||
          (layer.matches("dialog") && !layer.open) || Boolean(modal && layer !== modal);
      }
      for (const view of views) view.inert = !view.classList.contains("active");
    };
    const observer = new MutationObserver(update);
    for (const layer of [...layers, ...views]) {
      observer.observe(layer, { attributes: true, attributeFilter: ["hidden", "aria-hidden", "class", "open"] });
    }
    update();
  }

  function prepareLaunch() {
    launchPrepared = true;
    applyDisplayPrefs();
    buildShell();
    installLayerAccessibility();
    const params = new URLSearchParams(location.search);
    const forceSplashParam = isLocalHostname(location.hostname) ? params.get("android-splash") : null;

    const todayIso = core()?.getTodayIso?.() || toIsoDate(new Date());
    if (forceSplashParam != null && forceSplashParam !== "") {
      const wdMap = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };
      const parsedWd = wdMap[forceSplashParam.toLowerCase()] ?? (Number.isInteger(Number(forceSplashParam)) ? Number(forceSplashParam) : null);
      showSplashOverlay({ weekdayOverride: parsedWd, preview: true, hold: true, progressPct: parsedWd === 0 ? 44 : parsedWd === 2 ? 62 : parsedWd === 5 ? 36 : 50 });
    } else {
      const prefs = loadSplashPrefs();
      if (shouldShowSplashOnLaunch({ frequency: prefs.frequency, lastShownDate: prefs.lastShownDate, todayIso, welcomeStep })) {
        // Paint the built-in quote immediately; media I/O must never delay launch.
        launchSplashDeadline = performance.now() + SPLASH_DURATION_MS;
        showSplashOverlay({ preview: false });
        whenIdle(() => {
          void refreshSplashMediaCache().then(items => {
            // Apply restored/custom media if ready, keeping the original launch deadline.
            if (items.length && splashOpen && performance.now() < launchSplashDeadline) {
              showSplashOverlay({ durationMs: launchSplashDeadline - performance.now() });
            }
          });
        });
      }
    }
  }

  function init() {
    applyDisplayPrefs();
    buildShell();
    const params = new URLSearchParams(location.search);
    const forceWelcome = isLocalHostname(location.hostname) ? Number(params.get("android-welcome") || 0) : 0;
    const onboarded = localStorage.getItem(ONBOARDED_KEY) === "1";
    const hasData = Boolean(core()?.hasUserData?.());

    if (forceWelcome === 1 || forceWelcome === 2) {
      welcomeStep = forceWelcome;
    } else if (!onboarded && !hasData) {
      welcomeStep = 1;
    } else {
      welcomeStep = 0;
    }
    if (!launchPrepared) prepareLaunch();
    else if (splashOpen && launchSplashDeadline) {
      // Refresh from the now-ready core (custom quotes), without extending launch.
      showSplashOverlay({ durationMs: launchSplashDeadline - performance.now() });
    }
    syncUI();
  }

  window.LifeLedgerAndroidFace = {
    isActive: () => true,
    sync: () => syncUI(),
    showWelcome,
    completeWelcome,
    enterDemo,
    exitDemo,
    isDemoActive: () => Boolean(core()?.isIsolatedDemoActive?.()),
    openSheet,
    openKeypadSheet,
    openFocus: openFocusOverlay,
    closeFocus: closeFocusOverlay,
    isFocusOpen: () => focusOpen,
    openCardLibrary: openCardLibrarySheet,
    openPhotoFocus: openPhotoFocusSheet,
    openWeatherSheet,
    showSplash: showSplashOverlay,
    dismissSplash: dismissSplashOverlay,
    isSplashOpen: () => splashOpen,
    openSplashSettings,
    closeSplashSettings,
    isSplashSettingsOpen: () => splashSettingsOpen,
    openSettings: openSettingsOverlay,
    closeSettings: closeSettingsOverlay,
    isSettingsOpen: () => settingsOpen,
    openBackupExportSheet,
    openBackupImportSheet,
    closeSheet,
    isSheetOpen: () => sheetOpen,
    loadBankImport,
    getMoneyMonth: () => moneyYm || core()?.getTodayIso?.().slice(0, 7),
    setMoneyMonth: ym => { moneyYm = ym; syncUI(); },
    handleBack,
  };

  if (!core() && document.documentElement.dataset.androidApp === "true" && document.querySelector(".app-shell")) prepareLaunch();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 0));
  } else {
    setTimeout(init, 0);
  }
})();
