// Three months of the demo persona's life (Lin, AI data analyst in Berlin): dated events with a photo and a
// calendar entry, plus deterministic journal lines for every day in the 90-day window. Pure data, local demo only.
// d = days before today (0 = today). mood: 0 低落 / 1 平静 / 2 很好. photo = DEMO_MEMORY_ASSETS id.

export const DEMO_EVENTS = [
  { d: 88, mood: 2, photo: ["team-offsite-lake"], time: "10:00", zh: ["团队湖边 offsite", "季度启动 offsite，在湖边的木栈道上讨论下季度的评估路线图。决定先把评估集做大，再谈自动化。"], en: ["Team offsite by the lake", "Quarter kick-off by the lake. On the jetty we agreed: grow the eval set first, automate later."], de: ["Team-Offsite am See", "Quartalsstart am See. Auf dem Steg beschlossen: erst das Eval-Set vergrößern, dann automatisieren."] },
  { d: 83, mood: 2, photo: ["weekend-hike"], time: "", zh: ["勃兰登堡森林徒步", "周末森林徒步 18 公里，一整天没看手机。回来做了一顿像样的饭。"], en: ["Forest hike in Brandenburg", "18 km forest hike, phone off all day. Cooked a proper dinner afterwards."], de: ["Waldwanderung in Brandenburg", "18 km im Wald, den ganzen Tag ohne Handy. Danach richtig gekocht."] },
  { d: 77, mood: 2, photo: ["goethe-b1"], time: "", zh: ["收到歌德 B1 证书", "歌德学院 B1 证书寄到了。下一站 B2：每天 20 分钟听力，周二周四上课。"], en: ["Goethe B1 certificate arrived", "The Goethe B1 certificate came in the post. Next: B2 — 20 min listening a day, class Tue/Thu."], de: ["Goethe-Zertifikat B1 ist da", "Das B1-Zertifikat kam mit der Post. Nächstes Ziel B2: täglich 20 Min. Hören, Kurs Di/Do."] },
  { d: 71, mood: 2, photo: ["hackathon-night"], time: "18:00", zh: ["内部黑客松", "黑客松做到凌晨一点：用 LLM 给客服工单自动打标签，准确率 81%，拿了第二名。"], en: ["Internal hackathon", "Hackathon until 1 a.m.: LLM auto-tagging for support tickets, 81% accuracy, second place."], de: ["Interner Hackathon", "Hackathon bis 1 Uhr: LLM-Tagging für Support-Tickets, 81 % Genauigkeit, zweiter Platz."] },
  { d: 66, mood: 2, photo: ["dinner-friends"], time: "19:30", zh: ["和朋友在克罗伊茨贝格吃饭", "和朋友吃越南粉，聊到要不要转去做 AI 产品分析。答案还没有，但问题更清楚了。"], en: ["Dinner with friends in Kreuzberg", "Pho with friends; talked about moving into AI product analytics. No answer yet, a clearer question."], de: ["Essen mit Freunden in Kreuzberg", "Pho mit Freunden; über den Wechsel in AI-Produktanalyse gesprochen. Noch keine Antwort, aber eine klarere Frage."] },
  { d: 61, mood: 1, photo: ["museum-sunday"], time: "14:00", zh: ["周日去博物馆岛", "一个人在博物馆岛待了一下午。很安静，想清楚了下个月只追三件事。"], en: ["Sunday at Museum Island", "An afternoon alone at Museum Island. Quiet; decided to chase only three things next month."], de: ["Sonntag auf der Museumsinsel", "Ein Nachmittag allein auf der Museumsinsel. Ruhig; nächsten Monat nur drei Dinge verfolgen."] },
  { d: 56, mood: 0, photo: ["dashboard-screen"], time: "", zh: ["数据管道故障", "凌晨管道挂了：上游表字段改名。补了 schema 检查和告警说明。很累，但修好后很踏实。"], en: ["Pipeline outage", "Pipeline broke overnight: an upstream column was renamed. Added a schema check and alert notes. Tired, but solid."], de: ["Pipeline-Ausfall", "Nachts brach die Pipeline: eine Spalte wurde umbenannt. Schema-Check und Alarmhinweise ergänzt. Müde, aber stabil."] },
  { d: 50, mood: 1, photo: ["market-haul"], time: "09:30", zh: ["周六逛农夫市集", "周六早上去 Maybachufer 市集，买了一周的菜和一束花。慢一点的早晨很好。"], en: ["Saturday farmers' market", "Maybachufer market on Saturday morning: a week of vegetables and some flowers. Slow mornings help."], de: ["Samstag auf dem Markt", "Samstagmorgen Markt am Maybachufer: Gemüse für die Woche und Blumen. Langsame Morgen tun gut."] },
  { d: 45, mood: 2, photo: ["meetup-talk"], time: "19:00", zh: ["Meetup 分享：评估会胡说的模型", "在 Data Berlin Meetup 讲「如何评估一个会胡说的模型」。会后两个人追着问标注一致性怎么算。"], en: ["Meetup talk: evaluating models that make things up", "Talk at the Data Berlin meetup on evaluating models that hallucinate. Two people stayed to ask about annotator agreement."], de: ["Meetup-Vortrag: Modelle bewerten, die erfinden", "Vortrag beim Data-Berlin-Meetup über halluzinierende Modelle. Zwei blieben, um nach Annotator-Übereinstimmung zu fragen."] },
  { d: 41, mood: 2, photo: ["run-park"], time: "08:00", zh: ["长距离跑 14 公里", "Tiergarten 长跑 14 公里，最后两公里很难，但坚持下来了。半马好像没那么远。"], en: ["Long run, 14 km", "14 km through the Tiergarten. The last two were hard, but done. The half marathon feels closer."], de: ["Langer Lauf, 14 km", "14 km durch den Tiergarten. Die letzten zwei waren hart, aber geschafft. Der Halbmarathon rückt näher."] },
  { d: 37, mood: 2, photo: ["birthday-dinner"], time: "19:00", zh: ["生日晚餐", "朋友们在家给我过生日。许的愿是：明年这个时候，能用德语做一次技术分享。"], en: ["Birthday dinner", "Friends threw a birthday dinner at home. My wish: give a tech talk in German by next year."], de: ["Geburtstagsessen", "Freunde haben bei mir Geburtstag gefeiert. Mein Wunsch: nächstes Jahr einen Tech-Vortrag auf Deutsch."] },
  { d: 33, mood: 2, photo: ["ai-conference"], time: "09:00", zh: ["参加 AI 大会", "参加柏林 AI 大会。最有用的一场讲 LLM 评估里的数据泄漏，记了满满两页笔记。"], en: ["AI conference", "Berlin AI conference. The best session was on data leakage in LLM evals — two pages of notes."], de: ["AI-Konferenz", "AI-Konferenz in Berlin. Bester Vortrag: Datenlecks in LLM-Evaluierungen — zwei Seiten Notizen."] },
  { d: 28, mood: 1, photo: ["team-whiteboard"], time: "14:00", zh: ["评估指标设计会", "白板上把 17 个指标砍到 6 个，每个都要回答一个产品问题。"], en: ["Metric design session", "Cut 17 metrics down to 6 on the whiteboard; each one must answer a product question."], de: ["Metrik-Workshop", "Am Whiteboard 17 Metriken auf 6 reduziert; jede muss eine Produktfrage beantworten."] },
  { d: 24, mood: 1, photo: ["cafe-reading"], time: "", zh: ["咖啡馆读书", "在咖啡馆读《DDIA》讲日志的那章，突然理解了我们事件表为什么总对不上。"], en: ["Reading at the café", "Read the log chapter of DDIA at a café and finally saw why our event tables never reconcile."], de: ["Lesen im Café", "Im Café das Log-Kapitel von DDIA gelesen — endlich verstanden, warum unsere Event-Tabellen nie übereinstimmen."] },
  { d: 20, mood: 1, photo: ["meditation-corner"], time: "", zh: ["冥想连续 14 天", "冥想连续第 14 天。发现最焦虑的时刻总在开会前五分钟，现在会先深呼吸三次。"], en: ["14 days of meditation", "Day 14 of meditation in a row. The most anxious moment is always five minutes before a meeting; now I breathe first."], de: ["14 Tage Meditation", "14. Tag Meditation am Stück. Am nervösesten bin ich fünf Minuten vor Meetings; jetzt erst dreimal atmen."] },
  { d: 16, mood: 2, photo: ["gym-weights"], time: "18:30", zh: ["力量训练加重量", "深蹲加到 60 公斤。为了半马，腿必须更结实。"], en: ["Heavier strength session", "Squats up to 60 kg. The legs need to be stronger for the half marathon."], de: ["Schwereres Krafttraining", "Kniebeugen mit 60 kg. Für den Halbmarathon müssen die Beine stärker werden."] },
  { d: 12, mood: 2, photo: ["halfmarathon-medal", "run-park"], time: "09:00", zh: ["完成柏林半程马拉松", "完成半马！1:58:40，比目标快一分多钟。最后一公里大家在路边喊加油，差点哭了。"], en: ["Finished the Berlin half marathon", "Half marathon done! 1:58:40, a minute under target. The crowd in the last kilometre nearly made me cry."], de: ["Berliner Halbmarathon geschafft", "Halbmarathon geschafft! 1:58:40, eine Minute unter dem Ziel. Der letzte Kilometer mit dem Publikum — fast geweint."] },
  { d: 9, mood: 1, photo: ["spree-sunset"], time: "", zh: ["施普雷河边散步", "下班后沿施普雷河走回家，晚霞很好。决定每周至少一天不加班。"], en: ["Walk along the Spree", "Walked home along the Spree after work; great sunset. At least one evening a week without overtime."], de: ["Spaziergang an der Spree", "Nach der Arbeit an der Spree entlang nach Hause; schöner Sonnenuntergang. Mindestens ein Abend pro Woche ohne Überstunden."] },
  { d: 6, mood: 1, photo: ["german-books"], time: "18:30", zh: ["德语 B2 模拟考", "B2 模拟考听力 71 分、写作 64 分。写作要多练连接词。"], en: ["German B2 mock exam", "B2 mock exam: listening 71, writing 64. Need more practice with connectors."], de: ["B2-Probeprüfung", "B2-Probeprüfung: Hören 71, Schreiben 64. Konnektoren üben."] },
  { d: 3, mood: 2, photo: ["notebook-plan"], time: "", zh: ["规划第四季度", "把第四季度的阶段计划写进本子：评估自动化、德语 B2、冬季跑量保持。"], en: ["Planning Q4", "Wrote the Q4 plan in the notebook: eval automation, German B2, keep winter mileage."], de: ["Q4 planen", "Q4-Plan ins Notizbuch: Eval-Automatisierung, Deutsch B2, Laufumfang im Winter halten."] },
  { d: 1, mood: 1, photo: ["analyst-desk"], time: "", zh: ["加班准备灰度方案", "晚上在家把两个模型版本的对比表整理完，明天和产品对灰度方案。"], en: ["Late evening on the rollout plan", "Finished the model comparison table at home; tomorrow the rollout plan with product."], de: ["Abends am Rollout-Plan", "Abends die Modellvergleichstabelle fertiggestellt; morgen Rollout-Plan mit dem Produkt."] },
];

