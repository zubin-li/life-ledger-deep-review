const STORAGE_KEY = "life-ledger-v1";
const LANGUAGE_KEY = "life-ledger-language";
const LANGUAGE_PREFERENCE_KEY = "life-ledger-language-preference-set";
const THEME_KEY = "life-ledger-theme";
const SIDEBAR_KEY = "life-ledger-sidebar-collapsed";
const REMINDER_KEY = "life-ledger-reminder";
const RESTORE_SAFETY_KEY = "life-ledger-restore-safety-v1";
const BACKUP_FORMAT = "life-ledger-backup";
const BACKUP_SCHEMA_VERSION = 1;
const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
const CLOUD_API = "./api/state";
const colors = {
  sage: { solid: "#6f8f7d", soft: "#dbe6dc" },
  amber: { solid: "#d7a84c", soft: "#f3e5bf" },
  coral: { solid: "#d97861", soft: "#f4d8d0" },
  blue: { solid: "#6e8c98", soft: "#d9e4e7" },
  violet: { solid: "#8b79c6", soft: "#e7e0f4" },
  cyan: { solid: "#4d9db3", soft: "#d9eef3" },
};
const moodIcons = { 低落: "☂", 平静: "◌", 很好: "☀" };
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
const defaultHabitIcons = { wake: "sunrise", move: "footprints", protein: "apple", strength: "dumbbell" };
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
    nav: { today: "今日", week: "本周", review: "复盘", habits: "习惯设置" },
    sidebarQuote: { text: "不积跬步，\n无以至千里。", source: "《荀子·劝学》" },
    profileName: "个人复盘空间",
    exportTitle: "导入与导出",
    pwa: { install: "安装为应用", ready: "可安装", manual: "请使用浏览器菜单中的“添加到主屏幕”或“安装应用”。", installed: "Life Ledger 已安装" },
    theme: { label: "外观", system: "跟随系统", light: "浅色模式", dark: "深色模式" },
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
      profileCloud: "D1 云端同步",
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
      review: "月度复盘",
      habits: "习惯",
    },
    hero: {
      quote: "不积小流，\n无以成江海。",
      source: "《荀子·劝学》",
      progress: "今日完成",
      progressText: "{done} / {total} 项完成",
    },
    mood: {
      kicker: "MOOD",
      title: "今天整体感觉如何？",
      values: { 低落: "低落", 平静: "平静", 很好: "很好" },
      note: "人有悲欢离合，月有阴晴圆缺。",
      source: "苏轼《水调歌头》",
    },
    todayGoals: {
      kicker: "DAY PLAN", title: "每日目标", desc: "左右选择日期，回看过去或提前规划。", placeholder: "为这一天添加一个目标…", addLabel: "添加目标",
      empty: "这一天还没有具体目标。<br />先写下一件最重要的事。", added: "目标已添加", previous: "前一天", next: "后一天", futureStatus: "未来目标只能规划，到了当天才能勾选完成",
    },
    journal: { kicker: "日记与事件", title: "每日复盘", desc: "记下发生了什么、推进了什么，以及值得记住的事。", placeholder: "今天发生了什么？推进了什么？有什么值得记住？", futureLocked: "复盘会在这一天到来后开放。", autosaved: "● 自动保存" },
    tomorrowGoals: {
      kicker: "TOMORROW'S PLAN", title: "明日目标", desc: "提前为明天留下一条清晰、从容的起点。", placeholder: "添加明天要完成的事情…", addLabel: "添加明日目标",
      empty: "明天还没有安排具体目标。<br />提前写下一件最重要的事。", added: "已加入明日目标",
    },
    reminder: {
      kicker: "每日节律", title: "每日复盘提醒", enable: "每天提醒我", enableHelp: "在一天结束时，安静地提醒你回来复盘。", time: "提醒时间",
      off: "通知尚未开启", offHelp: "保存后才会请求浏览器通知权限。", ready: "提醒已开启", readyHelp: "本应用打开时会在 {time} 检查并发送提醒。",
      denied: "通知权限已被阻止", deniedHelp: "请在浏览器或系统设置中允许 Life Ledger 发送通知。", unsupported: "当前浏览器不支持通知", unsupportedHelp: "可以继续使用复盘功能，但无法发送系统通知。",
      caveat: "本地预览仅能在应用打开时提醒。要在完全关闭后稳定提醒，需要安装 PWA 并接入云端 Push 服务。", test: "发送测试", cancel: "取消", save: "保存提醒", saved: "提醒设置已保存",
      body: "花几分钟完成今天的打卡、心情与复盘。", testBody: "通知工作正常。今晚也记得回来看看自己的脚步。", close: "关闭每日提醒设置", short: "提醒",
    },
    foundations: { kicker: "FOUNDATIONS", title: "今日基础目标", adjust: "调整目标", periodNote: "周期目标 · 不计入今日完成度" },
    calendar: {
      kicker: "MONTH IN VIEW",
      title: "{year}年 {month}月",
      desc: "点开任意一天，完成打卡或补上一段记录。",
      prev: "上个月",
      next: "下个月",
      weekdays: ["一", "二", "三", "四", "五", "六", "日"],
      monthCompletion: "本月完成度",
      complete: "全部完成",
      partial: "部分完成",
      empty: "尚未记录",
      dayTitle: "{month}月{day}日",
      dayPercent: "{day}日 · {percent}%",
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
    },
    review: {
      kicker: "MONTHLY REVIEW",
      title: "{month}月 · 月度复盘",
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
      daily: "每日",
      weekly: "每周 {target} 次",
      monthly: "每月 {target} 次",
      deleteConfirm: "确定删除“{habit}”吗？相关历史打卡也会一并移除。",
      updated: "目标版本已更新",
      added: "新习惯已添加",
      deleted: "已删除“{habit}”",
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
    },
    dialog: {
      kicker: "HABIT",
      addTitle: "新增习惯",
      editTitle: "调整 · {habit}",
      close: "取消并关闭",
      name: "习惯名称",
      namePlaceholder: "例如：阅读",
      icon: "图标",
      color: "强调色",
      colors: { sage: "鼠尾草绿", amber: "琥珀黄", coral: "珊瑚红", blue: "雾霾蓝", violet: "紫罗兰", cyan: "天空蓝" },
      target: "目标值",
      unit: "单位",
      frequency: "统计周期",
      periodTarget: "周期内目标次数",
      dailyScore: "计入当天完成度",
      dailyScoreHelp: "关闭后仍可每天打卡，但只影响每周或每月的周期达标。",
      effectiveDate: "生效日期",
      hint: "修改将从所选日期生效。",
      delete: "删除习惯",
      cancel: "取消",
      save: "保存",
    },
    toast: {
      saved: "已保存",
      habitOn: "完成一项约定",
      habitOff: "已取消打卡",
      mood: "心情已记录",
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
      summary: "{scope} · {habits} 个习惯 · {days} 天记录 · 导出于 {date}", scopeAll: "完整备份", scopePartial: "部分备份", legacy: "早期版本备份",
    },
    defaultHabits: {
      wake: "早起",
      move: "每日基础运动量",
      protein: "蛋白质摄入",
      strength: "抗阻训练",
    },
    units: { "分钟": "分钟", "克": "克", "05:00–06:00": "05:00–06:00" },
    weekdayNames: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
    dateChip: "{year}年{month}月{day}日 · {weekday}",
  },
  en: {
    locale: "en",
    title: "Life Ledger · Deep Review",
    metaDescription: "A private habit and deep-review system that grows with you.",
    brand: "Life Ledger",
    brandSmall: "DEEP REVIEW",
    nav: { today: "Today", week: "Week", review: "Review", habits: "Habits" },
    sidebarQuote: { text: "Well done is\nbetter than well said.", source: "Benjamin Franklin, Poor Richard's Almanack" },
    profileName: "Personal Ledger",
    exportTitle: "Import & export",
    pwa: { install: "Install app", ready: "Ready to install", manual: "Use your browser menu and choose Add to Home Screen or Install app.", installed: "Life Ledger installed" },
    theme: { label: "Appearance", system: "Follow system", light: "Light mode", dark: "Dark mode" },
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
      profileCloud: "D1 cloud sync",
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
      review: "Monthly Review",
      habits: "Habits",
    },
    hero: {
      quote: "The secret of getting ahead\nis getting started.",
      source: "Mark Twain",
      progress: "Completed today",
      progressText: "{done} / {total} done",
    },
    mood: {
      kicker: "MOOD",
      title: "How do you feel today?",
      values: { 低落: "Low", 平静: "Calm", 很好: "Good" },
      note: "The mind is everything. What you think you become.",
      source: "Attributed to the Buddha",
    },
    todayGoals: {
      kicker: "DAY PLAN", title: "Daily Goals", desc: "Move between days to review or plan ahead.", placeholder: "Add a goal for this day…", addLabel: "Add goal",
      empty: "No concrete goals for this day yet.<br />Start with one thing that matters.", added: "Goal added", previous: "Previous day", next: "Next day", futureStatus: "Future goals can be planned now and completed when the day arrives",
    },
    journal: { kicker: "JOURNAL & EVENTS", title: "Daily Reflection", desc: "Capture what happened, what moved, and what matters.", placeholder: "What happened today? What moved forward? What is worth remembering?", futureLocked: "Reflection opens when this day arrives.", autosaved: "● autosaved" },
    tomorrowGoals: {
      kicker: "TOMORROW'S PLAN", title: "Tomorrow's Goals", desc: "Give tomorrow a clear and gentle starting point.", placeholder: "Add something for tomorrow…", addLabel: "Add tomorrow's goal",
      empty: "Nothing planned for tomorrow yet.<br />Give it one meaningful starting point.", added: "Added to tomorrow's goals",
    },
    reminder: {
      kicker: "DAILY RHYTHM", title: "Daily review reminder", enable: "Remind me every day", enableHelp: "A quiet prompt to close the day with intention.", time: "Reminder time",
      off: "Notifications are not enabled", offHelp: "Permission will only be requested after you save.", ready: "Reminder is enabled", readyHelp: "While the app is open, it will check for your {time} reminder.",
      denied: "Notifications are blocked", deniedHelp: "Allow notifications for Life Ledger in your browser or system settings.", unsupported: "Notifications are not supported", unsupportedHelp: "You can keep using reviews, but this browser cannot send system notifications.",
      caveat: "Local preview can remind you while the app is open. Reliable reminders after the app is closed require the installed PWA and a cloud push service.", test: "Send test", cancel: "Cancel", save: "Save reminder", saved: "Reminder settings saved",
      body: "Take a few minutes to complete today's habits, mood, and reflection.", testBody: "Notifications are working. Come back tonight and review the path you made.", close: "Close daily reminder settings", short: "Reminder",
    },
    foundations: { kicker: "FOUNDATIONS", title: "Daily Foundations", adjust: "Adjust goals", periodNote: "Period target · excluded from daily score" },
    calendar: {
      kicker: "MONTH IN VIEW",
      title: "{monthName} {year}",
      desc: "Open any day to check habits or leave a short note.",
      prev: "Previous month",
      next: "Next month",
      weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      monthCompletion: "month completion",
      complete: "All done",
      partial: "Partial",
      empty: "No record",
      dayTitle: "{monthName} {day}",
      dayPercent: "{month}/{day} · {percent}%",
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
    },
    review: {
      kicker: "MONTHLY REVIEW",
      title: "{monthName} · Monthly Review",
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
      daily: "Daily",
      weekly: "{target}× / week",
      monthly: "{target}× / month",
      deleteConfirm: "Delete “{habit}”? Related historical check-ins will also be removed.",
      updated: "Goal version updated",
      added: "New habit added",
      deleted: "Deleted “{habit}”",
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
    },
    dialog: {
      kicker: "HABIT",
      addTitle: "Add habit",
      editTitle: "Adjust · {habit}",
      close: "Cancel and close",
      name: "Habit name",
      namePlaceholder: "e.g. Reading",
      icon: "Icon",
      color: "Accent color",
      colors: { sage: "Sage", amber: "Amber", coral: "Coral", blue: "Blue grey", violet: "Violet", cyan: "Sky blue" },
      target: "Target",
      unit: "Unit",
      frequency: "Frequency",
      periodTarget: "Target count per period",
      dailyScore: "Count toward daily score",
      dailyScoreHelp: "If off, it can still be checked daily but only affects weekly or monthly targets.",
      effectiveDate: "Effective date",
      hint: "Changes apply from the selected date.",
      delete: "Delete habit",
      cancel: "Cancel",
      save: "Save",
    },
    toast: {
      saved: "Saved",
      habitOn: "One promise kept",
      habitOff: "Check-in removed",
      mood: "Mood recorded",
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
      summary: "{scope} · {habits} habits · {days} recorded days · exported {date}", scopeAll: "Complete backup", scopePartial: "Partial backup", legacy: "Earlier backup format",
    },
    defaultHabits: {
      wake: "Wake early",
      move: "Daily baseline movement",
      protein: "Protein intake",
      strength: "Resistance training",
    },
    units: { "分钟": "min", "克": "g", "05:00–06:00": "05:00–06:00" },
    weekdayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    dateChip: "{monthName} {day}, {year} · {weekday}",
  },
  de: {
    locale: "de",
    title: "Life Ledger · Tiefe Reflexion",
    metaDescription: "Ein privates System für Gewohnheiten und tiefgehende Rückblicke, das mit dir wächst.",
    brand: "Life Ledger",
    brandSmall: "TIEFE REFLEXION",
    nav: { today: "Heute", week: "Woche", review: "Rückblick", habits: "Gewohnheiten" },
    sidebarQuote: { text: "Auch aus Steinen,\ndie dir in den Weg gelegt werden,\nkannst du etwas Schönes bauen.", source: "Johann Wolfgang von Goethe" },
    profileName: "Persönliches Journal",
    exportTitle: "Import & Export",
    pwa: { install: "App installieren", ready: "Installationsbereit", manual: "Wähle im Browsermenü „Zum Home-Bildschirm“ oder „App installieren“.", installed: "Life Ledger wurde installiert" },
    theme: { label: "Darstellung", system: "Systemeinstellung", light: "Heller Modus", dark: "Dunkler Modus" },
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
      profileCloud: "D1-Cloud-Sync",
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
      review: "Monatsrückblick",
      habits: "Gewohnheiten",
    },
    hero: {
      quote: "Es ist nicht genug zu wollen,\nman muss auch tun.",
      source: "Johann Wolfgang von Goethe, Wilhelm Meisters Wanderjahre",
      progress: "Heute erledigt",
      progressText: "{done} / {total} erledigt",
    },
    mood: {
      kicker: "STIMMUNG",
      title: "Wie fühlst du dich heute?",
      values: { 低落: "Schwer", 平静: "Ruhig", 很好: "Gut" },
      note: "Das Glück ist das einzige, das sich verdoppelt, wenn man es teilt.",
      source: "Albert Schweitzer",
    },
    todayGoals: {
      kicker: "TAGESPLAN", title: "Tagesziele", desc: "Wechsle zwischen Tagen, um zurückzublicken oder vorauszuplanen.", placeholder: "Ein Ziel für diesen Tag hinzufügen…", addLabel: "Ziel hinzufügen",
      empty: "Für diesen Tag gibt es noch keine konkreten Ziele.<br />Beginne mit einer wichtigen Sache.", added: "Ziel hinzugefügt", previous: "Voriger Tag", next: "Nächster Tag", futureStatus: "Zukünftige Ziele können geplant und erst am jeweiligen Tag erledigt werden",
    },
    journal: { kicker: "TAGEBUCH & EREIGNISSE", title: "Tagesreflexion", desc: "Halte fest, was geschah, was voranging und was wichtig bleibt.", placeholder: "Was ist heute passiert? Was ging voran? Was ist erinnernswert?", futureLocked: "Die Reflexion öffnet sich, sobald dieser Tag erreicht ist.", autosaved: "● automatisch gespeichert" },
    tomorrowGoals: {
      kicker: "PLAN FÜR MORGEN", title: "Ziele für morgen", desc: "Gib dem morgigen Tag einen klaren und ruhigen Anfang.", placeholder: "Ein Ziel für morgen hinzufügen…", addLabel: "Ziel für morgen hinzufügen",
      empty: "Für morgen ist noch nichts geplant.<br />Setze einen sinnvollen Anfangspunkt.", added: "Zu den Zielen für morgen hinzugefügt",
    },
    reminder: {
      kicker: "TAGESRHYTHMUS", title: "Tägliche Reflexionserinnerung", enable: "Jeden Tag erinnern", enableHelp: "Ein ruhiger Hinweis, um den Tag bewusst abzuschließen.", time: "Uhrzeit",
      off: "Mitteilungen sind nicht aktiviert", offHelp: "Die Berechtigung wird erst beim Speichern angefragt.", ready: "Erinnerung ist aktiviert", readyHelp: "Solange die App geöffnet ist, prüft sie die Erinnerung um {time}.",
      denied: "Mitteilungen sind blockiert", deniedHelp: "Erlaube Life Ledger Mitteilungen in den Browser- oder Systemeinstellungen.", unsupported: "Mitteilungen werden nicht unterstützt", unsupportedHelp: "Reflexionen funktionieren weiterhin, aber dieser Browser kann keine Systemmitteilungen senden.",
      caveat: "Die lokale Vorschau erinnert nur bei geöffneter App. Zuverlässige Erinnerungen nach dem Schließen benötigen die installierte PWA und einen Cloud-Push-Dienst.", test: "Test senden", cancel: "Abbrechen", save: "Erinnerung speichern", saved: "Erinnerung gespeichert",
      body: "Nimm dir ein paar Minuten für Gewohnheiten, Stimmung und Tagesreflexion.", testBody: "Mitteilungen funktionieren. Kehre heute Abend zurück und betrachte deinen Weg.", close: "Einstellungen für tägliche Erinnerung schließen", short: "Erinnerung",
    },
    foundations: { kicker: "BASIS", title: "Tägliche Basisziele", adjust: "Ziele anpassen", periodNote: "Periodenziel · nicht im Tagesscore" },
    calendar: {
      kicker: "MONATSANSICHT",
      title: "{monthName} {year}",
      desc: "Öffne einen Tag, um Gewohnheiten abzuhaken oder eine kurze Notiz zu ergänzen.",
      prev: "Voriger Monat",
      next: "Nächster Monat",
      weekdays: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
      monthCompletion: "Monatsfortschritt",
      complete: "Alles erledigt",
      partial: "Teilweise",
      empty: "Kein Eintrag",
      dayTitle: "{day}. {monthName}",
      dayPercent: "{day}.{month}. · {percent}%",
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
    },
    review: {
      kicker: "MONATSRÜCKBLICK",
      title: "{monthName} · Monatsrückblick",
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
      daily: "Täglich",
      weekly: "{target}× / Woche",
      monthly: "{target}× / Monat",
      deleteConfirm: "„{habit}“ löschen? Zugehörige historische Check-ins werden ebenfalls entfernt.",
      updated: "Zielversion aktualisiert",
      added: "Neue Gewohnheit hinzugefügt",
      deleted: "„{habit}“ gelöscht",
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
    },
    dialog: {
      kicker: "GEWOHNHEIT",
      addTitle: "Gewohnheit hinzufügen",
      editTitle: "Anpassen · {habit}",
      close: "Abbrechen und schließen",
      name: "Name der Gewohnheit",
      namePlaceholder: "z. B. Lesen",
      icon: "Icon",
      color: "Akzentfarbe",
      colors: { sage: "Salbeigrün", amber: "Bernstein", coral: "Koralle", blue: "Blaugrau", violet: "Violett", cyan: "Himmelblau" },
      target: "Zielwert",
      unit: "Einheit",
      frequency: "Rhythmus",
      periodTarget: "Zielanzahl je Periode",
      dailyScore: "In Tagesscore zählen",
      dailyScoreHelp: "Ausgeschaltet kann es täglich abgehakt werden, zählt aber nur für Wochen- oder Monatsziele.",
      effectiveDate: "Startdatum",
      hint: "Änderungen gelten ab dem gewählten Datum.",
      delete: "Gewohnheit löschen",
      cancel: "Abbrechen",
      save: "Speichern",
    },
    toast: {
      saved: "Gespeichert",
      habitOn: "Ein Versprechen gehalten",
      habitOff: "Check-in entfernt",
      mood: "Stimmung gespeichert",
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
      summary: "{scope} · {habits} Gewohnheiten · {days} Tage mit Einträgen · exportiert {date}", scopeAll: "Vollständige Sicherung", scopePartial: "Teilsicherung", legacy: "Früheres Sicherungsformat",
    },
    defaultHabits: {
      wake: "Früh aufstehen",
      move: "Tägliche Grundbewegung",
      protein: "Proteinzufuhr",
      strength: "Krafttraining",
    },
    units: { "分钟": "Min.", "克": "g", "05:00–06:00": "05:00–06:00" },
    weekdayNames: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
    dateChip: "{day}. {monthName} {year} · {weekday}",
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
    { id: "wake", name: "早起", icon: "↗", color: "amber", active: true, versions: [{ target: 1, unit: "05:00–06:00", frequency: "daily", periodTarget: null, countsTowardDaily: true, effectiveDate: seedEffectiveDate }] },
    { id: "move", name: "每日基础运动量", icon: "◒", color: "sage", active: true, versions: [{ target: 30, unit: "分钟", frequency: "daily", periodTarget: null, countsTowardDaily: true, effectiveDate: seedEffectiveDate }] },
    { id: "protein", name: "蛋白质摄入", icon: "◇", color: "blue", active: true, versions: [{ target: 100, unit: "克", frequency: "daily", periodTarget: null, countsTowardDaily: true, effectiveDate: seedEffectiveDate }] },
    { id: "strength", name: "抗阻训练", icon: "⌁", color: "coral", active: true, versions: [{ target: 30, unit: "分钟", frequency: "weekly", periodTarget: 3, weeklyTarget: 3, countsTowardDaily: false, effectiveDate: seedEffectiveDate }] },
  ],
  logs: {},
  reviews: {},
  dailyGoals: {},
  weeklyGoals: {},
  weeklyOutputs: {},
};

