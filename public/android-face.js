/* Life Ledger Android 1.0 — Shell, Welcome, Empty States, Isolated Demo & Predictive Back (Phase 2)
   Activates ONLY when html[data-android-app="true"] is set (Android build or localhost ?platform=android). */
(() => {
  const ONBOARDED_KEY = "life-ledger-android-onboarded-v1";
  const HISTORY_VIEWS = new Set(["timeline", "week", "review", "longrange"]);
  const PRIMARY_TABS = new Set(["today", "ledger", "timeline", "habits"]);

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

  // Expose pure helpers even when Android face is inactive (zero side effects on Web/macOS).
  window.LifeLedgerAndroidFaceHelpers = {
    isLocalHostname,
    isAndroidFaceEnabled,
    resolvePredictiveBackAction,
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
      fabAria: "快速记录",
      settingsAria: "设置",
      demoTitle: "示例模式 · 3 个月体验数据",
      demoSub: "独立存储自由滑动，永不写入你的真实数据",
      demoExit: "结束观看",
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
        chars: n => `${n} 字`,
        save: "完成记录",
        moneyBridgeTitle: "快速记一笔开销或收入",
        moneyBridgeDesc: "前往「记账」页录入交易、查看分类占比与当月结余。",
        moneyBridgeCta: "打开记账页",
        focusBridgeTitle: "开启一段沉浸专注",
        focusBridgeDesc: "在今日页专注计时器开始倒计时，只统计累计专注分钟。",
        focusBridgeCta: "前往专注计时",
      },
    },
    en: {
      tabs: { today: "Today", ledger: "Money", timeline: "History", habits: "Habits" },
      subtabs: { timeline: "Daily", week: "Week", review: "Month", longrange: "Horizon" },
      titles: { today: "Today", ledger: "Money", timeline: "History", week: "History", review: "History", longrange: "History", habits: "Habits" },
      fabAria: "Quick capture",
      settingsAria: "Settings",
      demoTitle: "Demo mode · 3-month sample",
      demoSub: "Isolated preview — never touches your real data",
      demoExit: "Exit demo",
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
        chars: n => `${n} chars`,
        save: "Save entry",
        moneyBridgeTitle: "Record an expense or income",
        moneyBridgeDesc: "Jump to Money to log a transaction and review your monthly totals.",
        moneyBridgeCta: "Open Money",
        focusBridgeTitle: "Start a focus session",
        focusBridgeDesc: "Use the focus timer on Today — tracking only total focused minutes.",
        focusBridgeCta: "Go to Focus",
      },
    },
    de: {
      tabs: { today: "Heute", ledger: "Geld", timeline: "Verlauf", habits: "Routine" },
      subtabs: { timeline: "Tag", week: "Woche", review: "Monat", longrange: "Langfrist" },
      titles: { today: "Heute", ledger: "Geld", timeline: "Verlauf", week: "Verlauf", review: "Verlauf", longrange: "Verlauf", habits: "Routine" },
      fabAria: "Schnelleintrag",
      settingsAria: "Einstellungen",
      demoTitle: "Beispielmodus · 3 Monate Vorschau",
      demoSub: "Getrennt gespeichert · keine echten Daten",
      demoExit: "Beenden",
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
        chars: n => `${n} Zeichen`,
        save: "Speichern",
        moneyBridgeTitle: "Ausgabe oder Einnahme erfassen",
        moneyBridgeDesc: "Öffne den Bereich Geld für Buchungen, Kategorien und Monatsstand.",
        moneyBridgeCta: "Zu Geld wechseln",
        focusBridgeTitle: "Fokuszeit starten",
        focusBridgeDesc: "Starte den Fokus-Timer auf Heute — gezählt werden nur Fokusminuten.",
        focusBridgeCta: "Zum Fokus-Timer",
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

  function formatTopDate(iso) {
    const [y, m, d] = String(iso || "").split("-").map(Number);
    const dt = y && m && d ? new Date(y, m - 1, d, 12) : new Date();
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
    const [y, m, d] = String(iso || "").split("-").map(Number);
    const dt = y && m && d ? new Date(y, m - 1, d, 12) : new Date();
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

  const ICONS = {
    today: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>',
    ledger: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18"/></svg>',
    timeline: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>',
    habits: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 12.2l2.4 2.4 4.8-5.2"/></svg>',
    plus: '<svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    settings: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    moodGood: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
    moodCalm: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
    moodLow: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12a10.06 10.06 0 0 0-20 0Z"/><path d="M12 12v8a2 2 0 0 0 4 0"/><path d="M12 2v1"/></svg>',
    check: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 13l4 4L19 7"/></svg>',
    eye: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    upload: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/></svg>',
    appIcon: '<svg width="24" height="24" viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="116" fill="#1E2723"/><circle cx="392" cy="92" r="112" fill="#36504A" opacity=".45"/><path d="M66 424c97-70 225-82 380-30" fill="none" stroke="#86A993" stroke-width="24" stroke-linecap="round" opacity=".78"/><circle cx="258" cy="96" r="28" fill="#FFF9F1"/><path d="m246 139-35 70 48 24 23 145M246 145l62 46 46-23M212 208l-62 139" fill="none" stroke="#FFF9F1" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    morningArt: '<svg width="176" height="132" viewBox="0 0 160 120" fill="none" stroke-linecap="round" stroke-linejoin="round" style="position:relative;z-index:1;" aria-hidden="true"><g stroke="currentColor" stroke-width="1.6"><path d="M36 96h88"/><path d="M40 96c14-28 66-28 80 0"/></g><g stroke="var(--a-on-surface-variant)" stroke-width="1.5"><path d="M80 48V28"/><path d="M62 58l-12-8"/><path d="M98 58l12-8"/><path d="M56 42l-8-12"/><path d="M104 42l8-12"/></g><g stroke="var(--a-primary)" stroke-width="2.1"><circle cx="80" cy="52" r="14" fill="rgba(244, 169, 0, 0.16)"/></g></svg>',
    localArt: '<svg width="148" height="106" viewBox="0 0 160 120" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g stroke="currentColor" stroke-width="1.7"><rect x="34" y="24" width="92" height="64" rx="12" fill="var(--a-surface-card)" fill-opacity="0.85"/><path d="M34 42h92"/></g><g stroke="var(--a-on-surface-variant)" stroke-width="1.6"><circle cx="48" cy="33" r="2.2"/><circle cx="58" cy="33" r="2.2"/><path d="M52 78h56" opacity="0.5"/></g><g stroke="var(--a-primary)" stroke-width="2.2"><circle cx="80" cy="60" r="14" fill="rgba(46, 125, 91, 0.12)"/><path d="M73.5 60l4.5 4.5 9-10"/></g></svg>',
    firstRunArt: '<svg viewBox="0 0 160 120" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g stroke="currentColor" stroke-width="1.6"><path d="M34 94h92"/><path d="M48 94V44a10 10 0 0 1 10-10h44a10 10 0 0 1 10 10v50"/></g><g stroke="var(--a-on-surface-variant)" stroke-width="1.5"><path d="M62 56h36M62 68h26M62 80h18"/></g><g stroke="var(--a-primary)" stroke-width="2"><circle cx="114" cy="40" r="12" fill="var(--a-primary-soft)"/><path d="M114 35v10M109 40h10"/></g></svg>',
  };

  let mounted = false;
  let welcomeStep = 0; // 0 = hidden, 1 = screen 1, 2 = screen 2
  let sheetOpen = false;
  let sheetSegment = "mood";
  let draftMood = "";
  let draftHabits = new Set();
  let draftNote = "";

  let els = {};

  function getActiveView() {
    return document.body.dataset.activeView || "today";
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

    // 2. Android Top Bar & History Sub-Segment Switcher
    const topbar = document.createElement("header");
    topbar.id = "androidTopbar";
    topbar.className = "a-topbar";
    topbar.innerHTML = `
      <div class="a-title-wrap">
        <h1 class="a-page-title" id="androidPageTitle"></h1>
        <span class="a-date-sub" id="androidDateSub"></span>
      </div>
      <div class="a-top-actions">
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

    // 3. Empty Today Card (single clear action + subtle sample entry)
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

    // 6. Draggable Bottom Sheet Primitive (Quick Capture)
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

    els = { ribbon, topbar, subtabs, emptyToday, bottomNav, welcome, sheetBackdrop, sheet: sheetBackdrop.querySelector("#androidSheet"), sheetHandle: sheetBackdrop.querySelector("#androidSheetHandle"), sheetBody: sheetBackdrop.querySelector("#androidSheetBody") };

    bindEvents();
  }

  function bindEvents() {
    els.ribbon.querySelector("#androidDemoExit").addEventListener("click", () => exitDemo());
    els.topbar.querySelector("#androidSettingsBtn").addEventListener("click", () => core()?.openSettings?.());

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
        openSheet("mood");
      }
    });

    els.subtabs.addEventListener("click", e => {
      const btn = e.target.closest("[data-a-subview]");
      if (!btn) return;
      core()?.switchToView?.(btn.dataset.aSubview);
      syncUI();
      pushBackStateIfNeeded();
    });

    els.emptyToday.querySelector("#androidEmptyTodayCta").addEventListener("click", () => openSheet("mood"));
    els.emptyToday.querySelector("#androidEmptyTodaySample").addEventListener("click", () => enterDemo());

    // Sheet backdrop tap-to-close
    els.sheetBackdrop.addEventListener("click", e => {
      if (e.target === els.sheetBackdrop) closeSheet();
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
        if (sheetOpen || welcomeStep === 2) {
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

  function openSheet(segment = "mood") {
    const c = core();
    const date = c?.getSelectedDate?.() || c?.getTodayIso?.() || "";
    const log = c?.getLog?.(date) || { mood: "", completed: [], note: "" };
    sheetSegment = segment;
    draftMood = log.mood || "";
    draftHabits = new Set(log.completed || []);
    draftNote = log.note || "";
    sheetOpen = true;
    renderSheetContent();
    document.documentElement.classList.add("a-sheet-open");
    els.sheetBackdrop.classList.add("is-open");
    els.sheetBackdrop.setAttribute("aria-hidden", "false");
    pushBackStateIfNeeded();
  }

  function closeSheet() {
    if (!sheetOpen) return;
    sheetOpen = false;
    document.documentElement.classList.remove("a-sheet-open");
    els.sheetBackdrop.classList.remove("is-open");
    els.sheetBackdrop.setAttribute("aria-hidden", "true");
  }

  function renderSheetContent() {
    if (!els.sheetBody) return;
    const c = core();
    const s = t().sheet;
    const date = c?.getSelectedDate?.() || c?.getTodayIso?.() || "";
    const habits = (c?.activeHabitsForDate?.(date) || []).slice(0, 10);
    const doneCount = habits.filter(h => draftHabits.has(h.id)).length;
    const dateLabel = `${s.todayPrefix} ${formatShortDate(date)}`;

    let scrollHtml = "";
    let footerHtml = "";
    if (sheetSegment === "mood") {
      const moodDefs = [
        { key: "很好", icon: ICONS.moodGood, soft: "var(--a-good-soft)", fg: "var(--a-good)" },
        { key: "平静", icon: ICONS.moodCalm, soft: "var(--a-calm-soft)", fg: "var(--a-calm)" },
        { key: "低落", icon: ICONS.moodLow, soft: "var(--a-low-soft)", fg: "var(--a-low)" },
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
          <span class="a-sec-hint">${escapeHtml(s.doneCount(doneCount, habits.length))}</span>
        </div>
        <div class="a-chip-wrap">
          ${habits
            .map(h => {
              const done = draftHabits.has(h.id);
              const name = c?.displayHabitName?.(h) || h.name;
              return `<button type="button" class="a-h-chip${done ? " is-done" : ""}" data-a-habit="${escapeHtml(h.id)}" aria-pressed="${done}">
                ${done ? `<span class="a-chk-dot">${ICONS.check}</span>` : ""}
                <span>${escapeHtml(name)}</span>
              </button>`;
            })
            .join("")}
        </div>
        <div class="a-sec-head"><span class="a-sec-label">${escapeHtml(s.step3)}</span></div>
        <div class="a-note-box">
          <textarea class="a-note-input" id="androidCaptureNote" rows="2" placeholder="${escapeHtml(s.notePlaceholder)}">${escapeHtml(draftNote)}</textarea>
          <div class="a-note-foot">
            <span></span>
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
    els.sheetBody.querySelector("#androidCaptureSave")?.addEventListener("click", () => {
      const cc = core();
      const targetDate = cc?.getSelectedDate?.() || cc?.getTodayIso?.() || "";
      const existing = cc?.getLog?.(targetDate) || { mood: "", completed: [], note: "" };
      if (draftMood && draftMood !== existing.mood) cc?.setMood?.(targetDate, draftMood);
      const prevSet = new Set(existing.completed || []);
      const allIds = new Set([...prevSet, ...draftHabits]);
      allIds.forEach(id => {
        if (prevSet.has(id) !== draftHabits.has(id)) cc?.toggleHabit?.(targetDate, id);
      });
      if (draftNote.trim() !== String(existing.note || "").trim()) {
        cc?.setDayNote?.(targetDate, draftNote);
      }
      closeSheet();
      syncUI();
    });
    els.sheetBody.querySelector("#androidBridgeMoney")?.addEventListener("click", () => {
      closeSheet();
      core()?.switchToView?.("ledger");
      syncUI();
    });
    els.sheetBody.querySelector("#androidBridgeFocus")?.addEventListener("click", () => {
      closeSheet();
      core()?.switchToView?.("today");
      syncUI();
    });
  }

  function enterDemo() {
    const ok = core()?.enterIsolatedDemo?.();
    if (!ok) return false;
    document.documentElement.classList.add("a-demo-on");
    syncUI();
    return true;
  }

  function exitDemo() {
    const ok = core()?.exitIsolatedDemo?.();
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
    const openDialog = Boolean(document.querySelector("dialog[open]")) || Boolean(document.getElementById("dayDrawer")?.classList.contains("open"));
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

    // Demo ribbon
    document.documentElement.classList.toggle("a-demo-on", demoActive);
    els.ribbon.hidden = !demoActive;
    els.ribbon.querySelector("#androidDemoTitle").textContent = copy.demoTitle;
    els.ribbon.querySelector("#androidDemoSub").textContent = copy.demoSub;
    els.ribbon.querySelector("#androidDemoExit").textContent = copy.demoExit;

    // Top bar
    els.topbar.querySelector("#androidPageTitle").textContent = copy.titles[view] || copy.titles.today;
    const dateSub = els.topbar.querySelector("#androidDateSub");
    dateSub.textContent = view === "today" ? formatTopDate(core()?.getTodayIso?.()) : "";
    dateSub.hidden = view !== "today";
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

    // Empty Today state (real blank user app on Today)
    const showEmptyToday = !demoActive && !hasUserData && view === "today";
    document.documentElement.classList.toggle("a-today-empty", showEmptyToday);
    els.emptyToday.hidden = !showEmptyToday;
    els.emptyToday.querySelector("#androidEmptyTodayTitle").textContent = copy.emptyToday.title;
    els.emptyToday.querySelector("#androidEmptyTodayDesc").textContent = copy.emptyToday.desc;
    els.emptyToday.querySelector("#androidEmptyTodayCta").textContent = copy.emptyToday.cta;
    els.emptyToday.querySelector("#androidEmptyTodaySample span").textContent = copy.emptyToday.sample;

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