const EVENT_BY_D = new Map(DEMO_EVENTS.map(event => [event.d, event]));

function daysBeforeToday(dayIndex) {
  return 89 - dayIndex;
}

function clampMoodReason(lang, text) {
  const raw = String(text || "").trim();
  if (lang !== "zh") return raw;
  return raw.length <= 22 ? raw : raw.slice(0, 22);
}

function habitTail(lang, dayIndex, completed) {
  const l = lang === "zh" || lang === "de" ? lang : "en";
  const sep = l === "zh" ? "，" : ", ";
  const end = l === "zh" ? "。" : ".";
  const bits = {
    zh: { exercise: "跑了 {k} 公里", reading: "读了 {p} 页书", language: "德语 {m} 分钟", deepwork: "深度工作 {h} 小时", meditation: "冥想 10 分钟", strength: "力量训练" },
    en: { exercise: "ran {k} km", reading: "read {p} pages", language: "{m} min of German", deepwork: "{h} h deep work", meditation: "10 min meditation", strength: "strength training" },
    de: { exercise: "{k} km gelaufen", reading: "{p} Seiten gelesen", language: "{m} Min. Deutsch", deepwork: "{h} Std. Deep Work", meditation: "10 Min. Meditation", strength: "Krafttraining" },
  };
  const picked = ["exercise", "strength", "reading", "language", "deepwork", "meditation"]
    .filter(h => completed.includes(h))
    .slice(0, 2)
    .map(h => bits[l][h]
      .replace("{k}", 5 + (dayIndex % 6))
      .replace("{p}", 12 + (dayIndex % 5) * 4)
      .replace("{m}", 20 + (dayIndex % 4) * 5)
      .replace("{h}", 1 + (dayIndex % 3)));
  if (!picked.length) return "";
  const tail = picked.join(sep);
  if (l === "en") return ` ${tail[0].toUpperCase() + tail.slice(1)}${end}`;
  return `${l === "zh" ? sep : " "}${tail}${end}`;
}