let state = loadState();
let cursor = new Date();
cursor.setHours(12, 0, 0, 0);
let selectedDate = isoDate(cursor);
let selectedPlanningDate = isoDate(cursor);
let editingHabitId = null;
let selectedReviewWeek = isoWeekKey(new Date());
let selectedWorkspaceWeek = isoWeekKey(new Date());
let selectedAnalyticsHabitIds = [];
let analyticsChartType = "line";
const cloudBaseConfigured = Boolean(window.LifeLedgerCloudBase?.deploymentConfig().configured);
const requestedMode = new URLSearchParams(location.search).get("mode");
const deploymentMode = requestedMode === "local" || requestedMode === "cloudflare"
  ? requestedMode
  : window.LIFE_LEDGER_DEPLOYMENT_MODE || "local";
const hostedCloudMode = deploymentMode === "cloudflare";
const cloudProvider = cloudBaseConfigured ? "cloudbase" : hostedCloudMode ? "cloudflare" : "local";
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
let pendingImport = null;
let persistenceRequested = false;
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
function displayHabitName(habit) { return i18n[currentLang].defaultHabits[habit.id] || habit.name; }
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
function quoteFor(slot = 0) {
  const library = dailyQuoteLibrary[currentLang] || dailyQuoteLibrary.en;
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
    button.innerHTML = `<span class="nav-icon">${icon}</span><span class="nav-label">${tr(`nav.${button.dataset.view}`)}</span>`;
    button.setAttribute("title", tr(`nav.${button.dataset.view}`));
  });
  setAria(".main-nav", languageText("主导航", "Main navigation", "Hauptnavigation"));
  setText(".sidebar-note p", "");
  const note = $(".sidebar-note p");
  const sidebarQuote = quoteFor(1);
  if (note) note.innerHTML = `${escapeHtml(sidebarQuote.text)}<small>${escapeHtml(sidebarQuote.source)}</small>`;
  setText(".profile strong", tr("profileName"));
  $("#exportButton")?.setAttribute("title", tr("exportTitle"));
  $("#exportButton")?.setAttribute("aria-label", tr("exportTitle"));
  setAria("#cloudAccountButton", tr("cloudbase.account"));
  $("#cloudAccountButton")?.setAttribute("title", tr("cloudbase.account"));
  $$('[data-install-app]').forEach(button => {
    button.setAttribute("title", deferredInstallPrompt ? tr("pwa.ready") : tr("pwa.install"));
    button.setAttribute("aria-label", tr("pwa.install"));
  });
  setText("#mobileInstallLabel", tr("pwa.install"));
  const languageSelect = $("#languageSelect");
  const languageFlag = $("#languageFlag");
  if (languageSelect) languageSelect.value = currentLang;
  if (languageFlag) languageFlag.textContent = currentLang === "zh" ? "🇨🇳" : currentLang === "de" ? "🇩🇪" : "🇬🇧";
  setAria("#languageSelect", currentLang === "zh" ? "选择界面语言" : currentLang === "de" ? "Sprache der Oberfläche wählen" : "Select interface language");
  const activeView = $(".nav-item.active")?.dataset.view || "today";
  setText("#viewTitle", tr(`viewTitles.${activeView}`));
  setText(".date-jump span:first-of-type", tr("yearSuffix"));
  setText(".date-jump span:last-of-type", tr("monthSuffix"));
  setAria("#yearSelect", languageText("选择年份", "Select year", "Jahr wählen"));
  setAria("#monthSelect", languageText("选择月份", "Select month", "Monat wählen"));
  setText("#todayButton", tr("todayButton"));
  const heroQuote = quoteFor(0);
  setText(".hero-copy h2", heroQuote.text);
  setText(".quote-source", heroQuote.source);
  setText(".progress-orbit span", tr("hero.progress"));
  setText(".mood-card .kicker", tr("mood.kicker"));
  setText(".mood-card h3", tr("mood.title"));
  setText("#moodNote", "");
  const moodNote = $("#moodNote");
  const moodQuote = quoteFor(2);
  if (moodNote) moodNote.innerHTML = `${escapeHtml(moodQuote.text)}<small>${escapeHtml(moodQuote.source)}</small>`;
  $$("#quickMood button, #drawerMood button").forEach(button => {
    const icon = $("span", button)?.textContent || moodIcons[button.dataset.mood] || "";
    button.innerHTML = `<span>${icon}</span>${moodLabel(button.dataset.mood)}`;
  });
  setText(".habits-heading .kicker", tr("foundations.kicker"));
  setText(".habits-heading h2", tr("foundations.title"));
  const settingsButton = $("[data-open-settings]");
  if (settingsButton) settingsButton.innerHTML = `${tr("foundations.adjust")} <span>→</span>`;
  setText('[data-plan="selected-day"] .kicker', tr("todayGoals.kicker"));
  setText('[data-plan="selected-day"] .daily-goals-heading h3', tr("todayGoals.title"));
  setText('[data-plan="selected-day"] .daily-goals-heading p', tr("todayGoals.desc"));
  setPlaceholder("#dailyGoalInput", tr("todayGoals.placeholder"));
  setAria(".daily-goal-form button", tr("todayGoals.addLabel"));
  setAria("#previousPlanDay", tr("todayGoals.previous"));
  setAria("#nextPlanDay", tr("todayGoals.next"));
  setText(".daily-journal-card .kicker", tr("journal.kicker"));
  setText(".daily-journal-card h3", tr("journal.title"));
  setText(".daily-journal-card .daily-goals-heading p", tr("journal.desc"));
  setText("#homeJournalSave", tr("journal.autosaved"));
  setPlaceholder("#homeDayNote", tr("journal.placeholder"));
  setText(".calendar-toolbar .kicker", tr("calendar.kicker"));
  setText(".calendar-toolbar p", tr("calendar.desc"));
  setAria("#prevMonth", tr("calendar.prev"));
  setAria("#nextMonth", tr("calendar.next"));
  const weekdayRow = $(".weekdays");
  if (weekdayRow) weekdayRow.innerHTML = i18n[currentLang].calendar.weekdays.map(day => `<span>${day}</span>`).join("");
  const legend = $(".calendar-legend");
  if (legend) legend.innerHTML = `<span><i class="legend-dot complete"></i>${tr("calendar.complete")}</span><span><i class="legend-dot partial"></i>${tr("calendar.partial")}</span><span><i class="legend-dot empty"></i>${tr("calendar.empty")}</span>`;
  setText(".weekly-heading .kicker", tr("week.kicker"));
  setText("#weeklyWorkspaceTitle", tr("week.title"));
  setAria("#previousWorkspaceWeek", tr("week.previous"));
  setAria("#nextWorkspaceWeek", tr("week.next"));
  setText(".weekly-card-heading .kicker", tr("week.checklist"));
  setText(".weekly-card-heading h3", tr("week.goalsTitle"));
  setText(".weekly-writing-heading .kicker", tr("week.outputKicker"));
  setText(".weekly-writing-heading h3", tr("week.outputTitle"));
  setText(".weekly-writing-heading .autosave", tr("week.autosave"));
  setPlaceholder("#weeklyOutputText", tr("week.outputPlaceholder"));
  const weeklyFooter = $(".weekly-writing-panel footer span:last-child");
  if (weeklyFooter) weeklyFooter.textContent = tr("week.savedToWeek");
  setText(".review-intro .kicker", tr("review.kicker"));
  setText("#generateReview", tr("review.generate"));
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
  setText(".weekly-output-archive .kicker", languageText("本月各周", "WEEKS IN THIS MONTH", "WOCHEN DIESES MONATS"));
  setText(".weekly-output-archive h3", tr("review.weeksTitle"));
  setText("#reviewWeekSelectLabel", tr("review.weekSelectLabel"));
  setText(".week-review-columns section:first-child h4", tr("review.goalsTitle"));
  setText(".week-review-columns section:last-child h4", tr("review.notesTitle"));
  setText(".settings-intro .kicker", languageText("习惯", "HABITS", "GEWOHNHEITEN"));
  setText("#addHabitButton", tr("habits.add"));
  applyDialogLanguage();
  setText("#saveState", tr("drawer.saveIdle"));
  setText("#completeDay", tr("drawer.complete"));
  setAria("#closeDrawer", tr("drawer.close"));
  setText(".drawer-content section:nth-child(1) .drawer-section-title h3", tr("drawer.goalTitle"));
  setText(".drawer-content section:nth-child(2) .drawer-section-title h3", tr("drawer.moodTitle"));
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
  const labels = $$("#habitForm .form-grid label");
  const labelMap = [tr("dialog.name"), tr("dialog.icon"), tr("dialog.color"), tr("dialog.target"), tr("dialog.unit"), tr("dialog.frequency"), tr("dialog.periodTarget")];
  labels.slice(0, 7).forEach((label, index) => {
    const control = label.querySelector("input, select");
    if (!control) return;
    label.firstChild.textContent = labelMap[index];
  });
  const effectiveDateLabel = labels[8];
  if (effectiveDateLabel?.firstChild) effectiveDateLabel.firstChild.textContent = tr("dialog.effectiveDate");
  setPlaceholder('input[name="name"]', tr("dialog.namePlaceholder"));
  const color = $('select[name="color"]');
  if (color) [...color.options].forEach(option => option.textContent = tr(`dialog.colors.${option.value}`));
  const frequency = $('select[name="frequency"]');
  if (frequency) {
    frequency.options[0].textContent = tr("habits.daily");
    frequency.options[1].textContent = currentLang === "zh" ? "每周" : currentLang === "en" ? "Weekly" : "Wöchentlich";
    frequency.options[2].textContent = currentLang === "zh" ? "每月" : currentLang === "en" ? "Monthly" : "Monatlich";
  }
  setText(".daily-score-choice strong", tr("dialog.dailyScore"));
  setText(".daily-score-choice small", tr("dialog.dailyScoreHelp"));
  setText(".form-hint", tr("dialog.hint"));
  setText("#deleteHabitButton", tr("dialog.delete"));
  setText("#habitForm .secondary-button", tr("dialog.cancel"));
  setText("#saveHabit", tr("dialog.save"));
  const habit = state?.habits?.find(h => h.id === editingHabitId);
  setText("#habitDialogTitle", habit ? tr("dialog.editTitle", { habit: displayHabitName(habit) }) : tr("dialog.addTitle"));
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return stored?.habits ? { ...cloneData(seed), ...stored, dailyGoals: stored.dailyGoals || {}, weeklyGoals: stored.weeklyGoals || {}, weeklyOutputs: stored.weeklyOutputs || {} } : { ...cloneData(seed), meta: { updatedAt: 0 } };
  } catch {
    return { ...cloneData(seed), meta: { updatedAt: 0 } };
  }
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
      if (!remote) { await pushCloudState(); return; }
      if (remote?.payload && (remote.payload.meta?.updatedAt || 0) > (state.meta?.updatedAt || 0)) {
        state = { ...cloneData(seed), ...remote.payload, dailyGoals: remote.payload.dailyGoals || {}, weeklyGoals: remote.payload.weeklyGoals || {}, weeklyOutputs: remote.payload.weeklyOutputs || {} };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        renderAll();
      }
      authExpired = false;
      setSaveMode("cloud", tr("save.cloudSaved"));
      return;
    }
    const response = await fetch(CLOUD_API, { headers: { accept: "application/json" } });
    if (isAuthFailure(response)) { markAuthExpired(); return; }
    if (response.status === 404) { await pushCloudState(); return; }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const remote = await response.json();
    if (remote?.payload && (remote.payload.meta?.updatedAt || 0) > (state.meta?.updatedAt || 0)) {
      state = { ...cloneData(seed), ...remote.payload, dailyGoals: remote.payload.dailyGoals || {}, weeklyGoals: remote.payload.weeklyGoals || {}, weeklyOutputs: remote.payload.weeklyOutputs || {} };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderAll();
    }
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
function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function parseDate(value) { const [y, m, d] = value.split("-").map(Number); return new Date(y, m - 1, d, 12); }
function monthKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }
function getLog(date) { return state.logs[date] || { completed: [], mood: "", note: "" }; }
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
  year.addEventListener("change", () => { cursor.setFullYear(+year.value); renderAll(); });
  month.addEventListener("change", () => { cursor.setMonth(+month.value); renderAll(); });
}

