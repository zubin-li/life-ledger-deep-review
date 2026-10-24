// Deterministic local-only demo workspace builders. DOM-free so node:test can execute the real logic.

export const DEMO_META_VERSION = 1;
export const DEMO_PERSONA_VERSION = 5; // bump to re-seed an untouched older demo
import { personaPack, demoScheduleFor } from "./demo-persona.js";
import { demoDayContent, DEMO_EVENTS } from "./demo-life.js";
export const DEMO_CONTENT_SEED = 0x6d656d6f; // "memo"
export const DEMO_DISMISSED_KEY = "life-ledger-demo-dismissed-v1";
export const DEFAULT_STORAGE_KEY = "life-ledger-v1";
export const DEMO_PREVIEW_ID = "demo-showcase-v1";

const STARTER_HABIT_IDS = [
  "exercise", "reading", "sleep2330", "hydration", "meditation", "deepwork", "language", "strength",
];

export const DEMO_MEMORY_ASSETS = [
  // AI-generated photos for the demo persona (AI data analyst in Berlin).
  { id: "analyst-desk", file: "analyst-desk.jpg", width: 960, height: 720 },
  { id: "run-park", file: "run-park.jpg", width: 720, height: 960 },
  { id: "team-whiteboard", file: "team-whiteboard.jpg", width: 960, height: 720 },
  { id: "dashboard-screen", file: "dashboard-screen.jpg", width: 960, height: 720 },
  { id: "german-books", file: "german-books.jpg", width: 960, height: 877 },
  { id: "spree-sunset", file: "spree-sunset.jpg", width: 960, height: 720 },
  { id: "meetup-talk", file: "meetup-talk.jpg", width: 960, height: 720 },
  { id: "gym-weights", file: "gym-weights.jpg", width: 960, height: 887 },
  { id: "cafe-reading", file: "cafe-reading.jpg", width: 960, height: 877 },
  { id: "weekend-hike", file: "weekend-hike.jpg", width: 960, height: 720 },
  { id: "dinner-friends", file: "dinner-friends.jpg", width: 960, height: 720 },
  { id: "meditation-corner", file: "meditation-corner.jpg", width: 960, height: 877 },
  { id: "notebook-plan", file: "notebook-plan.jpg", width: 720, height: 960 },
  { id: "ai-conference", file: "ai-conference.jpg", width: 960, height: 640 },
  { id: "hackathon-night", file: "hackathon-night.jpg", width: 960, height: 720 },
  { id: "halfmarathon-medal", file: "halfmarathon-medal.jpg", width: 960, height: 720 },
  { id: "team-offsite-lake", file: "team-offsite-lake.jpg", width: 960, height: 720 },
  { id: "museum-sunday", file: "museum-sunday.jpg", width: 960, height: 720 },
  { id: "market-haul", file: "market-haul.jpg", width: 720, height: 960 },
  { id: "goethe-b1", file: "goethe-b1.jpg", width: 960, height: 720 },
  { id: "birthday-dinner", file: "birthday-dinner.jpg", width: 720, height: 960 },
];
const assetById = id => DEMO_MEMORY_ASSETS.find(asset => asset.id === id);

const ASSET_BASE = "./assets/demo-memories/";

export function resolveStorageKey(previewParam) {
  return previewParam === DEMO_PREVIEW_ID ? `life-ledger-preview-${DEMO_PREVIEW_ID}` : DEFAULT_STORAGE_KEY;
}

export function resolveDismissedKey(previewParam) {
  return previewParam === DEMO_PREVIEW_ID
    ? `life-ledger-preview-${DEMO_PREVIEW_ID}-dismissed`
    : DEMO_DISMISSED_KEY;
}

export function isLocalOnlyEligible({ deploymentMode, cloudBaseConfigured }) {
  if (cloudBaseConfigured) return false;
  if (deploymentMode === "cloudflare") return false;
  return deploymentMode === "local" || !deploymentMode;
}

export function isDemoActive(state) {
  return Boolean(state?.meta?.demo?.version === DEMO_META_VERSION && state.meta.demo.active);
}

export function isStarterHabitSet(habits) {
  if (!Array.isArray(habits) || habits.length !== STARTER_HABIT_IDS.length) return false;
  const ids = new Set(habits.map(habit => habit.id));
  return STARTER_HABIT_IDS.every(id => ids.has(id));
}

export function hasMeaningfulUserData(state) {
  if (!state || typeof state !== "object") return false;
  if (Object.keys(state.logs || {}).length) return true;
  if (Object.values(state.reviews || {}).some(value => String(value || "").trim())) return true;
  if (Object.values(state.weeklyOutputs || {}).some(value => String(value || "").trim())) return true;
  if (Object.values(state.weeklyReviews || {}).some(value => String(value || "").trim())) return true;
  if (Object.values(state.dailyGoals || {}).some(goals => Array.isArray(goals) && goals.length)) return true;
  if (Object.values(state.weeklyGoals || {}).some(goals => Array.isArray(goals) && goals.length)) return true;
  if ((state.longTermGoals || []).length) return true;
  if ((state.focusSessions || []).length) return true;
  return false;
}

