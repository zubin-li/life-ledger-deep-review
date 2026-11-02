// Three months of a fictional sample life: dated events with a photo and a calendar entry,
// plus deterministic journal lines for every day in the 90-day window. Pure data, local demo only.
// d = days before today (0 = today). mood: 0 低落 / 1 平静 / 2 很好. photo = DEMO_MEMORY_ASSETS id.

export const DEMO_EVENTS = [
  { d: 88, mood: 2, photo: ["team-offsite-lake"], time: "10:00", zh: ["团队湖边 offsite", "季度启动 offsite，在湖边的木栈道上讨论下季度的评估路线图。决定先把评估集做大，再谈自动化。"], en: ["Team offsite by the lake", "Quarter kick-off by the lake. On the jetty we agreed: grow the eval set first, automate later."], de: ["Team-Offsite am See", "Quartalsstart am See. Auf dem Steg beschlossen: erst das Eval-Set vergrößern, dann automatisieren."] },
  { d: 83, mood: 2, photo: ["weekend-hike"], time: "", zh: ["勃兰登堡森林徒步", "周末森林徒步 18 公里，一整天没看手机。回来做了一顿像样的饭。"], en: ["Forest hike in Brandenburg", "18 km forest hike, phone off all day. Cooked a proper dinner afterwards."], de: ["Waldwanderung in Brandenburg", "18 km im Wald, den ganzen Tag ohne Handy. Danach richtig gekocht."] },
  { d: 77, mood: 2, photo: ["cafe-reading"], time: "", zh: ["读完一本期待很久的书", "周末在咖啡馆读完最后三章，整理了两页笔记。接下来想把阅读时间固定下来。"], en: ["Finished a long-awaited book", "Finished the last three chapters at a café and wrote two pages of notes. Next: protect a regular reading hour."], de: ["Ein lange erwartetes Buch beendet", "Im Café die letzten drei Kapitel gelesen und zwei Seiten Notizen geschrieben. Als Nächstes bekommt Lesen einen festen Platz."] },
  { d: 71, mood: 2, photo: ["hackathon-night"], time: "18:00", zh: ["内部黑客松", "黑客松做到凌晨一点：用 LLM 给客服工单自动打标签，准确率 81%，拿了第二名。"], en: ["Internal hackathon", "Hackathon until 1 a.m.: LLM auto-tagging for support tickets, 81% accuracy, second place."], de: ["Interner Hackathon", "Hackathon bis 1 Uhr: LLM-Tagging für Support-Tickets, 81 % Genauigkeit, zweiter Platz."] },
  { d: 66, mood: 2, photo: ["dinner-friends"], time: "19:30", zh: ["和朋友在克罗伊茨贝格吃饭", "和朋友吃越南粉，聊到要不要转去做 AI 产品分析。答案还没有，但问题更清楚了。"], en: ["Dinner with friends in Kreuzberg", "Pho with friends; talked about moving into AI product analytics. No answer yet, a clearer question."], de: ["Essen mit Freunden in Kreuzberg", "Pho mit Freunden; über den Wechsel in AI-Produktanalyse gesprochen. Noch keine Antwort, aber eine klarere Frage."] },
  { d: 61, mood: 1, photo: ["museum-sunday"], time: "14:00", zh: ["周日去博物馆岛", "一个人在博物馆岛待了一下午。很安静，想清楚了下个月只追三件事。"], en: ["Sunday at Museum Island", "An afternoon alone at Museum Island. Quiet; decided to chase only three things next month."], de: ["Sonntag auf der Museumsinsel", "Ein Nachmittag allein auf der Museumsinsel. Ruhig; nächsten Monat nur drei Dinge verfolgen."] },
  { d: 56, mood: 0, photo: ["dashboard-screen"], time: "", zh: ["数据管道故障", "凌晨管道挂了：上游表字段改名。补了 schema 检查和告警说明。很累，但修好后很踏实。"], en: ["Pipeline outage", "Pipeline broke overnight: an upstream column was renamed. Added a schema check and alert notes. Tired, but solid."], de: ["Pipeline-Ausfall", "Nachts brach die Pipeline: eine Spalte wurde umbenannt. Schema-Check und Alarmhinweise ergänzt. Müde, aber stabil."] },
  { d: 50, mood: 1, photo: ["market-haul"], time: "09:30", zh: ["周六逛农夫市集", "周六早上去 Maybachufer 市集，买了一周的菜和一束花。慢一点的早晨很好。"], en: ["Saturday farmers' market", "Maybachufer market on Saturday morning: a week of vegetables and some flowers. Slow mornings help."], de: ["Samstag auf dem Markt", "Samstagmorgen Markt am Maybachufer: Gemüse für die Woche und Blumen. Langsame Morgen tun gut."] },
  { d: 45, mood: 2, photo: ["meetup-talk"], time: "19:00", zh: ["Meetup 分享：评估会胡说的模型", "在 Data Berlin Meetup 讲「如何评估一个会胡说的模型」。会后两个人追着问标注一致性怎么算。"], en: ["Meetup talk: evaluating models that make things up", "Talk at the Data Berlin meetup on evaluating models that hallucinate. Two people stayed to ask about annotator agreement."], de: ["Meetup-Vortrag: Modelle bewerten, die erfinden", "Vortrag beim Data-Berlin-Meetup über halluzinierende Modelle. Zwei blieben, um nach Annotator-Übereinstimmung zu fragen."] },
  { d: 41, mood: 2, photo: ["run-park"], time: "08:00", zh: ["长距离跑 14 公里", "Tiergarten 长跑 14 公里，最后两公里很难，但坚持下来了。半马好像没那么远。"], en: ["Long run, 14 km", "14 km through the Tiergarten. The last two were hard, but done. The half marathon feels closer."], de: ["Langer Lauf, 14 km", "14 km durch den Tiergarten. Die letzten zwei waren hart, aber geschafft. Der Halbmarathon rückt näher."] },
  { d: 37, mood: 2, photo: ["birthday-dinner"], time: "19:00", zh: ["生日晚餐", "朋友们在家一起做饭。许的愿很简单：明年这个时候，仍然有时间认真生活。"], en: ["Birthday dinner", "Friends cooked dinner together at home. One simple wish: still make time for a considered life next year."], de: ["Geburtstagsessen", "Freunde haben zu Hause gemeinsam gekocht. Ein einfacher Wunsch: auch nächstes Jahr Zeit für ein bewusstes Leben haben."] },
  { d: 33, mood: 2, photo: ["ai-conference"], time: "09:00", zh: ["参加 AI 大会", "参加柏林 AI 大会。最有用的一场讲 LLM 评估里的数据泄漏，记了满满两页笔记。"], en: ["AI conference", "Berlin AI conference. The best session was on data leakage in LLM evals — two pages of notes."], de: ["AI-Konferenz", "AI-Konferenz in Berlin. Bester Vortrag: Datenlecks in LLM-Evaluierungen — zwei Seiten Notizen."] },
  { d: 28, mood: 1, photo: ["team-whiteboard"], time: "14:00", zh: ["评估指标设计会", "白板上把 17 个指标砍到 6 个，每个都要回答一个产品问题。"], en: ["Metric design session", "Cut 17 metrics down to 6 on the whiteboard; each one must answer a product question."], de: ["Metrik-Workshop", "Am Whiteboard 17 Metriken auf 6 reduziert; jede muss eine Produktfrage beantworten."] },
  { d: 24, mood: 1, photo: ["cafe-reading"], time: "", zh: ["咖啡馆读书", "在咖啡馆读《DDIA》讲日志的那章，突然理解了我们事件表为什么总对不上。"], en: ["Reading at the café", "Read the log chapter of DDIA at a café and finally saw why our event tables never reconcile."], de: ["Lesen im Café", "Im Café das Log-Kapitel von DDIA gelesen — endlich verstanden, warum unsere Event-Tabellen nie übereinstimmen."] },
  { d: 20, mood: 1, photo: ["meditation-corner"], time: "", zh: ["冥想连续 14 天", "冥想连续第 14 天。发现最焦虑的时刻总在开会前五分钟，现在会先深呼吸三次。"], en: ["14 days of meditation", "Day 14 of meditation in a row. The most anxious moment is always five minutes before a meeting; now I breathe first."], de: ["14 Tage Meditation", "14. Tag Meditation am Stück. Am nervösesten bin ich fünf Minuten vor Meetings; jetzt erst dreimal atmen."] },
  { d: 16, mood: 2, photo: ["gym-weights"], time: "18:30", zh: ["力量训练加重量", "深蹲加到 60 公斤。为了半马，腿必须更结实。"], en: ["Heavier strength session", "Squats up to 60 kg. The legs need to be stronger for the half marathon."], de: ["Schwereres Krafttraining", "Kniebeugen mit 60 kg. Für den Halbmarathon müssen die Beine stärker werden."] },
  { d: 12, mood: 2, photo: ["halfmarathon-medal", "run-park"], time: "09:00", zh: ["完成柏林半程马拉松", "完成半马！1:58:40，比目标快一分多钟。最后一公里大家在路边喊加油，差点哭了。"], en: ["Finished the Berlin half marathon", "Half marathon done! 1:58:40, a minute under target. The crowd in the last kilometre nearly made me cry."], de: ["Berliner Halbmarathon geschafft", "Halbmarathon geschafft! 1:58:40, eine Minute unter dem Ziel. Der letzte Kilometer mit dem Publikum — fast geweint."] },
  { d: 9, mood: 1, photo: ["spree-sunset"], time: "", zh: ["施普雷河边散步", "下班后沿施普雷河走回家，晚霞很好。决定每周至少一天不加班。"], en: ["Walk along the Spree", "Walked home along the Spree after work; great sunset. At least one evening a week without overtime."], de: ["Spaziergang an der Spree", "Nach der Arbeit an der Spree entlang nach Hause; schöner Sonnenuntergang. Mindestens ein Abend pro Woche ohne Überstunden."] },
  { d: 6, mood: 1, photo: ["notebook-plan"], time: "18:30", zh: ["整理个人计划", "重新看了这个月的清单，删掉三件不重要的事，只留下工作、健康和休息。"], en: ["Simplified the personal plan", "Reviewed the month, removed three low-value commitments, and kept work, health, and rest."], de: ["Den persönlichen Plan vereinfacht", "Den Monat geprüft, drei unwichtige Vorhaben gestrichen und Arbeit, Gesundheit sowie Erholung behalten."] },
  { d: 3, mood: 2, photo: ["notebook-plan"], time: "", zh: ["规划下一阶段", "把下一阶段写进本子：完成当前项目、保持运动、每周留一个完整的晚上休息。"], en: ["Planning the next phase", "Wrote the next phase in the notebook: finish the current project, keep moving, and reserve one free evening each week."], de: ["Die nächste Phase planen", "Die nächste Phase notiert: aktuelles Projekt abschließen, in Bewegung bleiben und jede Woche einen freien Abend schützen."] },
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
    zh: { exercise: "跑了 {k} 公里", reading: "读了 {p} 页书", language: "语言学习 {m} 分钟", deepwork: "深度工作 {h} 小时", meditation: "冥想 10 分钟", strength: "力量训练" },
    en: { exercise: "ran {k} km", reading: "read {p} pages", language: "{m} min of language practice", deepwork: "{h} h deep work", meditation: "10 min meditation", strength: "strength training" },
    de: { exercise: "{k} km gelaufen", reading: "{p} Seiten gelesen", language: "{m} Min. Sprachpraxis", deepwork: "{h} Std. Deep Work", meditation: "10 Min. Meditation", strength: "Krafttraining" },
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
  const weekend = weekday === 0 || weekday === 6;
  const km = 5 + (dayIndex % 8);
  const pages = 15 + (dayIndex % 10);
  const minutes = 20 + (dayIndex % 12);
  const tail = habitTail(lang, dayIndex, completed);
  const entry = dayIndex + 1;
  const line = dayIndex % 6;
  const zhLines = weekend ? [
    `睡到自然醒，去公园走了 ${km} 公里，回来顺路取了快递。`,
    `早上去菜市场买了一周的菜，晚上和家里视频 ${minutes} 分钟。`,
    `和朋友吃了顿火锅，下午没有再安排必须完成的事情。`,
    `雨天留在家里整理相册，也把下周的家庭安排写进日历。`,
    `确认了下次回家的高铁时间，晚饭后读了 ${pages} 页书。`,
    `在附近街区散步，顺手处理了物业报修和水电账单。`,
  ] : [
    `早高峰有点挤，上午先完成最重要的事，下班前去快递柜取件。`,
    `午休在楼下走了一圈，晚上买菜回家做了简单的饭。`,
    `白天安排得比较满，仍然在睡前留了 ${minutes} 分钟阅读。`,
    `把拖了几天的物业消息回完，晚上给家里打了电话。`,
    `今天只认真完成一件事，晚饭后在小区走了 ${km} 公里。`,
    `临时调整了计划，把不重要的事情挪到周末集中处理。`,
  ];
  const enLines = weekend ? [
    `A slow start, a ${km} km canal walk, then the weekly food shop.`,
    `Returned two library books, collected a hold, and made a simple Sunday lunch.`,
    `Tea with a friend turned into a long catch-up; nothing else needed finishing.`,
    `Rain all afternoon, so the photos were sorted and next week's train was booked.`,
    `Walked to the market, bought flowers, and read ${pages} pages back at home.`,
    `A pub quiz in the evening after a quiet morning with the papers and tea.`,
  ] : [
    `Checked the trains before breakfast and finished the main task before lunch.`,
    `A focused morning; the walk round the block between showers helped.`,
    `More calls than expected, but the library return still made it into the day.`,
    `Replied to the council email and put the recycling out before bed.`,
    `Kept the evening free, made tea, and read for ${minutes} minutes.`,
    `The train was delayed, so the plan got smaller and dinner stayed simple.`,
  ];
  const deLines = weekend ? [
    `Ausgeschlafen, auf dem Wochenmarkt eingekauft und danach ${km} km durch den Kiez gelaufen.`,
    `Das Fahrradlicht abgeholt, Pfand weggebracht und zu Hause Abendbrot gemacht.`,
    `Kaffee mit einem Freund, danach ein freier Nachmittag ohne Erledigungen.`,
    `Ein Regentag zum Fotosortieren und für den Versicherungsbrief auf dem Schreibtisch.`,
    `Gemüse und Blumen auf dem Markt gekauft, danach ${pages} Seiten gelesen.`,
    `Flohmarkt im Kiez, später Altglas weggebracht und ruhig gekocht.`,
  ] : [
    `Vor dem Frühstück das Fahrrad geprüft und die wichtigste Aufgabe zuerst erledigt.`,
    `Ein konzentrierter Morgen; der Mittagsspaziergang durch den Kiez half.`,
    `Mehr Termine als erwartet, aber der Bibliotheksweg passte noch hinein.`,
    `Bürgeramt-Unterlagen geprüft und den Abend bewusst früher beendet.`,
    `Nach Feierabend Altglas und Pfand erledigt, danach ruhig Abendbrot gegessen.`,
    `Der Termin verschob sich; ohne die unwichtigen Punkte wurde der Tag leichter.`,
  ];
  const base = lang === "zh" ? zhLines[line] : lang === "de" ? deLines[line] : enLines[line];
  const marker = lang === "zh" ? `记录 ${entry}` : lang === "de" ? `Notiz ${entry}` : `Entry ${entry}`;
  const body = `${base} ${marker}.${tail}`;
  return body.trim();
}

