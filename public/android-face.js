/* Life Ledger Android 1.0 — Shell, Welcome, Empty States, Isolated Demo, Today & Capture Sheet (Phases 1–3)
   Activates ONLY when html[data-android-app="true"] is set (Android build or localhost ?platform=android).
   All calculations and data mutations stay in the shared core (window.LifeLedgerAndroidCore / ledger-core.js). */
(() => {
  const ONBOARDED_KEY = "life-ledger-android-onboarded-v1";
  const CARDS_PREF_KEY = "life-ledger-android-today-cards-v1";
  const HISTORY_VIEWS = new Set(["timeline", "week", "review", "longrange"]);
  const PRIMARY_TABS = new Set(["today", "ledger", "timeline", "habits"]);
  const DEFAULT_TODAY_CARDS = ["quote", "weather", "mood", "habits", "focusSpend", "wall"];
  const ALL_TODAY_CARDS = ["quote", "weather", "mood", "habits", "focusSpend", "wall", "rhythm"];

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
    sheetOpen = false,
    dialogOpen = false,
    welcomeStep = 0,
    activeView = "today",
  } = {}) {
    if (sheetOpen) return { handled: true, action: "close-sheet" };
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
        weatherSlotSub: "实时天气卡 · 即将接入",
        weatherSlotRange: "00–24 时温度曲线槽位",
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
        weatherSlotSub: "Live weather slot",
        weatherSlotRange: "00–24h curve ready",
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
        weatherSlotSub: "Wetter-Vorschau",
        weatherSlotRange: "00–24 Uhr Kurve",
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
    },
  };

  function core() {
    return window.LifeLedgerAndroidCore;
  }

  function lang() {
    const l = core()?.getLang?.() || document.documentElement.lang || "zh";
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
    moonSmall: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    focusIc: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9 2h6"/></svg>',
    euroIc: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M17 6.5A6.5 6.5 0 1 0 17 17.5M5 10h9M5 14h8"/></svg>',
    chevron: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
    photoIc: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="1.5"/><path d="M21 16l-5-5-6 6"/></svg>',
    rhythmIc: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 12h4l3-7 4 14 3-7h4"/></svg>',
    quoteHorizon: '<svg width="18" height="14" viewBox="0 0 160 120" fill="none" stroke-linecap="round" style="flex-shrink:0;opacity:0.85;" aria-hidden="true"><path d="M24 94h112M34 94c14-34 78-34 92 0" stroke="var(--a-primary)" stroke-width="8"/><circle cx="80" cy="48" r="16" stroke="var(--a-good)" stroke-width="8"/></svg>',
    eye: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
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

  let mounted = false;
  let welcomeStep = 0; // 0 = hidden, 1 = screen 1, 2 = screen 2
  let sheetOpen = false;
  let sheetMode = "capture"; // "capture" | "cardlib" | "photo"
  let sheetSegment = "mood";
  let sheetTargetDate = "";
  let draftMood = "";
  let draftHabits = new Set();
  let draftNote = "";

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
      renderToday();
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

    // 2. Android Top Bar (Title + Date + Back-to-Today Capsule + Card Library + Settings)
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

    els = {
      ribbon,
      topbar,
      subtabs,
      emptyToday,
      todayRoot,
      bottomNav,
      fab: bottomNav.querySelector("#androidFab"),
      welcome,
      sheetBackdrop,
      sheet: sheetBackdrop.querySelector("#androidSheet"),
      sheetHandle: sheetBackdrop.querySelector("#androidSheetHandle"),
      sheetBody: sheetBackdrop.querySelector("#androidSheetBody"),
      lightbox,
    };

    bindEvents();
  }

  function bindEvents() {
    els.ribbon.querySelector("#androidDemoExit").addEventListener("click", () => exitDemo());
    els.topbar.querySelector("#androidSettingsBtn").addEventListener("click", () => core()?.openSettings?.());
    els.topbar.querySelector("#androidCardLibBtn").addEventListener("click", () => openCardLibrarySheet());
    els.topbar.querySelector("#androidBackTodayBtn").addEventListener("click", () => {
      const todayIso = core()?.getTodayIso?.();
      if (todayIso) core()?.selectDate?.(todayIso);
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
          renderToday();
        }
        return;
      }
      if (e.target.closest("[data-lb-next]")) {
        const list = activeWallList();
        if (list.length > 1) {
          wallIndex = (wallIndex + 1) % list.length;
          renderLightbox();
          renderToday();
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
        if (lightboxOpen || sheetOpen || welcomeStep === 2) {
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

  function renderWeatherSlot(copy) {
    const demo = Boolean(core()?.isIsolatedDemoActive?.());
    const dark = isDark();
    const l = lang();
    const gradId = dark ? "aWFillD" : "aWFillL";
    const strokeCol = dark ? "#7BB5FF" : "#3B82C4";
    const mutedCol = dark ? "#9CA3AF" : "#5B625E";
    const baseCol = dark ? "rgba(240,246,244,0.1)" : "rgba(24,34,30,0.08)";
    const dotFill = dark ? "#152130" : "#FFFFFF";

    let city = copy.today.weatherSlotCity;
    let timeStr = "";
    let tempStr = "—°";
    let condStr = "";
    let rangeStr = copy.today.weatherSlotRange;
    let dashedX = 108;
    let dotY = 18;
    let peakText = "";
    let lowText = "";
    let isPlaceholder = !demo;

    if (demo) {
      city = copy.today.weatherCityDemo;
      timeStr = dark ? "21:18" : "09:41";
      tempStr = dark ? "6°" : "8°";
      condStr = dark ? copy.today.weatherCondDemoDark : copy.today.weatherCondDemoLight;
      rangeStr = dark ? copy.today.weatherRangeDemoDark : copy.today.weatherRangeDemoLight;
      dashedX = dark ? 184 : 89;
      dotY = dark ? 37 : 26;
      peakText = "11°";
      lowText = "4°";
      isPlaceholder = false;
    } else {
      try {
        const savedCity = JSON.parse(localStorage.getItem("life-ledger-weather-city") || "null");
        if (savedCity?.name) city = savedCity.name;
      } catch {}
      condStr = copy.today.weatherSlotSub;
    }

    const weatherIcon = demo && dark ? ICONS.moonSmall : ICONS.cloud;

    return `
      <section class="a-weather-card${isPlaceholder ? " is-placeholder" : ""}" data-a-card="weather" aria-label="${escapeHtml(copy.cardLib.names.weather)}">
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
          <div class="a-w-range">${escapeHtml(rangeStr)}</div>
        </div>
        <div class="a-w-chart-wrap" aria-hidden="true">
          <svg viewBox="0 0 216 68" width="100%" height="100%" preserveAspectRatio="none" fill="none">
            <defs>
              <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${strokeCol}" stop-opacity="${dark ? "0.28" : "0.22"}"/>
                <stop offset="100%" stop-color="${strokeCol}" stop-opacity="0.01"/>
              </linearGradient>
            </defs>
            <line x1="10" y1="51" x2="206" y2="51" stroke="${baseCol}" stroke-width="1"/>
            <path d="M10 43 C32 42, 42 40, 59 38 C78 35, 92 22, 108 18 C126 14, 140 16, 157 26 C174 35, 190 40, 206 42 L206 51 L10 51 Z" fill="url(#${gradId})" opacity="${isPlaceholder ? "0.5" : "1"}"/>
            <path d="M10 43 C32 42, 42 40, 59 38 C78 35, 92 22, 108 18 C126 14, 140 16, 157 26 C174 35, 190 40, 206 42" stroke="${strokeCol}" stroke-width="2.1" stroke-linecap="round" ${isPlaceholder ? 'stroke-dasharray="4 3" opacity="0.65"' : ""}/>
            ${peakText ? `<text x="128" y="11" font-size="9.5" font-weight="700" fill="${strokeCol}" text-anchor="middle">${peakText}</text>` : ""}
            ${lowText ? `<text x="16" y="38" font-size="9" font-weight="600" fill="${mutedCol}" text-anchor="middle">${lowText}</text>` : ""}
            <line x1="${dashedX}" y1="10" x2="${dashedX}" y2="51" stroke="${strokeCol}" stroke-width="1.3" stroke-dasharray="3 2.5" opacity="${isPlaceholder ? "0.5" : "1"}"/>
            ${!isPlaceholder ? `<circle cx="${dashedX}" cy="${dotY}" r="4.3" fill="${dotFill}" stroke="${strokeCol}" stroke-width="2.2"/>` : ""}
            <g font-size="9.5" font-weight="600" fill="${mutedCol}" text-anchor="middle">
              <text x="12" y="63">00</text>
              <text x="59" y="63">06</text>
              <text x="108" y="63">12</text>
              <text x="157" y="63">18</text>
              <text x="204" y="63">24</text>
            </g>
          </svg>
        </div>
      </section>
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
    if (!demoActive && !userWallLoaded) void ensureUserWallLoaded();

    const todayIso = c?.getTodayIso?.() || toIsoDate(new Date());
    const selectedDate = c?.getSelectedDate?.() || todayIso;
    const isFuture = isAndroidDateReadOnly(selectedDate, todayIso);
    const isOffToday = shouldShowBackToToday(selectedDate, todayIso);
    const log = c?.getLog?.(selectedDate) || { mood: "", completed: [], note: "", moodReason: "" };

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

    // Quote line (same source as shared quoteSettings via core().getTodayQuote())
    const quote = c?.getTodayQuote?.() || { text: "", source: "" };
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

    // Weather slot (Phase 3 placeholder / Demo preview; Phase 4 wires live weather)
    cardHtmlMap.weather = renderWeatherSlot(copy);

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

    const cardsStream = activeCards.map(id => cardHtmlMap[id] || "").filter(Boolean).join("");
    els.todayRoot.innerHTML = `${dateStripHtml}<div class="a-today-content">${futureBannerHtml}${cardsStream}</div>`;

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

    wireTodayEvents(selectedDate, isFuture);
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

  function wireTodayEvents(selectedDate, isFuture) {
    // 1. Date strip taps & horizontal week swipe
    const strip = els.todayRoot.querySelector("#androidDateStrip");
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

    // 2. Quote tap -> Settings (where quoteSettings live)
    els.todayRoot.querySelector("#androidQuoteStrip")?.addEventListener("click", () => {
      core()?.openSettings?.();
    });

    // 3. Direct 1-tap Mood buttons (read-only on future dates)
    els.todayRoot.querySelectorAll("[data-a-today-mood]").forEach(btn => {
      btn.addEventListener("click", () => {
        if (isFuture) return;
        const mood = btn.dataset.aTodayMood;
        const cur = core()?.getLog?.(selectedDate)?.mood || "";
        core()?.setMood?.(selectedDate, cur === mood ? "" : mood);
      });
    });

    // 4. Mood note tap -> open Capture Sheet
    els.todayRoot.querySelector("#androidMoodNoteBtn")?.addEventListener("click", () => {
      if (isFuture) return;
      openSheet("mood", { fromFab: false });
    });

    // 5. Horizontal Habit tiles: bounce + FLIP move-to-end (l03)
    const rail = els.todayRoot.querySelector("#androidHabitRail");
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
    els.todayRoot.querySelector("#androidFocusCard")?.addEventListener("click", () => {
      core()?.openFocus?.();
    });
    els.todayRoot.querySelector("#androidSpendCard")?.addEventListener("click", () => {
      core()?.openSpend?.(selectedDate);
    });

    // 7. Full-bleed Photo Wall: tap opens lightbox (or picker if empty); long-press opens focus adjuster
    const wallEl = els.todayRoot.querySelector("#androidPhotoWallCard");
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
    if (!els.welcome) return;
    els.welcome.hidden = welcomeStep === 0;
    els.bottomNav.hidden = welcomeStep !== 0;
    if (welcomeStep === 0) return;
    const w = t().welcome;
    els.welcome.innerHTML = `
      <div class="a-welcome-step" data-step="1" ${welcomeStep === 1 ? "" : "hidden"}>
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
      <div class="a-welcome-step" data-step="2" ${welcomeStep === 2 ? "" : "hidden"}>
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
          core()?.openImportBackup?.();
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

  function closeSheet() {
    if (!sheetOpen) return;
    sheetOpen = false;
    document.documentElement.classList.remove("a-sheet-open");
    els.sheetBackdrop.classList.remove("is-open");
    els.sheetBackdrop.setAttribute("aria-hidden", "true");
    els.fab?.classList.remove("is-morphed");
    setTimeout(() => {
      if (!sheetOpen) els.sheet.classList.remove("is-from-fab");
    }, 320);
  }

  function renderSheetContent() {
    if (!els.sheetBody) return;
    if (sheetMode === "cardlib") {
      renderCardLibraryContent();
      return;
    }
    if (sheetMode === "photo") {
      renderPhotoSheetContent();
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
        sheetSegment = btn.dataset.aSeg;
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
        renderToday();
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
          renderToday();
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
          renderToday();
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
        renderToday();
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
        renderToday();
      } catch {}
    });

    els.sheetBody.querySelector("#androidPhotoRemoveBtn")?.addEventListener("click", async () => {
      if (demo || !photo) return;
      try {
        await wallDb.delete(photo.id);
        userWallPhotos = userWallPhotos.filter(p => p.id !== photo.id);
        wallIndex = Math.max(0, Math.min(wallIndex, userWallPhotos.length - 1));
        renderPhotoSheetContent();
        renderToday();
      } catch {}
    });

    els.sheetBody.querySelector("#androidPhotoSheetDone")?.addEventListener("click", () => closeSheet());
  }

  /* ============================================================================
     Demo Mode & Predictive Back
     ============================================================================ */

  function enterDemo() {
    const ok = core()?.enterIsolatedDemo?.();
    if (!ok) return false;
    wallIndex = 0;
    demoCardsPref = [...DEFAULT_TODAY_CARDS];
    document.documentElement.classList.add("a-demo-on");
    syncUI();
    return true;
  }

  function exitDemo() {
    const ok = core()?.exitIsolatedDemo?.();
    wallIndex = 0;
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

  function handleBack() {
    if (lightboxOpen) {
      closeLightbox();
      return true;
    }
    const openDialog =
      Boolean(document.querySelector("dialog[open]")) ||
      Boolean(document.getElementById("dayDrawer")?.classList.contains("open"));
    const decision = resolvePredictiveBackAction({
      sheetOpen,
      dialogOpen: openDialog,
      welcomeStep,
      activeView: getActiveView(),
    });
    if (!decision.handled) return false;
    if (decision.action === "close-sheet") {
      closeSheet();
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
    if (!mounted) return;
    const copy = t();
    const view = getActiveView();
    const demoActive = Boolean(core()?.isIsolatedDemoActive?.());
    const hasUserData = Boolean(core()?.hasUserData?.());
    const todayIso = core()?.getTodayIso?.() || toIsoDate(new Date());
    const selectedDate = core()?.getSelectedDate?.() || todayIso;

    // Demo ribbon
    document.documentElement.classList.toggle("a-demo-on", demoActive);
    els.ribbon.hidden = !demoActive;
    els.ribbon.querySelector("#androidDemoTitle").textContent = copy.demoTitle;
    els.ribbon.querySelector("#androidDemoSub").textContent = copy.demoSub;
    els.ribbon.querySelector("#androidDemoExit").textContent = copy.demoExit;

    // Top bar
    els.topbar.querySelector("#androidPageTitle").textContent = copy.titles[view] || copy.titles.today;
    const dateSub = els.topbar.querySelector("#androidDateSub");
    dateSub.textContent = view === "today" ? formatTopDate(selectedDate) : "";
    dateSub.hidden = view !== "today";

    // Back-to-Today capsule: visible ONLY off-today on Today view
    const backBtn = els.topbar.querySelector("#androidBackTodayBtn");
    const showBackToday = view === "today" && (demoActive || hasUserData) && shouldShowBackToToday(selectedDate, todayIso);
    backBtn.hidden = !showBackToday;
    backBtn.textContent = copy.backToday;

    // Card Library button: visible on Today view (when Today content is active)
    const cardLibBtn = els.topbar.querySelector("#androidCardLibBtn");
    cardLibBtn.hidden = view !== "today" || (!demoActive && !hasUserData);
    cardLibBtn.setAttribute("aria-label", copy.cardLibAria);
    els.topbar.querySelector("#androidSettingsBtn").setAttribute("aria-label", copy.settingsAria);

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

    renderToday();

    if (welcomeStep > 0) renderWelcome();
    if (sheetOpen) renderSheetContent();
  }

  function init() {
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
    syncUI();
    renderWelcome();
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
    openCardLibrary: openCardLibrarySheet,
    openPhotoFocus: openPhotoFocusSheet,
    closeSheet,
    isSheetOpen: () => sheetOpen,
    handleBack,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 0));
  } else {
    setTimeout(init, 0);
  }
})();