function renderAll() {
  applyLanguage();
  $("#yearSelect").value = cursor.getFullYear();
  $("#monthSelect").value = cursor.getMonth();
  updateTopbarContext($(".nav-item.active")?.dataset.view || "today");
  renderToday();
  renderWeeklyWorkspace();
  renderCalendar();
  renderReview();
  renderHabitSettings();
  decorateMotionSurfaces();
}

function updateTopbarContext(view) {
  $("#eyebrow").textContent = view === "today" ? formatWeekRange(isoWeekKey(cursor)) : "";
}

const motionSurfaceSelector = ".hero-card, .mood-card, .habit-card, .daily-goals-card, .calendar-card, .panel, .weekly-goals-panel, .weekly-writing-panel, .score-card, .setting-row";
const tiltSurfaceSelector = ".mood-card, .habit-card, .daily-goals-card, .score-card, .setting-row";
function motionAllowed() {
  return matchMedia("(hover: hover) and (pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function decorateMotionSurfaces() {
  if (!motionAllowed()) return;
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

function renderWeeklyWorkspace() {
  const key = selectedWorkspaceWeek;
  const currentKey = isoWeekKey(new Date());
  const goals = state.weeklyGoals[key] || [];
  const done = goals.filter(goal => goal.done).length;
  const output = state.weeklyOutputs[key] || "";
  const range = formatWeekRange(key);
  $("#weekRange").textContent = tr("week.range", { range });
  const weekOffset = weekDistance(currentKey, key);
  $("#weekRelativeLabel").textContent = weekOffset === 0 ? tr("week.relativeCurrent") : weekOffset === 1 ? tr("week.relativeNext") : weekOffset === -1 ? tr("week.relativePrevious") : weekOffset > 0 ? tr("week.relativeFuture", { n: weekOffset }) : tr("week.relativePast", { n: Math.abs(weekOffset) });
  $("#currentWorkspaceWeek").classList.toggle("away", weekOffset !== 0);
  $("#currentWorkspaceWeek").title = weekOffset === 0 ? tr("week.currentTitle") : tr("week.returnCurrent");
  $("#weeklyGoalProgress").textContent = `${done} / ${goals.length}`;
  $("#weeklyGoalList").innerHTML = goals.length ? goals.map(goal => `
    <div class="weekly-goal ${goal.done ? "done" : ""}" data-id="${goal.id}">
      <button class="weekly-goal-check" data-action="toggle" aria-label="${goal.done ? tr("toast.habitOff") : tr("toast.habitOn")}">✓</button>
      <button class="weekly-goal-text" data-action="toggle">${escapeHtml(goal.text)}</button>
      <button class="weekly-goal-delete" data-action="delete" aria-label="${tr("dialog.delete")}">×</button>
    </div>`).join("") : `<p class="weekly-goal-empty">${tr("week.emptyGoals")}</p>`;
  $("#currentWeekNumber").textContent = range;
  $("#basketYear").textContent = "";
  $("#basketWeekLabel").textContent = range;
  $("#weeklyGoalInput").placeholder = tr("week.goalPlaceholder");
  $("#weeklyOutputText").value = output;
  $("#weeklyOutputStatus").textContent = output.trim() ? tr("week.outputStatus", { count: output.trim().length }) : tr("week.outputEmpty");
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
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}


function renderToday() {
  const date = isoDate(new Date());
  const log = getLog(date);
  const habits = activeHabits(date);
  const scoredHabits = dailyHabits(date);
  const complete = log.completed.filter(id => scoredHabits.some(h => h.id === id)).length;
  const progress = scoredHabits.length ? Math.round(complete / scoredHabits.length * 100) : 0;
  $("#todayDateChip").textContent = formatDateChip(new Date());
  $("#heroProgressText").textContent = tr("hero.progressText", { done: complete, total: scoredHabits.length });
  const progressNumber = $("#progressNumber");
  const progressCount = `${complete} / ${scoredHabits.length}`;
  if (progressNumber.textContent !== progressCount) {
    progressNumber.textContent = progressCount;
    progressNumber.classList.remove("number-pop");
    void progressNumber.offsetWidth;
    progressNumber.classList.add("number-pop");
  }
  $("#progressOrbit").style.setProperty("--progress", progress);
  $("#todayHabits").innerHTML = habits.map(h => habitCard(h, date, log.completed.includes(h.id))).join("");
  $$("#todayHabits .habit-card").forEach(card => card.addEventListener("click", () => toggleHabit(date, card.dataset.id)));
  $$("#quickMood button").forEach(b => b.classList.toggle("selected", b.dataset.mood === log.mood));
  renderDailyGoals();
}

function renderDailyGoals() {
  renderDayRoll();
  renderDailyGoalList(selectedPlanningDate, "#dailyGoalList", "#dailyGoalProgress", "todayGoals.empty");
  const selected = parseDate(selectedPlanningDate);
  $("#todayPlanDate").textContent = formatDateChip(selected);
  $("#journalPlanDate").textContent = formatDateChip(selected);
  renderHomeJournal();
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
  renderDailyGoals();
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

function renderHomeJournal() {
  const future = isFutureDate(selectedPlanningDate);
  const textarea = $("#homeDayNote");
  textarea.value = getLog(selectedPlanningDate).note || "";
  textarea.disabled = future;
  $(".daily-journal-card").classList.toggle("future-locked", future);
  $("#journalAvailability").textContent = future ? tr("journal.futureLocked") : "";
}

function renderDailyGoalList(date, listSelector, progressSelector, emptyKey) {
  const goals = state.dailyGoals[date] || [];
  const future = isFutureDate(date);
  const done = goals.filter(goal => goal.done).length;
  $(progressSelector).textContent = `${done} / ${goals.length}`;
  $(listSelector).innerHTML = goals.length ? goals.map(goal => `
    <div class="weekly-goal ${goal.done ? "done" : ""} ${future ? "future-plan" : ""}" data-id="${goal.id}">
      <button class="weekly-goal-check" data-action="toggle" aria-label="${goal.done ? tr("toast.habitOff") : tr("toast.habitOn")}" ${future ? "disabled" : ""}>✓</button>
      <button class="weekly-goal-text" ${future ? "" : 'data-action="toggle"'}>${escapeHtml(goal.text)}</button>
      <button class="weekly-goal-delete" data-action="delete" aria-label="${tr("dialog.delete")}">×</button>
    </div>`).join("") : `<p class="weekly-goal-empty">${tr(emptyKey)}</p>`;
  const status = $("#dailyGoalList").parentElement.querySelector(".future-plan-status");
  if (status) status.remove();
  if (future && listSelector === "#dailyGoalList") $(listSelector).insertAdjacentHTML("afterend", `<p class="future-plan-status">${tr("todayGoals.futureStatus")}</p>`);
  $$(`${listSelector} .weekly-goal`).forEach(row => row.addEventListener("click", event => {
    const action = event.target.closest("button")?.dataset.action;
    if (!action) return;
    const list = state.dailyGoals[date] || [];
    const index = list.findIndex(goal => goal.id === row.dataset.id);
    if (index < 0) return;
    if (action === "toggle") list[index].done = !list[index].done;
    if (action === "delete") list.splice(index, 1);
    state.dailyGoals[date] = list;
    saveState();
    renderDailyGoalList(date, listSelector, progressSelector, emptyKey);
  }));
}

function habitCard(habit, date, done) {
  const v = versionFor(habit, date);
  const period = v.frequency === "weekly" ? ` · ${tr("habits.weekly", { target: periodTargetFor(v) })}` : v.frequency === "monthly" ? ` · ${tr("habits.monthly", { target: periodTargetFor(v) })}` : "";
  const target = `${v.target === 1 ? "" : v.target}${displayUnit(v.unit)}${period}`;
  const periodNote = countsTowardDaily(habit, date) ? "" : `<span class="period-note">${tr("foundations.periodNote")}</span>`;
  return `<article class="habit-card ${done ? "completed" : ""}" data-id="${habit.id}" style="${habitStyle(habit)}">
    <div class="habit-card-top"><span class="habit-icon">${renderIcon(iconKey(habit))}</span><span class="habit-check">✓</span></div>
    <h3>${escapeHtml(displayHabitName(habit))}</h3><p>${target}</p>${periodNote}
  </article>`;
}
function toggleHabit(date, id) {
  if (isFutureDate(date)) return;
  const log = { ...getLog(date), completed: [...getLog(date).completed] };
  const scored = activeHabits(date).filter(habit => countsTowardDaily(habit, date));
  const wasComplete = scored.length > 0 && scored.every(habit => log.completed.includes(habit.id));
  const i = log.completed.indexOf(id);
  if (i >= 0) log.completed.splice(i, 1); else log.completed.push(id);
  state.logs[date] = log; saveState(); renderAll();
  const isComplete = scored.length > 0 && scored.every(habit => log.completed.includes(habit.id));
  if (!wasComplete && isComplete) showCelebration();
  if ($("#dayDrawer").classList.contains("open")) renderDrawer();
  showToast(i >= 0 ? tr("toast.habitOff") : tr("toast.habitOn"));
}
function setMood(date, mood) {
  if (isFutureDate(date)) return;
  state.logs[date] = { ...getLog(date), mood }; saveState(); renderAll();
  if ($("#dayDrawer").classList.contains("open")) renderDrawer();
  showToast(tr("toast.mood"));
}

function renderCalendar() {
  const year = cursor.getFullYear(), month = cursor.getMonth();
  $("#calendarTitle").textContent = tr("calendar.title", { year, month: month + 1, monthName: monthName(month) });
  const first = new Date(year, month, 1, 12);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset, 12);
  const today = isoDate(new Date());
  const cells = [];
  const currentWeek = isoWeekKey(new Date());
  let monthProgressTotal = 0;
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const key = isoDate(d), log = getLog(key), habits = activeHabits(key), scoredHabits = dailyHabits(key);
    const completed = scoredHabits.filter(h => log.completed.includes(h.id)).length;
    const progress = scoredHabits.length ? Math.round(completed / scoredHabits.length * 100) : 0;
    if (d.getMonth() === month) monthProgressTotal += progress;
    cells.push(`<button class="calendar-day ${d.getMonth() !== month ? "outside" : ""} ${key === today ? "today" : ""} ${key > today ? "future" : ""} ${isoWeekKey(d) === currentWeek ? "current-week" : ""}" data-date="${key}">
      <span class="day-number">${d.getDate()}</span>${log.mood ? `<span class="day-mood">${moodIcons[log.mood]}</span>` : ""}
      <span class="day-status">${habits.map(h => `<i class="${log.completed.includes(h.id) ? "done" : ""}" style="${log.completed.includes(h.id) ? `background:${colors[h.color].solid}` : ""}"></i>`).join("")}</span>
      ${progress ? `<span class="day-percent">${progress}%</span>` : ""}
      <span class="day-progress" style="--day-progress:${progress}"></span>
    </button>`);
  }
  $("#calendarMonthMark").textContent = String(month + 1).padStart(2, "0");
  $("#monthCompletion").textContent = `${Math.round(monthProgressTotal / new Date(year, month + 1, 0).getDate())}%`;
  $("#monthCompletion").parentElement.lastChild.textContent = ` ${tr("calendar.monthCompletion")}`;
  $("#calendarGrid").innerHTML = cells.join("");
  $$(".calendar-day").forEach(day => day.addEventListener("click", () => {
    if (isFutureDate(day.dataset.date)) selectPlanningDate(day.dataset.date, { scroll: true });
    else openDrawer(day.dataset.date);
  }));
}

function renderReview() {
  const key = monthKey(cursor), year = cursor.getFullYear(), month = cursor.getMonth();
  $("#reviewYear").textContent = year;
  $("#reviewTitle").textContent = tr("review.title", { year, month: month + 1, monthName: monthName(month) });
  const days = new Date(year, month + 1, 0).getDate();
  const monthDates = Array.from({ length: days }, (_, i) => isoDate(new Date(year, month, i + 1, 12)));
  const todayKey = isoDate(new Date());
  const elapsedDates = monthDates.filter(date => date <= todayKey);
  const habits = activeHabits(monthDates[monthDates.length - 1]);
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
  renderWeekReview(year, month);
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
function renderWeekReview(year, month) {
  const weeks = new Set();
  for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day++) weeks.add(isoWeekKey(new Date(year, month, day, 12)));
  const keys = [...weeks];
  if (!keys.includes(selectedReviewWeek)) selectedReviewWeek = keys.includes(isoWeekKey(new Date())) ? isoWeekKey(new Date()) : keys[0];
  $("#reviewWeekSelect").innerHTML = keys.map(key => {
    const goals = state.weeklyGoals[key] || [];
    const output = (state.weeklyOutputs[key] || "").trim();
    const done = goals.filter(goal => goal.done).length;
    const meta = goals.length
      ? languageText(`${done}/${goals.length} 项`, `${done}/${goals.length} goals`, `${done}/${goals.length} Ziele`)
      : languageText("无目标", "No goals", "Keine Ziele");
    return `<option value="${key}" ${key === selectedReviewWeek ? "selected" : ""}>${formatWeekRangeInMonth(key, year, month)} · ${meta}${output ? " · ✓" : ""}</option>`;
  }).join("");
  const goals = state.weeklyGoals[selectedReviewWeek] || [];
  const output = state.weeklyOutputs[selectedReviewWeek] || "";
  $("#reviewWeekLabel").textContent = formatWeekRangeInMonth(selectedReviewWeek, year, month);
  $("#reviewWeekRange").textContent = "";
  $("#reviewWeekGoals").innerHTML = goals.length ? goals.map(goal => `<div class="review-goal-item ${goal.done ? "done" : ""}"><i>${goal.done ? "✓" : ""}</i><span>${escapeHtml(goal.text)}</span></div>`).join("") : `<p class="weekly-goal-empty">${tr("review.noWeekGoals")}</p>`;
  $("#reviewWeekOutput").textContent = output.trim() || tr("review.noWeekOutput");
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

function formatWeekRangeInMonth(key, year, month) {
  const { monday, sunday } = weekDatesFromKey(key);
  const monthStart = new Date(year, month, 1, 12);
  const monthEnd = new Date(year, month + 1, 0, 12);
  return formatCompactDateSpan(monday < monthStart ? monthStart : monday, sunday > monthEnd ? monthEnd : sunday);
}

function renderHabitSettings() {
  const activeCount = state.habits.filter(habit => habit.active).length;
  $("#habitSummary").textContent = tr("habits.summary", { count: activeCount });
  $("#habitSettingsList").innerHTML = state.habits.map(h => {
    const v = versionFor(h, isoDate(new Date())) || h.versions[h.versions.length - 1];
    return `<article class="setting-row" style="${habitStyle(h)}">
      <span class="habit-icon">${renderIcon(iconKey(h))}</span>
      <div class="setting-main"><strong>${escapeHtml(displayHabitName(h))}</strong><span>${v.target === 1 ? "" : `${v.target}${displayUnit(v.unit)} · `}${frequencyLabel(v)}</span></div>
      <button class="icon-button edit-habit" data-id="${h.id}" aria-label="${tr("habits.editLabel", { habit: displayHabitName(h) })}">···</button>
    </article>`;
  }).join("");
  $$(".edit-habit").forEach(b => b.addEventListener("click", () => openHabitDialog(b.dataset.id)));
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
}
function renderDrawer() {
  const d = parseDate(selectedDate), log = getLog(selectedDate), habits = activeHabits(selectedDate), scoredHabits = dailyHabits(selectedDate), future = isFutureDate(selectedDate);
  $("#drawerWeekday").textContent = weekdayName(d.getDay()).toUpperCase();
  $("#drawerDate").textContent = tr("calendar.dayTitle", { month: d.getMonth() + 1, monthName: monthName(d.getMonth()), day: d.getDate() });
  $("#drawerProgress").textContent = `${log.completed.filter(id => scoredHabits.some(h => h.id === id)).length} / ${scoredHabits.length}`;
  const drawerTitles = $$("#dayDrawer .drawer-section-title h3");
  if (drawerTitles[0]) drawerTitles[0].textContent = tr("drawer.goalTitle");
  if (drawerTitles[1]) drawerTitles[1].textContent = tr("drawer.moodTitle");
  if (drawerTitles[2]) drawerTitles[2].textContent = tr("drawer.noteTitle");
  setText("label.drawer-section-title span", tr("drawer.markdown"));
  const futureNotice = $("#drawerFutureNotice");
  futureNotice.hidden = !future;
  futureNotice.textContent = future ? tr("drawer.futureLocked") : "";
  $("#drawerHabits").innerHTML = habits.map(h => {
    const done = log.completed.includes(h.id), v = versionFor(h, selectedDate);
    const note = countsTowardDaily(h, selectedDate) ? "" : `<small class="period-note">${v.frequency === "monthly" ? tr("drawer.periodMonthly") : tr("drawer.periodWeekly")}</small>`;
    const target = `${v.target === 1 ? "" : v.target}${displayUnit(v.unit)} · ${frequencyLabel(v)}`;
    return `<details class="drawer-habit ${done ? "done" : ""}" data-id="${h.id}" style="${habitStyle(h)}">
      <summary><span><span class="habit-icon">${renderIcon(iconKey(h))}</span><strong>${escapeHtml(displayHabitName(h))}</strong></span><span class="habit-check">${done ? "✓" : "⌄"}</span></summary>
      <div class="drawer-habit-details"><p>${escapeHtml(target)}</p>${note}<button class="drawer-habit-toggle" type="button" ${future ? "disabled" : ""}>${done ? tr("drawer.undoComplete") : tr("drawer.markComplete")}</button></div>
    </details>`;
  }).join("");
  $$(".drawer-habit-toggle").forEach(button => button.addEventListener("click", () => toggleHabit(selectedDate, button.closest(".drawer-habit").dataset.id)));
  $$("#drawerMood button").forEach(button => {
    button.classList.toggle("selected", button.dataset.mood === log.mood);
    button.disabled = future;
  });
  $("#dayNote").value = log.note || "";
  $("#dayNote").disabled = future;
  $("#completeDay").disabled = future;
}

function openHabitDialog(id = null) {
  editingHabitId = id;
  const form = $("#habitForm"), habit = state.habits.find(h => h.id === id);
  const v = habit ? versionFor(habit, isoDate(new Date())) || habit.versions[habit.versions.length - 1] : null;
  $("#habitDialogTitle").textContent = habit ? tr("dialog.editTitle", { habit: displayHabitName(habit) }) : tr("dialog.addTitle");
  form.elements.name.value = habit?.name || "";
  form.elements.icon.value = habit ? iconKey(habit) : "target";
  form.elements.color.value = habit?.color || "sage";
  form.elements.target.value = v?.target || 30;
  form.elements.unit.value = v?.unit || "分钟";
  form.elements.frequency.value = v?.frequency || "daily";
  form.elements.periodTarget.value = v ? periodTargetFor(v) : 3;
  form.elements.countsTowardDaily.checked = v ? countsTowardDaily(habit, isoDate(new Date())) : true;
  form.elements.effectiveDate.value = isoDate(new Date());
  $("#deleteHabitButton").hidden = !habit;
  applyDialogLanguage();
  renderIconPicker();
  updateHabitFormRules();
  $("#habitDialog").showModal();
}
function closeHabitDialog() {
  $("#habitDialog").close();
  $("#habitForm").reset();
  editingHabitId = null;
}
function updateHabitFormRules() {
  const form = $("#habitForm");
  const frequency = form.elements.frequency.value;
  const periodField = $("#periodTargetField");
  periodField.style.display = frequency === "daily" ? "none" : "";
  form.elements.periodTarget.required = frequency !== "daily";
  form.elements.periodTarget.max = frequency === "weekly" ? 7 : 31;
}
function saveHabitFromForm(event) {
  event.preventDefault();
  const isEditing = Boolean(editingHabitId);
  const form = new FormData(event.currentTarget);
  const version = {
    target: +form.get("target"), unit: form.get("unit"), frequency: form.get("frequency"),
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
function deleteHabit() {
  const habit = state.habits.find(h => h.id === editingHabitId);
  if (!habit || !window.confirm(tr("habits.deleteConfirm", { habit: displayHabitName(habit) }))) return;
  state.habits = state.habits.filter(h => h.id !== habit.id);
  Object.values(state.logs).forEach(log => {
    if (Array.isArray(log.completed)) log.completed = log.completed.filter(id => id !== habit.id);
  });
  saveState();
  closeHabitDialog();
  renderAll();
  showToast(tr("habits.deleted", { habit: displayHabitName(habit) }));
}

function generateReview() {
  const month = cursor.getMonth();
  const text = languageText(
    `## 这个月最重要的变化\n\n\n## 值得延续的事\n\n\n## 消耗我、需要停止的事\n\n\n## 下个月最重要的一步\n`,
    `## What changed most this month?\n\n\n## What deserves to continue?\n\n\n## What drained me or should stop?\n\n\n## The one step that matters next month\n`,
    `## Was hat sich diesen Monat am stärksten verändert?\n\n\n## Was soll bleiben?\n\n\n## Was hat Kraft gekostet oder sollte enden?\n\n\n## Der wichtigste Schritt im nächsten Monat\n`
  );
  $("#reviewText").value = text;
  state.reviews[monthKey(cursor)] = text; saveState(); showToast(tr("review.generated"));
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
  const result = { habits: cloneData(state.habits), logs: {}, reviews: {}, dailyGoals: {}, weeklyGoals: {}, weeklyOutputs: {}, exportMeta: { ...range, exportedAt: new Date().toISOString() } };
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
  return result;
}
function updateExportFields() {
  const scope = $('#exportForm input[name="exportScope"]:checked')?.value || "all";
  $("#exportMonth").hidden = scope !== "month";
  $("#exportDate").hidden = !["week", "day"].includes(scope);
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
function downloadExport(event) {
  event.preventDefault();
  const scope = $('#exportForm input[name="exportScope"]:checked').value;
  const backup = createBackup(scope);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  triggerFileDownload(blob, `life-ledger-backup-${scope}-${backup.range.start || "all"}-${isoDate(new Date())}.json`);
  showToast(tr("toast.exported"));
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
  for (const key of ["reviews", "dailyGoals", "weeklyGoals", "weeklyOutputs"]) {
    if (payload[key] !== undefined && !isRecord(payload[key])) throw new Error(`invalid-${key}`);
  }
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
      weeklyOutputs: cloneData(payload.weeklyOutputs || {}),
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
  $("#importFile").value = "";
  $("#importPreview").hidden = true;
  $("#importError").hidden = true;
  $("#chooseImportFile").hidden = false;
}
async function previewImportFile(file) {
  clearImportSelection();
  if (!file) return;
  if (file.size > MAX_IMPORT_BYTES) {
    $("#importError").textContent = tr("backup.tooLarge");
    $("#importError").hidden = false;
    return;
  }
  try {
    const candidate = importedPayload(JSON.parse(await file.text()));
    pendingImport = candidate;
    $("#importFileName").textContent = file.name;
    $("#importSummary").textContent = importStats(candidate);
    $("#chooseImportFile").hidden = true;
    $("#importPreview").hidden = false;
  } catch (error) {
    console.warn("Backup validation failed", error);
    $("#importError").textContent = tr("backup.invalid");
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
  return {
    ...cloneData(current),
    habits: [...habits.values()],
    logs: { ...(current.logs || {}), ...(incoming.logs || {}) },
    reviews: { ...(current.reviews || {}), ...(incoming.reviews || {}) },
    dailyGoals: { ...(current.dailyGoals || {}), ...(incoming.dailyGoals || {}) },
    weeklyGoals: { ...(current.weeklyGoals || {}), ...(incoming.weeklyGoals || {}) },
    weeklyOutputs: { ...(current.weeklyOutputs || {}), ...(incoming.weeklyOutputs || {}) },
  };
}
function restorePendingImport() {
  if (!pendingImport) return;
  const isComplete = pendingImport.scope === "all";
  const warning = `${tr(isComplete ? "backup.confirmFull" : "backup.confirmPartial")}${cloudMode ? `\n\n${tr("backup.cloudWarning")}` : ""}`;
  if (!window.confirm(warning)) return;
  localStorage.setItem(RESTORE_SAFETY_KEY, JSON.stringify({ savedAt: Date.now(), state: cloneData(state) }));
  state = isComplete ? cloneData(pendingImport.data) : mergeBackupData(state, pendingImport.data);
  saveState();
  selectedAnalyticsHabitIds = [];
  clearImportSelection();
  $("#undoRestore").hidden = false;
  $("#exportDialog").close();
  renderAll();
  showToast(tr("toast.restored"));
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

function bindDailyGoalForm(formSelector, inputSelector, dateProvider, toastKey) {
  $(formSelector).addEventListener("submit", event => {
    event.preventDefault();
    const input = $(inputSelector);
    const text = input.value.trim();
    if (!text) return;
    const date = dateProvider();
    state.dailyGoals[date] = [...(state.dailyGoals[date] || []), { id: createId(), text, done: false }];
    input.value = "";
    saveState();
    renderDailyGoals();
    showToast(tr(toastKey));
  });
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
  $("#reminderButton")?.classList.toggle("ready", reminderSettings.enabled && status === "granted");
}

function applyReminderLanguage() {
  setText("#reminderQuickLabel", tr("reminder.short"));
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
  setAria("#reminderButton", tr("reminder.title"));
  $("#reminderButton")?.setAttribute("title", tr("reminder.title"));
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

function bindEvents() {
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
    renderAll();
    if ($("#dayDrawer").classList.contains("open")) renderDrawer();
    window.setTimeout(() => document.body.classList.remove("language-changing"), 260);
  });
  $$(".nav-item").forEach(button => button.addEventListener("click", () => {
    $$(".nav-item").forEach(b => b.classList.toggle("active", b === button));
    $$(".view").forEach(v => v.classList.remove("active"));
    $(`#${button.dataset.view}View`).classList.add("active");
    $("#viewTitle").textContent = tr(`viewTitles.${button.dataset.view}`);
    updateTopbarContext(button.dataset.view);
    if (button.dataset.view === "week") renderWeeklyWorkspace();
    if (button.dataset.view === "review") renderReview();
  }));
  $("#prevMonth").addEventListener("click", () => { cursor.setMonth(cursor.getMonth() - 1); renderAll(); });
  $("#nextMonth").addEventListener("click", () => { cursor.setMonth(cursor.getMonth() + 1); renderAll(); });
  $("#todayButton").addEventListener("click", () => { cursor = new Date(); renderAll(); });
  $$("#quickMood button").forEach(b => b.addEventListener("click", () => setMood(isoDate(new Date()), b.dataset.mood)));
  $$("#drawerMood button").forEach(b => b.addEventListener("click", () => setMood(selectedDate, b.dataset.mood)));
  bindDailyGoalForm("#dailyGoalForm", "#dailyGoalInput", () => selectedPlanningDate, "todayGoals.added");
  $("#previousPlanDay").addEventListener("click", () => shiftPlanningDay(-1));
  $("#nextPlanDay").addEventListener("click", () => shiftPlanningDay(1));
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
  $("#iconPickerTrigger").addEventListener("click", () => {
    const popover = $("#iconPickerPopover");
    popover.hidden = !popover.hidden;
    $("#iconPickerTrigger").setAttribute("aria-expanded", String(!popover.hidden));
  });
  $("#habitForm").addEventListener("submit", saveHabitFromForm);
  $$("[data-analytics-chart]").forEach(button => button.addEventListener("click", () => {
    analyticsChartType = button.dataset.analyticsChart;
    $$("[data-analytics-chart]").forEach(item => item.classList.toggle("active", item === button));
    renderReview();
  }));
  $("#reviewWeekSelect").addEventListener("change", event => {
    selectedReviewWeek = event.target.value;
    renderReview();
  });
  $("#addPeriodTarget").addEventListener("click", () => openHabitDialog());
  $("#generateReview").addEventListener("click", generateReview);
  $("#reviewText").addEventListener("input", e => { state.reviews[monthKey(cursor)] = e.target.value; saveState(); });
  $("#weeklyGoalForm").addEventListener("submit", event => {
    event.preventDefault();
    const input = $("#weeklyGoalInput"), text = input.value.trim();
    if (!text) return;
    const key = selectedWorkspaceWeek;
    state.weeklyGoals[key] = [...(state.weeklyGoals[key] || []), { id: createId(), text, done: false }];
    input.value = ""; saveState(); renderWeeklyWorkspace(); showToast(tr("week.added"));
  });
  $("#weeklyOutputText").addEventListener("input", event => {
    const key = selectedWorkspaceWeek;
    state.weeklyOutputs[key] = event.target.value; saveState();
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
  $("#reminderButton").addEventListener("click", openReminderDialog);
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
  $("#chooseImportFile").addEventListener("click", () => $("#importFile").click());
  $("#clearImportFile").addEventListener("click", () => {
    clearImportSelection();
    $("#importFile").click();
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
  document.addEventListener("visibilitychange", () => { if (!document.hidden) maybeSendDailyReminder(); });
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
  window.addEventListener("resize", syncExportButtonPlacement, { passive: true });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });
}

syncExportButtonPlacement(); initSelects(); bindEvents(); bindPointerMotion(); renderAll(); armReminderClock();
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
}
initializeCloudSync();
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" })
      .then(registration => registration.update())
      .catch(error => console.warn("Service worker registration failed", error));
  });
}