const RICH_DAILY_POOLS = {
  zh: {
    weekday: [
      "早高峰比平时顺，上午先把最费脑子的事情完成了。",
      "出门时下雨，临时改坐地铁，原来的安排往后挪了半小时。",
      "午休没有刷手机，沿街走了一圈，下午的注意力好了很多。",
      "白天被几个临时消息打断，傍晚重新列了一次轻重缓急。",
      "上午状态一般，吃完午饭后才慢慢进入节奏。",
      "今天的会议比预计早结束，多出一段完整的安静时间。",
      "下班前把拖了几天的小事处理掉，回家路上明显轻松了。",
      "通勤路上听完一期播客，记下了两个之后想继续了解的问题。",
      "中午和同事换了一家小店吃饭，短暂离开熟悉路线很放松。",
      "下午计划突然变化，删掉两个不重要的安排后反而更顺。",
      "早上先去办了一件生活事务，回来以后才正式开始今天。",
      "今天没有追求全部做完，只守住了一个完整的专注时段。",
    ],
    weekend: [
      "睡到自然醒，去菜市场买了一周的蔬菜和水果。",
      "上午和朋友打羽毛球，结束后在附近吃了一顿简单午饭。",
      "去公共图书馆还书，又随手借了两本没有计划过的书。",
      "陪家人在公园走了一大圈，下午回家一起做饭。",
      "逛了一个小展览，最喜欢的部分反而是出口处的旧照片。",
      "坐公交去了没怎么走过的街区，慢慢逛到天黑才回家。",
      "上午集中整理房间，下午什么也没安排，只在家听音乐。",
      "和朋友约了火锅，饭后沿河走了一段才坐车回家。",
      "早起去公园跑步，回来买早餐，也顺手把快递取了。",
      "晚上去看了一场电影，散场后和朋友聊了很久。",
      "给家里打了很久的视频电话，顺便商量下次见面的时间。",
      "去社区活动室参加了一次手作活动，过程比成品更有趣。",
    ],
    detail: [
      "路过快递柜时一次取走了三个包裹。", "晚饭前去超市补了牛奶、鸡蛋和水果。", "把水电账单和本月支出一起核对了一遍。", "物业回复了报修，约好下周上门。",
      "在手机上确认了周末的高铁票。", "把冰箱里快过期的食材做成了晚饭。", "下楼扔垃圾时多走了两圈。", "给一位很久没联系的朋友发了消息。",
      "在药店补了常用药和创可贴。", "把相册里重复的照片删掉了一批。", "洗完衣服以后顺手整理了衣柜。", "晚饭后读了二十多页书。",
      "取消了一个其实并不想参加的活动。", "睡前把第二天要带的东西放到了门口。", "家庭群里聊起假期安排，最后定下了大致日期。", "路边新开的面包店终于去试了一次。",
    ],
    reflection: [
      "今天最有用的不是完成得多，而是没有把事情堆到晚上。", "琐事集中处理以后，脑子安静了不少。", "计划留出一点空白，临时变化就没有那么烦。", "和人认真聊一会儿，比继续刷手机更能恢复精神。",
      "普通的一天也有值得留下来的细节。", "晚上早点停下来，第二天往往更容易开始。", "没有强迫自己保持高效率，状态反而慢慢回来了。", "今天的节奏不完美，但生活的几个部分都照顾到了。",
      "出门走一走以后，原来纠结的事没有那么严重。", "把一个小问题真正处理掉，比列十条计划更安心。", "今天值得记住的是一顿饭和一段没有赶时间的路。", "少安排一件事，给自己留下了真正休息的时间。",
    ],
  },
  en: {
    weekday: [
      "The train was on time for once, so the morning began without a rush.",
      "Heavy rain changed the commute and moved the first plan back by half an hour.",
      "A walk round the block at lunch cleared the fog from a crowded morning.",
      "Several unexpected calls broke up the day, so the afternoon list got rewritten.",
      "The morning started slowly, but a quiet hour after lunch finally settled things.",
      "One meeting ended early and left a useful pocket of uninterrupted time.",
      "A postponed piece of household admin was finished before heading home.",
      "A podcast on the bus left two ideas worth writing down later.",
      "Lunch came from a small place round the corner instead of the usual desk sandwich.",
      "The plan changed twice; dropping the least important task kept the day manageable.",
      "The morning began with an appointment, then the rest of the day found its rhythm.",
      "Nothing heroic today: one proper focus block and a sensible stopping time.",
    ],
    weekend: [
      "A slow morning at the local market, followed by coffee on a bench outside.",
      "Met a friend for a canal walk and stayed out longer than planned.",
      "Returned library books, collected a hold, and browsed until lunchtime.",
      "Sunday lunch stretched into tea because nobody was in a hurry to leave.",
      "Visited a free museum exhibition and spent most time in one quiet gallery.",
      "Took the train to a nearby town with no plan beyond walking and finding lunch.",
      "Tidied the flat in the morning and kept the entire afternoon unscheduled.",
      "The pub quiz was mostly guesses, but the team somehow finished in the middle.",
      "Went for a park run, bought breakfast on the way back, and did very little afterwards.",
      "An evening film turned into a long conversation on the walk home.",
      "The flower market was busy, so the visit stayed short and ended with tea nearby.",
      "A second-hand bookshop produced one good find and a much longer walk than expected.",
    ],
    detail: [
      "The recycling went out before it could be forgotten again.", "Picked up milk, bread, and fruit on the way home.", "Checked the energy bill and moved it into the paid folder.", "The council finally replied to the earlier email.",
      "Booked next week's train before the cheaper tickets disappeared.", "Dinner used the vegetables already waiting in the fridge.", "A short walk happened between two showers.", "Sent a message to someone who had been quiet for a while.",
      "Confirmed the GP appointment and added the journey time.", "Sorted a month of photos into one small album.", "Put on a wash and cleared the chair that had become a wardrobe.", "Read a few chapters with a mug of tea after dinner.",
      "Declined an invitation that would have made the week too full.", "Packed tomorrow's bag before sitting down for the evening.", "The library reminder arrived at exactly the right time.", "Tried the new bakery near the station instead of rushing past it.",
    ],
    reflection: [
      "Finishing fewer things properly felt better than carrying a long list into the evening.", "Putting errands in one block made the rest of the day feel much larger.", "A little empty space in the diary made every change easier to absorb.", "A real conversation restored more energy than another hour online.",
      "An ordinary day still had several details worth remembering.", "Stopping earlier tonight will make tomorrow easier to begin.", "The pace improved once productivity stopped being the only measure of the day.", "The day was imperfect, but work, food, movement, and rest all had a place.",
      "Walking changed the size of a problem that had felt too large indoors.", "One annoying task properly finished brought more relief than ten new plans.", "The part worth keeping was a meal and a journey without rushing.", "Saying no to one plan created the first real rest of the week.",
    ],
  },
  de: {
    weekday: [
      "Die S-Bahn war pünktlich, dadurch begann der Morgen ungewöhnlich ruhig.",
      "Regen änderte den Weg; mit der U-Bahn verschob sich der erste Termin um eine halbe Stunde.",
      "Ein kurzer Spaziergang im Kiez machte den Kopf nach dem Vormittag wieder frei.",
      "Mehrere unerwartete Anrufe zerschnitten den Tag, deshalb wurde die Nachmittagsliste neu sortiert.",
      "Der Morgen lief langsam an, erst nach der Mittagspause kam ein guter Rhythmus.",
      "Ein Termin endete früher und schenkte eine ungestörte Stunde.",
      "Vor dem Heimweg wurde endlich ein lange aufgeschobener Brief erledigt.",
      "Im Radio lief ein Gespräch, aus dem zwei gute Gedanken im Notizbuch landeten.",
      "Mittagessen heute nicht am Schreibtisch, sondern im kleinen Laden um die Ecke.",
      "Der Plan änderte sich zweimal; ohne den unwichtigsten Punkt blieb der Tag leicht.",
      "Der Morgen begann mit einem Amtstermin, danach fand der Tag langsam seinen Takt.",
      "Heute kein Perfektionismus: ein guter Fokusblock und rechtzeitig Feierabend.",
    ],
    weekend: [
      "Samstagmorgen auf dem Wochenmarkt, danach Kaffee in der Sonne.",
      "Mit einem Freund am Kanal entlanggelaufen und länger draußen geblieben als geplant.",
      "Bücher in der Stadtbibliothek zurückgegeben und bis mittags dort geblieben.",
      "Langes Frühstück mit Freunden, niemand musste schnell weiter.",
      "Eine kleine Ausstellung besucht und lange in einem einzigen Raum geblieben.",
      "Mit der Regionalbahn an einen See gefahren, nur zum Laufen und Mittagessen.",
      "Vormittags die Wohnung geordnet, der Nachmittag blieb vollständig frei.",
      "Beim Kneipenquiz vieles geraten und trotzdem nicht Letzter geworden.",
      "Im Park gelaufen, Brötchen geholt und danach bewusst nichts Großes geplant.",
      "Ein Kinofilm führte zu einem langen Gespräch auf dem Heimweg.",
      "Auf dem Flohmarkt eine gute Schallplatte gefunden und sonst nichts gekauft.",
      "Im Repair-Café eine alte Lampe wieder zum Leuchten gebracht.",
    ],
    detail: [
      "Altglas und Papier wurden endlich auf dem Heimweg weggebracht.", "Milch, Brot und Gemüse kamen noch in den Fahrradkorb.", "Der Versicherungsbrief ist gelesen und abgeheftet.", "Das Bürgeramt bestätigte den Termin per E-Mail.",
      "Die Regionalbahn für nächste Woche wurde früh gebucht.", "Aus dem Gemüse im Kühlschrank wurde ein einfaches Abendessen.", "Zwischen zwei Regenschauern passte eine Runde um den Block.", "Eine Nachricht ging an jemanden, von dem lange nichts zu hören war.",
      "Der Hausarzttermin ist bestätigt und mit Fahrzeit im Kalender.", "Ein Monat Fotos wurde in ein kleines Album sortiert.", "Wäsche gemacht und den Stuhl von seinem Kleiderberg befreit.", "Nach dem Abendbrot noch ein paar Kapitel gelesen.",
      "Eine Einladung abgesagt, damit die Woche nicht zu voll wird.", "Die Tasche für morgen stand schon vor dem Abend bereit.", "Pfand weggebracht und dabei gleich das Fahrradlicht geprüft.", "Die neue Bäckerei an der Haltestelle endlich ausprobiert.",
    ],
    reflection: [
      "Weniger Dinge richtig zu erledigen fühlte sich besser an als eine lange offene Liste.", "Gebündelte Wege ließen den Rest des Tages viel größer wirken.", "Etwas Luft im Kalender machte jede Änderung leichter.", "Ein echtes Gespräch gab mehr Energie zurück als eine weitere Stunde am Bildschirm.",
      "Auch ein gewöhnlicher Tag hatte mehrere Details, die bleiben dürfen.", "Heute früher aufzuhören macht den morgigen Anfang leichter.", "Der Rhythmus wurde besser, als Leistung nicht mehr das einzige Maß war.", "Der Tag war nicht perfekt, aber Arbeit, Essen, Bewegung und Ruhe hatten Platz.",
      "Draußen wurde ein Problem kleiner, das drinnen zu groß gewirkt hatte.", "Eine lästige Sache wirklich zu beenden beruhigte mehr als zehn neue Pläne.", "Bleiben werden ein Essen und ein Weg ohne Eile.", "Ein abgesagter Termin schuf die erste echte Pause der Woche.",
    ],
  },
};

