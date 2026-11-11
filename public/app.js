const DEMO_PREVIEW_SLUG = new URLSearchParams(location.search).get("local-preview");
const STORAGE_KEY = DEMO_PREVIEW_SLUG === "demo-showcase-v1"
  ? "life-ledger-preview-demo-showcase-v1"
  : "life-ledger-v1";
const LANGUAGE_KEY = "life-ledger-language";
const LANGUAGE_PREFERENCE_KEY = "life-ledger-language-preference-set";
const THEME_KEY = "life-ledger-theme";
const SIDEBAR_KEY = "life-ledger-sidebar-collapsed";
const CALENDAR_VIEW_KEY = "life-ledger-calendar-view";
const REMINDER_KEY = "life-ledger-reminder";
const RESTORE_SAFETY_KEY = "life-ledger-restore-safety-v1";
const LOCAL_EDITION_KEY = "life-ledger-local-edition", LOCAL_EDITION = "2026-10-sample-v6";
const LOCAL_BACKUP_KEY = "life-ledger-earlier-records"; // records found before the sample was shown, restorable in Settings
const KEEP_ON_CLEAR = new Set(["life-ledger-device-profile", THEME_KEY, "life-ledger-font", LANGUAGE_KEY, LANGUAGE_PREFERENCE_KEY, SIDEBAR_KEY, LOCAL_EDITION_KEY, LOCAL_BACKUP_KEY]);
// Removes every local record (logs, goals, photos, widget state, sample flags); keeps appearance + language.
function wipeLocalRecords() {
  Object.keys(localStorage).filter(key => key.startsWith("life-ledger") && !KEEP_ON_CLEAR.has(key)).forEach(key => localStorage.removeItem(key));
  // The photo walls are the only IndexedDB stores. Runs at boot, before the walls open them, so the
  // delete is never blocked by an open connection (a blocked delete would stall every later one).
  ["", "-2", "-3"].forEach(suffix => indexedDB.deleteDatabase(`life-ledger-wall${suffix}`));
  indexedDB.deleteDatabase(`life-ledger-photos${window.LifeLedgerStorageSuffix || ""}`); // day photos of the local edition
}
// Mac app: the sample only ever replaces localStorage records; the user's own photo walls (IndexedDB) stay.
function removeLocalKeys() {
  Object.keys(localStorage).filter(key => key.startsWith("life-ledger") && !KEEP_ON_CLEAR.has(key)).forEach(key => localStorage.removeItem(key));
}
function removeDemoWallPhotos() {
  const ns = window.LifeLedgerStorageSuffix || "";
  return Promise.all(["", "-2", "-3"].map(suffix => new Promise(done => {
    const request = indexedDB.open(`life-ledger-wall${suffix}${ns}`, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("photos", { keyPath: "id" });
    request.onerror = () => done();
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction("photos", "readwrite"), store = tx.objectStore("photos");
      const keys = store.getAllKeys();
      keys.onsuccess = () => keys.result.filter(key => String(key).startsWith("demo-")).forEach(key => store.delete(key));
      tx.oncomplete = tx.onerror = tx.onabort = () => { db.close(); done(); };
    };
  })));
}
const FOCUS_ACTIVE_KEY = "life-ledger-focus-active";
const BACKUP_FORMAT = "life-ledger-backup";
const BACKUP_SCHEMA_VERSION = 2;
const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
const MAX_MEDIA_IMPORT_BYTES = 160 * 1024 * 1024;
const CLOUD_API = "./api/state";
const colors = {
  sage: { solid: "#6f8f7d", soft: "#dbe6dc" },
  amber: { solid: "#d7a84c", soft: "#f3e5bf" },
  coral: { solid: "#d97861", soft: "#f4d8d0" },
  blue: { solid: "#6e8c98", soft: "#d9e4e7" },
  violet: { solid: "#8b79c6", soft: "#e7e0f4" },
  cyan: { solid: "#4d9db3", soft: "#d9eef3" },
};
const moodCalendarIcons = {
  低落: '<path d="M4 12a8 8 0 0 1 16 0H4Z"/><path d="M12 4v13a3 3 0 0 0 6 0"/>',
  平静: '<path d="M20 4C10.4 4.5 4.3 9.8 4 19c7.1.8 14.7-3.1 16-15Z"/><path d="M4 21c3.4-7.5 8-11.8 14.4-16"/>',
  很好: '<circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
};
const iconCatalog = {
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  footprints: '<path d="M4 16v-2.4C4 10.5 6.5 8 9.6 8H12M12 8 9 5m3 3-3 3"/><path d="M20 8v2.4c0 3.1-2.5 5.6-5.6 5.6H12m0 0 3 3m-3-3 3-3"/>',
  sunrise: '<path d="M12 2v8M4.9 4.9l3 3M2 12h4M18 12h4m-2.9-7.1-3 3"/><path d="M4 18h16M6 22h12"/><path d="M8 18a4 4 0 0 1 8 0"/>',
  alarm: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M5 3 2 3m12-3 2 3M6.5 20.5 5 22m12.5-1.5L19 22"/>',
  dumbbell: '<path d="M6.5 6.5h-2v11h2m11-11h2v11h-2M6.5 9h3v6h-3m11-6h-3v6h3M9.5 12h5"/>',
  running: '<circle cx="13" cy="4" r="2"/><path d="m10 8 3 2 2-2m-5 0-2 5 4 2-2 6m2-6 4 2 2 4"/>',
  bike: '<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="m15 6-3 11-4-7h8l2.5 7.5M9 6h3"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.8-7.7 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/><path d="M3.5 12h4l1.5-3 3 6 2-3h6.5"/>',
  bed: '<path d="M2 4v16M2 15h20v5M6 11V7h5a3 3 0 0 1 3 3v5M2 11h4v4"/>',
  apple: '<path d="M12 6c-1.5-2.2-4.5-2.1-6 .1-2.5 3.7.5 12 4 14 1.2.7 2-.4 3-.4s1.8 1.1 3 .4c3.5-2 6.5-10.3 4-14-1.5-2.2-4.5-2.3-6-.1"/><path d="M12 6c0-2 1.2-3.5 3-4"/>',
  droplets: '<path d="M12 2 7 8a7 7 0 1 0 10 0Z"/><path d="M8.5 14.5a3.5 3.5 0 0 0 3.5 3.5"/>',
  book: '<path d="M2 4h6a4 4 0 0 1 4 4v12a4 4 0 0 0-4-4H2Z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a4 4 0 0 1 4-4h6Z"/>',
  brain: '<path d="M9.5 4.5A3 3 0 0 0 6 8a3 3 0 0 0-1 5.8A3.5 3.5 0 0 0 9 19v1a2 2 0 0 0 4 0V6a3 3 0 0 0-3.5-1.5Z"/><path d="M14.5 4.5A3 3 0 0 1 18 8a3 3 0 0 1 1 5.8A3.5 3.5 0 0 1 15 19v1a2 2 0 0 1-2 2"/>',
  pen: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6M12 2v3"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>',
};
const defaultHabitIcons = {
  wake: "sunrise", move: "footprints", protein: "apple", strength: "dumbbell",
  exercise: "running", reading: "book", sleep2330: "bed", hydration: "droplets",
  meditation: "brain", deepwork: "timer", language: "pen",
};
const iconLabels = {
  zh: { target: "目标", footprints: "步行", sunrise: "早起", alarm: "闹钟", dumbbell: "力量", running: "跑步", bike: "骑行", heart: "健康", bed: "睡眠", apple: "营养", droplets: "饮水", book: "阅读", brain: "冥想", pen: "日记", timer: "专注", moon: "休息" },
  en: { target: "Target", footprints: "Walking", sunrise: "Wake early", alarm: "Alarm", dumbbell: "Strength", running: "Running", bike: "Cycling", heart: "Health", bed: "Sleep", apple: "Nutrition", droplets: "Hydration", book: "Reading", brain: "Mindfulness", pen: "Journal", timer: "Focus", moon: "Rest" },
  de: { target: "Ziel", footprints: "Gehen", sunrise: "Früh aufstehen", alarm: "Wecker", dumbbell: "Kraft", running: "Laufen", bike: "Radfahren", heart: "Gesundheit", bed: "Schlaf", apple: "Ernährung", droplets: "Trinken", book: "Lesen", brain: "Achtsamkeit", pen: "Tagebuch", timer: "Fokus", moon: "Erholung" },
};
const i18n = {
  zh: {
    locale: "zh-CN",
    title: "Life Ledger · 深度复盘",
    metaDescription: "一套会随着你成长的私人习惯与深度复盘系统。",
    brand: "Life Ledger",
    brandSmall: "深度复盘",
    nav: { today: "今日", week: "本周", timeline: "时间轴", review: "复盘", habits: "习惯设置" ,
"longrange": "长期"
},
    sidebarQuote: { text: "不积跬步，\n无以至千里。", source: "《荀子·劝学》" },
    profileName: "个人复盘空间",
    exportTitle: "导入与导出",
    pwa: { install: "安装为应用", ready: "可安装", manual: "请使用浏览器菜单中的“添加到主屏幕”或“安装应用”。", installed: "Life Ledger 已安装" },
    theme: { label: "外观", system: "跟随系统", light: "浅色模式", dark: "深色模式" },
    toolbar: { open: "展开工具", close: "收起工具", short: "工具" },
    yearSuffix: "年",
    monthSuffix: "月",
    todayButton: "回到今天",
    save: {
      localPreview: "已保存在本机",
      connecting: "正在连接",
      syncing: "正在同步",
      cloudSaved: "云端已保存",
      networkRetry: "网络异常 · 自动重试",
      authExpired: "云同步需要登录 · 点击继续",
      profileCloud: "云端同步",
      profileCloudBase: "CloudBase 云同步",
      profileSyncing: "正在连接云端",
      profileAuth: "云同步尚未连接",
      profilePending: "云端连接待恢复",
      profileLocal: "本机保存 · 可导出备份",
      authTitle: "点击登录或配置 Cloudflare Access",
    },
    cloudbase: {
      account: "云同步账户", kicker: "私有同步", title: "连接腾讯云同步", intro: "使用邮箱验证码登录。会话有效期间无需重复验证，数据只写入你自己的 CloudBase 环境。",
      email: "邮箱", code: "验证码", codePlaceholder: "6位验证码", send: "发送验证码", sending: "正在发送…", sent: "验证码已发送，请查看邮箱。",
      note: "首次部署者需要在 CloudBase 控制台开启“邮箱验证码 → 邮件代发”。这是一次性免费设置。", later: "稍后", confirm: "登录并同步", signingIn: "正在登录…", connected: "已连接 CloudBase。", signOut: "退出登录", signedOut: "已退出云同步。", close: "关闭腾讯云登录", error: "无法连接 CloudBase，请检查邮箱验证码和部署设置。",
    },
    viewTitles: {
      today: "今日",
      week: "本周",
      timeline: "时间轴",
      review: "月度复盘",
      habits: "习惯",

"longrange": "长期"
},
    hero: {
      quote: "不积小流，\n无以成江海。",
      source: "《荀子·劝学》",
      progress: "今日完成",
      selectedProgress: "当日完成",
      progressText: "{done} / {total} 项完成",
    },
    mood: {
      kicker: "心情",
      title: "今天整体感觉如何？",
      selectedTitle: "这一天整体感觉如何？",
      values: { 低落: "低落", 平静: "平静", 很好: "很好" },
      note: "人有悲欢离合，月有阴晴圆缺。",
      source: "苏轼《水调歌头》",
    },
    moodReason: { kicker: "心情札记", title: "为什么今天感觉{mood}？", help: "这完全是可选的。留下一句话，未来回看时会更容易理解这一天。", label: "今天为什么会有这样的感受？", placeholder: "例如：完成了一件拖了很久的事情……", skip: "暂不记录", save: "保存原因", close: "关闭心情原因", summary: "原因 · {reason}" },
    timeline: { kicker: "记忆时间轴", title: "时间轴", description: "沿着心情与照片，重新看见走过的日子。", previous: "上个月", next: "下个月", loading: "正在整理这段记忆……", summary: "{days} 个留下记录的日子 · {photos} 张照片", summaryOnePhoto: "{days} 个留下记录的日子 · 1 张照片", emptyTitle: "这个月还没有留下记忆", emptyHelp: "心情、原因或照片会沿着时间轴出现在这里。", noMood: "一日记忆" ,
"habitsHeading": "已完成习惯"
,
"noNote": "这一天没有笔记。"
,
"selectDay": "选择一天查看详情"
,
"habitsCompleted": "{done} / {total} 个习惯"
},
    sidebarLongTerm: { title: "长期待办", open: "查看全部长期待办", empty: "还没有进行中的长期事项。" },
    todayGoals: {
      kicker: "日历", title: "每日日程", desc: "查看所选日期的日历安排。", previous: "前一天", next: "后一天",
    },
    dayPlan: {
      schedule: "日程安排", open: "展开一天", close: "关闭完整日程", events: "{count} 项", noEvents: "这一天没有临时日程。", routinesHidden: "{count} 项固定日程已收起", routinesShown: "收起固定日程", routine: "固定", allDay: "全天", preview: "日历连接后的展示预览",
    },
    calendarSync: {
      kicker: "日历连接", title: "Google 日历", trigger: "连接日历", connectedTrigger: "日历已连接", intro: "只读连接。Life Ledger 仅保留复盘所需的日程标题与时间。",
      connectTitle: "让真实日程自然进入每一天。", connectHelp: "选择你想读取的日历。Life Ledger 永远不会修改或删除 Google 日历事件。", connect: "连接 Google 日历", connecting: "正在前往 Google…",
      connected: "已连接 {count} 个 Google 账号", lastSync: "上次更新：{time}", neverSynced: "尚未读取日程", refresh: "刷新", refreshing: "正在读取日程…", choose: "选择要纳入的日历", addAccount: "＋ 添加另一个 Google 账号", accountCalendars: "此账号的日历", accountLimit: "最多连接两个 Google 账号", disconnectAccount: "断开此账号", accountNeedsReconnect: "此账号需要重新连接",
      hideRecurring: "默认收起重复日程", hideRecurringHelp: "固定日程仍会被记录，但不会占满每日计划。", save: "保存选择", saving: "正在保存…", close: "关闭", disconnect: "断开连接", disconnectConfirm: "断开后将删除 Life Ledger 中缓存的日历内容。Google 日历本身不会受到影响。",
      saved: "日历选择已保存", disconnected: "Google 日历已断开", stale: "暂时无法连接 Google，正在显示最近一次日程。", error: "日历暂时无法读取，请稍后重试。", authExpired: "Google 授权已失效，请重新连接。", noCalendars: "没有找到可读取的日历。", calendarEvents: "日程",
    },
    journal: { kicker: "日记与事件", title: "每日复盘", desc: "记下发生了什么、推进了什么，以及值得记住的事。", placeholder: "今天发生了什么？推进了什么？有什么值得记住？", futureLocked: "复盘会在这一天到来后开放。", autosaved: "● 自动保存", tabReflection: "复盘", tabFocus: "专注", switchAria: "切换每日复盘与专注计时", showReflection: "显示每日复盘", showFocus: "显示专注计时" },
    tomorrowGoals: {
      kicker: "TOMORROW'S PLAN", title: "明日目标", desc: "提前为明天留下一条清晰、从容的起点。", placeholder: "添加明天要完成的事情…", addLabel: "添加明日目标",
      empty: "明天还没有安排具体目标。<br />提前写下一件最重要的事。", added: "已加入明日目标",
    },
    reminder: {
      kicker: "每日节律", title: "每日复盘提醒", enable: "每天提醒我", enableHelp: "在一天结束时，安静地提醒你回来复盘。", time: "提醒时间",
      off: "通知尚未开启", offHelp: "保存后才会请求浏览器通知权限。", ready: "提醒已开启", readyHelp: "本应用打开时会在 {time} 检查并发送提醒。",
      denied: "通知权限已被阻止", deniedHelp: "请在浏览器或系统设置中允许 Life Ledger 发送通知。", unsupported: "当前浏览器不支持通知", unsupportedHelp: "可以继续使用复盘功能，但无法发送系统通知。",
      caveat: "本地预览仅能在应用打开时提醒。要在完全关闭后稳定提醒，需要安装 PWA 并接入云端 Push 服务。", test: "发送测试", cancel: "取消", save: "保存提醒", saved: "提醒设置已保存",
      body: "花几分钟完成今天的打卡、心情与复盘。", testBody: "通知工作正常。今晚也记得回来看看自己的脚步。", close: "关闭每日提醒设置", short: "提醒", cardOn: "已开启 · {time}", cardOff: "尚未开启",
    },
    focus: {
      kicker: "专注", overviewTitle: "专注时间", overviewHint: "只选一件事，把注意力完整地交给它。", open: "开始专注", openActive: "查看计时", settings: "设置", presetSummary: "{focus} 分钟专注 · {break} 分钟休息", readyShort: "准备开始",
      todayMinutes: "今日分钟", sessions: "次专注", weekMinutes: "本周分钟", weekChart: "本周专注时间", dialogKicker: "专注计时", dialogTitle: "把这一段时间，用在重要的事上。",
      phaseFocus: "专注", phaseBreak: "休息", ready: "准备好就开始", chooseGoal: "选择一个每日目标", goalLabel: "专注于", customLabel: "默认专注主题", customPlaceholder: "例如：数据分析、写作…",
      custom: "自定义", focusMinutes: "专注分钟", breakMinutes: "休息分钟", sound: "声音", notify: "通知", wakeLock: "保持屏幕常亮", start: "开始专注", pause: "暂停", resume: "继续", startBreak: "开始休息", finish: "提前完成", interrupt: "结束本次", skipBreak: "跳过休息", close: "关闭专注计时",
      caveat: "切换到后台后计时仍会按真实时间校准；专注时长会进入你的复盘。", goalAction: "专注此目标", untitled: "自由专注", completed: "专注完成", interrupted: "已记录本次专注", breakReady: "专注完成，休息一下吧。", breakDone: "休息结束，可以重新出发了。", notificationBody: "{label} · 已完成 {minutes} 分钟", confirmEnd: "现在结束这次专注吗？已投入的时间仍会记录。", todaySummary: "今日专注 {minutes} 分钟", reviewKicker: "专注复盘", reviewTitle: "专注时长", reviewScope: "选择专注复盘周期", scopeWeek: "周", scopeMonth: "月", reviewWeek: "选择一周", reviewMonth: "选择月份", reviewUnit: "分钟", reviewChart: "每日专注分钟", noFocus: "这个周期还没有专注记录。", moreThanPrevious: "比前一周多 {minutes} 分钟", lessThanPrevious: "比前一周少 {minutes} 分钟", sameAsPrevious: "与前一周相同", moreThanPreviousMonth: "比上个月多 {minutes} 分钟", lessThanPreviousMonth: "比上个月少 {minutes} 分钟", sameAsPreviousMonth: "与上个月相同", monthTotal: "{month} · 共 {minutes} 分钟", monthActivity: "{days} 天有专注记录 · 日均 {average} 分钟",
    },
    foundations: { kicker: "FOUNDATIONS", title: "今日基础目标", selectedTitle: "当日基础目标", adjust: "调整目标", periodNote: "周期目标 · 不计入今日完成度", carousel: "今日习惯分组", previousPage: "上一组习惯", nextPage: "下一组习惯", page: "第 {page} 组，共 {total} 组" },
    calendar: {
      kicker: "本月",
      title: "{year}年 {month}月",
      desc: "点开任意一天，完成打卡或补上一段记录。",
      prev: "上个月",
      next: "下个月",
      weekdays: ["一", "二", "三", "四", "五", "六", "日"],
      monthCompletion: "本月完成度",
      viewMode: "日历显示方式",
      viewMood: "心情",
      viewHeatmap: "热力图",
      moodLow: "低落",
      moodCalm: "平静",
      moodGood: "很好",
      heatNone: "未完成",
      heatLow: "较少",
      heatMedium: "过半",
      heatHigh: "接近完成",
      complete: "全部完成",
      partial: "部分完成",
      empty: "尚未记录",
      dayTitle: "{month}月{day}日",
      dayPercent: "{day}日 · {percent}%",

"monthInView": "月历概览"
,
"nextMonth": "下个月"
,
"prevMonth": "上个月"
,
"todayButton": "回到今天"
},
    week: {
      kicker: "THIS WEEK",
      title: "本周计划",
      source: "陶渊明《杂诗》",
      previous: "上一周",
      next: "下一周",
      currentTitle: "当前正在编辑本周",
      returnCurrent: "点击回到本周",
      relativeCurrent: "本周",
      relativeNext: "下周",
      relativePrevious: "上周",
      relativeFuture: "{n} 周后",
      relativePast: "{n} 周前",
      range: "{range}",
      rangeDate: "{year}年{m1}月{d1}日 — {m2}月{d2}日",
      checklist: "CHECKLIST",
      goalsTitle: "本周目标",
      goalPlaceholder: "添加这一周必须完成的事情…",
      emptyGoals: "这一周还没有写下必须完成的事情。<br />先放一件真正重要的进来。",
      imageCaption: "THE DISCIPLINE OF A WEEK",
      outputKicker: "WEEKLY OUTPUT",
      outputTitle: "本周输出与感想",
      outputQuote: "盛年不重来，一日难再晨。",
      autosave: "● 自动保存",
      weekNumber: "{range}",
      outputPlaceholder: "这一周，我输出了什么？\n\n完成的作品、推进的项目、一次重要表达，或者一段真正想清楚的思考……",
      outputEmpty: "尚未开始",
      outputStatus: "{count} 字 · 持续编辑中",
      savedToWeek: "文字会持续保存在当前周",
      added: "已加入本周目标",

"openDay": "打开今日"
,
"agendaLabel": "本周日程"
,
"noEntry": "无记录"
,
"focusTime": "专注时长"
,
"streak": "活跃连续"
,
"bestDay": "最佳一天"
,
"completionRate": "完成率"
,
"habitsProgress": "{done}/{total} 个习惯"
,
"goalsTitleProgress": "本周目标 · {done} / {total}"
},
    longTerm: {
      tabWeek: "本周目标", tabLong: "长期目标", kicker: "长期", title: "长期目标", description: "保留方向，不必强塞进这一周。", activeCount: "{count} 个活跃", empty: "还没有长期目标。<br />写下一个值得持续推进的方向。", add: "添加长期目标", dialogKicker: "长期目标", addTitle: "添加一个方向", editTitle: "编辑长期目标", name: "目标", next: "下一步", review: "回顾日期", status: "状态", active: "活跃", paused: "暂停", completed: "完成", noNext: "还没有写下一步", noReview: "暂未设置回顾日期", reviewOn: "{date} 回顾", delete: "删除", cancel: "取消", save: "保存", added: "长期目标已添加", updated: "长期目标已更新", removed: "长期目标已删除",
    },
    review: {
      kicker: "MONTHLY REVIEW",
      title: "{year}年{month}月",
      quote: "君子博学而日参省乎己。",
      source: "《荀子·劝学》",
      generate: "开始引导复盘",
      rhythm: "每日完成节奏",
      byDate: "按日期",
      periodTargets: "周期目标达标",
      byPeriod: "按周 / 按月",
      reflection: "月度感想",
      placeholder: "这个月发生了什么变化？哪些值得延续，下个月又需要改变什么？",
      archive: "本月各周",
      selectWeek: "选择复盘周",
      tasks: "目标完成情况",
      output: "本周输出",
      weekLabel: "第 {week} 周",
      noWeekGoals: "这一周没有设定目标。",
      noWeekOutput: "这一周还没有留下输出。",
      noPeriodic: "暂时没有按周或按月统计的目标。",
      totalDays: "本月共 {days} 天",
      times: "次",
      monthlyRow: "{month}月",
      generated: "引导提纲已生成",
      weeksTitle: "每周记录",
      goalsTitle: "本周目标",
      notesTitle: "输出与感想",
      targetLabel: "目标",
      countView: "次数",
      rateView: "达标率",
      addTarget: "＋ 添加目标",
      totalChecks: "本月完成",
      periodsMet: "周期达标",
      bestPeriod: "最佳周期",
      noPeriodicHelp: "添加一个按周或按月计算的目标后，这里会显示趋势。",
      chartCount: "完成次数",
      chartRate: "目标完成率",
      chartMetric: "图表指标",
      analyticsTitle: "习惯趋势对比",
      analyticsKicker: "指标趋势",
      selectMetrics: "最多选择 2 项",
      lineView: "折线",
      barView: "柱状",
      addMetric: "＋ 添加指标",
      monthlyAverage: "月内平均",
      totalCheckins: "完成记录",
      weeklyAdherence: "周达成率",
      chartType: "图表类型",
      weekSelectLabel: "选择周",
      periodSummary: "{met}/{periods} 个周期达标",
      noDataYet: "这个月份还没有可比较的数据。",
      draft: {
        title: "# {year}年{month}月复盘",
        foundations: "## 基础目标",
        line: "- {habit}：完成 {count} 次，月度覆盖率 {rate}%。",
        status: "## 状态与经历",
        mood: "本月记录最多的情绪是“{mood}”（{days}天）。共留下 {notes} 篇日记或事件记录。",
        noNotes: "- 本月还没有留下文字记录。",
        understanding: "## 我的理解\n这个月哪些做法值得保留？哪些目标需要调整？",
        next: "## 下个月的一个关键改变",
      },

"focusByTopic": "按主题专注"
,
"trendTitle": "每日完成度"
,
"trendEmpty": "暂无趋势数据"
,
"focusMonth": "本月专注 {minutes} 分钟"
,
"habitColRate": "完成率"
,
"autosaved": "已自动保存"
,
"narrativeTitle": "月度感想"
,
"systemLanguage": "跟随系统"
,
"datePopoverToday": "今天"
,
"datePopoverLabel": "选择日期"
,
"trendSummary": "{start} 至 {end}，完成 {completed}/{eligible}。"
,
"insufficient": "这个区间还没有可计入的完成记录。"
,
"focusWindow": "本区间专注 {minutes} 分钟"
,
"valuesSummary": "数值表"
,
"heatmapTitle": "一致性"
,
"habitCompare": "各习惯"
,
"weekdayTitle": "星期规律"
,
"bestStreakLabel": "最长连续"
,
"streakLabel": "当前连续"
,
"samePrevious": "与上一区间相同"
,
"vsPreviousDown": "比上一区间 {delta}"
,
"vsPreviousUp": "比上一区间 +{delta}"
,
"viewTable": "表格"
,
"viewHabits": "习惯"
,
"viewCalendar": "日历"
,
"viewTrend": "趋势"
,
"perDay": "每天 {count} 次"
,
"forPeriod": "本区间"
,
"rangeTo": "至"
,
"rateLabel": "完成率"
,
"windowAria": "统计区间"
,
"window90": "90 天"
,
"window30": "30 天"
,
"window7": "7 天"
,
"timePlural": "次"
,
"timeSingular": "次"
,
"insightDeltaDown": "{delta} 点"
,
"insightDeltaUp": "+{delta} 点"
,
"insightDelta": "较上月 {delta}"
,
"insightFocus": "专注时长"
,
"insightBest": "最佳习惯"
,
"insightAvg": "平均完成度"
,
"insightsEmpty": "本月数据尚不足以生成摘要。"
,
"detailedSummary": "详细指标"
},
    habits: {
      kicker: "HABIT SYSTEM",
      title: "苟日新，日日新，又日新。",
      source: "《大学》",
      desc: "调整目标会创建新版本，并从指定日期开始生效；往日标准仍按当时版本计算。",
      add: "＋ 新增习惯",
      summary: "{count} 个生效习惯",
      versions: "{count} 个目标版本",
      currentStandard: "当前标准",
      inDaily: "计入今日",
      periodOnly: "仅周期统计",
      active: "生效中",
      inactive: "已停用",
      editLabel: "编辑{habit}",
      reorder: "拖动调整{habit}的顺序",
      moveUp: "上移{habit}",
      moveDown: "下移{habit}",
      moved: "习惯顺序已保存",
      daily: "每日",
      weekly: "每周 {target} 次",
      monthly: "每月 {target} 次",
      deleteConfirm: "确定删除“{habit}”吗？相关历史打卡也会一并移除。",
      updated: "目标版本已更新",
      added: "新习惯已添加",
      deleted: "已删除“{habit}”",

"colActive": "启用"
,
"colTarget": "目标"
,
"colSchedule": "周期"
,
"colName": "名称"
,
"weeklyHint": "每周"
,
"resumed": "已启用 {habit}"
,
"paused": "已停用 {habit}"
,
"emptyHelp": "从一个小而稳定的动作开始。"
,
"emptyTitle": "还没有习惯"
,
"summaryAll": "{count} 个习惯 · {active} 个生效"
},
    drawer: {
      close: "关闭",
      goalTitle: "习惯打卡",
      moodTitle: "今日心情",
      noteTitle: "日记与事件",
      markdown: "Markdown",
      notePlaceholder: "今天发生了什么？推进了什么？有什么值得记住？",
      saveIdle: "修改将自动保存",
      saved: "已自动保存",
      complete: "完成记录",
      completeToast: "今日记录已收好",
      periodWeekly: "仅计入周度目标",
      periodMonthly: "仅计入月度目标",
      markComplete: "标记完成",
      undoComplete: "取消完成",
      futureLocked: "未来日期只用于规划目标，习惯、心情与复盘将在当天开放。",
      memoryEdit: "照片与原因",
      photoCount: "{count} 张照片",

"photos": "照片记忆"
},
    dialog: {
      kicker: "习惯",
      addTitle: "新增习惯",
      editTitle: "调整 · {habit}",
      close: "取消并关闭",
      name: "习惯名称",
      namePlaceholder: "例如：阅读",
      note: "备注（可选）",
      notePlaceholder: "这项习惯具体意味着什么？",
      trackingMode: "打卡方式",
      trackingCheck: "简单打卡",
      trackingCheckHelp: "完成或未完成，不需要数值。",
      trackingMeasured: "带目标值",
      trackingMeasuredHelp: "显示目标数值与单位。",
      icon: "图标",
      color: "强调色",
      colors: { sage: "鼠尾草绿", amber: "琥珀黄", coral: "珊瑚红", blue: "雾霾蓝", violet: "紫罗兰", cyan: "天空蓝" },
      target: "目标值",
      unit: "单位",
      frequency: "统计周期",
      schedule: "具体时间（可选）",
      periodTarget: "周期内目标次数",
      dailyScore: "计入当天完成度",
      dailyScoreHelp: "关闭后仍可每天打卡，但只影响每周或每月的周期达标。",
      effectiveDate: "生效日期",
      hint: "修改将从所选日期生效。",
      preview: "即时预览",
      previewName: "新习惯",
      delete: "删除习惯",
      cancel: "取消",
      save: "保存",
    },
    toast: {
      saved: "已保存",
      habitOn: "完成一项约定",
      habitOff: "已取消打卡",
      mood: "心情已记录",
      moodReason: "心情原因已保存",
      exported: "备份已导出",
      restored: "备份已恢复",
      restoreUndone: "已撤销上一次恢复",
    },
    celebration: "今天计入完成度的目标全部完成了。",
    export: { title: "导入与导出", all: "全部历史", allHelp: "所有习惯、心情、记录、目标和复盘", month: "指定月份", monthHelp: "导出一个自然月", week: "指定一周", weekHelp: "输入该周中的任意日期", day: "指定一天", dayHelp: "仅导出当天内容", cancel: "完成", confirm: "导出备份" },
    backup: {
      kicker: "你的数据", short: "数据", tabsAria: "选择导入或导出", tabExport: "导出", tabImport: "导入", introTitle: "记录保存在这台设备", introHelp: "定期导出完整备份，即可在换设备或换浏览器后恢复。",
      exportTitle: "导出备份", exportHelp: "JSON 文件只在你选择的位置保存。", restoreTitle: "从备份恢复", restoreHelp: "支持新版备份和早期导出的 JSON。",
      chooseTitle: "选择备份文件", chooseHelp: "文件会先在本机检查，不会上传。", reselect: "重新选择", restore: "恢复此备份", undo: "撤销上一次恢复",
      safety: "恢复前会在本机保留一份安全副本。完整备份将替换当前记录，部分备份将合并到现有记录。",
      invalid: "无法读取这个备份。请选择 Life Ledger 导出的 JSON 文件。", tooLarge: "备份文件过大，无法安全导入。", confirmFull: "这会用备份替换当前记录。是否继续？", confirmPartial: "这会把备份内容合并到当前记录。是否继续？",
      cloudWarning: "恢复后的内容也会同步到你的云端空间。",
      mediaTitle: "包含照片", mediaHelp: "按月份生成一个可迁移的照片备份文件。", mediaOnlyMonth: "照片备份仅支持指定月份。", mediaExporting: "正在整理照片备份……", mediaRestoring: "正在恢复照片……", mediaInvalid: "无法读取这个照片备份。请选择 Life Ledger 导出的 .llmedia 文件。",
      summary: "{scope} · {habits} 个习惯 · {days} 天记录 · 导出于 {date}", scopeAll: "完整备份", scopePartial: "部分备份", legacy: "早期版本备份",
    },
    defaultHabits: {
      wake: "早起",
      move: "每日基础运动量",
      protein: "蛋白质摄入",
      strength: "力量训练",
      exercise: "运动",
      reading: "阅读",
      sleep2330: "23:30 前睡",
      hydration: "饮水",
      meditation: "冥想",
      deepwork: "深度工作",
      language: "语言学习",
    },
    units: { "分钟": "分钟", "克": "克", min: "分钟", L: "升", "05:00–06:00": "05:00–06:00" },
    weekdayNames: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
    dateChip: "{year}年{month}月{day}日 · {weekday}",

"modules": {
      editLayout: "编辑卡片",
      doneEditing: "完成",
      resetLayout: "重置布局",
      resetConfirm: "确定重置模块布局吗？",
      summary: "今日概览",
      habits: "习惯打卡",
      calendar: "月历概览",
      focus: "专注计时",
      photos: "照片记忆",
      reflection: "每日复盘",
      context: "7日节律",
      completed: "本周日程",
      insights: "本周洞察",
      goals: "本周目标",
      review: "深度复盘",
      names: {
        summary: "今日概览",
        mood: "心情", heatmap: "习惯热力图", wall: "照片墙", weather: "天气",
        habits: "习惯打卡",
        calendar: "月历概览",
        focus: "专注计时",
        photos: "照片记忆",
        reflection: "每日复盘",
        context: "7日节律", dayplan: "每日日程",
        completed: "本周日程",
        insights: "本周洞察",
        goals: "本周目标",
        review: "深度复盘",
      },
      startFocus: "开始专注",
      startFocusShort: "开始",
      undo: "撤销",
      undoAria: "撤销布局更改",
      undoTitle: "撤销布局（⌘Z）",
      sizeSmall: "小",
      sizeMedium: "中",
      sizeLarge: "大号 · 横向",
      sizeSquare: "大号 · 方形",
      sizeSelector: "卡片尺寸",
      sizeAria: "设置尺寸为 {size}",
      dragAria: "拖动移动 {name}",
      dragHint: "拖动或按方向键移动卡片",
      cancel: "取消",
      actionShow: "显示",
      actionHide: "隐藏",
      show: "显示 {name}",
      hide: "隐藏 {name}",
      timerSettings: "计时设置",
      timerShort: "计时",
      writeReview: "写复盘",
      collapse: "收起模块",
      expand: "展开模块",
      editHint: "拖动把手或按 Alt+上下箭头 调整顺序",
      up: "上移",
      down: "下移",
      movedDelta: "已向{direction}移动{step}位，当前第{pos}位（共{total}个）",
      moved: "已移至第{pos}位（共{total}个）",
      dragHandle: "{name} 拖拽手柄",
      dragHint: "按 Alt+上下箭头 或拖动调整顺序",
      moveUp: "上移模块",
      moveDown: "下移模块",
      show: "显示模块",
      hide: "隐藏模块",
      actionShow: "显示",
      actionHide: "隐藏",
      hidden: "已隐藏 {name}",
      visible: "已显示 {name}",
      hintTitle: "自定义你的看板",
      hintDesc: "拖动把手或使用 Alt+上下方向键调整模块顺序。点击右侧完成保存。",
      dismissHint: "知道了",
      editEnabled: "已进入模块编辑模式",
      editDisabled: "已退出模块编辑模式",
    }
,
"submit": {
      saved: "已保存",
      exported: "已导出",
      saving: "保存中",
      exporting: "导出中",
      error: "未能完成，请重试",
    }
,
"create": {
      label: "新建",
      habit: "新习惯",
      journal: "日志条目",
      weeklyGoal: "添加本周目标",
      focus: "开始专注",
    }
,
"settings": {
      title: "设置",
      general: "通用",
      data: "数据",
      cloud: "云端与同步",
      calendar: "日历",
      habits: "习惯",
      workspaceSwitch: "切换工作区",
      inspector: "检查器",
      motion: "动效",
      motionFull: "完整",
      motionReduced: "减少",
      motionOff: "关闭",
      saved: "已保存",
    }
,
"today": {
      summary: "{done} / {total} 项完成",
      completed: "已完成（{count}）",
      streak: "{count} 天连续",
      last7: "最近 7 天",
      notScheduled: "未排程",
      notToday: "非今日计分",
      noHabits: "今天没有需要完成的习惯",
      noSearch: "没有匹配的习惯",
      noSearchHelp: "换一个词，或清空搜索。",
      futureLocked: "未来的日子还不能勾选",
      morning: "早上好",
      evening: "晚上好",
      doneKicker: "今天完成了",
      allDone: "今天的习惯都完成了",
      allDoneHelp: "可以回顾今天，或为自己留一点空白。",
      open: "待完成",
      scheduled: "已排程",
      reflect: "回顾今天",
      tomorrow: "明天",
      tomorrowCount: "明天有 {count} 项",
      reflectionLabel: "回顾",
      habits: "习惯",
      reflection: "回顾",
      noReflection: "还没有回顾",
      showAllHabits: "查看全部 {count} 项",
      contextConsistency: "近 7 日完成率",
      eventsCount: "{count} 个日程",
      sidebarMore: "还有 {count} 项",
    }
,
"widgets": {
      a11y: {
        summary: "{date}：完成 {done}/{total}",
        habits: "已完成 {completed}，待完成 {open}",
      },
    }
,
"widget": {
      title: "桌面小组件",
      desc: "在 Mac 桌面上查看今日习惯与完成度，并可直接勾选完成——无需打开应用。小组件不会显示日记、心情原因等私密内容。添加方法：右键点击桌面，选择“编辑小组件”，搜索“Life Ledger”。",
      connected: "已连接 · 上次同步 {time}",
      idle: "尚未同步",
      error: "同步失败，将自动重试",
      justNow: "刚刚",
      minutesAgo: "{minutes} 分钟前",
    }
,
"desktop": { statusLocal: "本地 Mac", statusCloud: "已连接云端" }
},
  en: {
    locale: "en",
    title: "Life Ledger · Deep Review",
    metaDescription: "A private habit and deep-review system that grows with you.",
    brand: "Life Ledger",
    brandSmall: "DEEP REVIEW",
    nav: { today: "Today", week: "Week", timeline: "Timeline", review: "Review", habits: "Habits" ,
"longrange": "Horizon"
},
    sidebarQuote: { text: "Well done is\nbetter than well said.", source: "Benjamin Franklin, Poor Richard's Almanack" },
    profileName: "Personal Ledger",
    exportTitle: "Import & export",
    pwa: { install: "Install app", ready: "Ready to install", manual: "Use your browser menu and choose Add to Home Screen or Install app.", installed: "Life Ledger installed" },
    theme: { label: "Appearance", system: "Follow system", light: "Light mode", dark: "Dark mode" },
    toolbar: { open: "Show tools", close: "Hide tools", short: "Tools" },
    yearSuffix: "",
    monthSuffix: "",
    todayButton: "Today",
    save: {
      localPreview: "Saved on this device",
      connecting: "Connecting",
      syncing: "Syncing",
      cloudSaved: "Saved to cloud",
      networkRetry: "Network issue · retrying",
      authExpired: "Cloud sync needs sign-in · click to continue",
      profileCloud: "Cloud sync",
      profileCloudBase: "CloudBase sync",
      profileSyncing: "Connecting to cloud",
      profileAuth: "Cloud sync is not connected",
      profilePending: "Cloud pending",
      profileLocal: "Local storage · exportable",
      authTitle: "Click to sign in or configure Cloudflare Access",
    },
    cloudbase: {
      account: "Cloud sync account", kicker: "PRIVATE SYNC", title: "Connect Tencent CloudBase", intro: "Sign in with an email code. You stay signed in while the session remains valid, and data is written only to your own CloudBase environment.",
      email: "Email", code: "Verification code", codePlaceholder: "6-digit code", send: "Send code", sending: "Sending…", sent: "Code sent. Check your email.",
      note: "The deployer must enable Email verification → Built-in email service once in the CloudBase console. This setup is free.", later: "Later", confirm: "Sign in and sync", signingIn: "Signing in…", connected: "Connected to CloudBase.", signOut: "Sign out", signedOut: "Cloud sync signed out.", close: "Close CloudBase sign-in", error: "CloudBase could not connect. Check the email code and deployment setup.",
    },
    viewTitles: {
      today: "Today",
      week: "Week",
      timeline: "Timeline",
      review: "Monthly Review",
      habits: "Habits",

"longrange": "Horizon"
},
    hero: {
      quote: "The secret of getting ahead\nis getting started.",
      source: "Mark Twain",
      progress: "Completed today",
      selectedProgress: "Completed that day",
      progressText: "{done} / {total} done",
    },
    mood: {
      kicker: "MOOD",
      title: "How do you feel today?",
      selectedTitle: "How did this day feel?",
      values: { 低落: "Low", 平静: "Calm", 很好: "Good" },
      note: "The mind is everything. What you think you become.",
      source: "Attributed to the Buddha",
    },
    moodReason: { kicker: "MOOD NOTE", title: "What made today feel {mood}?", help: "This is completely optional. One sentence can make this day easier to understand when you look back.", label: "What shaped this feeling today?", placeholder: "For example: I finally finished something I had postponed…", skip: "Not now", save: "Save reason", close: "Close mood reason", summary: "Reason · {reason}" },
    timeline: { kicker: "MEMORY LINE", title: "Timeline", description: "Follow your moods and photos back through the days you lived.", previous: "Previous month", next: "Next month", loading: "Gathering this month’s memories…", summary: "{days} recorded days · {photos} photos", summaryOnePhoto: "{days} recorded days · 1 photo", emptyTitle: "No memories here yet", emptyHelp: "Moods, reasons, and photos will appear here as the month unfolds.", noMood: "Daily memory" ,
"habitsHeading": "Habits completed"
,
"noNote": "No note for this day."
,
"selectDay": "Select a day to view details"
,
"habitsCompleted": "{done} of {total} habits"
},
    sidebarLongTerm: { title: "Long-term list", open: "View all long-term items", empty: "No active long-term items yet." },
    todayGoals: {
      kicker: "CALENDAR", title: "Daily Calendar", desc: "Calendar events for the selected day.", previous: "Previous day", next: "Next day",
    },
    dayPlan: {
      schedule: "Schedule", open: "Open day", close: "Close full day", events: "{count} events", noEvents: "No one-off events for this day.", routinesHidden: "{count} routines hidden", routinesShown: "Hide routines", routine: "Routine", allDay: "All day", preview: "Preview of the connected calendar experience",
    },
    calendarSync: {
      kicker: "CALENDAR CONNECTION", title: "Google Calendar", trigger: "Connect calendar", connectedTrigger: "Calendar connected", intro: "Read-only access. Life Ledger only keeps the event title and time needed for your review.",
      connectTitle: "Bring your real schedule into each day.", connectHelp: "Choose the calendars you want to read. Life Ledger never edits or deletes Google Calendar events.", connect: "Connect Google Calendar", connecting: "Opening Google…",
      connected: "{count} Google accounts connected", lastSync: "Last updated: {time}", neverSynced: "No events loaded yet", refresh: "Refresh", refreshing: "Reading events…", choose: "Calendars to include", addAccount: "＋ Add another Google account", accountCalendars: "Calendars from this account", accountLimit: "You can connect up to two Google accounts", disconnectAccount: "Disconnect this account", accountNeedsReconnect: "This account needs to reconnect",
      hideRecurring: "Collapse recurring routines", hideRecurringHelp: "Routine events remain available without taking over the day.", save: "Save selection", saving: "Saving…", close: "Close", disconnect: "Disconnect", disconnectConfirm: "Disconnecting removes cached calendar details from Life Ledger. Your Google Calendar will not be changed.",
      saved: "Calendar selection saved", disconnected: "Google Calendar disconnected", stale: "Google is unavailable, so the latest cached schedule is shown.", error: "Calendar could not be read. Please try again.", authExpired: "Google access expired. Please reconnect.", noCalendars: "No readable calendars were found.", calendarEvents: "Calendar events",
    },
    journal: { kicker: "JOURNAL & EVENTS", title: "Daily Reflection", desc: "Capture what happened, what moved, and what matters.", placeholder: "What happened today? What moved forward? What is worth remembering?", futureLocked: "Reflection opens when this day arrives.", autosaved: "● autosaved", tabReflection: "Reflection", tabFocus: "Focus", switchAria: "Switch between daily reflection and focus timer", showReflection: "Show daily reflection", showFocus: "Show focus timer" },
    tomorrowGoals: {
      kicker: "TOMORROW'S PLAN", title: "Tomorrow's Goals", desc: "Give tomorrow a clear and gentle starting point.", placeholder: "Add something for tomorrow…", addLabel: "Add tomorrow's goal",
      empty: "Nothing planned for tomorrow yet.<br />Give it one meaningful starting point.", added: "Added to tomorrow's goals",
    },
    reminder: {
      kicker: "DAILY RHYTHM", title: "Daily review reminder", enable: "Remind me every day", enableHelp: "A quiet prompt to close the day with intention.", time: "Reminder time",
      off: "Notifications are not enabled", offHelp: "Permission will only be requested after you save.", ready: "Reminder is enabled", readyHelp: "While the app is open, it will check for your {time} reminder.",
      denied: "Notifications are blocked", deniedHelp: "Allow notifications for Life Ledger in your browser or system settings.", unsupported: "Notifications are not supported", unsupportedHelp: "You can keep using reviews, but this browser cannot send system notifications.",
      caveat: "Local preview can remind you while the app is open. Reliable reminders after the app is closed require the installed PWA and a cloud push service.", test: "Send test", cancel: "Cancel", save: "Save reminder", saved: "Reminder settings saved",
      body: "Take a few minutes to complete today's habits, mood, and reflection.", testBody: "Notifications are working. Come back tonight and review the path you made.", close: "Close daily reminder settings", short: "Reminder", cardOn: "On · {time}", cardOff: "Not enabled",
    },
    focus: {
      kicker: "FOCUS", overviewTitle: "Focus Time", overviewHint: "Choose one thing. Give it your full attention.", open: "Start focus", openActive: "View timer", settings: "Settings", presetSummary: "{focus} min focus · {break} min break", readyShort: "Ready",
      todayMinutes: "min today", sessions: "sessions", weekMinutes: "min this week", weekChart: "Focus time this week", dialogKicker: "FOCUS TIMER", dialogTitle: "Make this time count.",
      phaseFocus: "Focus", phaseBreak: "Break", ready: "Ready when you are", chooseGoal: "Choose a daily goal", goalLabel: "Focus on", customLabel: "Default focus topic", customPlaceholder: "e.g. Data analysis, writing…",
      custom: "Custom", focusMinutes: "Focus minutes", breakMinutes: "Break minutes", sound: "Sound", notify: "Notification", wakeLock: "Keep screen awake", start: "Start focus", pause: "Pause", resume: "Resume", startBreak: "Start break", finish: "Finish now", interrupt: "End session", skipBreak: "Skip break", close: "Close focus timer",
      caveat: "The timer stays accurate in the background. Focused minutes become part of your review.", goalAction: "Focus on this goal", untitled: "Open focus", completed: "Focus complete", interrupted: "Focus time recorded", breakReady: "Focus complete. Take a quiet break.", breakDone: "Break complete. You are ready again.", notificationBody: "{label} · {minutes} focused minutes", confirmEnd: "End this focus now? The time you invested will still be recorded.", todaySummary: "{minutes} min focused today", reviewKicker: "FOCUS REVIEW", reviewTitle: "Focused time", reviewScope: "Choose focus review period", scopeWeek: "Week", scopeMonth: "Month", reviewWeek: "Choose week", reviewMonth: "Choose month", reviewUnit: "min", reviewChart: "Focused minutes by day", noFocus: "No focused time recorded in this period.", moreThanPrevious: "{minutes} min more than the previous week", lessThanPrevious: "{minutes} min less than the previous week", sameAsPrevious: "Same as the previous week", moreThanPreviousMonth: "{minutes} min more than last month", lessThanPreviousMonth: "{minutes} min less than last month", sameAsPreviousMonth: "Same as last month", monthTotal: "{month} · {minutes} min total", monthActivity: "{days} focused days · {average} min daily average",
    },
    foundations: { kicker: "FOUNDATIONS", title: "Daily Foundations", selectedTitle: "Foundations for This Day", adjust: "Adjust goals", periodNote: "Period target · excluded from daily score", carousel: "Today's habit groups", previousPage: "Previous habit group", nextPage: "Next habit group", page: "Group {page} of {total}" },
    calendar: {
      kicker: "MONTH IN VIEW",
      title: "{monthName} {year}",
      desc: "Open any day to check habits or leave a short note.",
      prev: "Previous month",
      next: "Next month",
      weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      monthCompletion: "month completion",
      viewMode: "Calendar display",
      viewMood: "Mood",
      viewHeatmap: "Heatmap",
      moodLow: "Low",
      moodCalm: "Calm",
      moodGood: "Good",
      heatNone: "None",
      heatLow: "A little",
      heatMedium: "More than half",
      heatHigh: "Nearly complete",
      complete: "All done",
      partial: "Partial",
      empty: "No record",
      dayTitle: "{monthName} {day}",
      dayPercent: "{month}/{day} · {percent}%",

"monthInView": "Month in view"
,
"nextMonth": "Next month"
,
"prevMonth": "Previous month"
,
"todayButton": "Today"
},
    week: {
      kicker: "THIS WEEK",
      title: "Weekly Plan",
      source: "Mahatma Gandhi",
      previous: "Previous week",
      next: "Next week",
      currentTitle: "Editing this week",
      returnCurrent: "Return to this week",
      relativeCurrent: "This week",
      relativeNext: "Next week",
      relativePrevious: "Last week",
      relativeFuture: "In {n} weeks",
      relativePast: "{n} weeks ago",
      range: "{range}",
      rangeDate: "{month1} {d1} — {month2} {d2}, {year}",
      checklist: "CHECKLIST",
      goalsTitle: "Weekly Goals",
      goalPlaceholder: "Add a must-finish task for these dates…",
      emptyGoals: "No must-finish tasks for this week yet.<br />Put one important thing here.",
      imageCaption: "THE DISCIPLINE OF A WEEK",
      outputKicker: "WEEKLY OUTPUT",
      outputTitle: "Weekly Output & Reflections",
      outputQuote: "Lost time is never found again.",
      autosave: "● autosaved",
      weekNumber: "{range}",
      outputPlaceholder: "What did I produce this week?\n\nA finished piece, a project moved forward, a meaningful conversation, or one thought I finally understood…",
      outputEmpty: "Not started",
      outputStatus: "{count} chars · editing",
      savedToWeek: "Text is saved to the selected week",
      added: "Added to weekly goals",

"openDay": "Open Today"
,
"agendaLabel": "Week agenda"
,
"noEntry": "No entry"
,
"focusTime": "Focus Time"
,
"streak": "Active Streak"
,
"bestDay": "Best Day"
,
"completionRate": "Completion Rate"
,
"habitsProgress": "{done}/{total} habits"
,
"goalsTitleProgress": "Weekly goals · {done} of {total}"
},
    longTerm: {
      tabWeek: "This week", tabLong: "Longer term", kicker: "HORIZON", title: "Long-term goals", description: "Keep the direction visible without forcing it into this week.", activeCount: "{count} active", empty: "No long-term goals yet.<br />Add one direction worth carrying forward.", add: "Add a long-term goal", dialogKicker: "LONG-TERM GOAL", addTitle: "Add direction", editTitle: "Edit long-term goal", name: "Goal", next: "Next step", review: "Review date", status: "Status", active: "Active", paused: "Paused", completed: "Completed", noNext: "No next step yet", noReview: "No review date", reviewOn: "Review {date}", delete: "Delete", cancel: "Cancel", save: "Save", added: "Long-term goal added", updated: "Long-term goal updated", removed: "Long-term goal deleted",
    },
    review: {
      kicker: "MONTHLY REVIEW",
      title: "{monthName} {year}",
      quote: "Life can only be understood backwards; but it must be lived forwards.",
      source: "Søren Kierkegaard, Journals",
      generate: "Start guided review",
      rhythm: "Daily rhythm",
      byDate: "by date",
      periodTargets: "Period targets",
      byPeriod: "weekly / monthly",
      reflection: "General Reflection",
      placeholder: "What changed this month? What deserves to continue, and what should change next month?",
      archive: "Weeks in this month",
      selectWeek: "Select review week",
      tasks: "Goal status",
      output: "Weekly output",
      weekLabel: "Week {week}",
      noWeekGoals: "No goals were set for this week.",
      noWeekOutput: "No output has been written for this week.",
      noPeriodic: "No weekly or monthly targets yet.",
      totalDays: "{days} days this month",
      times: "times",
      monthlyRow: "{monthName}",
      generated: "Guided outline generated",
      weeksTitle: "Weekly Notes",
      goalsTitle: "Weekly Goals",
      notesTitle: "Output & Reflection",
      targetLabel: "Target",
      countView: "Count",
      rateView: "Rate",
      addTarget: "＋ Add target",
      totalChecks: "This month",
      periodsMet: "Periods met",
      bestPeriod: "Best period",
      noPeriodicHelp: "Add a weekly or monthly target to see its trend here.",
      chartCount: "Completions",
      chartRate: "Target completion",
      chartMetric: "Chart metric",
      analyticsTitle: "Habit comparison",
      analyticsKicker: "METRIC TRENDS",
      selectMetrics: "Choose up to 2",
      lineView: "Line",
      barView: "Bars",
      addMetric: "＋ Add metric",
      monthlyAverage: "Monthly average",
      totalCheckins: "Check-ins",
      weeklyAdherence: "Weekly adherence",
      chartType: "Chart type",
      weekSelectLabel: "Choose week",
      periodSummary: "{met}/{periods} periods met",
      noDataYet: "There is no comparable data for this month yet.",
      draft: {
        title: "# {monthName} {year} Review",
        foundations: "## Foundations",
        line: "- {habit}: completed {count} times, monthly coverage {rate}%.",
        status: "## State & Events",
        mood: "The most recorded mood this month was “{mood}” ({days} days). You left {notes} journal/event notes.",
        noNotes: "- No written notes yet this month.",
        understanding: "## My Understanding\nWhat should I keep? Which goals need to evolve?",
        next: "## One key change for next month",
      },

"focusByTopic": "Focus by topic"
,
"trendTitle": "Daily completion"
,
"trendEmpty": "No trend data yet"
,
"focusMonth": "{minutes} min focused this month"
,
"habitColRate": "Rate"
,
"autosaved": "Autosaved"
,
"narrativeTitle": "Monthly reflection"
,
"systemLanguage": "System default"
,
"datePopoverToday": "Today"
,
"datePopoverLabel": "Choose date"
,
"trendSummary": "{start} to {end}, {completed}/{eligible} complete."
,
"insufficient": "This window has no eligible completions yet."
,
"focusWindow": "{minutes} focused minutes in this window"
,
"valuesSummary": "Values"
,
"heatmapTitle": "Consistency"
,
"habitCompare": "By habit"
,
"weekdayTitle": "Weekday pattern"
,
"bestStreakLabel": "Best streak"
,
"streakLabel": "Current streak"
,
"samePrevious": "Same as the previous window"
,
"vsPreviousDown": "{delta} vs previous"
,
"vsPreviousUp": "+{delta} vs previous"
,
"viewTable": "Table"
,
"viewHabits": "Habits"
,
"viewCalendar": "Calendar"
,
"viewTrend": "Trend"
,
"perDay": "{count} per day"
,
"forPeriod": "For this window"
,
"rangeTo": "to"
,
"rateLabel": "Completion"
,
"windowAria": "Statistics window"
,
"window90": "90 days"
,
"window30": "30 days"
,
"window7": "7 days"
,
"timePlural": "times"
,
"timeSingular": "time"
,
"insightDeltaDown": "{delta} pts"
,
"insightDeltaUp": "+{delta} pts"
,
"insightDelta": "{delta} vs previous month"
,
"insightFocus": "focused time"
,
"insightBest": "best habit"
,
"insightAvg": "average completion"
,
"insightsEmpty": "Not enough data yet for a summary."
,
"detailedSummary": "Detailed metrics"
},
    habits: {
      kicker: "HABIT SYSTEM",
      title: "Excellence is an art won by training and habituation.",
      source: "Will Durant, The Story of Philosophy",
      desc: "Changing a goal creates a new version from the effective date; older records keep their original standard.",
      add: "＋ Add habit",
      summary: "{count} active habits",
      versions: "{count} versions",
      currentStandard: "current standard",
      inDaily: "in daily score",
      periodOnly: "period only",
      active: "Active",
      inactive: "Inactive",
      editLabel: "Edit {habit}",
      reorder: "Drag to reorder {habit}",
      moveUp: "Move {habit} up",
      moveDown: "Move {habit} down",
      moved: "Habit order saved",
      daily: "Daily",
      weekly: "{target}× / week",
      monthly: "{target}× / month",
      deleteConfirm: "Delete “{habit}”? Related historical check-ins will also be removed.",
      updated: "Goal version updated",
      added: "New habit added",
      deleted: "Deleted “{habit}”",

"colActive": "Active"
,
"colTarget": "Target"
,
"colSchedule": "Schedule"
,
"colName": "Name"
,
"weeklyHint": "weekly"
,
"resumed": "{habit} active"
,
"paused": "{habit} paused"
,
"emptyHelp": "Start with one small, steady action."
,
"emptyTitle": "No habits yet"
,
"summaryAll": "{count} habits · {active} active"
},
    drawer: {
      close: "Close",
      goalTitle: "Habit check-ins",
      moodTitle: "Mood",
      noteTitle: "Journal & events",
      markdown: "Markdown",
      notePlaceholder: "What happened today? What moved forward? What is worth remembering?",
      saveIdle: "Changes autosave",
      saved: "Autosaved",
      complete: "Done",
      completeToast: "Today's record is saved",
      periodWeekly: "Counts toward weekly target only",
      periodMonthly: "Counts toward monthly target only",
      markComplete: "Mark complete",
      undoComplete: "Undo completion",
      futureLocked: "Future dates are for planning only. Habits, mood and reflection open on the day.",
      memoryEdit: "Photos & reason",
      photoCount: "{count} photos",

"photos": "Photo memories"
},
    dialog: {
      kicker: "HABIT",
      addTitle: "Add habit",
      editTitle: "Adjust · {habit}",
      close: "Cancel and close",
      name: "Habit name",
      namePlaceholder: "e.g. Reading",
      note: "Note (optional)",
      notePlaceholder: "What does this habit mean in practice?",
      trackingMode: "Tracking style",
      trackingCheck: "Simple check-in",
      trackingCheckHelp: "Done or not done, with no number required.",
      trackingMeasured: "Measured target",
      trackingMeasuredHelp: "Show a target value and unit.",
      icon: "Icon",
      color: "Accent color",
      colors: { sage: "Sage", amber: "Amber", coral: "Coral", blue: "Blue grey", violet: "Violet", cyan: "Sky blue" },
      target: "Target",
      unit: "Unit",
      frequency: "Frequency",
      schedule: "Specific time (optional)",
      periodTarget: "Target count per period",
      dailyScore: "Count toward daily score",
      dailyScoreHelp: "If off, it can still be checked daily but only affects weekly or monthly targets.",
      effectiveDate: "Effective date",
      hint: "Changes apply from the selected date.",
      preview: "Live preview",
      previewName: "New habit",
      delete: "Delete habit",
      cancel: "Cancel",
      save: "Save",
    },
    toast: {
      saved: "Saved",
      habitOn: "One promise kept",
      habitOff: "Check-in removed",
      mood: "Mood recorded",
      moodReason: "Mood reason saved",
      exported: "Backup exported",
      restored: "Backup restored",
      restoreUndone: "Last restore undone",
    },
    celebration: "Every goal counted for today is complete.",
    export: { title: "Import & export", all: "All history", allHelp: "All habits, moods, notes, goals and reviews", month: "One month", monthHelp: "Export one calendar month", week: "One week", weekHelp: "Choose any date in that week", day: "One day", dayHelp: "Export that day only", cancel: "Done", confirm: "Export backup" },
    backup: {
      kicker: "YOUR DATA", short: "Data", tabsAria: "Choose import or export", tabExport: "Export", tabImport: "Import", introTitle: "Your records stay on this device", introHelp: "Export a complete backup occasionally, then restore it after changing devices or browsers.",
      exportTitle: "Export a backup", exportHelp: "The JSON file is saved only where you choose.", restoreTitle: "Restore from a backup", restoreHelp: "Supports current backups and earlier Life Ledger JSON exports.",
      chooseTitle: "Choose backup file", chooseHelp: "It is checked on this device and never uploaded.", reselect: "Choose another", restore: "Restore this backup", undo: "Undo last restore",
      safety: "A safety copy stays on this device before restoration. Complete backups replace current records; partial backups merge with them.",
      invalid: "This backup could not be read. Choose a JSON file exported by Life Ledger.", tooLarge: "This backup is too large to import safely.", confirmFull: "This will replace the records currently on this device. Continue?", confirmPartial: "This will merge the backup into the records on this device. Continue?",
      cloudWarning: "The restored records will also sync to your cloud space.",
      mediaTitle: "Include photos", mediaHelp: "Create one portable photo backup for the selected month.", mediaOnlyMonth: "Photo backups are available for one selected month at a time.", mediaExporting: "Preparing photo backup…", mediaRestoring: "Restoring photos…", mediaInvalid: "This photo backup could not be read. Choose a .llmedia file exported by Life Ledger.",
      summary: "{scope} · {habits} habits · {days} recorded days · exported {date}", scopeAll: "Complete backup", scopePartial: "Partial backup", legacy: "Earlier backup format",
    },
    defaultHabits: {
      wake: "Wake early",
      move: "Daily baseline movement",
      protein: "Protein intake",
      strength: "Strength training",
      exercise: "Exercise",
      reading: "Reading",
      sleep2330: "Sleep before 23:30",
      hydration: "Drink enough water",
      meditation: "Meditation",
      deepwork: "Deep work",
      language: "Language learning",
    },
    units: { "分钟": "min", "克": "g", min: " min", L: " L", "05:00–06:00": "05:00–06:00" },
    weekdayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    dateChip: "{monthName} {day}, {year} · {weekday}",

"modules": {
      editLayout: "Edit cards",
      doneEditing: "Done",
      resetLayout: "Reset layout",
      resetConfirm: "Reset module layout for this view?",
      summary: "Summary",
      habits: "Daily Habits",
      calendar: "Month in View",
      focus: "Focus",
      photos: "Photos",
      reflection: "Reflection",
      context: "7-Day Rhythm",
      completed: "Completed Days",
      insights: "Weekly Insights",
      goals: "Weekly Goals",
      review: "Weekly Review",
      names: {
        summary: "Summary",
        mood: "Mood", heatmap: "Habit rhythm", wall: "Photo wall", weather: "Weather",
        habits: "Daily Habits",
        calendar: "Month in View",
        focus: "Focus",
        photos: "Photos",
        reflection: "Reflection",
        context: "7-Day Rhythm", dayplan: "Daily calendar",
        completed: "Completed Days",
        insights: "Weekly Insights",
        goals: "Weekly Goals",
        review: "Weekly Review",
      },
      startFocus: "Start focus",
      startFocusShort: "Start",
      undo: "Undo",
      undoAria: "Undo layout change",
      undoTitle: "Undo layout (⌘Z)",
      sizeSmall: "Small",
      sizeMedium: "Medium",
      sizeLarge: "Large · wide",
      sizeSquare: "Large square",
      sizeSelector: "Widget size",
      sizeAria: "Set size to {size}",
      dragAria: "Drag to move {name}",
      dragHint: "Drag or Arrow keys to move",
      cancel: "Cancel",
      actionShow: "Show",
      actionHide: "Hide",
      show: "Show {name}",
      hide: "Hide {name}",
      timerSettings: "Timer settings",
      timerShort: "Timer",
      writeReview: "Write review",
      collapse: "Collapse module",
      expand: "Expand module",
      editHint: "Drag handles or use Alt+Up/Down to reorder",
      up: "up",
      down: "down",
      movedDelta: "Moved {direction} by {step} to position {pos} of {total}",
      moved: "Moved to position {pos} of {total}",
      dragHandle: "{name} drag handle",
      dragHint: "Press Alt+Up/Down arrow or drag to reorder",
      moveUp: "Move module up",
      moveDown: "Move module down",
      show: "Show module",
      hide: "Hide module",
      actionShow: "Show",
      actionHide: "Hide",
      hidden: "Hidden {name}",
      visible: "Showing {name}",
      hintTitle: "Customise your board",
      hintDesc: "Drag handles or use Alt+Up/Down to reorder cards. Click Done when finished.",
      dismissHint: "Got it",
      editEnabled: "Layout edit mode enabled",
      editDisabled: "Layout edit mode finished",
    }
,
"submit": {
      saved: "Saved",
      exported: "Exported",
      saving: "Saving",
      exporting: "Exporting",
      error: "Could not finish. Try again.",
    }
,
"create": {
      label: "Create",
      habit: "New habit",
      journal: "Journal entry",
      weeklyGoal: "Add weekly goal",
      focus: "Start focus",
    }
,
"settings": {
      title: "Settings",
      general: "General",
      data: "Data",
      cloud: "Cloud & Sync",
      calendar: "Calendar",
      habits: "Habits",
      workspaceSwitch: "Switch workspace",
      inspector: "Inspector",
      motion: "Motion",
      motionFull: "Full",
      motionReduced: "Reduced",
      motionOff: "Off",
      saved: "Saved",
    }
,
"today": {
      summary: "{done} of {total} done",
      completed: "Completed ({count})",
      streak: "{count}-day streak",
      last7: "Last 7 days",
      notScheduled: "Not scheduled",
      notToday: "Not in today's score",
      noHabits: "No habits scheduled for today",
      noSearch: "No habits match this search",
      noSearchHelp: "Try another word, or clear the search.",
      futureLocked: "Future days cannot be checked yet",
      morning: "Good morning",
      evening: "Good evening",
      doneKicker: "Today is complete",
      allDone: "All of today's habits are done",
      allDoneHelp: "Reflect on the day or leave a little space.",
      open: "Open",
      scheduled: "Scheduled",
      reflect: "Reflect on today",
      tomorrow: "Tomorrow",
      tomorrowCount: "{count} habits tomorrow",
      reflectionLabel: "Reflection",
      habits: "Habits",
      reflection: "Reflection",
      noReflection: "No reflection yet",
      showAllHabits: "Show all {count}",
      contextConsistency: "7-day completion",
      eventsCount: "{count} events",
      sidebarMore: "+{count} more",
    }
,
"widgets": {
      a11y: {
        summary: "{date}: {done} of {total}",
        habits: "{completed} completed, {open} open",
      },
    }
,
"widget": {
      title: "Desktop widget",
      desc: "See today's habits and progress on your Mac desktop, and check one off directly — no need to open the app. The widget never shows journal notes or mood reasons. To add it: right-click your Desktop, choose “Edit Widgets”, and search for “Life Ledger”.",
      connected: "Connected · last synced {time}",
      idle: "Not synced yet",
      error: "Sync failed, retrying automatically",
      justNow: "just now",
      minutesAgo: "{minutes} min ago",
    }
,
"desktop": { statusLocal: "Local Mac", statusCloud: "Connected Cloud" }
},
  de: {
    locale: "de",
    title: "Life Ledger · Tiefe Reflexion",
    metaDescription: "Ein privates System für Gewohnheiten und tiefgehende Rückblicke, das mit dir wächst.",
    brand: "Life Ledger",
    brandSmall: "TIEFE REFLEXION",
    nav: { today: "Heute", week: "Woche", timeline: "Zeitleiste", review: "Rückblick", habits: "Gewohnheiten" ,
"longrange": "Horizont"
},
    sidebarQuote: { text: "Auch aus Steinen,\ndie dir in den Weg gelegt werden,\nkannst du etwas Schönes bauen.", source: "Johann Wolfgang von Goethe" },
    profileName: "Persönliches Journal",
    exportTitle: "Import & Export",
    pwa: { install: "App installieren", ready: "Installationsbereit", manual: "Wähle im Browsermenü „Zum Home-Bildschirm“ oder „App installieren“.", installed: "Life Ledger wurde installiert" },
    theme: { label: "Darstellung", system: "Systemeinstellung", light: "Heller Modus", dark: "Dunkler Modus" },
    toolbar: { open: "Werkzeuge anzeigen", close: "Werkzeuge ausblenden", short: "Werkzeuge" },
    yearSuffix: "",
    monthSuffix: "",
    todayButton: "Heute",
    save: {
      localPreview: "Auf diesem Gerät gespeichert",
      connecting: "Verbinden",
      syncing: "Synchronisieren",
      cloudSaved: "In der Cloud gespeichert",
      networkRetry: "Netzwerkproblem · neuer Versuch",
      authExpired: "Cloud-Sync benötigt Anmeldung · klicken",
      profileCloud: "Cloud-Sync",
      profileCloudBase: "CloudBase-Sync",
      profileSyncing: "Cloud wird verbunden",
      profileAuth: "Cloud-Sync ist nicht verbunden",
      profilePending: "Cloud wartet",
      profileLocal: "Lokal gespeichert · exportierbar",
      authTitle: "Anmelden oder Cloudflare Access einrichten",
    },
    cloudbase: {
      account: "Cloud-Sync-Konto", kicker: "PRIVATER SYNC", title: "Tencent CloudBase verbinden", intro: "Melde dich per E-Mail-Code an. Solange die Sitzung gültig ist, bleibt das Gerät angemeldet; Daten werden nur in deiner CloudBase-Umgebung gespeichert.",
      email: "E-Mail", code: "Bestätigungscode", codePlaceholder: "6-stelliger Code", send: "Code senden", sending: "Wird gesendet…", sent: "Code gesendet. Prüfe dein Postfach.",
      note: "Der Betreiber muss einmalig E-Mail-Bestätigung → integrierten Mailversand in CloudBase aktivieren. Diese Einrichtung ist kostenlos.", later: "Später", confirm: "Anmelden und synchronisieren", signingIn: "Anmeldung…", connected: "Mit CloudBase verbunden.", signOut: "Abmelden", signedOut: "Cloud-Sync abgemeldet.", close: "CloudBase-Anmeldung schließen", error: "CloudBase konnte nicht verbunden werden. Prüfe Code und Bereitstellung.",
    },
    viewTitles: {
      today: "Heute",
      week: "Woche",
      timeline: "Zeitleiste",
      review: "Monatsrückblick",
      habits: "Gewohnheiten",

"longrange": "Horizont"
},
    hero: {
      quote: "Es ist nicht genug zu wollen,\nman muss auch tun.",
      source: "Johann Wolfgang von Goethe, Wilhelm Meisters Wanderjahre",
      progress: "Heute erledigt",
      selectedProgress: "An diesem Tag erledigt",
      progressText: "{done} / {total} erledigt",
    },
    mood: {
      kicker: "STIMMUNG",
      title: "Wie fühlst du dich heute?",
      selectedTitle: "Wie hat sich dieser Tag angefühlt?",
      values: { 低落: "Schwer", 平静: "Ruhig", 很好: "Gut" },
      note: "Das Glück ist das einzige, das sich verdoppelt, wenn man es teilt.",
      source: "Albert Schweitzer",
    },
    moodReason: { kicker: "STIMMUNGSNOTIZ", title: "Warum fühlte sich heute {mood} an?", help: "Das ist völlig freiwillig. Ein Satz kann helfen, diesen Tag später besser zu verstehen.", label: "Was hat dieses Gefühl heute geprägt?", placeholder: "Zum Beispiel: Ich habe endlich etwas lange Aufgeschobenes beendet…", skip: "Nicht jetzt", save: "Grund speichern", close: "Stimmungsgrund schließen", summary: "Grund · {reason}" },
    timeline: { kicker: "ERINNERUNGSLINIE", title: "Zeitleiste", description: "Folge deinen Stimmungen und Fotos zurück durch die gelebten Tage.", previous: "Vormonat", next: "Nächster Monat", loading: "Erinnerungen dieses Monats werden gesammelt …", summary: "{days} festgehaltene Tage · {photos} Fotos", summaryOnePhoto: "{days} festgehaltene Tage · 1 Foto", emptyTitle: "Noch keine Erinnerungen in diesem Monat", emptyHelp: "Stimmungen, Gründe und Fotos erscheinen hier im Lauf des Monats.", noMood: "Tageserinnerung" ,
"habitsHeading": "Erledigte Gewohnheiten"
,
"noNote": "Keine Notiz für diesen Tag."
,
"selectDay": "Wähle einen Tag für Details"
,
"habitsCompleted": "{done} von {total} Gewohnheiten"
},
    sidebarLongTerm: { title: "Langfristig", open: "Alle langfristigen Punkte anzeigen", empty: "Noch keine aktiven langfristigen Punkte." },
    todayGoals: {
      kicker: "KALENDER", title: "Tageskalender", desc: "Kalendertermine für den ausgewählten Tag.", previous: "Voriger Tag", next: "Nächster Tag",
    },
    dayPlan: {
      schedule: "Termine", open: "Tag öffnen", close: "Tagesansicht schließen", events: "{count} Termine", noEvents: "Keine einmaligen Termine an diesem Tag.", routinesHidden: "{count} Routinen ausgeblendet", routinesShown: "Routinen ausblenden", routine: "Routine", allDay: "Ganztägig", preview: "Vorschau der verbundenen Kalenderansicht",
    },
    calendarSync: {
      kicker: "KALENDERVERBINDUNG", title: "Google Kalender", trigger: "Kalender verbinden", connectedTrigger: "Kalender verbunden", intro: "Nur Lesezugriff. Life Ledger speichert nur Titel und Zeit, die für deine Rückschau nötig sind.",
      connectTitle: "Bringe deinen echten Tagesplan in jeden Tag.", connectHelp: "Wähle die Kalender, die du lesen möchtest. Life Ledger ändert oder löscht niemals Google-Kalendertermine.", connect: "Google Kalender verbinden", connecting: "Google wird geöffnet…",
      connected: "{count} Google-Konten verbunden", lastSync: "Zuletzt aktualisiert: {time}", neverSynced: "Noch keine Termine geladen", refresh: "Aktualisieren", refreshing: "Termine werden gelesen…", choose: "Einbezogene Kalender", addAccount: "＋ Weiteres Google-Konto hinzufügen", accountCalendars: "Kalender dieses Kontos", accountLimit: "Du kannst bis zu zwei Google-Konten verbinden", disconnectAccount: "Dieses Konto trennen", accountNeedsReconnect: "Dieses Konto muss erneut verbunden werden",
      hideRecurring: "Wiederkehrende Routinen einklappen", hideRecurringHelp: "Routinen bleiben verfügbar, ohne den Tagesplan zu überladen.", save: "Auswahl speichern", saving: "Wird gespeichert…", close: "Schließen", disconnect: "Trennen", disconnectConfirm: "Beim Trennen werden zwischengespeicherte Kalenderdaten aus Life Ledger entfernt. Dein Google Kalender bleibt unverändert.",
      saved: "Kalenderauswahl gespeichert", disconnected: "Google Kalender getrennt", stale: "Google ist nicht erreichbar; der zuletzt geladene Tagesplan wird angezeigt.", error: "Der Kalender konnte nicht gelesen werden. Bitte versuche es erneut.", authExpired: "Der Google-Zugriff ist abgelaufen. Bitte erneut verbinden.", noCalendars: "Keine lesbaren Kalender gefunden.", calendarEvents: "Kalendertermine",
    },
    journal: { kicker: "TAGEBUCH & EREIGNISSE", title: "Tagesreflexion", desc: "Halte fest, was geschah, was voranging und was wichtig bleibt.", placeholder: "Was ist heute passiert? Was ging voran? Was ist erinnernswert?", futureLocked: "Die Reflexion öffnet sich, sobald dieser Tag erreicht ist.", autosaved: "● automatisch gespeichert", tabReflection: "Reflexion", tabFocus: "Fokus", switchAria: "Zwischen Tagesreflexion und Fokus-Timer wechseln", showReflection: "Tagesreflexion anzeigen", showFocus: "Fokus-Timer anzeigen" },
    tomorrowGoals: {
      kicker: "PLAN FÜR MORGEN", title: "Ziele für morgen", desc: "Gib dem morgigen Tag einen klaren und ruhigen Anfang.", placeholder: "Ein Ziel für morgen hinzufügen…", addLabel: "Ziel für morgen hinzufügen",
      empty: "Für morgen ist noch nichts geplant.<br />Setze einen sinnvollen Anfangspunkt.", added: "Zu den Zielen für morgen hinzugefügt",
    },
    reminder: {
      kicker: "TAGESRHYTHMUS", title: "Tägliche Reflexionserinnerung", enable: "Jeden Tag erinnern", enableHelp: "Ein ruhiger Hinweis, um den Tag bewusst abzuschließen.", time: "Uhrzeit",
      off: "Mitteilungen sind nicht aktiviert", offHelp: "Die Berechtigung wird erst beim Speichern angefragt.", ready: "Erinnerung ist aktiviert", readyHelp: "Solange die App geöffnet ist, prüft sie die Erinnerung um {time}.",
      denied: "Mitteilungen sind blockiert", deniedHelp: "Erlaube Life Ledger Mitteilungen in den Browser- oder Systemeinstellungen.", unsupported: "Mitteilungen werden nicht unterstützt", unsupportedHelp: "Reflexionen funktionieren weiterhin, aber dieser Browser kann keine Systemmitteilungen senden.",
      caveat: "Die lokale Vorschau erinnert nur bei geöffneter App. Zuverlässige Erinnerungen nach dem Schließen benötigen die installierte PWA und einen Cloud-Push-Dienst.", test: "Test senden", cancel: "Abbrechen", save: "Erinnerung speichern", saved: "Erinnerung gespeichert",
      body: "Nimm dir ein paar Minuten für Gewohnheiten, Stimmung und Tagesreflexion.", testBody: "Mitteilungen funktionieren. Kehre heute Abend zurück und betrachte deinen Weg.", close: "Einstellungen für tägliche Erinnerung schließen", short: "Erinnerung", cardOn: "Aktiv · {time}", cardOff: "Nicht aktiviert",
    },
    focus: {
      kicker: "FOKUS", overviewTitle: "Fokuszeit", overviewHint: "Wähle eine Sache und schenke ihr deine volle Aufmerksamkeit.", open: "Fokus starten", openActive: "Timer öffnen", settings: "Einstellungen", presetSummary: "{focus} Min. Fokus · {break} Min. Pause", readyShort: "Bereit",
      todayMinutes: "Min. heute", sessions: "Einheiten", weekMinutes: "Min. diese Woche", weekChart: "Fokuszeit dieser Woche", dialogKicker: "FOKUS-TIMER", dialogTitle: "Nutze diese Zeit für das Wesentliche.",
      phaseFocus: "Fokus", phaseBreak: "Pause", ready: "Bereit, wenn du es bist", chooseGoal: "Tagesziel wählen", goalLabel: "Fokus auf", customLabel: "Standard-Fokusthema", customPlaceholder: "z. B. Datenanalyse, Schreiben…",
      custom: "Eigene", focusMinutes: "Fokusminuten", breakMinutes: "Pausenminuten", sound: "Ton", notify: "Mitteilung", wakeLock: "Bildschirm aktiv halten", start: "Fokus starten", pause: "Pause", resume: "Fortsetzen", startBreak: "Pause starten", finish: "Jetzt abschließen", interrupt: "Einheit beenden", skipBreak: "Pause überspringen", close: "Fokus-Timer schließen",
      caveat: "Der Timer bleibt im Hintergrund zeitgenau. Fokusminuten fließen in deine Rückschau ein.", goalAction: "Dieses Ziel fokussieren", untitled: "Freier Fokus", completed: "Fokus abgeschlossen", interrupted: "Fokuszeit gespeichert", breakReady: "Fokus abgeschlossen. Zeit für eine ruhige Pause.", breakDone: "Pause beendet. Du kannst neu starten.", notificationBody: "{label} · {minutes} Fokusminuten", confirmEnd: "Diesen Fokus jetzt beenden? Die investierte Zeit wird trotzdem gespeichert.", todaySummary: "Heute {minutes} Fokusminuten", reviewKicker: "FOKUS-RÜCKBLICK", reviewTitle: "Fokuszeit", reviewScope: "Zeitraum für Fokusrückblick wählen", scopeWeek: "Woche", scopeMonth: "Monat", reviewWeek: "Woche wählen", reviewMonth: "Monat wählen", reviewUnit: "Min.", reviewChart: "Fokusminuten pro Tag", noFocus: "Für diesen Zeitraum gibt es noch keine Fokuszeit.", moreThanPrevious: "{minutes} Min. mehr als in der Vorwoche", lessThanPrevious: "{minutes} Min. weniger als in der Vorwoche", sameAsPrevious: "Wie in der Vorwoche", moreThanPreviousMonth: "{minutes} Min. mehr als im Vormonat", lessThanPreviousMonth: "{minutes} Min. weniger als im Vormonat", sameAsPreviousMonth: "Wie im Vormonat", monthTotal: "{month} · insgesamt {minutes} Min.", monthActivity: "{days} Fokustage · Ø {average} Min. pro Tag",
    },
    foundations: { kicker: "BASIS", title: "Tägliche Basisziele", selectedTitle: "Basisziele dieses Tages", adjust: "Ziele anpassen", periodNote: "Periodenziel · nicht im Tagesscore", carousel: "Heutige Gewohnheitsgruppen", previousPage: "Vorige Gewohnheitsgruppe", nextPage: "Nächste Gewohnheitsgruppe", page: "Gruppe {page} von {total}" },
    calendar: {
      kicker: "MONATSANSICHT",
      title: "{monthName} {year}",
      desc: "Öffne einen Tag, um Gewohnheiten abzuhaken oder eine kurze Notiz zu ergänzen.",
      prev: "Voriger Monat",
      next: "Nächster Monat",
      weekdays: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
      monthCompletion: "Monatsfortschritt",
      viewMode: "Kalenderdarstellung",
      viewMood: "Stimmung",
      viewHeatmap: "Heatmap",
      moodLow: "Schwer",
      moodCalm: "Ruhig",
      moodGood: "Gut",
      heatNone: "Nichts",
      heatLow: "Wenig",
      heatMedium: "Mehr als die Hälfte",
      heatHigh: "Fast vollständig",
      complete: "Alles erledigt",
      partial: "Teilweise",
      empty: "Kein Eintrag",
      dayTitle: "{day}. {monthName}",
      dayPercent: "{day}.{month}. · {percent}%",

"monthInView": "Monatsübersicht"
,
"nextMonth": "Nächster Monat"
,
"prevMonth": "Vorheriger Monat"
,
"todayButton": "Heute"
},
    week: {
      kicker: "DIESE WOCHE",
      title: "Wochenplan",
      source: "Johann Wolfgang von Goethe, Wilhelm Meisters Wanderjahre",
      previous: "Vorige Woche",
      next: "Nächste Woche",
      currentTitle: "Diese Woche bearbeiten",
      returnCurrent: "Zur aktuellen Woche",
      relativeCurrent: "Diese Woche",
      relativeNext: "Nächste Woche",
      relativePrevious: "Letzte Woche",
      relativeFuture: "In {n} Wochen",
      relativePast: "Vor {n} Wochen",
      range: "{range}",
      rangeDate: "{d1}. {month1} — {d2}. {month2} {year}",
      checklist: "CHECKLISTE",
      goalsTitle: "Wochenziele",
      goalPlaceholder: "Wichtiges Ziel für diesen Zeitraum hinzufügen…",
      emptyGoals: "Für diese Woche gibt es noch keine Pflichtziele.<br />Lege eine wirklich wichtige Sache hinein.",
      imageCaption: "DIE DISZIPLIN EINER WOCHE",
      outputKicker: "WOCHENOUTPUT",
      outputTitle: "Wochenoutput & Gedanken",
      outputQuote: "Verweile nicht in der Vergangenheit, träume nicht von der Zukunft.",
      autosave: "● automatisch gespeichert",
      weekNumber: "{range}",
      outputPlaceholder: "Was habe ich diese Woche hervorgebracht?\n\nEin fertiges Werk, ein vorangebrachtes Projekt, ein wichtiges Gespräch oder ein Gedanke, der endlich klar wurde…",
      outputEmpty: "Noch nicht begonnen",
      outputStatus: "{count} Zeichen · in Bearbeitung",
      savedToWeek: "Text wird in der ausgewählten Woche gespeichert",
      added: "Zum Wochenplan hinzugefügt",

"openDay": "Heute öffnen"
,
"agendaLabel": "Wochenagenda"
,
"noEntry": "Kein Eintrag"
,
"focusTime": "Fokuszeit"
,
"streak": "Aktive Serie"
,
"bestDay": "Bester Tag"
,
"completionRate": "Abschlussrate"
,
"habitsProgress": "{done}/{total} Gewohnheiten"
,
"goalsTitleProgress": "Wochenziele · {done} von {total}"
},
    longTerm: {
      tabWeek: "Diese Woche", tabLong: "Langfristig", kicker: "HORIZONT", title: "Langfristige Ziele", description: "Die Richtung bleibt sichtbar, ohne sie in diese Woche zu zwingen.", activeCount: "{count} aktiv", empty: "Noch keine langfristigen Ziele.<br />Lege eine Richtung fest, die du weiterverfolgen möchtest.", add: "Langfristiges Ziel hinzufügen", dialogKicker: "LANGFRISTIGES ZIEL", addTitle: "Richtung hinzufügen", editTitle: "Langfristiges Ziel bearbeiten", name: "Ziel", next: "Nächster Schritt", review: "Rückblick am", status: "Status", active: "Aktiv", paused: "Pausiert", completed: "Abgeschlossen", noNext: "Noch kein nächster Schritt", noReview: "Kein Rückblickdatum", reviewOn: "Rückblick am {date}", delete: "Löschen", cancel: "Abbrechen", save: "Speichern", added: "Langfristiges Ziel hinzugefügt", updated: "Langfristiges Ziel aktualisiert", removed: "Langfristiges Ziel gelöscht",
    },
    review: {
      kicker: "MONATSRÜCKBLICK",
      title: "{monthName} {year}",
      quote: "Wer sichere Schritte tun will, muss sie langsam tun.",
      source: "Johann Wolfgang von Goethe, Maximen und Reflexionen",
      generate: "Geführten Rückblick starten",
      rhythm: "Täglicher Rhythmus",
      byDate: "nach Datum",
      periodTargets: "Periodenziele",
      byPeriod: "wöchentlich / monatlich",
      reflection: "Allgemeine Reflexion",
      placeholder: "Was hat sich diesen Monat verändert? Was soll bleiben, und was soll sich nächsten Monat ändern?",
      archive: "Wochen dieses Monats",
      selectWeek: "Rückblickswoche auswählen",
      tasks: "Zielstatus",
      output: "Wochenoutput",
      weekLabel: "Woche {week}",
      noWeekGoals: "Für diese Woche wurden keine Ziele gesetzt.",
      noWeekOutput: "Für diese Woche wurde noch kein Output notiert.",
      noPeriodic: "Noch keine Wochen- oder Monatsziele.",
      totalDays: "{days} Tage in diesem Monat",
      times: "Mal",
      monthlyRow: "{monthName}",
      generated: "Leitfaden erstellt",
      weeksTitle: "Wochennotizen",
      goalsTitle: "Wochenziele",
      notesTitle: "Output & Reflexion",
      targetLabel: "Ziel",
      countView: "Anzahl",
      rateView: "Quote",
      addTarget: "＋ Ziel hinzufügen",
      totalChecks: "Diesen Monat",
      periodsMet: "Perioden erreicht",
      bestPeriod: "Beste Periode",
      noPeriodicHelp: "Füge ein Wochen- oder Monatsziel hinzu, um hier den Verlauf zu sehen.",
      chartCount: "Erledigungen",
      chartRate: "Zielerreichung",
      chartMetric: "Diagrammkennzahl",
      analyticsTitle: "Gewohnheiten vergleichen",
      analyticsKicker: "METRIK-TRENDS",
      selectMetrics: "Bis zu 2 auswählen",
      lineView: "Linie",
      barView: "Balken",
      addMetric: "＋ Metrik hinzufügen",
      monthlyAverage: "Monatsdurchschnitt",
      totalCheckins: "Einträge",
      weeklyAdherence: "Wöchentliche Erfüllung",
      chartType: "Diagrammtyp",
      weekSelectLabel: "Woche auswählen",
      periodSummary: "{met}/{periods} Perioden erreicht",
      noDataYet: "Für diesen Monat gibt es noch keine vergleichbaren Daten.",
      draft: {
        title: "# Rückblick {monthName} {year}",
        foundations: "## Basisziele",
        line: "- {habit}: {count} Mal erfüllt, Monatsabdeckung {rate}%.",
        status: "## Zustand & Ereignisse",
        mood: "Die häufigste notierte Stimmung war „{mood}“ ({days} Tage). Du hast {notes} Tagebuch-/Ereignisnotizen hinterlassen.",
        noNotes: "- In diesem Monat gibt es noch keine Textnotizen.",
        understanding: "## Meine Einordnung\nWas sollte bleiben? Welche Ziele dürfen wachsen?",
        next: "## Eine zentrale Veränderung für den nächsten Monat",
      },

"focusByTopic": "Fokus nach Thema"
,
"trendTitle": "Tägliche Erledigung"
,
"trendEmpty": "Noch keine Trenddaten"
,
"focusMonth": "{minutes} Fokusmin. diesen Monat"
,
"habitColRate": "Quote"
,
"autosaved": "Automatisch gespeichert"
,
"narrativeTitle": "Monatsreflexion"
,
"systemLanguage": "Systemstandard"
,
"datePopoverToday": "Heute"
,
"datePopoverLabel": "Datum wählen"
,
"trendSummary": "{start} bis {end}, {completed}/{eligible} erledigt."
,
"insufficient": "In diesem Zeitraum gibt es noch keine anrechenbaren Erledigungen."
,
"focusWindow": "{minutes} Fokusminuten in diesem Zeitraum"
,
"valuesSummary": "Werte"
,
"heatmapTitle": "Regelmäßigkeit"
,
"habitCompare": "Nach Gewohnheit"
,
"weekdayTitle": "Wochentage"
,
"bestStreakLabel": "Längste Serie"
,
"streakLabel": "Aktuelle Serie"
,
"samePrevious": "Wie im vorherigen Zeitraum"
,
"vsPreviousDown": "{delta} zum vorherigen Zeitraum"
,
"vsPreviousUp": "+{delta} zum vorherigen Zeitraum"
,
"viewTable": "Tabelle"
,
"viewHabits": "Gewohnheiten"
,
"viewCalendar": "Kalender"
,
"viewTrend": "Verlauf"
,
"perDay": "{count} pro Tag"
,
"forPeriod": "In diesem Zeitraum"
,
"rangeTo": "bis"
,
"rateLabel": "Erledigung"
,
"windowAria": "Statistikzeitraum"
,
"window90": "90 Tage"
,
"window30": "30 Tage"
,
"window7": "7 Tage"
,
"timePlural": "Mal"
,
"timeSingular": "Mal"
,
"insightDeltaDown": "{delta} Pkt."
,
"insightDeltaUp": "+{delta} Pkt."
,
"insightDelta": "{delta} vs. Vormonat"
,
"insightFocus": "Fokuszeit"
,
"insightBest": "beste Gewohnheit"
,
"insightAvg": "durchschnittliche Erledigung"
,
"insightsEmpty": "Noch nicht genug Daten für eine Zusammenfassung."
,
"detailedSummary": "Detaillierte Kennzahlen"
},
    habits: {
      kicker: "GEWOHNHEITSSYSTEM",
      title: "Es ist nicht genug zu wollen, man muss auch tun.",
      source: "Johann Wolfgang von Goethe",
      desc: "Eine Zieländerung erstellt ab dem Startdatum eine neue Version; alte Einträge behalten ihren damaligen Standard.",
      add: "＋ Gewohnheit hinzufügen",
      summary: "{count} aktive Gewohnheiten",
      versions: "{count} Versionen",
      currentStandard: "aktueller Standard",
      inDaily: "im Tagesscore",
      periodOnly: "nur Periode",
      active: "Aktiv",
      inactive: "Inaktiv",
      editLabel: "{habit} bearbeiten",
      reorder: "{habit} ziehen und neu anordnen",
      moveUp: "{habit} nach oben verschieben",
      moveDown: "{habit} nach unten verschieben",
      moved: "Reihenfolge gespeichert",
      daily: "Täglich",
      weekly: "{target}× / Woche",
      monthly: "{target}× / Monat",
      deleteConfirm: "„{habit}“ löschen? Zugehörige historische Check-ins werden ebenfalls entfernt.",
      updated: "Zielversion aktualisiert",
      added: "Neue Gewohnheit hinzugefügt",
      deleted: "„{habit}“ gelöscht",

"colActive": "Aktiv"
,
"colTarget": "Ziel"
,
"colSchedule": "Rhythmus"
,
"colName": "Name"
,
"weeklyHint": "wöchentlich"
,
"resumed": "{habit} aktiv"
,
"paused": "{habit} pausiert"
,
"emptyHelp": "Beginne mit einer kleinen, stabilen Gewohnheit."
,
"emptyTitle": "Noch keine Gewohnheiten"
,
"summaryAll": "{count} Gewohnheiten · {active} aktiv"
},
    drawer: {
      close: "Schließen",
      goalTitle: "Gewohnheiten",
      moodTitle: "Stimmung",
      noteTitle: "Tagebuch & Ereignisse",
      markdown: "Markdown",
      notePlaceholder: "Was ist heute passiert? Was ging voran? Was ist erinnernswert?",
      saveIdle: "Änderungen speichern automatisch",
      saved: "Automatisch gespeichert",
      complete: "Fertig",
      completeToast: "Tagesnotiz gespeichert",
      periodWeekly: "Zählt nur für das Wochenziel",
      periodMonthly: "Zählt nur für das Monatsziel",
      markComplete: "Als erledigt markieren",
      undoComplete: "Erledigung zurücknehmen",
      futureLocked: "Zukünftige Tage dienen nur der Planung. Gewohnheiten, Stimmung und Reflexion öffnen am jeweiligen Tag.",
      memoryEdit: "Fotos & Grund",
      photoCount: "{count} Fotos",

"photos": "Fotoerinnerungen"
},
    dialog: {
      kicker: "GEWOHNHEIT",
      addTitle: "Gewohnheit hinzufügen",
      editTitle: "Anpassen · {habit}",
      close: "Abbrechen und schließen",
      name: "Name der Gewohnheit",
      namePlaceholder: "z. B. Lesen",
      note: "Notiz (optional)",
      notePlaceholder: "Was bedeutet diese Gewohnheit konkret?",
      trackingMode: "Art der Erfassung",
      trackingCheck: "Einfach abhaken",
      trackingCheckHelp: "Erledigt oder nicht erledigt, ohne Zahlenwert.",
      trackingMeasured: "Messbares Ziel",
      trackingMeasuredHelp: "Zielwert und Einheit anzeigen.",
      icon: "Icon",
      color: "Akzentfarbe",
      colors: { sage: "Salbeigrün", amber: "Bernstein", coral: "Koralle", blue: "Blaugrau", violet: "Violett", cyan: "Himmelblau" },
      target: "Zielwert",
      unit: "Einheit",
      frequency: "Rhythmus",
      schedule: "Uhrzeit (optional)",
      periodTarget: "Zielanzahl je Periode",
      dailyScore: "In Tagesscore zählen",
      dailyScoreHelp: "Ausgeschaltet kann es täglich abgehakt werden, zählt aber nur für Wochen- oder Monatsziele.",
      effectiveDate: "Startdatum",
      hint: "Änderungen gelten ab dem gewählten Datum.",
      preview: "Live-Vorschau",
      previewName: "Neue Gewohnheit",
      delete: "Gewohnheit löschen",
      cancel: "Abbrechen",
      save: "Speichern",
    },
    toast: {
      saved: "Gespeichert",
      habitOn: "Ein Versprechen gehalten",
      habitOff: "Check-in entfernt",
      mood: "Stimmung gespeichert",
      moodReason: "Stimmungsgrund gespeichert",
      exported: "Sicherung exportiert",
      restored: "Sicherung wiederhergestellt",
      restoreUndone: "Letzte Wiederherstellung rückgängig gemacht",
    },
    celebration: "Alle Ziele, die heute zählen, sind erledigt.",
    export: { title: "Import & Export", all: "Gesamter Verlauf", allHelp: "Alle Gewohnheiten, Stimmungen, Notizen, Ziele und Rückblicke", month: "Ein Monat", monthHelp: "Einen Kalendermonat exportieren", week: "Eine Woche", weekHelp: "Ein beliebiges Datum dieser Woche wählen", day: "Ein Tag", dayHelp: "Nur diesen Tag exportieren", cancel: "Fertig", confirm: "Sicherung exportieren" },
    backup: {
      kicker: "DEINE DATEN", short: "Daten", tabsAria: "Import oder Export wählen", tabExport: "Export", tabImport: "Import", introTitle: "Deine Einträge bleiben auf diesem Gerät", introHelp: "Exportiere gelegentlich eine vollständige Sicherung und stelle sie nach einem Geräte- oder Browserwechsel wieder her.",
      exportTitle: "Sicherung exportieren", exportHelp: "Die JSON-Datei wird nur am gewählten Ort gespeichert.", restoreTitle: "Aus Sicherung wiederherstellen", restoreHelp: "Unterstützt aktuelle Sicherungen und frühere Life-Ledger-JSON-Exporte.",
      chooseTitle: "Sicherungsdatei wählen", chooseHelp: "Sie wird nur auf diesem Gerät geprüft und nicht hochgeladen.", reselect: "Andere wählen", restore: "Diese Sicherung wiederherstellen", undo: "Letzte Wiederherstellung rückgängig",
      safety: "Vorher bleibt eine Sicherheitskopie auf diesem Gerät. Vollständige Sicherungen ersetzen bestehende Einträge; Teilsicherungen werden zusammengeführt.",
      invalid: "Diese Sicherung konnte nicht gelesen werden. Wähle eine von Life Ledger exportierte JSON-Datei.", tooLarge: "Diese Sicherung ist zu groß für einen sicheren Import.", confirmFull: "Die aktuellen Einträge auf diesem Gerät werden ersetzt. Fortfahren?", confirmPartial: "Die Sicherung wird mit den Einträgen auf diesem Gerät zusammengeführt. Fortfahren?",
      cloudWarning: "Die wiederhergestellten Einträge werden auch mit deinem Cloud-Speicher synchronisiert.",
      mediaTitle: "Fotos einschließen", mediaHelp: "Erstellt eine übertragbare Fotosicherung für den gewählten Monat.", mediaOnlyMonth: "Fotosicherungen sind jeweils für einen ausgewählten Monat verfügbar.", mediaExporting: "Fotosicherung wird vorbereitet …", mediaRestoring: "Fotos werden wiederhergestellt …", mediaInvalid: "Diese Fotosicherung konnte nicht gelesen werden. Wähle eine von Life Ledger exportierte .llmedia-Datei.",
      summary: "{scope} · {habits} Gewohnheiten · {days} Tage mit Einträgen · exportiert {date}", scopeAll: "Vollständige Sicherung", scopePartial: "Teilsicherung", legacy: "Früheres Sicherungsformat",
    },
    defaultHabits: {
      wake: "Früh aufstehen",
      move: "Tägliche Grundbewegung",
      protein: "Proteinzufuhr",
      strength: "Krafttraining",
      exercise: "Bewegung",
      reading: "Lesen",
      sleep2330: "Vor 23:30 Uhr schlafen",
      hydration: "Genug Wasser trinken",
      meditation: "Meditation",
      deepwork: "Deep Work",
      language: "Sprachen lernen",
    },
    units: { "分钟": "Min.", "克": "g", min: " Min.", L: " L", "05:00–06:00": "05:00–06:00" },
    weekdayNames: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
    dateChip: "{day}. {monthName} {year} · {weekday}",

"modules": {
      editLayout: "Karten bearbeiten",
      doneEditing: "Fertig",
      resetLayout: "Layout zurücksetzen",
      resetConfirm: "Modullayout für diese Ansicht zurücksetzen?",
      summary: "Tagesübersicht",
      habits: "Gewohnheiten",
      calendar: "Monatsübersicht",
      focus: "Fokuszeit",
      photos: "Fotoerinnerungen",
      reflection: "Tagesreflexion",
      context: "7-Tage-Rhythmus",
      completed: "Erledigte Tage",
      insights: "Wochen-Einblicke",
      goals: "Wochenziele",
      review: "Wochenrückblick",
      names: {
        summary: "Tagesübersicht",
        mood: "Stimmung", heatmap: "Gewohnheitsrhythmus", wall: "Fotowand", weather: "Wetter",
        habits: "Gewohnheiten",
        calendar: "Monatsübersicht",
        focus: "Fokuszeit",
        photos: "Fotoerinnerungen",
        reflection: "Tagesreflexion",
        context: "7-Tage-Rhythmus", dayplan: "Tagesplan",
        completed: "Erledigte Tage",
        insights: "Wochen-Einblicke",
        goals: "Wochenziele",
        review: "Wochenrückblick",
      },
      startFocus: "Fokus starten",
      startFocusShort: "Start",
      undo: "Rückgängig",
      undoAria: "Layoutänderung rückgängig machen",
      undoTitle: "Layout rückgängig (⌘Z)",
      sizeSmall: "Klein",
      sizeMedium: "Mittel",
      sizeLarge: "Groß · breit",
      sizeSquare: "Groß · quadratisch",
      sizeSelector: "Modulgröße",
      sizeAria: "Größe auf {size} festlegen",
      dragAria: "{name} durch Ziehen verschieben",
      dragHint: "Ziehen oder Pfeiltasten zum Verschieben",
      cancel: "Abbrechen",
      actionShow: "Einblenden",
      actionHide: "Ausblenden",
      show: "{name} einblenden",
      hide: "{name} ausblenden",
      timerSettings: "Timer-Einstellungen",
      timerShort: "Timer",
      writeReview: "Rückblick schreiben",
      collapse: "Modul einklappen",
      expand: "Modul ausklappen",
      editHint: "Ziehgriffe ziehen oder Alt+Auf/Ab drücken",
      up: "oben",
      down: "unten",
      movedDelta: "Um {step} nach {direction} verschoben, jetzt Position {pos} von {total}",
      moved: "An Position {pos} von {total} verschoben",
      dragHandle: "Ziehgriff für {name}",
      dragHint: "Mit Alt+Auf/Ab oder Ziehen neu anordnen",
      moveUp: "Modul nach oben verschieben",
      moveDown: "Modul nach unten verschieben",
      show: "Modul einblenden",
      hide: "Modul ausblenden",
      actionShow: "Einblenden",
      actionHide: "Ausblenden",
      hidden: "{name} ausgeblendet",
      visible: "{name} eingeblendet",
      hintTitle: "Board anpassen",
      hintDesc: "Ziehgriffe ziehen oder Alt+Auf/Ab nutzen, um Karten neu anzuordnen. Fertig zum Speichern anklicken.",
      dismissHint: "Verstanden",
      editEnabled: "Layout-Bearbeitungsmodus aktiviert",
      editDisabled: "Layout-Bearbeitungsmodus beendet",
    }
,
"submit": {
      saved: "Gespeichert",
      exported: "Exportiert",
      saving: "Speichert",
      exporting: "Exportiert",
      error: "Konnte nicht abgeschlossen werden.",
    }
,
"create": {
      label: "Neu",
      habit: "Neue Gewohnheit",
      journal: "Journal-Eintrag",
      weeklyGoal: "Wochenziel hinzufügen",
      focus: "Fokus starten",
    }
,
"settings": {
      title: "Einstellungen",
      general: "Allgemein",
      data: "Daten",
      cloud: "Cloud & Sync",
      calendar: "Kalender",
      habits: "Gewohnheiten",
      workspaceSwitch: "Arbeitsbereich wechseln",
      inspector: "Inspektor",
      motion: "Bewegung",
      motionFull: "Voll",
      motionReduced: "Reduziert",
      motionOff: "Aus",
      saved: "Gespeichert",
    }
,
"today": {
      summary: "{done} von {total} erledigt",
      completed: "Erledigt ({count})",
      streak: "{count} Tage in Folge",
      notScheduled: "Nicht geplant",
      notToday: "Nicht im Tagesscore",
      noHabits: "Heute keine Gewohnheiten",
      noSearch: "Keine passende Gewohnheit",
      noSearchHelp: "Anderes Wort versuchen oder die Suche leeren.",
      futureLocked: "Künftige Tage lassen sich noch nicht abhaken",
      morning: "Guten Morgen",
      evening: "Guten Abend",
      doneKicker: "Heute ist erledigt",
      allDone: "Alle Gewohnheiten für heute erledigt",
      allDoneHelp: "Reflektiere den Tag oder lass etwas Raum.",
      last7: "Letzte 7 Tage",
      open: "Offen",
      scheduled: "Geplant",
      reflect: "Heute reflektieren",
      tomorrow: "Morgen",
      tomorrowCount: "{count} Gewohnheiten morgen",
      reflectionLabel: "Reflexion",
      habits: "Gewohnheiten",
      reflection: "Reflexion",
      noReflection: "Noch keine Reflexion",
      showAllHabits: "Alle {count} anzeigen",
      contextConsistency: "7-Tage-Erfüllung",
      eventsCount: "{count} Termine",
      sidebarMore: "+{count} weitere",
    }
,
"widgets": {
      a11y: {
        summary: "{date}: {done} von {total}",
        habits: "{completed} erledigt, {open} offen",
      },
    }
,
"widget": {
      title: "Desktop-Widget",
      desc: "Zeigt die heutigen Gewohnheiten und den Fortschritt auf dem Mac-Schreibtisch und lässt dich eine direkt abhaken – ganz ohne die App zu öffnen. Das Widget zeigt niemals Tagebuchnotizen oder Stimmungsgründe. Hinzufügen: Rechtsklick auf den Schreibtisch, „Widgets bearbeiten“ wählen und nach „Life Ledger“ suchen.",
      connected: "Verbunden · zuletzt synchronisiert {time}",
      idle: "Noch nicht synchronisiert",
      error: "Synchronisierung fehlgeschlagen, wird automatisch wiederholt",
      justNow: "gerade eben",
      minutesAgo: "vor {minutes} Min.",
    }
,
"desktop": { statusLocal: "Lokaler Mac", statusCloud: "Verbundene Cloud" }
},
};

const dailyQuoteLibrary = {
  zh: [
    { text: "不积跬步，无以至千里。", source: "《荀子·劝学》" },
    { text: "千里之行，始于足下。", source: "《道德经》第六十四章" },
    { text: "吾日三省吾身。", source: "《论语·学而》" },
    { text: "行远自迩，登高自卑。", source: "《礼记·中庸》" },
    { text: "慎终如始，则无败事。", source: "《道德经》第六十四章" },
    { text: "及时当勉励，岁月不待人。", source: "陶渊明《杂诗》" },
    { text: "悟已往之不谏，知来者之可追。", source: "陶渊明《归去来兮辞》" },
  ],
  en: [
    { text: "Well done is better than well said.", source: "Benjamin Franklin, Poor Richard's Almanack" },
    { text: "Lost time is never found again.", source: "Benjamin Franklin, Poor Richard's Almanack" },
    { text: "No man is free who is not master of himself.", source: "Epictetus, Discourses" },
    { text: "Begin at once to live, and count each separate day as a separate life.", source: "Seneca, Letters to Lucilius" },
    { text: "The impediment to action advances action. What stands in the way becomes the way.", source: "Marcus Aurelius, Meditations 5.20" },
    { text: "Great things are done by a series of small things brought together.", source: "Vincent van Gogh, letter to Theo van Gogh" },
    { text: "Nothing is worth more than this day.", source: "Johann Wolfgang von Goethe, Maxims and Reflections" },
  ],
  de: [
    { text: "Es ist nicht genug zu wissen, man muss auch anwenden; es ist nicht genug zu wollen, man muss auch tun.", source: "Johann Wolfgang von Goethe, Wilhelm Meisters Wanderjahre" },
    { text: "Es irrt der Mensch, solang er strebt.", source: "Johann Wolfgang von Goethe, Faust I" },
    { text: "Habe Mut, dich deines eigenen Verstandes zu bedienen.", source: "Immanuel Kant, Beantwortung der Frage: Was ist Aufklärung?" },
    { text: "Was mich nicht umbringt, macht mich stärker.", source: "Friedrich Nietzsche, Götzen-Dämmerung" },
    { text: "Der Mensch ist nur da ganz Mensch, wo er spielt.", source: "Friedrich Schiller, Über die ästhetische Erziehung des Menschen" },
    { text: "Du musst dein Leben ändern.", source: "Rainer Maria Rilke, Archaischer Torso Apollos" },
    { text: "Man muss noch Chaos in sich haben, um einen tanzenden Stern gebären zu können.", source: "Friedrich Nietzsche, Also sprach Zarathustra" },
  ],
};

const monthNames = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
};
const supportedLanguages = ["en", "de", "zh"];
const requestedLanguage = new URLSearchParams(location.search).get("lang");
const storedLanguage = localStorage.getItem(LANGUAGE_KEY);
let currentLang = supportedLanguages.includes(requestedLanguage)
  ? requestedLanguage
  : localStorage.getItem(LANGUAGE_PREFERENCE_KEY) === "true" && supportedLanguages.includes(storedLanguage)
    ? storedLanguage
    : "en";
const cloneData = value => typeof structuredClone === "function"
  ? structuredClone(value)
  : JSON.parse(JSON.stringify(value));
const createId = () => globalThis.crypto?.randomUUID?.()
  || `ledger-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
const tr = (path, vars = {}) => {
  const value = path.split(".").reduce((node, key) => node?.[key], i18n[currentLang]) ?? path.split(".").reduce((node, key) => node?.[key], i18n.zh) ?? path;
  return typeof value === "string" ? value.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "") : value;
};

const seedEffectiveDate = (() => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
})();

const seed = {
  habits: [
    { id: "exercise", name: "Exercise", icon: "running", color: "coral", active: true, versions: [{ trackingMode: "measured", target: 30, unit: "min", frequency: "daily", scheduleTime: "", periodTarget: null, countsTowardDaily: true, effectiveDate: seedEffectiveDate }] },
    { id: "reading", name: "Reading", icon: "book", color: "amber", active: true, versions: [{ trackingMode: "measured", target: 20, unit: "min", frequency: "daily", scheduleTime: "", periodTarget: null, countsTowardDaily: true, effectiveDate: seedEffectiveDate }] },
    { id: "sleep2330", name: "Sleep before 23:30", icon: "bed", color: "blue", active: true, versions: [{ trackingMode: "check", target: 1, unit: "", frequency: "daily", scheduleTime: "23:30", periodTarget: null, countsTowardDaily: true, effectiveDate: seedEffectiveDate }] },
    { id: "hydration", name: "Drink enough water", icon: "droplets", color: "cyan", active: true, versions: [{ trackingMode: "measured", target: 2, unit: "L", frequency: "daily", scheduleTime: "", periodTarget: null, countsTowardDaily: true, effectiveDate: seedEffectiveDate }] },
    { id: "meditation", name: "Meditation", icon: "brain", color: "violet", active: true, versions: [{ trackingMode: "measured", target: 10, unit: "min", frequency: "daily", scheduleTime: "", periodTarget: null, countsTowardDaily: true, effectiveDate: seedEffectiveDate }] },
    { id: "deepwork", name: "Deep work", icon: "timer", color: "sage", active: true, versions: [{ trackingMode: "measured", target: 60, unit: "min", frequency: "daily", scheduleTime: "", periodTarget: null, countsTowardDaily: true, effectiveDate: seedEffectiveDate }] },
    { id: "language", name: "Language learning", icon: "pen", color: "amber", active: true, versions: [{ trackingMode: "measured", target: 20, unit: "min", frequency: "daily", scheduleTime: "", periodTarget: null, countsTowardDaily: true, effectiveDate: seedEffectiveDate }] },
    { id: "strength", name: "Strength training", icon: "dumbbell", color: "coral", active: true, versions: [{ trackingMode: "measured", target: 30, unit: "min", frequency: "weekly", scheduleTime: "", periodTarget: 3, weeklyTarget: 3, countsTowardDaily: false, effectiveDate: seedEffectiveDate }] },
  ],
  logs: {},
  reviews: {},
  dailyGoals: {},
  weeklyGoals: {},
  longTermGoals: [],
  weeklyOutputs: {},
  weeklyReviews: {},
  focusSessions: [],
  focusSettings: { preset: "classic", focusMinutes: 25, breakMinutes: 5, defaultTopic: "", sound: true, notify: true, wakeLock: true },
};

const STARTER_PACK_VERSION = 2;
const LEGACY_STARTER_HABIT_IDS = new Set(["wake", "move", "protein", "strength"]);
const CURRENT_STARTER_HABIT_IDS = new Set(seed.habits.map(habit => habit.id));

let state = loadState();
let cursor = new Date();
cursor.setHours(12, 0, 0, 0);
let selectedDate = isoDate(cursor);
let selectedPlanningDate = isoDate(cursor);
let editingHabitId = null;
let selectedReviewWeek = isoWeekKey(new Date());
let focusReviewScope = "week";
let selectedFocusReviewMonth = monthKey(new Date());
let selectedWorkspaceWeek = isoWeekKey(new Date());
let goalHorizon = "week";
let editingLongTermGoalId = null;
let dayPlanRoutinesExpanded = false;
let selectedAnalyticsHabitIds = [];
let analyticsChartType = "line";
let calendarViewMode = localStorage.getItem(CALENDAR_VIEW_KEY) === "heatmap" ? "heatmap" : "mood";
const cloudBaseConfigured = Boolean(window.LifeLedgerCloudBase?.deploymentConfig().configured);
const previewName = DEMO_PREVIEW_SLUG;
const dayPlanPrototype = previewName === "day-plan-calendar-v1";
const searchParams = new URLSearchParams(location.search);
const requestedMode = searchParams.get("mode");
const desktopMode = searchParams.get("desktop");
const desktopBridge = desktopMode === "tauri-local" ? window.LifeLedgerDesktopBridge : null;
// Confirmation / notice: the Mac app injects native sheets (window.appConfirm/appAlert) before this script runs;
// the browser keeps its own dialogs.
window.appConfirm ||= message => Promise.resolve(window.confirm(message));
window.appAlert ||= message => Promise.resolve(window.alert(message));
const desktopNativeBackup = Boolean(desktopBridge?.saveBackupJson && desktopBridge?.openBackupJson);
const deploymentMode = requestedMode === "local" || requestedMode === "cloudflare"
  ? requestedMode
  : window.LIFE_LEDGER_DEPLOYMENT_MODE || "local";
const hostedCloudMode = deploymentMode === "cloudflare";
const cloudProvider = cloudBaseConfigured ? "cloudbase" : hostedCloudMode ? "cloudflare" : "local";
// Photos: cloud edition → private R2 storage; local web edition + Mac app → this device's IndexedDB (user 10/27).
const photosEnabled = hostedCloudMode || cloudProvider === "local";
let cloudMode = cloudProvider !== "local";
let cloudBaseAdapter = cloudBaseConfigured ? window.LifeLedgerCloudBase.createAdapter() : null;
let cloudTimer = null;
let cloudRetryTimer = null;
let authExpired = false;
let cloudBaseLoginState = null;
let deferredInstallPrompt = null;
let themeChoice = ["system", "light", "dark"].includes(localStorage.getItem(THEME_KEY)) ? localStorage.getItem(THEME_KEY) : "system";
let sidebarCollapsed = localStorage.getItem(SIDEBAR_KEY) === "true";
let reminderSettings = loadReminderSettings();
let reminderTimer = null;
let focusTimer = null;
let voiceReflection = null;
let photoMemories = null;
const calendarPhotosByDate = new Map();
const calendarPhotoLoadedMonths = new Set();
const calendarPhotoLoadingMonths = new Set();
let timelineCursor = new Date();
timelineCursor.setDate(1);
timelineCursor.setHours(12, 0, 0, 0);
let timelineRenderVersion = 0;
let googleCalendar = {
  configured: false,
  connected: false,
  hideRecurring: true,
  accounts: [],
  lastSyncedAt: 0,
  stale: false,
};
const googleCalendarEvents = new Map();
const googleCalendarLoadedMonths = new Set();
const googleCalendarLoadingMonths = new Set();
let focusWakeLock = null;
let focusAudioContext = null;
let pendingImport = null;
let pendingMediaImport = null;
let pendingMoodDate = null;
let pendingMood = "";
let persistenceRequested = false;
let mobileToolbarOpen = false;
let demoLanguageSynced = null; // reconcile once on boot too (a stale stored tag stranded old-language text)
const HABITS_PER_PAGE = 4;
let todayHabitPage = 0;
let habitCarouselScrollFrame = 0;
let dailyToolPage = "journal";
let dailyToolScrollFrame = 0;
let habitCarouselDrag = null;
let suppressHabitCardClick = false;
let habitDrag = null;
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
function weekdayName(day) { return i18n[currentLang].weekdayNames[day]; }
function weekdayShortName(day) {
  const name = weekdayName(day);
  return currentLang === "zh" ? name.replace(/^星期/, "周") : name.slice(0, 3);
}
function monthName(monthIndex) { return monthNames[currentLang]?.[monthIndex] || String(monthIndex + 1); }
function formatDateChip(date) {
  return tr("dateChip", { year: date.getFullYear(), month: date.getMonth() + 1, monthName: monthName(date.getMonth()), day: date.getDate(), weekday: weekdayName(date.getDay()) });
}
// Built-in habits are shown in the UI language until the user renames them.
function displayHabitName(habit) {
  const local = i18n[currentLang].defaultHabits[habit.id];
  if (!local) return habit.name;
  const isDefaultName = !habit.name || Object.values(i18n).some(lang => lang.defaultHabits?.[habit.id] === habit.name);
  return isDefaultName ? local : habit.name;
}
function displayUnit(unit) { return i18n[currentLang].units[unit] || unit; }
function moodLabel(mood) { return i18n[currentLang].mood.values[mood] || mood; }
function iconKey(habit) { return iconCatalog[habit.icon] ? habit.icon : (defaultHabitIcons[habit.id] || "target"); }
function renderIcon(value, className = "") {
  const key = iconCatalog[value] ? value : "target";
  return `<svg class="lucide-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconCatalog[key]}</svg>`;
}
function setText(selector, value) { const el = $(selector); if (el) el.textContent = value; }
function setPlaceholder(selector, value) { const el = $(selector); if (el) el.placeholder = value; }
function setAria(selector, value) { const el = $(selector); if (el) el.setAttribute("aria-label", value); }
function languageText(zh, en, de) { return currentLang === "zh" ? zh : currentLang === "de" ? de : en; }
// "慎终如始，则无败事。——《道德经》" → { text, source }; the source part is optional.
function parseCustomQuotes(raw) {
  return String(raw || "").split(/\n+/).map(line => line.trim()).filter(Boolean).slice(0, 100).map(line => {
    const m = /^(.*?)\s*(?:——|—|--)\s*(.+)$/.exec(line);
    return m && m[1] ? { text: m[1].trim().slice(0, 300), source: m[2].trim().slice(0, 120) } : { text: line.slice(0, 300), source: "" };
  });
}
function customQuotes() {
  const q = state?.quoteSettings;
  return q?.mode === "custom" && Array.isArray(q.items) ? q.items.filter(item => item && String(item.text || "").trim()) : [];
}
function quoteFor(slot = 0) {
  const custom = customQuotes();
  const library = custom.length ? custom : dailyQuoteLibrary[currentLang] || dailyQuoteLibrary.en;
  const now = new Date();
  const dayNumber = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  return library[(dayNumber + slot) % library.length];
}
function applyTheme() {
  const resolved = themeChoice === "system" ? (systemTheme.matches ? "dark" : "light") : themeChoice;
  document.documentElement.dataset.theme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolved === "dark" ? "#17191d" : "#f5f5f7");
  if ($("#themeSelect")) $("#themeSelect").value = themeChoice;
  setText("#themeCurrentIcon", { system: "◐", light: "☀", dark: "☾" }[themeChoice]);
}
function applySidebarState() {
  document.body.classList.toggle("sidebar-collapsed", sidebarCollapsed);
  const button = $("#sidebarToggle");
  if (!button) return;
  const label = sidebarCollapsed
    ? languageText("展开侧边栏", "Expand sidebar", "Seitenleiste öffnen")
    : languageText("收起侧边栏", "Collapse sidebar", "Seitenleiste schließen");
  button.setAttribute("aria-label", label);
  button.setAttribute("title", label);
  button.setAttribute("aria-expanded", String(!sidebarCollapsed));
}
function applyLanguage() {
  document.documentElement.lang = i18n[currentLang].locale;
  document.body.dataset.language = currentLang;
  document.title = tr("title");
  document.querySelector('meta[name="description"]')?.setAttribute("content", tr("metaDescription"));
  setText(".brand strong", tr("brand"));
  setText(".brand small", tr("brandSmall"));
  $(".brand")?.setAttribute("aria-label", tr("brand"));
  $$(".nav-item").forEach(button => {
    const icon = $(".nav-icon", button)?.textContent || "";
    const full = tr(`nav.${button.dataset.view}`), short = currentLang === "de" && button.dataset.view === "habits" ? "Gewohnh." : "";
    button.innerHTML = `<span class="nav-icon">${icon}</span><span class="nav-label">${short ? `<span class="nav-label-full">${full}</span><span class="nav-label-short" aria-hidden="true">${short}</span>` : full}</span>`;
    button.setAttribute("title", tr(`nav.${button.dataset.view}`));
  });
  setAria(".main-nav", languageText("主导航", "Main navigation", "Hauptnavigation"));
  setText(".sidebar-note p", "");
  const note = $(".sidebar-note p");
  const sidebarQuote = quoteFor(1);
  if (note) note.innerHTML = `${escapeHtml(sidebarQuote.text)}${sidebarQuote.source ? `<small>${escapeHtml(sidebarQuote.source)}</small>` : ""}`;
  setText(".profile strong", getDeviceProfile().name || (demoWorkspaceApi()?.isDemoActive(state) ? languageText("于朦胧", "Alan", "Alan") : tr("profileName")));
  renderDeviceProfile();
  $("#exportButton")?.setAttribute("title", tr("exportTitle"));
  $("#exportButton")?.setAttribute("aria-label", tr("exportTitle"));
  setAria("#cloudAccountButton", tr("cloudbase.account"));
  $("#cloudAccountButton")?.setAttribute("title", tr("cloudbase.account"));
  $$('[data-install-app]').forEach(button => {
    button.setAttribute("title", deferredInstallPrompt ? tr("pwa.ready") : tr("pwa.install"));
    button.setAttribute("aria-label", tr("pwa.install"));
  });
  setText("#settingsInstallLabel", tr("pwa.install"));
  setText("#settingsInstallHelp", languageText("放到桌面或主屏幕，像应用一样打开", "Add it to your desktop or home screen and open it like an app", "Auf Desktop oder Home-Bildschirm legen und wie eine App öffnen"));
  const languageSelect = $("#languageSelect");
  const languageFlag = $("#languageFlag");
  if (languageSelect) languageSelect.value = currentLang;
  if (languageFlag) languageFlag.textContent = currentLang === "zh" ? "🇨🇳" : currentLang === "de" ? "🇩🇪" : "🇬🇧";
  setAria("#languageSelect", currentLang === "zh" ? "选择界面语言" : currentLang === "de" ? "Sprache der Oberfläche wählen" : "Select interface language");
  const activeView = $(".nav-item.active")?.dataset.view || "today";
  document.body.dataset.activeView = activeView;
  setText("#viewTitle", tr(`viewTitles.${activeView}`));
  setText(".date-jump span:first-of-type", tr("yearSuffix"));
  setText(".date-jump span:last-of-type", tr("monthSuffix"));
  setAria("#yearSelect", languageText("选择年份", "Select year", "Jahr wählen"));
  setAria("#monthSelect", languageText("选择月份", "Select month", "Monat wählen"));
  setText("#todayButton", tr("todayButton"));
  setText("#mobileToolbarLabel", tr("toolbar.short"));
  setAria("#mobileToolbarToggle", mobileToolbarOpen ? tr("toolbar.close") : tr("toolbar.open"));
  const heroQuote = quoteFor(0);
  setText(".hero-copy h2", heroQuote.text);
  setText(".quote-source", heroQuote.source);
  setText(".progress-orbit-label", tr("hero.progress"));
  setText(".mood-card .kicker", tr("mood.kicker"));
  setText(".mood-card h3", tr("mood.title"));
  applyMoodReasonLanguage();
  photoMemories?.setLanguage(currentLang);
  $$("#quickMood button, #drawerMood button").forEach(button => {
    button.innerHTML = `<span class="mood-option-icon mood-${button.dataset.mood === "低落" ? "low" : button.dataset.mood === "平静" ? "calm" : "good"}">${moodCalendarIcon(button.dataset.mood)}</span>${moodLabel(button.dataset.mood)}`;
  });
  setText("#timelineKicker", tr("timeline.kicker"));
  setText("#timelineTitle", tr("timeline.title"));
  setText("#timelineDescription", tr("timeline.description"));
  setAria("#timelinePreviousMonth", tr("timeline.previous"));
  setAria("#timelineNextMonth", tr("timeline.next"));
  setText(".habits-heading .kicker", tr("foundations.kicker"));
  setText(".habits-heading h2", tr("foundations.title"));
  const settingsButton = $("[data-open-settings]");
  if (settingsButton) settingsButton.innerHTML = `${tr("foundations.adjust")} <span>→</span>`;
  setAria("#todayHabitCarousel", tr("foundations.carousel"));
  setAria("#todayHabitViewport", tr("foundations.carousel"));
  setAria("#habitCarouselNav", tr("foundations.carousel"));
  setAria("#previousHabitPage", tr("foundations.previousPage"));
  setAria("#nextHabitPage", tr("foundations.nextPage"));
  applyFocusLanguage();
  setText('[data-plan="selected-day"] .kicker', tr("todayGoals.kicker"));
  setText('[data-plan="selected-day"] .daily-goals-heading h3', tr("todayGoals.title"));
  setText('[data-plan="selected-day"] .daily-goals-heading p', tr("todayGoals.desc"));
  setAria("#previousPlanDay", tr("todayGoals.previous"));
  setAria("#nextPlanDay", tr("todayGoals.next"));
  setText("#openDayPlan span", tr("dayPlan.open"));
  setAria("#openDayPlan", tr("dayPlan.open"));
  setText("#dayPlanDialogKicker", tr("todayGoals.kicker"));
  setText("#dayPlanDialogScheduleTitle", tr("dayPlan.schedule"));
  setText("#drawerScheduleTitle", tr("dayPlan.schedule"));
  setAria(".close-day-plan", tr("dayPlan.close"));
  applyCalendarLanguage();
  setText(".daily-journal-card .kicker", tr("journal.kicker"));
  setText(".daily-journal-card h3", tr("journal.title"));
  setText(".daily-journal-card .daily-goals-heading p", tr("journal.desc"));
  setText("#homeJournalSave", tr("journal.autosaved"));
  setPlaceholder("#homeDayNote", tr("journal.placeholder"));
  setText("#journalToolTab span", tr("journal.tabReflection"));
  setText("#focusToolTab span", tr("journal.tabFocus"));
  setAria("#dailyToolTabs", tr("journal.switchAria"));
  setAria('#dailyToolTabs [data-daily-tool="journal"]', tr("journal.showReflection"));
  setAria('#dailyToolTabs [data-daily-tool="focus"]', tr("journal.showFocus"));
  setAria('[data-daily-tool-page="journal"]', tr("journal.showReflection"));
  setAria('[data-daily-tool-page="focus"]', tr("journal.showFocus"));
  setAria(".daily-tool-pagination", tr("journal.switchAria"));
  setText(".calendar-toolbar .kicker", tr("calendar.kicker"));
  setText(".calendar-toolbar p", tr("calendar.desc"));
  setAria("#prevMonth", tr("calendar.prev"));
  setAria("#nextMonth", tr("calendar.next"));
  setAria("#calendarViewSwitch", tr("calendar.viewMode"));
  setText('[data-calendar-view="mood"] span', tr("calendar.viewMood"));
  setText('[data-calendar-view="heatmap"] span', tr("calendar.viewHeatmap"));
  const weekdayRow = $(".weekdays");
  if (weekdayRow) weekdayRow.innerHTML = i18n[currentLang].calendar.weekdays.map(day => `<span>${day}</span>`).join("");
  renderCalendarLegend();
  setText("#weeklyWorkspaceTitle", tr("week.title"));
  setAria("#previousWorkspaceWeek", tr("week.previous"));
  setAria("#nextWorkspaceWeek", tr("week.next"));
  setText(".weekly-card-heading .kicker", tr("week.checklist"));
  setText(".weekly-card-heading h3", tr("week.goalsTitle"));
  setText('[data-goal-horizon="week"]', tr("longTerm.tabWeek"));
  setText('[data-goal-horizon="long"]', tr("longTerm.tabLong"));
  setAria("#goalHorizonSwitch", languageText("目标周期", "Goal horizon", "Zielhorizont"));
  setText("#longTermKicker", tr("longTerm.kicker"));
  setText("#longTermTitle", tr("longTerm.title"));
  setText("#longTermDescription", tr("longTerm.description"));
  setText("#addLongTermGoal b", tr("longTerm.add"));
  setText("#longTermDialogKicker", tr("longTerm.dialogKicker"));
  setText("#longTermNameLabel", tr("longTerm.name"));
  setText("#longTermNextLabel", tr("longTerm.next"));
  setText("#longTermReviewLabel", tr("longTerm.review"));
  setText("#longTermStatusLabel", tr("longTerm.status"));
  setText('#longTermGoalForm option[value="active"]', tr("longTerm.active"));
  setText('#longTermGoalForm option[value="paused"]', tr("longTerm.paused"));
  setText('#longTermGoalForm option[value="completed"]', tr("longTerm.completed"));
  setText("#deleteLongTermGoal", tr("longTerm.delete"));
  setText("#longTermGoalForm .secondary-button", tr("longTerm.cancel"));
  setText("#saveLongTermGoal", tr("longTerm.save"));
  setText(".weekly-writing-heading .kicker", tr("week.outputKicker"));
  setText(".weekly-writing-heading h3", tr("week.outputTitle"));
  setText(".weekly-writing-heading .autosave", tr("week.autosave"));
  setPlaceholder("#weeklyOutputText", tr("week.outputPlaceholder"));
  const weeklyFooter = $(".weekly-writing-panel footer span:last-child");
  if (weeklyFooter) weeklyFooter.textContent = tr("week.savedToWeek");
  setText(".chart-panel .kicker", languageText("节奏", "RHYTHM", "RHYTHMUS"));
  setText(".chart-panel h3", tr("review.rhythm"));
  setText(".chart-panel .panel-meta", tr("review.byDate"));
  setText(".resistance-panel .kicker", tr("review.analyticsKicker"));
  setText(".resistance-panel h3", tr("review.analyticsTitle"));
  setText("#analyticsMetricLabel", tr("review.selectMetrics"));
  setText("#addPeriodTarget", tr("review.addMetric"));
  setText('[data-analytics-chart="line"]', tr("review.lineView"));
  setText('[data-analytics-chart="bar"]', tr("review.barView"));
  setAria("#analyticsChartMode", tr("review.chartType"));
  setText(".monthly-reflection-panel .kicker", languageText("月度感想", "MONTHLY REFLECTION", "MONATSREFLEXION"));
  setText(".monthly-reflection-panel h3", tr("review.reflection"));
  setText(".monthly-reflection-panel .autosave", tr("week.autosave"));
  setPlaceholder("#reviewText", tr("review.placeholder"));
  setText(".settings-intro .kicker", languageText("习惯", "HABITS", "GEWOHNHEITEN"));
  setText("#addHabitButton", tr("habits.add"));
  applyDialogLanguage();
  setText("#saveState", tr("drawer.saveIdle"));
  setText("#completeDay", tr("drawer.complete"));
  setAria("#closeDrawer", tr("drawer.close"));
  setText(".drawer-content section:nth-child(1) .drawer-section-title h3", tr("drawer.goalTitle"));
  setText(".drawer-content section:nth-child(2) .drawer-section-title h3", tr("dayPlan.schedule"));
  setText(".drawer-content section:nth-child(3) .drawer-section-title h3", tr("drawer.moodTitle"));
  setText('label[for="dayNote"] h3', tr("drawer.noteTitle"));
  setText('label[for="dayNote"] span', tr("drawer.markdown"));
  const drawerDate = parseDate(selectedDate);
  setText("#drawerWeekday", weekdayName(drawerDate.getDay()).toUpperCase());
  setText("#drawerDate", formatDateChip(drawerDate));
  setPlaceholder("#dayNote", tr("drawer.notePlaceholder"));
  setText("#toast p", tr("toast.saved"));
  $("#themeControl")?.setAttribute("aria-label", tr("theme.label"));
  setAria("#themeSelect", tr("theme.label"));
  const themeSelect = $("#themeSelect");
  if (themeSelect) {
    themeSelect.options[0].textContent = tr("theme.system");
    themeSelect.options[1].textContent = tr("theme.light");
    themeSelect.options[2].textContent = tr("theme.dark");
    const fontOptions = $("#fontSelect")?.options;
    if (fontOptions) {
      setAria("#fontSelect", languageText("字体", "Font", "Schrift"));
      fontOptions[0].textContent = languageText("苹方 / SF", "SF Pro", "SF Pro");
      fontOptions[1].textContent = languageText("圆体", "SF Rounded", "SF Rounded");
      fontOptions[2].textContent = languageText("宋体 / New York", "New York", "New York");
    }
  }
  setText("#exportDialogTitle", tr("export.title"));
  setText("#backupKicker", tr("backup.kicker"));
  setText("#backupIntroTitle", tr("backup.introTitle"));
  setText("#backupIntroHelp", tr("backup.introHelp"));
  setAria(".backup-tabs", tr("backup.tabsAria"));
  setText("#backupExportTab", tr("backup.tabExport"));
  setText("#backupImportTab", tr("backup.tabImport"));
  setText("#exportSectionTitle", tr("backup.exportTitle"));
  setText("#exportSectionHelp", tr("backup.exportHelp"));
  setText("#restoreSectionTitle", tr("backup.restoreTitle"));
  setText("#restoreSectionHelp", tr("backup.restoreHelp"));
  setText("#chooseImportTitle", tr("backup.chooseTitle"));
  setText("#chooseImportHelp", tr("backup.chooseHelp"));
  setText("#clearImportFile", tr("backup.reselect"));
  setText("#restoreImport", tr("backup.restore"));
  setText("#importSafetyNote", tr("backup.safety"));
  setText("#undoRestore", tr("backup.undo"));
  setText("#mediaBackupTitle", tr("backup.mediaTitle"));
  setText("#mediaBackupHelp", tr("backup.mediaHelp"));
  setText("#exportAllTitle", tr("export.all"));
  setText("#exportAllHelp", tr("export.allHelp"));
  setText("#exportMonthTitle", tr("export.month"));
  setText("#exportMonthHelp", tr("export.monthHelp"));
  setText("#exportWeekTitle", tr("export.week"));
  setText("#exportWeekHelp", tr("export.weekHelp"));
  setText("#exportDayTitle", tr("export.day"));
  setText("#exportDayHelp", tr("export.dayHelp"));
  setText("#exportCancel", tr("export.cancel"));
  setText("#exportConfirm", tr("export.confirm"));
  setText("#celebrationText", tr("celebration"));
  applyCloudBaseLanguage();
  applyReminderLanguage();
  applyTheme();
  applySidebarState();
  renderIconPicker();
  setSaveMode(cloudMode ? "cloud" : "", cloudMode ? tr("save.cloudSaved") : tr("save.localPreview"));
  if (isDemoWorkspaceActive() && demoLanguageSynced !== currentLang) {
    const api = demoWorkspaceApi();
    if (api) {
      state = api.relocalizeDemoWorkspace(state, currentLang);
      demoLanguageSynced = currentLang;
      saveState({ skipCloud: true });
    }
  }
  applyStaticLanguage();
  syncJournalMonthOptions();
}
// Strings that are created once (static HTML, one-off widgets) and so are missed by the page renderers.
function applyStaticLanguage() {
  const L = languageText, each = (sel, fn) => $$(sel).forEach(fn);
  setAria(".daily-planning-grid", L("今日日程与复盘", "Daily calendar and reflection", "Tagesplan und Reflexion"));
  setAria("#weekCalendar", L("周日历", "Week calendar", "Wochenkalender"));
  setAria("#weekAgenda", L("本周日程", "Week agenda", "Wochenagenda"));
  setAria("#weeklyGoalInput", L("添加本周目标", "Add weekly goal", "Wochenziel hinzufügen"));
  setAria("#habitLibraryOverview", L("习惯概览", "Habit overview", "Gewohnheiten im Überblick"));
  setAria(".habit-settings-table", L("习惯列表", "Habits", "Gewohnheiten"));
  setAria("#habitStreakCalendar", L("连续记录", "Habit streak", "Serie"));
  setAria("#timelineFilter", L("时间轴筛选", "Timeline filter", "Zeitleisten-Filter"));
  setAria("#timelineEntryList", L("时间轴条目", "Timeline entries", "Einträge"));
  setAria("#timelineDetail", L("条目详情", "Entry detail", "Eintrag"));
  setAria("#journalFeedPane", L("时间轴", "Timeline", "Zeitleiste"));
  setAria("#reviewTrendChart", L("本月每天的完成率", "Completion, day by day", "Erfüllung Tag für Tag"));
  setAria("#focusPresetGroup", L("计时长度", "Timer length", "Timerlänge"));
  setAria("#longTermGoalForm header button[aria-label]", L("关闭", "Close", "Schließen"));
  // timeline calendar repeats the Today calendar controls
  setAria("#journalCalendarViewSwitch", tr("calendar.viewMode"));
  each('#journalCalendarViewSwitch [data-calendar-view="mood"] span', n => { n.textContent = tr("calendar.viewMood"); });
  each('#journalCalendarViewSwitch [data-calendar-view="heatmap"] span', n => { n.textContent = tr("calendar.viewHeatmap"); });
  setAria("#journalPrevMonth", tr("calendar.prev")); setAria("#journalNextMonth", tr("calendar.next"));
  each(".weekdays", row => [...row.children].forEach((n, i) => { n.textContent = i18n[currentLang].calendar.weekdays[i]; }));
  // settings dialog
  const settingsLabel = L("设置", "Settings", "Einstellungen");
  setAria("#settingsButton", settingsLabel); $("#settingsButton")?.setAttribute("title", settingsLabel);
  setAria("#settingsDialog .close-settings", L("关闭", "Close", "Schließen"));
  setText("#settingsFontPreview", L("不积跬步，无以至千里。 Aa 123", "Small steady steps. Aa 123", "Kleine, stetige Schritte. Aa 123"));
  // dictation buttons + week module collapse
  each(".field-voice-button:not(.is-listening)", b => { b.querySelector("span").textContent = L("语音输入", "Dictate", "Diktieren"); b.setAttribute("aria-label", L("语音输入", "Dictate", "Diktieren")); });
  each("#weekView .module-card[data-module] .module-collapse-toggle", t => t.setAttribute("aria-label", t.closest(".module-card").classList.contains("is-collapsed") ? L("展开", "Expand", "Ausklappen") : L("收起", "Collapse", "Einklappen")));
  // habit inspector form: its values were filled once in the old language
  if (selectedHabitSettingsId && $("#habitInspectorForm") && !$("#habitInspectorForm").dataset.dirty) populateHabitInspectorForm(selectedHabitSettingsId);
  // focus label falls back to the sample's default topic, which is localized with the sample
  setText("#focusInlineLabel", focusTimer?.snapshot?.()?.label || state.focusSettings?.defaultTopic || tr("focus.untitled"));
}
function applyFocusLanguage() {
  setText("#focusOverviewKicker", tr("focus.kicker"));
  setText("#focusOverviewTitle", tr("focus.overviewTitle"));
  setText("#focusOverviewHint", tr("focus.overviewHint"));
  setText("#focusSettingsLabel", tr("focus.settings"));
  setAria("#openFocusTimer", tr("focus.settings"));
  setAria("#focusQuickPresets", tr("focus.presetSummary", { focus: 25, break: 5 }));
  setText("#focusDialogKicker", tr("focus.dialogKicker"));
  setText("#focusDialogTitle", tr("focus.dialogTitle"));
  setText("#focusCustomLabelText", tr("focus.customLabel"));
  setPlaceholder("#focusCustomLabel", tr("focus.customPlaceholder"));
  setText("#focusCustomPresetLabel", tr("focus.custom"));
  setText("#focusMinutesLabel", tr("focus.focusMinutes"));
  setText("#focusBreakMinutesLabel", tr("focus.breakMinutes"));
  setText("#focusSoundLabel", tr("focus.sound"));
  setText("#focusNotifyLabel", tr("focus.notify"));
  setText("#focusWakeLockLabel", tr("focus.wakeLock"));
  setText("#focusFinish", tr("focus.finish"));
  setText("#focusInterrupt", tr("focus.interrupt"));
  setText("#focusSkipBreak", tr("focus.skipBreak"));
  setText("#focusCaveat", tr("focus.caveat"));
  setAria(".close-focus-dialog", tr("focus.close"));
  setText("#focusReviewKicker", tr("focus.reviewKicker"));
  setText("#focusReviewTitle", tr("focus.reviewTitle"));
  setText("#focusReviewWeekLabel", tr("focus.reviewWeek"));
  setText("#focusReviewMonthLabel", tr("focus.reviewMonth"));
  setAria("#focusReviewScope", tr("focus.reviewScope"));
  $$('[data-focus-review-scope]').forEach(button => { button.textContent = tr(`focus.${button.dataset.focusReviewScope === "week" ? "scopeWeek" : "scopeMonth"}`); });
  setText("#focusReviewUnit", tr("focus.reviewUnit"));
  setAria("#focusReviewBars", tr("focus.reviewChart"));
  renderFocusOverview();
  renderFocusTimer(focusTimer?.snapshot() || null);
}
function applyCloudBaseLanguage() {
  setText("#cloudbaseAuthKicker", tr("cloudbase.kicker"));
  setText("#cloudbaseAuthTitle", tr("cloudbase.title"));
  setText("#cloudbaseAuthIntro", tr("cloudbase.intro"));
  setText("#cloudbaseEmailLabel", tr("cloudbase.email"));
  setText("#cloudbaseCodeLabel", tr("cloudbase.code"));
  setPlaceholder("#cloudbaseCode", tr("cloudbase.codePlaceholder"));
  setText("#cloudbaseSendCode", tr("cloudbase.send"));
  setText("#cloudbaseAuthNote", tr("cloudbase.note"));
  setText("#cloudbaseAuthCancel", tr("cloudbase.later"));
  setText("#cloudbaseAuthConfirm", tr("cloudbase.confirm"));
  setText("#cloudbaseSignOut", tr("cloudbase.signOut"));
  setAria(".close-cloudbase-auth", tr("cloudbase.close"));
}
function applyDialogLanguage() {
  setText("#habitForm header .kicker", tr("dialog.kicker"));
  setAria(".close-habit-dialog", tr("dialog.close"));
  setText("#habitNameLabel", tr("dialog.name"));
  setText("#habitNoteLabel", tr("dialog.note"));
  setPlaceholder('#habitForm textarea[name="note"]', tr("dialog.notePlaceholder"));
  setText("#habitTrackingModeLabel", tr("dialog.trackingMode"));
  setText("#habitTrackingCheckLabel", tr("dialog.trackingCheck"));
  setText("#habitTrackingCheckHelp", tr("dialog.trackingCheckHelp"));
  setText("#habitTrackingMeasuredLabel", tr("dialog.trackingMeasured"));
  setText("#habitTrackingMeasuredHelp", tr("dialog.trackingMeasuredHelp"));
  setText("#habitIconLabel", tr("dialog.icon"));
  setText("#habitColorLabel", tr("dialog.color"));
  setText("#habitTargetLabel", tr("dialog.target"));
  setText("#habitUnitLabel", tr("dialog.unit"));
  setText("#habitFrequencyLabel", tr("dialog.frequency"));
  setText("#habitScheduleLabel", tr("dialog.schedule"));
  setText("#habitPeriodTargetLabel", tr("dialog.periodTarget"));
  setText("#habitEffectiveDateLabel", tr("dialog.effectiveDate"));
  setText("#habitPreviewKicker", tr("dialog.preview"));
  setAria("#iconPickerPopover", tr("dialog.icon"));
  setAria("#colorPickerPopover", tr("dialog.color"));
  setPlaceholder('#habitForm input[name="name"]', tr("dialog.namePlaceholder"));
  $$('select[name="frequency"]').forEach(frequency => {
    frequency.options[0].textContent = tr("habits.daily");
    frequency.options[1].textContent = languageText("每周", "Weekly", "Wöchentlich");
    frequency.options[2].textContent = languageText("每月", "Monthly", "Monatlich");
  });
  setText(".daily-score-choice strong", tr("dialog.dailyScore"));
  setText(".daily-score-choice small", tr("dialog.dailyScoreHelp"));
  setText(".form-hint", tr("dialog.hint"));
  setText("#deleteHabitButton", tr("dialog.delete"));
  setText("#habitForm .secondary-button", tr("dialog.cancel"));
  setText("#saveHabit", tr("dialog.save"));
  const habit = state?.habits?.find(h => h.id === editingHabitId);
  setText("#habitDialogTitle", habit ? tr("dialog.editTitle", { habit: displayHabitName(habit) }) : tr("dialog.addTitle"));
  renderColorPicker();
  updateHabitFormPreview();
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored?.habits) return { ...cloneData(seed), meta: { updatedAt: 0, starterPackVersion: STARTER_PACK_VERSION } };
    const hydrated = { ...cloneData(seed), ...stored, dailyGoals: stored.dailyGoals || {}, weeklyGoals: stored.weeklyGoals || {}, longTermGoals: stored.longTermGoals || [], weeklyOutputs: stored.weeklyOutputs || {}, weeklyReviews: stored.weeklyReviews || {} };
    const migrated = migrateLocalStarterPack(hydrated);
    if (migrated !== hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return { ...cloneData(seed), meta: { updatedAt: 0, starterPackVersion: STARTER_PACK_VERSION } };
  }
}

function demoWorkspaceApi() {
  return window.LifeLedgerDemoWorkspace;
}

function demoDismissedStorageKey() {
  return demoWorkspaceApi()?.resolveDismissedKey(previewName) || "life-ledger-demo-dismissed-v1";
}

function isDemoWorkspaceActive() {
  return Boolean(demoWorkspaceApi()?.isDemoActive(state));
}

function demoPhotoAnchorDate() {
  const seededAt = state?.meta?.demo?.seededAt;
  if (seededAt && !Number.isNaN(Date.parse(seededAt))) return new Date(seededAt);
  return new Date();
}

function mergeDemoTimelinePhotos(photos, from, to) {
  const api = demoWorkspaceApi();
  if (!api?.isDemoActive(state)) return photos;
  const demoPhotos = api.demoPhotosForRange(from, to, demoPhotoAnchorDate());
  if (!demoPhotos.length) return photos;
  return [...photos, ...demoPhotos];
}

function syncDemoCalendarPhotos(date) {
  const api = demoWorkspaceApi();
  if (!api?.isDemoActive(state)) return;
  const year = date.getFullYear();
  const month = date.getMonth();
  const from = isoDate(new Date(year, month, 1, 12));
  const to = isoDate(new Date(year, month + 1, 0, 12));
  [...calendarPhotosByDate.keys()].filter(day => day >= from && day <= to).forEach(day => {
    const kept = (calendarPhotosByDate.get(day) || []).filter(photo => !photo.demo);
    if (kept.length) calendarPhotosByDate.set(day, kept);
    else calendarPhotosByDate.delete(day);
  });
  api.demoPhotosForRange(from, to, demoPhotoAnchorDate()).forEach(photo => {
    const existing = (calendarPhotosByDate.get(photo.date) || []).filter(item => !item.demo);
    calendarPhotosByDate.set(photo.date, [...existing, photo]);
  });
}

function stripDemoCalendarPhotos() {
  [...calendarPhotosByDate.keys()].forEach(day => {
    const kept = (calendarPhotosByDate.get(day) || []).filter(photo => !photo.demo);
    if (kept.length) calendarPhotosByDate.set(day, kept);
    else calendarPhotosByDate.delete(day);
  });
}

function maybeApplyDemoWorkspace() {
  const api = demoWorkspaceApi();
  if (!api) return;
  const params = new URLSearchParams(location.search);
  if (previewName === api.DEMO_PREVIEW_ID && params.get("demo-reset") === "1") {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(demoDismissedStorageKey());
    const url = new URL(location.href);
    url.searchParams.delete("demo-reset");
    history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    state = loadState();
  }
  // The Mac app (?desktop=tauri-local) opens exactly like the local web edition (user 10/27): the three-month
  // sample is there on first launch; anything recorded before moves into the restorable backup, never deleted.
  const macLocal = desktopMode === "tauri-local";
  const eligible = macLocal || api.isLocalOnlyEligible({ deploymentMode, cloudBaseConfigured });
  // One-time reset of the local web edition (user 10/22): drop every older local record so the
  // three-month sample shows; afterwards "清除本机数据" in Settings lets anyone start blank.
  if (eligible && localStorage.getItem(LOCAL_EDITION_KEY) === "wipe") {
    wipeLocalRecords(); // finishing "清除本机数据": photos go here, before anything reopens them
    localStorage.setItem(demoDismissedStorageKey(), "1"); // the user chose a blank start
    localStorage.setItem(LOCAL_EDITION_KEY, LOCAL_EDITION);
    state = loadState();
  } else if (eligible && localStorage.getItem(LOCAL_EDITION_KEY) !== LOCAL_EDITION) {
    // Every visitor of the local edition sees the three-month sample (user 10/22, 10/24). Earlier records of
    // their own are not lost: they move into one backup key that Settings can restore.
    if (!api.isDemoActive(state) && api.hasMeaningfulUserData(state) && !localStorage.getItem(LOCAL_BACKUP_KEY)) {
      const saved = Object.fromEntries(Object.keys(localStorage)
        .filter(key => key.startsWith("life-ledger") && !KEEP_ON_CLEAR.has(key)).map(key => [key, localStorage.getItem(key)]));
      try { localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify({ savedAt: new Date().toISOString(), keys: saved })); }
      catch { return; } // storage full: keep the visitor's records rather than risk losing them
    }
    wipeLocalRecords();
    localStorage.setItem(LOCAL_EDITION_KEY, LOCAL_EDITION);
    state = loadState();
  }
  const dismissed = localStorage.getItem(demoDismissedStorageKey()) === "1";
  const storedRaw = localStorage.getItem(STORAGE_KEY);
  if (!api.shouldSeedDemo({ eligible, dismissed, storedRaw, state })) return;
  const demoState = api.buildDemoWorkspace({
    now: new Date(),
    lang: currentLang,
    seedHabits: cloneData(seed.habits),
  });
  state = { ...cloneData(seed), ...demoState };
  saveState();
}

function renderDemoNotice() {
  const notice = $("#demoWorkspaceNotice");
  if (!notice) return;
  const api = demoWorkspaceApi();
  const active = Boolean(api?.isDemoActive(state));
  notice.hidden = !active;
  if (!active) return;
  const copy = api.demoNoticeCopy(currentLang);
  setText("#demoWorkspaceNoticeText", copy.message);
  const clearButton = $("#clearDemoWorkspace");
  if (clearButton) {
    clearButton.textContent = copy.clear;
    clearButton.setAttribute("aria-label", copy.clear);
  }
  const resetButton = $("#demoPreviewReset");
  if (resetButton) {
    const showPreviewReset = previewName === api.DEMO_PREVIEW_ID;
    resetButton.hidden = !showPreviewReset;
    resetButton.textContent = copy.previewReset;
    resetButton.setAttribute("aria-label", copy.previewReset);
  }
}

async function clearDemoWorkspace() {
  const api = demoWorkspaceApi();
  if (!api?.isDemoActive(state)) return;
  const copy = api.demoNoticeCopy(currentLang);
  if (!(await appConfirm(copy.confirm))) return;
  state = api.buildClearedWorkspace({
    seedHabits: cloneData(seed.habits),
    starterPackVersion: STARTER_PACK_VERSION,
  });
  localStorage.setItem(demoDismissedStorageKey(), "1");
  stripDemoCalendarPhotos();
  saveState();
  renderDemoNotice();
  renderAll();
  showToast(copy.cleared);
}

async function resetPreviewDemoWorkspace() {
  const api = demoWorkspaceApi();
  if (!api || previewName !== api.DEMO_PREVIEW_ID) return;
  const copy = api.demoNoticeCopy(currentLang);
  if (!(await appConfirm(copy.confirm))) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(demoDismissedStorageKey());
  state = loadState();
  maybeApplyDemoWorkspace();
  stripDemoCalendarPhotos();
  renderDemoNotice();
  renderAll();
  showToast(copy.cleared);
}

function cleanStarterWorkspaceBase() {
  const api = demoWorkspaceApi();
  if (api) {
    return api.buildClearedWorkspace({
      seedHabits: cloneData(seed.habits),
      starterPackVersion: STARTER_PACK_VERSION,
    });
  }
  return {
    ...cloneData(seed),
    meta: { updatedAt: Date.now(), starterPackVersion: STARTER_PACK_VERSION },
  };
}

function dismissDemoMetadataAfterRestore() {
  const api = demoWorkspaceApi();
  if (!api) return;
  localStorage.setItem(demoDismissedStorageKey(), "1");
  if (!api.isDemoActive(state)) return;
  state.meta = {
    ...(state.meta || {}),
    demo: { version: api.DEMO_META_VERSION, active: false },
  };
}

function migrateLocalStarterPack(stored) {
  const requestedMode = new URLSearchParams(location.search).get("mode");
  if (requestedMode === "cloudflare" || window.LifeLedgerCloudBase?.deploymentConfig?.().configured) return stored;
  if ((stored.meta?.starterPackVersion || 0) >= STARTER_PACK_VERSION) return stored;

  const habits = Array.isArray(stored.habits) ? stored.habits : [];
  const ids = new Set(habits.map(habit => habit.id));
  const legacyCount = [...LEGACY_STARTER_HABIT_IDS].filter(id => ids.has(id)).length;
  const alreadyCurrent = [...CURRENT_STARTER_HABIT_IDS].some(id => id !== "strength" && ids.has(id));
  const meta = { ...(stored.meta || {}), starterPackVersion: STARTER_PACK_VERSION };

  if (legacyCount < 3 || alreadyCurrent) return { ...stored, meta };

  const customHabits = habits.filter(habit => !LEGACY_STARTER_HABIT_IDS.has(habit.id));
  return {
    ...stored,
    habits: [...cloneData(seed.habits), ...customHabits],
    meta: { ...meta, updatedAt: Date.now() },
  };
}
function saveState(options = {}) {
  state.meta = { ...(state.meta || {}), updatedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  requestPersistentStorage();
  if (cloudMode && !options.skipCloud) {
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(pushCloudState, 500);
  }
}
async function requestPersistentStorage() {
  if (persistenceRequested || location.protocol === "file:" || !navigator.storage?.persist) return;
  persistenceRequested = true;
  try {
    if (!await navigator.storage.persisted?.()) await navigator.storage.persist();
  } catch (error) {
    console.warn("Persistent storage request was not granted", error);
  }
}
function setSaveMode(mode, text) {
  const badge = $("#saveMode");
  badge.classList.toggle("cloud", mode === "cloud");
  badge.classList.toggle("syncing", mode === "syncing");
  badge.classList.toggle("auth", mode === "auth");
  badge.title = mode === "auth"
    ? cloudProvider === "cloudbase" ? tr("cloudbase.title") : tr("save.authTitle")
    : "";
  $("span", badge).textContent = text;
  const profileMode = $("#profileSaveMode");
  if (profileMode) {
    profileMode.textContent = mode === "cloud"
      ? cloudProvider === "cloudbase" ? tr("save.profileCloudBase") : tr("save.profileCloud")
      : mode === "syncing"
        ? tr("save.profileSyncing")
        : mode === "auth"
          ? tr("save.profileAuth")
        : cloudMode
          ? tr("save.profilePending")
          : tr("save.profileLocal");
  }
  $("#cloudAccountButton")?.classList.toggle("connected", cloudProvider === "cloudbase" && mode === "cloud");
}
function isAuthFailure(response) {
  const type = response.headers.get("content-type") || "";
  return response.status === 401
    || response.status === 403
    || response.status === 503
    || (response.redirected && response.url.includes("cloudflareaccess.com"))
    || type.includes("text/html");
}
function markAuthExpired() {
  authExpired = true;
  clearTimeout(cloudRetryTimer);
  setSaveMode("auth", tr("save.authExpired"));
}
function isCloudBaseAuthError(error) {
  return error?.name === "CloudBaseAuthRequiredError"
    || /login|sign-in|credential|auth/i.test(String(error?.message || ""));
}
function setCloudBaseAuthStatus(message = "", isError = false) {
  const status = $("#cloudbaseAuthStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", isError);
}
async function refreshCloudBaseAccount() {
  if (!cloudBaseAdapter) return null;
  try {
    cloudBaseLoginState = await cloudBaseAdapter.loginState();
  } catch (error) {
    console.warn("CloudBase account check failed", error);
    cloudBaseLoginState = null;
  }
  $("#cloudbaseSignOut").hidden = !cloudBaseLoginState?.user;
  return cloudBaseLoginState;
}
async function openCloudBaseAuth() {
  if (!cloudBaseAdapter) return;
  setCloudBaseAuthStatus();
  await refreshCloudBaseAccount();
  $("#cloudbaseAuthDialog").showModal();
}
function scheduleCloudRetry() {
  clearTimeout(cloudRetryTimer);
  cloudRetryTimer = setTimeout(() => {
    if (!authExpired && navigator.onLine) pushCloudState();
  }, 4000);
}
async function pushCloudState() {
  setSaveMode("syncing", tr("save.syncing"));
  try {
    if (cloudProvider === "cloudbase") {
      await cloudBaseAdapter.putState(state);
      authExpired = false;
      setSaveMode("cloud", tr("save.cloudSaved"));
      return;
    }
    const response = await fetch(CLOUD_API, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ payload: state }),
    });
    if (isAuthFailure(response)) { markAuthExpired(); return; }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    authExpired = false;
    setSaveMode("cloud", tr("save.cloudSaved"));
  } catch (error) {
    if (cloudProvider === "cloudbase" && isCloudBaseAuthError(error)) {
      markAuthExpired();
      return;
    }
    console.warn("Cloud sync failed", error);
    setSaveMode("", tr("save.networkRetry"));
    scheduleCloudRetry();
  }
}
async function pullCloudState() {
  setSaveMode("syncing", tr("save.connecting"));
  try {
    if (cloudProvider === "cloudbase") {
      const remote = await cloudBaseAdapter.getState();
      if (!remote) { adoptCloudProfile(null); await pushCloudState(); return; }
      if (remote?.payload && (remote.payload.meta?.updatedAt || 0) > (state.meta?.updatedAt || 0)) {
        state = { ...cloneData(seed), ...remote.payload, dailyGoals: remote.payload.dailyGoals || {}, weeklyGoals: remote.payload.weeklyGoals || {}, longTermGoals: remote.payload.longTermGoals || [], weeklyOutputs: remote.payload.weeklyOutputs || {}, weeklyReviews: remote.payload.weeklyReviews || {} };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        renderAll();
      }
      adoptCloudProfile(remote?.payload); renderDeviceProfile(); applyCloudPrefs();
      authExpired = false;
      setSaveMode("cloud", tr("save.cloudSaved"));
      return;
    }
    const response = await fetch(CLOUD_API, { headers: { accept: "application/json" } });
    if (isAuthFailure(response)) { markAuthExpired(); return; }
    if (response.status === 404) { adoptCloudProfile(null); await pushCloudState(); return; }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const remote = await response.json();
    if (remote?.payload && (remote.payload.meta?.updatedAt || 0) > (state.meta?.updatedAt || 0)) {
      state = { ...cloneData(seed), ...remote.payload, dailyGoals: remote.payload.dailyGoals || {}, weeklyGoals: remote.payload.weeklyGoals || {}, longTermGoals: remote.payload.longTermGoals || [], weeklyOutputs: remote.payload.weeklyOutputs || {}, weeklyReviews: remote.payload.weeklyReviews || {} };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderAll();
    }
    adoptCloudProfile(remote?.payload); renderDeviceProfile(); applyCloudPrefs();
    setSaveMode("cloud", tr("save.cloudSaved"));
  } catch (error) {
    if (cloudProvider === "cloudbase" && isCloudBaseAuthError(error)) {
      markAuthExpired();
      return;
    }
    console.warn("Cloud pull failed", error);
    setSaveMode("", tr("save.networkRetry"));
    scheduleCloudRetry();
  }
}

function applyCalendarLanguage() {
  const button = $("#calendarConnectionButton");
  if (button) {
    $("span", button).textContent = googleCalendar.connected ? tr("calendarSync.connectedTrigger") : tr("calendarSync.trigger");
    button.setAttribute("aria-label", googleCalendar.connected ? tr("calendarSync.connectedTrigger") : tr("calendarSync.trigger"));
  }
  setText("#calendarSettingsKicker", tr("calendarSync.kicker"));
  setText("#calendarSettingsTitle", tr("calendarSync.title"));
  setText("#calendarSettingsIntro", tr("calendarSync.intro"));
  setText("#calendarConnectTitle", tr("calendarSync.connectTitle"));
  setText("#calendarConnectHelp", tr("calendarSync.connectHelp"));
  setText("#calendarConnectButton", tr("calendarSync.connect"));
  setText("#calendarRefreshButton", tr("calendarSync.refresh"));
  setText("#calendarPickerLegend", tr("calendarSync.choose"));
  setText("#calendarAddAccountButton", tr("calendarSync.addAccount"));
  setText("#calendarHideRecurringLabel", tr("calendarSync.hideRecurring"));
  setText("#calendarHideRecurringHelp", tr("calendarSync.hideRecurringHelp"));
  setText("#calendarSettingsCancel", tr("calendarSync.close"));
  setText("#calendarPreferencesSave", tr("calendarSync.save"));
  setAria(".close-calendar-settings", tr("calendarSync.close"));
  renderCalendarConnection();
}

function formatCalendarSyncTime(timestamp) {
  if (!timestamp) return tr("calendarSync.neverSynced");
  const locale = currentLang === "zh" ? "zh-CN" : currentLang === "de" ? "de-DE" : "en-GB";
  return tr("calendarSync.lastSync", {
    time: new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp)),
  });
}

function setCalendarSettingsStatus(message = "", isError = false) {
  const status = $("#calendarSettingsStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function renderCalendarConnection() {
  const available = cloudProvider === "cloudflare" && googleCalendar.configured;
  const trigger = $("#calendarConnectionButton");
  if (trigger) {
    trigger.hidden = !available;
    trigger.classList.toggle("connected", googleCalendar.connected);
    $("span", trigger).textContent = googleCalendar.connected ? tr("calendarSync.connectedTrigger") : tr("calendarSync.trigger");
  }
  const disconnected = $("#calendarDisconnectedState");
  const connected = $("#calendarConnectedState");
  if (!disconnected || !connected) return;
  disconnected.hidden = googleCalendar.connected;
  connected.hidden = !googleCalendar.connected;
  $("#calendarPreferencesSave").hidden = !googleCalendar.connected;
  $("#calendarHideRecurring").checked = googleCalendar.hideRecurring;
  $("#calendarConnectedLabel").textContent = tr("calendarSync.connected", { count: googleCalendar.accounts.length });
  $("#calendarAddAccountButton").hidden = googleCalendar.accounts.length >= 2;
  $("#calendarLastSync").textContent = formatCalendarSyncTime(googleCalendar.lastSyncedAt);
  if (googleCalendar.connected) renderCalendarPicker();
}

function renderCalendarPicker() {
  const list = $("#calendarAccountsList");
  if (!list) return;
  if (!googleCalendar.accounts.length) {
    list.innerHTML = `<p class="calendar-picker-empty">${escapeHtml(tr("calendarSync.noCalendars"))}</p>`;
    return;
  }
  list.innerHTML = googleCalendar.accounts.map(account => {
    const selected = new Set(account.selectedCalendarIds || []);
    const calendars = account.calendars || [];
    return `<section class="calendar-account-card" data-connection-id="${escapeHtml(account.connectionId)}">
      <header><div><strong>${escapeHtml(account.accountLabel || "Google Calendar")}</strong><small>${escapeHtml(account.errorCode ? tr("calendarSync.accountNeedsReconnect") : tr("calendarSync.accountCalendars"))}</small></div><button type="button" class="calendar-account-disconnect" aria-label="${escapeHtml(tr("calendarSync.disconnectAccount"))}">×</button></header>
      <div class="calendar-picker-list">${calendars.length ? calendars.map(calendar => `<label class="calendar-picker-option">
        <input type="checkbox" value="${escapeHtml(calendar.id)}" ${selected.has(calendar.id) ? "checked" : ""} />
        <i style="--calendar-color:${escapeHtml(calendar.color || "#6f95c8")}" aria-hidden="true"></i>
        <span><strong>${escapeHtml(calendar.name)}</strong>${calendar.primary ? `<small>${escapeHtml(languageText("主日历", "Primary", "Primär"))}</small>` : ""}</span>
      </label>`).join("") : `<p class="calendar-picker-empty">${escapeHtml(account.errorCode ? tr("calendarSync.accountNeedsReconnect") : tr("calendarSync.noCalendars"))}</p>`}</div>
    </section>`;
  }).join("");
  $$(".calendar-account-disconnect", list).forEach(button => button.addEventListener("click", () => {
    const connectionId = button.closest(".calendar-account-card")?.dataset.connectionId;
    if (connectionId) disconnectGoogleCalendar(connectionId);
  }));
}

async function calendarApi(path, options = {}) {
  const response = await fetch(`/api/calendar/${path}`, {
    ...options,
    headers: { accept: "application/json", ...(options.body ? { "content-type": "application/json" } : {}), ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || `HTTP ${response.status}`);
    error.code = payload.code || "CALENDAR_FAILED";
    error.status = response.status;
    throw error;
  }
  return payload;
}

function calendarMonthRange(date) {
  const value = typeof date === "string" ? parseDate(date) : new Date(date);
  const year = value.getFullYear();
  const month = value.getMonth();
  const first = new Date(year, month, 1, 0, 0, 0, 0);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset, 0, 0, 0, 0);
  const end = new Date(start); end.setDate(start.getDate() + 42);
  return { key: `${year}-${String(month + 1).padStart(2, "0")}`, start, end };
}

function resetCalendarEventCache() {
  googleCalendarEvents.clear();
  googleCalendarLoadedMonths.clear();
  googleCalendarLoadingMonths.clear();
}

function calendarEventTime(value, allDay) {
  if (allDay || !value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(11, 16);
  return new Intl.DateTimeFormat(currentLang === "zh" ? "zh-CN" : currentLang === "de" ? "de-DE" : "en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(date);
}

function calendarEventsForDate(date) {
  if (dayPlanPrototype) return calendarPreviewEvents(date);
  // sample workspace: the persona's own calendar, until a real calendar is connected
  if (!googleCalendar.connected && demoWorkspaceApi()?.isDemoActive(state)) return demoWorkspaceApi().demoScheduleFor(currentLang, date, new Date());
  return [...googleCalendarEvents.values()]
    .filter(event => event.date === date)
    .map(event => ({
      ...event,
      routine: Boolean(event.recurring),
      start: calendarEventTime(event.start, event.allDay),
      end: calendarEventTime(event.end, event.allDay),
    }))
    .sort((a, b) => Number(Boolean(b.allDay)) - Number(Boolean(a.allDay)) || String(a.start || "").localeCompare(String(b.start || "")));
}

async function loadGoogleCalendarMonth(date, options = {}) {
  if (!googleCalendar.connected) return;
  const range = calendarMonthRange(date);
  if (!options.force && (googleCalendarLoadedMonths.has(range.key) || googleCalendarLoadingMonths.has(range.key))) return;
  googleCalendarLoadingMonths.add(range.key);
  renderDaySchedule();
  try {
    const query = new URLSearchParams({ timeMin: range.start.toISOString(), timeMax: range.end.toISOString() });
    const payload = await calendarApi(`events?${query}`);
    const startKey = isoDate(range.start), endKey = isoDate(range.end);
    for (const [id, event] of googleCalendarEvents) {
      if (event.date >= startKey && event.date < endKey) googleCalendarEvents.delete(id);
    }
    for (const event of payload.events || []) googleCalendarEvents.set(event.id, event);
    googleCalendar.lastSyncedAt = Number(payload.syncedAt || Date.now());
    googleCalendar.stale = Boolean(payload.stale);
    googleCalendar.hideRecurring = payload.hideRecurring !== false;
    if (Array.isArray(payload.accountErrors) && payload.accountErrors.length) {
      setCalendarSettingsStatus(tr("calendarSync.accountNeedsReconnect"), true);
    }
    googleCalendarLoadedMonths.add(range.key);
    renderDailyGoals();
    renderCalendar();
    if ($("#dayDrawer").classList.contains("open")) renderDrawer();
    if ($("#dayPlanDialog").open) renderDayPlanDialog();
    renderCalendarConnection();
    if (googleCalendar.stale) setCalendarSettingsStatus(tr("calendarSync.stale"));
  } catch (error) {
    console.warn("Calendar event load failed", { code: error.code, status: error.status });
    if (error.code === "CALENDAR_NOT_CONNECTED") {
      googleCalendar.connected = false;
      renderCalendarConnection();
      setCalendarSettingsStatus(tr("calendarSync.authExpired"), true);
    } else {
      setCalendarSettingsStatus(tr("calendarSync.error"), true);
    }
  } finally {
    googleCalendarLoadingMonths.delete(range.key);
    renderDaySchedule();
  }
}

async function loadGoogleCalendarChoices() {
  if (!googleCalendar.connected) return;
  try {
    const payload = await calendarApi("calendars");
    googleCalendar.accounts = payload.accounts || [];
    googleCalendar.connected = googleCalendar.accounts.length > 0;
    googleCalendar.hideRecurring = payload.hideRecurring !== false;
    renderCalendarConnection();
  } catch (error) {
    console.warn("Calendar list failed", { code: error.code, status: error.status });
    setCalendarSettingsStatus(error.code === "CALENDAR_RECONNECT_REQUIRED" ? tr("calendarSync.authExpired") : tr("calendarSync.error"), true);
  }
}

async function initializeGoogleCalendar() {
  if (cloudProvider !== "cloudflare") return;
  try {
    const status = await calendarApi("status");
    googleCalendar = { ...googleCalendar, ...status, accounts: status.accounts || [], configured: Boolean(status.configured), connected: Boolean(status.connected) };
    renderCalendarConnection();
    if (!googleCalendar.configured || !googleCalendar.connected) return;
    await Promise.all([loadGoogleCalendarChoices(), loadGoogleCalendarMonth(cursor), loadGoogleCalendarMonth(selectedPlanningDate)]);
  } catch (error) {
    console.warn("Calendar status failed", { code: error.code, status: error.status });
  }
}

async function openGoogleCalendarSettings() {
  renderCalendarConnection();
  setCalendarSettingsStatus();
  $("#calendarSettingsDialog").showModal();
  if (googleCalendar.connected) await loadGoogleCalendarChoices();
}

async function connectGoogleCalendar() {
  if (googleCalendar.accounts.length >= 2) {
    setCalendarSettingsStatus(tr("calendarSync.accountLimit"), true);
    return;
  }
  const button = googleCalendar.connected ? $("#calendarAddAccountButton") : $("#calendarConnectButton");
  button.disabled = true;
  button.textContent = tr("calendarSync.connecting");
  try {
    const payload = await calendarApi("connect", { method: "POST" });
    location.assign(payload.authorizationUrl);
  } catch (error) {
    button.disabled = false;
    button.textContent = googleCalendar.connected ? tr("calendarSync.addAccount") : tr("calendarSync.connect");
    setCalendarSettingsStatus(tr("calendarSync.error"), true);
  }
}

async function saveGoogleCalendarPreferences() {
  const accounts = $$(".calendar-account-card", $("#calendarAccountsList")).map(card => ({
    connectionId: card.dataset.connectionId,
    selectedCalendarIds: $$('input:checked', card).map(input => input.value),
  }));
  if (!accounts.some(account => account.selectedCalendarIds.length)) {
    setCalendarSettingsStatus(tr("calendarSync.noCalendars"), true);
    return;
  }
  const button = $("#calendarPreferencesSave");
  button.disabled = true;
  button.textContent = tr("calendarSync.saving");
  try {
    const payload = await calendarApi("preferences", {
      method: "PUT",
      body: JSON.stringify({ accounts, hideRecurring: $("#calendarHideRecurring").checked }),
    });
    googleCalendar.accounts = googleCalendar.accounts.map(account => ({
      ...account,
      selectedCalendarIds: payload.accounts.find(item => item.connectionId === account.connectionId)?.selectedCalendarIds || account.selectedCalendarIds,
    }));
    googleCalendar.hideRecurring = payload.hideRecurring;
    dayPlanRoutinesExpanded = !googleCalendar.hideRecurring;
    resetCalendarEventCache();
    await Promise.all([loadGoogleCalendarMonth(cursor, { force: true }), loadGoogleCalendarMonth(selectedPlanningDate, { force: true })]);
    setCalendarSettingsStatus(tr("calendarSync.saved"));
  } catch (error) {
    setCalendarSettingsStatus(tr("calendarSync.error"), true);
  } finally {
    button.disabled = false;
    button.textContent = tr("calendarSync.save");
  }
}

async function refreshGoogleCalendar() {
  const button = $("#calendarRefreshButton");
  button.disabled = true;
  button.textContent = tr("calendarSync.refreshing");
  resetCalendarEventCache();
  await Promise.all([loadGoogleCalendarMonth(cursor, { force: true }), loadGoogleCalendarMonth(selectedPlanningDate, { force: true })]);
  button.disabled = false;
  button.textContent = tr("calendarSync.refresh");
}

async function disconnectGoogleCalendar(connectionId) {
  if (!(await appConfirm(tr("calendarSync.disconnectConfirm")))) return;
  try {
    const payload = await calendarApi(`disconnect?connectionId=${encodeURIComponent(connectionId)}`, { method: "DELETE" });
    resetCalendarEventCache();
    googleCalendar = { ...googleCalendar, connected: Boolean(payload.connected), accounts: payload.accounts || [], lastSyncedAt: 0, stale: false };
    if (!googleCalendar.connected) $("#calendarSettingsDialog").close();
    else await loadGoogleCalendarChoices();
    renderCalendarConnection();
    renderDailyGoals();
    renderCalendar();
    showToast(tr("calendarSync.disconnected"));
  } catch (error) {
    setCalendarSettingsStatus(tr("calendarSync.error"), true);
  }
}

function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function parseDate(value) { const [y, m, d] = value.split("-").map(Number); return new Date(y, m - 1, d, 12); }
function monthKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }
function getLog(date) { return state.logs[date] || { completed: [], mood: "", moodReason: "", note: "" }; }
function activeHabits(date) {
  return state.habits.filter(h => h.active && h.versions.some(v => v.effectiveDate <= date));
}
function versionFor(habit, date) {
  return [...habit.versions].filter(v => v.effectiveDate <= date).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0];
}
function countsTowardDaily(habit, date) {
  const version = versionFor(habit, date);
  if (!version) return false;
  return version.countsTowardDaily ?? version.frequency === "daily";
}
function dailyHabits(date) {
  return activeHabits(date).filter(habit => countsTowardDaily(habit, date));
}
function periodTargetFor(version) {
  return version?.periodTarget ?? version?.weeklyTarget ?? 1;
}
function frequencyLabel(version) {
  if (version.frequency === "weekly") return tr("habits.weekly", { target: periodTargetFor(version) });
  if (version.frequency === "monthly") return tr("habits.monthly", { target: periodTargetFor(version) });
  return tr("habits.daily");
}
function scheduleLabel(version) {
  const explicit = String(version?.scheduleTime || "").trim();
  if (explicit) return explicit;
  const legacyUnit = String(version?.unit || "").trim();
  return /^\d{1,2}:\d{2}(?:\s*[–—-]\s*\d{1,2}:\d{2})?$/.test(legacyUnit) ? legacyUnit : "";
}
function trackingModeFor(version) {
  if (version?.trackingMode === "check" || version?.trackingMode === "measured") return version.trackingMode;
  const unit = String(version?.unit || "").trim();
  return /^\d{1,2}:\d{2}(?:\s*[–—-]\s*\d{1,2}:\d{2})?$/.test(unit) ? "check" : "measured";
}
function habitMetaLabel(version) {
  if (!version) return "";
  const schedule = scheduleLabel(version);
  const unit = String(version.unit || "").trim();
  const unitIsSchedule = /^\d{1,2}:\d{2}(?:\s*[–—-]\s*\d{1,2}:\d{2})?$/.test(unit);
  const quantity = trackingModeFor(version) === "check" || unitIsSchedule ? "" : `${version.target}${displayUnit(unit)}`;
  return [frequencyLabel(version), schedule, quantity].filter(Boolean).join(" · ");
}
function habitStyle(habit) {
  const c = colors[habit.color] || colors.sage;
  return `--habit-color:${c.solid};--habit-soft:${c.soft}`;
}
function completionFor(date) {
  const habits = dailyHabits(date);
  const log = getLog(date);
  return habits.length ? Math.round((log.completed.filter(id => habits.some(h => h.id === id)).length / habits.length) * 100) : 0;
}
function showToast(message) {
  const toast = $("#toast"); $("p", toast).textContent = message;
  toast.classList.add("show"); clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1600);
}

function initSelects() {
  const year = $("#yearSelect"), month = $("#monthSelect");
  for (let y = 2026; y <= 2035; y++) year.add(new Option(y, y));
  for (let m = 1; m <= 12; m++) month.add(new Option(String(m).padStart(2, "0"), m - 1));
  year.addEventListener("change", () => { cursor.setFullYear(+year.value); renderAll(); void loadGoogleCalendarMonth(cursor); });
  month.addEventListener("change", () => { cursor.setMonth(+month.value); renderAll(); void loadGoogleCalendarMonth(cursor); });
}

function renderAll() {
  applyLanguage();
  applyPortedPageLanguage();
  renderDemoNotice();
  $("#yearSelect").value = cursor.getFullYear();
  $("#monthSelect").value = cursor.getMonth();
  renderToday();
  updateDailyToolControls(dailyToolPage);
  renderFocusOverview();
  renderWeeklyWorkspace();
  renderCalendar();
  renderReview();
  renderHabitSettings();
  if (document.body.dataset.activeView === "longrange") renderLongRange();
  if ($("#timelineView")?.classList.contains("active")) void renderTimeline();
  decorateMotionSurfaces();
  window.dispatchEvent(new Event("life-ledger-rendered"));
}

// Today's card motion (pointer glow, hover lift / tilt) on every page (user 10/21).
const motionSurfaceSelector = ".hero-card, .mood-card, .habit-card, .daily-goals-card, .calendar-card, .panel, .weekly-goals-panel, .weekly-writing-panel, .score-card, .setting-row, " +
  "#weekView .module-card, .week-calendar-day, .week-insight-card, .horizon-phase-card, .horizon-goal, .horizon-monthly, .horizon-note, .feed-paper, " +
  "#reviewView .insight-metrics > article, #reviewView .insight-observations > article, .review-trend-chart, .insight-habit-panel, .insight-weekday-panel, .insight-period-habits, .review-narrative, .habit-management-editor";
const tiltSurfaceSelector = ".mood-card, .habit-card, .daily-goals-card, .score-card, .setting-row, .week-insight-card, .horizon-goal, #reviewView .insight-metrics > article";
function motionAllowed() {
  return matchMedia("(hover: hover) and (pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches;
}
// Pages render their cards later (long-range, timeline feed, habit settings): decorate whatever appears.
let motionObserver = null;
function decorateMotionSurfaces() {
  if (!motionAllowed()) return;
  if (!motionObserver && document.querySelector(".main-content")) {
    let queued = 0;
    motionObserver = new MutationObserver(() => { if (!queued) queued = requestAnimationFrame(() => { queued = 0; decorateMotionSurfaces(); }); });
    motionObserver.observe(document.querySelector(".main-content"), { childList: true, subtree: true });
  }
  $$(motionSurfaceSelector).forEach(surface => {
    surface.classList.add("apple-interactive");
    if (surface.matches(tiltSurfaceSelector)) surface.classList.add("apple-tilt");
    if (!surface.querySelector(":scope > .pointer-aura")) {
      const aura = document.createElement("span");
      aura.className = "pointer-aura";
      aura.setAttribute("aria-hidden", "true");
      surface.prepend(aura);
    }
  });
}
function bindPointerMotion() {
  if (!motionAllowed()) return;
  let pendingFrame = 0;
  let pointerEvent = null;
  document.addEventListener("pointermove", event => {
    const surface = event.target.closest?.(motionSurfaceSelector);
    if (!surface) return;
    pointerEvent = { surface, clientX: event.clientX, clientY: event.clientY };
    if (pendingFrame) return;
    pendingFrame = requestAnimationFrame(() => {
      pendingFrame = 0;
      if (!pointerEvent) return;
      const { surface: activeSurface, clientX, clientY } = pointerEvent;
      const rect = activeSurface.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
      activeSurface.style.setProperty("--pointer-x", `${x}px`);
      activeSurface.style.setProperty("--pointer-y", `${y}px`);
      if (activeSurface.matches(tiltSurfaceSelector)) {
        activeSurface.style.setProperty("--tilt-x", `${((rect.height / 2 - y) / rect.height * 2.2).toFixed(2)}deg`);
        activeSurface.style.setProperty("--tilt-y", `${((x - rect.width / 2) / rect.width * 2.2).toFixed(2)}deg`);
      }
    });
  }, { passive: true });
  document.addEventListener("pointerout", event => {
    const surface = event.target.closest?.(motionSurfaceSelector);
    if (!surface || surface.contains(event.relatedTarget)) return;
    surface.style.setProperty("--tilt-x", "0deg");
    surface.style.setProperty("--tilt-y", "0deg");
  }, { passive: true });
}

function autoGrowTextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

function renderWeeklyWorkspace() {
  const key = selectedWorkspaceWeek;
  const currentKey = isoWeekKey(new Date());
  const goals = state.weeklyGoals[key] || [];
  const done = goals.filter(goal => goal.done).length;
  const output = state.weeklyOutputs[key] || "";
  const range = formatWeekRange(key);
  setText('#weekPageTitle', range);
  setText('#inspectorWeekHeading',languageText('本周复盘','This week’s reflection','Rückblick dieser Woche'));
  setText('#weekArchiveLink',languageText('在时间轴中回看 →','View in Timeline →','In der Zeitleiste ansehen →'));
  setAria('#weeklyOutputText',languageText('本周复盘','Weekly reflection','Wochenrückblick'));
  setPlaceholder('#weeklyOutputText',languageText('这一周，什么值得记住？\n什么想继续，什么想改变？','What is worth remembering this week?\nWhat will you keep, and what will you change?','Was bleibt von dieser Woche?\nWas möchtest du beibehalten, was ändern?'));
  setText('#weekPageKicker', languageText('把一周，过成自己的节奏', 'A WEEK AT YOUR OWN PACE', 'DEINE WOCHE. DEIN RHYTHMUS.'));
  setText("#weekRange", tr("week.range", { range }));
  const weekOffset = weekDistance(currentKey, key);
  setText("#weekRelativeLabel", weekOffset === 0 ? tr("week.relativeCurrent") : weekOffset === 1 ? tr("week.relativeNext") : weekOffset === -1 ? tr("week.relativePrevious") : weekOffset > 0 ? tr("week.relativeFuture", { n: weekOffset }) : tr("week.relativePast", { n: Math.abs(weekOffset) }));
  renderWeekCalendar();
  setText('#weekPlanLede', languageText('安排这一周，写下这一周。','Make room for the week. Put it into words.','Plane deine Woche. Halte sie fest.'));
  if (googleCalendar.connected) void loadGoogleCalendarMonth(weekDatesFromKey(key).monday);
  renderWeekInsights();
  renderWeekPromotedReview();
  $("#weeklyGoalProgress").textContent = `${done} / ${goals.length}`;
  setText("#weeklyGoalsTitle", tr("week.goalsTitleProgress", { done, total: goals.length }));
  setText("#inspectorWeekRange", range);
  $(".weekly-goals-section")?.classList.toggle("is-empty", !goals.length);
  $("#weeklyGoalList").innerHTML = goals.length ? goals.map(goal => `
    <div class="weekly-goal ${goal.done ? "done" : ""}" data-id="${goal.id}">
      <button class="weekly-goal-check" data-action="toggle" aria-label="${goal.done ? tr("toast.habitOff") : tr("toast.habitOn")}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5L19 8"/></svg></button>
      <button class="weekly-goal-text" data-action="toggle">${escapeHtml(goal.text)}</button>
      <button class="weekly-goal-delete" data-action="delete" aria-label="${tr("dialog.delete")}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
    </div>`).join("") : hairlineEmptyMarkup(
      "./assets/hairline/empty-week-goals.svg",
      tr("week.goalsTitleProgress", { done: 0, total: 0 }),
      languageText("先写一件真正重要的事。", "Put one important thing here.", "Lege eine wirklich wichtige Sache hinein."),
    );
  if (!goals.length) {
    hydrateHairlineMounts($("#weekView"));
    const weekMount = $("#weeklyGoalList .hairline-mount");
    if (weekMount) weekMount.dataset.filled = String(weekDaysWithCompletion(key));
  }
  $("#currentWeekNumber").textContent = range;
  $("#basketYear").textContent = "";
  setText("#basketWeekLabel", range);
  $("#weeklyGoalInput").placeholder = tr("week.goalPlaceholder");
  const weeklyOutput = $("#weeklyOutputText");
  if (weeklyOutput) {
    weeklyOutput.value = output;
    autoGrowTextarea(weeklyOutput);
  }
  setText("#weeklyOutputStatus", output.trim() ? tr("week.outputStatus", { count: output.trim().length }) : tr("week.outputEmpty"));
  renderLongTermGoals();
  applyGoalHorizon();
  $$(".weekly-goal").forEach(row => row.addEventListener("click", event => {
    const action = event.target.closest("button")?.dataset.action;
    if (!action) return;
    const list = state.weeklyGoals[key] || [];
    const index = list.findIndex(goal => goal.id === row.dataset.id);
    if (action === "toggle") list[index].done = !list[index].done;
    if (action === "delete") list.splice(index, 1);
    state.weeklyGoals[key] = list; saveState(); renderWeeklyWorkspace();
  }));
}

function applyGoalHorizon() {
  const isWeek = goalHorizon === "week";
  $("#weeklyGoalsPane").hidden = !isWeek;
  $("#longTermGoalsPane").hidden = isWeek;
  $$('[data-goal-horizon]').forEach(button => {
    const active = button.dataset.goalHorizon === goalHorizon;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  window.LifeLedgerInteraction?.syncSegments(document);
}

function formatLongTermReviewDate(value) {
  if (!value) return tr("longTerm.noReview");
  const date = parseDate(value);
  const locale = currentLang === "zh" ? "zh-CN" : currentLang === "de" ? "de-DE" : "en-GB";
  return tr("longTerm.reviewOn", { date: new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(date) });
}

function renderLongTermGoals() {
  const goals = state.longTermGoals || [];
  const active = goals.filter(goal => goal.status === "active").length;
  $("#longTermGoalCount").textContent = tr("longTerm.activeCount", { count: active });
  $("#longTermGoalList").innerHTML = goals.length ? goals.map(goal => `<button class="long-term-goal ${escapeHtml(goal.status || "active")}" type="button" data-id="${escapeHtml(goal.id)}">
    <span class="long-term-status" aria-hidden="true"></span>
    <span class="long-term-copy"><strong>${escapeHtml(goal.name)}</strong><small>${escapeHtml(goal.nextAction || tr("longTerm.noNext"))}</small></span>
    <span class="long-term-meta"><b>${escapeHtml(tr(`longTerm.${goal.status || "active"}`))}</b><small>${escapeHtml(formatLongTermReviewDate(goal.reviewDate))}</small></span>
    <span class="long-term-chevron" aria-hidden="true">›</span>
  </button>`).join("") : `<p class="weekly-goal-empty long-term-empty">${tr("longTerm.empty")}</p>`;
  $$("#longTermGoalList .long-term-goal").forEach(button => button.addEventListener("click", () => openLongTermGoalDialog(button.dataset.id)));
}

function openLongTermGoalDialog(id = null) {
  editingLongTermGoalId = id;
  const goal = (state.longTermGoals || []).find(item => item.id === id);
  const form = $("#longTermGoalForm");
  form.reset();
  form.elements.name.value = goal?.name || "";
  form.elements.nextAction.value = goal?.nextAction || "";
  form.elements.reviewDate.value = goal?.reviewDate || "";
  form.elements.status.value = goal?.status || "active";
  $("#longTermDialogTitle").textContent = tr(goal ? "longTerm.editTitle" : "longTerm.addTitle");
  $("#deleteLongTermGoal").hidden = !goal;
  $("#longTermGoalDialog").showModal();
  window.setTimeout(() => form.elements.name.focus(), 0);
}

function closeLongTermGoalDialog() {
  if ($("#longTermGoalDialog").open) $("#longTermGoalDialog").close();
  editingLongTermGoalId = null;
}

function saveLongTermGoal(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = {
    name: form.elements.name.value.trim(),
    nextAction: form.elements.nextAction.value.trim(),
    reviewDate: form.elements.reviewDate.value || "",
    status: form.elements.status.value || "active",
  };
  if (!values.name) return;
  const goals = [...(state.longTermGoals || [])];
  const index = goals.findIndex(goal => goal.id === editingLongTermGoalId);
  if (index >= 0) goals[index] = { ...goals[index], ...values, updatedAt: Date.now() };
  else goals.push({ id: createId(), ...values, createdAt: Date.now(), updatedAt: Date.now() });
  state.longTermGoals = goals;
  saveState();
  closeLongTermGoalDialog();
  renderWeeklyWorkspace();
  showToast(tr(index >= 0 ? "longTerm.updated" : "longTerm.added"));
}

function deleteLongTermGoal() {
  if (!editingLongTermGoalId) return;
  state.longTermGoals = (state.longTermGoals || []).filter(goal => goal.id !== editingLongTermGoalId);
  saveState();
  closeLongTermGoalDialog();
  renderWeeklyWorkspace();
  showToast(tr("longTerm.removed"));
}

function openLongTermWorkspace() { switchToView('longrange'); }

function timelineRange(date) {
  const from = isoDate(new Date(date.getFullYear(), date.getMonth(), 1, 12));
  const to = isoDate(new Date(date.getFullYear(), date.getMonth() + 1, 0, 12));
  return { from, to };
}

function timelineDateLabel(value) {
  const date = parseDate(value);
  return {
    weekday: formatLocalizedDate(date, { weekday: "short" }),
    day: formatLocalizedDate(date, { day: "numeric" }),
    detail: formatLocalizedDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
  };
}

async function renderTimeline() {
  if (['weeks','months','timeline'].includes(journalMode)) {
    const version = ++timelineRenderVersion;
    timelineRendering = false;
    await renderJournalFeed(version);
    return;
  }
  const version = ++timelineRenderVersion;
  timelineRendering = true;
  renderJournalCalendar();
  const { from, to } = timelineRange(timelineCursor);
  let photos = [];
  try {
    photos = await photoMemories?.listRange(from, to) || [];
  } catch {
    photos = [];
  }
  photos = mergeDemoTimelinePhotos(photos, from, to);
  if (version !== timelineRenderVersion) {
    timelineRendering = false;
    return;
  }
  [...calendarPhotosByDate.keys()].filter(day => day >= from && day <= to).forEach(day => calendarPhotosByDate.delete(day));
  photos.forEach(photo => calendarPhotosByDate.set(photo.date, [...(calendarPhotosByDate.get(photo.date) || []), photo]));
  const photoDates = new Set(photos.map(photo => photo.date));
  const entries = timelineEntriesForMonth(timelineCursor);
  photoDates.forEach(date => {
    if (!entries.some(entry => entry.date === date)) entries.push({ date, log: getLog(date) });
  });
  if (selectedTimelineDate && !entries.some(entry => entry.date === selectedTimelineDate)) {
    entries.push({ date: selectedTimelineDate, log: getLog(selectedTimelineDate) });
  }
  entries.sort((a, b) => b.date.localeCompare(a.date));
  const visibleEntries = applyTimelineFilter(entries);
  if (!visibleEntries.some(entry => entry.date === selectedTimelineDate)) {
    const todayKey = isoDate(new Date());
    selectedTimelineDate = visibleEntries[0]?.date || (todayKey >= from && todayKey <= to ? todayKey : to);
  }
  renderTimelineEntryList(visibleEntries);
  renderJournalPhotoLibrary(photos);
  renderJournalComposer();
  void renderTimelineDetail();
  $$(".calendar-day").forEach(day => day.classList.toggle("selected", day.dataset.date === selectedTimelineDate));
  const calendarEmptyArt = $("#journalCalendarEmptyArt");
  if (calendarEmptyArt) {
    const isCalendarMode = journalMode === "calendar";
    const isEmpty = entries.length === 0;
    const shouldShow = isCalendarMode && isEmpty;
    calendarEmptyArt.hidden = !shouldShow;
    if (shouldShow) {
      window.LifeLedgerInteraction?.mountHairline(calendarEmptyArt, "./assets/hairline/journal-calendar-empty.svg");
    }
  }
  timelineRendering = false;
}
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function orderedTodayHabits(habits, completedIds) {
  const byId = new Map(habits.map(habit => [habit.id, habit]));
  const completed = new Set(completedIds);
  const remaining = habits.filter(habit => !completed.has(habit.id));
  const finished = completedIds.map(id => byId.get(id)).filter(Boolean);
  return [...remaining, ...finished];
}

function updateHabitCarouselNavigation(pageCount) {
  const nav = $("#habitCarouselNav");
  const previous = $("#previousHabitPage");
  const next = $("#nextHabitPage");
  const status = $("#habitCarouselStatus");
  const pages = $("#habitCarouselPages");
  if (!nav || !previous || !next || !status || !pages) return;
  nav.hidden = pageCount <= 1;
  previous.disabled = todayHabitPage === 0;
  next.disabled = todayHabitPage >= pageCount - 1;
  status.textContent = `${todayHabitPage + 1} / ${pageCount}`;
  pages.innerHTML = Array.from({ length: pageCount }, (_, index) => `<button type="button" class="habit-carousel-page ${index === todayHabitPage ? "active" : ""}" data-page="${index}" aria-label="${escapeHtml(tr("foundations.page", { page: index + 1, total: pageCount }))}" ${index === todayHabitPage ? 'aria-current="page"' : ""}><span></span></button>`).join("");
  $$(".habit-carousel-page", pages).forEach(button => button.addEventListener("click", () => setTodayHabitPage(Number(button.dataset.page))));
}

function setTodayHabitPage(page, behavior = "smooth") {
  const viewport = $("#todayHabitViewport");
  const pageCount = Number($("#todayHabitCarousel")?.dataset.pageCount || 1);
  todayHabitPage = Math.max(0, Math.min(page, pageCount - 1));
  updateHabitCarouselNavigation(pageCount);
  if (viewport) viewport.scrollTo({ left: viewport.clientWidth * todayHabitPage, behavior });
}

function syncHabitCarouselPageFromScroll() {
  const viewport = $("#todayHabitViewport");
  if (!viewport?.clientWidth) return;
  const pageCount = Number($("#todayHabitCarousel")?.dataset.pageCount || 1);
  const page = Math.max(0, Math.min(Math.round(viewport.scrollLeft / viewport.clientWidth), pageCount - 1));
  if (page === todayHabitPage) return;
  todayHabitPage = page;
  updateHabitCarouselNavigation(pageCount);
}

function renderHabitCarousel(habits, date, completedIds, locked = false) {
  const ordered = orderedTodayHabits(habits, completedIds);
  // Web Today cards set how many fit the foundations card's size (data-per); elsewhere 4.
  const perPage = Number(document.querySelector('[data-card="habits"]')?.dataset.per) || HABITS_PER_PAGE;
  const pageCount = Math.max(1, Math.ceil(ordered.length / perPage));
  todayHabitPage = Math.min(todayHabitPage, pageCount - 1);
  const carousel = $("#todayHabitCarousel");
  const viewport = $("#todayHabitViewport");
  carousel.dataset.pageCount = String(pageCount);
  $("#todayHabits").innerHTML = Array.from({ length: pageCount }, (_, page) => {
    const group = ordered.slice(page * perPage, (page + 1) * perPage);
    return `<div class="habit-page" data-page="${page}" aria-label="${escapeHtml(tr("foundations.page", { page: page + 1, total: pageCount }))}">${group.map(habit => habitCard(habit, date, completedIds.includes(habit.id), locked)).join("")}</div>`;
  }).join("");
  if (viewport) viewport.scrollLeft = viewport.clientWidth * todayHabitPage;
  updateHabitCarouselNavigation(pageCount);
  $$("#todayHabits .habit-card").forEach(card => {
    const activate = () => {
      if (suppressHabitCardClick) return;
      toggleHabit(date, card.dataset.id);
    };
    card.addEventListener("click", activate);
    card.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      activate();
    });
  });
}


function renderToday() {
  const date = selectedPlanningDate;
  const selected = parseDate(date);
  const viewingToday = date === isoDate(new Date());
  const future = isFutureDate(date);
  const log = getLog(date);
  const habits = activeHabits(date);
  const scoredHabits = dailyHabits(date);
  const complete = log.completed.filter(id => scoredHabits.some(h => h.id === id)).length;
  const progress = scoredHabits.length ? Math.round(complete / scoredHabits.length * 100) : 0;
  $("#todayDateChip").textContent = formatDateChip(selected);
  // Future day (user 10/22: "什么都点不了"): say why, and point to what can be done — goals and schedule.
  $("#heroProgressText").textContent = future
    ? languageText("这一天还没到 · 可以先安排目标和日程", "This day hasn't come yet · plan goals and schedule now", "Dieser Tag kommt noch · Ziele und Termine jetzt planen")
    : tr("hero.progressText", { done: complete, total: scoredHabits.length });
  $(".mood-card")?.classList.toggle("is-future", future);
  $(".mood-card")?.setAttribute("data-future-hint", future ? languageText("当天再记录心情", "Mood opens on the day", "Stimmung am Tag selbst") : "");
  setText(".progress-orbit-label", tr(viewingToday ? "hero.progress" : "hero.selectedProgress"));
  setText(".mood-card h3", tr(viewingToday ? "mood.title" : "mood.selectedTitle"));
  setText(".habits-heading h2", tr(viewingToday ? "foundations.title" : "foundations.selectedTitle"));
  const progressNumber = $("#progressNumber");
  const progressCount = `${complete} / ${scoredHabits.length}`;
  if (progressNumber.dataset.value !== progressCount) {
    progressNumber.dataset.value = progressCount;
    progressNumber.innerHTML = `<b>${complete}</b><small>/ ${scoredHabits.length}</small>`;
    progressNumber.classList.remove("number-pop");
    void progressNumber.offsetWidth;
    progressNumber.classList.add("number-pop");
  }
  $("#progressOrbit").style.setProperty("--progress", progress);
  renderHabitCarousel(habits, date, log.completed, future);
  $$("#quickMood button").forEach(button => {
    button.classList.toggle("selected", button.dataset.mood === log.mood);
    button.disabled = future;
  });
  renderMoodReasonSummary("#quickMoodReason", log);
  renderDailyGoals();
}

function renderDailyGoals() {
  renderDayRoll();
  renderDaySchedule();
  const selected = parseDate(selectedPlanningDate);
  $("#todayPlanDate").textContent = formatDateChip(selected);
  $("#journalPlanDate").textContent = formatDateChip(selected);
  renderHomeJournal();
}

function calendarPreviewEvents(date) {
  if (!dayPlanPrototype) return [];
  const selected = parseDate(date);
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const offset = Math.round((selected - today) / 86400000);
  const routines = [
    { id: "routine-morning", start: "06:30", end: "07:30", routine: true, title: languageText("早起与健身", "Morning routine & gym", "Morgenroutine & Training") },
    { id: "routine-reading", start: "08:00", end: "08:30", routine: true, title: languageText("晨间阅读", "Morning reading", "Morgenlektüre") },
    { id: "routine-plan", start: "09:15", end: "09:35", routine: true, title: languageText("整理今日计划", "Review today's plan", "Tagesplan prüfen") },
    { id: "routine-cat", start: "21:30", end: "21:40", routine: true, title: languageText("给猫零食", "Cat treat", "Katzensnack") },
    { id: "routine-tidy", start: "22:00", end: "22:20", routine: true, title: languageText("每日整理", "Daily tidy", "Tägliches Aufräumen") },
  ];
  const oneOffByOffset = {
    "-1": [{ id: "writing-time", start: "16:00", end: "17:30", title: languageText("个人写作时间", "Personal writing time", "Persönliche Schreibzeit") }],
    0: [
      { id: "weekly-plan", start: "09:00", end: "09:45", title: languageText("整理本周计划", "Review the week plan", "Wochenplan ordnen") },
      { id: "reading-notes", start: "14:30", end: "15:15", title: languageText("整理阅读笔记", "Organise reading notes", "Lesenotizen ordnen") },
      { id: "evening-walk", start: "18:00", end: "19:00", title: languageText("傍晚散步", "Evening walk", "Abendspaziergang") },
    ],
    2: [{ id: "dentist", start: "08:00", end: "10:00", title: languageText("牙医检查", "Dentist appointment", "Zahnarzttermin") }],
    4: [{ id: "book-evening", allDay: true, title: languageText("朋友读书会", "Book evening with friends", "Bücherabend mit Freunden") }],
  };
  return [...(oneOffByOffset[offset] || []), ...routines].map(event => ({ ...event, date }));
}

function eventDuration(event) {
  if (event.allDay || !event.start || !event.end) return "";
  const [startHour, startMinute] = event.start.split(":").map(Number);
  const [endHour, endMinute] = event.end.split(":").map(Number);
  const minutes = Math.max(0, (endHour * 60 + endMinute) - (startHour * 60 + startMinute));
  if (!minutes) return "";
  if (currentLang === "zh") return minutes >= 60 && minutes % 60 === 0 ? `${minutes / 60} 小时` : `${minutes} 分钟`;
  if (currentLang === "de") return minutes >= 60 && minutes % 60 === 0 ? `${minutes / 60} Std.` : `${minutes} Min.`;
  return minutes >= 60 && minutes % 60 === 0 ? `${minutes / 60} hr` : `${minutes} min`;
}

function scheduleEventMarkup(event, compact = false) {
  const time = event.allDay ? tr("dayPlan.allDay") : event.start;
  const duration = eventDuration(event);
  const details = [...new Set([duration, event.calendarName, event.accountLabel].filter(Boolean))];
  return `<article class="day-schedule-event ${event.routine ? "routine" : ""} ${event.allDay ? "all-day" : ""}" style="--event-color:${escapeHtml(event.calendarColor || "#6f95c8")}">
    <time>${escapeHtml(time)}</time>
    <div><strong>${escapeHtml(event.title)}</strong>${details.length ? `<small>${details.map(escapeHtml).join(" · ")}</small>` : ""}</div>
    ${event.routine && !compact ? `<span class="routine-label">${escapeHtml(tr("dayPlan.routine"))}</span>` : ""}
  </article>`;
}

function renderDaySchedule() {
  const events = calendarEventsForDate(selectedPlanningDate);
  const important = events.filter(event => !event.routine);
  const routines = events.filter(event => event.routine);
  $("#dayScheduleList").innerHTML = important.length
    ? important.slice(0, 3).map(event => scheduleEventMarkup(event, true)).join("")
    : `<p class="day-schedule-empty">${tr("dayPlan.noEvents")}</p>`;
  const toggle = $("#toggleRoutineEvents");
  toggle.hidden = !routines.length;
  toggle.setAttribute("aria-expanded", String(dayPlanRoutinesExpanded));
  $("span", toggle).textContent = dayPlanRoutinesExpanded ? tr("dayPlan.routinesShown") : tr("dayPlan.routinesHidden", { count: routines.length });
  $("b", toggle).textContent = dayPlanRoutinesExpanded ? "⌃" : "⌄";
  $("#routineEventList").hidden = !dayPlanRoutinesExpanded;
  $("#routineEventList").innerHTML = routines.map(event => scheduleEventMarkup(event)).join("");
}

function formatDayPlanDialogDate(date) {
  const value = parseDate(date);
  if (currentLang === "zh") return `${value.getMonth() + 1}月${value.getDate()}日 · ${weekdayName(value.getDay())}`;
  const locale = currentLang === "de" ? "de-DE" : "en-GB";
  return `${new Intl.DateTimeFormat(locale, { month: "long", day: "numeric" }).format(value)} · ${weekdayName(value.getDay())}`;
}

function renderDayPlanDialog() {
  const events = calendarEventsForDate(selectedPlanningDate);
  const ordered = [...events].sort((a, b) => Number(Boolean(b.allDay)) - Number(Boolean(a.allDay)) || String(a.start || "").localeCompare(String(b.start || "")));
  $("#dayPlanDialogDate").textContent = formatDayPlanDialogDate(selectedPlanningDate);
  $("#dayPlanTimeline").innerHTML = ordered.map(event => scheduleEventMarkup(event)).join("");
}

function openDayPlanDialog() {
  renderDayPlanDialog();
  $("#dayPlanDialog").showModal();
}

function renderDayRoll() {
  const selected = parseDate(selectedPlanningDate);
  const today = isoDate(new Date());
  $("#dayRoll").innerHTML = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(selected);
    date.setDate(selected.getDate() + index - 2);
    const key = isoDate(date);
    return `<button type="button" class="day-roll-item ${key === selectedPlanningDate ? "active" : ""} ${key === today ? "today" : ""}" data-date="${key}">
      <span>${weekdayShortName(date.getDay())}</span><strong>${date.getDate()}</strong>
    </button>`;
  }).join("");
  $$("#dayRoll .day-roll-item").forEach(button => button.addEventListener("click", () => selectPlanningDate(button.dataset.date)));
}

function selectPlanningDate(date, options = {}) {
  selectedPlanningDate = date;
  dayPlanRoutinesExpanded = false;
  const selected = parseDate(date);
  cursor = new Date(selected);
  setDailyToolPage("journal", { smooth: false });
  renderAll();
  void loadGoogleCalendarMonth(selected);
  if (options.scroll) $(".daily-planning-grid")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function shiftPlanningDay(amount) {
  const date = parseDate(selectedPlanningDate);
  date.setDate(date.getDate() + amount);
  selectPlanningDate(isoDate(date));
}

function isFutureDate(date) {
  return date > isoDate(new Date());
}

function updateDailyToolControls() {
  dailyToolPage = "journal";
  const card = $(".daily-tool-card");
  if (card) card.dataset.toolPage = dailyToolPage;
  $$('[data-daily-tool]').forEach(button => {
    const active = button.dataset.dailyTool === dailyToolPage;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  $$('[data-daily-tool-page]').forEach(button => {
    const active = button.dataset.dailyToolPage === dailyToolPage;
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "true" : "false");
  });
  const journal = $("#journalToolPanel");
  const focus = $("#focusToolPanel");
  journal?.setAttribute("aria-hidden", String(dailyToolPage !== "journal"));
  focus?.setAttribute("aria-hidden", String(dailyToolPage !== "focus"));
  if (journal) journal.inert = dailyToolPage !== "journal";
  if (focus) focus.inert = dailyToolPage !== "focus";
}

function setDailyToolPage(page, options = {}) {
  const nextPage = "journal";
  updateDailyToolControls(nextPage);
  const viewport = $("#dailyToolViewport");
  if (!viewport) return;
  const left = nextPage === "focus" ? viewport.clientWidth : 0;
  if (typeof viewport.scrollTo === "function") {
    viewport.scrollTo({ left, behavior: options.smooth === false ? "auto" : "smooth" });
  } else {
    viewport.scrollLeft = left;
  }
}

function syncDailyToolPageFromScroll() {
  const viewport = $("#dailyToolViewport");
  if (!viewport?.clientWidth) return;
  updateDailyToolControls(viewport.scrollLeft >= viewport.clientWidth / 2 ? "focus" : "journal");
}

function voiceContextTerms(date) {
  const terms = [];
  const add = value => {
    const term = String(value || "").replace(/\s+/g, " ").trim();
    if (!term || terms.some(existing => existing.toLocaleLowerCase() === term.toLocaleLowerCase())) return;
    if (terms.length < 16) terms.push(term.slice(0, 64));
  };

  activeHabits(date).forEach(habit => add(habit.name));
  add(state.focusSettings?.defaultTopic);
  [...(state.focusSessions || [])].reverse().slice(0, 12).forEach(session => add(session.label));
  (state.weeklyGoals[isoWeekKey(parseDate(date))] || []).forEach(goal => add(goal.text));
  (state.longTermGoals || []).filter(goal => (goal.status || "active") === "active").forEach(goal => add(goal.name));
  return terms;
}

function renderHomeJournal() {
  const future = isFutureDate(selectedPlanningDate);
  const textarea = $("#homeDayNote");
  textarea.value = getLog(selectedPlanningDate).note || "";
  textarea.disabled = future;
  $(".daily-journal-card").classList.toggle("future-locked", future);
  $("#journalAvailability").textContent = future ? tr("journal.futureLocked") : "";
  voiceReflection?.setContext({
    date: selectedPlanningDate,
    isToday: selectedPlanningDate === isoDate(new Date()),
    disabled: future,
    terms: voiceContextTerms(selectedPlanningDate),
  });
}

// Voice into any writing field (user 10/22: weekly review gets voice too). Hosted: the existing voice
// reflection dialog (transcribe + refine) writes into the field; local/offline: the browser's own dictation.
let voiceTarget = null;
function appendToField(field, text) {
  const value = field.value.trimEnd();
  field.value = value ? `${value}\n${text.trim()}` : text.trim();
  field.dispatchEvent(new Event("input", { bubbles: true }));
  autoGrowTextarea?.(field);
}
function attachVoiceInput(field) {
  if (!field || field.dataset.voice) return;
  field.dataset.voice = "1";
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "field-voice-button";
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg><span></span>';
  const label = () => { button.querySelector("span").textContent = button.classList.contains("is-listening") ? languageText("正在听…点按结束", "Listening… tap to stop", "Hört zu … tippen zum Beenden") : languageText("语音输入", "Dictate", "Diktieren"); button.setAttribute("aria-label", button.querySelector("span").textContent); };
  label();
  let recognition = null;
  button.addEventListener("click", () => {
    if (voiceReflection) { voiceReflection.setContext({ date: isoDate(new Date()), isToday: true, disabled: false }); voiceReflection.open(); voiceTarget = text => appendToField(field, text); return; }
    if (!Speech) { showToast(languageText("这个浏览器不支持语音输入，可用 Safari 或 Chrome", "This browser has no dictation — try Safari or Chrome", "Dieser Browser kann nicht diktieren — Safari oder Chrome versuchen")); return; }
    if (recognition) { recognition.stop(); return; }
    recognition = new Speech();
    recognition.lang = { zh: "zh-CN", de: "de-DE" }[currentLang] || "en-US";
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.onresult = event => { const text = [...event.results].slice(event.resultIndex).filter(r => r.isFinal).map(r => r[0].transcript).join(""); if (text.trim()) appendToField(field, text); };
    recognition.onerror = event => { if (event.error !== "aborted") showToast(languageText("没有听清，请再试一次", "Didn't catch that — try again", "Nicht verstanden — bitte noch einmal")); };
    recognition.onend = () => { recognition = null; button.classList.remove("is-listening"); label(); };
    recognition.start();
    button.classList.add("is-listening"); label();
  });
  field.after(button);
}

async function saveVoiceReflection({ date, text }) {
  if (voiceTarget) { const target = voiceTarget; voiceTarget = null; target(text); return; }
  if (isFutureDate(date)) throw new Error("Voice reflection cannot be saved to a future date");
  if (cloudMode && !authExpired) await pullCloudState();
  const existing = getLog(date).note || "";
  const note = window.LifeLedgerVoiceCheckin.appendReflection(existing, text);
  state.logs[date] = { ...getLog(date), note };
  saveState({ skipCloud: true });
  renderHomeJournal();
  if (cloudMode) await pushCloudState();
}

function initVoiceReflection() {
  const button = $("#voiceReflectionButton");
  const dialog = $("#voiceReflectionDialog");
  if (!button) return;
  button.hidden = !hostedCloudMode;
  button.addEventListener("click", () => { voiceTarget = null; }, true); // Today's own voice button always writes the day note
  attachVoiceInput($("#weeklyOutputText"));
  if (!hostedCloudMode) return;
  if (!window.LifeLedgerVoiceCheckin || !dialog) {
    button.disabled = true;
    button.querySelector("span").textContent = languageText("语音服务正在载入", "Voice service loading", "Sprachdienst wird geladen");
    console.warn("Voice reflection UI could not initialize");
    return;
  }
  try {
    voiceReflection = window.LifeLedgerVoiceCheckin.create({
      button,
      dialog,
      enabled: true,
      language: currentLang,
      context: {
        date: selectedPlanningDate,
        isToday: selectedPlanningDate === isoDate(new Date()),
        disabled: isFutureDate(selectedPlanningDate),
        terms: voiceContextTerms(selectedPlanningDate),
      },
      onSave: saveVoiceReflection,
      onToast: showToast,
    });
  } catch (error) {
    button.hidden = false;
    button.disabled = true;
    console.warn("Voice reflection UI could not initialize", error);
  }
}

function initPhotoMemories() {
  if (!window.LifeLedgerPhotoMemories) return;
  photoMemories = window.LifeLedgerPhotoMemories.create({
    section: $("#moodPhotoSection"),
    enabled: photosEnabled,
    storage: hostedCloudMode ? "cloud" : "local",
    language: currentLang,
    onToast: showToast,
    onChange: ({ date, photos }) => {
      calendarPhotosByDate.set(date, photos);
      calendarPhotoLoadedMonths.delete(date.slice(0, 7));
      renderCalendar();
      if ($("#dayDrawer")?.classList.contains("open") && selectedDate === date) renderDrawerMemory(date);
      if ($("#timelineView")?.classList.contains("active")) void renderTimeline();
    },
  });
}

async function loadCalendarPhotoMonth(date) {
  if (!photoMemories || !photosEnabled) return;
  const key = monthKey(date);
  if (calendarPhotoLoadedMonths.has(key) || calendarPhotoLoadingMonths.has(key)) return;
  calendarPhotoLoadingMonths.add(key);
  const year = date.getFullYear();
  const month = date.getMonth();
  const from = isoDate(new Date(year, month, 1, 12));
  const to = isoDate(new Date(year, month + 1, 0, 12));
  try {
    const photos = await photoMemories.listRange(from, to);
    [...calendarPhotosByDate.keys()].filter(day => day >= from && day <= to).forEach(day => calendarPhotosByDate.delete(day));
    photos.forEach(photo => calendarPhotosByDate.set(photo.date, [...(calendarPhotosByDate.get(photo.date) || []), photo]));
    calendarPhotoLoadedMonths.add(key);
    if (monthKey(cursor) === key) renderCalendar();
    if ($("#dayDrawer")?.classList.contains("open") && selectedDate.slice(0, 7) === key) renderDrawerMemory(selectedDate);
  } catch {
    // Calendar memory markers are optional; the photo editor keeps its own actionable status.
  } finally {
    calendarPhotoLoadingMonths.delete(key);
  }
}

function habitCard(habit, date, done, locked = false) {
  const v = versionFor(habit, date);
  const target = habitMetaLabel(v);
  const periodNote = countsTowardDaily(habit, date) ? "" : `<span class="period-note">${tr("foundations.periodNote")}</span>`;
  const transitionName = `habit-${String(habit.id).replace(/[^a-z0-9_-]/gi, "-")}`;
  return `<article class="habit-card ${done ? "completed" : ""} ${locked ? "future-locked" : ""}" data-id="${habit.id}" role="button" tabindex="${locked ? "-1" : "0"}" aria-pressed="${done}" ${locked ? 'aria-disabled="true"' : ""} style="${habitStyle(habit)};view-transition-name:${transitionName}">
    <div class="habit-card-top"><span class="habit-icon">${renderIcon(iconKey(habit))}</span><span class="habit-check">✓</span></div>
    <h3>${escapeHtml(displayHabitName(habit))}</h3><p>${target}</p>${periodNote}
  </article>`;
}
function toggleHabit(date, id) {
  if (isFutureDate(date)) return;
  if (document.querySelector(`#todayHabits .habit-card.just-checked[data-id="${CSS.escape(id)}"]`)) return; // pop in flight
  const log = { ...getLog(date), completed: [...getLog(date).completed] };
  const scored = activeHabits(date).filter(habit => countsTowardDaily(habit, date));
  const wasComplete = scored.length > 0 && scored.every(habit => log.completed.includes(habit.id));
  const i = log.completed.indexOf(id);
  if (i >= 0) log.completed.splice(i, 1); else log.completed.push(id);
  const commit = () => {
    state.logs[date] = log;
    saveState();
    renderAll();
    if ($("#dayDrawer").classList.contains("open")) renderDrawer();
  };
  // Reorder animation only when no card changes carousel page; a card moving to another page
  // would otherwise visibly fly out of the foundations card.
  const perPage = Number(document.querySelector('[data-card="habits"]')?.dataset.per) || HABITS_PER_PAGE;
  const pageOf = ids => new Map(orderedTodayHabits(activeHabits(date), ids).map((h, n) => [h.id, Math.floor(n / perPage)]));
  const pagesBefore = pageOf(getLog(date).completed), pagesAfter = pageOf(log.completed);
  const staysOnPage = [...pagesBefore].every(([hid, pg]) => pagesAfter.get(hid) === pg);
  const animateReorder = date === isoDate(new Date())
    && staysOnPage
    && $("#todayView").classList.contains("active")
    && typeof document.startViewTransition === "function"
    && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (animateReorder) {
    document.documentElement.classList.add("habit-reordering");
    const finishReorder = () => document.documentElement.classList.remove("habit-reordering");
    document.startViewTransition(commit).finished.then(finishReorder, finishReorder);
  } else {
    // The card would leave this page: check it in place first (original check pop), then re-sort.
    const card = document.querySelector(`#todayHabits .habit-card[data-id="${CSS.escape(id)}"]`);
    if (card && !staysOnPage) {
      card.classList.toggle("completed", log.completed.includes(id)); card.classList.add("just-checked");
      setTimeout(commit, 420);
    } else commit();
  }
  const isComplete = scored.length > 0 && scored.every(habit => log.completed.includes(habit.id));
  if (!wasComplete && isComplete) showCelebration();
  showToast(i >= 0 ? tr("toast.habitOff") : tr("toast.habitOn"));
}
function renderMoodReasonSummary(selector, log) {
  const button = $(selector);
  if (!button) return;
  const reason = String(log?.moodReason || "").replace(/\s+/g, " ").trim();
  button.hidden = !reason;
  button.textContent = reason ? tr("moodReason.summary", { reason }) : "";
  button.title = reason;
}

function applyMoodReasonLanguage() {
  const mood = pendingMood || "平静";
  setText("#moodReasonKicker", tr("moodReason.kicker"));
  setText("#moodReasonTitle", tr("moodReason.title", { mood: moodLabel(mood) }));
  setText("#moodReasonHelp", tr("moodReason.help"));
  setText("#moodReasonLabel", tr("moodReason.label"));
  setPlaceholder("#moodReasonText", tr("moodReason.placeholder"));
  setText("#skipMoodReason", tr("moodReason.skip"));
  setText("#saveMoodReason", tr("moodReason.save"));
  setAria(".close-mood-reason", tr("moodReason.close"));
}

function closeMoodReasonDialog() {
  const dialog = $("#moodReasonDialog");
  if (dialog.open) dialog.close();
  pendingMoodDate = null;
  pendingMood = "";
}

function openMoodReasonDialog(date, mood) {
  if (!mood || isFutureDate(date)) return;
  pendingMoodDate = date;
  pendingMood = mood;
  const log = getLog(date);
  $("#moodReasonIcon").innerHTML = moodCalendarIcon(mood);
  $("#moodReasonIcon").dataset.mood = mood === "低落" ? "low" : mood === "平静" ? "calm" : "good";
  $("#moodReasonMood").textContent = moodLabel(mood);
  $("#moodReasonDate").textContent = formatDateChip(parseDate(date));
  $("#moodReasonText").value = log.mood === mood ? log.moodReason || "" : "";
  applyMoodReasonLanguage();
  void photoMemories?.load(date);
  $("#moodReasonDialog").showModal();
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    window.setTimeout(() => $("#moodReasonText").focus({ preventScroll: true }), 60);
  }
}

function setMood(date, mood, promptReason = true) {
  if (isFutureDate(date)) return;
  const current = getLog(date);
  state.logs[date] = { ...current, mood, moodReason: current.mood === mood ? current.moodReason || "" : "" };
  saveState();
  renderAll();
  if ($("#dayDrawer").classList.contains("open")) renderDrawer();
  showToast(tr("toast.mood"));
  if (promptReason) openMoodReasonDialog(date, mood);
}

function saveMoodReason(event) {
  event.preventDefault();
  if (!pendingMoodDate || !pendingMood) return;
  const date = pendingMoodDate;
  const mood = pendingMood;
  const reason = $("#moodReasonText").value.trim();
  state.logs[date] = { ...getLog(date), mood, moodReason: reason };
  saveState();
  closeMoodReasonDialog();
  renderAll();
  if ($("#dayDrawer").classList.contains("open")) renderDrawer();
  showToast(tr("toast.moodReason"));
}

function moodCalendarIcon(mood) {
  const paths = moodCalendarIcons[mood];
  return paths ? `<svg viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>` : "";
}

function moodCalendarClass(mood) {
  return mood === "低落" ? "mood-low" : mood === "平静" ? "mood-calm" : mood === "很好" ? "mood-good" : "mood-none";
}

function calendarHeatLevel(progress) {
  if (!progress) return 0;
  if (progress < 34) return 1;
  if (progress < 67) return 2;
  if (progress < 100) return 3;
  return 4;
}

function renderCalendarLegend() {
  const legend = $(".calendar-legend");
  if (!legend) return;
  legend.dataset.mode = calendarViewMode;
  legend.innerHTML = calendarViewMode === "mood"
    ? `<span><i class="legend-mood mood-good">${moodCalendarIcon("很好")}</i>${tr("calendar.moodGood")}</span><span><i class="legend-mood mood-calm">${moodCalendarIcon("平静")}</i>${tr("calendar.moodCalm")}</span><span><i class="legend-mood mood-low">${moodCalendarIcon("低落")}</i>${tr("calendar.moodLow")}</span>`
    : `<span><i class="legend-heat heat-0"></i>${tr("calendar.heatNone")}</span><span><i class="legend-heat heat-1"></i>${tr("calendar.heatLow")}</span><span><i class="legend-heat heat-2"></i>${tr("calendar.heatMedium")}</span><span><i class="legend-heat heat-4"></i>${tr("calendar.heatHigh")}</span>`;
}

function setCalendarViewMode(mode) {
  calendarViewMode = mode === "heatmap" ? "heatmap" : "mood";
  localStorage.setItem(CALENDAR_VIEW_KEY, calendarViewMode);
  notePrefChange();
  renderCalendar();
}

function renderCalendar() {
  const year = cursor.getFullYear(), month = cursor.getMonth();
  $("#calendarTitle").textContent = tr("calendar.title", { year, month: month + 1, monthName: monthName(month) });
  syncDemoCalendarPhotos(cursor);
  const first = new Date(year, month, 1, 12);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset, 12);
  const today = isoDate(new Date());
  const cells = [];
  const currentWeek = isoWeekKey(new Date());
  let monthProgressTotal = 0;
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const key = isoDate(d), log = getLog(key), scoredHabits = dailyHabits(key);
    const completed = scoredHabits.filter(h => log.completed.includes(h.id)).length;
    const progress = scoredHabits.length ? Math.round(completed / scoredHabits.length * 100) : 0;
    if (d.getMonth() === month) monthProgressTotal += progress;
    const schedule = calendarEventsForDate(key);
    const dayPhotos = calendarPhotosByDate.get(key) || [];
    const reason = String(log.moodReason || "").trim();
    const moodClass = calendarViewMode === "mood" ? moodCalendarClass(log.mood) : "";
    const heatClass = calendarViewMode === "heatmap" ? `heat-${calendarHeatLevel(progress)}` : "";
    const moodText = log.mood ? moodLabel(log.mood) : tr("calendar.empty");
    const memoryStatus = [reason ? tr("moodReason.summary", { reason }) : "", dayPhotos.length ? tr("drawer.photoCount", { count: dayPhotos.length }) : ""].filter(Boolean).join(" · ");
    const accessibleStatus = [calendarViewMode === "mood" ? moodText : `${progress}%`, memoryStatus].filter(Boolean).join(" · ");
    cells.push(`<button class="calendar-day ${moodClass} ${heatClass} ${d.getMonth() !== month ? "outside" : ""} ${key === today ? "today" : ""} ${key > today ? "future" : ""} ${isoWeekKey(d) === currentWeek ? "current-week" : ""}" data-date="${key}" aria-label="${escapeHtml(formatDateChip(d))} · ${escapeHtml(accessibleStatus)}">
      <span class="day-number">${d.getDate()}</span>${calendarViewMode === "mood" && log.mood ? `<span class="day-mood mood-${log.mood === "低落" ? "low" : log.mood === "平静" ? "calm" : "good"}">${moodCalendarIcon(log.mood)}</span>` : ""}
      ${reason || dayPhotos.length ? `<span class="day-memory-status">${dayPhotos.length ? `<i class="day-photo-marker" title="${escapeHtml(tr("drawer.photoCount", { count: dayPhotos.length }))}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="15" rx="3"/><circle cx="9" cy="11" r="2"/><path d="m5 18 5-4 3 2 3-3 3 5"/></svg><b>${dayPhotos.length}</b></i>` : ""}${reason ? `<i class="day-reason-marker" title="${escapeHtml(reason)}">“</i>` : ""}</span>` : ""}
      ${schedule.length ? `<span class="day-calendar-status" title="${escapeHtml(tr("calendarSync.calendarEvents"))}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 9.5h17"/></svg><b>${schedule.length}</b></span>` : ""}
      ${calendarViewMode === "heatmap" ? `<span class="day-percent">${progress}%</span>` : ""}
    </button>`);
  }
  $("#calendarMonthMark").textContent = String(month + 1).padStart(2, "0");
  $("#monthCompletion").textContent = `${Math.round(monthProgressTotal / new Date(year, month + 1, 0).getDate())}%`;
  $("#monthCompletion").parentElement.lastChild.textContent = ` ${tr("calendar.monthCompletion")}`;
  $("#calendarGrid").dataset.mode = calendarViewMode;
  $("#calendarGrid").innerHTML = cells.join("");
  $$('[data-calendar-view]').forEach(button => {
    const active = button.dataset.calendarView === calendarViewMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderCalendarLegend();
  void loadCalendarPhotoMonth(cursor);
  $$(".calendar-day").forEach(day => day.addEventListener("click", () => {
    if (isFutureDate(day.dataset.date)) selectPlanningDate(day.dataset.date, { scroll: true });
    else openDrawer(day.dataset.date);
  }));
}

function renderReview() {
  const key = monthKey(cursor), year = cursor.getFullYear(), month = cursor.getMonth();
  $("#reviewTitle").textContent = tr("review.title", { year, month: month + 1, monthName: monthName(month) });
  setText("#reviewDetailedSummary", tr("review.detailedSummary"));
  const days = new Date(year, month + 1, 0).getDate();
  const monthDates = Array.from({ length: days }, (_, i) => isoDate(new Date(year, month, i + 1, 12)));
  const todayKey = isoDate(new Date());
  const elapsedDates = monthDates.filter(date => date <= todayKey);
  const habits = activeHabits(monthDates[monthDates.length - 1]);
  setInsightView(insightView);
  renderReviewInsights();
  renderReviewTrendChart();
  renderReviewInspectorTable();
  renderInsightDashboard();
  $("#scoreGrid").innerHTML = habits.map(h => {
    const version = versionFor(h, monthDates[monthDates.length - 1]);
    const count = elapsedDates.filter(date => getLog(date).completed.includes(h.id)).length;
    if (version?.frequency === "daily") {
      const denominator = Math.max(1, elapsedDates.length);
      const rate = Math.round(count / denominator * 100);
      return `<article class="score-card"><div class="score-card-header"><span class="inline-habit-label">${renderIcon(iconKey(h))} ${escapeHtml(displayHabitName(h))}</span><span>${rate}%</span></div><strong>${count}<small> / ${denominator}</small></strong></article>`;
    }
    const groups = periodDateGroups(elapsedDates, version?.frequency);
    const target = periodTargetFor(version);
    const met = groups.filter(group => group.filter(date => getLog(date).completed.includes(h.id)).length >= target).length;
    const rate = Math.round(met / Math.max(1, groups.length) * 100);
    return `<article class="score-card period-score-card"><div class="score-card-header"><span class="inline-habit-label">${renderIcon(iconKey(h))} ${escapeHtml(displayHabitName(h))}</span><span>${rate}%</span></div><strong>${count}</strong><p>${tr("review.periodSummary", { met, periods: groups.length })}</p></article>`;
  }).join("");
  $("#barChart").innerHTML = monthDates.map((d, i) => {
    const p = completionFor(d);
    return `<i class="bar ${p >= 75 ? "high" : ""}" title="${tr("calendar.dayPercent", { day: i + 1, month: month + 1, percent: p })}" style="height:${Math.max(3, p)}%;animation-delay:${Math.min(i * 12, 250)}ms"></i>`;
  }).join("");
  renderPeriodicGoals(monthDates);
  $("#reviewText").value = state.reviews[key] || "";
  fitReviewText();
  renderFocusReview(year, month);
  window.LifeLedgerInteraction?.syncSegments(document);
}

function periodDateGroups(dates, frequency) {
  if (!dates.length) return [];
  if (frequency === "monthly") return [dates];
  const groups = new Map();
  dates.forEach(date => {
    const key = isoWeekKey(parseDate(date));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(date);
  });
  return [...groups.values()];
}
function focusTopics(sessions) {
  return [...sessions.reduce((groups, session) => {
    const label = String(session.label || tr("focus.untitled")).trim() || tr("focus.untitled");
    groups.set(label, (groups.get(label) || 0) + focusSessionMinutes(session));
    return groups;
  }, new Map()).entries()].filter(([, minutes]) => minutes >= .5).sort((a, b) => b[1] - a[1]);
}

function renderFocusReview(year, month) {
  const weeks = new Set();
  for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day++) weeks.add(isoWeekKey(new Date(year, month, day, 12)));
  const keys = [...weeks];
  if (!keys.includes(selectedReviewWeek)) selectedReviewWeek = keys.includes(isoWeekKey(new Date())) ? isoWeekKey(new Date()) : keys[0];
  $("#focusReviewWeekSelect").innerHTML = keys.map(key => `<option value="${key}" ${key === selectedReviewWeek ? "selected" : ""}>${formatWeekRangeFull(key)}</option>`).join("");
  $("#focusReviewMonthSelect").innerHTML = Array.from({ length: 120 }, (_, index) => {
    const optionYear = 2026 + Math.floor(index / 12);
    const optionMonth = index % 12 + 1;
    const key = `${optionYear}-${String(optionMonth).padStart(2, "0")}`;
    return `<option value="${key}" ${key === selectedFocusReviewMonth ? "selected" : ""}>${escapeHtml(reviewPeriodLabel("month", key))}</option>`;
  }).join("");
  $$('[data-focus-review-scope]').forEach(button => button.classList.toggle("active", button.dataset.focusReviewScope === focusReviewScope));
  $("#focusReviewWeekField").hidden = focusReviewScope !== "week";
  $("#focusReviewMonthField").hidden = focusReviewScope !== "month";
  const chart = $("#focusReviewBars");
  chart.classList.toggle("month-view", focusReviewScope === "month");

  let total = 0;
  let byTopic = [];
  if (focusReviewScope === "month") {
    const [selectedYear, selectedMonth] = selectedFocusReviewMonth.split("-").map(Number);
    const dayCount = new Date(selectedYear, selectedMonth, 0).getDate();
    const daily = Array.from({ length: dayCount }, (_, index) => {
      const date = new Date(selectedYear, selectedMonth - 1, index + 1, 12);
      const minutes = focusSessionsBetween(isoDate(date), isoDate(date)).reduce((sum, session) => sum + focusSessionMinutes(session), 0);
      return { date, minutes };
    });
    const monthStart = `${selectedFocusReviewMonth}-01`;
    const monthEnd = isoDate(new Date(selectedYear, selectedMonth, 0, 12));
    const sessions = focusSessionsBetween(monthStart, monthEnd);
    total = sessions.reduce((sum, session) => sum + focusSessionMinutes(session), 0);
    byTopic = focusTopics(sessions);
    const previousDate = new Date(selectedYear, selectedMonth - 2, 1, 12);
    const previousKey = monthKey(previousDate);
    const previousTotal = focusSessionsBetween(`${previousKey}-01`, isoDate(new Date(previousDate.getFullYear(), previousDate.getMonth() + 1, 0, 12))).reduce((sum, session) => sum + focusSessionMinutes(session), 0);
    const difference = Math.round(total - previousTotal);
    const activeDays = daily.filter(item => item.minutes > 0).length;
    const max = Math.max(1, ...daily.map(item => item.minutes));
    const offset = (daily[0].date.getDay() + 6) % 7;
    chart.innerHTML = `${Array.from({ length: offset }, () => '<span class="focus-heatmap-spacer"></span>').join("")}${daily.map(item => {
      const level = item.minutes ? Math.max(.16, item.minutes / max) : 0;
      return `<span class="focus-heatmap-day" style="--focus-level:${level}" title="${escapeHtml(formatDateChip(item.date))} · ${Math.round(item.minutes)} ${escapeHtml(tr("focus.reviewUnit"))}"><b>${item.date.getDate()}</b><small>${item.minutes ? Math.round(item.minutes) : ""}</small></span>`;
    }).join("")}`;
    setText("#focusReviewRange", reviewPeriodLabel("month", selectedFocusReviewMonth));
    setText("#focusReviewComparison", total === 0 ? tr("focus.noFocus") : difference > 0 ? tr("focus.moreThanPreviousMonth", { minutes: difference }) : difference < 0 ? tr("focus.lessThanPreviousMonth", { minutes: Math.abs(difference) }) : tr("focus.sameAsPreviousMonth"));
    setText("#focusReviewMonthTotal", tr("focus.monthActivity", { days: activeDays, average: activeDays ? Math.round(total / activeDays) : 0 }));
  } else {
    const { monday, sunday } = weekDatesFromKey(selectedReviewWeek);
    const daily = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const minutes = focusSessionsBetween(isoDate(date), isoDate(date)).reduce((sum, session) => sum + focusSessionMinutes(session), 0);
      return { date, minutes };
    });
    total = daily.reduce((sum, item) => sum + item.minutes, 0);
    const sessions = focusSessionsBetween(isoDate(monday), isoDate(sunday));
    byTopic = focusTopics(sessions);
    const previous = weekDatesFromKey(shiftWeekKey(selectedReviewWeek, -1));
    const previousTotal = focusSessionsBetween(isoDate(previous.monday), isoDate(previous.sunday)).reduce((sum, session) => sum + focusSessionMinutes(session), 0);
    const difference = Math.round(total - previousTotal);
    const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const monthEnd = isoDate(new Date(year, month + 1, 0, 12));
    const monthTotal = focusSessionsBetween(monthStart, monthEnd).reduce((sum, session) => sum + focusSessionMinutes(session), 0);
    const max = Math.max(25, ...daily.map(item => item.minutes));
    chart.innerHTML = daily.map(item => `<span class="focus-review-day" title="${escapeHtml(formatDateChip(item.date))} · ${Math.round(item.minutes)} ${escapeHtml(tr("focus.reviewUnit"))}"><b>${item.minutes ? Math.round(item.minutes) : ""}</b><i style="height:${Math.max(4, item.minutes / max * 100)}%"></i><small>${escapeHtml(weekdayShortName(item.date.getDay()))}</small></span>`).join("");
    setText("#focusReviewRange", formatWeekRange(selectedReviewWeek));
    setText("#focusReviewComparison", total === 0 ? tr("focus.noFocus") : difference > 0 ? tr("focus.moreThanPrevious", { minutes: difference }) : difference < 0 ? tr("focus.lessThanPrevious", { minutes: Math.abs(difference) }) : tr("focus.sameAsPrevious"));
    setText("#focusReviewMonthTotal", tr("focus.monthTotal", { month: currentLang === "zh" ? `${month + 1}月` : monthName(month), minutes: Math.round(monthTotal) }));
  }
  setText("#focusReviewTotal", Math.round(total));
  $("#focusReviewBreakdown").hidden = !byTopic.length;
  $("#focusReviewBreakdown").innerHTML = byTopic.slice(0, 4).map(([label, minutes]) => `<span><b>${escapeHtml(label)}</b><small>${Math.round(minutes)} ${escapeHtml(tr("focus.reviewUnit"))}</small></span>`).join("");
}
function renderPeriodicGoals(dates) {
  const finalDate = dates[dates.length - 1];
  const habits = activeHabits(finalDate);
  if (!habits.length) {
    $("#analyticsMetricPicker").innerHTML = "";
    $("#weeklyResistance").innerHTML = `<div class="period-dashboard-empty"><span>${renderIcon("target")}</span><strong>${tr("review.noPeriodic")}</strong><p>${tr("review.noPeriodicHelp")}</p></div>`;
    return;
  }
  selectedAnalyticsHabitIds = selectedAnalyticsHabitIds.filter(id => habits.some(habit => habit.id === id));
  if (!selectedAnalyticsHabitIds.length) selectedAnalyticsHabitIds = habits.slice(0, 2).map(habit => habit.id);
  $("#analyticsMetricPicker").innerHTML = habits.map(habit => `<button type="button" class="analytics-metric-chip ${selectedAnalyticsHabitIds.includes(habit.id) ? "active" : ""}" data-habit="${habit.id}" style="--metric-color:${colors[habit.color]?.solid || colors.sage.solid}"><i></i>${escapeHtml(displayHabitName(habit))}</button>`).join("");
  $$("#analyticsMetricPicker .analytics-metric-chip").forEach(button => button.addEventListener("click", () => {
    const id = button.dataset.habit;
    if (selectedAnalyticsHabitIds.includes(id)) {
      if (selectedAnalyticsHabitIds.length > 1) selectedAnalyticsHabitIds = selectedAnalyticsHabitIds.filter(item => item !== id);
    } else if (selectedAnalyticsHabitIds.length < 2) {
      selectedAnalyticsHabitIds.push(id);
    } else {
      selectedAnalyticsHabitIds = [selectedAnalyticsHabitIds[1], id];
    }
    renderPeriodicGoals(dates);
  }));
  const selectedHabits = selectedAnalyticsHabitIds.map(id => habits.find(habit => habit.id === id)).filter(Boolean);
  const todayKey = isoDate(new Date());
  const elapsedDates = dates.filter(date => date <= todayKey);
  if (!elapsedDates.length) {
    $("#weeklyResistance").innerHTML = `<div class="period-dashboard-empty"><span>${renderIcon("chart")}</span><strong>${tr("review.noDataYet")}</strong></div>`;
    return;
  }
  const groups = new Map();
  elapsedDates.forEach(date => {
    const key = isoWeekKey(parseDate(date));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(date);
  });
  const periods = [...groups.values()].map(groupDates => ({ label: formatCompactDateSpan(groupDates[0], groupDates[groupDates.length - 1]), dates: groupDates }));
  const series = selectedHabits.map(habit => {
    const version = versionFor(habit, finalDate);
    const target = periodTargetFor(version);
    let cumulative = 0;
    const values = periods.map(period => {
      const count = period.dates.filter(date => getLog(date).completed.includes(habit.id)).length;
      cumulative += count;
      const rawRate = version.frequency === "daily"
        ? count / Math.max(1, period.dates.length) * 100
        : version.frequency === "monthly"
          ? cumulative / Math.max(1, target) * 100
          : count / Math.max(1, target) * 100;
      return { count, rate: Math.min(100, Math.round(rawRate)) };
    });
    return {
      habit,
      color: colors[habit.color]?.solid || colors.sage.solid,
      values,
      total: elapsedDates.filter(date => getLog(date).completed.includes(habit.id)).length,
      average: Math.round(values.reduce((sum, value) => sum + value.rate, 0) / Math.max(1, values.length)),
    };
  });
  const chartLeft = 28, chartRight = 306, chartTop = 12, chartBottom = 106;
  const xFor = index => periods.length === 1 ? 167 : chartLeft + index * ((chartRight - chartLeft) / (periods.length - 1));
  const yFor = rate => chartBottom - Math.min(100, rate) / 100 * (chartBottom - chartTop);
  const chartMarks = analyticsChartType === "bar"
    ? series.map((item, seriesIndex) => item.values.map((value, index) => {
        const groupWidth = Math.min(34, (chartRight - chartLeft) / Math.max(1, periods.length) * .62);
        const barWidth = groupWidth / Math.max(1, series.length) - 2;
        const x = xFor(index) - groupWidth / 2 + seriesIndex * (barWidth + 2);
        const y = yFor(value.rate);
        return `<rect class="analytics-bar" x="${x}" y="${y}" width="${barWidth}" height="${chartBottom - y}" rx="${Math.min(4, barWidth / 2)}" style="--series-color:${item.color}"><title>${escapeHtml(displayHabitName(item.habit))} · ${periods[index].label}: ${value.rate}%</title></rect>`;
      }).join("")).join("")
    : series.map(item => {
        const points = item.values.map((value, index) => ({ x: xFor(index), y: yFor(value.rate), value: value.rate }));
        const line = smoothDashboardPath(points);
        return `<path class="analytics-line" d="${line}" style="--series-color:${item.color}"/>${points.map((point, index) => `<circle class="analytics-point" cx="${point.x}" cy="${point.y}" r="3.8" style="--series-color:${item.color}"><title>${escapeHtml(displayHabitName(item.habit))} · ${periods[index].label}: ${point.value}%</title></circle>`).join("")}`;
      }).join("");
  const firstLabel = periods[0]?.label || "";
  const lastLabel = periods.at(-1)?.label || "";
  $("#weeklyResistance").innerHTML = `
    <div class="analytics-series-summary">
      ${series.map(item => `<div style="--series-color:${item.color}"><span><i></i>${escapeHtml(displayHabitName(item.habit))}</span><strong>${item.average}%</strong><small>${tr("review.monthlyAverage")} · ${item.total} ${tr("review.totalCheckins")}</small></div>`).join("")}
    </div>
    <div class="analytics-chart">
      <svg viewBox="0 0 320 128" role="img" aria-label="${tr("review.analyticsTitle")}">
        <text x="2" y="16">100%</text><text x="8" y="63">50%</text><text x="14" y="109">0</text>
        <line x1="28" y1="12" x2="306" y2="12"/><line x1="28" y1="59" x2="306" y2="59"/><line x1="28" y1="106" x2="306" y2="106"/>
        ${chartMarks}
      </svg>
      <div class="period-chart-axis"><span>${firstLabel}</span><span>${lastLabel !== firstLabel ? lastLabel : ""}</span></div>
    </div>`;
}

function smoothDashboardPath(points) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const middle = (previous.x + point.x) / 2;
    return `${path} C ${middle} ${previous.y}, ${middle} ${point.y}, ${point.x} ${point.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
}
function weekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
function isoWeekKey(date) { return `${date.getFullYear()}-W${String(weekNumber(date)).padStart(2, "0")}`; }
function shiftWeekKey(key, amount) {
  const { monday } = weekDatesFromKey(key);
  monday.setDate(monday.getDate() + amount * 7);
  return isoWeekKey(monday);
}
function weekDistance(fromKey, toKey) {
  const from = weekDatesFromKey(fromKey).monday;
  const to = weekDatesFromKey(toKey).monday;
  return Math.round((to - from) / 604800000);
}
function weekDatesFromKey(key) {
  const [yearText, weekText] = key.split("-W");
  const year = +yearText, week = +weekText;
  const jan4 = new Date(year, 0, 4, 12);
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (week - 1) * 7);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  return { monday, sunday };
}
function formatWeekRange(key) {
  const { monday, sunday } = weekDatesFromKey(key);
  const sameYear = monday.getFullYear() === sunday.getFullYear();
  if (currentLang === "zh") {
    return sameYear
      ? `${monday.getFullYear()}年${monday.getMonth() + 1}月${monday.getDate()}日 — ${sunday.getMonth() + 1}月${sunday.getDate()}日`
      : `${monday.getFullYear()}年${monday.getMonth() + 1}月${monday.getDate()}日 — ${sunday.getFullYear()}年${sunday.getMonth() + 1}月${sunday.getDate()}日`;
  }
  const locale = currentLang === "de" ? "de-DE" : "en-GB";
  const dayMonth = date => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(date);
  const fullDate = date => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(date);
  return sameYear ? `${dayMonth(monday)} — ${dayMonth(sunday)} ${sunday.getFullYear()}` : `${fullDate(monday)} — ${fullDate(sunday)}`;
}

function formatCompactWeekRange(key) {
  const { monday, sunday } = weekDatesFromKey(key);
  if (currentLang === "zh") {
    return monday.getMonth() === sunday.getMonth()
      ? `${monday.getMonth() + 1}月${monday.getDate()}—${sunday.getDate()}日`
      : `${monday.getMonth() + 1}月${monday.getDate()}日—${sunday.getMonth() + 1}月${sunday.getDate()}日`;
  }
  const locale = currentLang === "de" ? "de-DE" : "en-GB";
  const formatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  return `${formatter.format(monday)} — ${formatter.format(sunday)}`;
}

function formatCompactDateSpan(startValue, endValue) {
  const start = typeof startValue === "string" ? parseDate(startValue) : startValue;
  const end = typeof endValue === "string" ? parseDate(endValue) : endValue;
  if (currentLang === "zh") {
    return start.getMonth() === end.getMonth()
      ? `${start.getMonth() + 1}月${start.getDate()}—${end.getDate()}日`
      : `${start.getMonth() + 1}月${start.getDate()}日—${end.getMonth() + 1}月${end.getDate()}日`;
  }
  const locale = currentLang === "de" ? "de-DE" : "en-GB";
  const formatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  return start.getTime() === end.getTime() ? formatter.format(start) : `${formatter.format(start)} — ${formatter.format(end)}`;
}

// The week picker names the whole Monday–Sunday week, the same span the numbers under it cover (user 10/27:
// "26 Oct — 31 Oct" above "26 Oct — 1 Nov" was a mismatch).
function formatWeekRangeFull(key) {
  const { monday, sunday } = weekDatesFromKey(key);
  return formatCompactDateSpan(monday, sunday);
}

function renderHabitSettings() {
  $('#habitInspectorForm').hidden = !state.habits.length;
  if (!state.habits.some(h=>h.id===selectedHabitSettingsId)) selectedHabitSettingsId=null;
  const activeCount = state.habits.filter(habit => habit.active).length;
  $("#habitSummary").textContent = tr("habits.summary", { count: state.habits.length, active: activeCount });
  $('#habitLibraryKicker').textContent=languageText('把好习惯，养成自己的节奏','MAKE GOOD HABITS YOUR OWN','GUTE GEWOHNHEITEN, DEIN RHYTHMUS');
  $('#habitLibraryTitle').textContent=languageText('一点一点，变成日常。','Small things, part of your day.','Kleine Dinge werden Alltag.');
  const daily=state.habits.filter(h=>h.active && versionFor(h,isoDate(new Date()))?.frequency==='daily').length;
  const periodic=state.habits.filter(h=>h.active && ['weekly','monthly'].includes(versionFor(h,isoDate(new Date()))?.frequency)).length;
  $('#habitLibraryOverview').innerHTML=[
    [languageText('启用中','Active','Aktiv'),activeCount,languageText('按自己的节奏','At your own pace','Im eigenen Tempo')],
    [languageText('每天的习惯','Daily habits','Tägliche Gewohnheiten'),daily,languageText('让小事稳定发生','Make small things steady','Kleines beständig tun')],
    [languageText('周期习惯','Periodic habits','Periodische Gewohnheiten'),periodic,languageText('按周或按月安排','Weekly or monthly','Wöchentlich oder monatlich')],
  ].map(([label,value,note])=>`<article><span>${escapeHtml(label)}</span><strong>${value}</strong><small>${escapeHtml(note)}</small></article>`).join('');
  const labels={all:languageText('全部','All','Alle'),active:languageText('启用中','Active','Aktiv'),paused:languageText('已暂停','Paused','Pausiert')};
  $$('#habitLibraryFilters button').forEach(b=>{b.textContent=labels[b.dataset.habitFilter];b.classList.toggle('active',b.dataset.habitFilter===habitLibraryFilter);b.setAttribute('aria-pressed',String(b.dataset.habitFilter===habitLibraryFilter));});
  $('#habitLibraryFilters').setAttribute('aria-label',languageText('筛选习惯','Filter habits','Gewohnheiten filtern'));
  $('#habitLibrarySearchLabel').textContent=languageText('寻找一个习惯','Find a habit','Gewohnheit suchen');
  $('#habitLibrarySearch').placeholder=languageText('搜索习惯','Search habits','Gewohnheiten suchen');
  $('#habitEditorKicker').textContent=languageText('习惯设置','HABIT SETTINGS','GEWOHNHEIT EINSTELLEN');
  $('#habitEditorHelp').textContent=languageText('频率、目标与备注按生效日期保存；名称、图标和启用状态全局更新。','Frequency, targets and notes use the effective date. Name, icon and enabled state change globally.','Häufigkeit, Ziele und Notizen gelten ab dem gewählten Datum. Name, Symbol und Aktivierung ändern sich global.');
  const fields={habitInspectorBasicsLegend:languageText('基础','Basics','Grundlagen'),habitInspectorTrackingLegend:languageText('记录方式','Tracking','Erfassung'),habitInspectorScheduleLegend:languageText('安排','Schedule','Zeitplan'),habitInspectorNameLabel:tr('dialog.name'),habitInspectorNoteLabel:tr('dialog.note'),habitInspectorIconLabel:tr('dialog.icon'),habitInspectorColorLabel:tr('dialog.color'),habitInspectorTrackingModeLabel:tr('dialog.trackingMode'),habitInspectorTrackingCheckLabel:tr('dialog.trackingCheck'),habitInspectorTrackingMeasuredLabel:tr('dialog.trackingMeasured'),habitInspectorTargetLabel:tr('dialog.target'),habitInspectorUnitLabel:tr('dialog.unit'),habitInspectorFrequencyLabel:tr('dialog.frequency'),habitInspectorScheduleLabel:tr('dialog.schedule'),habitInspectorPeriodTargetLabel:tr('dialog.periodTarget'),habitInspectorEffectiveDateLabel:tr('dialog.effectiveDate'),habitInspectorCountsLabel:tr('dialog.dailyScore'),habitInspectorActiveLabel:tr('habits.active'),inspectorDeleteHabitButton:tr('dialog.delete'),inspectorSaveHabitButton:tr('dialog.save')};
  Object.entries(fields).forEach(([id,label])=>setText('#'+id,label));
  $('#habitInspectorForm [name="frequency"]').querySelectorAll('option').forEach(option=>{option.textContent=option.value==='daily'?tr('habits.daily'):option.value==='weekly'?languageText('每周','Weekly','Wöchentlich'):languageText('每月','Monthly','Monatlich');});
  if (!state.habits.length) {
    $("#habitSettingsList").innerHTML = hairlineEmptyMarkup("./assets/hairline/empty-habits.svg", tr("habits.emptyTitle"), tr("habits.emptyHelp"));
    hydrateHairlineMounts($("#habitsView"));
    return;
  }
  const visible=state.habits.filter(h=>(habitLibraryFilter==='all'||(habitLibraryFilter==='active'?h.active:!h.active)) && displayHabitName(h).toLocaleLowerCase().includes(habitLibrarySearch.toLocaleLowerCase()));
  $("#habitSettingsList").innerHTML = visible.map(h => {
    const v = versionFor(h, isoDate(new Date())) || h.versions[h.versions.length - 1];
    const selected = h.id === selectedHabitSettingsId;
    const target = trackingModeFor(v) === "measured" ? `${v.target}${displayUnit(v.unit) ? ` ${displayUnit(v.unit)}` : ""}` : habitMetaLabel(v);
    return `<article class="setting-row habit-settings-row ${h.active ? "" : "disabled"} ${selected ? "selected" : ""}" data-id="${h.id}" style="${habitStyle(h)}">
      <button class="habit-drag-handle" type="button" data-id="${h.id}" aria-label="${tr("habits.reorder", { habit: displayHabitName(h) })}"><span aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span></button>
      <span class="habit-icon habit-list-icon">${renderIcon(iconKey(h))}</span>
      <button class="setting-main habit-settings-main" type="button" data-id="${h.id}">
        <strong>${escapeHtml(displayHabitName(h))}</strong>
        <span>${escapeHtml([frequencyLabel(v), scheduleLabel(v)].filter(Boolean).join(" · "))}</span>
      </button>
      <span class="habit-settings-target">${escapeHtml(trackingModeFor(v) === "measured" ? target : "")}</span>
      <label class="habit-enabled-switch"><input class="desktop-switch habit-enabled-toggle" type="checkbox" role="switch" data-id="${h.id}" ${h.active ? "checked" : ""} aria-label="${escapeHtml(displayHabitName(h))}" /><span class="sr-only">${escapeHtml(h.active ? tr("habits.active") : tr("habits.inactive"))}</span></label>
    </article>`;
  }).join("") || `<p class="habit-filter-empty">${escapeHtml(languageText('没有匹配的习惯。试试其他筛选。','No matching habits. Try another filter.','Keine passende Gewohnheit. Einen anderen Filter versuchen.'))}</p>`;
  $$(".habit-settings-main").forEach(button => button.addEventListener("click", () => {
    selectedHabitSettingsId = button.dataset.id;
    populateHabitInspectorForm(selectedHabitSettingsId);
    renderHabitSettings();
    if (matchMedia('(max-width:1100px)').matches) $('#habitInspectorForm').scrollIntoView({block:'start'});
  }));
  $$(".habit-settings-row").forEach(row => {
    row.addEventListener("contextmenu", event => openHabitContextMenu(event, row.dataset.id, selectedPlanningDate));
  });
  $$(".habit-enabled-toggle").forEach(input => input.addEventListener("change", () => {
    const habit = state.habits.find(item => item.id === input.dataset.id);
    if (!habit) return;
    habit.active = input.checked;
    saveState();
    showToast(tr(habit.active ? "habits.resumed" : "habits.paused", { habit: displayHabitName(habit) }));
    renderHabitSettings();
    if (habitLibraryFilter!=='all') $('#habitLibraryFilters .active')?.focus({preventScroll:true});
  }));
  $$(".habit-drag-handle").forEach(bindHabitDragHandle);
  if (!selectedHabitSettingsId && state.habits[0]) {
    selectedHabitSettingsId = state.habits[0].id;
    populateHabitInspectorForm(selectedHabitSettingsId);
  }
  const selected=state.habits.find(h=>h.id===selectedHabitSettingsId);
  $('#habitEditorTitle').textContent=selected?displayHabitName(selected):languageText('选择一个习惯','Choose a habit','Gewohnheit wählen');
}

function bindHabitDragHandle(handle) {
  handle.addEventListener("pointerdown", event => {
    if (event.button !== 0 || habitDrag) return;
    const row = handle.closest(".setting-row");
    const container = row?.parentElement;
    if (!row || !container) return;
    event.preventDefault();
    habitDrag = { pointerId: event.pointerId, handle, row, container, moved: false };
    handle.setPointerCapture?.(event.pointerId);
    row.classList.add("habit-dragging");
    document.body.classList.add("habit-is-dragging");
  });
  handle.addEventListener("keydown", event => {
    const direction = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
    if (!direction) return;
    event.preventDefault();
    moveHabit(handle.dataset.id, direction);
  });
}

function moveHabitDrag(event) {
  if (!habitDrag || event.pointerId !== habitDrag.pointerId) return;
  event.preventDefault();
  const { row, container } = habitDrag;
  if (event.clientY < 76) window.scrollBy(0, -14);
  else if (event.clientY > window.innerHeight - 76) window.scrollBy(0, 14);
  row.style.pointerEvents = "none";
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".setting-row");
  row.style.pointerEvents = "";
  if (!target || target === row || target.parentElement !== container) return;
  const after = event.clientY > target.getBoundingClientRect().top + target.offsetHeight / 2;
  container.insertBefore(row, after ? target.nextSibling : target);
  habitDrag.moved = true;
}

function finishHabitSettingsDrag(event) {
  if (!habitDrag || event.pointerId !== habitDrag.pointerId) return;
  const { handle, row, container, moved } = habitDrag;
  row.classList.remove("habit-dragging");
  document.body.classList.remove("habit-is-dragging");
  try { handle.releasePointerCapture?.(event.pointerId); } catch { /* pointer capture already released */ }
  habitDrag = null;
  if (!moved) return;
  const byId = new Map(state.habits.map(habit => [habit.id, habit]));
  state.habits = $$(".setting-row", container).map(item => byId.get(item.querySelector(".habit-drag-handle")?.dataset.id)).filter(Boolean);
  saveState();
  renderAll();
  showToast(tr("habits.moved"));
}

function moveHabit(id, direction) {
  const index = state.habits.findIndex(habit => habit.id === id);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= state.habits.length) return;
  const [habit] = state.habits.splice(index, 1);
  state.habits.splice(nextIndex, 0, habit);
  saveState();
  renderAll();
  showToast(tr("habits.moved"));
  const nextButton = $(`.habit-drag-handle[data-id="${CSS.escape(id)}"]`);
  nextButton?.focus({ preventScroll: true });
}

function renderIconPicker() {
  const input = $('#habitForm input[name="icon"]');
  const popover = $("#iconPickerPopover");
  if (!input || !popover) return;
  const selected = iconCatalog[input.value] ? input.value : "target";
  $("#iconPickerPreview").innerHTML = renderIcon(selected);
  $("#iconPickerName").textContent = iconLabels[currentLang][selected];
  popover.innerHTML = Object.keys(iconCatalog).map(key => `<button type="button" class="icon-choice ${key === selected ? "selected" : ""}" data-icon="${key}" title="${escapeHtml(iconLabels[currentLang][key])}">${renderIcon(key)}<span>${escapeHtml(iconLabels[currentLang][key])}</span></button>`).join("");
  $$(".icon-choice", popover).forEach(button => button.addEventListener("click", () => {
    input.value = button.dataset.icon;
    popover.hidden = true;
    $("#iconPickerTrigger").setAttribute("aria-expanded", "false");
    renderIconPicker();
  }));
}

function closeHabitPickers(except = "", restoreFocus = false) {
  const pickers = [
    { key: "icon", panel: $("#iconPickerPopover"), trigger: $("#iconPickerTrigger") },
    { key: "color", panel: $("#colorPickerPopover"), trigger: $("#colorPickerTrigger") },
  ];
  pickers.forEach(({ key, panel, trigger }) => {
    if (!panel || !trigger || key === except || panel.hidden) return;
    panel.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (restoreFocus) trigger.focus({ preventScroll: true });
  });
}

function toggleHabitPicker(key) {
  const panel = $(`#${key}PickerPopover`);
  const trigger = $(`#${key}PickerTrigger`);
  if (!panel || !trigger) return;
  const opening = panel.hidden;
  closeHabitPickers(opening ? key : "");
  panel.hidden = !opening;
  trigger.setAttribute("aria-expanded", String(opening));
}

function renderColorPicker() {
  const input = $('#habitForm input[name="color"]');
  const popover = $("#colorPickerPopover");
  if (!input || !popover) return;
  const selected = colors[input.value] ? input.value : "sage";
  const selectedColor = colors[selected];
  $("#colorPickerPreview").style.background = selectedColor.solid;
  $("#colorPickerName").textContent = tr(`dialog.colors.${selected}`);
  popover.innerHTML = Object.entries(colors).map(([key, value]) => `
    <button type="button" class="color-choice ${key === selected ? "selected" : ""}" data-color="${key}">
      <i style="--choice-color:${value.solid};--choice-soft:${value.soft}" aria-hidden="true"></i>
      <span>${escapeHtml(tr(`dialog.colors.${key}`))}</span>
      <b aria-hidden="true">${key === selected ? "✓" : ""}</b>
    </button>`).join("");
  $$(".color-choice", popover).forEach(button => button.addEventListener("click", () => {
    input.value = button.dataset.color;
    popover.hidden = true;
    $("#colorPickerTrigger").setAttribute("aria-expanded", "false");
    renderColorPicker();
    updateHabitFormPreview();
  }));
}

function updateHabitFormPreview() {
  const form = $("#habitForm");
  if (!form) return;
  const colorKey = colors[form.elements.color.value] ? form.elements.color.value : "sage";
  const color = colors[colorKey];
  const icon = iconCatalog[form.elements.icon.value] ? form.elements.icon.value : "target";
  const version = {
    trackingMode: form.elements.trackingMode.value,
    note: form.elements.note.value.trim(),
    target: Math.max(1, Number(form.elements.target.value) || 1),
    unit: form.elements.unit.value.trim(),
    frequency: form.elements.frequency.value,
    periodTarget: Number(form.elements.periodTarget.value) || 1,
    scheduleTime: form.elements.scheduleTime.value,
  };
  const preview = $("#habitLivePreview");
  preview.style.setProperty("--habit-color", color.solid);
  preview.style.setProperty("--habit-soft", color.soft);
  $("#habitPreviewIcon").innerHTML = renderIcon(icon);
  $("#habitPreviewName").textContent = form.elements.name.value.trim() || tr("dialog.previewName");
  $("#habitPreviewMeta").textContent = habitMetaLabel(version);
  const previewNote = $("#habitPreviewNote");
  previewNote.textContent = version.note;
  previewNote.hidden = !version.note;
}

function showCelebration() {
  const celebration = $("#celebration");
  if (!celebration || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  celebration.classList.remove("show");
  void celebration.offsetWidth;
  celebration.classList.add("show");
  clearTimeout(showCelebration.timer);
  showCelebration.timer = setTimeout(() => celebration.classList.remove("show"), 1900);
}

function openDrawer(date) {
  selectedDate = date; renderDrawer();
  $("#dayDrawer").classList.add("open"); $("#drawerBackdrop").classList.add("open");
  $("#dayDrawer").setAttribute("aria-hidden", "false");
}
function closeDrawer() {
  $("#dayDrawer").classList.remove("open"); $("#drawerBackdrop").classList.remove("open");
  $("#dayDrawer").setAttribute("aria-hidden", "true");
  renderDailyGoals();
  if ($("#timelineView")?.classList.contains("active")) void renderTimelineDetail();
}
function renderDrawerMemory(date) {
  const log = getLog(date);
  const memoryPhotos = calendarPhotosByDate.get(date) || [];
  const memoryContainer = $("#drawerMemoryPhotos");
  memoryContainer.innerHTML = memoryPhotos.map(photo => `<img src="${photo.url}" width="${photo.width || 720}" height="${photo.height || 720}" loading="lazy" alt="" />`).join("");
  memoryContainer.hidden = !memoryPhotos.length;
  const memoryEdit = $("#drawerMemoryEdit");
  memoryEdit.textContent = tr("drawer.memoryEdit");
  memoryEdit.hidden = isFutureDate(date) || !log.mood;
  memoryEdit.title = memoryPhotos.length ? tr("drawer.photoCount", { count: memoryPhotos.length }) : tr("drawer.memoryEdit");
}
function renderDrawer() {
  const d = parseDate(selectedDate), log = getLog(selectedDate), habits = activeHabits(selectedDate), scoredHabits = dailyHabits(selectedDate), future = isFutureDate(selectedDate);
  $("#drawerWeekday").textContent = weekdayName(d.getDay()).toUpperCase();
  $("#drawerDate").textContent = tr("calendar.dayTitle", { month: d.getMonth() + 1, monthName: monthName(d.getMonth()), day: d.getDate() });
  $("#drawerProgress").textContent = `${log.completed.filter(id => scoredHabits.some(h => h.id === id)).length} / ${scoredHabits.length}`;
  const drawerTitles = $$("#dayDrawer .drawer-section-title h3");
  if (drawerTitles[0]) drawerTitles[0].textContent = tr("drawer.goalTitle");
  if (drawerTitles[1]) drawerTitles[1].textContent = tr("dayPlan.schedule");
  if (drawerTitles[2]) drawerTitles[2].textContent = tr("drawer.moodTitle");
  if (drawerTitles[3]) drawerTitles[3].textContent = tr("drawer.noteTitle");
  setText("label.drawer-section-title span", tr("drawer.markdown"));
  const futureNotice = $("#drawerFutureNotice");
  futureNotice.hidden = !future;
  futureNotice.textContent = future ? tr("drawer.futureLocked") : "";
  $("#drawerHabits").innerHTML = habits.map(h => {
    const done = log.completed.includes(h.id), v = versionFor(h, selectedDate);
    const periodNote = countsTowardDaily(h, selectedDate) ? "" : `<small class="period-note">${v.frequency === "monthly" ? tr("drawer.periodMonthly") : tr("drawer.periodWeekly")}</small>`;
    const habitNote = String(v?.note || "").trim();
    const target = habitMetaLabel(v);
    return `<details class="drawer-habit ${done ? "done" : ""}" data-id="${h.id}" style="${habitStyle(h)}">
      <summary><span><span class="habit-icon">${renderIcon(iconKey(h))}</span><strong>${escapeHtml(displayHabitName(h))}</strong></span><span class="habit-check">${done ? "✓" : "⌄"}</span></summary>
      <div class="drawer-habit-details"><p>${escapeHtml(target)}</p>${habitNote ? `<p class="drawer-habit-note">${escapeHtml(habitNote)}</p>` : ""}${periodNote}<button class="drawer-habit-toggle" type="button" ${future ? "disabled" : ""}>${done ? tr("drawer.undoComplete") : tr("drawer.markComplete")}</button></div>
    </details>`;
  }).join("");
  $$(".drawer-habit-toggle").forEach(button => button.addEventListener("click", () => toggleHabit(selectedDate, button.closest(".drawer-habit").dataset.id)));
  const schedule = calendarEventsForDate(selectedDate);
  $("#drawerScheduleCount").textContent = tr("dayPlan.events", { count: schedule.length });
  $("#drawerScheduleList").innerHTML = schedule.map(event => scheduleEventMarkup(event)).join("");
  $$("#drawerMood button").forEach(button => {
    button.classList.toggle("selected", button.dataset.mood === log.mood);
    button.disabled = future;
  });
  renderMoodReasonSummary("#drawerMoodReason", log);
  renderDrawerMemory(selectedDate);
  void loadCalendarPhotoMonth(d);
  $("#dayNote").value = log.note || "";
  $("#dayNote").disabled = future;
  $("#completeDay").disabled = future;
}

function openHabitDialog(id = null) {
  closeHabitPickers();
  editingHabitId = id;
  const form = $("#habitForm"), habit = state.habits.find(h => h.id === id);
  const v = habit ? versionFor(habit, isoDate(new Date())) || habit.versions[habit.versions.length - 1] : null;
  $("#habitDialogTitle").textContent = habit ? tr("dialog.editTitle", { habit: displayHabitName(habit) }) : tr("dialog.addTitle");
  form.elements.name.value = habit?.name || "";
  form.elements.note.value = v?.note || "";
  form.elements.icon.value = habit ? iconKey(habit) : "target";
  form.elements.color.value = habit?.color || "sage";
  form.elements.target.value = v?.target || 30;
  form.elements.unit.value = v?.unit || "分钟";
  form.elements.trackingMode.value = v ? trackingModeFor(v) : "check";
  form.elements.frequency.value = v?.frequency || "daily";
  form.elements.scheduleTime.value = v?.scheduleTime || String(v?.unit || "").match(/^(\d{1,2}:\d{2})/)?.[1] || "";
  form.elements.periodTarget.value = v ? periodTargetFor(v) : 3;
  form.elements.countsTowardDaily.checked = v ? countsTowardDaily(habit, isoDate(new Date())) : true;
  form.elements.effectiveDate.value = isoDate(new Date());
  $("#deleteHabitButton").hidden = !habit;
  applyDialogLanguage();
  renderIconPicker();
  renderColorPicker();
  updateHabitFormRules();
  updateHabitFormPreview();
  $("#habitDialog").showModal();
}
function closeHabitDialog() {
  closeHabitPickers();
  $("#habitDialog").close();
  $("#habitForm").reset();
  editingHabitId = null;
}
function updateHabitFormRules() {
  const form = $("#habitForm");
  const frequency = form.elements.frequency.value;
  const measured = form.elements.trackingMode.value === "measured";
  const periodField = $("#periodTargetField");
  $("#habitTargetField").hidden = !measured;
  $("#habitUnitField").hidden = !measured;
  form.elements.target.required = measured;
  form.elements.unit.required = measured;
  periodField.style.display = frequency === "daily" ? "none" : "";
  form.elements.periodTarget.required = frequency !== "daily";
  form.elements.periodTarget.max = frequency === "weekly" ? 7 : 31;
  updateHabitFormPreview();
}
function saveHabitFromForm(event) {
  event.preventDefault();
  const isEditing = Boolean(editingHabitId);
  const form = new FormData(event.currentTarget);
  const measured = form.get("trackingMode") === "measured";
  const version = {
    trackingMode: measured ? "measured" : "check",
    note: String(form.get("note") || "").trim(),
    target: measured ? +form.get("target") : 1,
    unit: measured ? String(form.get("unit") || "").trim() : "",
    frequency: form.get("frequency"),
    scheduleTime: form.get("scheduleTime") || "",
    periodTarget: form.get("frequency") === "daily" ? null : +form.get("periodTarget"),
    weeklyTarget: form.get("frequency") === "weekly" ? +form.get("periodTarget") : null,
    countsTowardDaily: form.get("countsTowardDaily") === "on",
    effectiveDate: form.get("effectiveDate"),
  };
  if (editingHabitId) {
    const h = state.habits.find(x => x.id === editingHabitId);
    h.name = form.get("name"); h.icon = form.get("icon"); h.color = form.get("color");
    h.versions = h.versions.filter(v => v.effectiveDate !== version.effectiveDate);
    h.versions.push(version);
  } else {
    state.habits.push({ id: createId(), name: form.get("name"), icon: form.get("icon"), color: form.get("color"), active: true, versions: [version] });
  }
  saveState(); closeHabitDialog(); renderAll(); showToast(isEditing ? tr("habits.updated") : tr("habits.added"));
}
async function deleteHabit() {
  const habit = state.habits.find(h => h.id === editingHabitId);
  if (!habit || !(await appConfirm(tr("habits.deleteConfirm", { habit: displayHabitName(habit) })))) return;
  state.habits = state.habits.filter(h => h.id !== habit.id);
  Object.values(state.logs).forEach(log => {
    if (Array.isArray(log.completed)) log.completed = log.completed.filter(id => id !== habit.id);
  });
  saveState();
  closeHabitDialog();
  renderAll();
  showToast(tr("habits.deleted", { habit: displayHabitName(habit) }));
}

function datesForReview(scope, key) {
  const today = isoDate(new Date());
  let start;
  let end;
  if (scope === "week") {
    const range = weekDatesFromKey(key);
    start = new Date(range.monday);
    end = new Date(range.sunday);
  } else {
    const [year, month] = key.split("-").map(Number);
    start = new Date(year, month - 1, 1, 12);
    end = new Date(year, month, 0, 12);
  }
  const dates = [];
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const value = isoDate(date);
    if (value <= today) dates.push(value);
  }
  return dates;
}

function reviewPeriodLabel(scope, key) {
  if (scope === "week") {
    const { monday, sunday } = weekDatesFromKey(key);
    return formatCompactDateSpan(monday, sunday);
  }
  const [year, month] = key.split("-").map(Number);
  return currentLang === "zh" ? `${year}年${month}月` : `${monthName(month - 1)} ${year}`;
}

function exportRange(scope) {
  const selected = $("#exportDate").value || isoDate(new Date());
  let start = null, end = null;
  if (scope === "month") {
    const value = $("#exportMonth").value || monthKey(new Date());
    const [year, month] = value.split("-").map(Number);
    start = `${value}-01`;
    end = isoDate(new Date(year, month, 0, 12));
  } else if (scope === "week") {
    const dates = weekDatesFromKey(isoWeekKey(parseDate(selected)));
    start = isoDate(dates.monday);
    end = isoDate(dates.sunday);
  } else if (scope === "day") {
    start = end = selected;
  }
  return { scope, start, end };
}
function withinRange(date, range) { return range.scope === "all" || (date >= range.start && date <= range.end); }
function scopedState(range) {
  const result = { habits: cloneData(state.habits), logs: {}, reviews: {}, dailyGoals: {}, weeklyGoals: {}, longTermGoals: cloneData(state.longTermGoals || []), weeklyOutputs: {}, weeklyReviews: {}, focusSessions: [], focusSettings: cloneData(state.focusSettings || seed.focusSettings), quoteSettings: cloneData(state.quoteSettings || { mode: "auto", items: [] }), exportMeta: { ...range, exportedAt: new Date().toISOString() } };
  Object.entries(state.logs || {}).forEach(([key, value]) => { if (withinRange(key, range)) result.logs[key] = value; });
  Object.entries(state.dailyGoals || {}).forEach(([key, value]) => { if (withinRange(key, range)) result.dailyGoals[key] = value; });
  Object.entries(state.reviews || {}).forEach(([key, value]) => {
    if (range.scope === "all" || (range.start.slice(0, 7) <= key && key <= range.end.slice(0, 7))) result.reviews[key] = value;
  });
  Object.entries(state.weeklyGoals || {}).forEach(([key, value]) => {
    const { monday, sunday } = weekDatesFromKey(key);
    if (range.scope === "all" || (isoDate(sunday) >= range.start && isoDate(monday) <= range.end)) result.weeklyGoals[key] = value;
  });
  Object.entries(state.weeklyOutputs || {}).forEach(([key, value]) => {
    const { monday, sunday } = weekDatesFromKey(key);
    if (range.scope === "all" || (isoDate(sunday) >= range.start && isoDate(monday) <= range.end)) result.weeklyOutputs[key] = value;
  });
  Object.entries(state.weeklyReviews || {}).forEach(([key, value]) => {
    const { monday, sunday } = weekDatesFromKey(key);
    if (range.scope === "all" || (isoDate(sunday) >= range.start && isoDate(monday) <= range.end)) result.weeklyReviews[key] = value;
  });
  result.focusSessions = (state.focusSessions || []).filter(session => withinRange(session.date, range)).map(cloneData);
  return result;
}
function updateExportFields() {
  const scope = $('#exportForm input[name="exportScope"]:checked')?.value || "all";
  $("#exportMonth").hidden = scope !== "month";
  $("#exportDate").hidden = !["week", "day"].includes(scope);
  const includePhotos = $("#includePhotos");
  if (includePhotos) {
    includePhotos.disabled = scope !== "month";
    if (scope !== "month") includePhotos.checked = false;
  }
}
function setBackupTab(tab = "export") {
  const selected = tab === "import" ? "import" : "export";
  $$('[data-backup-tab]').forEach(button => {
    const active = button.dataset.backupTab === selected;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });
  $$('[data-backup-panel]').forEach(panel => { panel.hidden = panel.dataset.backupPanel !== selected; });
  $("#exportConfirm").hidden = selected !== "export";
}
function openBackupDialog() {
  $("#exportMonth").value = monthKey(new Date());
  $("#exportDate").value = isoDate(new Date());
  updateExportFields();
  clearImportSelection();
  $("#undoRestore").hidden = !localStorage.getItem(RESTORE_SAFETY_KEY);
  $("#mediaBackupOption").hidden = !photosEnabled;
  setBackupTab("export");
  $("#exportDialog").showModal();
}
function syncExportButtonPlacement() {
  const button = $("#exportButton");
  const anchor = $("#exportButtonAnchor");
  const topActions = $(".top-actions");
  if (!button || !anchor || !topActions) return;
  if (window.matchMedia("(max-width: 760px)").matches) topActions.append(button);
  else anchor.after(button);
}
function syncMobileToolbar() {
  const mobile = window.matchMedia("(max-width: 760px)").matches;
  const button = $("#mobileToolbarToggle");
  const actions = $("#mobileTopActions");
  if (!button || !actions) return;
  button.hidden = !mobile;
  actions.classList.toggle("mobile-collapsed", mobile && !mobileToolbarOpen);
  actions.classList.toggle("mobile-open", mobile && mobileToolbarOpen);
  button.setAttribute("aria-expanded", String(mobile && mobileToolbarOpen));
  button.setAttribute("aria-label", mobileToolbarOpen ? tr("toolbar.close") : tr("toolbar.open"));
}
function createBackup(scope) {
  const range = exportRange(scope);
  return {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    app: "Life Ledger · Deep Review",
    exportedAt: new Date().toISOString(),
    scope,
    range,
    data: scopedState(range),
  };
}
function triggerFileDownload(blob, filename) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  // WebKit may cancel a download when a Blob URL is revoked immediately.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
async function saveBackupBlob(blob, filename) {
  if (!desktopNativeBackup || blob.type !== "application/json") {
    triggerFileDownload(blob, filename);
    showToast(tr("toast.exported"));
    return;
  }
  const contents = await blob.text();
  const result = await desktopBridge.saveBackupJson({ filename, contents });
  if (!result?.cancelled) showToast(tr("toast.exported"));
}
async function downloadExport(event) {
  event.preventDefault();
  const scope = $('#exportForm input[name="exportScope"]:checked').value;
  const backup = createBackup(scope);
  const includePhotos = photosEnabled && $("#includePhotos")?.checked;
  const confirmButton = $("#exportConfirm");
  const originalLabel = confirmButton.textContent;
  confirmButton.disabled = true;
  try {
    if (includePhotos) {
      if (scope !== "month") throw new Error("photo-backup-month-only");
      confirmButton.textContent = tr("backup.mediaExporting");
      const photos = await photoMemories?.listRange(backup.range.start, backup.range.end) || [];
      const blob = await window.LifeLedgerMediaBackup.createBundle(backup, photos);
      triggerFileDownload(blob, `life-ledger-media-${backup.range.start.slice(0, 7)}-${isoDate(new Date())}.llmedia`);
      showToast(tr("toast.exported"));
    } else {
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      await saveBackupBlob(blob, `life-ledger-backup-${scope}-${backup.range.start || "all"}-${isoDate(new Date())}.json`);
    }
  } catch (error) {
    console.warn("Backup export failed", error);
    void appAlert(error?.message === "photo-backup-month-only" ? tr("backup.mediaOnlyMonth") : tr("backup.mediaInvalid"));
  } finally {
    confirmButton.disabled = false;
    confirmButton.textContent = originalLabel;
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function importedPayload(raw) {
  const modern = raw?.format === BACKUP_FORMAT && isRecord(raw.data);
  if (modern && Number(raw.schemaVersion) > BACKUP_SCHEMA_VERSION) throw new Error("unsupported-backup-version");
  const payload = modern ? raw.data : raw;
  if (!isRecord(payload) || !Array.isArray(payload.habits) || !isRecord(payload.logs)) throw new Error("invalid-backup");
  if (payload.habits.some(habit => !isRecord(habit) || typeof habit.id !== "string" || !Array.isArray(habit.versions))) throw new Error("invalid-habits");
  for (const key of ["reviews", "dailyGoals", "weeklyGoals", "weeklyOutputs", "weeklyReviews"]) {
    if (payload[key] !== undefined && !isRecord(payload[key])) throw new Error(`invalid-${key}`);
  }
  if (payload.focusSessions !== undefined && !Array.isArray(payload.focusSessions)) throw new Error("invalid-focusSessions");
  if (payload.longTermGoals !== undefined && !Array.isArray(payload.longTermGoals)) throw new Error("invalid-longTermGoals");
  if (payload.focusSettings !== undefined && !isRecord(payload.focusSettings)) throw new Error("invalid-focusSettings");
  const scope = modern ? raw.scope : payload.exportMeta?.scope || "all";
  return {
    modern,
    scope: ["all", "month", "week", "day"].includes(scope) ? scope : "all",
    exportedAt: modern ? raw.exportedAt : payload.exportMeta?.exportedAt,
    data: {
      ...cloneData(seed),
      ...cloneData(payload),
      habits: cloneData(payload.habits),
      logs: cloneData(payload.logs),
      reviews: cloneData(payload.reviews || {}),
      dailyGoals: cloneData(payload.dailyGoals || {}),
      weeklyGoals: cloneData(payload.weeklyGoals || {}),
      longTermGoals: cloneData(payload.longTermGoals || []),
      weeklyOutputs: cloneData(payload.weeklyOutputs || {}),
      weeklyReviews: cloneData(payload.weeklyReviews || {}),
      focusSessions: cloneData(payload.focusSessions || []),
      focusSettings: { ...cloneData(seed.focusSettings), ...cloneData(payload.focusSettings || {}) },
    },
  };
}
function importStats(candidate) {
  const dayKeys = new Set([
    ...Object.keys(candidate.data.logs || {}),
    ...Object.keys(candidate.data.dailyGoals || {}),
  ]);
  const date = candidate.exportedAt && !Number.isNaN(Date.parse(candidate.exportedAt))
    ? new Intl.DateTimeFormat(i18n[currentLang].locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(candidate.exportedAt))
    : tr("backup.legacy");
  return tr("backup.summary", {
    scope: candidate.scope === "all" ? tr("backup.scopeAll") : tr("backup.scopePartial"),
    habits: candidate.data.habits.length,
    days: dayKeys.size,
    date,
  });
}
function clearImportSelection() {
  pendingImport = null;
  pendingMediaImport = null;
  $("#importFile").value = "";
  $("#importPreview").hidden = true;
  $("#importError").hidden = true;
  $("#chooseImportFile").hidden = false;
}
async function previewImportFile(file) {
  clearImportSelection();
  if (!file) return;
  const mediaBundle = await window.LifeLedgerMediaBackup?.isBundle(file).catch(() => false);
  const limit = mediaBundle ? MAX_MEDIA_IMPORT_BYTES : MAX_IMPORT_BYTES;
  if (file.size > limit) {
    $("#importError").textContent = tr("backup.tooLarge");
    $("#importError").hidden = false;
    return;
  }
  try {
    const media = mediaBundle ? await window.LifeLedgerMediaBackup.parseBundle(file) : null;
    if (media && !photosEnabled) throw new Error("media-cloud-only");
    const candidate = importedPayload(media ? media.manifest.backup : JSON.parse(await file.text()));
    pendingImport = candidate;
    pendingMediaImport = media;
    $("#importFileName").textContent = file.name;
    $("#importSummary").textContent = importStats(candidate);
    $(".import-file-badge").textContent = media ? "MEDIA" : "JSON";
    $("#chooseImportFile").hidden = true;
    $("#importPreview").hidden = false;
  } catch (error) {
    console.warn("Backup validation failed", error);
    $("#importError").textContent = mediaBundle ? tr("backup.mediaInvalid") : tr("backup.invalid");
    $("#importError").hidden = false;
  }
}
function mergeBackupData(current, incoming) {
  const habits = new Map((current.habits || []).map(habit => [habit.id, cloneData(habit)]));
  (incoming.habits || []).forEach(habit => {
    const existing = habits.get(habit.id);
    if (!existing) {
      habits.set(habit.id, cloneData(habit));
      return;
    }
    const versions = new Map((habit.versions || []).map(version => [version.effectiveDate || JSON.stringify(version), cloneData(version)]));
    (existing.versions || []).forEach(version => versions.set(version.effectiveDate || JSON.stringify(version), cloneData(version)));
    habits.set(habit.id, { ...cloneData(habit), ...cloneData(existing), versions: [...versions.values()].sort((a, b) => String(a.effectiveDate).localeCompare(String(b.effectiveDate))) });
  });
  const focusSessions = new Map((current.focusSessions || []).map(session => [session.id, cloneData(session)]));
  (incoming.focusSessions || []).forEach(session => focusSessions.set(session.id, cloneData(session)));
  return {
    ...cloneData(current),
    habits: [...habits.values()],
    logs: { ...(current.logs || {}), ...(incoming.logs || {}) },
    reviews: { ...(current.reviews || {}), ...(incoming.reviews || {}) },
    dailyGoals: { ...(current.dailyGoals || {}), ...(incoming.dailyGoals || {}) },
    weeklyGoals: { ...(current.weeklyGoals || {}), ...(incoming.weeklyGoals || {}) },
    longTermGoals: [...new Map([...(current.longTermGoals || []), ...(incoming.longTermGoals || [])].map(goal => [goal.id, cloneData(goal)])).values()],
    weeklyOutputs: { ...(current.weeklyOutputs || {}), ...(incoming.weeklyOutputs || {}) },
    weeklyReviews: { ...(current.weeklyReviews || {}), ...(incoming.weeklyReviews || {}) },
    focusSessions: [...focusSessions.values()].sort((a, b) => Number(a.startedAt || 0) - Number(b.startedAt || 0)),
    focusSettings: { ...(current.focusSettings || seed.focusSettings) },
  };
}
async function restorePendingImport() {
  if (!pendingImport) return;
  const isComplete = pendingImport.scope === "all";
  const warning = `${tr(isComplete ? "backup.confirmFull" : "backup.confirmPartial")}${cloudMode ? `\n\n${tr("backup.cloudWarning")}` : ""}`;
  if (!(await appConfirm(warning))) return;
  const media = pendingMediaImport;
  const restoreButton = $("#restoreImport");
  const originalLabel = restoreButton.textContent;
  restoreButton.disabled = true;
  localStorage.setItem(RESTORE_SAFETY_KEY, JSON.stringify({ savedAt: Date.now(), state: cloneData(state) }));
  const demoWasActive = isDemoWorkspaceActive();
  state = isComplete
    ? cloneData(pendingImport.data)
    : mergeBackupData(demoWasActive ? cleanStarterWorkspaceBase() : state, pendingImport.data);
  if (demoWasActive) {
    dismissDemoMetadataAfterRestore();
    stripDemoCalendarPhotos();
  }
  saveState();
  if (media?.entries?.length) {
    restoreButton.textContent = tr("backup.mediaRestoring");
    try {
      for (const entry of media.entries) await photoMemories.restorePhoto(entry.photo, entry.blob);
    } catch (error) {
      console.warn("Photo restore failed", error);
      void appAlert(tr("backup.mediaInvalid"));
    }
  }
  selectedAnalyticsHabitIds = [];
  clearImportSelection();
  $("#undoRestore").hidden = false;
  $("#exportDialog").close();
  renderAll();
  showToast(tr("toast.restored"));
  restoreButton.disabled = false;
  restoreButton.textContent = originalLabel;
}
function undoLastRestore() {
  try {
    const safety = JSON.parse(localStorage.getItem(RESTORE_SAFETY_KEY));
    const previous = importedPayload(safety?.state).data;
    localStorage.setItem(RESTORE_SAFETY_KEY, JSON.stringify({ savedAt: Date.now(), state: cloneData(state) }));
    state = previous;
    saveState();
    selectedAnalyticsHabitIds = [];
    renderAll();
    showToast(tr("toast.restoreUndone"));
  } catch (error) {
    console.warn("Restore safety copy is unavailable", error);
    localStorage.removeItem(RESTORE_SAFETY_KEY);
    $("#undoRestore").hidden = true;
  }
}

async function installApp() {
  if (!deferredInstallPrompt) {
    showToast(tr("pwa.manual"));
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  $$('[data-install-app]').forEach(button => {
    button.classList.remove("ready");
    button.setAttribute("title", tr("pwa.install"));
  });
}

function loadReminderSettings() {
  try {
    return { enabled: false, time: "21:00", lastSent: "", ...JSON.parse(localStorage.getItem(REMINDER_KEY) || "{}") };
  } catch {
    return { enabled: false, time: "21:00", lastSent: "" };
  }
}

function reminderPermission() {
  return "Notification" in window ? Notification.permission : "unsupported";
}

function updateReminderStatus() {
  const status = reminderPermission();
  const dot = $(".reminder-status-dot");
  dot?.classList.toggle("ready", reminderSettings.enabled && status === "granted");
  dot?.classList.toggle("blocked", status === "denied" || status === "unsupported");
  if (status === "unsupported") {
    setText("#reminderStatusTitle", tr("reminder.unsupported"));
    setText("#reminderStatusHelp", tr("reminder.unsupportedHelp"));
  } else if (status === "denied") {
    setText("#reminderStatusTitle", tr("reminder.denied"));
    setText("#reminderStatusHelp", tr("reminder.deniedHelp"));
  } else if (reminderSettings.enabled && status === "granted") {
    setText("#reminderStatusTitle", tr("reminder.ready"));
    setText("#reminderStatusHelp", tr("reminder.readyHelp", { time: reminderSettings.time }));
  } else {
    setText("#reminderStatusTitle", tr("reminder.off"));
    setText("#reminderStatusHelp", tr("reminder.offHelp"));
  }
  const ready = reminderSettings.enabled && status === "granted";
  $("#habitReminderCard")?.classList.toggle("ready", ready);
  $("#habitReminderCard")?.classList.toggle("blocked", status === "denied" || status === "unsupported");
  setText("#habitReminderStatus", ready ? tr("reminder.cardOn", { time: reminderSettings.time }) : tr("reminder.cardOff"));
}

function applyReminderLanguage() {
  setText("#habitReminderKicker", tr("reminder.kicker"));
  setText("#habitReminderTitle", tr("reminder.title"));
  setText("#reminderKicker", tr("reminder.kicker"));
  setText("#reminderDialogTitle", tr("reminder.title"));
  setText("#reminderEnableTitle", tr("reminder.enable"));
  setText("#reminderEnableHelp", tr("reminder.enableHelp"));
  setText("#reminderTimeLabel", tr("reminder.time"));
  setText("#reminderCaveat", tr("reminder.caveat"));
  setText("#testReminderButton", tr("reminder.test"));
  setText("#reminderCancel", tr("reminder.cancel"));
  setText("#saveReminderButton", tr("reminder.save"));
  setAria(".close-reminder-dialog", tr("reminder.close"));
  setAria("#habitReminderCard", tr("reminder.title"));
  updateReminderStatus();
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted" || Notification.permission === "denied") return Notification.permission;
  return Notification.requestPermission();
}

async function sendReminderNotification(isTest = false) {
  if (reminderPermission() !== "granted") return false;
  const options = {
    body: tr(isTest ? "reminder.testBody" : "reminder.body"),
    icon: "./assets/app-icon-192.png",
    badge: "./assets/app-icon-192.png",
    tag: isTest ? "life-ledger-reminder-test" : `life-ledger-reminder-${isoDate(new Date())}`,
    renotify: false,
  };
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(tr("title"), options);
  } else {
    new Notification(tr("title"), options);
  }
  return true;
}

async function maybeSendDailyReminder() {
  if (!reminderSettings.enabled || reminderPermission() !== "granted") return;
  const now = new Date();
  const today = isoDate(now);
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  if (currentTime < reminderSettings.time || reminderSettings.lastSent === today) return;
  if (await sendReminderNotification()) {
    reminderSettings.lastSent = today;
    localStorage.setItem(REMINDER_KEY, JSON.stringify(reminderSettings));
  }
}

function armReminderClock() {
  clearInterval(reminderTimer);
  reminderTimer = window.setInterval(maybeSendDailyReminder, 30000);
  maybeSendDailyReminder();
}

function openReminderDialog() {
  $("#reminderEnabled").checked = reminderSettings.enabled;
  $("#reminderTime").value = reminderSettings.time;
  updateReminderStatus();
  $("#reminderDialog").showModal();
}

function focusSessionMinutes(session) {
  return Math.max(0, Number(session?.actualMinutes) || 0);
}

function focusSessionsBetween(start, end) {
  return (state.focusSessions || []).filter(session => session.date >= start && session.date <= end);
}

function focusTodayStats() {
  const today = isoDate(new Date());
  const sessions = focusSessionsBetween(today, today);
  return {
    minutes: Math.round(sessions.reduce((sum, session) => sum + focusSessionMinutes(session), 0)),
  };
}

function renderFocusOverview() {
  const settings = { ...seed.focusSettings, ...(state.focusSettings || {}) };
  const today = focusTodayStats();
  setText("#focusPresetSummary", tr("focus.presetSummary", { focus: settings.focusMinutes, break: settings.breakMinutes }));
  setText("#focusTodaySummary", tr("focus.todaySummary", { minutes: today.minutes }));
  const todayKey = isoDate(new Date());
  const byTopic = [...focusSessionsBetween(todayKey, todayKey).reduce((groups, session) => {
    const label = String(session.label || tr("focus.untitled")).trim() || tr("focus.untitled");
    groups.set(label, (groups.get(label) || 0) + focusSessionMinutes(session));
    return groups;
  }, new Map()).entries()].filter(([, minutes]) => minutes >= .5).sort((a, b) => b[1] - a[1]);
  $("#focusTodayBreakdown").hidden = !byTopic.length;
  $("#focusTodayBreakdown").innerHTML = byTopic.slice(0, 3).map(([label, minutes]) => `<span><b>${escapeHtml(label)}</b><small>${Math.round(minutes)} ${escapeHtml(tr("focus.reviewUnit"))}</small></span>`).join("");
  const recentTopics = [...new Set([...(state.focusSessions || [])].reverse().map(session => String(session.label || "").trim()).filter(label => label && label !== tr("focus.untitled")))].slice(0, 8);
  $("#focusTopicSuggestions").innerHTML = recentTopics.map(label => `<option value="${escapeHtml(label)}"></option>`).join("");
  $$('[data-quick-focus-preset]').forEach(button => {
    button.classList.toggle("active", button.dataset.quickFocusPreset === settings.preset);
    button.disabled = Boolean(focusTimer?.snapshot());
  });
}

function formatFocusTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil((Number(milliseconds) || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function focusPresetValues(preset) {
  if (preset === "deep") return { focusMinutes: 50, breakMinutes: 10 };
  if (preset === "custom") return { focusMinutes: Math.max(1, Number($("#focusMinutes")?.value) || state.focusSettings.focusMinutes || 25), breakMinutes: Math.max(1, Number($("#focusBreakMinutes")?.value) || state.focusSettings.breakMinutes || 5) };
  return { focusMinutes: 25, breakMinutes: 5 };
}

function selectFocusPreset(preset, options = {}) {
  const value = ["classic", "deep", "custom"].includes(preset) ? preset : "classic";
  $$('[data-focus-preset]').forEach(button => button.classList.toggle("active", button.dataset.focusPreset === value));
  $("#focusCustomFields").hidden = value !== "custom";
  if (!options.skipSave) {
    const values = focusPresetValues(value);
    state.focusSettings = { ...state.focusSettings, preset: value, ...values };
    saveState();
    renderFocusOverview();
    renderFocusTimer(focusTimer?.snapshot() || null);
  }
}

function selectQuickFocusPreset(preset) {
  if (focusTimer?.snapshot()) return;
  const values = focusPresetValues(preset);
  state.focusSettings = { ...seed.focusSettings, ...(state.focusSettings || {}), preset, ...values };
  saveState();
  renderFocusOverview();
  renderFocusTimer(null);
}

async function acquireFocusWakeLock() {
  if (!state.focusSettings?.wakeLock || document.hidden || !navigator.wakeLock?.request || focusWakeLock) return;
  try {
    focusWakeLock = await navigator.wakeLock.request("screen");
    focusWakeLock.addEventListener("release", () => { focusWakeLock = null; }, { once: true });
  } catch (error) {
    console.warn("Focus wake lock was not available", error);
  }
}

async function releaseFocusWakeLock() {
  const lock = focusWakeLock;
  focusWakeLock = null;
  try { await lock?.release(); } catch { /* already released */ }
}

function playFocusChime() {
  if (!state.focusSettings?.sound) return;
  try {
    focusAudioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const now = focusAudioContext.currentTime;
    [0, .18].forEach((offset, index) => {
      const oscillator = focusAudioContext.createOscillator();
      const gain = focusAudioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = index ? 659.25 : 523.25;
      gain.gain.setValueAtTime(.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(.12, now + offset + .025);
      gain.gain.exponentialRampToValueAtTime(.0001, now + offset + .28);
      oscillator.connect(gain).connect(focusAudioContext.destination);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + .3);
    });
  } catch (error) {
    console.warn("Focus chime could not play", error);
  }
}

async function sendFocusNotification(title, body, tag) {
  if (!state.focusSettings?.notify || reminderPermission() !== "granted") return;
  const options = { body, icon: "./assets/app-icon-192.png", badge: "./assets/app-icon-192.png", tag, renotify: false };
  try {
    const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : null;
    if (registration) await registration.showNotification(title, options);
    else new Notification(title, options);
  } catch (error) {
    console.warn("Focus notification could not be sent", error);
  }
}

function recordFocusSession(session) {
  if (!session || (state.focusSessions || []).some(existing => existing.id === session.id)) return;
  state.focusSessions = [...(state.focusSessions || []), session];
  saveState();
  renderFocusOverview();
  renderReview();
}

function handleFocusComplete(session) {
  recordFocusSession(session);
  releaseFocusWakeLock();
  playFocusChime();
  const label = session.label || tr("focus.untitled");
  sendFocusNotification(tr("focus.completed"), tr("focus.notificationBody", { label, minutes: Math.round(session.actualMinutes) }), `life-ledger-focus-${session.id}`);
  showToast(session.outcome === "completed" ? tr("focus.completed") : tr("focus.interrupted"));
  const clock = $("#focusClock");
  clock?.classList.remove("focus-complete");
  void clock?.offsetWidth;
  clock?.classList.add("focus-complete");
}

function handleFocusPhaseComplete(phase) {
  if (phase === "focus") {
    showToast(tr("focus.breakReady"));
    return;
  }
  releaseFocusWakeLock();
  playFocusChime();
  sendFocusNotification(tr("focus.breakDone"), tr("focus.breakDone"), "life-ledger-focus-break");
  showToast(tr("focus.breakDone"));
}

function renderFocusTimer(snapshot) {
  const isFocus = snapshot?.phase === "focus";
  const isBreak = snapshot?.phase === "break";
  const running = snapshot?.status === "running";
  const paused = snapshot?.status === "paused";
  const readyBreak = isBreak && snapshot?.status === "ready";
  const duration = snapshot?.durationMs || focusPresetValues(state.focusSettings?.preset || "classic").focusMinutes * 60000;
  const remaining = snapshot?.remainingMs ?? duration;
  const progress = snapshot ? Math.max(0, Math.min(1, 1 - remaining / Math.max(1, duration))) : 0;
  $("#focusClock")?.style.setProperty("--focus-progress", progress);
  setText("#focusTime", formatFocusTime(remaining));
  setText("#focusPhase", isBreak ? tr("focus.phaseBreak") : tr("focus.phaseFocus"));
  setText("#focusCurrentLabel", snapshot?.label || (readyBreak ? tr("focus.breakReady") : tr("focus.ready")));
  $("#focusSetup").hidden = Boolean(snapshot);
  $("#focusFinish").hidden = !isFocus;
  $("#focusInterrupt").hidden = !isFocus;
  $("#focusSkipBreak").hidden = !isBreak;
  setText("#focusPrimary", readyBreak ? tr("focus.startBreak") : running ? tr("focus.pause") : paused ? tr("focus.resume") : tr("focus.start"));
  $("#focusPrimary").disabled = isBreak && !readyBreak && !running && !paused;
  $("#focusInlineTimer")?.style.setProperty("--focus-inline-progress", progress);
  setText("#focusInlineTime", formatFocusTime(remaining));
  setText("#focusInlinePhase", isBreak ? tr("focus.phaseBreak") : tr("focus.phaseFocus"));
  setText("#focusInlineLabel", snapshot?.label || state.focusSettings?.defaultTopic || tr("focus.untitled"));
  setText("#focusQuickPrimary", readyBreak ? tr("focus.startBreak") : running ? tr("focus.pause") : paused ? tr("focus.resume") : tr("focus.start"));
  $("#focusQuickFinish").hidden = !isFocus;
  $("#focusQuickSkip").hidden = !isBreak;
  $("#focusQuickPrimary").disabled = isBreak && !readyBreak && !running && !paused;
  const miniStatus = $("#focusMiniStatus");
  if (miniStatus) {
    miniStatus.hidden = !snapshot;
    miniStatus.classList.toggle("running", running);
    miniStatus.setAttribute("aria-label", snapshot ? `${formatFocusTime(remaining)} · ${snapshot.label || state.focusSettings?.defaultTopic || tr("focus.untitled")}` : tr("journal.showFocus"));
  }
  setText("#focusMiniTime", formatFocusTime(remaining));
  setText("#focusMiniLabel", snapshot?.label || state.focusSettings?.defaultTopic || tr("focus.untitled"));
  renderFocusOverview();
  if (snapshot) {
    document.title = `${formatFocusTime(remaining)} · ${tr("title")}`;
  } else {
    document.title = tr("title");
  }
}

function openFocusTimerDialog() {
  const snapshot = focusTimer?.snapshot();
  if (!snapshot) {
    $("#focusCustomLabel").value = state.focusSettings?.defaultTopic || "";
    $("#focusMinutes").value = state.focusSettings?.focusMinutes || 25;
    $("#focusBreakMinutes").value = state.focusSettings?.breakMinutes || 5;
    $("#focusSound").checked = state.focusSettings?.sound !== false;
    $("#focusNotify").checked = state.focusSettings?.notify !== false;
    $("#focusWakeLock").checked = state.focusSettings?.wakeLock !== false;
    selectFocusPreset(state.focusSettings?.preset || "classic", { skipSave: true });
  }
  renderFocusTimer(snapshot);
  $("#focusDialog").showModal();
}

async function startFocusSession() {
  const preset = $('[data-focus-preset].active')?.dataset.focusPreset || "classic";
  const values = focusPresetValues(preset);
  const label = $("#focusCustomLabel").value.trim() || tr("focus.untitled");
  state.focusSettings = {
    preset,
    ...values,
    defaultTopic: label === tr("focus.untitled") ? "" : label,
    sound: $("#focusSound").checked,
    notify: $("#focusNotify").checked,
    wakeLock: $("#focusWakeLock").checked,
  };
  saveState();
  if (state.focusSettings.notify) requestNotificationPermission();
  focusTimer.start({ date: isoDate(new Date()), label, linkedGoalId: "", preset, durationMinutes: values.focusMinutes, breakMinutes: values.breakMinutes });
  setDailyToolPage("focus");
  acquireFocusWakeLock();
}

async function startQuickFocusSession() {
  const settings = { ...seed.focusSettings, ...(state.focusSettings || {}) };
  if (settings.notify) requestNotificationPermission();
  focusTimer.start({
    date: isoDate(new Date()),
    label: settings.defaultTopic || tr("focus.untitled"),
    preset: settings.preset,
    durationMinutes: settings.focusMinutes,
    breakMinutes: settings.breakMinutes,
  });
  setDailyToolPage("focus");
  acquireFocusWakeLock();
}

function handleFocusPrimary() {
  const snapshot = focusTimer?.snapshot();
  if (!snapshot) { startFocusSession(); return; }
  if (snapshot.phase === "break" && snapshot.status === "ready") {
    focusTimer.startBreak();
    acquireFocusWakeLock();
    return;
  }
  if (snapshot.status === "running") {
    focusTimer.pause();
    releaseFocusWakeLock();
  } else if (snapshot.status === "paused") {
    focusTimer.resume();
    acquireFocusWakeLock();
  }
}

function handleFocusQuickPrimary() {
  if (!focusTimer?.snapshot()) {
    startQuickFocusSession();
    return;
  }
  handleFocusPrimary();
}

function initFocusTimer() {
  if (!window.LifeLedgerFocusTimer) return;
  focusTimer = window.LifeLedgerFocusTimer.createTimer({
    storageKey: FOCUS_ACTIVE_KEY,
    onChange: renderFocusTimer,
    onFocusComplete: handleFocusComplete,
    onPhaseComplete: handleFocusPhaseComplete,
  });
  const active = focusTimer.initialize();
  if (active?.status === "running") acquireFocusWakeLock();
}

function bindEvents() {
  $$("[data-journal-mode]").forEach(button => button.addEventListener("click", () => setJournalMode(button.dataset.journalMode)));
  $('#journalMonthFilter').addEventListener('change',()=>{journalVisibleCount=24;void renderTimeline();});
  $('#journalAllMonths').addEventListener('click',()=>{$('#journalMonthFilter').value='';journalVisibleCount=24;void renderTimeline();});
  $('#journalLoadMore').addEventListener('click',()=>{journalVisibleCount+=24;void renderTimeline();});
  $$('#habitLibraryFilters button').forEach(button=>button.addEventListener('click',()=>{habitLibraryFilter=button.dataset.habitFilter;renderHabitSettings();}));
  $('#habitLibrarySearch').addEventListener('input',event=>{habitLibrarySearch=event.target.value;renderHabitSettings();});

    $$("[data-analytics-window]").forEach(button => button.addEventListener("click", () => {
    const next = Number(button.dataset.analyticsWindow);
    if (![7, 30, 90].includes(next) || next === analyticsWindow) return;
    analyticsWindow = next;
    $$("[data-analytics-window]").forEach(item => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    renderReview();
  }));
  $$("[data-timeline-filter]").forEach(button => button.addEventListener("click", () => {
    timelineFilter = button.dataset.timelineFilter || "all";
    $$("[data-timeline-filter]").forEach(item => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    void renderTimeline();
  }));

  $$("#insightViewSwitch [data-insight-view]").forEach(button => button.addEventListener("click", () => setInsightView(button.dataset.insightView)));

  $("#journalComposerSave")?.addEventListener("click", () => {
    const field = $("#journalQuickNote");
    if (!field) return;
    const date = field.dataset.date || selectedTimelineDate || isoDate(new Date());
    runSubmitButton($("#journalComposerSave"), () => {
      state.logs[date] = { ...getLog(date), note: field.value };
      saveState();
      const status = $("#journalQuickSave");
      if (status) {
        delete status.dataset.pending;
        status.textContent = languageText("已保存", "Saved", "Gespeichert");
      }
      selectedTimelineDate = date;
      if ($("#timelineView")?.classList.contains("active")) {
        renderTimelineEntryList(applyTimelineFilter(timelineEntriesForMonth(timelineCursor)));
        void renderTimelineDetail();
      }
    });
  });
  $("#journalQuickNote")?.addEventListener("input", event => {
    const field = event.currentTarget;
    const date = field.dataset.date || selectedTimelineDate || isoDate(new Date());
    const status = $("#journalQuickSave");
    if (status) {
      status.dataset.pending = "1";
      status.textContent = languageText("正在保存", "Saving", "Speichert");
    }
    window.clearTimeout(journalSaveTimer);
    journalSaveTimer = window.setTimeout(() => {
      state.logs[date] = { ...getLog(date), note: field.value };
      saveState();
      if (status) {
        delete status.dataset.pending;
        status.textContent = languageText("已保存", "Saved", "Gespeichert");
      }
      selectedTimelineDate = date;
      if ($("#timelineView")?.classList.contains("active")) {
        renderTimelineEntryList(applyTimelineFilter(timelineEntriesForMonth(timelineCursor)));
        void renderTimelineDetail();
      }
    }, 280);
  });

  // Week module collapse (from 858ede8 modules.js): body hides, chevron turns, choice is remembered.
  const weekCollapseKey = "life-ledger-week-collapsed";
  const applyWeekCollapse = (card, collapsed) => {
    card.classList.toggle("is-collapsed", collapsed);
    const toggle = card.querySelector(".module-collapse-toggle"), body = card.querySelector(".module-body");
    toggle?.setAttribute("aria-expanded", String(!collapsed));
    toggle?.setAttribute("aria-label", collapsed ? languageText("展开", "Expand", "Ausklappen") : languageText("收起", "Collapse", "Einklappen"));
    if (body) body.hidden = collapsed;
  };
  let weekCollapsed = [];
  try { weekCollapsed = JSON.parse(localStorage.getItem(weekCollapseKey) || "[]"); } catch {}
  $$("#weekView .module-card[data-module]").forEach(card => applyWeekCollapse(card, weekCollapsed.includes(card.dataset.module)));
  $("#weekView")?.addEventListener("click", event => {
    const toggle = event.target.closest(".module-collapse-toggle"), card = toggle?.closest(".module-card[data-module]");
    if (!card) return;
    event.preventDefault();
    const collapsed = !card.classList.contains("is-collapsed");
    applyWeekCollapse(card, collapsed);
    if (!collapsed) { const body = card.querySelector(".module-body"); body?.classList.remove("module-open"); void body?.offsetWidth; body?.classList.add("module-open"); }
    weekCollapsed = collapsed ? [...new Set([...weekCollapsed, card.dataset.module])] : weekCollapsed.filter(id => id !== card.dataset.module);
    try { localStorage.setItem(weekCollapseKey, JSON.stringify(weekCollapsed)); } catch {}
  });
  $('#weekCalendarConnect').addEventListener('click',openGoogleCalendarSettings);
  $('#weekArchiveLink').addEventListener('click',()=>{selectedArchiveWeek=selectedWorkspaceWeek;syncJournalMonthOptions();$('#journalMonthFilter').value=isoDate(weekDatesFromKey(selectedWorkspaceWeek).monday).slice(0,7);setJournalMode('weeks');switchToView('timeline');});
  $("#habitInspectorForm")?.addEventListener("submit", saveHabitFromInspector);
  $("#habitInspectorForm")?.elements.frequency?.addEventListener("change", updateHabitInspectorRules);
  $$('#habitInspectorForm input[name="trackingMode"]').forEach(input => input.addEventListener("change", updateHabitInspectorRules));
  $("#inspectorIconPickerTrigger")?.addEventListener("click", () => {
    const popover = $("#inspectorIconPickerPopover");
    const trigger = $("#inspectorIconPickerTrigger");
    if (!popover || !trigger) return;
    const opening = popover.hidden;
    popover.hidden = !opening;
    trigger.setAttribute("aria-expanded", String(opening));
  });
  $("#inspectorDeleteHabitButton")?.addEventListener("click", deleteHabitFromInspector);
  $$("#habitContextMenu [data-habit-context]").forEach(button => button.addEventListener("click", () => handleHabitContextAction(button.dataset.habitContext)));
  document.addEventListener("click", event => {
    if (!event.target.closest("#habitContextMenu")) closeHabitContextMenu();
  });
  document.addEventListener("keydown", event => {
    if (!habitContextMenu.open) return;
    const menu = $("#habitContextMenu");
    const items = [...$$("#habitContextMenu [role='menuitem']")];
    const index = items.indexOf(document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      closeHabitContextMenu();
      return;
    }
    if (event.key === "ArrowDown" && items.length) {
      event.preventDefault();
      items[(index + 1 + items.length) % items.length]?.focus();
    }
    if (event.key === "ArrowUp" && items.length) {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    }
  });

  window.addEventListener("pointermove", moveHabitDrag, { passive: false });
  window.addEventListener("pointerup", finishHabitSettingsDrag);
  window.addEventListener("pointercancel", finishHabitSettingsDrag);
  // Font mode (user 10/22): Apple system fonts by default; rounded and serif as calm alternatives.
  const fontSelect = $("#fontSelect");
  if (fontSelect) {
    fontSelect.value = ["rounded", "serif"].includes(localStorage.getItem("life-ledger-font")) ? localStorage.getItem("life-ledger-font") : "system";
    fontSelect.addEventListener("change", () => {
      const font = fontSelect.value;
      localStorage.setItem("life-ledger-font", font);
      if (font === "system") delete document.documentElement.dataset.font; else document.documentElement.dataset.font = font;
      showToast(languageText("字体已切换", "Font changed", "Schrift geändert"));
    });
  }
  $("#themeSelect").addEventListener("change", event => {
    themeChoice = event.target.value;
    localStorage.setItem(THEME_KEY, themeChoice);
    applyTheme();
  });
  $("#sidebarToggle").addEventListener("click", () => {
    sidebarCollapsed = !sidebarCollapsed;
    localStorage.setItem(SIDEBAR_KEY, String(sidebarCollapsed));
    applySidebarState();
  });
  $("#mobileToolbarToggle").addEventListener("click", () => {
    mobileToolbarOpen = !mobileToolbarOpen;
    syncMobileToolbar();
  });
  systemTheme.addEventListener("change", () => { if (themeChoice === "system") applyTheme(); });
  $("#languageSelect").addEventListener("change", event => {
    currentLang = event.target.value;
    localStorage.setItem(LANGUAGE_KEY, currentLang);
    localStorage.setItem(LANGUAGE_PREFERENCE_KEY, "true");
    const url = new URL(location.href);
    url.searchParams.set("lang", currentLang);
    history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    document.body.classList.remove("language-changing");
    void document.body.offsetWidth;
    document.body.classList.add("language-changing");
    voiceReflection?.setLanguage(currentLang);
    renderAll();
    if ($("#dayDrawer").classList.contains("open")) renderDrawer();
    window.setTimeout(() => document.body.classList.remove("language-changing"), 260);
  });
  $$(".nav-item").forEach(button => button.addEventListener("click", () => switchToView(button.dataset.view)));
  $("#timelinePreviousMonth").addEventListener("click", () => { timelineCursor.setMonth(timelineCursor.getMonth() - 1); void renderTimeline(); });
  $("#timelineNextMonth").addEventListener("click", () => { timelineCursor.setMonth(timelineCursor.getMonth() + 1); void renderTimeline(); });
  initSettingsDialog();
  $("#prevMonth").addEventListener("click", () => { cursor.setMonth(cursor.getMonth() - 1); renderAll(); void loadGoogleCalendarMonth(cursor); });
  $("#nextMonth").addEventListener("click", () => { cursor.setMonth(cursor.getMonth() + 1); renderAll(); void loadGoogleCalendarMonth(cursor); });
  $$('[data-calendar-view]').forEach(button => button.addEventListener("click", () => setCalendarViewMode(button.dataset.calendarView)));
  $("#clearDemoWorkspace")?.addEventListener("click", clearDemoWorkspace);
  $("#demoPreviewReset")?.addEventListener("click", resetPreviewDemoWorkspace);
  $("#todayButton").addEventListener("click", () => {
    cursor = new Date();
    cursor.setHours(12, 0, 0, 0);
    selectedPlanningDate = isoDate(cursor);
    setDailyToolPage("journal", { smooth: false });
    renderAll();
    void loadGoogleCalendarMonth(cursor);
  });
  $("#previousHabitPage").addEventListener("click", () => setTodayHabitPage(todayHabitPage - 1));
  $("#nextHabitPage").addEventListener("click", () => setTodayHabitPage(todayHabitPage + 1));
  $$('[data-daily-tool]').forEach(button => button.addEventListener("click", () => setDailyToolPage(button.dataset.dailyTool)));
  $$('[data-daily-tool-page]').forEach(button => button.addEventListener("click", () => setDailyToolPage(button.dataset.dailyToolPage)));
  $("#focusMiniStatus").addEventListener("click", () => setDailyToolPage("focus"));
  $("#dailyToolViewport").addEventListener("scroll", () => {
    cancelAnimationFrame(dailyToolScrollFrame);
    dailyToolScrollFrame = requestAnimationFrame(syncDailyToolPageFromScroll);
  }, { passive: true });
  $("#dailyToolViewport").addEventListener("keydown", event => {
    if (event.target !== event.currentTarget || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    event.preventDefault();
    setDailyToolPage(event.key === "ArrowRight" ? "focus" : "journal");
  });
  $("#openFocusTimer").addEventListener("click", () => openFocusTimerDialog());
  $$('[data-quick-focus-preset]').forEach(button => button.addEventListener("click", () => selectQuickFocusPreset(button.dataset.quickFocusPreset)));
  $("#focusQuickPrimary").addEventListener("click", handleFocusQuickPrimary);
  $("#focusQuickFinish").addEventListener("click", () => focusTimer?.endFocus("finishedEarly"));
  $("#focusQuickSkip").addEventListener("click", () => {
    focusTimer?.skipBreak();
    releaseFocusWakeLock();
  });
  $$(".close-focus-dialog").forEach(button => button.addEventListener("click", () => $("#focusDialog").close()));
  $("#focusDialog").addEventListener("cancel", event => {
    event.preventDefault();
    $("#focusDialog").close();
  });
  $$('[data-focus-preset]').forEach(button => button.addEventListener("click", () => selectFocusPreset(button.dataset.focusPreset)));
  $("#focusPrimary").addEventListener("click", handleFocusPrimary);
  $("#focusFinish").addEventListener("click", () => {
    focusTimer?.endFocus("finishedEarly");
    $("#focusDialog").close();
  });
  $("#focusInterrupt").addEventListener("click", async () => {
    if (!(await appConfirm(tr("focus.confirmEnd")))) return;
    focusTimer?.endFocus("interrupted");
    $("#focusDialog").close();
  });
  $("#focusSkipBreak").addEventListener("click", () => {
    focusTimer?.skipBreak();
    releaseFocusWakeLock();
    $("#focusDialog").close();
  });
  $("#todayHabitViewport").addEventListener("scroll", () => {
    cancelAnimationFrame(habitCarouselScrollFrame);
    habitCarouselScrollFrame = requestAnimationFrame(syncHabitCarouselPageFromScroll);
  }, { passive: true });
  $("#todayHabitViewport").addEventListener("keydown", event => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (event.target.closest(".habit-card")) return;
    event.preventDefault();
    setTodayHabitPage(todayHabitPage + (event.key === "ArrowRight" ? 1 : -1));
  });
  $("#todayHabitViewport").addEventListener("pointerdown", event => {
    if (event.pointerType !== "mouse" || event.button !== 0 || event.target.closest(".habit-card")) return;
    const viewport = event.currentTarget;
    habitCarouselDrag = { pointerId: event.pointerId, startX: event.clientX, startScroll: viewport.scrollLeft, moved: false };
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add("dragging");
  });
  $("#todayHabitViewport").addEventListener("pointermove", event => {
    if (!habitCarouselDrag || event.pointerId !== habitCarouselDrag.pointerId) return;
    const delta = event.clientX - habitCarouselDrag.startX;
    if (Math.abs(delta) > 5) habitCarouselDrag.moved = true;
    if (habitCarouselDrag.moved) event.currentTarget.scrollLeft = habitCarouselDrag.startScroll - delta;
  });
  const finishHabitDrag = event => {
    if (!habitCarouselDrag || event.pointerId !== habitCarouselDrag.pointerId) return;
    const viewport = event.currentTarget;
    suppressHabitCardClick = habitCarouselDrag.moved;
    viewport.classList.remove("dragging");
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    habitCarouselDrag = null;
    setTodayHabitPage(Math.round(viewport.scrollLeft / Math.max(1, viewport.clientWidth)));
    window.setTimeout(() => { suppressHabitCardClick = false; }, 0);
  };
  $("#todayHabitViewport").addEventListener("pointerup", finishHabitDrag);
  $("#todayHabitViewport").addEventListener("pointercancel", finishHabitDrag);
  $$("#quickMood button").forEach(b => b.addEventListener("click", () => setMood(selectedPlanningDate, b.dataset.mood)));
  $$("#drawerMood button").forEach(b => b.addEventListener("click", () => setMood(selectedDate, b.dataset.mood)));
  $("#quickMoodReason").addEventListener("click", () => {
    const date = selectedPlanningDate;
    const log = getLog(date);
    if (log.mood) openMoodReasonDialog(date, log.mood);
  });
  $("#drawerMoodReason").addEventListener("click", () => {
    const log = getLog(selectedDate);
    if (log.mood) openMoodReasonDialog(selectedDate, log.mood);
  });
  $("#drawerMemoryEdit").addEventListener("click", () => {
    const mood = getLog(selectedDate).mood;
    if (mood) openMoodReasonDialog(selectedDate, mood);
  });
  $$(".close-mood-reason").forEach(button => button.addEventListener("click", closeMoodReasonDialog));
  $("#moodReasonForm").addEventListener("submit", saveMoodReason);
  $("#moodReasonDialog").addEventListener("cancel", event => {
    event.preventDefault();
    closeMoodReasonDialog();
  });
  $("#previousPlanDay").addEventListener("click", () => shiftPlanningDay(-1));
  $("#nextPlanDay").addEventListener("click", () => shiftPlanningDay(1));
  $("#toggleRoutineEvents").addEventListener("click", () => {
    dayPlanRoutinesExpanded = !dayPlanRoutinesExpanded;
    renderDaySchedule();
  });
  $("#openDayPlan").addEventListener("click", openDayPlanDialog);
  $$(".close-day-plan").forEach(button => button.addEventListener("click", () => $("#dayPlanDialog").close()));
  $("#dayPlanDialog").addEventListener("cancel", event => { event.preventDefault(); $("#dayPlanDialog").close(); });
  $("#calendarConnectionButton").addEventListener("click", openGoogleCalendarSettings);
  $("#calendarConnectButton").addEventListener("click", connectGoogleCalendar);
  $("#calendarAddAccountButton").addEventListener("click", connectGoogleCalendar);
  $("#calendarRefreshButton").addEventListener("click", refreshGoogleCalendar);
  $("#calendarPreferencesSave").addEventListener("click", saveGoogleCalendarPreferences);
  $$(".close-calendar-settings").forEach(button => button.addEventListener("click", () => $("#calendarSettingsDialog").close()));
  $("#calendarSettingsDialog").addEventListener("cancel", event => { event.preventDefault(); $("#calendarSettingsDialog").close(); });
  $("#homeDayNote").addEventListener("input", event => {
    if (isFutureDate(selectedPlanningDate)) return;
    state.logs[selectedPlanningDate] = { ...getLog(selectedPlanningDate), note: event.target.value };
    saveState();
  });
  $("#closeDrawer").addEventListener("click", closeDrawer); $("#drawerBackdrop").addEventListener("click", closeDrawer);
  $("#dayNote").addEventListener("input", event => {
    if (isFutureDate(selectedDate)) return;
    state.logs[selectedDate] = { ...getLog(selectedDate), note: event.target.value }; saveState();
    $("#saveState").textContent = tr("drawer.saved"); clearTimeout(bindEvents.saveTimer);
    bindEvents.saveTimer = setTimeout(() => $("#saveState").textContent = tr("drawer.saveIdle"), 1300);
  });
  $("#completeDay").addEventListener("click", () => { closeDrawer(); renderAll(); showToast(tr("drawer.completeToast")); });
  $("#addHabitButton").addEventListener("click", () => openHabitDialog());
  $$(".close-habit-dialog").forEach(button => button.addEventListener("click", closeHabitDialog));
  $("#deleteHabitButton").addEventListener("click", deleteHabit);
  $("#habitDialog").addEventListener("cancel", event => {
    event.preventDefault();
    closeHabitDialog();
  });
  $$("[data-open-settings]").forEach(b => b.addEventListener("click", () => $(".nav-item[data-view='habits']").click()));
  $("#habitForm").elements.frequency.addEventListener("change", updateHabitFormRules);
  $$('#habitForm input[name="trackingMode"]').forEach(input => input.addEventListener("change", updateHabitFormRules));
  $("#habitForm").addEventListener("input", updateHabitFormPreview);
  $("#iconPickerTrigger").addEventListener("click", () => {
    toggleHabitPicker("icon");
  });
  $("#colorPickerTrigger").addEventListener("click", () => {
    toggleHabitPicker("color");
  });
  $("#habitForm").addEventListener("submit", saveHabitFromForm);
  $$("[data-analytics-chart]").forEach(button => button.addEventListener("click", () => {
    analyticsChartType = button.dataset.analyticsChart;
    $$("[data-analytics-chart]").forEach(item => item.classList.toggle("active", item === button));
    renderReview();
  }));
  $("#focusReviewWeekSelect").addEventListener("change", event => {
    selectedReviewWeek = event.target.value;
    focusReviewScope = "week";
    renderReview();
  });
  $("#focusReviewMonthSelect").addEventListener("change", event => {
    selectedFocusReviewMonth = event.target.value;
    focusReviewScope = "month";
    renderReview();
  });
  $$('[data-focus-review-scope]').forEach(button => button.addEventListener("click", () => {
    focusReviewScope = button.dataset.focusReviewScope === "month" ? "month" : "week";
    renderReview();
  }));
  $("#addPeriodTarget").addEventListener("click", () => openHabitDialog());
  $("#reviewText").addEventListener("input", e => { state.reviews[monthKey(cursor)] = e.target.value; saveState(); fitReviewText(); });
  $("#weeklyGoalForm").addEventListener("submit", event => {
    event.preventDefault();
    const input = $("#weeklyGoalInput"), text = input.value.trim();
    if (!text) return;
    const key = selectedWorkspaceWeek;
    state.weeklyGoals[key] = [...(state.weeklyGoals[key] || []), { id: createId(), text, done: false }];
    input.value = ""; saveState(); renderWeeklyWorkspace(); showToast(tr("week.added"));
  });
  $$('[data-goal-horizon]').forEach(button => button.addEventListener("click", () => {
    if (button.dataset.goalHorizon === "long") return openLongTermWorkspace();
    goalHorizon = "week";
    applyGoalHorizon();
  }));
  $("#addLongTermGoal").addEventListener("click", () => openLongTermGoalDialog());
  $("#longTermGoalForm").addEventListener("submit", saveLongTermGoal);
  $("#deleteLongTermGoal").addEventListener("click", deleteLongTermGoal);
  $$(".close-long-term-dialog").forEach(button => button.addEventListener("click", closeLongTermGoalDialog));
  $("#longTermGoalDialog").addEventListener("cancel", event => { event.preventDefault(); closeLongTermGoalDialog(); });
  $("#weeklyOutputText").addEventListener("input", event => {
    const key = selectedWorkspaceWeek;
    state.weeklyOutputs[key] = event.target.value; saveState();
    autoGrowTextarea(event.target);
    $("#weeklyOutputStatus").textContent = event.target.value.trim() ? tr("week.outputStatus", { count: event.target.value.trim().length }) : tr("week.outputEmpty");
  });
  $("#previousWorkspaceWeek").addEventListener("click", () => {
    selectedWorkspaceWeek = shiftWeekKey(selectedWorkspaceWeek, -1);
    renderWeeklyWorkspace();
  });
  $("#nextWorkspaceWeek").addEventListener("click", () => {
    selectedWorkspaceWeek = shiftWeekKey(selectedWorkspaceWeek, 1);
    renderWeeklyWorkspace();
  });
  $("#currentWorkspaceWeek").addEventListener("click", () => {
    const currentKey = isoWeekKey(new Date());
    if (selectedWorkspaceWeek === currentKey) return;
    selectedWorkspaceWeek = currentKey;
    renderWeeklyWorkspace();
  });
  $("#exportButton").addEventListener("click", openBackupDialog);
  $$('[data-backup-tab]').forEach(button => button.addEventListener("click", () => setBackupTab(button.dataset.backupTab)));
  $("#cloudAccountButton").hidden = cloudProvider !== "cloudbase";
  $("#cloudAccountButton").addEventListener("click", openCloudBaseAuth);
  $$(".close-cloudbase-auth").forEach(button => button.addEventListener("click", () => $("#cloudbaseAuthDialog").close()));
  $("#cloudbaseSendCode").addEventListener("click", async () => {
    const email = $("#cloudbaseEmail").value.trim();
    if (!email || !$("#cloudbaseEmail").checkValidity()) {
      $("#cloudbaseEmail").reportValidity();
      return;
    }
    const button = $("#cloudbaseSendCode");
    button.disabled = true;
    button.textContent = tr("cloudbase.sending");
    setCloudBaseAuthStatus();
    try {
      await cloudBaseAdapter.sendEmailCode(email);
      setCloudBaseAuthStatus(tr("cloudbase.sent"));
      $("#cloudbaseCode").focus();
    } catch (error) {
      console.warn("CloudBase verification request failed", error);
      setCloudBaseAuthStatus(error?.message || tr("cloudbase.error"), true);
    } finally {
      button.disabled = false;
      button.textContent = tr("cloudbase.send");
    }
  });
  $("#cloudbaseAuthForm").addEventListener("submit", async event => {
    event.preventDefault();
    const button = $("#cloudbaseAuthConfirm");
    button.disabled = true;
    button.textContent = tr("cloudbase.signingIn");
    setCloudBaseAuthStatus();
    try {
      await cloudBaseAdapter.signInWithEmailCode($("#cloudbaseEmail").value, $("#cloudbaseCode").value);
      authExpired = false;
      await refreshCloudBaseAccount();
      setCloudBaseAuthStatus(tr("cloudbase.connected"));
      await pullCloudState();
      setTimeout(() => $("#cloudbaseAuthDialog").close(), 450);
    } catch (error) {
      console.warn("CloudBase sign-in failed", error);
      setCloudBaseAuthStatus(error?.message || tr("cloudbase.error"), true);
    } finally {
      button.disabled = false;
      button.textContent = tr("cloudbase.confirm");
    }
  });
  $("#cloudbaseSignOut").addEventListener("click", async () => {
    await cloudBaseAdapter.signOut();
    cloudBaseLoginState = null;
    markAuthExpired();
    $("#cloudbaseSignOut").hidden = true;
    setCloudBaseAuthStatus(tr("cloudbase.signedOut"));
  });
  $("#habitReminderCard").addEventListener("click", openReminderDialog);
  $$(".close-reminder-dialog").forEach(button => button.addEventListener("click", () => $("#reminderDialog").close()));
  $("#testReminderButton").addEventListener("click", async () => {
    const permission = await requestNotificationPermission();
    updateReminderStatus();
    if (permission === "granted") await sendReminderNotification(true);
  });
  $("#saveReminderButton").addEventListener("click", async () => {
    const enabled = $("#reminderEnabled").checked;
    const time = $("#reminderTime").value || "21:00";
    const permission = enabled ? await requestNotificationPermission() : reminderPermission();
    reminderSettings = { ...reminderSettings, enabled: enabled && permission === "granted", time };
    localStorage.setItem(REMINDER_KEY, JSON.stringify(reminderSettings));
    updateReminderStatus();
    armReminderClock();
    showToast(tr("reminder.saved"));
    if (!enabled || permission === "granted") $("#reminderDialog").close();
  });
  $$('[data-install-app]').forEach(button => button.addEventListener("click", installApp));
  $$('#exportForm input[name="exportScope"]').forEach(input => input.addEventListener("change", updateExportFields));
  $("#exportForm").addEventListener("submit", downloadExport);
  $("#chooseImportFile").addEventListener("click", async () => {
    if (!desktopNativeBackup) {
      $("#importFile").click();
      return;
    }
    try {
      const selected = await desktopBridge.openBackupJson();
      if (!selected || selected.cancelled || !selected.contents) return;
      const name = selected.name || `life-ledger-backup-${isoDate(new Date())}.json`;
      const file = new File([selected.contents], name, { type: "application/json" });
      await previewImportFile(file);
    } catch (error) {
      console.warn("Native backup import failed", error);
      clearImportSelection();
      $("#importError").textContent = String(error?.message || "").includes("file-too-large")
        ? tr("backup.tooLarge")
        : tr("backup.invalid");
      $("#importError").hidden = false;
    }
  });
  $("#clearImportFile").addEventListener("click", () => {
    clearImportSelection();
    if (!desktopNativeBackup) $("#importFile").click();
  });
  $("#importFile").addEventListener("change", event => previewImportFile(event.target.files?.[0]));
  $("#restoreImport").addEventListener("click", restorePendingImport);
  $("#undoRestore").addEventListener("click", undoLastRestore);
  $$(".close-export-dialog").forEach(button => button.addEventListener("click", () => {
    clearImportSelection();
    $("#exportDialog").close();
  }));
  $("#saveMode").addEventListener("click", () => {
    if (!authExpired) return;
    if (cloudProvider === "cloudbase") openCloudBaseAuth();
    else location.reload();
  });
  window.addEventListener("online", () => {
    if (cloudMode && !authExpired) pushCloudState();
  });
  // Cloud edition: coming back to the window (tab switch or app switch on the Mac) picks up other devices' changes.
  let lastReturnPull = 0;
  const pullOnReturn = () => {
    if (!cloudMode || authExpired || Date.now() - lastReturnPull < 10000) return;
    lastReturnPull = Date.now(); void pullCloudState();
  };
  window.addEventListener("focus", pullOnReturn);
  document.addEventListener("visibilitychange", () => {
    focusTimer?.reconcile();
    if (!document.hidden) {
      pullOnReturn();
      maybeSendDailyReminder();
      if (focusTimer?.snapshot()?.status === "running") acquireFocusWakeLock();
    }
  });
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    $$('[data-install-app]').forEach(button => {
      button.classList.add("ready");
      button.setAttribute("title", tr("pwa.ready"));
    });
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    $$('[data-install-app]').forEach(button => button.classList.remove("ready"));
    showToast(tr("pwa.installed"));
  });
  window.addEventListener("resize", () => {
    syncExportButtonPlacement();
    syncMobileToolbar();
    autoGrowTextarea($("#weeklyOutputText"));
    setDailyToolPage(dailyToolPage, { smooth: false });
  }, { passive: true });
  document.addEventListener("pointerdown", event => {
    if (!$("#habitDialog").open || event.target.closest(".icon-picker-field, .color-picker-field")) return;
    closeHabitPickers();
  });
  document.addEventListener("focusin", event => {
    if (!$("#habitDialog").open || event.target.closest(".icon-picker-field, .color-picker-field")) return;
    closeHabitPickers();
  });
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    const pickerOpen = [$("#iconPickerPopover"), $("#colorPickerPopover")].some(panel => panel && !panel.hidden);
    if (pickerOpen) {
      e.preventDefault();
      e.stopPropagation();
      closeHabitPickers("", true);
      return;
    }
    closeDrawer();
  }, true);
}

let weekCalendarReadError = false;
let selectedTimelineDate = isoDate(new Date());
let timelineFilter = "all";
let journalMode = "weeks";
let journalVisibleCount = 24;
let insightView = "trend";
let analyticsWindow = 30;
let selectedHabitSettingsId = "";
let habitContextMenu = { open: false, habitId: "", anchor: null, date: "" };
let journalSaveTimer = 0;
let selectedArchiveWeek = '';
let habitLibraryFilter = 'all';
let habitLibrarySearch = '';

function renderWeekCalendar() {
  const host = $('#weekCalendar');
  if (!host) return;
  const {monday} = weekDatesFromKey(selectedWorkspaceWeek);
  const range = calendarMonthRange(monday), loading = googleCalendarLoadingMonths.has(range.key);
  const available = cloudProvider === 'cloudflare' && googleCalendar.configured;
  let count = 0;
  host.innerHTML = Array.from({length:7},(_,index)=>{
    const day = new Date(monday);day.setDate(monday.getDate()+index);const key = isoDate(day);
    const demo = !googleCalendar.connected && demoWorkspaceApi()?.isDemoActive(state);
    const events = googleCalendar.connected || demo ? calendarEventsForDate(key) : [];
    count += events.length;
    return `<section class="week-calendar-day ${key === isoDate(new Date()) ? 'is-today' : ''}" role="listitem"><header><span>${escapeHtml(formatLocalizedDate(day,{weekday:'short'}))}</span><strong>${escapeHtml(formatLocalizedDate(day,{month:'short',day:'numeric'}))}</strong></header><div>${events.length ? events.map(event=>`<article class="week-calendar-event"><time>${escapeHtml(event.allDay ? languageText('全天','All day','Ganztägig') : [event.start,event.end].filter(Boolean).join('–'))}</time><strong>${escapeHtml(event.title || languageText('未命名日程','Untitled event','Unbenannter Termin'))}</strong>${event.calendarName ? `<small>${escapeHtml(event.calendarName)}</small>` : ''}</article>`).join('') : `<p class="week-calendar-empty">${escapeHtml(googleCalendar.connected ? loading ? languageText('读取中…','Loading…','Wird geladen…') : languageText('留一点空白','Room to breathe','Raum für dich') : '—')}</p>`}</div></section>`;
  }).join('');
  const status = $('#weekCalendarStatus'), connect = $('#weekCalendarConnect');
  const demoCalendar = !googleCalendar.connected && demoWorkspaceApi()?.isDemoActive(state);
  status.textContent = demoCalendar ? languageText('示例日程','Sample schedule','Beispieltermine') : !googleCalendar.connected ? available ? languageText('连接后，这一周的日程会显示在这里。','Connect to see this week’s schedule here.','Verbinde deinen Kalender für die Termine dieser Woche.') : languageText('在线连接版可读取 Google 日历；纯本地模式尚未连接。','Google Calendar is available in the connected edition; local mode is not connected.','Google Kalender ist in der verbundenen Ausgabe verfügbar; lokal nicht verbunden.') : loading ? languageText('正在读取本周日程…','Reading this week’s events…','Wochentermine werden geladen…') : weekCalendarReadError || googleCalendar.stale ? languageText('暂时无法更新，保留已缓存日程。','Cannot refresh. Showing any cached events.','Aktualisierung nicht möglich. Vorhandene Termine bleiben sichtbar.') : languageText(`${count} 项日程 · 只读`,`${count} events · Read only`,`${count} Termine · Nur lesen`);
  connect.hidden = !available;
  connect.textContent = googleCalendar.connected ? languageText('选择日历','Calendars','Kalender wählen') : tr('calendarSync.trigger');
  host.dataset.connected = String(googleCalendar.connected);
}

function formatLocalizedDate(date, options = {}) {
  return new Intl.DateTimeFormat(dateLocale(), options).format(date);
}

function dateLocale() {
  return currentLang === "zh" ? "zh-CN" : currentLang === "de" ? "de-DE" : "en-GB";
}

function renderWeekInsights() {
  const grid = $("#weekInsightsGrid");
  if (!grid) return;

  const key = selectedWorkspaceWeek;
  const { monday } = weekDatesFromKey(key);
  const todayKey = isoDate(new Date());

  let totalScored = 0;
  let totalDone = 0;
  let bestDayName = "—";
  let maxDayDone = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dayIso = isoDate(d);
    const scored = dailyHabits(dayIso);
    const done = scored.filter(h => getLog(dayIso).completed.includes(h.id)).length;

    if (dayIso <= todayKey) {
      totalScored += scored.length;
      totalDone += done;
    }

    if (dayIso <= todayKey && done > maxDayDone) {
      maxDayDone = done;
      bestDayName = formatLocalizedDate(d, { weekday: "short" });
    }
  }

  const rate = totalScored > 0 ? Math.round((totalDone / totalScored) * 100) : 0;
  setText("#weekCompletionRate", `${rate}%`);
  setText("#weekBestDay", bestDayName);

  const streakEnd = new Date(monday);
  streakEnd.setDate(monday.getDate() + 6);
  const streakDate = isoDate(streakEnd) < todayKey ? isoDate(streakEnd) : todayKey;
  const activeHabitList = activeHabits(streakDate);
  const maxStreak = isoDate(monday) > todayKey ? 0 : activeHabitList.length ? Math.max(0, ...activeHabitList.map(h => habitStreak(h.id, streakDate))) : 0;
  setText("#weekStreak", languageText(`${maxStreak} 天`, `${maxStreak} days`, `${maxStreak} Tage`));

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const startDay = isoDate(monday);
  const endDay = isoDate(sunday);
  const weekSessions = (state.focusSessions || []).filter(s => s.date >= startDay && s.date <= endDay && (s.outcome === "completed" || s.outcome === "finishedEarly"));
  const weekFocusMinutes = weekSessions.reduce((acc, s) => acc + Math.round(s.actualMinutes || s.durationMinutes || 0), 0);
  setText("#weekFocusMinutes", languageText(`${weekFocusMinutes} 分钟`, `${weekFocusMinutes} min`, `${weekFocusMinutes} Min.`));

  setText("#weekRateLabel", tr("week.completionRate"));
  setText("#weekBestDayLabel", tr("week.bestDay"));
  setText("#weekStreakLabel", languageText('最长习惯连续', 'Best habit streak', 'Längste Gewohnheitsserie'));
  setText("#weekFocusMinutesLabel", tr("week.focusTime"));

  const emptyArt = $("#weekInsightsEmptyArt");
  if (emptyArt) {
    const hasData = totalDone > 0 || weekFocusMinutes > 0;
    emptyArt.hidden = hasData;
    if (!hasData) {
      window.LifeLedgerInteraction?.mountHairline(emptyArt, "./assets/hairline/week-insights-empty.svg");
    }
  }
}

function habitStreak(habitId, date) {
  let streak = 0;
  const cursorDate = parseDate(date);
  for (let i = 0; i < 365; i++) {
    const key = isoDate(cursorDate);
    const log = getLog(key);
    if (!log.completed.includes(habitId)) break;
    streak += 1;
    cursorDate.setDate(cursorDate.getDate() - 1);
  }
  return streak;
}

function renderWeekPromotedReview() {
  const key = selectedWorkspaceWeek;
  const output = state.weeklyOutputs[key] || "";
  const art = $("#weekReviewHairline");
  const artSrc = output.trim() ? "./assets/hairline/week-review-done.svg" : "./assets/hairline/week-review-empty.svg";
  if (art && art.dataset.hairlineSrc !== artSrc) {
    art.dataset.hairlineSrc = artSrc;
    art.dataset.hairlineReady = "true";
    window.LifeLedgerInteraction?.mountHairline(art, artSrc);
  }
}

function hairlineEmptyMarkup(asset, title, help, attrs = "") {
  return `<div class="hairline-empty"><div class="hairline-mount is-empty" data-hairline-src="${escapeHtml(asset)}" ${attrs} aria-hidden="true"></div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(help)}</p></div>`;
}

function hydrateHairlineMounts(scope = document) {
  scope.querySelectorAll(".hairline-mount[data-hairline-src]:not([data-hairline-ready])").forEach(host => {
    host.dataset.hairlineReady = "true";
    window.LifeLedgerInteraction?.mountHairline(host, host.dataset.hairlineSrc);
  });
}

function weekDaysWithCompletion(key) {
  const { monday } = weekDatesFromKey(key);
  let filled = 0;
  for (let index = 0; index < 7; index += 1) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const day = isoDate(date);
    if (getLog(day).completed.length) filled += 1;
  }
  return Math.min(7, filled);
}

// Month filter: a native menu of the months that have entries (was an empty <input type=month> "---- --").
function syncJournalMonthOptions() {
  const select = $('#journalMonthFilter');
  if (!select || select.tagName !== 'SELECT') return;
  const months = [...new Set(Object.keys(state.logs).filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key) && !isFutureDate(key)).map(key => key.slice(0, 7)))].sort().reverse();
  const current = select.value;
  select.innerHTML = `<option value="">${escapeHtml(languageText('全部月份', 'All months', 'Alle Monate'))}</option>` + months.map(m => `<option value="${m}">${escapeHtml(formatLocalizedDate(new Date(`${m}-01T12:00:00`), { year: 'numeric', month: 'long' }))}</option>`).join('');
  select.value = months.includes(current) ? current : '';
}

async function renderJournalFeed(version) {
  syncJournalMonthOptions();
  const mode = journalMode, month = $('#journalMonthFilter').value;
  const host = $('#journalFeed');
  const words = mode === 'weeks' ? languageText('周度','Weekly','Wöchentlich') : mode === 'months' ? languageText('月度','Monthly','Monatlich') : languageText('日度','Daily','Täglich');
  $('#journalFeedKicker').textContent = languageText('留下来的，都是生活','LIFE, IN YOUR OWN WORDS','DAS LEBEN, IN EIGENEN WORTEN');
  $('#journalFeedTitle').textContent = languageText(`${words}时间轴`,`${words} timeline`,`${words}e Zeitleiste`);
  $('#journalFeedDescription').textContent = languageText('沿着时间向下读。文字在前，照片是偶尔的注脚。','Read down through time. Your words lead; photos are little footnotes.','Durch die Zeit nach unten lesen. Worte zuerst, Fotos als kleine Fußnoten.');
  $('#journalMonthFilterLabel').textContent = languageText('定位月份','Go to month','Monat wählen');
  $('#journalAllMonths').textContent = languageText('全部月份','All months','Alle Monate');
  $('#journalAllMonths').disabled = !month;
  let entries = [], photos = [], photoError = false;
  if (mode === 'weeks') {
    entries = Object.keys(state.weeklyOutputs || {})
      .filter(key => /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/.test(key))
      .map(key => { const {monday,sunday} = weekDatesFromKey(key); return {key,from:isoDate(monday),to:isoDate(sunday),text:state.weeklyOutputs?.[key] || '',label:formatWeekRange(key)}; });
  } else if (mode === 'months') {
    entries = Object.entries(state.reviews || {}).filter(([key]) => /^\d{4}-(0[1-9]|1[0-2])$/.test(key))
      .map(([key,text]) => ({key,from:`${key}-01`,to:isoDate(new Date(Number(key.slice(0,4)),Number(key.slice(5,7)),0,12)),text,label:formatLocalizedDate(parseDate(`${key}-01`),{year:'numeric',month:'long'})}));
  } else {
    entries = Object.entries(state.logs || {}).filter(([,log]) => log.note || log.mood || log.moodReason)
      .map(([date,log]) => ({key:date,from:date,to:date,text:log.note || log.moodReason || '',mood:log.mood,label:formatLocalizedDate(parseDate(date),{weekday:'short',month:'long',day:'numeric',year:'numeric'})}));
  }
  entries = entries.filter(e => mode === 'timeline' || String(e.text).trim() || String(e.extra || '').trim())
    .filter(e => !month || (e.from.slice(0,7) <= month && e.to.slice(0,7) >= month)).sort((a,b) => b.from.localeCompare(a.from));
  // Only daily mode fetches the month's photos up front. Weekly photos are optional,
  // loaded on request; monthly reviews never duplicate daily media.
  if (mode === 'timeline') {
    const from = month ? `${month}-01` : '1970-01-01';
    const to = month ? isoDate(new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0,12)) : [isoDate(new Date()),entries[0]?.to || ''].sort().at(-1);
    try { photos = await photoMemories?.listRange(from,to) || []; } catch { photoError = true; }
    photos = mergeDemoTimelinePhotos(photos, from, to);
    if (version !== timelineRenderVersion) return;
    photos.forEach(photo => { if (!entries.some(e => e.key === photo.date)) entries.push({key:photo.date,from:photo.date,to:photo.date,text:'',label:formatLocalizedDate(parseDate(photo.date),{weekday:'short',month:'long',day:'numeric',year:'numeric'})}); });
    entries.sort((a,b) => b.from.localeCompare(a.from));
  }
  const visible = entries.slice(0,journalVisibleCount);
  host.innerHTML = visible.length ? visible.map(e => {
    const text = journalTextMarkup(e.text), extra = e.extra && e.extra !== e.text ? journalTextMarkup(e.extra) : '';
    const images = photos.filter(p => p.date === e.key);
    const photoDetails = mode === 'weeks' ? `<details class="feed-week-photos" data-from="${e.from}" data-to="${e.to}"><summary>${escapeHtml(languageText('看看这一周的照片','Photos from this week','Fotos dieser Woche'))}</summary><div class="feed-photo-list"></div></details>` : '';
    return `<article class="journal-feed-entry" data-key="${escapeHtml(e.key)}"><div class="feed-date"><time datetime="${e.from}">${escapeHtml(e.key)}</time><span class="feed-axis-dot" aria-hidden="true"></span></div><section class="feed-paper"><header><h3>${escapeHtml(e.label)}</h3>${e.mood ? `<span class="feed-mood" aria-label="${escapeHtml(moodLabel(e.mood))}">${moodCalendarIcon(e.mood)}</span>` : ''}</header><div class="archive-writing">${text}${extra}</div>${images.length ? `<div class="feed-photo-list">${images.map(p=>`<button type="button" data-feed-day="${p.date}" aria-label="${escapeHtml(e.label)}"><img src="${escapeHtml(p.url)}" loading="lazy" alt=""></button>`).join('')}</div>` : ''}${photoDetails}<footer><button class="text-button" type="button" data-feed-open="${escapeHtml(e.key)}">${escapeHtml(languageText('打开记录 →','Open entry →','Eintrag öffnen →'))}</button></footer></section></article>`;
  }).join('') : `<div class="feed-empty">${hairlineEmptyMarkup('./assets/hairline/empty-journal.svg',languageText('这里，留给以后的回看','Room for the next chapter','Platz für das nächste Kapitel'),languageText('这个范围还没有文字或照片。可以切换月份，或先写下一段复盘。','No writing or photos in this range yet. Try another month, or write a reflection.','Noch keine Texte oder Fotos in diesem Zeitraum. Wähle einen anderen Monat oder schreibe einen Rückblick.'))}</div>`;
  if (photoError) host.insertAdjacentHTML('afterbegin',`<p role="status">${escapeHtml(languageText('照片暂时无法读取，文字仍可浏览。','Photos could not be loaded. Your writing is still available.','Fotos konnten nicht geladen werden. Die Texte sind weiterhin verfügbar.'))}</p>`);
  hydrateHairlineMounts(host);
  $('#journalLoadMore').hidden = entries.length <= visible.length;
  $('#journalLoadMore').textContent = languageText('继续向前翻','Read further back','Weiter zurücklesen');
  host.querySelectorAll('[data-feed-open]').forEach(button => button.addEventListener('click',()=>{
    const key=button.dataset.feedOpen;
    if(mode==='weeks') openWeekFromTimeline(key);
    else if(mode==='months'){const [y,m]=key.split('-').map(Number);cursor=new Date(y,m-1,15,12);renderAll();switchToView('review');requestAnimationFrame(()=>$('#reviewText')?.scrollIntoView({block:'center'}));}
    else openDrawer(key);
  }));
  host.querySelectorAll('[data-feed-day]').forEach(button=>button.addEventListener('click',()=>openDrawer(button.dataset.feedDay)));
  host.querySelectorAll('.feed-week-photos').forEach(details=>details.addEventListener('toggle',async()=>{
    if(!details.open || details.dataset.loaded==='true') return;
    details.dataset.loaded='true';const list=details.querySelector('.feed-photo-list');
    list.textContent=languageText('读取照片…','Loading photos…','Fotos werden geladen…');
    try {
      const items=mergeDemoTimelinePhotos(await photoMemories?.listRange(details.dataset.from,details.dataset.to) || [],details.dataset.from,details.dataset.to);
      if(!details.isConnected)return;
      list.innerHTML=items.length?items.map(p=>`<button type="button" data-date="${escapeHtml(p.date)}" aria-label="${escapeHtml(p.date)}"><img src="${escapeHtml(p.url)}" alt="" loading="lazy"><span>${escapeHtml(formatLocalizedDate(parseDate(p.date),{month:'short',day:'numeric'}))}</span></button>`).join(''):escapeHtml(languageText('这一周没有照片。','No photos this week.','Keine Fotos in dieser Woche.'));
      list.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>openDrawer(button.dataset.date)));
    } catch {details.dataset.loaded='false';list.textContent=languageText('读取失败。收起后重试。','Could not load. Close and reopen to retry.','Laden fehlgeschlagen. Schließen und erneut öffnen.');}
  }));
}

function journalTextMarkup(text) {
  return String(text).split(/\n\s*\n/).map(block => /^#{1,6}\s/.test(block)
    ? `<h3>${escapeHtml(block.replace(/^#{1,6}\s*/, ''))}</h3>`
    : `<p>${escapeHtml(block)}</p>`).join('');
}

function openWeekFromTimeline(key) {
  selectedWorkspaceWeek = key;
  selectedPlanningDate = isoDate(weekDatesFromKey(key).monday);
  switchToView('week');
  $('#weeklyOutputText')?.focus({preventScroll:true});
}

function timelineEntriesForMonth(monthDate) {
  const { from, to } = timelineRange(monthDate);
  const dates = new Set(Object.keys(state.logs || {}).filter(date => date >= from && date <= to));
  return [...dates]
    .map(date => ({ date, log: getLog(date) }))
    .filter(entry => entry.log.mood || entry.log.moodReason || entry.log.note || entry.log.completed.length)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function applyTimelineFilter(entries) {
  if (timelineFilter === "photos") return entries.filter(entry => (calendarPhotosByDate.get(entry.date) || []).length);
  if (timelineFilter === "notes") return entries.filter(entry => String(entry.log.note || "").trim());
  return entries;
}

function renderTimelineEntryList(entries = []) {
  const container = $("#timelineEntryList");
  if (!container) return;
  if (!entries.length) {
    container.innerHTML = hairlineEmptyMarkup("./assets/hairline/empty-journal.svg", tr("timeline.emptyTitle"), tr("timeline.emptyHelp"));
    hydrateHairlineMounts(container);
    return;
  }
  container.innerHTML = entries.map(entry => {
    const label = timelineDateLabel(entry.date);
    const noteLines = String(entry.log.note || "").trim().split("\n").filter(Boolean);
    const excerpt = noteLines.slice(0, 2).join(" ");
    const mood = entry.log.mood ? `<span class="timeline-entry-mood" aria-label="${escapeHtml(moodLabel(entry.log.mood))}">${moodCalendarIcon(entry.log.mood)}</span>` : "";
    const photos = calendarPhotosByDate.get(entry.date) || [];
    const collage = photoCollageMarkup(photos);
    const photoIcon = photos.length && !collage ? `<span class="timeline-entry-photos" aria-label="${escapeHtml(tr("drawer.photoCount", { count: photos.length }))}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="15" rx="3"/><circle cx="9" cy="11" r="2"/><path d="m5 18 5-4 3 2 3-3 3 5"/></svg></span>` : "";
    const trailing = mood || photoIcon || collage ? `<span class="timeline-entry-trailing">${mood}${photoIcon}${collage}</span>` : "";
    return `<button type="button" class="timeline-entry-row ${entry.date === selectedTimelineDate ? "selected" : ""}" data-date="${entry.date}" role="listitem">
      <span class="timeline-entry-date"><strong>${escapeHtml(label.weekday)}</strong><span>${escapeHtml(label.day)}</span></span>
      <span class="timeline-entry-note">${escapeHtml(excerpt)}</span>
      ${trailing}
    </button>`;
  }).join("");
  container.querySelectorAll(".timeline-entry-row").forEach(button => button.addEventListener("click", () => {
    selectedTimelineDate = button.dataset.date;
    renderTimelineEntryList(entries);
    renderTimelineDetail();
    $$("#timelineView .calendar-day").forEach(day => day.classList.toggle("selected", day.dataset.date === selectedTimelineDate));
  }));
  window.LifeLedgerInteraction?.glideTo(container, container.querySelector(".timeline-entry-row.selected"));
}

function photoCollageMarkup(photos) {
  const items = (photos || []).filter(photo => photo?.url);
  if (!items.length) return "";
  const cell = (photo, extra = "") => `<span class="journal-collage-cell ${extra}"><img src="${escapeHtml(photo.url)}" alt="" /></span>`;
  if (items.length === 1) return `<span class="journal-collage is-single">${cell(items[0])}</span>`;
  if (items.length === 2) return `<span class="journal-collage is-two">${items.map(photo => cell(photo)).join("")}</span>`;
  if (items.length === 3) return `<span class="journal-collage is-mosaic">${cell(items[0], "is-span")}${cell(items[1])}${cell(items[2])}</span>`;
  if (items.length === 4) return `<span class="journal-collage is-grid">${items.map(photo => cell(photo)).join("")}</span>`;
  const visible = items.slice(0, 6);
  const overflow = items.length - visible.length;
  return `<span class="journal-collage is-six">${visible.map((photo, index) => `${cell(photo)}${index === visible.length - 1 && overflow > 0 ? `<b class="journal-collage-more">+${overflow}</b>` : ""}`).join("")}</span>`;
}

async function renderTimelineDetail() {
  const container = $("#timelineDetail");
  if (!container) return;
  const date = selectedTimelineDate;
  if (date && container.dataset.shownDate && container.dataset.shownDate !== date) {
    window.LifeLedgerInteraction?.retarget(container);
  }
  if (date) container.dataset.shownDate = date;
  if (!date) {
    container.innerHTML = `<p class="timeline-detail-empty">${escapeHtml(tr("timeline.selectDay"))}</p>`;
    return;
  }
  const log = getLog(date);
  const label = timelineDateLabel(date);
  const events = calendarEventsForDate(date).filter(event => !event.routine);
  const scored = dailyHabits(date);
  const doneCount = scored.filter(habit => log.completed.includes(habit.id)).length;
  const mood = log.mood
    ? `<span class="timeline-detail-mood-glyph">${moodCalendarIcon(log.mood)}</span><span>${escapeHtml(moodLabel(log.mood))}</span>`
    : escapeHtml(tr("today.noReflection"));
  const photos = calendarPhotosByDate.get(date) || [];
  container.innerHTML = `
    <div class="day-page day-page-composed">
      <header class="day-page-header timeline-detail-header">
        <div class="day-page-title-row">
          <h2 class="timeline-detail-date">${escapeHtml(label.detail)}</h2>
          <span class="day-page-status">${doneCount}/${scored.length} ${escapeHtml(tr("today.open"))}</span>
        </div>
        <div class="mood-options tl-edit-mood" role="group" aria-label="${escapeHtml(tr("drawer.moodTitle"))}">${["很好", "平静", "低落"].map(m => `<button type="button" class="${log.mood === m ? "selected" : ""}" data-tl-mood="${m}" aria-pressed="${log.mood === m}" ${isFutureDate(date) ? "disabled" : ""}><span class="mood-option-icon ${moodCalendarClass(m)}"><svg viewBox="0 0 24 24" aria-hidden="true">${moodCalendarIcons[m]}</svg></span>${escapeHtml(moodLabel(m))}</button>`).join("")}</div>
        <button type="button" class="secondary-button tl-open-day" data-edit-day="${date}">${escapeHtml(languageText("完整编辑这一天", "Edit this day", "Diesen Tag bearbeiten"))}</button>
      </header>
      <section class="day-page-note">
        <h3 class="day-page-label">${escapeHtml(tr("today.reflectionLabel"))}</h3>
        <textarea class="timeline-detail-note tl-note" data-tl-note="${date}" rows="4" ${isFutureDate(date) ? "disabled" : ""} placeholder="${escapeHtml(languageText("这一天发生了什么？点这里直接写。", "What happened this day? Write here.", "Was ist an diesem Tag passiert? Hier schreiben."))}" aria-label="${escapeHtml(tr("today.reflectionLabel"))}">${escapeHtml(log.note || "")}</textarea><small class="tl-note-status" role="status"></small>
      </section>
      <section class="photo-library photo-library-story day-page-photos ${photos.length ? "" : "is-empty"}" id="timelineDetailPhotos" data-photo-editor>
        <div class="mood-photo-heading day-page-meta">
          <strong data-photo-title>${escapeHtml(tr("drawer.photos"))}</strong><span class="photo-count-inline" data-photo-count>${photos.length} of 3</span>
          <small data-photo-help></small>
        </div>
        <div class="photo-drop" data-photo-drop>
          <div class="journal-photo-grid-composed">
            <button class="mood-photo-add" data-photo-add type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="15" rx="3"/><circle cx="9" cy="11" r="2"/><path d="m5 18 5-4 3 2 3-3 3 5"/></svg><span>${escapeHtml(languageText("添加照片", "Add photo", "Foto hinzufügen"))}</span></button>
            <div class="mood-photo-list" data-photo-list></div>
          </div>
          <p class="photo-drop-empty" data-photo-empty hidden></p>
        </div>
        <input data-photo-input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" hidden />
        <input data-photo-replace type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" hidden />
        <p class="mood-photo-status" data-photo-status role="status" hidden></p>
      </section>
      <section class="timeline-detail-habits day-page-habits">
        <h3 class="day-page-meta"><span>${escapeHtml(tr("timeline.habitsHeading"))}</span><b>${doneCount}/${scored.length}</b></h3>
        <ul class="timeline-habit-list" data-layout="compact-grid">${scored.map(habit => `<li class="timeline-habit-row ${log.completed.includes(habit.id) ? "done" : ""}" style="${habitStyle(habit)}"><button type="button" class="tl-habit" data-tl-habit="${escapeHtml(habit.id)}" aria-pressed="${log.completed.includes(habit.id)}" ${isFutureDate(date) ? "disabled" : ""}>${renderIcon(iconKey(habit))}<span>${escapeHtml(displayHabitName(habit))}</span><i class="tl-check" aria-hidden="true">✓</i></button></li>`).join("")}</ul>
      </section>
      ${events.length ? `<section class="timeline-detail-events"><h3>${escapeHtml(tr("dayPlan.schedule"))}</h3><ul>${events.map(event => `<li>${escapeHtml(event.allDay ? tr("dayPlan.allDay") : event.start)} · ${escapeHtml(event.title)}</li>`).join("")}</ul></section>` : ""}
    </div>`;
  // ponytail: current photo library has no mount(); show the day's photos read-only here (editing stays in the mood note).
  const photoHost = $("#timelineDetailPhotos");
  if (photoHost) {
    photoHost.querySelectorAll("[data-photo-add],[data-photo-input],[data-photo-replace]").forEach(node => node.remove());
    const list = photoHost.querySelector("[data-photo-list]"), empty = photoHost.querySelector("[data-photo-empty]");
    if (list) list.innerHTML = photos.length ? `<div class="memory-entry-photos" data-count="${photos.length}">${photos.map(photo => `<figure class="memory-entry-photo"><img src="${escapeHtml(photo.url)}" width="${photo.width || 720}" height="${photo.height || 720}" loading="lazy" alt="" /></figure>`).join("")}</div>` : "";
    if (empty) { empty.hidden = photos.length > 0; empty.textContent = languageText("这一天没有照片", "No photos this day", "Keine Fotos an diesem Tag"); }
  }
  hydrateHairlineMounts(container);
  wireTimelineDetail(container, date);
}

// Timeline day detail is editable in place (user 10/21): habits toggle, mood, note autosave, full drawer.
function wireTimelineDetail(container, date) {
  const pop = el => { el.classList.remove("tl-pop"); void el.offsetWidth; el.classList.add("tl-pop"); };
  const refreshList = () => renderTimelineEntryList(applyTimelineFilter(timelineEntriesForMonth(timelineCursor)));
  container.querySelectorAll("[data-tl-habit]").forEach(button => button.addEventListener("click", () => {
    const id = button.dataset.tlHabit, log = getLog(date), on = !log.completed.includes(id);
    state.logs[date] = { ...log, completed: on ? [...log.completed, id] : log.completed.filter(x => x !== id) };
    saveState();
    // update in place (no re-render) so the tap keeps its own feedback
    button.setAttribute("aria-pressed", String(on)); button.closest(".timeline-habit-row").classList.toggle("done", on); pop(button);
    const scored = dailyHabits(date), done = scored.filter(h => state.logs[date].completed.includes(h.id)).length;
    container.querySelectorAll(".day-page-habits h3 b").forEach(el => { el.textContent = `${done}/${scored.length}`; pop(el); });
    renderJournalCalendar(); refreshList();
    if (date === isoDate(new Date())) renderToday();
  }));
  container.querySelectorAll("[data-tl-mood]").forEach(button => button.addEventListener("click", () => {
    const mood = button.dataset.tlMood;
    state.logs[date] = { ...getLog(date), mood, moodReason: getLog(date).mood === mood ? getLog(date).moodReason || "" : "" };
    saveState();
    container.querySelectorAll("[data-tl-mood]").forEach(b => { const on = b === button; b.classList.toggle("selected", on); b.setAttribute("aria-pressed", String(on)); });
    pop(button); showToast(tr("toast.mood"));
    renderJournalCalendar(); refreshList();
    if (date === isoDate(new Date())) renderToday();
  }));
  const note = container.querySelector("[data-tl-note]"), status = container.querySelector(".tl-note-status");
  let timer = 0;
  note?.addEventListener("input", () => {
    status.textContent = languageText("正在保存…", "Saving…", "Speichert …");
    clearTimeout(timer);
    timer = setTimeout(() => { state.logs[date] = { ...getLog(date), note: note.value }; saveState(); status.textContent = languageText("已保存", "Saved", "Gespeichert"); refreshList(); renderJournalComposer(); }, 400);
  });
  container.querySelector("[data-edit-day]")?.addEventListener("click", () => openDrawer(date));
}

function renderJournalPhotoLibrary(photos) {
  const host = $("#journalPhotoLibrary");
  if (!host) return;
  if (!photos.length) {
    host.innerHTML = hairlineEmptyMarkup(
      "./assets/hairline/empty-photos.svg",
      languageText("照片", "Photos", "Fotos"),
      languageText("这个月还没有照片。在一天的详情里添加，它们会按月份出现在这里。", "No photos this month yet. Add one from a day and it will appear here by month.", "Diesen Monat gibt es noch keine Fotos. Füge eines bei einem Tag hinzu, dann erscheint es hier nach Monat."),
    );
    hydrateHairlineMounts(host);
    return;
  }
  const groups = new Map();
  photos.forEach(photo => {
    const key = String(photo.date || "").slice(0, 7);
    if (!key) return;
    groups.set(key, [...(groups.get(key) || []), photo]);
  });
  host.innerHTML = [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([key, items]) => {
    const label = formatLocalizedDate(parseDate(`${key}-01`), { month: "long", year: "numeric" });
    return `<section class="journal-library-month"><h3>${escapeHtml(label)}</h3><div class="journal-library-grid">${items.map(photo => `<button type="button" class="journal-library-card" data-date="${escapeHtml(photo.date)}"><img src="${escapeHtml(photo.url)}" alt="" /><span>${escapeHtml(formatLocalizedDate(parseDate(photo.date), { day: "numeric", month: "short" }))}</span></button>`).join("")}</div></section>`;
  }).join("");
  host.querySelectorAll(".journal-library-card").forEach(button => button.addEventListener("click", () => {
    selectedTimelineDate = button.dataset.date;
    openDrawer(selectedTimelineDate);
  }));
}

function renderJournalComposer() {
  const field = $("#journalQuickNote");
  const status = $("#journalQuickSave");
  if (!field || document.activeElement === field) return;
  const date = selectedTimelineDate || isoDate(new Date());
  field.dataset.date = date;
  field.value = getLog(date).note || "";
  if (status && !status.dataset.pending) status.textContent = languageText("已保存", "Saved", "Gespeichert");
}

function setInsightView(view) {
  insightView = "month"; // one monthly page; the old tabs (overview/calendar/habits/table) are retired (user 10/22)
  const review = $("#reviewView");
  if (review) review.dataset.insightView = insightView;
  const table = $(".review-score-table");
  if (table) table.open = insightView === "table";
  $$("#insightViewSwitch [data-insight-view]").forEach(button => {
    const active = button.dataset.insightView === insightView;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
}

function renderReviewInsights() {
  const container = $("#reviewInsights");
  if (!container || !analyticsApi()) return;
  const dates = analyticsDates();
  const current = slotTotals(dates);
  const previous = slotTotals(analyticsApi().previousWindow(dates));
  const summary = reportSummaryMarkup(dates, current);
  const recordedDays = Object.keys(state.logs || {}).filter(k => (state.logs[k].completed?.length || state.logs[k].note || state.logs[k].mood)).length;
  if (!current.eligible || recordedDays < 7) {
    const artSrc = recordedDays < 7 ? "./assets/hairline/insights-first-week.svg" : "./assets/hairline/empty-insights.svg";
    container.innerHTML = `${summary}${hairlineEmptyMarkup(
      artSrc,
      languageText("洞察", "Insights", "Einblicke"),
      tr("review.insufficient"),
    )}`;
    hydrateHairlineMounts(container);
    return;
  }
  const habits = activeHabits(dates[dates.length - 1]).filter(habit => countsTowardDaily(habit, dates[dates.length - 1]));
  const ranked = habits.map(habit => ({ habit, stats: habitWindowStats(habit, dates) }))
    .sort((a, b) => b.stats.streaks.current - a.stats.streaks.current || b.stats.streaks.best - a.stats.streaks.best);
  const lead = ranked[0];
  const delta = analyticsDeltaLabel(current, previous);
  const deltaClass = current.percent != null && previous.percent != null && current.percent > previous.percent ? "up" : current.percent < previous.percent ? "down" : "";
  const previousRate = container.dataset.rateValue || "";
  const nextRate = formatRate(current);
  container.innerHTML = `${summary}
    <div class="review-insight-block"><strong class="review-insight-value">${escapeHtml(nextRate)}</strong><span class="review-insight-label">${escapeHtml(tr("review.rateLabel"))}</span><span class="review-insight-delta">${escapeHtml(`${current.completed}/${current.eligible}`)}</span>${delta ? `<span class="review-insight-delta ${deltaClass}">${escapeHtml(delta)}</span>` : ""}</div>
    <div class="review-insight-block"><strong class="review-insight-value">${lead ? lead.stats.streaks.current : 0}</strong><span class="review-insight-label">${escapeHtml(tr("review.streakLabel"))}</span><span class="review-insight-delta">${escapeHtml(lead ? displayHabitName(lead.habit) : "—")}</span></div>
    <div class="review-insight-block"><strong class="review-insight-value">${lead ? lead.stats.streaks.best : 0}</strong><span class="review-insight-label">${escapeHtml(tr("review.bestStreakLabel"))}</span><span class="review-insight-delta">${escapeHtml(lead ? countLabel(lead.stats.streaks.best) : "")}</span></div>`;
  const rate = container.querySelector(".review-insight-value");
  if (rate) LifeLedgerInteraction?.rollText(rate, nextRate, previousRate);
  container.dataset.rateValue = nextRate;
}

function analyticsApi() {
  return globalThis.LifeLedgerAnalytics;
}

function analyticsDates() {
  return reviewMonthDates(cursor);
}
// The elapsed days of a calendar month (whole month when it is over, nothing when it has not started).
function reviewMonthDates(date) {
  const year = date.getFullYear(), month = date.getMonth(), today = isoDate(new Date());
  return Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => isoDate(new Date(year, month, i + 1, 12))).filter(d => d <= today);
}

function analyticsEndIso() {
  const today = isoDate(new Date());
  const cursorIso = isoDate(cursor);
  return cursorIso > today ? today : cursorIso;
}

function slotTotals(dates) {
  let completed = 0;
  let eligible = 0;
  dates.forEach(date => {
    const habits = dailyHabits(date);
    const done = new Set(getLog(date).completed);
    eligible += habits.length;
    completed += habits.filter(habit => done.has(habit.id)).length;
  });
  return analyticsApi().rate(completed, eligible);
}

function reportSummaryMarkup(dates, current) {
  const raw = dates.length ? (current?.completed || 0) / dates.length : 0;
  const average = new Intl.NumberFormat(dateLocale(), { maximumFractionDigits: 1 }).format(raw);
  return `<p class="review-range-line">${escapeHtml(reportRangeSentence(dates))}</p><p class="review-period-line"><strong>${escapeHtml(tr("review.forPeriod"))}</strong><span>${escapeHtml(tr("review.perDay", { count: average }))}</span></p>`;
}

function reportRangeSentence(dates) {
  if (!dates.length) return "";
  const label = value => formatLocalizedDate(parseDate(value), { day: "numeric", month: "short" });
  const start = label(dates[0]);
  const end = label(dates[dates.length - 1]);
  return start === end ? start : `${start} ${tr("review.rangeTo")} ${end}`;
}

function habitWindowStats(habit, dates) {
  let completed = 0;
  const flags = [];
  dates.forEach(date => {
    if (!countsTowardDaily(habit, date)) return;
    const done = getLog(date).completed.includes(habit.id);
    flags.push(done);
    if (done) completed += 1;
  });
  const rated = analyticsApi().rate(completed, flags.length);
  const today = isoDate(new Date());
  const ignoreTrailingMiss = dates[dates.length - 1] === today;
  return { ...rated, flags, streaks: analyticsApi().streaks(flags, { ignoreTrailingMiss }) };
}

function analyticsDeltaLabel(current, previous) {
  if (current.percent == null || previous.percent == null) return "";
  const delta = current.percent - previous.percent;
  if (delta > 0) return tr("review.vsPreviousUp", { delta });
  if (delta < 0) return tr("review.vsPreviousDown", { delta });
  return tr("review.samePrevious");
}

function formatRate(stats) {
  if (!stats || stats.percent == null) return "—";
  return `${stats.percent}%`;
}

function countLabel(count) {
  const value = Number(count) || 0;
  const api = analyticsApi();
  if (currentLang === "en" && api?.pluralEn) return api.pluralEn(value, tr("review.timeSingular"), tr("review.timePlural"));
  if (currentLang === "de") return `${value} Mal`;
  return `${value} 次`;
}

function renderReviewTrendChart() {
  const chart = $("#reviewTrendChart");
  if (!chart || !analyticsApi()) return;
  const dates = analyticsDates();
  const current = slotTotals(dates);
  if (!current.eligible) {
    chart.innerHTML = "";
    const heatmap = $("#reviewHeatmap");
    const compare = $("#reviewHabitCompare");
    if (heatmap) heatmap.innerHTML = "";
    if (compare) compare.innerHTML = "";
    return;
  }
  if (!current.completed) {
    const points = dates.map(date => ({ date, value: completionFor(date) }));
    const range = tr("review.trendSummary", {
      start: formatLocalizedDate(parseDate(dates[0]), { day: "numeric", month: "short" }),
      end: formatLocalizedDate(parseDate(dates[dates.length - 1]), { day: "numeric", month: "short" }),
      completed: current.completed,
      eligible: current.eligible,
    });
    chart.innerHTML = `<h3 class="review-trend-title">${escapeHtml(tr("review.trendTitle"))} <span class="review-trend-range">${escapeHtml(range)}</span></h3><div class="review-trend-plot review-trend-with-note">${renderTrendSvg(points, range)}<aside class="review-trend-note">${hairlineEmptyMarkup("./assets/hairline/empty-insights.svg", tr("review.trendTitle"), tr("review.insufficient"))}</aside></div>`;
    hydrateHairlineMounts(chart);
    const heatmap = $("#reviewHeatmap");
    const compare = $("#reviewHabitCompare");
    if (heatmap) heatmap.innerHTML = renderConsistencyHeatmap(dates);
    if (compare) compare.innerHTML = `${renderHabitBars(dates)}${renderWeekdayBars(points)}`;
    return;
  }
  const points = dates.map(date => ({ date, value: completionFor(date) }));
  const summary = tr("review.trendSummary", {
    start: formatLocalizedDate(parseDate(dates[0]), { day: "numeric", month: "short" }),
    end: formatLocalizedDate(parseDate(dates[dates.length - 1]), { day: "numeric", month: "short" }),
    completed: current.completed,
    eligible: current.eligible,
  });
  const mode = analyticsApi().chartMode(points.length);
  const trend = mode === "line" ? renderTrendSvg(points, summary) : renderCompactValues(points);
  const minutes = Math.round(focusSessionsBetween(dates[0], dates[dates.length - 1]).reduce((sum, session) => sum + focusSessionMinutes(session), 0));
  const focus = minutes > 0 ? `<p class="analytics-focus">${escapeHtml(tr("review.focusWindow", { minutes }))}</p>` : "";
  const plot = chart.querySelector(".review-trend-plot");
  if (!chart.querySelector(".review-trend-title") || !plot) {
    chart.innerHTML = `<h3 class="review-trend-title"></h3><div class="review-trend-plot"></div>`;
  }
  chart.querySelector(".review-trend-title").textContent = tr("review.trendTitle");
  const host = chart.querySelector(".review-trend-plot");
  if (host.dataset.signature && host.dataset.signature !== String(dates.length)) {
    window.LifeLedgerInteraction?.retarget(host);
  }
  host.dataset.signature = String(dates.length);
  host.innerHTML = `${trend}${focus}`;
  const heatmap = $("#reviewHeatmap");
  if (heatmap) heatmap.innerHTML = renderConsistencyHeatmap(dates);
  const compare = $("#reviewHabitCompare");
  if (compare) compare.innerHTML = `${renderHabitBars(dates)}${renderWeekdayBars(points)}`;
}

function renderTrendSvg(points, summary) {
  const width = 640;
  const height = 200;
  const left = 48;
  const right = 36;
  const top = 16;
  const bottom = 32;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const coords = points.map((point, index) => {
    const x = left + (points.length === 1 ? plotW / 2 : (index / (points.length - 1)) * plotW);
    const y = top + (1 - Math.max(0, Math.min(100, point.value)) / 100) * plotH;
    return { ...point, x, y };
  });
  const path = coords.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const last = coords[coords.length - 1];
  const grid = [0, 50, 100].map(pct => {
    const y = top + (1 - pct / 100) * plotH;
    return `<line x1="${left}" y1="${y.toFixed(1)}" x2="${width - right}" y2="${y.toFixed(1)}" class="review-trend-gridline"/><text x="4" y="${(y + 4).toFixed(1)}" class="review-trend-axis">${pct}%</text>`;
  }).join("");
  const labelIndexes = points.length <= 3 ? points.map((_, index) => index) : [0, Math.floor((points.length - 1) / 2), points.length - 1];
  const labels = labelIndexes.map(index => {
    const point = coords[index];
    const label = formatLocalizedDate(parseDate(point.date), { day: "numeric", month: "short" });
    const anchor = index === 0 ? "start" : index === points.length - 1 ? "end" : "middle";
    const x = index === 0 ? left : index === points.length - 1 ? width - 8 : point.x;
    return `<text x="${x.toFixed(1)}" y="${height - 8}" text-anchor="${anchor}" class="review-trend-axis">${escapeHtml(label)}</text>`;
  }).join("");
  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escapeHtml(summary)}"><title>${escapeHtml(summary)}</title>${grid}<path d="${path}" pathLength="1" class="review-trend-line"/><circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="4" class="review-trend-dot"/>${labels}</svg>`;
}

function renderConsistencyHeatmap(dates) {
  const first = parseDate(dates[0]);
  const lead = (first.getDay() + 6) % 7;
  const points = insightDailyModel(dates).points;
  const cells = [...Array.from({ length: lead }, () => null), ...points.map(p => ({date:p.date,value:p.recorded?p.percent:null}))];
  const valueLabel = value => value == null ? languageText('未记录或无日常计划','Not recorded or no daily plan','Nicht erfasst oder kein Tagesplan') : `${value}%`;
  const weeks = [];
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7));
  const level = value => {
    if (value == null) return "empty";
    if (value <= 0) return "0";
    if (value <= 25) return "1";
    if (value <= 50) return "2";
    if (value <= 75) return "3";
    return "4";
  };
  const grid = weeks.map(week => `<div class="analytics-heat-week">${week.map(cell => {
    if (!cell) return `<span class="analytics-heat-cell is-pad" aria-hidden="true"></span>`;
    const label = formatLocalizedDate(parseDate(cell.date), { day: "numeric", month: "short" });
    return `<span class="analytics-heat-cell level-${level(cell.value)}" title="${escapeHtml(`${label}: ${valueLabel(cell.value)}`)}" aria-label="${escapeHtml(`${label}: ${valueLabel(cell.value)}`)}"></span>`;
  }).join("")}</div>`).join("");
  const table = points.map(point => {
    const {date}=point,value=point.recorded?point.percent:null;
    const label = formatLocalizedDate(parseDate(date), { weekday: "short", day: "numeric", month: "short" });
    return `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(valueLabel(value))}</td></tr>`;
  }).join("");
  return `<section class="analytics-heatmap" aria-label="${escapeHtml(tr("review.heatmapTitle"))}"><h3>${escapeHtml(tr("review.heatmapTitle"))}</h3><div class="analytics-heat-grid">${grid}</div><ul class="analytics-heat-legend"><li><i class="level-0"></i><span>0%</span></li><li><i class="level-2"></i><span>50%</span></li><li><i class="level-4"></i><span>100%</span></li></ul><details class="analytics-heat-fallback"><summary>${escapeHtml(tr("review.valuesSummary"))}</summary><table><tbody>${table}</tbody></table></details></section>`;
}

function insightDailyModel(dates) {
  return analyticsApi().dailySummary(dates,state.habits,state.logs,(habit,date)=>Boolean(versionFor(habit,date)) && countsTowardDaily(habit,date));
}

function renderHabitBars(dates) {
  const habits = activeHabits(dates[dates.length - 1]);
  const rows = habits.map(habit => ({ habit, stats: habitWindowStats(habit, dates) })).filter(row => row.stats.eligible > 0);
  if (!rows.length) return "";
  return `<section class="analytics-bars" aria-label="${escapeHtml(tr("review.habitCompare"))}"><h3>${escapeHtml(tr("review.habitCompare"))}</h3>${rows.map(({ habit, stats }) => `
    <div class="analytics-bar-row">
      <strong title="${escapeHtml(displayHabitName(habit))}">${escapeHtml(displayHabitName(habit))}</strong>
      <span>${formatRate(stats)} · ${stats.completed}/${stats.eligible} · ${escapeHtml(tr("review.streakLabel"))} ${stats.streaks.current}</span>
      <div class="analytics-bar-track" aria-hidden="true"><i style="width:${stats.percent || 0}%"></i></div>
    </div>`).join("")}</section>`;
}

function renderWeekdayBars(points) {
  const averages = analyticsApi().weekdayAverages(points);
  const names = i18n[currentLang].calendar.weekdays;
  return `<section class="analytics-bars" aria-label="${escapeHtml(tr("review.weekdayTitle"))}"><h3>${escapeHtml(tr("review.weekdayTitle"))}</h3>${averages.map((value, index) => `
    <div class="analytics-bar-row">
      <strong>${escapeHtml(names[index] || "")}</strong>
      <span>${value == null ? "—" : `${value}%`}</span>
      <div class="analytics-bar-track" aria-hidden="true"><i style="width:${value == null ? 0 : value}%"></i></div>
    </div>`).join("")}</section>`;
}

function renderCompactValues(points) {
  return `<ul class="analytics-compact">${points.map(point => {
    const label = formatLocalizedDate(parseDate(point.date), { day: "numeric", month: "short" });
    return `<li><span>${escapeHtml(label)}</span><strong>${point.value}%</strong></li>`;
  }).join("")}</ul>`;
}

function renderReviewInspectorTable() {
  const table = $("#inspectorReviewTable");
  if (!table || !analyticsApi()) return;
  const dates = analyticsDates();
  const current = slotTotals(dates);
  if (!current.eligible) {
    table.innerHTML = `<p class="analytics-empty">${escapeHtml(tr("review.insufficient"))}</p>`;
    const focusPanel = $("#inspectorReviewFocus");
    if (focusPanel) focusPanel.innerHTML = "";
    return;
  }
  const habits = activeHabits(dates[dates.length - 1]);
  table.innerHTML = `<div class="inspector-stat-list">${habits.map(habit => {
    const stats = habitWindowStats(habit, dates);
    if (!stats.eligible) return "";
    return `<article><strong>${escapeHtml(displayHabitName(habit))}</strong><span>${stats.completed}/${stats.eligible} · ${formatRate(stats)}</span><span>${escapeHtml(tr("review.streakLabel"))} ${stats.streaks.current} · ${escapeHtml(tr("review.bestStreakLabel"))} ${stats.streaks.best}</span></article>`;
  }).join("")}</div>`;
  const focusPanel = $("#inspectorReviewFocus");
  if (focusPanel) {
    const sessions = focusSessionsBetween(dates[0], dates[dates.length - 1]);
    const byTopic = focusTopics(sessions);
    const rows = byTopic.slice(0, 4).map(([label, minutes]) => `<span>${escapeHtml(label)} · ${Math.round(minutes)} ${escapeHtml(tr("focus.reviewUnit"))}</span>`).join("");
    focusPanel.innerHTML = rows ? `<h4 class="inspector-review-focus-title">${escapeHtml(tr("review.focusByTopic"))}</h4>${rows}` : "";
  }
}

function renderInsightDashboard() {
  if (!analyticsApi()?.dailySummary) return;
  const T = languageText, monthLabel = d => formatLocalizedDate(d, { year: 'numeric', month: 'long' });
  const prevMonth = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 15, 12);
  const dates = analyticsDates(), prevDates = reviewMonthDates(prevMonth);
  $('#reviewTitle').innerHTML = `<button type="button" class="rv-month-step" data-rv-month="-1" aria-label="${escapeHtml(T('上个月','Previous month','Vormonat'))}">‹</button><span>${escapeHtml(monthLabel(cursor))} · ${escapeHtml(T('月度复盘','Monthly review','Monatsrückblick'))}</span><button type="button" class="rv-month-step" data-rv-month="1" aria-label="${escapeHtml(T('下个月','Next month','Nächster Monat'))}" ${monthKey(cursor) >= monthKey(new Date()) ? 'disabled' : ''}>›</button>`;
  $$('#reviewTitle [data-rv-month]').forEach(b => b.addEventListener('click', () => { cursor.setDate(15); cursor.setMonth(cursor.getMonth() + Number(b.dataset.rvMonth)); renderAll(); }));
  $('#reviewObservations').innerHTML = ''; $('#reviewObservations').hidden = true;
  $('#reviewNarrativeTitle').textContent = T('这个月的复盘','This month in words','Der Monat in Worten');
  if (!dates.length) {
    $('#reviewInsights').innerHTML = `<p class="rv-empty">${escapeHtml(T('这个月还没开始。','This month has not started yet.','Dieser Monat hat noch nicht begonnen.'))}</p>`;
    ['#reviewTrendChart', '#reviewHabitCompare', '#reviewPeriodHabits'].forEach(q => { $(q).innerHTML = ''; });
    return;
  }
  const model = insightDailyModel(dates), previous = insightDailyModel(prevDates);
  const hasPrev = previous.eligible > 0;
  const diff = (a, b) => (hasPrev && b != null && a != null) ? a - b : null;
  const delta = v => v == null ? '<small class="rv-delta">—</small>' : `<small class="rv-delta ${v > 0 ? 'up' : v < 0 ? 'down' : ''}">${v > 0 ? '+' : ''}${v}</small>`;
  const minutesIn = ds => ds.length ? Math.round(focusSessionsBetween(ds[0], ds.at(-1)).reduce((n, x) => n + focusSessionMinutes(x), 0)) : 0;
  const minutes = minutesIn(dates), prevMinutes = minutesIn(prevDates);
  const moods = { '很好': 0, '平静': 0, '低落': 0 };
  dates.forEach(d => { const m = getLog(d).mood; if (m in moods) moods[m] += 1; });
  const range = reportRangeSentence(dates), over = dates.length === new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  $('#reviewInsights').innerHTML = `<p class="rv-range">${escapeHtml(range)} · ${escapeHtml(over ? T(`整月 ${dates.length} 天`, `whole month, ${dates.length} days`, `ganzer Monat, ${dates.length} Tage`) : T(`本月进行中，截至今天 ${dates.length} 天`, `month in progress, ${dates.length} days so far`, `Monat läuft, ${dates.length} Tage bisher`))} · ${escapeHtml(T(`与 ${monthLabel(prevMonth)} 比较`, `compared with ${monthLabel(prevMonth)}`, `im Vergleich zu ${monthLabel(prevMonth)}`))}</p>
  <div class="insight-metrics rv-metrics">
    <article><span>${escapeHtml(T('习惯完成率','Habit completion','Gewohnheiten erfüllt'))}</span><strong>${model.percent ?? 0}<em>%</em>${delta(diff(model.percent, previous.percent))}</strong><small>${escapeHtml(T(`完成 ${model.completed} 次 · 应做 ${model.eligible} 次`, `${model.completed} done of ${model.eligible} planned`, `${model.completed} von ${model.eligible} geplant`))}</small></article>
    <article><span>${escapeHtml(T('专注时长','Focus time','Fokuszeit'))}</span><strong>${(minutes / 60).toFixed(1)}<em> ${escapeHtml(T('小时','h','Std.'))}</em>${delta(hasPrev ? Math.round((minutes - prevMinutes) / 6) / 10 : null)}</strong><small>${escapeHtml(T(`${focusSessionsBetween(dates[0], dates.at(-1)).length} 次专注`, `${focusSessionsBetween(dates[0], dates.at(-1)).length} sessions`, `${focusSessionsBetween(dates[0], dates.at(-1)).length} Einheiten`))}</small></article>
    <article><span>${escapeHtml(T('有记录的天数','Days with an entry','Tage mit Eintrag'))}</span><strong>${model.recordedDays}<em> / ${dates.length}</em></strong><small>${escapeHtml(T('打卡、日记或心情','Check-in, journal or mood','Check-in, Tagebuch oder Stimmung'))}</small></article>
    <article class="rv-mood"><span>${escapeHtml(T('心情','Mood','Stimmung'))}</span><div>${Object.entries(moods).map(([m, n]) => `<b class="${{ '很好': 'mood-good', '平静': 'mood-calm', '低落': 'mood-low' }[m]}"><i>${moodCalendarIcon(m)}</i>${n}<small>${escapeHtml(moodLabel(m))}</small></b>`).join('')}</div></article>
  </div>`;
  const rows = [...model.rows].sort((a, b) => b.percent - a.percent).map(row => {
    const habit = state.habits.find(h => h.id === row.id), old = previous.rows.find(p => p.id === row.id);
    return `<tr style="${habitStyle(habit)}"><th scope="row"><span class="insight-habit-icon">${renderIcon(iconKey(habit))}</span>${escapeHtml(displayHabitName(habit))}</th><td>${row.completed} / ${row.eligible}</td><td><span class="rv-bar"><i style="width:${row.percent}%"></i></span><b>${row.percent}%</b></td><td>${delta(old ? diff(row.percent, old.percent) : null)}</td></tr>`;
  }).join('');
  const weekday = model.weekdays.map((r, i) => `<div class="rv-weekday"><span>${escapeHtml(i18n[currentLang].calendar.weekdays[i])}</span><div class="insight-weekday-track" aria-hidden="true"><i style="height:${r.percent || 0}%"></i></div><strong>${r.eligible ? `${r.percent}%` : '—'}</strong></div>`).join('');
  $('#reviewHabitCompare').innerHTML = `<section class="insight-habit-panel rv-panel"><header><h3>${escapeHtml(T('每个习惯','Habit by habit','Gewohnheit für Gewohnheit'))}</h3><p>${escapeHtml(T('完成率 = 完成次数 ÷ 这个月按计划应做的次数；右列是和上个月相比的百分点。','Completion = times done ÷ times planned this month; the last column is the change vs last month in percentage points.','Quote = erledigt ÷ in diesem Monat geplant; rechts die Änderung zum Vormonat in Prozentpunkten.'))}</p></header>${rows ? `<table class="rv-table"><thead><tr><th>${escapeHtml(T('习惯','Habit','Gewohnheit'))}</th><th>${escapeHtml(T('完成 / 应做','Done / planned','Erledigt / geplant'))}</th><th>${escapeHtml(T('完成率','Rate','Quote'))}</th><th>${escapeHtml(T('比上月（百分点）','vs last month (pp)','zum Vormonat (Pp.)'))}</th></tr></thead><tbody>${rows}</tbody></table>` : `<p>${escapeHtml(tr('review.insufficient'))}</p>`}</section><section class="insight-weekday-panel rv-panel"><header><h3>${escapeHtml(T('一周里哪天最稳','Your steadiest weekday','Dein stärkster Wochentag'))}</h3><p>${escapeHtml(T('这个月每个星期几的平均完成率。','Average completion per weekday this month.','Durchschnitt je Wochentag in diesem Monat.'))}</p></header><div class="rv-weekdays">${weekday}</div></section>`;
  const end = dates.at(-1);
  const periodic = activeHabits(end).filter(h => !countsTowardDaily(h, end) && ['weekly', 'monthly'].includes(versionFor(h, end)?.frequency)).map(h => {
    const v = versionFor(h, end), start = v.frequency === 'monthly' ? dates[0] : isoDate(weekDatesFromKey(isoWeekKey(parseDate(end))).monday);
    const count = dates.filter(d => d >= start && versionFor(h, d)?.frequency === v.frequency && getLog(d).completed.includes(h.id)).length;
    const total = v.frequency === 'monthly' ? count : dates.filter(d => versionFor(h, d)?.frequency === 'weekly' && getLog(d).completed.includes(h.id)).length;
    return `<article style="${habitStyle(h)}"><span class="insight-habit-icon">${renderIcon(iconKey(h))}</span><div><strong>${escapeHtml(displayHabitName(h))}</strong><small>${escapeHtml(frequencyLabel(v))}</small></div><b>${escapeHtml(v.frequency === 'monthly' ? `${count} / ${periodTargetFor(v)}` : T(`本月 ${total} 次`, `${total} this month`, `${total} im Monat`))}</b></article>`;
  }).join('');
  $('#reviewPeriodHabits').innerHTML = periodic ? `<h3>${escapeHtml(T('按周、按月计的习惯','Weekly & monthly habits','Wöchentliche & monatliche Gewohnheiten'))}</h3><div>${periodic}</div>` : '';
  renderInsightTrend(model);
}

function renderInsightTrend(model) {
  const chart=$('#reviewTrendChart'),points=model.points,w=640,h=200,left=42,right=20,top=20,bottom=32;
  const x=i=>left+i/Math.max(1,points.length-1)*(w-left-right),y=p=>top+(1-p/100)*(h-top-bottom);
  let drawing=false;
  const path=points.map((p,i)=>{if(!p.recorded || p.percent==null){drawing=false;return '';}const command=drawing?'L':'M';drawing=true;return `${command}${x(i)},${y(p.percent)}`;}).join(' ');
  const circles=points.map((p,i)=>p.recorded && p.percent!=null?`<circle cx="${x(i)}" cy="${y(p.percent)}" r="3"/>`:'').join('');
  const grid=[0,50,100].map(p=>`<line x1="${left}" y1="${y(p)}" x2="${w-right}" y2="${y(p)}"/><text x="0" y="${y(p)+4}">${p}%</text>`).join('');
  const labels=[...new Set([0,Math.floor((points.length-1)/2),points.length-1])].map(i=>`<text x="${x(i)}" y="${h-4}" text-anchor="${i===0?'start':i===points.length-1?'end':'middle'}">${escapeHtml(formatLocalizedDate(parseDate(points[i].date),{month:'short',day:'numeric'}))}</text>`).join('');
  chart.innerHTML=`<header class="insight-chart-heading"><div><h3>${escapeHtml(languageText('每天的完成率','Completion, day by day','Erfüllung Tag für Tag'))}</h3><p>${escapeHtml(languageText('移动鼠标查看某一天；空白是没有记录的日子。','Hover to read a day; gaps are days without an entry.','Mit der Maus einen Tag ansehen; Lücken sind Tage ohne Eintrag.'))}</p></div><output id="insightPointReadout" aria-live="polite"></output></header><svg id="insightTrendSvg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeHtml(tr('review.trendTitle'))}"><g class="insight-plot-grid">${grid}${labels}</g><path class="insight-plot-line" d="${path}"/><g class="insight-plot-dots">${circles}</g><line id="insightCursorLine" y1="${top}" y2="${h-bottom}"/></svg><label class="insight-chart-explore"><span>${escapeHtml(languageText('左右探索日期','Explore dates','Datum erkunden'))}</span><input id="insightDateScrubber" type="range" min="0" max="${points.length-1}" value="${points.length-1}" step="1"></label>`;
  const input=$('#insightDateScrubber'),readout=$('#insightPointReadout'),line=$('#insightCursorLine');
  const update=i=>{const point=points[i];input.value=i;const label=formatLocalizedDate(parseDate(point.date),{month:'short',day:'numeric'});const value=point.eligible===0?languageText('无日常计划','No daily plan','Kein Tagesplan'):!point.recorded?languageText('未记录','Not recorded','Nicht erfasst'):`${point.percent}% · ${point.completed}/${point.eligible}`;readout.textContent=`${label} · ${value}`;input.setAttribute('aria-valuetext',readout.textContent);line.setAttribute('x1',x(i));line.setAttribute('x2',x(i));};
  input.addEventListener('input',()=>update(Number(input.value)));
  const explore=event=>{const rect=event.currentTarget.getBoundingClientRect(),px=(event.clientX-rect.left)/rect.width*w;update(Math.max(0,Math.min(points.length-1,Math.round((px-left)/(w-left-right)*(points.length-1)))));};
  $('#insightTrendSvg').addEventListener('pointermove',event=>{if(event.pointerType!=='touch')explore(event);});
  $('#insightTrendSvg').addEventListener('click',explore);update(points.length-1);
}

function renderLongRange() {
  window.LifeLedgerLongRange?.render({
    state:()=>state,save:()=>saveState(),text:languageText,escape:escapeHtml,iso:isoDate,
    date:value=>formatLocalizedDate(parseDate(value),{year:'numeric',month:'short',day:'numeric'}),
    icon:renderIcon,status:value=>tr(`longTerm.${value}`),changed:()=>renderWeeklyWorkspace(),
    openMonth:key=>{syncJournalMonthOptions();$('#journalMonthFilter').value=key;setJournalMode('months');switchToView('timeline');},
  });
}

function setJournalMode(mode) {
  const previousRects = journalMode === "photos" || mode === "photos"
    ? captureSiblingRects(".journal-photo-library img, .timeline-entry-list img", node => node.src)
    : null;
  journalMode = ['weeks','months','photos','calendar'].includes(mode) ? mode : 'timeline';
  journalVisibleCount = 24;
  const layout = $(".timeline-layout");
  if (layout) layout.dataset.journalLayout = journalMode;
  const journal = $("#timelineView");
  if (journal) journal.dataset.journalLayout = journalMode;

  $$("[data-journal-mode]").forEach(button => {
    const active = button.dataset.journalMode === journalMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  if (journalMode === "photos") timelineFilter = "photos";
  else if (timelineFilter === "photos") timelineFilter = "all";
  $$("[data-timeline-filter]").forEach(button => button.classList.toggle("active", button.dataset.timelineFilter === timelineFilter));
  if ($("#timelineView")?.classList.contains("active")) {
    void renderTimeline();
    requestAnimationFrame(() => {
      if (previousRects?.size) playFlipFromMap(previousRects, ".journal-photo-library img, .timeline-entry-list img", node => node.src);
    });
  }
}

function captureSiblingRects(selector, key = node => node.dataset.id || node.dataset.date) {
  const map = new Map();
  $$(selector).forEach(node => {
    const id = key(node);
    if (!id) return;
    const rect = node.getBoundingClientRect();
    map.set(id, { x: rect.left, y: rect.top, width: rect.width, height: rect.height });
  });
  return map;
}

function playFlipFromMap(previous, selector, key = node => node.dataset.id || node.dataset.date) {
  if (!previous?.size || window.LifeLedgerInteraction?.motionTravelDisabled()) return;
  // ponytail: first 24 nodes travel, the rest snap; enough for any on-screen list.
  $$(selector).slice(0, 24).forEach(node => {
    const before = previous.get(key(node));
    if (!before) return;
    const rect = node.getBoundingClientRect();
    const dx = before.x - rect.left;
    const dy = before.y - rect.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    node.classList.add("is-moving");
    node.style.transition = "none";
    node.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    node.offsetWidth;
    node.style.transition = "transform 220ms var(--ease-spring)";
    node.style.transform = "translate3d(0, 0, 0)";
    const clear = () => {
      node.style.transition = "";
      node.style.transform = "";
      node.classList.remove("is-moving");
      node.removeEventListener("transitionend", clear);
      node.removeEventListener("transitioncancel", clear);
    };
    node.addEventListener("transitionend", clear);
    node.addEventListener("transitioncancel", clear);
  });
}

function populateHabitInspectorForm(id) {
  const form = $("#habitInspectorForm");
  if (!form) return;
  delete form.dataset.dirty;
  if (!form.dataset.dirtyWatch) { form.dataset.dirtyWatch = "1"; form.addEventListener("input", () => { form.dataset.dirty = "1"; }); form.addEventListener("submit", () => { delete form.dataset.dirty; }); }
  const habit = state.habits.find(item => item.id === id);
  if (!habit) return;
  const v = versionFor(habit, isoDate(new Date())) || habit.versions[habit.versions.length - 1];
  form.elements.name.value = displayHabitName(habit);
  form.elements.note.value = v?.note || "";
  form.elements.icon.value = iconKey(habit);
  form.elements.color.value = habit.color || "sage";
  form.elements.target.value = v?.target || 30;
  form.elements.unit.value = v?.unit || "min";
  form.elements.trackingMode.value = trackingModeFor(v);
  form.elements.frequency.value = v?.frequency || "daily";
  form.elements.scheduleTime.value = v?.scheduleTime || "";
  form.elements.periodTarget.value = periodTargetFor(v);
  form.elements.countsTowardDaily.checked = countsTowardDaily(habit, isoDate(new Date()));
  if (form.elements.active) form.elements.active.checked = habit.active;
  form.elements.effectiveDate.value = isoDate(new Date());
  updateHabitInspectorRules();
  renderInspectorColorSwatches();
  renderInspectorIconPicker();
  renderHabitStreakCalendar(id);
}

function updateHabitInspectorRules() {
  const form = $("#habitInspectorForm");
  if (!form) return;
  const measured = form.elements.trackingMode.value === "measured";
  const frequency = form.elements.frequency.value;
  $("#habitInspectorTargetField").hidden = !measured;
  $("#habitInspectorPeriodTargetField").style.display = frequency === "daily" ? "none" : "";
  syncHabitPeriodStepper();
}

function syncHabitPeriodStepper() {
  const form = $("#habitInspectorForm");
  const host = $("#habitInspectorPeriodStepper");
  const input = form?.elements.periodTarget;
  if (!form || !host || !input || form.elements.frequency.value === "daily") {
    if (host) host.innerHTML = "";
    return;
  }
  mountNumericStepper(host, {
    min: 1,
    max: 7,
    step: 1,
    ariaLabel: tr("dialog.periodTarget"),
    getValue: () => Number(input.value) || 1,
    onChange: value => {
      input.value = String(value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    },
  });
}

function mountNumericStepper(host, { min, max, step, getValue, onChange, suffix = "", ariaLabel = "" }) {
  if (!host || !window.LifeLedgerInteraction) return;
  const paint = () => {
    const value = getValue();
    host.innerHTML = `<div class="stepper-chip" role="group" aria-label="${escapeHtml(ariaLabel)}">
      <button type="button" class="stepper-minus" aria-label="-"><svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>
      <span class="stepper-value" data-stepper-value>${value}</span>
      <button type="button" class="stepper-plus" aria-label="+"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
      ${suffix ? `<span class="stepper-suffix">${escapeHtml(suffix)}</span>` : ""}
    </div>`;
    const valueEl = host.querySelector("[data-stepper-value]");
    host.querySelector(".stepper-minus")?.addEventListener("click", () => {
      const previous = valueEl.textContent;
      onChange(LifeLedgerInteraction.clampStepper(getValue() - step, min, max, step));
      if (valueEl.isConnected) LifeLedgerInteraction.rollText(valueEl, String(getValue()), previous);
    });
    host.querySelector(".stepper-plus")?.addEventListener("click", () => {
      const previous = valueEl.textContent;
      onChange(LifeLedgerInteraction.clampStepper(getValue() + step, min, max, step));
      if (valueEl.isConnected) LifeLedgerInteraction.rollText(valueEl, String(getValue()), previous);
    });
  };
  paint();
}

function renderInspectorColorSwatches() {
  const row = $("#inspectorColorSwatches");
  const input = $('#habitInspectorForm input[name="color"]');
  if (!row || !input) return;
  const selected = colors[input.value] ? input.value : "sage";
  row.innerHTML = Object.keys(colors).map(key => `<button type="button" class="color-swatch ${key === selected ? "selected" : ""}" data-color="${key}" style="--swatch:${colors[key].solid}" aria-label="${escapeHtml(tr(`dialog.colors.${key}`))}"></button>`).join("");
  $$(".color-swatch", row).forEach(button => button.addEventListener("click", () => {
    input.value = button.dataset.color;
    renderInspectorColorSwatches();
  }));
}

function renderInspectorIconPicker() {
  const input = $('#habitInspectorForm input[name="icon"]');
  const popover = $("#inspectorIconPickerPopover");
  const trigger = $("#inspectorIconPickerTrigger");
  if (!input || !popover || !trigger) return;
  const selected = iconCatalog[input.value] ? input.value : "target";
  $("#inspectorIconPickerPreview").innerHTML = renderIcon(selected);
  $("#inspectorIconPickerName").textContent = iconLabels[currentLang][selected];
  popover.innerHTML = Object.keys(iconCatalog).map(key => `<button type="button" class="icon-choice ${key === selected ? "selected" : ""}" data-icon="${key}" title="${escapeHtml(iconLabels[currentLang][key])}">${renderIcon(key)}</button>`).join("");
  $$(".icon-choice", popover).forEach(button => button.addEventListener("click", () => {
    input.value = button.dataset.icon;
    popover.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    renderInspectorIconPicker();
  }));
}

function renderHabitStreakCalendar(habitId) {
  const host = $("#habitStreakCalendar");
  if (!host) return;
  if (!habitId) {
    host.innerHTML = "";
    return;
  }
  const today = isoDate(new Date());
  const start = parseDate(today);
  start.setDate(start.getDate() - 27);
  const cells = Array.from({ length: 28 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = isoDate(date);
    const done = getLog(key).completed.includes(habitId);
    return `<i class="${done ? "done" : ""}" title="${key}"></i>`;
  }).join("");
  const streak = habitStreak(habitId, today);
  host.innerHTML = `<p>${escapeHtml(languageText(`${streak} 天连续`, `${streak}-day streak`, `${streak} Tage in Folge`))}</p><div class="habit-streak-grid" aria-hidden="true">${cells}</div>`;
}

function openHabitContextMenu(event, habitId, date = selectedPlanningDate) {
  event.preventDefault();
  const menu = $("#habitContextMenu");
  if (!menu) return;
  habitContextMenu = { open: true, habitId, anchor: { x: event.clientX, y: event.clientY }, date };
  const habit = state.habits.find(item => item.id === habitId);
  const done = getLog(date).completed.includes(habitId);
  setText("#habitContextToggle", done ? tr("drawer.undoComplete") : tr("drawer.markComplete"));
  setText("#habitContextEdit", tr("habits.editLabel", { habit: displayHabitName(habit || { name: "" }) }));
  setText("#habitContextDisable", habit?.active ? tr("habits.inactive") : tr("habits.active"));
  setText("#habitContextDelete", tr("dialog.delete"));
  menu.hidden = false;
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  menu.querySelector("[data-habit-context]")?.focus();
}

function saveHabitFromInspector(event) {
  event.preventDefault();
  if (!selectedHabitSettingsId) return openHabitDialog();
  const form = event.currentTarget;
  runSubmitButton($("#inspectorSaveHabitButton"), () => {
  editingHabitId = selectedHabitSettingsId;
  const measured = form.elements.trackingMode.value === "measured";
  const version = {
    trackingMode: measured ? "measured" : "check",
    note: String(form.elements.note.value || "").trim(),
    target: measured ? +form.elements.target.value : 1,
    unit: measured ? String(form.elements.unit.value || "").trim() : "",
    frequency: form.elements.frequency.value,
    scheduleTime: form.elements.scheduleTime.value || "",
    periodTarget: form.elements.frequency.value === "daily" ? null : +form.elements.periodTarget.value,
    weeklyTarget: form.elements.frequency.value === "weekly" ? +form.elements.periodTarget.value : null,
    countsTowardDaily: form.elements.countsTowardDaily.checked,
    effectiveDate: form.elements.effectiveDate.value,
  };
  const habit = state.habits.find(item => item.id === selectedHabitSettingsId);
  if (!habit) return;
  habit.name = form.elements.name.value.trim();
  habit.icon = form.elements.icon.value;
  habit.color = form.elements.color.value;
  habit.active = form.elements.active?.checked ?? habit.active;
  habit.versions = habit.versions.filter(item => item.effectiveDate !== version.effectiveDate);
  habit.versions.push(version);
  saveState();
  renderAll();
  showToast(tr("habits.updated"));
  });
}

function runSubmitButton(button, task, labels = {}) {
  const api = window.LifeLedgerInteraction;
  if (!button || !api) return Promise.resolve(task?.());
  let state = "idle";
  const idleLabel = labels.idle ?? button.dataset.submitIdle ?? button.textContent;
  const busyLabel = labels.busy ?? tr("submit.saving");
  const doneLabel = labels.done ?? tr("submit.saved");
  const errorLabel = labels.error ?? tr("submit.error");
  button.dataset.submitIdle = idleLabel;
  button.style.setProperty("--submit-min-width", `${Math.max(button.offsetWidth, button.scrollWidth)}px`);
  button.classList.add("submit-state-button");
  const setState = next => {
    state = api.submitStateStep(state, next);
    button.dataset.submitState = state;
    button.disabled = state === "busy";
    if (state === "busy") button.textContent = busyLabel;
    if (state === "done") {
      button.textContent = doneLabel;
      announceSubmit(doneLabel);
    }
    if (state === "idle") button.textContent = idleLabel;
    if (state === "error") button.textContent = idleLabel;
  };
  setState("start");
  return Promise.resolve()
    .then(() => task?.())
    .then(() => {
      setState("success");
      window.clearTimeout(button._submitResetTimer);
      button._submitResetTimer = window.setTimeout(() => setState("reset"), 1200);
    })
    .catch(() => {
      setState("fail");
      const error = button.parentElement?.querySelector(".submit-state-error") || (() => {
        const note = document.createElement("p");
        note.className = "submit-state-error";
        button.insertAdjacentElement("afterend", note);
        return note;
      })();
      error.textContent = errorLabel;
      announceSubmit(errorLabel);
    });
}

function announceSubmit(message) {
  const region = $("#submitLiveRegion");
  if (!region) return;
  region.textContent = "";
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}

async function deleteHabitFromInspector() {
  const habit = state.habits.find(item => item.id === selectedHabitSettingsId);
  if (!habit || !(await appConfirm(tr("habits.deleteConfirm", { habit: displayHabitName(habit) })))) return;
  const removed = cloneData(habit);
  const index = state.habits.findIndex(item => item.id === habit.id);
  state.habits = state.habits.filter(item => item.id !== habit.id);
  Object.values(state.logs).forEach(log => {
    if (Array.isArray(log.completed)) log.completed = log.completed.filter(id => id !== habit.id);
  });
  saveState();
  selectedHabitSettingsId = state.habits[index]?.id || state.habits[0]?.id || "";
  renderAll();
  showToast(tr("habits.deleted", { habit: displayHabitName(habit) }), {
    actionLabel: languageText("撤销", "Undo", "Rückgängig"),
    onAction: () => {
      state.habits.splice(index, 0, removed);
      saveState();
      selectedHabitSettingsId = removed.id;
      renderAll();
    },
  });
}

function handleHabitContextAction(action) {
  const { habitId, date } = habitContextMenu;
  const habit = state.habits.find(item => item.id === habitId);
  closeHabitContextMenu();
  if (!habit) return;
  if (action === "toggle") {
    toggleHabit(date, habitId);
    return;
  }
  if (action === "edit") {
    if (document.body.dataset.activeView === "habits") {
      selectedHabitSettingsId = habitId;
      populateHabitInspectorForm(habitId);
      renderHabitSettings();
    } else openHabitDialog(habitId);
    return;
  }
  if (action === "disable") {
    habit.active = !habit.active;
    saveState();
    renderAll();
    return;
  }
  if (action === "delete") {
    selectedHabitSettingsId = habitId;
    deleteHabitFromInspector();
  }
}

function closeHabitContextMenu() {
  const menu = $("#habitContextMenu");
  if (!menu) return;
  menu.hidden = true;
  habitContextMenu = { open: false, habitId: "", anchor: null, date: "" };
}

function renderJournalCalendar() {
  const grid = $("#journalCalendarGrid");
  if (!grid) return;
  const onTimeline = true;
  const viewDate = onTimeline ? timelineCursor : cursor;
  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  $("#journalCalendarTitle").textContent = tr("calendar.title", { year, month: month + 1, monthName: monthName(month) });
  const first = new Date(year, month, 1, 12);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset, 12);
  const today = isoDate(new Date());
  const cells = [];
  const currentWeek = isoWeekKey(new Date());
  let monthProgressTotal = 0;
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const key = isoDate(d), log = getLog(key), scoredHabits = dailyHabits(key);
    const completed = scoredHabits.filter(h => log.completed.includes(h.id)).length;
    const progress = scoredHabits.length ? Math.round(completed / scoredHabits.length * 100) : 0;
    if (d.getMonth() === month) monthProgressTotal += progress;
    const schedule = calendarEventsForDate(key);
    const dayPhotos = calendarPhotosByDate.get(key) || [];
    const reason = String(log.moodReason || "").trim();
    const moodClass = calendarViewMode === "mood" ? moodCalendarClass(log.mood) : "";
    const heatClass = calendarViewMode === "heatmap" ? `heat-${calendarHeatLevel(progress)}` : "";
    const moodText = log.mood ? moodLabel(log.mood) : tr("calendar.empty");
    const memoryStatus = [reason ? tr("moodReason.summary", { reason }) : "", dayPhotos.length ? tr("drawer.photoCount", { count: dayPhotos.length }) : ""].filter(Boolean).join(" · ");
    const accessibleStatus = [calendarViewMode === "mood" ? moodText : `${progress}%`, memoryStatus].filter(Boolean).join(" · ");
    cells.push(`<button class="calendar-day ${moodClass} ${heatClass} ${d.getMonth() !== month ? "outside" : ""} ${key === today ? "today" : ""} ${key > today ? "future" : ""} ${isoWeekKey(d) === currentWeek ? "current-week" : ""} ${onTimeline && key === selectedTimelineDate ? "selected" : ""}" data-date="${key}" aria-label="${escapeHtml(formatDateChip(d))} · ${escapeHtml(accessibleStatus)}">
      <span class="day-number">${d.getDate()}</span>${calendarViewMode === "mood" && log.mood ? `<span class="day-mood mood-${log.mood === "低落" ? "low" : log.mood === "平静" ? "calm" : "good"}">${moodCalendarIcon(log.mood)}</span>` : ""}
      ${reason || dayPhotos.length ? `<span class="day-memory-status">${dayPhotos.length ? `<i class="day-photo-marker" title="${escapeHtml(tr("drawer.photoCount", { count: dayPhotos.length }))}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="15" rx="3"/><circle cx="9" cy="11" r="2"/><path d="m5 18 5-4 3 2 3-3 3 5"/></svg><b>${dayPhotos.length}</b></i>` : ""}${reason ? `<i class="day-reason-marker" title="${escapeHtml(reason)}">“</i>` : ""}</span>` : ""}
      ${schedule.length ? `<span class="day-calendar-status" title="${escapeHtml(tr("calendarSync.calendarEvents"))}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 9.5h17"/></svg><b>${schedule.length}</b></span>` : ""}
      ${calendarViewMode === "heatmap" ? `<span class="day-percent">${progress}%</span>` : ""}
    </button>`);
  }
  const monthMark = $("#journalCalendarMonthMark");
  if (monthMark) monthMark.textContent = String(month + 1).padStart(2, "0");
  const journalMonthCompletion = $("#journalMonthCompletion");
  if (journalMonthCompletion) journalMonthCompletion.textContent = `${Math.round(monthProgressTotal / new Date(year, month + 1, 0).getDate())}%`;
  grid.dataset.mode = calendarViewMode;
  grid.innerHTML = cells.join("");
  $$('#timelineView [data-calendar-view]').forEach(button => {
    const active = button.dataset.calendarView === calendarViewMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderJournalCalendarLegend();
  void loadCalendarPhotoMonth(viewDate);
  $$("#timelineView .calendar-day").forEach(day => day.addEventListener("click", () => {
    if (onTimeline) {
      selectedTimelineDate = day.dataset.date;
      void renderTimeline().then(() => {
        // phones: the detail sits under the calendar — bring it into view so the tap visibly does something
        if (!document.documentElement.hasAttribute("data-workspace")) $("#timelineDetail")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      });
      return;
    }
    if (isFutureDate(day.dataset.date)) selectPlanningDate(day.dataset.date, { scroll: true });
    else openDrawer(day.dataset.date);
  }));
}

function renderJournalCalendarLegend() {
  const legend = $("#timelineView .calendar-legend");
  if (!legend) return;
  legend.dataset.mode = calendarViewMode;
  legend.innerHTML = calendarViewMode === "mood"
    ? `<span><i class="legend-mood mood-good">${moodCalendarIcon("很好")}</i>${tr("calendar.moodGood")}</span><span><i class="legend-mood mood-calm">${moodCalendarIcon("平静")}</i>${tr("calendar.moodCalm")}</span><span><i class="legend-mood mood-low">${moodCalendarIcon("低落")}</i>${tr("calendar.moodLow")}</span>`
    : `<span><i class="legend-heat heat-0"></i>${tr("calendar.heatNone")}</span><span><i class="legend-heat heat-1"></i>${tr("calendar.heatLow")}</span><span><i class="legend-heat heat-2"></i>${tr("calendar.heatMedium")}</span><span><i class="legend-heat heat-4"></i>${tr("calendar.heatHigh")}</span>`;
}

var lastShownView = "";
function switchToView(view) {
  const button = $(`.nav-item[data-view="${view}"]`);
  if (!button) return;
  $$(".nav-item").forEach(item => {
    const active = item.dataset.view === view;
    item.classList.toggle("active", active);
    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
  $$(".view").forEach(section => section.classList.toggle("active", section.id === view + "View"));
  // entrance stagger only right after switching (re-renders inside a page must not replay it)
  const entering = $(`#${view}View`);
  if (entering && !entering.classList.contains("is-entering")) { entering.classList.add("is-entering"); setTimeout(() => entering.classList.remove("is-entering"), 900); }
  document.body.dataset.activeView = view;
  // Pages scroll with the window (the sidebar stays put), so a newly opened page starts at its top.
  if (view !== lastShownView) window.scrollTo({ top: 0, behavior: "instant" });
  lastShownView = view;
  $("#viewTitle").textContent = tr(`viewTitles.${view}`);
  if (view === "week") renderWeeklyWorkspace();
  if (view === "longrange") renderLongRange();
  if (view === "timeline") void renderTimeline();
  if (view === "review") { renderReview(); requestAnimationFrame(fitReviewText); }
  if (view === "habits") renderHabitSettings();
}

function applyPortedPageLanguage() {
  const thisWeek = document.getElementById("currentWorkspaceWeek"); if (thisWeek) thisWeek.textContent = tr("week.relativeCurrent");
  $$("[data-analytics-window]").forEach(button => { button.textContent = tr(`review.window${button.dataset.analyticsWindow}`); });
setText("#journalModeWeeks", languageText("周度", "Weekly", "Wöchentlich"));
setText("#journalModeTimeline", languageText("日度", "Daily", "Täglich"));
setText("#journalModeMonths", languageText("月度", "Monthly", "Monatlich"));
setText("#journalModePhotos", languageText("照片", "Photos", "Fotos"));
setText("#journalModeCalendar", languageText("日历", "Calendar", "Kalender"));
setText("#reviewScoreSummary", languageText("习惯分数", "Habit scores", "Gewohnheitswerte"));
setText("#insightViewTrend", tr("review.viewTrend"));
setText("#insightViewHeatmap", tr("review.viewCalendar"));
setText("#insightViewHabits", tr("review.viewHabits"));
setText("#insightViewTable", tr("review.viewTable"));
setAria("#insightViewSwitch", languageText("报表视图", "Report view", "Berichtansicht"));
setPlaceholder("#journalQuickNote", languageText("这一天想记下什么？", "Any thoughts for this day?", "Was möchtest du zu diesem Tag notieren?"));
setAria("#journalComposerLabel", languageText("日志", "Note", "Notiz"));
setText("#journalComposerSave", languageText("保存", "Save", "Speichern"));
setAria("#journalModeSwitch", languageText("时间轴内容", "Timeline content", "Zeitleisteninhalt"));
setText("#journalScrollTitle", tr("viewTitles.timeline"));
setText("#insightsScrollTitle", tr("viewTitles.review"));
setText("#habitsScrollTitle", tr("viewTitles.habits"));
setAria("#analyticsPeriod", tr("review.windowAria"));
setText("#habitColName", tr("habits.colName"));
setText("#habitColTarget", tr("habits.colTarget"));
setText("#habitColActive", tr("habits.colActive"));
setText("#reviewNarrativeTitle", tr("review.narrativeTitle"));
setText("#reviewNarrativeAutosave", tr("review.autosaved"));
setText("#habitInspectorBasicsLegend", languageText("基础", "Basics", "Grundlagen"));
setText("#habitInspectorTrackingLegend", languageText("追踪", "Tracking", "Tracking"));
setText("#habitInspectorScheduleLegend", languageText("计划", "Schedule", "Rhythmus"));
setText("#habitInspectorActiveLabel", tr("habits.active"));
setText("#habitInspectorCountsLabel", languageText("计入分数", "Counts toward score", "Zählt zur Wertung"));
setText("#habitInspectorEffectiveDateLabel", tr("dialog.effectiveDate"));
setPlaceholder('#habitInspectorForm input[name="name"]', tr("dialog.namePlaceholder"));
setText("#timelineKicker", tr("timeline.kicker"));
setText("#timelineTitle", tr("timeline.title"));
setText("#timelineDescription", tr("timeline.description"));
setAria("#timelinePreviousMonth", tr("timeline.previous"));
setAria("#timelineNextMonth", tr("timeline.next"));
setText("#weeklyWorkspaceTitle", tr("week.title"));
setAria("#previousWorkspaceWeek", tr("week.previous"));
setAria("#nextWorkspaceWeek", tr("week.next"));
setAria("#goalHorizonSwitch", languageText("目标周期", "Goal horizon", "Zielhorizont"));
setText("#longTermKicker", tr("longTerm.kicker"));
setText("#longTermTitle", tr("longTerm.title"));
setText("#longTermDescription", tr("longTerm.description"));
setText("#addLongTermGoal b", tr("longTerm.add"));
setText("#inspectorWeekHeading", languageText("周复盘", "Weekly reflection", "Wochenreflexion"));
setText("#inspectorWeekAutosave", tr("review.autosaved"));
setPlaceholder("#weeklyOutputText", tr("week.outputPlaceholder"));
setText("#analyticsMetricLabel", tr("review.selectMetrics"));
setText("#addPeriodTarget", tr("review.addMetric"));
setAria("#analyticsChartMode", tr("review.chartType"));
setPlaceholder("#reviewText", tr("review.placeholder"));
setText("#addHabitButton", tr("habits.add"));
setText("#weekCompletedKicker", languageText("本周进展", "THIS WEEK", "DIESE WOCHE"));
setText("#weekCompletedTitle", languageText('周日历', 'Week calendar', 'Wochenkalender'));
setText("#weekInsightsKicker", languageText("数据洞察", "PROGRESS", "FORTSCHRITT"));
setText("#weekInsightsTitle", tr("modules.insights"));
setText("#weekGoalsKicker", languageText("目标与焦点", "FOCUS & TARGETS", "FOKUS & ZIELE"));
setText("#weekReviewKicker", languageText("深度复盘", "DEEP REVIEW", "TIEFER RÜCKBLICK"));
setText("#weekRateLabel", tr("week.completionRate"));
setText("#weekBestDayLabel", tr("week.bestDay"));
setText("#weekStreakLabel", tr("week.streak"));
setText("#weekFocusMinutesLabel", tr("week.focusTime"));
}

function bootApplication() {
  // Desktop workspace layout of the approved pages (same breakpoint as 858ede8).
  const workspaceMedia = window.matchMedia("(min-width: 761px)");
  const syncWorkspace = () => document.documentElement.toggleAttribute("data-workspace", workspaceMedia.matches);
  workspaceMedia.addEventListener("change", syncWorkspace); syncWorkspace();
  maybeApplyDemoWorkspace();
  syncExportButtonPlacement();
  syncMobileToolbar();
  initSelects();
  initFocusTimer();
  bindEvents();
  initVoiceReflection();
  initJournalTools();
  initDeviceProfile();
  initQuoteSettings();
  initNavOrderSettings();
  initPhotoMemories();
  bindPointerMotion();
  renderAll();
  armReminderClock();
  initializeCloudSync();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => bootApplication());
else bootApplication();
if (location.protocol === "file:") {
  $$('[data-install-app]').forEach(button => { button.hidden = true; });
}
async function initializeCloudSync() {
  if (!cloudMode) {
    setSaveMode("", tr("save.localPreview"));
    return;
  }
  if (cloudProvider === "cloudbase") {
    try {
      await cloudBaseAdapter.initialize();
      const login = await refreshCloudBaseAccount();
      if (!login?.user) {
        markAuthExpired();
        return;
      }
    } catch (error) {
      console.warn("CloudBase initialization failed", error);
      setSaveMode("", tr("save.networkRetry"));
      return;
    }
  }
  await pullCloudState();
  await initializeGoogleCalendar();
  const calendarResult = new URLSearchParams(location.search).get("calendar");
  if (calendarResult) {
    const url = new URL(location.href);
    url.searchParams.delete("calendar");
    history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    if (calendarResult === "connected" && googleCalendar.connected) {
      showToast(tr("calendarSync.connected"));
      void openGoogleCalendarSettings();
    } else if (calendarResult === "denied") {
      showToast(tr("calendarSync.error"));
    }
  }
}
if ("serviceWorker" in navigator && location.protocol !== "file:" && !window.__TAURI__) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" })
      .then(registration => registration.update())
      .catch(error => console.warn("Service worker registration failed", error));
  });
}

// Monthly reflection grows with its text instead of scrolling inside a small box (user 10/27).
function fitReviewText() {
  const field = $("#reviewText");
  if (!field || !field.offsetParent) return;
  field.style.height = "auto";
  field.style.height = `${field.scrollHeight + 2}px`;
}

// Sidebar profile (restored 10/27; first shipped in 858ede8, lost in the 10/18 revert): a display name and photo.
// Local edition: this device only. Sync edition (10/27): stored in the synced records, the same on every device.
// (function declarations + var: this block sits below the boot call, and applyLanguage reads the profile at boot)
var PROFILE_KEY = "life-ledger-device-profile", deviceProfileCache = null, profileUpload = 0;
function validAvatar(value) { return typeof value === "string" && value.length <= 400000 && /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value); }
function readDeviceProfile(raw) { try { const p = JSON.parse(raw) || {}; return { name: String(p.name || "").trim().slice(0, 60), avatar: validAvatar(p.avatar) ? p.avatar : "" }; } catch { return { name: "", avatar: "" }; } }
function profileFrame(f) { const n = (v, lo, hi, d) => Number.isFinite(Number(v)) ? Math.min(hi, Math.max(lo, Number(v))) : d; return { x: n(f?.x, 0, 100, 50), y: n(f?.y, 0, 100, 50), zoom: n(f?.zoom, 1, 3, 1) }; }
// Online edition (user 10/27): name and photo travel with the synced records, so every device shows the same.
// Local edition: they stay on this device as before.
function getDeviceProfile() {
  if (!deviceProfileCache) { deviceProfileCache = readDeviceProfile(localStorage.getItem("life-ledger-device-profile")); try { deviceProfileCache.frame = profileFrame(JSON.parse(localStorage.getItem("life-ledger-device-profile") || "{}").frame); } catch { deviceProfileCache.frame = profileFrame(); } }
  if (cloudMode && state?.profile) { const p = readDeviceProfile(JSON.stringify(state.profile)); return { ...p, frame: profileFrame(state.profile.frame) }; }
  return deviceProfileCache;
}
function adoptCloudProfile(remote) {
  if (!cloudMode) return;
  if (!state.profile && remote?.profile) state.profile = cloneData(remote.profile);
  const local = deviceProfileCache || getDeviceProfile();
  if (!state.profile && (local.name || local.avatar)) { state.profile = cloneData(local); saveState(); }
}
function placeAvatar(img, frame) { const f = profileFrame(frame); img.style.objectPosition = `${f.x}% ${f.y}%`; img.style.transformOrigin = `${f.x}% ${f.y}%`; img.style.transform = f.zoom > 1 ? `scale(${f.zoom})` : ""; }
function renderDeviceProfile() {
  const deviceProfile = getDeviceProfile();
  const fallback = demoWorkspaceApi()?.isDemoActive(state) ? languageText("于朦胧", "Alan", "Alan") : tr("profileName");
  const name = deviceProfile.name || fallback;
  const fill = node => {
    if (!node) return;
    node.replaceChildren();
    if (deviceProfile.avatar) { const img = new Image(); img.src = deviceProfile.avatar; img.alt = ""; img.draggable = false; placeAvatar(img, deviceProfile.frame); node.append(img); node.classList.add("has-photo"); }
    else if (deviceProfile.name) { node.textContent = Array.from(deviceProfile.name)[0].toLocaleUpperCase(); node.classList.remove("has-photo"); }
    else { node.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 4.5h11a2 2 0 0 1 2 2v13H8a2 2 0 0 1-2-2v-13Z"/><path d="M8 4.5v15M11 9h5m-5 4h5"/></svg>'; node.classList.remove("has-photo"); }
  };
  fill($("#sidebarAvatar")); fill($("#profileDialogAvatar"));
  const edit = languageText("编辑名称和头像", "Edit name and photo", "Name und Bild bearbeiten");
  $("#profileEditButton")?.setAttribute("aria-label", `${name} · ${edit}`);
  $("#profileEditButton")?.setAttribute("title", edit);
  setText("#profileDialogTitle", languageText("你的空间", "Your space", "Dein Bereich"));
  setText("#profileChoosePhoto", languageText(deviceProfile.avatar ? "更换头像" : "选择头像", deviceProfile.avatar ? "Change photo" : "Choose photo", deviceProfile.avatar ? "Bild ändern" : "Bild auswählen"));
  setText("#profileRemovePhoto", languageText("移除", "Remove", "Entfernen"));
  setText("#profileNameLabel", languageText("显示名称", "Display name", "Anzeigename"));
  if (cloudMode) setText("#profileDeviceNote", languageText("名称和头像随云端同步，所有设备显示一样。拖动照片调整位置，滑块放大缩小。", "Name and photo sync through your cloud, so every device shows the same. Drag the photo to move it; use the slider to zoom.", "Name und Bild werden über deine Cloud synchronisiert. Ziehe das Bild zum Verschieben, der Regler zoomt."));
  else setText("#profileDeviceNote", languageText("名称和头像只保存在这台设备上，不会改动登录账户或同步的记录。拖动照片调整位置，滑块放大缩小。PNG、JPEG 或 WebP，最大 5 MB。", "Name and photo stay on this device; they do not change your sign-in or synced records. Drag the photo to move it; use the slider to zoom. PNG, JPEG or WebP, up to 5 MB.", "Name und Bild bleiben auf diesem Gerät; Anmeldung und synchronisierte Einträge bleiben unverändert. PNG, JPEG oder WebP, bis 5 MB."));
  const input = $("#profileDisplayName");
  if (input) { input.placeholder = fallback; if (document.activeElement !== input) input.value = deviceProfile.name; }
  if ($("#profileRemovePhoto")) $("#profileRemovePhoto").hidden = !deviceProfile.avatar;
  const zoom = $("#profilePhotoZoom");
  if (zoom) { zoom.closest("label").hidden = !deviceProfile.avatar; zoom.value = String(deviceProfile.frame.zoom); zoom.setAttribute("aria-label", languageText("缩放头像", "Zoom photo", "Bild zoomen")); }
  setText("#profileZoomLabel", languageText("缩放", "Zoom", "Zoom"));
}
function saveDeviceProfile(next) {
  next = { name: next.name || "", avatar: next.avatar || "", frame: profileFrame(next.frame) };
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(next)); }
  catch { setText("#profileFeedback", languageText("无法保存，请检查设备存储空间。", "Could not save. Check device storage.", "Speichern fehlgeschlagen. Gerätespeicher prüfen.")); return; }
  deviceProfileCache = next;
  if (cloudMode) { state.profile = cloneData(next); saveState(); }
  setText(".profile strong", next.name || (demoWorkspaceApi()?.isDemoActive(state) ? languageText("于朦胧", "Alan", "Alan") : tr("profileName")));
  renderDeviceProfile();
}
async function chooseProfilePhoto(file) {
  const current = ++profileUpload;
  setText("#profileFeedback", "");
  if (!file) return;
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
    setText("#profileFeedback", languageText("请选择不超过 5 MB 的 PNG、JPEG 或 WebP 图片。", "Choose a PNG, JPEG or WebP image up to 5 MB.", "Bitte PNG, JPEG oder WebP bis 5 MB auswählen.")); return;
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = url; await img.decode();
    if (current !== profileUpload) return;
    if (img.naturalWidth * img.naturalHeight > 25000000) throw new Error("image too large");
    const scale = Math.min(1, 640 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas"); canvas.width = Math.round(img.naturalWidth * scale); canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d"); ctx.fillStyle = "#e4edf4"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let avatar = canvas.toDataURL("image/jpeg", 0.82);
    if (!validAvatar(avatar)) avatar = canvas.toDataURL("image/jpeg", 0.6);
    if (!validAvatar(avatar)) throw new Error("invalid image");
    saveDeviceProfile({ ...getDeviceProfile(), avatar, frame: profileFrame() });
  } catch {
    if (current === profileUpload) setText("#profileFeedback", languageText("图片无法读取，原头像已保留。请换一张较小的图片。", "Could not read this image. Your previous photo is unchanged. Try a smaller image.", "Bild nicht lesbar. Das bisherige Bild bleibt. Bitte ein kleineres Bild wählen."));
  } finally { URL.revokeObjectURL(url); $("#profilePhotoFile").value = ""; }
}
function initDeviceProfile() {
  const dialog = $("#profileDialog");
  if (!dialog) return;
  $("#profileEditButton").addEventListener("click", () => { renderDeviceProfile(); setText("#profileFeedback", ""); dialog.showModal(); });
  $("#profileDisplayName").addEventListener("input", event => saveDeviceProfile({ ...getDeviceProfile(), name: event.target.value.trim().slice(0, 60) }));
  $("#profileChoosePhoto").addEventListener("click", () => $("#profilePhotoFile").click());
  $("#profilePhotoFile").addEventListener("change", event => void chooseProfilePhoto(event.target.files[0]));
  $("#profileRemovePhoto").addEventListener("click", () => { ++profileUpload; saveDeviceProfile({ ...getDeviceProfile(), avatar: "", frame: profileFrame() }); $("#profileChoosePhoto").focus(); });
  // Framing like the photo wall: drag the large preview to move, slider (or wheel / arrow keys) to zoom.
  const stage = $("#profileDialogAvatar"), live = frame => { const img = stage.querySelector("img"); if (img) placeAvatar(img, frame); const side = $("#sidebarAvatar img"); if (side) placeAvatar(side, frame); };
  let drag = null;
  stage.addEventListener("pointerdown", event => { const p = getDeviceProfile(); if (!p.avatar) return; stage.setPointerCapture(event.pointerId); drag = { x: event.clientX, y: event.clientY, frame: { ...p.frame } }; });
  stage.addEventListener("pointermove", event => {
    if (!drag || !stage.hasPointerCapture(event.pointerId)) return;
    const r = stage.getBoundingClientRect(), k = 100 / (r.width * drag.frame.zoom);
    drag.next = profileFrame({ ...drag.frame, x: drag.frame.x - (event.clientX - drag.x) * k, y: drag.frame.y - (event.clientY - drag.y) * k });
    live(drag.next);
  });
  const endDrag = () => { if (drag?.next) saveDeviceProfile({ ...getDeviceProfile(), frame: drag.next }); drag = null; };
  stage.addEventListener("pointerup", endDrag); stage.addEventListener("pointercancel", endDrag);
  stage.addEventListener("wheel", event => { const p = getDeviceProfile(); if (!p.avatar) return; event.preventDefault(); saveDeviceProfile({ ...p, frame: { ...p.frame, zoom: p.frame.zoom - event.deltaY * 0.004 } }); }, { passive: false });
  stage.addEventListener("keydown", event => {
    const p = getDeviceProfile(), d = { ArrowLeft: [-4, 0], ArrowRight: [4, 0], ArrowUp: [0, -4], ArrowDown: [0, 4] }[event.key];
    if (!p.avatar || !d) return; event.preventDefault();
    saveDeviceProfile({ ...p, frame: { ...p.frame, x: p.frame.x + d[0], y: p.frame.y + d[1] } });
  });
  $("#profilePhotoZoom").addEventListener("input", event => { const p = getDeviceProfile(); live({ ...p.frame, zoom: Number(event.target.value) }); });
  $("#profilePhotoZoom").addEventListener("change", event => { const p = getDeviceProfile(); saveDeviceProfile({ ...p, frame: { ...p.frame, zoom: Number(event.target.value) } }); });
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  window.addEventListener("storage", event => { if (event.key === PROFILE_KEY) { deviceProfileCache = readDeviceProfile(event.newValue); renderDeviceProfile(); } });
  renderDeviceProfile();
}

// Settings → quotes (user 10/27): automatic library, or your own list (one = always, several = daily rotation).
function initQuoteSettings() {
  const mode = $("#quoteModeSelect"), box = $("#settingsQuotes"), text = $("#customQuotesText");
  if (!mode || !text) return;
  const sync = () => {
    const q = state.quoteSettings || { mode: "auto", items: [] };
    mode.value = q.mode === "custom" ? "custom" : "auto";
    box.hidden = mode.value !== "custom";
    if (document.activeElement !== text) text.value = (q.items || []).map(item => item.source ? `${item.text}——${item.source}` : item.text).join("\n");
  };
  const store = () => {
    state.quoteSettings = { mode: mode.value === "custom" ? "custom" : "auto", items: parseCustomQuotes(text.value) };
    box.hidden = mode.value !== "custom";
    saveState();
    applyLanguage();
  };
  mode.addEventListener("change", () => { store(); if (mode.value === "custom") text.focus(); });
  let timer = 0;
  text.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(store, 250); });
  text.addEventListener("blur", () => { clearTimeout(timer); store(); });
  $("#settingsButton").addEventListener("click", sync);
}

// Settings → page order (user 10/27): Today, Week, Horizon, Timeline, Review in any order; Habits stays last.
const NAV_ORDER_KEY = "life-ledger-nav-order";
const NAV_PAGES = ["today", "week", "longrange", "timeline", "review"];
function navOrder() {
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(NAV_ORDER_KEY) || "[]"); } catch {}
  const order = (Array.isArray(saved) ? saved : []).filter(id => NAV_PAGES.includes(id));
  return [...new Set([...order, ...NAV_PAGES])];
}
function applyNavOrder() {
  const nav = $(".main-nav");
  if (!nav) return;
  const habits = nav.querySelector('[data-view="habits"]');
  navOrder().forEach(id => { const item = nav.querySelector(`.nav-item[data-view="${id}"]`); if (item) nav.insertBefore(item, habits); });
}
function renderNavOrderSettings() {
  const list = $("#navOrderList");
  if (!list) return;
  const order = navOrder(), up = languageText("上移", "Move up", "Nach oben"), down = languageText("下移", "Move down", "Nach unten");
  list.innerHTML = order.map((id, i) => `<li data-id="${id}"><span>${escapeHtml(tr(`nav.${id}`))}</span>
    <button type="button" class="icon-button" data-move="-1" aria-label="${escapeHtml(up)} · ${escapeHtml(tr(`nav.${id}`))}" ${i === 0 ? "disabled" : ""}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg></button>
    <button type="button" class="icon-button" data-move="1" aria-label="${escapeHtml(down)} · ${escapeHtml(tr(`nav.${id}`))}" ${i === order.length - 1 ? "disabled" : ""}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></li>`).join("");
}
function initNavOrderSettings() {
  applyNavOrder();
  const list = $("#navOrderList");
  if (!list) return;
  list.addEventListener("click", event => {
    const button = event.target.closest("[data-move]");
    if (!button) return;
    const order = navOrder(), id = button.closest("li").dataset.id, from = order.indexOf(id), to = from + Number(button.dataset.move);
    if (to < 0 || to >= order.length) return;
    order.splice(to, 0, order.splice(from, 1)[0]);
    try { localStorage.setItem(NAV_ORDER_KEY, JSON.stringify(order)); } catch {}
    notePrefChange();
    applyNavOrder();
    renderNavOrderSettings();
    list.querySelector(`li[data-id="${id}"] [data-move="${button.dataset.move}"]:not(:disabled)`)?.focus();
  });
  $("#settingsButton").addEventListener("click", renderNavOrderSettings);
}

// Daily review (user 10/27): dictation in every edition, and a larger pop-out to read and write the whole entry.
function dictateInto(field, button) {
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!field || field.disabled) return;
  if (voiceReflection) { voiceReflection.setContext({ date: isoDate(new Date()), isToday: true, disabled: false }); voiceReflection.open(); voiceTarget = text => appendToField(field, text); return; }
  if (!Speech) { showToast(languageText("这个浏览器不支持语音输入，可用 Safari 或 Chrome", "This browser has no dictation — try Safari or Chrome", "Dieser Browser kann nicht diktieren — Safari oder Chrome versuchen")); return; }
  if (button.recognition) { button.recognition.stop(); return; }
  const recognition = new Speech();
  recognition.lang = { zh: "zh-CN", de: "de-DE" }[currentLang] || "en-US";
  recognition.interimResults = false;
  recognition.continuous = true;
  recognition.onresult = event => { const text = [...event.results].slice(event.resultIndex).filter(r => r.isFinal).map(r => r[0].transcript).join(""); if (text.trim()) appendToField(field, text); };
  recognition.onerror = event => { if (event.error !== "aborted") showToast(languageText("没有听清，请再试一次", "Didn't catch that — try again", "Nicht verstanden — bitte noch einmal")); };
  recognition.onend = () => { button.recognition = null; button.classList.remove("is-listening"); };
  button.recognition = recognition;
  recognition.start();
  button.classList.add("is-listening");
}
function initJournalTools() {
  const note = $("#homeDayNote"), dialog = $("#journalPopout"), big = $("#journalPopoutText");
  const dictate = $("#journalDictate");
  if (!note || !dialog) return;
  const label = () => {
    const d = languageText("语音记录", "Dictate", "Diktieren"), o = languageText("展开查看全文", "Open larger", "Größer öffnen");
    [dictate, $("#journalPopoutDictate")].forEach(b => { b?.setAttribute("aria-label", d); b?.setAttribute("title", d); });
    $("#journalPopoutButton")?.setAttribute("aria-label", o); $("#journalPopoutButton")?.setAttribute("title", o);
    setText("#journalPopoutTitle", tr("journal.title"));
    setText("#journalPopoutKicker", languageText("每日复盘", "JOURNAL", "TAGEBUCH"));
    setText("#journalPopoutDone", languageText("完成", "Done", "Fertig"));
  };
  label();
  // the hosted voice button (transcribe + refine) stays; the plain mic covers local and offline use
  if (!$("#voiceReflectionButton")?.hidden) dictate.hidden = true;
  dictate.addEventListener("click", () => dictateInto(note, dictate));
  $("#journalPopoutDictate").addEventListener("click", event => dictateInto(big, event.currentTarget));
  $("#journalPopoutButton").addEventListener("click", () => {
    label();
    big.value = note.value; big.disabled = note.disabled; big.placeholder = note.placeholder;
    setText("#journalPopoutDate", formatDateChip(parseDate(selectedPlanningDate)));
    dialog.showModal();
    if (!big.disabled) { big.focus(); big.setSelectionRange(big.value.length, big.value.length); }
  });
  const overflow = () => {
    const over = note.scrollHeight > note.clientHeight + 2;
    note.classList.toggle("is-overflowing", over);
    $("#journalPopoutButton").classList.toggle("is-hinting", over);
  };
  note.addEventListener("input", overflow);
  note.addEventListener("blur", () => { note.scrollTop = 0; overflow(); });
  new ResizeObserver(overflow).observe(note);
  window.addEventListener("life-ledger-rendered", overflow);
  big.addEventListener("input", () => { note.value = big.value; note.dispatchEvent(new Event("input", { bubbles: true })); });
  dialog.addEventListener("close", () => { $("#journalPopoutDictate").recognition?.stop(); renderHomeJournal(); });
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
}

// Settings (user 10/22): appearance + font live here instead of the top bar; local data can be wiped to start fresh.
function initSettingsDialog() {
  const dialog = $("#settingsDialog");
  if (!dialog) return;
  const localOnly = !hostedCloudMode && desktopMode !== "tauri-local";
  const macLocal = desktopMode === "tauri-local";
  const label = () => {
    setText("#settingsTitle", languageText("设置", "Settings", "Einstellungen"));
    setText("#settingsAppearanceTitle", languageText("外观", "Appearance", "Darstellung"));
    setText("#settingsThemeLabel", languageText("颜色模式", "Colour mode", "Farbmodus"));
    setText("#settingsFontLabel", languageText("字体", "Font", "Schrift"));
    setText("#settingsDataTitle", languageText("数据", "Data", "Daten"));
    setText("#settingsQuotesTitle", languageText("名言", "Quotes", "Zitate"));
    setText("#settingsQuoteModeLabel", languageText("名言来源", "Quote source", "Zitatquelle"));
    const qm = $("#quoteModeSelect");
    if (qm) { qm.options[0].text = languageText("自动", "Automatic", "Automatisch"); qm.options[1].text = languageText("自定义", "My own", "Eigene"); }
    $("#customQuotesText")?.setAttribute("placeholder", languageText("每行一条。出处写在 —— 后面，例如：\n慎终如始，则无败事。——《道德经》", "One per line. Put the source after —, e.g.\nWell begun is half done. — Aristotle", "Eins pro Zeile. Quelle nach —, z. B.\nAller Anfang ist schwer. — Sprichwort"));
    setText("#customQuotesHelp", languageText("写一条就一直显示它；写几条就每天轮换。", "One quote stays put; several rotate day by day.", "Ein Zitat bleibt stehen; mehrere wechseln täglich."));
    setText("#settingsNavTitle", languageText("页面顺序", "Page order", "Seitenreihenfolge"));
    setText("#settingsBackupLabel", languageText("导入与导出", "Import & export", "Import & Export"));
    setText("#settingsBackupHelp", languageText("备份到文件，或从备份恢复", "Back up to a file or restore one", "In Datei sichern oder wiederherstellen"));
    setText("#settingsLoadDemoLabel", languageText("载入示例数据", "Load sample data", "Beispieldaten laden"));
    setText("#settingsLoadDemoHelp", languageText("看看用了三个月之后的样子", "See what three months of use look like", "So sieht es nach drei Monaten aus"));
    setText("#settingsRestoreLabel", languageText("恢复之前的本机记录", "Restore earlier records", "Frühere Einträge wiederherstellen"));
    setText("#settingsRestoreHelp", languageText("换回示例数据出现之前你在这台设备上的记录", "Bring back what you recorded on this device before the sample", "Holt zurück, was du vor den Beispieldaten auf diesem Gerät erfasst hast"));
    setText("#settingsClearLabel", languageText("清除本机数据，从空白开始", "Clear this device and start fresh", "Gerät leeren und neu beginnen"));
    setText("#settingsClearHelp", languageText("删除这台设备上的记录、照片和示例数据；外观设置保留", "Removes records, photos and sample data on this device; appearance stays", "Löscht Einträge, Fotos und Beispieldaten auf diesem Gerät; Darstellung bleibt"));
    setAria("#settingsButton", languageText("设置", "Settings", "Einstellungen"));
    $("#settingsButton")?.setAttribute("title", languageText("设置", "Settings", "Einstellungen"));
  };
  $("#settingsButton").addEventListener("click", () => {
    label();
    $("#settingsClearLocal").hidden = !localOnly;
    $("#settingsRestoreLocal").hidden = !localOnly || !localStorage.getItem(LOCAL_BACKUP_KEY);
    $("#settingsLoadDemo").hidden = macLocal
      ? Boolean(demoWorkspaceApi()?.isDemoActive(state)) || Boolean(demoWorkspaceApi()?.hasMeaningfulUserData(state))
      : !localOnly || Boolean(demoWorkspaceApi()?.isDemoActive(state));
    $("#settingsRestoreLocal").hidden = !(localOnly || macLocal) || !localStorage.getItem(LOCAL_BACKUP_KEY);
    $("#settingsClearLocal").hidden = !(localOnly || macLocal);
    dialog.showModal();
  });
  $("#settingsBackup").addEventListener("click", () => { dialog.close(); openBackupDialog(); });
  const version = document.querySelector('script[src*="app.js?v="]')?.getAttribute("src").split("v=")[1];
  if (version) setText("#settingsVersion", `Life Ledger ${version}`);
  // In the Mac app the line names the app's own version too (3.0 = the Mac app with the sync edition).
  void window.__TAURI__?.app?.getVersion?.().then(mac => setText("#settingsVersion", `Life Ledger for Mac ${mac} · ${languageText("页面", "page", "Seite")} ${version}`)).catch(() => {});
  initModeSwitch(dialog);
  $("#settingsInstallApp").addEventListener("click", () => dialog.close(), true);
  $("#settingsLoadDemo").addEventListener("click", () => {
    if (macLocal) { loadMacSample(); return; }
    localStorage.removeItem(demoDismissedStorageKey());
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });
  $("#settingsRestoreLocal").addEventListener("click", async () => {
    let backup;
    try { backup = JSON.parse(localStorage.getItem(LOCAL_BACKUP_KEY) || "null"); } catch { backup = null; }
    if (!backup?.keys) return;
    if (!(await appConfirm(languageText("用之前的记录替换当前的示例数据？", "Replace the sample data with your earlier records?", "Beispieldaten durch deine früheren Einträge ersetzen?")))) return;
    if (macLocal) { removeLocalKeys(); await removeDemoWallPhotos(); } else wipeLocalRecords();
    Object.entries(backup.keys).forEach(([key, value]) => localStorage.setItem(key, value));
    localStorage.setItem(demoDismissedStorageKey(), "1"); // never re-seed over restored records
    localStorage.removeItem(LOCAL_BACKUP_KEY);
    location.reload();
  });
  $("#settingsClearLocal").addEventListener("click", async () => {
    if (!(await appConfirm(languageText(
      "确定清除这台设备上的全部记录？此操作不能撤销。需要的话先用「导入与导出」备份。",
      "Clear every record on this device? This cannot be undone. Export a backup first if you need one.",
      "Alle Einträge auf diesem Gerät löschen? Das lässt sich nicht rückgängig machen. Bei Bedarf vorher sichern.")))) return;
    Object.keys(localStorage).filter(key => key.startsWith("life-ledger") && !KEEP_ON_CLEAR.has(key)).forEach(key => localStorage.removeItem(key));
    localStorage.setItem(demoDismissedStorageKey(), "1"); // start blank: never re-seed the sample
    localStorage.setItem(LOCAL_EDITION_KEY, "wipe");      // photos are removed on the next boot, see maybeApplyDemoWorkspace
    location.reload();
  });
}

// Mac app: the sample is only ever loaded on request, never over real records (hasMeaningfulUserData guards the offer).
// Whatever this window held goes into the same restorable backup key the web edition uses.
async function loadMacSample() {
  const api = demoWorkspaceApi();
  if (!api || api.hasMeaningfulUserData(state)) return;
  if (!(await appConfirm(languageText("载入三个月的虚构示例？之后可以在「设置」里换回现在的内容。",
    "Load the fictional three-month sample? You can switch back in Settings.",
    "Das erfundene Drei-Monats-Beispiel laden? In den Einstellungen kannst du zurückwechseln.")))) return;
  const saved = Object.fromEntries(Object.keys(localStorage)
    .filter(key => key.startsWith("life-ledger") && !KEEP_ON_CLEAR.has(key)).map(key => [key, localStorage.getItem(key)]));
  try { localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify({ savedAt: new Date().toISOString(), keys: saved })); }
  catch { return; }
  removeLocalKeys();
  state = { ...cloneData(seed), ...api.buildDemoWorkspace({ now: new Date(), lang: currentLang, seedHabits: cloneData(seed.habits) }) };
  saveState();
  location.reload();
}
window.LifeLedgerLoadMacSample = () => { if (desktopMode === "tauri-local") loadMacSample(); };

// Settings → switch between the local edition and the sync edition (user 10/28: easy for people upgrading).
// Mac app: back to its launcher (local or your own cloud). Browser: open the other edition; records do not move
// by themselves, so the dialog offers a backup first and says how to bring them over.
var CLOUD_URL_KEY = "life-ledger-cloud-url";
function initModeSwitch(settings) {
  const dialog = $("#modeDialog"), button = $("#settingsSwitchMode");
  if (!dialog || !button) return;
  const mac = Boolean(window.__TAURI__?.core?.invoke) && document.documentElement.classList.contains("ll-mac");
  const toCloud = () => !cloudMode;
  const label = () => {
    setText("#settingsSwitchLabel", toCloud() ? languageText("切换到同步模式", "Switch to sync mode", "Zum Sync-Modus wechseln") : languageText("切换到本机模式", "Switch to local mode", "Zum lokalen Modus wechseln"));
    setText("#settingsSwitchHelp", mac ? languageText("回到启动窗口，选择本机或你自己的云端", "Back to the start window: this Mac or your own cloud", "Zurück zum Startfenster: dieser Mac oder deine eigene Cloud")
      : toCloud() ? languageText("连接你自己部署的云端，所有设备同步", "Connect your own deployment and sync every device", "Mit deiner eigenen Bereitstellung verbinden, alle Geräte synchron")
      : languageText("只在这台设备上使用，不连接云端", "Use it on this device only, without the cloud", "Nur auf diesem Gerät nutzen, ohne Cloud"));
  };
  label();
  settings.addEventListener("close", label);
  settings.addEventListener("toggle", label);
  button.addEventListener("click", () => {
    settings.close();
    if (mac) { void window.__TAURI__.core.invoke("switch_workspace").catch(() => {}); return; }
    const cloud = toCloud(), guide = currentLang === "zh" ? "self-hosting.zh-CN.md" : "self-hosting.md";
    setText("#modeDialogTitle", cloud ? languageText("切换到同步模式", "Switch to sync mode", "Zum Sync-Modus wechseln") : languageText("切换到本机模式", "Switch to local mode", "Zum lokalen Modus wechseln"));
    setText("#modeIntro", cloud
      ? languageText("同步模式打开你自己部署的 Life Ledger：用邮箱验证码登录，手机、电脑和 Mac 应用看到同一份记录。", "Sync mode opens your own Life Ledger deployment: sign in with an email code and your phone, computer and Mac app share the same records.", "Der Sync-Modus öffnet deine eigene Life-Ledger-Bereitstellung: mit E-Mail-Code anmelden, Handy, Computer und Mac-App teilen dieselben Einträge.")
      : languageText("本机模式不连接云端，记录只保存在这台设备的浏览器里。", "Local mode does not use the cloud; records stay in this device's browser.", "Der lokale Modus nutzt keine Cloud; Einträge bleiben im Browser dieses Geräts."));
    setText("#modeNote", cloud
      ? languageText("记录不会自动带过去：先导出备份，打开同步版后在 设置 → 导入与导出 里导入。", "Records do not move by themselves: export a backup first, then import it in the sync edition under Settings → Import & export.", "Einträge wandern nicht von selbst: zuerst ein Backup exportieren, dann in der Sync-Version unter Einstellungen → Import & Export importieren.")
      : languageText("云端记录不会被删除。想在本机版继续用：先导出备份，打开本机版后导入。", "Your cloud records are not deleted. To continue locally: export a backup first, then import it in the local edition.", "Deine Cloud-Einträge bleiben erhalten. Lokal weitermachen: zuerst ein Backup exportieren, dann in der lokalen Version importieren."));
    const note = $("#modeNote");
    if (cloud) { const a = document.createElement("a"); a.href = `https://github.com/zubin-li/life-ledger-deep-review/blob/main/docs/${guide}`; a.target = "_blank"; a.rel = "noopener"; a.textContent = languageText(" 还没有云端？看部署教程", " No cloud yet? Read the setup guide", " Noch keine Cloud? Zur Anleitung"); note.append(a); }
    $("#modeUrlField").hidden = !cloud;
    setText("#modeUrlLabel", languageText("你的云端地址", "Your cloud address", "Deine Cloud-Adresse"));
    $("#modeUrl").value = localStorage.getItem(CLOUD_URL_KEY) || "";
    setText("#modeFeedback", "");
    setText("#modeBackup", languageText("先导出备份", "Export a backup first", "Zuerst Backup exportieren"));
    setText("#modeGo", cloud ? languageText("打开同步版", "Open sync edition", "Sync-Version öffnen") : languageText("打开本机版", "Open local edition", "Lokale Version öffnen"));
    dialog.showModal();
  });
  $("#modeBackup").addEventListener("click", () => { dialog.close(); openBackupDialog(); });
  $("#modeGo").addEventListener("click", () => {
    if (!toCloud()) { location.assign("https://zubin-li.github.io/life-ledger-deep-review/?mode=local"); return; }
    let url;
    try { url = new URL($("#modeUrl").value.trim()); } catch { url = null; }
    const local = url && url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
    if (!url || !(url.protocol === "https:" || local) || url.username || url.password) {
      setText("#modeFeedback", languageText("请输入以 https:// 开头的完整地址。", "Enter a full address starting with https://.", "Bitte eine vollständige Adresse mit https:// eingeben.")); return;
    }
    localStorage.setItem(CLOUD_URL_KEY, url.origin + url.pathname);
    location.assign(url.href);
  });
}

// Cloud edition (user 10/28): the Today layout, weather city and similar view choices travel with the records,
// so the browser, the phone and the Mac app look the same. Local edition: they stay on the device as before.
// Stored as the raw localStorage strings under state.prefs; theme, font and language stay per device.
function syncedPrefKeys() {
  return ["life-ledger-web-today-cards-v4", "life-ledger-weather-city", "life-ledger-heatmap-palette", "life-ledger-freq-habit", "life-ledger-nav-order", "life-ledger-calendar-view",
    "life-ledger-wall-prefs", "life-ledger-wall-prefs-2", "life-ledger-wall-prefs-3"];
}
function localPrefs({ seed = false } = {}) {
  const prefs = {};
  for (const key of syncedPrefKeys()) {
    const value = localStorage.getItem(key);
    if (value == null) continue;
    // Never share an untouched default layout as if it were a choice.
    if (seed && key === "life-ledger-web-today-cards-v4" && window.LifeLedgerTodayCards?.isDefault?.() !== false) continue;
    prefs[key] = value;
  }
  return prefs;
}
function notePrefChange() {
  if (!cloudMode || typeof state === "undefined") return;
  state.prefs = localPrefs();
  saveState();
}
function applyCloudPrefs() {
  if (!cloudMode) return;
  window.LifeLedgerCloudPulled = true;
  window.LifeLedgerTodayWidgets?.syncWalls?.();
  const remote = state.prefs;
  if (!remote || typeof remote !== "object") {
    // First device after the update: share only what the user actually chose here. The browser is the reference
    // (user 10/28), so the Mac app never seeds: it waits for the browser's choices.
    if (window.__TAURI__) return;
    const seed = localPrefs({ seed: true });
    if (Object.keys(seed).length) { state.prefs = seed; saveState(); }
    return;
  }
  let changed = false;
  for (const key of syncedPrefKeys()) {
    if (typeof remote[key] === "string" && localStorage.getItem(key) !== remote[key]) {
      try { localStorage.setItem(key, remote[key]); changed = true; } catch {}
    }
  }
  if (!changed) return;
  calendarViewMode = localStorage.getItem(CALENDAR_VIEW_KEY) === "heatmap" ? "heatmap" : "mood";
  applyNavOrder();
  window.LifeLedgerTodayCards?.reload?.();
  window.LifeLedgerTodayWidgets?.reload?.();
  renderAll();
}
window.LifeLedgerPrefs = { keys: syncedPrefKeys, changed: () => notePrefChange() };