function moodForDay(dayIndex, weekday, d) {
  const event = EVENT_BY_D.get(d);
  if (event) return event.mood;
  const weekend = weekday === 0 || weekday === 6;
  if (d === 56 || dayIndex % 17 === 8) return 0;
  if (weekend) return dayIndex % 3 === 0 ? 2 : 1;
  if (d < 20) return dayIndex % 5 === 0 ? 2 : 1;
  if (d < 55) return dayIndex % 4 === 1 ? 2 : 1;
  return dayIndex % 6 === 2 ? 0 : 1;
}

function composeNote(lang, dayIndex, weekday, completed) {
  const d = daysBeforeToday(dayIndex);
  const weekend = weekday === 0 || weekday === 6;
  const evalN = 105 + dayIndex;
  const labels = evalN % 17;
  const km = 5 + (dayIndex % 8);
  const pages = 15 + (dayIndex % 10);
  const deMin = 20 + (dayIndex % 12);
  const tail = habitTail(lang, dayIndex, completed);
  const twoPart = dayIndex % 4 === 3;

  const zh = () => {
    if (twoPart) {
      const today = weekend
        ? `今天：在家做了饭，德语听力 ${deMin} 分钟，没开工作电脑。`
        : `今天：评估集扩到 ${evalN} 条，修了 ${labels} 条标注；漂移分箱图更新。`;
      const tomorrow = weekend
        ? "明天：按课表轻松跑，晚上 B2 作业。"
        : `明天：和产品过 ranking v3 第 ${(dayIndex % 5) + 2} 轮实验。`;
      return `${today}\n明天：\n${tomorrow}${tail}`;
    }
    if (weekend) {
      const lines = [
        `周末在 Kreuzberg 散步，把保险续约材料理完（样本 ${evalN}）。`,
        `睡到自然醒，公园跑 ${km} 公里、读 ${pages} 页；样本 ${evalN}。`,
        `整理房间做咖喱，德语播客 ${deMin} 分钟；编号 ${evalN}。`,
        `和朋友喝咖啡聊半马恢复，样本 ${evalN}。`,
        `体检报告正常，预约牙医；周末记录 ${evalN}。`,
        `雨天补税表格，德语播客一整集；${evalN}。`,
        `博物馆旁书店一小时，买了德语技术书 ${evalN}。`,
      ];
      return `${lines[dayIndex % lines.length]}${tail}`;
    }
    if (d >= 60) {
      return `夏季流水线：给评估集第 ${evalN} 条样本补 metadata，指标注册表新增「事实性 v${(dayIndex % 9) + 1}」。${tail || "晚上德语听力 25 分钟。"}`;
    }
    if (d >= 30) {
      return `秋季漂移监测（样本 ${evalN}）：拒答率升 ${(dayIndex % 3) + 1}%，分布图已更新；实验评审备忘写好。${tail || `跑步 ${km} 公里放松。`}`;
    }
    return `灰度前冲刺 #${evalN}：模型 v${(dayIndex % 4) + 2} 对比表，prompt 评测 ${labels} 组；B2 写作练连接词。${tail}`;
  };

  const en = () => {
    if (twoPart) {
      const today = weekend
        ? `Today: cooked at home, ${deMin} min of German listening, no work laptop.`
        : `Today: eval set at ${evalN} items, fixed ${labels} labels; updated drift bins.`;
      const tomorrow = weekend
        ? "Tomorrow: easy run on the plan, B2 homework in the evening."
        : `Tomorrow: ranking v3 experiment review, round ${(dayIndex % 5) + 2} with product.`;
      return `${today}\n\nTomorrow:\n${tomorrow}${tail}`;
    }
    if (weekend) {
      const lines = [
        `Slow weekend in Kreuzberg; insurance papers sorted (item ${evalN}).`,
        `Slept in, ${km} km in the park, ${pages} pages read — log ${evalN}.`,
        `Tidied the flat, curry, ${deMin} min podcast — entry ${evalN}.`,
        `Coffee on half-marathon recovery; note ${evalN}.`,
        `Check-up fine, dentist booked — weekend ${evalN}.`,
        `Rainy tax forms and a German podcast; ref ${evalN}.`,
        `Bookstore by the museums; German tech book #${evalN}.`,
      ];
      return `${lines[dayIndex % lines.length]}${tail}`;
    }
    if (d >= 60) {
      return `Summer pipeline: metadata on eval item ${evalN}, metric registry entry “factuality v${(dayIndex % 9) + 1}”.${tail || " 25 min German listening tonight."}`;
    }
    if (d >= 30) {
      return `Autumn drift (item ${evalN}): refusal +${(dayIndex % 3) + 1}%, bins updated; experiment review notes.${tail || ` ${km} km easy run.`}`;
    }
    return `Pre-rollout #${evalN}: model v${(dayIndex % 4) + 2} table, ${labels} prompt eval runs; B2 connectors.${tail}`;
  };

  const de = () => {
    if (twoPart) {
      const today = weekend
        ? `Heute: zu Hause gekocht, ${deMin} Min. Deutsch gehört, kein Arbeitslaptop.`
        : `Heute: Eval-Set bei ${evalN} Einträgen, ${labels} Labels korrigiert; Drift-Bins aktualisiert.`;
      const tomorrow = weekend
        ? "Morgen: leichter Lauf nach Plan, B2-Hausaufgaben."
        : `Morgen: Ranking-v3-Review, Runde ${(dayIndex % 5) + 2} mit dem Produkt.`;
      return `${today}\n\nMorgen:\n${tomorrow}${tail}`;
    }
    if (weekend) {
      const lines = [
        `Ruhiges Wochenende in Kreuzberg; Versicherung sortiert (Eintrag ${evalN}).`,
        `Ausgeschlafen, ${km} km, ${pages} Seiten — Log ${evalN}.`,
        `Aufgeräumt, Curry, ${deMin} Min. Podcast — Nr. ${evalN}.`,
        `Kaffee über Halbmarathon-Erholung; Notiz ${evalN}.`,
        `Check-up okay, Zahnarzt gebucht — Wochenende ${evalN}.`,
        `Regentag Steuerformulare und Podcast; Ref ${evalN}.`,
        `Buchhandlung an den Museen; Tech-Buch ${evalN}.`,
      ];
      return `${lines[dayIndex % lines.length]}${tail}`;
    }
    if (d >= 60) {
      return `Sommer-Pipeline: Metadaten für Eval-Eintrag ${evalN}, Metrik „Faktentreue v${(dayIndex % 9) + 1}“ registriert.${tail || " Abends 25 Min. Deutsch."}`;
    }
    if (d >= 30) {
      return `Herbst-Drift (Eintrag ${evalN}): Ablehnung +${(dayIndex % 3) + 1} %, Bins aktualisiert; Review-Notizen.${tail || ` ${km} km locker.`}`;
    }
    return `Vor Rollout #${evalN}: Modell v${(dayIndex % 4) + 2}, ${labels} Prompt-Läufe; B2-Konnektoren.${tail}`;
  };

  const body = lang === "zh" ? zh() : lang === "de" ? de() : en();
  return body.trim();
}