function composeRichNote(lang, dayIndex, weekday, completed) {
  const key = lang === "zh" || lang === "de" ? lang : "en";
  const pools = RICH_DAILY_POOLS[key];
  const weekend = weekday === 0 || weekday === 6;
  const primaryPool = weekend ? pools.weekend : pools.weekday;
  const primary = primaryPool[(dayIndex * 5 + Math.floor(dayIndex / 9)) % primaryPool.length];
  const detail = pools.detail[(dayIndex * 7 + weekday * 3 + Math.floor(dayIndex / 11)) % pools.detail.length];
  const reflection = pools.reflection[(dayIndex * 11 + Math.floor(dayIndex / 7)) % pools.reflection.length];
  const habit = habitTail(key, dayIndex, completed);
  const suffix = key === "zh" && habit ? ` ${habit.replace(/^，/, "")}` : habit;
  return `${primary} ${detail} ${reflection}${suffix}`.trim();
}

function moodReasonFor(lang, dayIndex, mood, note, eventTitle) {
  if (eventTitle) return clampMoodReason(lang, eventTitle);
  const firstLine = String(note || "").split("\n")[0].trim();
  if (firstLine) return clampMoodReason(lang, firstLine);
  const d = daysBeforeToday(dayIndex);
  const zh = [
    "流水线全绿", "会议太密", "实验更诚实", `${5 + (dayIndex % 8)}公里跑完`, "阅读时间守住了",
    "半夜修管道", "口径对齐了", "河边走一圈", "睡得太晚", "正则化想通",
    "漂移图清楚", "时区坑一天", "分享反响好", "冥想后安定", "深蹲加重量",
    "雨天写周报", "五百条里程碑", "朋友聚餐聊方向", "屏幕时间超标", "重要电话顺利",
    "仪表盘被转发", "森林徒步放空", "灰度表整理完", "计划终于简化", "半马计划更真",
    "指标砍到六个", "ranking评审累", "保险材料搞定", "体检报告正常", "轻松跑很舒服",
  ];
  const en = [
    "Pipeline all green", "Meetings packed", "Honest null result", `${5 + (dayIndex % 8)} km done`, "Protected reading time",
    "Fixed pipeline at dawn", "Metrics aligned", "Spree walk helped", "Short sleep", "Regularisation clicked",
    "Drift charts clear", "Timezone rabbit hole", "Talk went well", "Calmer after meditation", "Heavier squats",
    "Rainy report day", "500-item milestone", "Dinner on direction", "Too much screen", "Important call went well",
    "Dashboard shared", "Forest reset", "Rollout table done", "Plan finally simpler", "Half plan feels real",
    "Six metrics left", "Ranking review tiring", "Insurance sorted", "Check-up fine", "Easy run felt good",
  ];
  const de = [
    "Pipeline komplett grün", "Termine dicht", "Ehrliches Null-Ergebnis", `${5 + (dayIndex % 8)} km geschafft`, "Lesezeit geschützt",
    "Pipeline früh repariert", "Metriken abgestimmt", "Spree-Spaziergang", "Zu wenig Schlaf", "Regularisierung klar",
    "Drift-Grafiken klar", "Zeitzonen-Falle", "Vortrag gut angekommen", "Ruhiger nach Meditation", "Schwereres Training",
    "Regentag, Wochenbericht", "500-Einträge-Meilenstein", "Abend über Richtung", "Zu viel Bildschirm", "Wichtiger Anruf lief gut",
    "Dashboard geteilt", "Wald hat geholfen", "Rollout-Tabelle fertig", "Plan endlich einfacher", "Halbmarathon-Plan real",
    "Nur sechs Metriken", "Ranking-Review anstrengend", "Versicherung erledigt", "Check-up okay", "Lockerer Lauf gut",
  ];
  const pool = lang === "zh" ? zh : lang === "de" ? de : en;
  const base = pool[dayIndex % pool.length];
  if (lang === "zh") return clampMoodReason(lang, `${base}·${d % 10}`);
  return base;
}

