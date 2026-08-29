const STORAGE_KEY = "life-ledger-v1";
const LANGUAGE_KEY = "life-ledger-language";
const LANGUAGE_PREFERENCE_KEY = "life-ledger-language-preference-set";
const THEME_KEY = "life-ledger-theme";
const SIDEBAR_KEY = "life-ledger-sidebar-collapsed";
const REMINDER_KEY = "life-ledger-reminder";
const RESTORE_SAFETY_KEY = "life-ledger-restore-safety-v1";
const FOCUS_ACTIVE_KEY = "life-ledger-focus-active";
const BACKUP_FORMAT = "life-ledger-backup";
const BACKUP_SCHEMA_VERSION = 2;
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
    nav: { today: "今日", week: "本周", review: "复盘", habits: "习惯设置" },
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
    moodReason: { kicker: "心情札记", title: "为什么今天感觉{mood}？", help: "这完全是可选的。留下一句话，未来回看时会更容易理解这一天。", label: "今天为什么会有这样的感受？", placeholder: "例如：完成了一件拖了很久的事情……", skip: "暂不记录", save: "保存原因", close: "关闭心情原因", summary: "原因 · {reason}" },
    todayGoals: {
      kicker: "DAY PLAN", title: "今日计划", desc: "固定时间与灵活目标，一天之内各有位置。", placeholder: "为这一天添加一个灵活目标…", addLabel: "添加目标",
      empty: "这一天还没有具体目标。<br />先写下一件最重要的事。", added: "目标已添加", previous: "前一天", next: "后一天", futureStatus: "未来目标只能规划，到了当天才能勾选完成",
    },
    dayPlan: {
      schedule: "日程安排", flexible: "灵活目标", open: "展开一天", close: "关闭完整日程", events: "{count} 项", noEvents: "这一天没有临时日程。", routinesHidden: "{count} 项固定日程已收起", routinesShown: "收起固定日程", routine: "固定", allDay: "全天", preview: "日历连接后的展示预览",
    },
    calendarSync: {
      kicker: "日历连接", title: "Google 日历", trigger: "连接日历", connectedTrigger: "日历已连接", intro: "只读连接。Life Ledger 仅保留复盘所需的日程标题与时间。",
      connectTitle: "让真实日程自然进入每一天。", connectHelp: "选择你想读取的日历。Life Ledger 永远不会修改或删除 Google 日历事件。", connect: "连接 Google 日历", connecting: "正在前往 Google…",
      connected: "已连接 {count} 个 Google 账号", lastSync: "上次更新：{time}", neverSynced: "尚未读取日程", refresh: "刷新", refreshing: "正在读取日程…", choose: "选择要纳入的日历", addAccount: "＋ 添加另一个 Google 账号", accountCalendars: "此账号的日历", accountLimit: "最多连接两个 Google 账号", disconnectAccount: "断开此账号", accountNeedsReconnect: "此账号需要重新连接",
      hideRecurring: "默认收起重复日程", hideRecurringHelp: "固定日程仍会被记录，但不会占满每日计划。", save: "保存选择", saving: "正在保存…", close: "关闭", disconnect: "断开连接", disconnectConfirm: "断开后将删除 Life Ledger 中缓存的日历内容。Google 日历本身不会受到影响。",
      saved: "日历选择已保存", disconnected: "Google 日历已断开", stale: "暂时无法连接 Google，正在显示最近一次日程。", error: "日历暂时无法读取，请稍后重试。", authExpired: "Google 授权已失效，请重新连接。", noCalendars: "没有找到可读取的日历。", calendarEvents: "日程",
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
      body: "花几分钟完成今天的打卡、心情与复盘。", testBody: "通知工作正常。今晚也记得回来看看自己的脚步。", close: "关闭每日提醒设置", short: "提醒", cardOn: "已开启 · {time}", cardOff: "尚未开启",
    },
    focus: {
      kicker: "专注", overviewTitle: "专注时间", overviewHint: "只选一件事，把注意力完整地交给它。", open: "开始专注", openActive: "查看计时", settings: "设置", presetSummary: "{focus} 分钟专注 · {break} 分钟休息", readyShort: "准备开始",
      todayMinutes: "今日分钟", sessions: "次专注", weekMinutes: "本周分钟", weekChart: "本周专注时间", dialogKicker: "专注计时", dialogTitle: "把这一段时间，用在重要的事上。",
      phaseFocus: "专注", phaseBreak: "休息", ready: "准备好就开始", chooseGoal: "选择一个每日目标", goalLabel: "专注于", customLabel: "默认专注主题", customPlaceholder: "例如：数据分析、写作…",
      custom: "自定义", focusMinutes: "专注分钟", breakMinutes: "休息分钟", sound: "声音", notify: "通知", wakeLock: "保持屏幕常亮", start: "开始专注", pause: "暂停", resume: "继续", startBreak: "开始休息", finish: "提前完成", interrupt: "结束本次", skipBreak: "跳过休息", close: "关闭专注计时",
      caveat: "切换到后台后计时仍会按真实时间校准；专注时长会进入你的复盘。", goalAction: "专注此目标", untitled: "自由专注", completed: "专注完成", interrupted: "已记录本次专注", breakReady: "专注完成，休息一下吧。", breakDone: "休息结束，可以重新出发了。", notificationBody: "{label} · 已完成 {minutes} 分钟", confirmEnd: "现在结束这次专注吗？已投入的时间仍会记录。", todaySummary: "今日专注 {minutes} 分钟", reviewKicker: "专注复盘", reviewTitle: "专注时长", reviewScope: "选择专注复盘周期", scopeWeek: "周", scopeMonth: "月", reviewWeek: "选择一周", reviewMonth: "选择月份", reviewUnit: "分钟", reviewChart: "每日专注分钟", noFocus: "这个周期还没有专注记录。", moreThanPrevious: "比前一周多 {minutes} 分钟", lessThanPrevious: "比前一周少 {minutes} 分钟", sameAsPrevious: "与前一周相同", moreThanPreviousMonth: "比上个月多 {minutes} 分钟", lessThanPreviousMonth: "比上个月少 {minutes} 分钟", sameAsPreviousMonth: "与上个月相同", monthTotal: "{month} · 共 {minutes} 分钟", monthActivity: "{days} 天有专注记录 · 日均 {average} 分钟",
    },
    foundations: { kicker: "FOUNDATIONS", title: "今日基础目标", adjust: "调整目标", periodNote: "周期目标 · 不计入今日完成度", carousel: "今日习惯分组", previousPage: "上一组习惯", nextPage: "下一组习惯", page: "第 {page} 组，共 {total} 组" },
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
    longTerm: {
      tabWeek: "本周目标", tabLong: "长期目标", kicker: "HORIZON", title: "长期目标", description: "保留方向，不必强塞进这一周。", activeCount: "{count} 个活跃", empty: "还没有长期目标。<br />写下一个值得持续推进的方向。", add: "添加长期目标", dialogKicker: "长期目标", addTitle: "添加一个方向", editTitle: "编辑长期目标", name: "目标", next: "下一步", review: "回顾日期", status: "状态", active: "活跃", paused: "暂停", completed: "完成", noNext: "还没有写下一步", noReview: "暂未设置回顾日期", reviewOn: "{date} 回顾", delete: "删除", cancel: "取消", save: "保存", added: "长期目标已添加", updated: "长期目标已更新", removed: "长期目标已删除",
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
    },
    reviewCanvas: {
      kicker: "DEEP REVIEW", title: "复盘画布", openWeekly: "生成本周复盘", openMonthly: "生成月度复盘", periodAria: "选择复盘周期", weekly: "周度", monthly: "月度", week: "周", month: "月", generate: "重新生成草稿", evidenceKicker: "RECORD", evidenceTitle: "记录告诉我的事实", draftKicker: "REFLECTION", draftTitle: "可编辑复盘", placeholder: "基于现有记录生成事实草稿，再写下你的理解。", autosaved: "● 已自动保存", copy: "复制 Markdown", done: "完成", close: "关闭复盘画布", copied: "复盘已复制", generated: "复盘草稿已生成", replaceConfirm: "重新生成会替换当前草稿，继续吗？", statDays: "有记录的天数", statHabits: "习惯完成", statFocus: "专注分钟", statGoals: "目标完成", noEvidence: "这个周期还没有文字记录。",
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
    moodReason: { kicker: "MOOD NOTE", title: "What made today feel {mood}?", help: "This is completely optional. One sentence can make this day easier to understand when you look back.", label: "What shaped this feeling today?", placeholder: "For example: I finally finished something I had postponed…", skip: "Not now", save: "Save reason", close: "Close mood reason", summary: "Reason · {reason}" },
    todayGoals: {
      kicker: "DAY PLAN", title: "Day Plan", desc: "Fixed commitments and flexible goals, held in one calm view.", placeholder: "Add a flexible goal for this day…", addLabel: "Add goal",
      empty: "No concrete goals for this day yet.<br />Start with one thing that matters.", added: "Goal added", previous: "Previous day", next: "Next day", futureStatus: "Future goals can be planned now and completed when the day arrives",
    },
    dayPlan: {
      schedule: "Schedule", flexible: "Flexible goals", open: "Open day", close: "Close full day", events: "{count} events", noEvents: "No one-off events for this day.", routinesHidden: "{count} routines hidden", routinesShown: "Hide routines", routine: "Routine", allDay: "All day", preview: "Preview of the connected calendar experience",
    },
    calendarSync: {
      kicker: "CALENDAR CONNECTION", title: "Google Calendar", trigger: "Connect calendar", connectedTrigger: "Calendar connected", intro: "Read-only access. Life Ledger only keeps the event title and time needed for your review.",
      connectTitle: "Bring your real schedule into each day.", connectHelp: "Choose the calendars you want to read. Life Ledger never edits or deletes Google Calendar events.", connect: "Connect Google Calendar", connecting: "Opening Google…",
      connected: "{count} Google accounts connected", lastSync: "Last updated: {time}", neverSynced: "No events loaded yet", refresh: "Refresh", refreshing: "Reading events…", choose: "Calendars to include", addAccount: "＋ Add another Google account", accountCalendars: "Calendars from this account", accountLimit: "You can connect up to two Google accounts", disconnectAccount: "Disconnect this account", accountNeedsReconnect: "This account needs to reconnect",
      hideRecurring: "Collapse recurring routines", hideRecurringHelp: "Routine events remain available without taking over the day.", save: "Save selection", saving: "Saving…", close: "Close", disconnect: "Disconnect", disconnectConfirm: "Disconnecting removes cached calendar details from Life Ledger. Your Google Calendar will not be changed.",
      saved: "Calendar selection saved", disconnected: "Google Calendar disconnected", stale: "Google is unavailable, so the latest cached schedule is shown.", error: "Calendar could not be read. Please try again.", authExpired: "Google access expired. Please reconnect.", noCalendars: "No readable calendars were found.", calendarEvents: "Calendar events",
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
      body: "Take a few minutes to complete today's habits, mood, and reflection.", testBody: "Notifications are working. Come back tonight and review the path you made.", close: "Close daily reminder settings", short: "Reminder", cardOn: "On · {time}", cardOff: "Not enabled",
    },
    focus: {
      kicker: "FOCUS", overviewTitle: "Focus Time", overviewHint: "Choose one thing. Give it your full attention.", open: "Start focus", openActive: "View timer", settings: "Settings", presetSummary: "{focus} min focus · {break} min break", readyShort: "Ready",
      todayMinutes: "min today", sessions: "sessions", weekMinutes: "min this week", weekChart: "Focus time this week", dialogKicker: "FOCUS TIMER", dialogTitle: "Make this time count.",
      phaseFocus: "Focus", phaseBreak: "Break", ready: "Ready when you are", chooseGoal: "Choose a daily goal", goalLabel: "Focus on", customLabel: "Default focus topic", customPlaceholder: "e.g. Data analysis, writing…",
      custom: "Custom", focusMinutes: "Focus minutes", breakMinutes: "Break minutes", sound: "Sound", notify: "Notification", wakeLock: "Keep screen awake", start: "Start focus", pause: "Pause", resume: "Resume", startBreak: "Start break", finish: "Finish now", interrupt: "End session", skipBreak: "Skip break", close: "Close focus timer",
      caveat: "The timer stays accurate in the background. Focused minutes become part of your review.", goalAction: "Focus on this goal", untitled: "Open focus", completed: "Focus complete", interrupted: "Focus time recorded", breakReady: "Focus complete. Take a quiet break.", breakDone: "Break complete. You are ready again.", notificationBody: "{label} · {minutes} focused minutes", confirmEnd: "End this focus now? The time you invested will still be recorded.", todaySummary: "{minutes} min focused today", reviewKicker: "FOCUS REVIEW", reviewTitle: "Focused time", reviewScope: "Choose focus review period", scopeWeek: "Week", scopeMonth: "Month", reviewWeek: "Choose week", reviewMonth: "Choose month", reviewUnit: "min", reviewChart: "Focused minutes by day", noFocus: "No focused time recorded in this period.", moreThanPrevious: "{minutes} min more than the previous week", lessThanPrevious: "{minutes} min less than the previous week", sameAsPrevious: "Same as the previous week", moreThanPreviousMonth: "{minutes} min more than last month", lessThanPreviousMonth: "{minutes} min less than last month", sameAsPreviousMonth: "Same as last month", monthTotal: "{month} · {minutes} min total", monthActivity: "{days} focused days · {average} min daily average",
    },
    foundations: { kicker: "FOUNDATIONS", title: "Daily Foundations", adjust: "Adjust goals", periodNote: "Period target · excluded from daily score", carousel: "Today's habit groups", previousPage: "Previous habit group", nextPage: "Next habit group", page: "Group {page} of {total}" },
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
    },
    reviewCanvas: {
      kicker: "DEEP REVIEW", title: "Review Canvas", openWeekly: "Generate weekly review", openMonthly: "Generate monthly review", periodAria: "Choose review period", weekly: "Weekly", monthly: "Monthly", week: "Week", month: "Month", generate: "Regenerate draft", evidenceKicker: "RECORD", evidenceTitle: "What the record says", draftKicker: "REFLECTION", draftTitle: "Editable review", placeholder: "Generate a factual draft from your records, then add your perspective.", autosaved: "● autosaved", copy: "Copy Markdown", done: "Done", close: "Close review canvas", copied: "Review copied", generated: "Review draft generated", replaceConfirm: "Regenerating will replace the current draft. Continue?", statDays: "Recorded days", statHabits: "Habit check-ins", statFocus: "Focus minutes", statGoals: "Goals completed", noEvidence: "There are no written records for this period yet.",
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
    moodReason: { kicker: "STIMMUNGSNOTIZ", title: "Warum fühlte sich heute {mood} an?", help: "Das ist völlig freiwillig. Ein Satz kann helfen, diesen Tag später besser zu verstehen.", label: "Was hat dieses Gefühl heute geprägt?", placeholder: "Zum Beispiel: Ich habe endlich etwas lange Aufgeschobenes beendet…", skip: "Nicht jetzt", save: "Grund speichern", close: "Stimmungsgrund schließen", summary: "Grund · {reason}" },
    todayGoals: {
      kicker: "TAGESPLAN", title: "Tagesplan", desc: "Feste Termine und flexible Ziele in einer ruhigen Übersicht.", placeholder: "Ein flexibles Ziel für diesen Tag hinzufügen…", addLabel: "Ziel hinzufügen",
      empty: "Für diesen Tag gibt es noch keine konkreten Ziele.<br />Beginne mit einer wichtigen Sache.", added: "Ziel hinzugefügt", previous: "Voriger Tag", next: "Nächster Tag", futureStatus: "Zukünftige Ziele können geplant und erst am jeweiligen Tag erledigt werden",
    },
    dayPlan: {
      schedule: "Termine", flexible: "Flexible Ziele", open: "Tag öffnen", close: "Tagesansicht schließen", events: "{count} Termine", noEvents: "Keine einmaligen Termine an diesem Tag.", routinesHidden: "{count} Routinen ausgeblendet", routinesShown: "Routinen ausblenden", routine: "Routine", allDay: "Ganztägig", preview: "Vorschau der verbundenen Kalenderansicht",
    },
    calendarSync: {
      kicker: "KALENDERVERBINDUNG", title: "Google Kalender", trigger: "Kalender verbinden", connectedTrigger: "Kalender verbunden", intro: "Nur Lesezugriff. Life Ledger speichert nur Titel und Zeit, die für deine Rückschau nötig sind.",
      connectTitle: "Bringe deinen echten Tagesplan in jeden Tag.", connectHelp: "Wähle die Kalender, die du lesen möchtest. Life Ledger ändert oder löscht niemals Google-Kalendertermine.", connect: "Google Kalender verbinden", connecting: "Google wird geöffnet…",
      connected: "{count} Google-Konten verbunden", lastSync: "Zuletzt aktualisiert: {time}", neverSynced: "Noch keine Termine geladen", refresh: "Aktualisieren", refreshing: "Termine werden gelesen…", choose: "Einbezogene Kalender", addAccount: "＋ Weiteres Google-Konto hinzufügen", accountCalendars: "Kalender dieses Kontos", accountLimit: "Du kannst bis zu zwei Google-Konten verbinden", disconnectAccount: "Dieses Konto trennen", accountNeedsReconnect: "Dieses Konto muss erneut verbunden werden",
      hideRecurring: "Wiederkehrende Routinen einklappen", hideRecurringHelp: "Routinen bleiben verfügbar, ohne den Tagesplan zu überladen.", save: "Auswahl speichern", saving: "Wird gespeichert…", close: "Schließen", disconnect: "Trennen", disconnectConfirm: "Beim Trennen werden zwischengespeicherte Kalenderdaten aus Life Ledger entfernt. Dein Google Kalender bleibt unverändert.",
      saved: "Kalenderauswahl gespeichert", disconnected: "Google Kalender getrennt", stale: "Google ist nicht erreichbar; der zuletzt geladene Tagesplan wird angezeigt.", error: "Der Kalender konnte nicht gelesen werden. Bitte versuche es erneut.", authExpired: "Der Google-Zugriff ist abgelaufen. Bitte erneut verbinden.", noCalendars: "Keine lesbaren Kalender gefunden.", calendarEvents: "Kalendertermine",
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
      body: "Nimm dir ein paar Minuten für Gewohnheiten, Stimmung und Tagesreflexion.", testBody: "Mitteilungen funktionieren. Kehre heute Abend zurück und betrachte deinen Weg.", close: "Einstellungen für tägliche Erinnerung schließen", short: "Erinnerung", cardOn: "Aktiv · {time}", cardOff: "Nicht aktiviert",
    },
    focus: {
      kicker: "FOKUS", overviewTitle: "Fokuszeit", overviewHint: "Wähle eine Sache und schenke ihr deine volle Aufmerksamkeit.", open: "Fokus starten", openActive: "Timer öffnen", settings: "Einstellungen", presetSummary: "{focus} Min. Fokus · {break} Min. Pause", readyShort: "Bereit",
      todayMinutes: "Min. heute", sessions: "Einheiten", weekMinutes: "Min. diese Woche", weekChart: "Fokuszeit dieser Woche", dialogKicker: "FOKUS-TIMER", dialogTitle: "Nutze diese Zeit für das Wesentliche.",
      phaseFocus: "Fokus", phaseBreak: "Pause", ready: "Bereit, wenn du es bist", chooseGoal: "Tagesziel wählen", goalLabel: "Fokus auf", customLabel: "Standard-Fokusthema", customPlaceholder: "z. B. Datenanalyse, Schreiben…",
      custom: "Eigene", focusMinutes: "Fokusminuten", breakMinutes: "Pausenminuten", sound: "Ton", notify: "Mitteilung", wakeLock: "Bildschirm aktiv halten", start: "Fokus starten", pause: "Pause", resume: "Fortsetzen", startBreak: "Pause starten", finish: "Jetzt abschließen", interrupt: "Einheit beenden", skipBreak: "Pause überspringen", close: "Fokus-Timer schließen",
      caveat: "Der Timer bleibt im Hintergrund zeitgenau. Fokusminuten fließen in deine Rückschau ein.", goalAction: "Dieses Ziel fokussieren", untitled: "Freier Fokus", completed: "Fokus abgeschlossen", interrupted: "Fokuszeit gespeichert", breakReady: "Fokus abgeschlossen. Zeit für eine ruhige Pause.", breakDone: "Pause beendet. Du kannst neu starten.", notificationBody: "{label} · {minutes} Fokusminuten", confirmEnd: "Diesen Fokus jetzt beenden? Die investierte Zeit wird trotzdem gespeichert.", todaySummary: "Heute {minutes} Fokusminuten", reviewKicker: "FOKUS-RÜCKBLICK", reviewTitle: "Fokuszeit", reviewScope: "Zeitraum für Fokusrückblick wählen", scopeWeek: "Woche", scopeMonth: "Monat", reviewWeek: "Woche wählen", reviewMonth: "Monat wählen", reviewUnit: "Min.", reviewChart: "Fokusminuten pro Tag", noFocus: "Für diesen Zeitraum gibt es noch keine Fokuszeit.", moreThanPrevious: "{minutes} Min. mehr als in der Vorwoche", lessThanPrevious: "{minutes} Min. weniger als in der Vorwoche", sameAsPrevious: "Wie in der Vorwoche", moreThanPreviousMonth: "{minutes} Min. mehr als im Vormonat", lessThanPreviousMonth: "{minutes} Min. weniger als im Vormonat", sameAsPreviousMonth: "Wie im Vormonat", monthTotal: "{month} · insgesamt {minutes} Min.", monthActivity: "{days} Fokustage · Ø {average} Min. pro Tag",
    },
    foundations: { kicker: "BASIS", title: "Tägliche Basisziele", adjust: "Ziele anpassen", periodNote: "Periodenziel · nicht im Tagesscore", carousel: "Heutige Gewohnheitsgruppen", previousPage: "Vorige Gewohnheitsgruppe", nextPage: "Nächste Gewohnheitsgruppe", page: "Gruppe {page} von {total}" },
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
    },
    reviewCanvas: {
      kicker: "DEEP REVIEW", title: "Review Canvas", openWeekly: "Wochenrückblick erstellen", openMonthly: "Monatsrückblick erstellen", periodAria: "Rückblickszeitraum wählen", weekly: "Wöchentlich", monthly: "Monatlich", week: "Woche", month: "Monat", generate: "Entwurf neu erstellen", evidenceKicker: "AUFZEICHNUNG", evidenceTitle: "Was die Aufzeichnungen zeigen", draftKicker: "REFLEXION", draftTitle: "Bearbeitbarer Rückblick", placeholder: "Erstelle einen sachlichen Entwurf aus deinen Einträgen und ergänze deine Sicht.", autosaved: "● automatisch gespeichert", copy: "Markdown kopieren", done: "Fertig", close: "Review Canvas schließen", copied: "Rückblick kopiert", generated: "Rückblicksentwurf erstellt", replaceConfirm: "Ein neuer Entwurf ersetzt den aktuellen Text. Fortfahren?", statDays: "Erfasste Tage", statHabits: "Gewohnheiten", statFocus: "Fokusminuten", statGoals: "Erledigte Ziele", noEvidence: "Für diesen Zeitraum gibt es noch keine Textaufzeichnungen.",
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
const cloudBaseConfigured = Boolean(window.LifeLedgerCloudBase?.deploymentConfig().configured);
const previewName = new URLSearchParams(location.search).get("local-preview");
const dayPlanPrototype = previewName === "day-plan-calendar-v1";
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
let focusTimer = null;
let voiceReflection = null;
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
let pendingMoodDate = null;
let pendingMood = "";
let reviewCanvasScope = "week";
let reviewCanvasKey = "";
let persistenceRequested = false;
let mobileToolbarOpen = false;
const HABITS_PER_PAGE = 4;
let todayHabitPage = 0;
let habitCarouselScrollFrame = 0;
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
  setText("#mobileToolbarLabel", tr("toolbar.short"));
  setAria("#mobileToolbarToggle", mobileToolbarOpen ? tr("toolbar.close") : tr("toolbar.open"));
  const heroQuote = quoteFor(0);
  setText(".hero-copy h2", heroQuote.text);
  setText(".quote-source", heroQuote.source);
  setText(".progress-orbit-label", tr("hero.progress"));
  setText(".mood-card .kicker", tr("mood.kicker"));
  setText(".mood-card h3", tr("mood.title"));
  setText("#moodNote", "");
  const moodNote = $("#moodNote");
  const moodQuote = quoteFor(2);
  if (moodNote) moodNote.innerHTML = `${escapeHtml(moodQuote.text)}<small>${escapeHtml(moodQuote.source)}</small>`;
  applyMoodReasonLanguage();
  $$("#quickMood button, #drawerMood button").forEach(button => {
    const icon = $("span", button)?.textContent || moodIcons[button.dataset.mood] || "";
    button.innerHTML = `<span>${icon}</span>${moodLabel(button.dataset.mood)}`;
  });
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
  setText("#dayScheduleTitle", tr("dayPlan.schedule"));
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
  setText(".calendar-toolbar .kicker", tr("calendar.kicker"));
  setText(".calendar-toolbar p", tr("calendar.desc"));
  setAria("#prevMonth", tr("calendar.prev"));
  setAria("#nextMonth", tr("calendar.next"));
  const weekdayRow = $(".weekdays");
  if (weekdayRow) weekdayRow.innerHTML = i18n[currentLang].calendar.weekdays.map(day => `<span>${day}</span>`).join("");
  const legend = $(".calendar-legend");
  if (legend) legend.innerHTML = `<span><i class="legend-dot complete"></i>${tr("calendar.complete")}</span><span><i class="legend-dot partial"></i>${tr("calendar.partial")}</span><span><i class="legend-dot empty"></i>${tr("calendar.empty")}</span>`;
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
  applyReviewCanvasLanguage();
  applyTheme();
  applySidebarState();
  renderIconPicker();
  setSaveMode(cloudMode ? "cloud" : "", cloudMode ? tr("save.cloudSaved") : tr("save.localPreview"));
}
function applyReviewCanvasLanguage() {
  setText("#openWeeklyReviewCanvas", tr("reviewCanvas.openWeekly"));
  setText("#generateReview", tr("reviewCanvas.openMonthly"));
  setText("#reviewCanvasKicker", tr("reviewCanvas.kicker"));
  setText("#reviewCanvasTitle", tr("reviewCanvas.title"));
  setAria("#reviewScopeSwitch", tr("reviewCanvas.periodAria"));
  $$('[data-review-scope]').forEach(button => { button.textContent = tr(`reviewCanvas.${button.dataset.reviewScope === "week" ? "weekly" : "monthly"}`); });
  setText("#reviewCanvasWeekLabel", tr("reviewCanvas.week"));
  setText("#reviewCanvasMonthLabel", tr("reviewCanvas.month"));
  setText("#regenerateReviewCanvas", tr("reviewCanvas.generate"));
  setText("#reviewEvidenceKicker", tr("reviewCanvas.evidenceKicker"));
  setText("#reviewEvidenceTitle", tr("reviewCanvas.evidenceTitle"));
  setText("#reviewDraftKicker", tr("reviewCanvas.draftKicker"));
  setText("#reviewDraftTitle", tr("reviewCanvas.draftTitle"));
  setText("#reviewCanvasAutosave", tr("reviewCanvas.autosaved"));
  setPlaceholder("#reviewCanvasText", tr("reviewCanvas.placeholder"));
  setText("#copyReviewCanvas", tr("reviewCanvas.copy"));
  setText("#saveReviewCanvas", tr("reviewCanvas.done"));
  setAria(".close-review-canvas", tr("reviewCanvas.close"));
  populateReviewCanvasPeriods();
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
  setPlaceholder('input[name="name"]', tr("dialog.namePlaceholder"));
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
      if (!remote) { await pushCloudState(); return; }
      if (remote?.payload && (remote.payload.meta?.updatedAt || 0) > (state.meta?.updatedAt || 0)) {
        state = { ...cloneData(seed), ...remote.payload, dailyGoals: remote.payload.dailyGoals || {}, weeklyGoals: remote.payload.weeklyGoals || {}, longTermGoals: remote.payload.longTermGoals || [], weeklyOutputs: remote.payload.weeklyOutputs || {}, weeklyReviews: remote.payload.weeklyReviews || {} };
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
      state = { ...cloneData(seed), ...remote.payload, dailyGoals: remote.payload.dailyGoals || {}, weeklyGoals: remote.payload.weeklyGoals || {}, longTermGoals: remote.payload.longTermGoals || [], weeklyOutputs: remote.payload.weeklyOutputs || {}, weeklyReviews: remote.payload.weeklyReviews || {} };
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
  if (!window.confirm(tr("calendarSync.disconnectConfirm"))) return;
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
  $("#yearSelect").value = cursor.getFullYear();
  $("#monthSelect").value = cursor.getMonth();
  renderToday();
  renderFocusOverview();
  renderWeeklyWorkspace();
  renderCalendar();
  renderReview();
  renderHabitSettings();
  decorateMotionSurfaces();
}

const motionSurfaceSelector = ".hero-card, .mood-card, .habit-card, .focus-overview-card, .daily-goals-card, .calendar-card, .panel, .weekly-goals-panel, .weekly-writing-panel, .score-card, .setting-row";
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
  autoGrowTextarea($("#weeklyOutputText"));
  $("#weeklyOutputStatus").textContent = output.trim() ? tr("week.outputStatus", { count: output.trim().length }) : tr("week.outputEmpty");
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

function renderHabitCarousel(habits, date, completedIds) {
  const ordered = orderedTodayHabits(habits, completedIds);
  const pageCount = Math.max(1, Math.ceil(ordered.length / HABITS_PER_PAGE));
  todayHabitPage = Math.min(todayHabitPage, pageCount - 1);
  const carousel = $("#todayHabitCarousel");
  const viewport = $("#todayHabitViewport");
  carousel.dataset.pageCount = String(pageCount);
  $("#todayHabits").innerHTML = Array.from({ length: pageCount }, (_, page) => {
    const group = ordered.slice(page * HABITS_PER_PAGE, (page + 1) * HABITS_PER_PAGE);
    return `<div class="habit-page" data-page="${page}" aria-label="${escapeHtml(tr("foundations.page", { page: page + 1, total: pageCount }))}">${group.map(habit => habitCard(habit, date, completedIds.includes(habit.id))).join("")}</div>`;
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
  if (progressNumber.dataset.value !== progressCount) {
    progressNumber.dataset.value = progressCount;
    progressNumber.innerHTML = `<b>${complete}</b><small>/ ${scoredHabits.length}</small>`;
    progressNumber.classList.remove("number-pop");
    void progressNumber.offsetWidth;
    progressNumber.classList.add("number-pop");
  }
  $("#progressOrbit").style.setProperty("--progress", progress);
  renderHabitCarousel(habits, date, log.completed);
  $$("#quickMood button").forEach(b => b.classList.toggle("selected", b.dataset.mood === log.mood));
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
    { id: "routine-german", start: "08:00", end: "08:30", routine: true, title: languageText("德语听说", "German listening & speaking", "Deutsch hören & sprechen") },
    { id: "routine-applications", start: "09:15", end: "09:35", routine: true, title: languageText("坚持投递", "Job applications", "Bewerbungen") },
    { id: "routine-cat", start: "21:30", end: "21:40", routine: true, title: languageText("给猫零食", "Cat treat", "Katzensnack") },
    { id: "routine-tidy", start: "22:00", end: "22:20", routine: true, title: languageText("每日整理", "Daily tidy", "Tägliches Aufräumen") },
  ];
  const oneOffByOffset = {
    "-1": [{ id: "career-workshop", start: "16:00", end: "17:30", title: languageText("职业方向工作坊", "Career direction workshop", "Workshop zur Karriereplanung") }],
    0: [
      { id: "analyst-interview", start: "09:00", end: "09:45", title: languageText("数据分析师线上面试", "Data analyst interview", "Online-Interview Data Analyst") },
      { id: "portfolio-review", start: "14:30", end: "15:15", title: languageText("作品集评审", "Portfolio review", "Portfolio-Review") },
      { id: "release-prep", start: "18:00", end: "19:00", title: languageText("第一个 Project Release", "First project release", "Erstes Project Release") },
    ],
    2: [{ id: "onsite-interview", start: "08:00", end: "10:00", title: languageText("线下面试", "On-site interview", "Vor-Ort-Interview") }],
    4: [{ id: "release-deadline", allDay: true, title: languageText("项目 Release 截止日", "Project release deadline", "Deadline für das Project Release") }],
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
  setText("#dayScheduleCount", tr("dayPlan.events", { count: important.length }));
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
  renderDailyGoals();
  void loadGoogleCalendarMonth(date);
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
  voiceReflection?.setContext({
    date: selectedPlanningDate,
    isToday: selectedPlanningDate === isoDate(new Date()),
    disabled: future,
  });
}

async function saveVoiceReflection({ date, text }) {
  const today = isoDate(new Date());
  if (date !== today) throw new Error("Voice reflection can only be saved to today");
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
  if (!window.LifeLedgerVoiceCheckin || !button || !dialog) return;
  voiceReflection = window.LifeLedgerVoiceCheckin.create({
    button,
    dialog,
    enabled: hostedCloudMode,
    language: currentLang,
    context: {
      date: selectedPlanningDate,
      isToday: selectedPlanningDate === isoDate(new Date()),
      disabled: isFutureDate(selectedPlanningDate),
    },
    onSave: saveVoiceReflection,
    onToast: showToast,
  });
}

function habitCard(habit, date, done) {
  const v = versionFor(habit, date);
  const target = habitMetaLabel(v);
  const periodNote = countsTowardDaily(habit, date) ? "" : `<span class="period-note">${tr("foundations.periodNote")}</span>`;
  const transitionName = `habit-${String(habit.id).replace(/[^a-z0-9_-]/gi, "-")}`;
  return `<article class="habit-card ${done ? "completed" : ""}" data-id="${habit.id}" role="button" tabindex="0" aria-pressed="${done}" style="${habitStyle(habit)};view-transition-name:${transitionName}">
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
  const commit = () => {
    state.logs[date] = log;
    saveState();
    renderAll();
    if ($("#dayDrawer").classList.contains("open")) renderDrawer();
  };
  const animateReorder = date === isoDate(new Date())
    && $("#todayView").classList.contains("active")
    && typeof document.startViewTransition === "function"
    && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (animateReorder) {
    document.documentElement.classList.add("habit-reordering");
    const finishReorder = () => document.documentElement.classList.remove("habit-reordering");
    document.startViewTransition(commit).finished.then(finishReorder, finishReorder);
  } else {
    commit();
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
  $("#moodReasonIcon").textContent = moodIcons[mood] || "◌";
  $("#moodReasonMood").textContent = moodLabel(mood);
  $("#moodReasonDate").textContent = formatDateChip(parseDate(date));
  $("#moodReasonText").value = log.mood === mood ? log.moodReason || "" : "";
  applyMoodReasonLanguage();
  $("#moodReasonDialog").showModal();
  window.setTimeout(() => $("#moodReasonText").focus({ preventScroll: true }), 60);
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
    const schedule = calendarEventsForDate(key);
    const scheduleColors = [...new Set(schedule.map(event => event.calendarColor || "#6f95c8"))].slice(0, 3);
    cells.push(`<button class="calendar-day ${d.getMonth() !== month ? "outside" : ""} ${key === today ? "today" : ""} ${key > today ? "future" : ""} ${isoWeekKey(d) === currentWeek ? "current-week" : ""}" data-date="${key}">
      <span class="day-number">${d.getDate()}</span>${log.mood ? `<span class="day-mood">${moodIcons[log.mood]}</span>` : ""}
      <span class="day-status">${habits.map(h => `<i class="${log.completed.includes(h.id) ? "done" : ""}" style="${log.completed.includes(h.id) ? `background:${colors[h.color].solid}` : ""}"></i>`).join("")}</span>
      ${schedule.length ? `<span class="day-calendar-status" title="${escapeHtml(tr("calendarSync.calendarEvents"))}">${scheduleColors.map(color => `<i style="background:${escapeHtml(color)}"></i>`).join("")}${schedule.length > 3 ? `<b>+${schedule.length - 3}</b>` : ""}</span>` : ""}
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
  renderFocusReview(year, month);
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
  $("#focusReviewWeekSelect").innerHTML = keys.map(key => `<option value="${key}" ${key === selectedReviewWeek ? "selected" : ""}>${formatWeekRangeInMonth(key, year, month)}</option>`).join("");
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
      <div class="setting-main"><strong>${escapeHtml(displayHabitName(h))}</strong><span>${escapeHtml(habitMetaLabel(v))}</span>${v?.note ? `<small class="setting-note">${escapeHtml(v.note)}</small>` : ""}</div>
      <div class="setting-actions">
        <button class="habit-drag-handle" type="button" data-id="${h.id}" aria-label="${tr("habits.reorder", { habit: displayHabitName(h) })}" title="${tr("habits.reorder", { habit: displayHabitName(h) })}"><span aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span></button>
        <button class="icon-button edit-habit" type="button" data-id="${h.id}" aria-label="${tr("habits.editLabel", { habit: displayHabitName(h) })}">···</button>
      </div>
    </article>`;
  }).join("");
  $$(".edit-habit").forEach(b => b.addEventListener("click", () => openHabitDialog(b.dataset.id)));
  $$(".habit-drag-handle").forEach(bindHabitDragHandle);
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

function populateReviewCanvasPeriods() {
  const weekSelect = $("#reviewCanvasWeek");
  const monthSelect = $("#reviewCanvasMonth");
  if (!weekSelect || !monthSelect) return;
  const currentWeek = weekSelect.value || selectedWorkspaceWeek;
  const currentMonth = monthSelect.value || monthKey(cursor);
  const weekKeys = [];
  const seen = new Set();
  for (let date = new Date(2026, 0, 1, 12); date <= new Date(2035, 11, 31, 12); date.setDate(date.getDate() + 1)) {
    const key = isoWeekKey(date);
    if (seen.has(key) || Number(key.slice(0, 4)) < 2026 || Number(key.slice(0, 4)) > 2035) continue;
    seen.add(key);
    weekKeys.push(key);
  }
  weekSelect.innerHTML = weekKeys.map(key => `<option value="${key}">${escapeHtml(reviewPeriodLabel("week", key))}</option>`).join("");
  monthSelect.innerHTML = Array.from({ length: 120 }, (_, index) => {
    const year = 2026 + Math.floor(index / 12);
    const month = index % 12 + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    return `<option value="${key}">${escapeHtml(reviewPeriodLabel("month", key))}</option>`;
  }).join("");
  weekSelect.value = weekKeys.includes(currentWeek) ? currentWeek : selectedWorkspaceWeek;
  monthSelect.value = currentMonth;
}

function reviewEvidence(scope, key) {
  const dates = datesForReview(scope, key);
  const dateSet = new Set(dates);
  const logs = dates.map(date => ({ date, log: getLog(date) }));
  const recordedDays = logs.filter(({ log }) => log.completed?.length || log.mood || log.moodReason || log.note?.trim()).length;
  const habitStats = state.habits.map(habit => {
    const eligible = dates.filter(date => activeHabits(date).some(item => item.id === habit.id));
    const count = eligible.filter(date => getLog(date).completed?.includes(habit.id)).length;
    return { name: displayHabitName(habit), count, possible: eligible.length };
  }).filter(item => item.possible || item.count);
  const habitCheckins = habitStats.reduce((sum, item) => sum + item.count, 0);
  const sessions = dates.length ? focusSessionsBetween(dates[0], dates.at(-1)) : [];
  const focusMinutes = Math.round(sessions.reduce((sum, session) => sum + focusSessionMinutes(session), 0));
  const weekKeys = [...new Set(dates.map(date => isoWeekKey(parseDate(date))))];
  const weeklyGoals = weekKeys.flatMap(week => state.weeklyGoals[week] || []);
  const goals = weeklyGoals;
  const goalsDone = goals.filter(goal => goal.done).length;
  const unfinishedGoals = goals.filter(goal => !goal.done).map(goal => goal.text).filter(Boolean);
  const moodCounts = logs.reduce((counts, { log }) => {
    if (log.mood) counts[log.mood] = (counts[log.mood] || 0) + 1;
    return counts;
  }, {});
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
  const notes = logs.flatMap(({ date, log }) => [log.moodReason, log.note].filter(value => value?.trim()).map(value => ({ date, text: value.trim() })));
  const outputs = weekKeys.map(week => state.weeklyOutputs[week]?.trim()).filter(Boolean);
  const strongestDay = dates.map(date => ({ date, score: completionFor(date) })).sort((a, b) => b.score - a.score)[0];
  return { scope, key, dates, dateSet, label: reviewPeriodLabel(scope, key), recordedDays, habitStats, habitCheckins, focusMinutes, goalsDone, goalsTotal: goals.length, unfinishedGoals, topMood, notes, outputs, strongestDay };
}

function buildLocalReviewDraft(evidence) {
  const habitLines = evidence.habitStats.length
    ? evidence.habitStats.map(item => `- ${item.name}: ${item.count}/${item.possible}`).join("\n")
    : languageText("- 暂无习惯完成记录", "- No habit check-ins yet", "- Noch keine Gewohnheitseinträge");
  const moodLine = evidence.topMood
    ? languageText(`最常记录的感受：${moodLabel(evidence.topMood[0])}（${evidence.topMood[1]}天）`, `Most recorded mood: ${moodLabel(evidence.topMood[0])} (${evidence.topMood[1]} days)`, `Häufigste Stimmung: ${moodLabel(evidence.topMood[0])} (${evidence.topMood[1]} Tage)`)
    : languageText("尚未记录心情。", "No mood was recorded.", "Es wurde noch keine Stimmung erfasst.");
  const strongest = evidence.strongestDay && evidence.strongestDay.score > 0
    ? `${formatDateChip(parseDate(evidence.strongestDay.date))} · ${evidence.strongestDay.score}%`
    : languageText("暂无", "Not enough data", "Noch nicht genügend Daten");
  const unfinished = evidence.unfinishedGoals.length ? evidence.unfinishedGoals.slice(0, 6).map(text => `- ${text}`).join("\n") : languageText("- 暂无未完成目标", "- No unfinished goals", "- Keine offenen Ziele");
  const records = [...evidence.outputs, ...evidence.notes.map(item => `${formatDateChip(parseDate(item.date))}: ${item.text}`)].slice(0, 6);
  const recordLines = records.length ? records.map(text => `- ${text}`).join("\n") : languageText("- 这个周期还没有留下文字。", "- No written record was left in this period.", "- Für diesen Zeitraum gibt es noch keinen Text.");
  if (currentLang === "zh") return `# ${evidence.label}${evidence.scope === "week" ? "周度" : "月度"}复盘\n\n## 事实摘要\n- 有记录的天数：${evidence.recordedDays}/${evidence.dates.length}\n- 习惯完成：${evidence.habitCheckins} 次\n- 专注：${evidence.focusMinutes} 分钟\n- 目标：完成 ${evidence.goalsDone}/${evidence.goalsTotal}\n\n## 习惯轨迹\n${habitLines}\n\n## 值得看见\n- 完成度最高的一天：${strongest}\n- ${moodLine}\n\n## 尚未完成\n${unfinished}\n\n## 留下的内容\n${recordLines}\n\n## 我的理解\n- 什么值得继续？\n- 什么正在消耗我？\n- 下一周期最重要的一步是什么？\n`;
  if (currentLang === "de") return `# ${evidence.label} · ${evidence.scope === "week" ? "Wochenrückblick" : "Monatsrückblick"}\n\n## Fakten\n- Erfasste Tage: ${evidence.recordedDays}/${evidence.dates.length}\n- Gewohnheiten: ${evidence.habitCheckins} Check-ins\n- Fokus: ${evidence.focusMinutes} Minuten\n- Ziele: ${evidence.goalsDone}/${evidence.goalsTotal} erledigt\n\n## Gewohnheiten\n${habitLines}\n\n## Was sichtbar wird\n- Stärkster Tag: ${strongest}\n- ${moodLine}\n\n## Offen\n${unfinished}\n\n## Hinterlassene Notizen\n${recordLines}\n\n## Meine Einordnung\n- Was sollte bleiben?\n- Was kostet unnötig Kraft?\n- Was ist der wichtigste nächste Schritt?\n`;
  return `# ${evidence.label} · ${evidence.scope === "week" ? "Weekly Review" : "Monthly Review"}\n\n## Facts\n- Recorded days: ${evidence.recordedDays}/${evidence.dates.length}\n- Habits: ${evidence.habitCheckins} check-ins\n- Focus: ${evidence.focusMinutes} minutes\n- Goals: ${evidence.goalsDone}/${evidence.goalsTotal} completed\n\n## Habit trail\n${habitLines}\n\n## What stands out\n- Strongest day: ${strongest}\n- ${moodLine}\n\n## Still open\n${unfinished}\n\n## Notes from the period\n${recordLines}\n\n## My perspective\n- What deserves to continue?\n- What is draining energy?\n- What is the most important next step?\n`;
}

function reviewCanvasStore() {
  return reviewCanvasScope === "week" ? state.weeklyReviews : state.reviews;
}

function renderReviewCanvas(generateIfEmpty = true) {
  if (!reviewCanvasKey) return;
  const evidence = reviewEvidence(reviewCanvasScope, reviewCanvasKey);
  const stats = [
    [tr("reviewCanvas.statDays"), `${evidence.recordedDays}/${evidence.dates.length}`],
    [tr("reviewCanvas.statHabits"), evidence.habitCheckins],
    [tr("reviewCanvas.statFocus"), evidence.focusMinutes],
    [tr("reviewCanvas.statGoals"), `${evidence.goalsDone}/${evidence.goalsTotal}`],
  ];
  $("#reviewEvidenceStats").innerHTML = stats.map(([label, value]) => `<div><strong>${value}</strong><span>${escapeHtml(label)}</span></div>`).join("");
  const notes = [...evidence.outputs, ...evidence.notes.map(note => note.text)].slice(0, 3);
  $("#reviewEvidenceNotes").innerHTML = notes.length ? notes.map(note => `<p>${escapeHtml(note)}</p>`).join("") : `<p>${escapeHtml(tr("reviewCanvas.noEvidence"))}</p>`;
  const store = reviewCanvasStore();
  let text = store[reviewCanvasKey] || "";
  if (!text && generateIfEmpty) {
    text = buildLocalReviewDraft(evidence);
    store[reviewCanvasKey] = text;
    saveState();
  }
  $("#reviewCanvasText").value = text;
}

function setReviewCanvasScope(scope) {
  reviewCanvasScope = scope === "month" ? "month" : "week";
  $$('[data-review-scope]').forEach(button => button.classList.toggle("active", button.dataset.reviewScope === reviewCanvasScope));
  $("#reviewCanvasWeekField").hidden = reviewCanvasScope !== "week";
  $("#reviewCanvasMonthField").hidden = reviewCanvasScope !== "month";
  reviewCanvasKey = reviewCanvasScope === "week" ? ($("#reviewCanvasWeek").value || selectedWorkspaceWeek) : ($("#reviewCanvasMonth").value || monthKey(cursor));
  renderReviewCanvas();
}

function openReviewCanvas(scope = "week") {
  populateReviewCanvasPeriods();
  $("#reviewCanvasWeek").value = selectedWorkspaceWeek;
  $("#reviewCanvasMonth").value = monthKey(cursor);
  setReviewCanvasScope(scope);
  $("#reviewCanvasDialog").showModal();
}

function regenerateReviewCanvas() {
  const current = $("#reviewCanvasText").value.trim();
  if (current && !window.confirm(tr("reviewCanvas.replaceConfirm"))) return;
  const text = buildLocalReviewDraft(reviewEvidence(reviewCanvasScope, reviewCanvasKey));
  reviewCanvasStore()[reviewCanvasKey] = text;
  $("#reviewCanvasText").value = text;
  saveState();
  showToast(tr("reviewCanvas.generated"));
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
  const result = { habits: cloneData(state.habits), logs: {}, reviews: {}, dailyGoals: {}, weeklyGoals: {}, longTermGoals: cloneData(state.longTermGoals || []), weeklyOutputs: {}, weeklyReviews: {}, focusSessions: [], focusSettings: cloneData(state.focusSettings || seed.focusSettings), exportMeta: { ...range, exportedAt: new Date().toISOString() } };
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
  window.addEventListener("pointermove", moveHabitDrag, { passive: false });
  window.addEventListener("pointerup", finishHabitSettingsDrag);
  window.addEventListener("pointercancel", finishHabitSettingsDrag);
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
  $$(".nav-item").forEach(button => button.addEventListener("click", () => {
    $$(".nav-item").forEach(b => b.classList.toggle("active", b === button));
    $$(".view").forEach(v => v.classList.remove("active"));
    $(`#${button.dataset.view}View`).classList.add("active");
    $("#viewTitle").textContent = tr(`viewTitles.${button.dataset.view}`);
    if (button.dataset.view === "week") renderWeeklyWorkspace();
    if (button.dataset.view === "review") renderReview();
  }));
  $("#prevMonth").addEventListener("click", () => { cursor.setMonth(cursor.getMonth() - 1); renderAll(); void loadGoogleCalendarMonth(cursor); });
  $("#nextMonth").addEventListener("click", () => { cursor.setMonth(cursor.getMonth() + 1); renderAll(); void loadGoogleCalendarMonth(cursor); });
  $("#todayButton").addEventListener("click", () => { cursor = new Date(); renderAll(); void loadGoogleCalendarMonth(cursor); });
  $("#previousHabitPage").addEventListener("click", () => setTodayHabitPage(todayHabitPage - 1));
  $("#nextHabitPage").addEventListener("click", () => setTodayHabitPage(todayHabitPage + 1));
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
  $("#focusInterrupt").addEventListener("click", () => {
    if (!window.confirm(tr("focus.confirmEnd"))) return;
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
  $$("#quickMood button").forEach(b => b.addEventListener("click", () => setMood(isoDate(new Date()), b.dataset.mood)));
  $$("#drawerMood button").forEach(b => b.addEventListener("click", () => setMood(selectedDate, b.dataset.mood)));
  $("#quickMoodReason").addEventListener("click", () => {
    const date = isoDate(new Date());
    const log = getLog(date);
    if (log.mood) openMoodReasonDialog(date, log.mood);
  });
  $("#drawerMoodReason").addEventListener("click", () => {
    const log = getLog(selectedDate);
    if (log.mood) openMoodReasonDialog(selectedDate, log.mood);
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
  $("#openWeeklyReviewCanvas").addEventListener("click", () => openReviewCanvas("week"));
  $("#generateReview").addEventListener("click", () => openReviewCanvas("month"));
  $$('[data-review-scope]').forEach(button => button.addEventListener("click", () => setReviewCanvasScope(button.dataset.reviewScope)));
  $("#reviewCanvasWeek").addEventListener("change", event => { reviewCanvasKey = event.target.value || selectedWorkspaceWeek; renderReviewCanvas(); });
  $("#reviewCanvasMonth").addEventListener("change", event => { reviewCanvasKey = event.target.value || monthKey(cursor); renderReviewCanvas(); });
  $("#regenerateReviewCanvas").addEventListener("click", regenerateReviewCanvas);
  $("#reviewCanvasText").addEventListener("input", event => { reviewCanvasStore()[reviewCanvasKey] = event.target.value; saveState(); });
  $("#copyReviewCanvas").addEventListener("click", async () => {
    const text = $("#reviewCanvasText").value;
    try { await navigator.clipboard.writeText(text); }
    catch {
      $("#reviewCanvasText").select();
      document.execCommand("copy");
    }
    showToast(tr("reviewCanvas.copied"));
  });
  $$(".close-review-canvas").forEach(button => button.addEventListener("click", () => $("#reviewCanvasDialog").close()));
  $("#reviewCanvasDialog").addEventListener("cancel", event => { event.preventDefault(); $("#reviewCanvasDialog").close(); });
  $("#reviewText").addEventListener("input", e => { state.reviews[monthKey(cursor)] = e.target.value; saveState(); });
  $("#weeklyGoalForm").addEventListener("submit", event => {
    event.preventDefault();
    const input = $("#weeklyGoalInput"), text = input.value.trim();
    if (!text) return;
    const key = selectedWorkspaceWeek;
    state.weeklyGoals[key] = [...(state.weeklyGoals[key] || []), { id: createId(), text, done: false }];
    input.value = ""; saveState(); renderWeeklyWorkspace(); showToast(tr("week.added"));
  });
  $$('[data-goal-horizon]').forEach(button => button.addEventListener("click", () => {
    goalHorizon = button.dataset.goalHorizon === "long" ? "long" : "week";
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
  document.addEventListener("visibilitychange", () => {
    focusTimer?.reconcile();
    if (!document.hidden) {
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

syncExportButtonPlacement(); syncMobileToolbar(); initSelects(); initFocusTimer(); bindEvents(); initVoiceReflection(); bindPointerMotion(); renderAll(); armReminderClock();
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
initializeCloudSync();
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" })
      .then(registration => registration.update())
      .catch(error => console.warn("Service worker registration failed", error));
  });
}