export function shouldSeedDemo({ eligible, dismissed, storedRaw, state }) {
  if (!eligible || dismissed) return false;
  if (isDemoActive(state)) return (state.meta.demo.persona || 1) < DEMO_PERSONA_VERSION; // older sample data → new persona
  return storedRaw == null;
}

export function demoNoticeCopy(lang) {
  const table = {
    en: {
      message: "This workspace shows fictional sample data stored only on this device.",
      clear: "Clear demo & start fresh",
      confirm: "Remove only the fictional sample data and keep your theme and language settings?",
      cleared: "Sample data cleared. Your workspace is ready.",
      previewReset: "Reset preview demo",
    },
    zh: {
      message: "当前工作区包含仅保存在本机的虚构示例数据。",
      clear: "清除示例并开始使用",
      confirm: "仅移除虚构示例数据，并保留你的主题与语言设置吗？",
      cleared: "示例数据已清除，可以开始记录自己的内容。",
      previewReset: "重置预览示例",
    },
    de: {
      message: "Dieser Arbeitsbereich zeigt fiktive Beispieldaten, die nur auf diesem Gerät liegen.",
      clear: "Demo löschen & neu starten",
      confirm: "Nur die fiktiven Beispieldaten entfernen und Design sowie Sprache behalten?",
      cleared: "Beispieldaten entfernt. Dein Arbeitsbereich ist bereit.",
      previewReset: "Vorschau-Demo zurücksetzen",
    },
  };
  return table[lang] || table.en;
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

function isoDateFromParts(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isoDateAt(date, atNoon = true) {
  const d = new Date(date);
  if (atNoon) d.setHours(12, 0, 0, 0);
  return isoDateFromParts(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  d.setHours(12, 0, 0, 0);
  return d;
}

function isoWeekKey(date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day + 3);
  const year = d.getFullYear();
  const jan4 = new Date(year, 0, 4, 12);
  const week = 1 + Math.round(((d - jan4) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function localizedPools(lang) {
  const moods = ["低落", "平静", "很好"];
  const pools = {
    en: {
      moodReasons: [
        "A slow morning finally gave me room to think.",
        "Back-to-back meetings left little space to breathe.",
        "Finished a draft I had been avoiding for weeks.",
        "Missed my workout but kept the day gentle.",
        "A long walk after lunch reset my focus.",
        "Language practice felt awkward but honest today.",
        "Deep work block went better than expected.",
        "Sleep was short; patience ran thin by evening.",
        "Caught up with a friend over a simple meal.",
        "Rain made the apartment feel unusually calm.",
        "A small bug fix unlocked a bigger piece of work.",
        "Felt scattered until a short meditation helped.",
        "Good progress on reading, even if only twenty minutes.",
        "Strength session was heavy but satisfying.",
        "Too much screen time in the afternoon.",
        "Grateful for an unhurried evening routine.",
        "Presentation nerves, then relief when it landed.",
        "Creative work felt blocked until I changed scenery.",
        "Hydration and movement both slipped today.",
        "Quiet pride after closing a messy email thread.",
        "Weekend recovery still echoing into Monday.",
        "Learning vocabulary that finally stuck.",
      ],
      journal: [
        "Closed the quarterly outline and sent it for feedback. The structure is finally readable, even if the prose still needs another pass. Took a walk before dinner to let the ideas settle.",
        "Interview prep dominated the morning, but I protected ninety minutes for portfolio cleanup. Noticed how much calmer I feel when the desk is clear.",
        "Skipped the gym and did mobility at home instead. Wrote down three things that went well, including a patient conversation with a collaborator.",
        "Deep work on the analysis notebook. The chart finally tells a coherent story. Still need to document assumptions before sharing.",
        "Language session was messy—lots of false starts—but I stayed with it. Evening reading felt like a reward rather than another task.",
        "Weekly review day: celebrated two strong habit weeks, named one pattern to watch (late-night scrolling). Planning lighter goals for the next sprint.",
        "Met a friend for a simple dinner. Came back with more energy than a full afternoon of solo grinding usually gives me.",
        "Recovery day by choice: short run, long shower, early bedtime prep. Journaled about what “enough” means this month.",
        "Pushed a release candidate and wrote the handoff notes. Proud of the discipline, even though the launch is not perfect.",
        "Forest walk without podcasts. Let my mind wander toward the long-term creative project I keep postponing.",
        "Monthly reflection: good weeks and quiet days both belong in the ledger. Choosing one meaningful goal for the coming month.",
        "Handled admin that had been lingering for two weeks. The relief was disproportionate to the task size.",
      ],
      dailyGoals: [
        "Outline feedback responses",
        "Thirty-minute reading block",
        "Prepare tomorrow’s deep-work list",
        "Send one thoughtful check-in message",
        "Review habit trends for the week",
        "Tidy desk before logging off",
        "Practice pronunciation drills",
        "Stretch after strength work",
      ],
      weeklyGoals: [
        "Ship the portfolio case study draft",
        "Protect three deep-work mornings",
        "Finish two language tutoring sessions",
        "Schedule a recovery evening",
        "Walk outside four times",
        "Write weekly output summary",
      ],
      weeklyOutputs: [
        "Published a cleaner project narrative and closed two lingering review threads.",
        "Kept mornings quieter; progress on analysis felt steady rather than frantic.",
        "Mixed week: strong focus days, two evenings lost to fatigue. Still moved language goals forward.",
        "Recovery-minded week with lighter meetings. Returned to strength training consistently.",
        "Wrapped a release checklist and documented lessons for next cycle.",
        "Balanced creative exploration with admin; ended the week calmer than it started.",
        "Pushed interview materials forward while keeping sleep closer to target.",
      ],
      weeklyReviews: [
        "Good rhythm on deep work; watch evening screen time.",
        "Proud of movement consistency; language practice needs a fixed slot.",
        "Honest week with visible dips—plan smaller wins next time.",
      ],
      monthlyReviews: [
        "A month of uneven days still added up to meaningful craft progress. Movement and reading held; sleep needs another guardrail. Entering next month with one creative commitment and one health anchor.",
        "Language learning felt more conversational this month. Work deliverables landed, though focus scattered around launch week. Grateful for walks that broke up desk days.",
        "Strength and hydration improved; meditation streak was patchy. Writing practice returned near month end. Want clearer boundaries between deep work and reactive tasks.",
      ],
      focusTopics: [
        "Portfolio writing",
        "Data analysis",
        "Language drills",
        "Release checklist",
        "Research reading",
        "Creative outline",
        "Email triage",
        "Presentation polish",
      ],
      longTerm: [
        { name: "Build a calm creative practice", next: "Draft a two-hour weekly studio block", status: "active" },
        { name: "Reach conversational German", next: "Book two tutoring sessions", status: "active" },
        { name: "Sustainable strength & mobility", next: "Track weekly sessions without daily pressure", status: "paused" },
      ],
    },
    zh: {
      moodReasons: [
        "早晨节奏很慢，反而有了思考空间。",
        "连续会议让人喘不过气。",
        "终于交出了拖了很久的文稿。",
        "没运动，但对自己还算温柔。",
        "午后的长走让专注回来了。",
        "语言练习很笨拙，但很真实。",
        "深度工作比预期顺利。",
        "睡眠偏少，晚上耐心变短。",
        "和朋友简单吃了一顿饭。",
        "雨天让房间意外地安静。",
        "修掉一个小问题，推进了大块工作。",
        "冥想几分钟后心绪安定下来。",
        "阅读只进行了二十分钟，也足够。",
        "力量训练很累，但很有成就感。",
        "下午屏幕时间过久。",
        "感谢从容的晚间例行。",
        "汇报前紧张，结束后松了口气。",
        "换了个环境，创作顺畅了些。",
        "饮水和运动都做得不够。",
        "处理完复杂邮件后心里轻松。",
        "周末恢复的影响延续到周一。",
        "终于记住了一批新词汇。",
      ],
      journal: [
        "完成季度大纲并发出征求意见。结构终于可读，文字还需要再打磨。晚饭前散步，让思路沉淀。",
        "上午主要在准备面试，仍留出九十分钟整理作品集。桌面清爽时，情绪明显更稳。",
        "没去健身房，在家做了拉伸。写下三件做得好的事，包括一次耐心的沟通。",
        "深度处理分析笔记本，图表终于讲通故事。分享前还要补充假设说明。",
        "语言学习磕磕绊绊，但坚持下来了。晚间阅读像奖励，而不是任务。",
        "周复盘日：肯定两周好习惯，也点名一个要留意的模式（深夜刷手机）。下周目标打算轻一些。",
        "和朋友简单聚餐，回来的精力胜过一下午独自硬扛。",
        "主动安排恢复日：短跑、长淋浴、提前准备睡觉。写下这个月“足够”的含义。",
        "推送了候选版本并写好交接说明。发布不完美，但节奏值得肯定。",
        "森林散步没有播客，让思绪流向长期搁置的创作项目。",
        "月度反思：高光与安静的日子都值得记录。为下个月选一个有意义的目标。",
        "处理了两周悬而未决的行政事项，轻松感远超任务本身。",
      ],
      dailyGoals: [
        "整理反馈回复提纲",
        "阅读三十分钟",
        "列出明日深度工作清单",
        "发一条真诚的问候",
        "查看本周习惯趋势",
        "下班前收拾桌面",
        "练习发音",
        "力量训练后拉伸",
      ],
      weeklyGoals: [
        "完成作品集案例初稿",
        "保住三个深度工作早晨",
        "完成两次语言辅导",
        "安排一个恢复型夜晚",
        "户外步行四次",
        "写本周输出总结",
      ],
      weeklyOutputs: [
        "项目叙事更清晰，并关闭两条拖延已久的评审。",
        "早晨更安静，分析工作稳步推进。",
        "混合的一周：有高效日，也有疲惫夜，语言目标仍在前进。",
        "会议较少、更重视恢复，力量训练恢复规律。",
        "完成发布清单并记录下次可改进之处。",
        "创作与行政并行，周末比周初更平静。",
        "面试材料推进，睡眠更接近目标。",
      ],
      weeklyReviews: [
        "深度工作节奏不错，留意晚间屏幕时间。",
        "运动坚持得好，语言需要固定时段。",
        "诚实地看见低谷，下周目标更小一些。",
      ],
      monthlyReviews: [
        "这个月日子起伏，但作品推进是实在的。运动与阅读稳定，睡眠还需再加一道护栏。下个月锁定一个创作承诺与一个健康锚点。",
        "语言更敢开口了。工作交付完成，发布周专注略散。感谢散步打断久坐。",
        "力量与饮水改善，冥想断续。写作在月末回归。希望更清晰地区分深度工作与被动响应。",
      ],
      focusTopics: [
        "作品集写作",
        "数据分析",
        "语言练习",
        "发布清单",
        "研读资料",
        "创作大纲",
        "邮件整理",
        "演示打磨",
      ],
      longTerm: [
        { name: "建立从容的创作练习", next: "每周固定两小时创作时段", status: "active" },
        { name: "德语达到可交流", next: "预约两次辅导课", status: "active" },
        { name: "可持续的力量与灵活度", next: "按周记录训练，不追求每日完美", status: "paused" },
      ],
    },
    de: {
      moodReasons: [
        "Ein langsamer Morgen gab mir Raum zum Nachdenken.",
        "Dichte Termine ließen wenig Luft.",
        "Endlich einen lang aufgeschobenen Entwurf abgeschickt.",
        "Training verpasst, aber der Tag blieb freundlich.",
        "Ein langer Spaziergang nach dem Mittagessen half.",
        "Sprachübung war holprig, aber ehrlich.",
        "Deep-Work-Block lief besser als erwartet.",
        "Zu wenig Schlaf – abends wenig Geduld.",
        "Mit einer Freundin einfach essen gegangen.",
        "Regen machte die Wohnung ungewöhnlich ruhig.",
        "Ein kleiner Fix brachte große Arbeit voran.",
        "Kurze Meditation beruhigte den Kopf.",
        "Nur zwanzig Minuten Lesen – trotzdem wertvoll.",
        "Krafttraining war schwer, aber befriedigend.",
        "Am Nachmittag zu viel Bildschirmzeit.",
        "Dankbar für einen ruhigen Abend.",
        "Nervosität vor dem Vortrag, danach Erleichterung.",
        "Kreatives ging besser nach Ortswechsel.",
        "Trinken und Bewegung blieben heute zurück.",
        "Erleichterung nach einer komplexen E-Mail.",
        "Wochenend-Erholung wirkte noch am Montag.",
        "Neue Vokabeln blieben endlich hängen.",
      ],
      journal: [
        "Quartalsentwurf fertig und Feedback angefragt. Die Struktur trägt, der Text braucht noch Feinschliff. Spaziergang vor dem Essen zum Sortieren der Gedanken.",
        "Vormittag Interview-Vorbereitung, aber neunzig Minuten fürs Portfolio geschützt. Aufgeräumter Schreibtisch, ruhigerer Kopf.",
        "Kein Gym – Mobilität zu Hause. Drei positive Punkte notiert, inklusive eines geduldigen Gesprächs.",
        "Tief im Analyse-Notebook gearbeitet; die Grafik erzählt endlich eine Geschichte. Annahmen müssen noch dokumentiert werden.",
        "Sprachsession holprig, aber drangeblieben. Abendliches Lesen fühlte sich wie Belohnung an.",
        "Wochenrückblick: zwei starke Gewohnheitswochen gefeiert, ein Muster benannt (spätes Scrollen). Nächste Woche leichtere Ziele.",
        "Einfaches Essen mit Freundin – mehr Energie als ein Nachmittag Solo-Grind.",
        "Erholungstag: kurzer Lauf, lange Dusche, früh ins Bett vorbereitet. Notiert, was „genug“ diesen Monat bedeutet.",
        "Release-Kandidat gepusht und Übergabe geschrieben. Nicht perfekt, aber diszipliniert.",
        "Waldspaziergang ohne Podcasts. Gedanken wanderten zum lang verschobenen Kreativprojekt.",
        "Monatsreflexion: starke und ruhige Tage gehören beide ins Ledger. Ein bedeutungsvolles Ziel für den nächsten Monat gewählt.",
        "Zwei Wochen alte Admin-Aufgaben erledigt – Erleichterung größer als die Aufgabe.",
      ],
      dailyGoals: [
        "Feedback-Antworten skizzieren",
        "Dreißig Minuten lesen",
        "Deep-Work-Liste für morgen",
        "Eine nachdenkliche Nachricht senden",
        "Gewohnheitstrends der Woche prüfen",
        "Schreibtisch vor Feierabend aufräumen",
        "Aussprache üben",
        "Nach Krafttraining dehnen",
      ],
      weeklyGoals: [
        "Portfolio-Fallstudie entwerfen",
        "Drei Deep-Work-Morgende schützen",
        "Zwei Sprach-Tutorings absolvieren",
        "Einen Erholungsabend planen",
        "Viermal draußen gehen",
        "Wochenrückblick schreiben",
      ],
      weeklyOutputs: [
        "Klarere Projekterzählung, zwei alte Review-Threads geschlossen.",
        "Ruhigere Morgen; Analysearbeit stetig statt hektisch.",
        "Gemischte Woche – starke Fokustage, zwei müde Abende; Sprache bewegt sich.",
        "Weniger Termine, mehr Erholung; Krafttraining wieder regelmäßig.",
        "Release-Checkliste abgeschlossen und Learnings notiert.",
        "Kreatives und Admin balanciert; Wochenende ruhiger als der Start.",
        "Interview-Material voran, Schlaf näher am Ziel.",
      ],
      weeklyReviews: [
        "Guter Deep-Work-Rhythmus; Abend-Bildschirmzeit im Blick behalten.",
        "Bewegung konstant; Sprache braucht festen Slot.",
        "Ehrliche Woche mit sichtbaren Tälern – nächste Ziele kleiner.",
      ],
      monthlyReviews: [
        "Unruhiger Monat, aber spürbarer Fortschritt in der Arbeit. Bewegung und Lesen hielten; Schlaf braucht eine weitere Leitplanke. Nächsten Monat mit einem Kreativ- und einem Gesundheitsanker.",
        "Sprache fühlte sich gesprächiger an. Lieferungen erledigt, Fokus in der Launch-Woche zerfasert. Spaziergänge halfen gegen Schreibtisch-Marathon.",
        "Kraft und Trinken besser; Meditation lückenhaft. Schreiben kehrte Ende Monat zurück. Klarere Grenze zwischen Deep Work und Reaktivität gewünscht.",
      ],
      focusTopics: [
        "Portfolio-Text",
        "Datenanalyse",
        "Sprachübungen",
        "Release-Checkliste",
        "Recherche lesen",
        "Kreativ-Outline",
        "E-Mail-Triage",
        "Präsentation feilen",
      ],
      longTerm: [
        { name: "Eine ruhige Kreativpraxis aufbauen", next: "Zwei Stunden Studio pro Woche blocken", status: "active" },
        { name: "Konversationsfähiges Deutsch", next: "Zwei Tutorings buchen", status: "active" },
        { name: "Nachhaltige Kraft & Mobilität", next: "Wöchentlich trainieren ohne Tagesdruck", status: "paused" },
      ],
    },
  };
  const pack = pools[lang] || pools.en;
  return { moods, ...pack };
}

function habitCompletionPlan(rng, dateKey, dayIndex) {
  const lift = Math.min(0.14, dayIndex / 90 * 0.14); // the persona gets steadier month by month
  const weekday = new Date(`${dateKey}T12:00:00`).getDay();
  const weekend = weekday === 0 || weekday === 6;
  const quiet = rng() < 0.12;
  const completed = [];
  const rates = {
    exercise: weekend ? 0.55 : 0.72,
    reading: 0.68,
    sleep2330: 0.58,
    hydration: 0.64,
    meditation: 0.52,
    deepwork: 0.61,
    language: 0.66,
    strength: 0,
  };
  if (!quiet) {
    for (const [habit, rate] of Object.entries(rates)) {
      if (habit === "strength") continue;
      if (rng() < rate + lift) completed.push(habit);
    }
    if ([1, 3, 6].includes(weekday) && rng() < 0.88) completed.push("strength"); // weekly 3× target, met most weeks
  } else if (rng() < 0.35) {
    completed.push("reading");
  }
  if (dayIndex % 11 === 0 && !completed.includes("hydration")) completed.push("hydration");
  return completed;
}

function pickMood(rng, moods) {
  const roll = rng();
  if (roll < 0.22) return moods[0];
  if (roll < 0.62) return moods[1];
  return moods[2];
}

export function buildDemoPhotoSchedule(now = new Date()) {
  const end = isoDateAt(now);
  const start = isoDateAt(addDays(now, -89));
  const rng = mulberry32(DEMO_CONTENT_SEED ^ 0x50686f74);
  const days = DEMO_EVENTS.filter(event => event.photo?.length).map(event => ({ date: isoDateAt(addDays(now, -event.d)), assets: event.photo.map(assetById).filter(Boolean) }));
  let photoCount = days.reduce((sum, day) => sum + day.assets.length, 0);
  for (let offset = 0; offset <= 89; offset += 1) {
    const date = isoDateAt(addDays(now, -offset));
    if (date < start || date > end || days.some(entry => entry.date === date)) continue;
    if (photoCount >= 34 || rng() < 0.86) continue;
    const remaining = 34 - photoCount;
    const count = remaining <= 1 ? 1 : rng() < 0.18 ? Math.min(3, remaining) : rng() < 0.42 ? Math.min(2, remaining) : 1;
    const assets = [];
    for (let i = 0; i < count; i += 1) {
      const asset = DEMO_MEMORY_ASSETS[Math.floor(rng() * DEMO_MEMORY_ASSETS.length)];
      assets.push(asset);
    }
    photoCount += assets.length;
    days.push({ date, assets });
  }
  while (days.length < 12) {
    const offset = Math.floor(rng() * 90);
    const date = isoDateAt(addDays(now, -offset));
    if (days.some(entry => entry.date === date)) continue;
    days.push({ date, assets: [DEMO_MEMORY_ASSETS[days.length % DEMO_MEMORY_ASSETS.length]] });
  }
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

export function demoPhotosForRange(from, to, now = new Date()) {
  const schedule = buildDemoPhotoSchedule(now);
  const photos = [];
  schedule.forEach(({ date, assets }) => {
    if (date < from || date > to) return;
    assets.forEach((asset, index) => {
      photos.push({
        id: `demo-photo-${asset.id}-${date}-${index}`,
        date,
        url: `${ASSET_BASE}${asset.file}`,
        width: asset.width,
        height: asset.height,
        demo: true,
      });
    });
  });
  return photos;
}

export function buildDemoWorkspace({
  now = new Date(),
  lang = "en",
  seedHabits,
  contentSeed = DEMO_CONTENT_SEED,
  createId = () => `demo-${Math.random().toString(36).slice(2, 10)}`,
}) {
  const rng = mulberry32(contentSeed);
  const pack = personaPack(lang);
  const today = isoDateAt(now);
  const start = isoDateAt(addDays(now, -89));
  const logs = {};
  const dates = [];
  for (let offset = 89; offset >= 0; offset -= 1) {
    const date = isoDateAt(addDays(now, -offset));
    if (date > today) continue;
    dates.push(date);
  }
  const todayKey = dates.at(-1);
  dates.forEach((date, dayIndex) => {
    const weekday = new Date(`${date}T12:00:00`).getDay();
    const completed = habitCompletionPlan(rng, date, dayIndex);
    const content = demoDayContent(lang, dayIndex, weekday, completed);
    let { note, moodReason } = content;
    const mood = pack.moods[content.mood] ?? pack.moods[1];
    if (date === todayKey) note = pack.todayNote;
    logs[date] = { completed, mood, moodReason, note };
  });

  const dailyGoals = {};
  const goalPool = pack.dailyGoals;
  const pickGoals = (date, dayIndex, future) => {
    const count = future ? 2 + (dayIndex % 2) : 2 + (dayIndex % 3);
    const start = (dayIndex * 3) % goalPool.length;
    return Array.from({ length: count }, (_, goalIndex) => {
      const text = goalPool[(start + goalIndex) % goalPool.length];
      const done = future ? false : goalIndex < count - 1 || dayIndex % 5 !== 0;
      return { id: `demo-goal-${date}-${goalIndex}`, text, done };
    });
  };
  dates.forEach((date, dayIndex) => { dailyGoals[date] = pickGoals(date, dayIndex, false); });
  for (let f = 1; f <= 7; f += 1) {
    const date = isoDateAt(addDays(now, f));
    dailyGoals[date] = pickGoals(date, 89 + f, true);
  }

  const weeklyGoals = {};
  const weeklyOutputs = {};
  const weeklyReviews = {};
  const weekKeys = [...new Set(dates.map(date => isoWeekKey(new Date(`${date}T12:00:00`))))].sort();
  weekKeys.forEach((key, index) => {
    const goalCount = 2 + (index % 3);
    const goalStart = (index * 2) % pack.weeklyGoals.length;
    weeklyGoals[key] = Array.from({ length: goalCount }, (_, goalIndex) => ({
      id: `demo-week-${key}-${goalIndex}`,
      text: pack.weeklyGoals[(goalStart + goalIndex) % pack.weeklyGoals.length],
      done: key !== weekKeys.at(-1) && goalIndex < goalCount - 1,
    }));
    weeklyOutputs[key] = pack.weeklyOutputs[index] ?? pack.weeklyOutputs.at(-1);
    weeklyReviews[key] = pack.weeklyReviews[index] ?? pack.weeklyReviews.at(-1);
  });

  const currentWeek = weekKeys.at(-1);
  if (currentWeek) { weeklyOutputs[currentWeek] = pack.weekDraft.output; weeklyReviews[currentWeek] = pack.weekDraft.review; }

  const reviews = {};
  const monthKeys = [...new Set(dates.map(date => monthKey(new Date(`${date}T12:00:00`))))].sort();
  monthKeys.forEach((key, index) => {
    reviews[key] = pack.monthlyReviews[index] ?? pack.monthlyReviews.at(-1);
  });

  const phaseId = key => `demo-phase-${key}`;
  const stamp = offset => new Date(addDays(now, offset)).toISOString();
  const phaseEvents = pack.phaseEvents || {};
  const planning = {
    phases: pack.phases.map((p, phaseIndex) => {
      const details = phaseEvents[p.key] || [];
      const events = [
        { type: "created", date: stamp(p.start), detail: details[0] || pack.phaseEventFallback(p.key, "created") },
        { type: "note", date: stamp(p.start + 12 + phaseIndex * 3), detail: details[1] || pack.phaseEventFallback(p.key, "note") },
        { type: "adjusted", date: stamp(p.start + 28 + phaseIndex * 2), detail: details[2] || pack.phaseEventFallback(p.key, "adjusted") },
        ...(p.status === "closed"
          ? [
            { type: "pinned", date: stamp(p.end - 8), detail: details[3] || pack.phaseEventFallback(p.key, "pinned") },
            { type: "closed", date: stamp(p.end), detail: details[4] || pack.phaseEventFallback(p.key, "closed") },
          ]
          : [
            { type: "pinned", date: stamp(-18 + phaseIndex * 4), detail: details[3] || pack.phaseEventFallback(p.key, "pinned") },
          ]),
      ];
      return {
        id: phaseId(p.key), name: p.name, focus: p.focus,
        startDate: isoDateAt(addDays(now, p.start)), endDate: isoDateAt(addDays(now, p.end)),
        status: p.status, ...(p.review ? { review: p.review, closedAt: stamp(p.end) } : {}),
        events,
        createdAt: 0, updatedAt: 0,
      };
    }),
    currentPhaseId: phaseId(pack.phases.find(p => p.current).key),
    note: pack.note,
    updatedAt: 0,
  };
  const longTermGoals = pack.goals.map((g, index) => {
    const eventDetails = pack.goalEvents?.[index] || [];
    const eventTypes = ["created", "step", "note", "status", "step", "note"];
    const events = eventTypes.map((type, i) => ({
      type,
      date: stamp(-82 + index * 2 + i * 7),
      detail: eventDetails[i] || pack.goalEventFallback(index, type),
    })).slice(0, 3 + (index % 4));
    return {
      id: `demo-long-${index}`,
      name: g.name,
      area: g.area,
      phaseId: g.phase ? phaseId(g.phase) : "",
      nextAction: g.next,
      startDate: start,
      reviewDate: isoDateAt(addDays(now, 21 + index * 9)),
      status: g.status,
      steps: (g.steps || []).map((text, i) => ({ id: `demo-step-${index}-${i}`, text, done: i < g.done })),
      events,
      createdAt: 0,
      updatedAt: 0,
    };
  });
  // a closed phase keeps a snapshot of its plans
  planning.phases.filter(p => p.status === "closed").forEach(p => { p.snapshot = longTermGoals.filter(g => g.phaseId === p.id); });

  const focusSessions = [];
  let sessionSerial = 0;
  dates.forEach((date, dayIndex) => {
    const weekday = new Date(`${date}T12:00:00`).getDay();
    const weekend = weekday === 0 || weekday === 6;
    const sessionCount = weekend ? 1 : 1 + (dayIndex % 2);
    for (let s = 0; s < sessionCount; s += 1) {
      const topicIndex = (dayIndex * 2 + s) % pack.focusTopics.length;
      const planned = [25, 30, 45, 50, 60, 75, 90][(dayIndex + s) % 7];
      const actual = Math.max(20, planned - (dayIndex % 5) * 3);
      const hour = weekend ? 10 + s : 9 + s * 2;
      const startedAt = new Date(`${date}T${String(hour).padStart(2, "0")}:15:00`).getTime();
      focusSessions.push({
        id: `demo-focus-${sessionSerial}`,
        date,
        startedAt,
        endedAt: startedAt + actual * 60000,
        plannedMinutes: planned,
        actualMinutes: actual,
        outcome: actual >= planned - 5 ? "completed" : "finishedEarly",
        linkedGoalId: "",
        label: pack.focusTopics[topicIndex],
        preset: weekend ? "classic" : ["deep", "classic"][s % 2],
      });
      sessionSerial += 1;
    }
  });
  focusSessions.sort((a, b) => Number(a.startedAt) - Number(b.startedAt));

  const habits = seedHabits ? JSON.parse(JSON.stringify(seedHabits)) : [];
  const habitNotes = pack.habitNotes || {};
  habits.forEach(habit => {
    (habit.versions || []).forEach(version => {
      if (!version.effectiveDate || version.effectiveDate > start) version.effectiveDate = start;
      if (habitNotes[habit.id]) version.note = habitNotes[habit.id];
    });
  });
  return {
    habits,
    logs,
    reviews,
    dailyGoals,
    weeklyGoals,
    longTermGoals,
    planning,
    weeklyOutputs,
    weeklyReviews,
    focusSessions,
    focusSettings: {
      preset: "classic",
      focusMinutes: 25,
      breakMinutes: 5,
      defaultTopic: pack.focusTopics[0],
      sound: true,
      notify: true,
      wakeLock: true,
    },
    meta: {
      updatedAt: Date.now(),
      starterPackVersion: 2,
      demo: {
        version: DEMO_META_VERSION,
        active: true,
        contentSeed,
        seededAt: new Date(now).toISOString(),
        persona: DEMO_PERSONA_VERSION,
        lang,
      },
    },
  };
}

export function buildClearedWorkspace({ seedHabits, starterPackVersion = 2 }) {
  return {
    habits: seedHabits ? JSON.parse(JSON.stringify(seedHabits)) : [],
    logs: {},
    reviews: {},
    dailyGoals: {},
    weeklyGoals: {},
    longTermGoals: [],
    weeklyOutputs: {},
    weeklyReviews: {},
    focusSessions: [],
    focusSettings: {
      preset: "classic",
      focusMinutes: 25,
      breakMinutes: 5,
      defaultTopic: "",
      sound: true,
      notify: true,
      wakeLock: true,
    },
    meta: {
      updatedAt: Date.now(),
      starterPackVersion,
      demo: { version: DEMO_META_VERSION, active: false },
    },
  };
}

export function relocalizeDemoWorkspace(state, lang) {
  if (!isDemoActive(state)) return state;
  // Replace a sample value only while it still equals a generated sample value (in any of the three
  // languages, so a stale meta.lang or a half-finished earlier switch cannot strand old-language text);
  // anything the user typed, added or removed is kept as is.
  const seed = state.meta?.demo?.contentSeed ?? DEMO_CONTENT_SEED;
  const anchor = state.meta?.demo?.seededAt ? new Date(state.meta.demo.seededAt) : new Date();
  const build = l => buildDemoWorkspace({ now: anchor, lang: l, seedHabits: state.habits, contentSeed: seed, createId: () => "demo-relocalize" });
  const rebuilt = build(lang);
  const previous = ["zh", "en", "de"].filter(l => l !== lang).map(build).concat(rebuilt);
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const isObj = v => v !== null && typeof v === "object";
  const swap = (stored, befores, after) => {
    if (after === undefined) return stored;
    if (befores.some(before => same(stored, before))) return after;
    if (!isObj(stored) || !isObj(after)) return stored;
    befores = befores.filter(isObj);
    if (Array.isArray(stored)) {
      if (!Array.isArray(after)) return stored;
      const keyOf = (item, i) => (isObj(item) ? item.id ?? item.key ?? item.startedAt ?? i : i);
      const afterIdx = new Map(after.map((item, i) => [keyOf(item, i), i]));
      return stored.map((item, i) => {
        const k = keyOf(item, i), j = afterIdx.has(k) ? afterIdx.get(k) : (i < after.length ? i : undefined);
        if (j === undefined) return item;
        const prior = befores.map(b => (Array.isArray(b) ? b.find((x, n) => keyOf(x, n) === k) ?? b[j] : undefined)).filter(x => x !== undefined);
        return swap(item, prior, after[j]);
      });
    }
    const out = { ...stored };
    for (const key of Object.keys(out)) if (key in after) out[key] = swap(out[key], befores.map(b => b[key]).filter(x => x !== undefined), after[key]);
    return out;
  };
  const next = { ...state, meta: { ...state.meta, demo: { ...state.meta.demo, lang } } };
  for (const key of ["logs", "reviews", "dailyGoals", "weeklyGoals", "longTermGoals", "planning", "weeklyOutputs", "weeklyReviews", "focusSessions", "habits", "focusSettings"]) {
    next[key] = swap(state[key], previous.map(p => p[key]), rebuilt[key]);
  }
  return next;
}

if (typeof window !== "undefined") {
  window.LifeLedgerDemoWorkspace = {
    DEMO_META_VERSION,
    DEMO_CONTENT_SEED,
    DEMO_DISMISSED_KEY,
    DEFAULT_STORAGE_KEY,
    DEMO_PREVIEW_ID,
    DEMO_MEMORY_ASSETS,
    DEMO_PERSONA_VERSION,
    resolveStorageKey,
    resolveDismissedKey,
    isLocalOnlyEligible,
    isDemoActive,
    isStarterHabitSet,
    hasMeaningfulUserData,
    shouldSeedDemo,
    demoNoticeCopy,
    buildDemoPhotoSchedule,
    demoPhotosForRange,
    buildDemoWorkspace,
    buildClearedWorkspace,
    relocalizeDemoWorkspace,
    demoScheduleFor,
  };
}