const PERSONAL_EVENT_TEXT = {
  88: { zh: ["湖边的一天", "在湖边散步、聊天，也认真写下了接下来三个月想保留的生活重点。"], en: ["A day by the lake", "Walked, talked, and wrote down the few things worth protecting over the next three months."], de: ["Ein Tag am See", "Spaziert, geredet und die wenigen Dinge notiert, die in den nächsten drei Monaten wichtig bleiben sollen."] },
  71: { zh: ["周末创意工作坊", "和几位朋友做了一晚上的小作品，过程比结果更有趣。"], en: ["Weekend creative workshop", "Made small things with friends for an evening; the process mattered more than the result."], de: ["Kreativabend am Wochenende", "Mit Freunden kleine Dinge gestaltet; der Prozess war wichtiger als das Ergebnis."] },
  66: { zh: ["和朋友吃晚餐", "边吃饭边聊近况，也决定给休息和关系留出更多时间。"], en: ["Dinner with friends", "Caught up over dinner and decided to leave more room for rest and relationships."], de: ["Abendessen mit Freunden", "Beim Essen ausgetauscht und beschlossen, mehr Raum für Erholung und Beziehungen zu lassen."] },
  56: { zh: ["计划被打乱的一天", "临时状况占掉了上午，下午重新排序，只保留真正重要的事情。"], en: ["A disrupted day", "A surprise took the morning; the afternoon plan kept only what genuinely mattered."], de: ["Ein unterbrochener Tag", "Etwas Unerwartetes nahm den Morgen ein; am Nachmittag blieb nur das wirklich Wichtige."] },
  45: { zh: ["朋友读书会", "每个人分享一本最近喜欢的书，最后聊得比计划更久。"], en: ["Book evening with friends", "Everyone shared a recent favourite, and the conversation lasted longer than planned."], de: ["Bücherabend mit Freunden", "Alle stellten ein Lieblingsbuch vor; das Gespräch dauerte länger als geplant."] },
  33: { zh: ["城市里的公开讲座", "听了一场关于创作与注意力的讲座，记下了两页笔记。"], en: ["Public talk in the city", "A talk on creativity and attention left two pages of notes."], de: ["Öffentlicher Vortrag in der Stadt", "Ein Vortrag über Kreativität und Aufmerksamkeit füllte zwei Seiten Notizen."] },
  28: { zh: ["重新整理本月计划", "把原来的十几个安排缩减成四件真正重要的事。"], en: ["Simplified the month plan", "Reduced more than a dozen commitments to four things that actually matter."], de: ["Den Monatsplan vereinfacht", "Mehr als ein Dutzend Vorhaben auf vier wirklich wichtige Dinge reduziert."] },
  24: { zh: ["咖啡馆读书", "在咖啡馆读完两个章节，回家前整理好了笔记。"], en: ["Reading at the café", "Finished two chapters at a café and organised the notes before heading home."], de: ["Lesen im Café", "Zwei Kapitel im Café beendet und vor dem Heimweg die Notizen geordnet."] },
  1: { zh: ["安静整理这一周", "晚上把没有完成的事重新安排，没有再把它们塞进今天。"], en: ["A quiet weekly reset", "Rescheduled unfinished tasks instead of forcing them into the end of today."], de: ["Ein ruhiger Wochenabschluss", "Offene Dinge neu eingeplant, statt sie noch in diesen Tag zu pressen."] },
};

export function demoEventText(event, lang) {
  const personal = PERSONAL_EVENT_TEXT[event.d];
  if (personal) return personal[lang] || personal.en;
  return event[lang] || event.en;
}

export function demoDayContent(lang, dayIndex, weekday, completed) {
  const d = daysBeforeToday(dayIndex);
  const event = EVENT_BY_D.get(d);
  if (event) {
    const [title, story] = demoEventText(event, lang);
    return { mood: event.mood, moodReason: clampMoodReason(lang, title), note: story };
  }
  const note = composeRichNote(lang, dayIndex, weekday, completed);
  const mood = moodForDay(dayIndex, weekday, d);
  const moodReason = moodReasonFor(lang, dayIndex, mood, note, "");
  return { mood, moodReason, note };
}

// Kept for tests or older imports — delegates to the new journal builder.
export function demoDayLine(lang, dayIndex, weekday, completed) {
  return demoDayContent(lang, dayIndex, weekday, completed).note;
}