function moodReasonFor(lang, dayIndex, mood, note, eventTitle) {
  if (eventTitle) return clampMoodReason(lang, eventTitle);
  const firstLine = String(note || "").split("\n")[0].trim();
  if (firstLine) return clampMoodReason(lang, firstLine);
  const d = daysBeforeToday(dayIndex);
  const zh = [
    "流水线全绿", "会议太密", "实验更诚实", `${5 + (dayIndex % 8)}公里跑完`, "德语故事讲完",
    "半夜修管道", "口径对齐了", "河边走一圈", "睡得太晚", "正则化想通",
    "漂移图清楚", "时区坑一天", "分享反响好", "冥想后安定", "深蹲加重量",
    "雨天写周报", "五百条里程碑", "朋友聚餐聊方向", "屏幕时间超标", "德语电话顺利",
    "仪表盘被转发", "森林徒步放空", "灰度表整理完", "B2听力71分", "半马计划更真",
    "指标砍到六个", "ranking评审累", "保险材料搞定", "体检报告正常", "轻松跑很舒服",
  ];
  const en = [
    "Pipeline all green", "Meetings packed", "Honest null result", `${5 + (dayIndex % 8)} km done`, "User story in German",
    "Fixed pipeline at dawn", "Metrics aligned", "Spree walk helped", "Short sleep", "Regularisation clicked",
    "Drift charts clear", "Timezone rabbit hole", "Talk went well", "Calmer after meditation", "Heavier squats",
    "Rainy report day", "500-item milestone", "Dinner on direction", "Too much screen", "German call worked",
    "Dashboard shared", "Forest reset", "Rollout table done", "B2 listening 71", "Half plan feels real",
    "Six metrics left", "Ranking review tiring", "Insurance sorted", "Check-up fine", "Easy run felt good",
  ];
  const de = [
    "Pipeline komplett grün", "Termine dicht", "Ehrliches Null-Ergebnis", `${5 + (dayIndex % 8)} km geschafft`, "User Story auf Deutsch",
    "Pipeline früh repariert", "Metriken abgestimmt", "Spree-Spaziergang", "Zu wenig Schlaf", "Regularisierung klar",
    "Drift-Grafiken klar", "Zeitzonen-Falle", "Vortrag gut angekommen", "Ruhiger nach Meditation", "Schwereres Training",
    "Regentag, Wochenbericht", "500-Einträge-Meilenstein", "Abend über Richtung", "Zu viel Bildschirm", "Anruf auf Deutsch",
    "Dashboard geteilt", "Wald hat geholfen", "Rollout-Tabelle fertig", "B2 Hören 71", "Halbmarathon-Plan real",
    "Nur sechs Metriken", "Ranking-Review anstrengend", "Versicherung erledigt", "Check-up okay", "Lockerer Lauf gut",
  ];
  const pool = lang === "zh" ? zh : lang === "de" ? de : en;
  const base = pool[dayIndex % pool.length];
  if (lang === "zh") return clampMoodReason(lang, `${base}·${d % 10}`);
  return base;
}

export function demoEventText(event, lang) { return event[lang] || event.en; }

export function demoDayContent(lang, dayIndex, weekday, completed) {
  const d = daysBeforeToday(dayIndex);
  const event = EVENT_BY_D.get(d);
  if (event) {
    const [title, story] = demoEventText(event, lang);
    return { mood: event.mood, moodReason: clampMoodReason(lang, title), note: story };
  }
  const note = composeNote(lang, dayIndex, weekday, completed);
  const mood = moodForDay(dayIndex, weekday, d);
  const moodReason = moodReasonFor(lang, dayIndex, mood, note, "");
  return { mood, moodReason, note };
}

// Kept for tests or older imports — delegates to the new journal builder.
export function demoDayLine(lang, dayIndex, weekday, completed) {
  return demoDayContent(lang, dayIndex, weekday, completed).note;
}
