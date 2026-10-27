// Extra Today cards: weather, 7-day rhythm, habit heatmap, frequency calendar, photo wall, day photos, focus.
// Plain DOM fed from app.js state (same globals the original Today uses); today-cards.js lays them out.
// Ported from 858ede8 (today-extras.js / weather-widget.js) onto the 780b6a1 base.
(() => {
  const view = document.getElementById("todayView");
  if (!view) return;
  const $ = (s, r = document) => r.querySelector(s);
  const T = {
    zh: { weather: "天气", weatherK: "WEATHER", rhythm: "近期节律", rhythmK: "LAST 7 DAYS", heatmap: "习惯热力图", heatmapK: "HABIT RHYTHM", wall: "照片墙", wallK: "PHOTO WALL", photos: "照片记忆", photosK: "MEMORY", focus: "专注", focusK: "FOCUS", freq: "频率记录", freqK: "BY FREQUENCY",
      chooseCity: "选择城市后显示当地天气。", setCity: "设置地点", city: "城市", search: "搜索", noCity: "未找到匹配的城市。", loading: "正在加载……", unavailable: "刷新失败，请检查网络后重试。", cached: "已保存的预报 · 离线", updated: "更新于",
      clear: "晴", cloud: "多云", rain: "下雨", snow: "下雪", storm: "雷雨", rainSoon: "预计降雨", snowSoon: "预计降雪", noRain: "未来 24 小时暂未预报降水", hour: "预报时间",
      rhythmAvg: "7 天完成率", tomorrow: "明天", tomorrowCount: "{n} 个基础目标", less: "少", more: "多", palette: "配色", green: "翡翠绿", blue: "海洋蓝", spectrum: "红到蓝",
      wallEmpty: "留一扇自己的小窗：放入照片、GIF 或视频。", addMedia: "添加媒体", play: "循环播放", pause: "暂停", remove: "移除", prev: "上一项", next: "下一项", wallLocal: "保存在本机浏览器。", invalidMedia: "支持 JPEG、PNG、WebP、GIF 和可播放视频；每个不超过 50 MB，最多 20 项。", storageError: "保存失败，存储空间可能已满。", removeConfirm: "从照片墙移除这一项？",
      photosLocal: "照片暂时无法读取，请刷新后重试。", photosEmpty: "这一天还没有照片。", openDay: "打开这一天",
      focusToday: "今日专注", min: "分钟",
      heat26: "近 26 周", heatRate: "完成率", heatFull: "满分天", heatBest: "最长连续", days: "天", focusArt: "专注", wallAddHint: "放一张你喜欢的照片", photosLocalTitle: "这一天的照片", freqEmptyTitle: "还没有频率目标", weatherEmptyTitle: "今天的天气",
      freqEmpty: "还没有按每周或每月计次的目标。在“调整目标”里把频率设为每周 / 每月即可。", freqWeek: "本周 {done}/{target}", freqMonth: "本月 {done}/{target}", freqPick: "显示的目标",
      wallEmptyShort: "在卡片设置里放入照片", wallMedia: "照片与视频", wallAuto: "自动轮播", wallFit: "显示方式", fill: "铺满", fit: "完整显示", wallFocus: "点或拖动预览，选择显示的位置", wallTip: "左右滑动或点两侧切换" },
    en: { weather: "Weather", weatherK: "WEATHER", rhythm: "Recent rhythm", rhythmK: "LAST 7 DAYS", heatmap: "Habit heatmap", heatmapK: "HABIT RHYTHM", wall: "Photo wall", wallK: "PHOTO WALL", photos: "Photo memories", photosK: "MEMORY", focus: "Focus", focusK: "FOCUS", freq: "By frequency", freqK: "WEEKLY · MONTHLY",
      chooseCity: "Choose a city to show its weather.", setCity: "Set location", city: "City", search: "Search", noCity: "No matching city found.", loading: "Loading…", unavailable: "Could not refresh. Check your connection.", cached: "Saved forecast · offline", updated: "Updated",
      clear: "Clear", cloud: "Cloudy", rain: "Rain", snow: "Snow", storm: "Thunderstorm", rainSoon: "Rain expected", snowSoon: "Snow expected", noRain: "No precipitation in the next 24 hours", hour: "Forecast hour",
      rhythmAvg: "7-day completion", tomorrow: "Tomorrow", tomorrowCount: "{n} foundations", less: "Less", more: "More", palette: "Palette", green: "Emerald", blue: "Ocean blue", spectrum: "Red to blue",
      wallEmpty: "Your own little window. Add photos, GIFs or a video.", addMedia: "Add media", play: "Play", pause: "Pause", remove: "Remove", prev: "Previous", next: "Next", wallLocal: "Stored in this browser.", invalidMedia: "JPEG, PNG, WebP, GIF or a playable video, up to 50 MB each, 20 items.", storageError: "Could not save. Storage may be full.", removeConfirm: "Remove this item from the photo wall?",
      photosLocal: "Photos could not be read. Refresh and try again.", photosEmpty: "No photo for this day yet.", openDay: "Open this day",
      focusToday: "Focused today", min: "min",
      heat26: "Last 26 weeks", heatRate: "Done", heatFull: "Full days", heatBest: "Best streak", days: "d", focusArt: "Focus", wallAddHint: "Put a photo you love here", photosLocalTitle: "Photos of this day", freqEmptyTitle: "No frequency goals yet", weatherEmptyTitle: "Today's weather",
      freqEmpty: "No weekly or monthly habits yet. Set a habit's frequency to weekly or monthly in Adjust goals.", freqWeek: "This week {done}/{target}", freqMonth: "This month {done}/{target}", freqPick: "Habit shown",
      wallEmptyShort: "Add photos in card settings", wallMedia: "Photos and videos", wallAuto: "Auto-play", wallFit: "Display", fill: "Fill", fit: "Fit", wallFocus: "Tap or drag the preview to choose what shows", wallTip: "Swipe or tap the sides to switch" },
    de: { weather: "Wetter", weatherK: "WETTER", rhythm: "Letzte Tage", rhythmK: "7 TAGE", heatmap: "Gewohnheits-Heatmap", heatmapK: "RHYTHMUS", wall: "Fotowand", wallK: "FOTOWAND", photos: "Fotoerinnerungen", photosK: "ERINNERUNG", focus: "Fokus", focusK: "FOKUS", freq: "Nach Häufigkeit", freqK: "WOCHE · MONAT",
      chooseCity: "Wähle eine Stadt für die Wettervorhersage.", setCity: "Ort wählen", city: "Stadt", search: "Suchen", noCity: "Keine passende Stadt gefunden.", loading: "Wird geladen …", unavailable: "Aktualisierung fehlgeschlagen. Verbindung prüfen.", cached: "Gespeicherte Prognose · offline", updated: "Aktualisiert",
      clear: "Klar", cloud: "Bewölkt", rain: "Regen", snow: "Schnee", storm: "Gewitter", rainSoon: "Regen erwartet", snowSoon: "Schnee erwartet", noRain: "Kein Niederschlag in den nächsten 24 Stunden", hour: "Vorhersagezeit",
      rhythmAvg: "7-Tage-Quote", tomorrow: "Morgen", tomorrowCount: "{n} Grundlagen", less: "Weniger", more: "Mehr", palette: "Farben", green: "Smaragd", blue: "Ozeanblau", spectrum: "Rot bis Blau",
      wallEmpty: "Dein eigenes Fenster: Fotos, GIFs oder ein Video.", addMedia: "Medien hinzufügen", play: "Abspielen", pause: "Pause", remove: "Entfernen", prev: "Zurück", next: "Weiter", wallLocal: "In diesem Browser gespeichert.", invalidMedia: "JPEG, PNG, WebP, GIF oder abspielbares Video, bis 50 MB, 20 Dateien.", storageError: "Speichern fehlgeschlagen. Speicher voll?", removeConfirm: "Dieses Medium von der Fotowand entfernen?",
      photosLocal: "Fotos konnten nicht gelesen werden. Bitte neu laden und erneut versuchen.", photosEmpty: "Noch kein Foto für diesen Tag.", openDay: "Diesen Tag öffnen",
      focusToday: "Heute fokussiert", min: "Min.",
      heat26: "Letzte 26 Wochen", heatRate: "Erledigt", heatFull: "Volle Tage", heatBest: "Beste Serie", days: "T.", focusArt: "Fokus", wallAddHint: "Lege ein Lieblingsfoto hierher", photosLocalTitle: "Fotos dieses Tages", freqEmptyTitle: "Noch keine Häufigkeitsziele", weatherEmptyTitle: "Wetter heute",
      freqEmpty: "Noch keine wöchentlichen oder monatlichen Ziele. Stelle die Häufigkeit in „Ziele anpassen“ auf wöchentlich / monatlich.", freqWeek: "Diese Woche {done}/{target}", freqMonth: "Diesen Monat {done}/{target}", freqPick: "Angezeigtes Ziel",
      wallEmptyShort: "Fotos in den Karteneinstellungen hinzufügen", wallMedia: "Fotos und Videos", wallAuto: "Automatisch wechseln", wallFit: "Darstellung", fill: "Füllen", fit: "Ganz zeigen", wallFocus: "Tippe oder ziehe in der Vorschau, um den Ausschnitt zu wählen", wallTip: "Wischen oder seitlich tippen zum Wechseln" },
  };
  const lang = () => (T[currentLang] ? currentLang : "en");
  const t = (k, v = {}) => String(T[lang()][k] ?? T.en[k] ?? k).replace(/\{(\w+)\}/g, (_, n) => v[n] ?? "");
  // Demo preview workspace keeps its own settings and media, so it can never touch the real ones.
  const NS = new URLSearchParams(location.search).get("local-preview") ? `-preview-${new URLSearchParams(location.search).get("local-preview")}` : "";
  window.LifeLedgerStorageSuffix = NS;
  const read = k => { try { return JSON.parse(localStorage.getItem(k + NS)); } catch { return null; } };
  const save = (k, v) => { try { localStorage.setItem(k + NS, JSON.stringify(v)); } catch {} };
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Line icons (24px, 1.8 stroke) for card chips — same drawing style as the habit icons.
  const ICON = {
    weather: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
    rhythm: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    heatmap: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    focus: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
    photos: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    freq: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/><path d="m9 15 2 2 4-4"/>',
    mood: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>',
    habits: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    dayplan: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    tools: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  };
  const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const chipHtml = id => `<span class="ll-chip" aria-hidden="true">${svg(ICON[id])}</span>`;
  const tone = { weather: "blue", rhythm: "sage", heatmap: "sage", focus: "violet", photos: "amber", freq: "coral", mood: "amber", habits: "sage", calendar: "blue", dayplan: "cyan", tools: "violet" };
  const paint = (el, name) => { const c = colors[name] || colors.sage; el.style.setProperty("--w-solid", c.solid); el.style.setProperty("--w-soft", c.soft); };
  // One card shell, styled by the original .daily-goals-card; chip + kicker + serif title like every card.
  function shell(id, side = "", body = "") {
    const card = document.createElement("div");
    card.dataset.module = id;
    card.innerHTML = `<article class="daily-goals-card tw-card tw-${id}"><div class="daily-goals-heading"><div class="ll-head">${chipHtml(id)}<span class="kicker" data-tw="${id}K"></span><h3 data-tw="${id}"></h3></div>${side}</div><div class="tw-body">${body}</div></article>`;
    paint(card.firstElementChild, tone[id]);
    view.append(card);
    return card;
  }
  // The original Today cards get the same chip in their heading (additive; their markup is untouched).
  // Not the fixed top row (quote + mood): it stays exactly as approved (user 10/22).
  for (const [id, sel] of [["habits", ".habits-heading > div"], ["calendar", ".calendar-toolbar > div:first-child"], ["dayplan", ".daily-planning-grid > :first-child .daily-goals-heading > div:first-child"], ["tools", ".daily-tool-card .daily-goals-heading > div:first-child"]]) {
    const head = $(sel, view);
    if (!head || head.querySelector(".ll-chip")) continue;
    head.classList.add("ll-head"); head.insertAdjacentHTML("afterbegin", chipHtml(id)); paint(head, tone[id]);
  }
  function wallShell(id) { const c = document.createElement("div"); c.dataset.module = id;
    c.innerHTML = `<article class="daily-goals-card tw-card tw-wall"><div class="tw-wall-stage" tabindex="0" role="group"></div><button type="button" class="tw-wall-nav" data-wall="prev"></button><button type="button" class="tw-wall-nav" data-wall="next"></button><div class="tw-wall-dots" aria-hidden="true"></div></article>`;
    view.append(c); return c; }
  const cards = {
    weather: shell("weather", `<span class="tw-side" id="weatherCityName"></span>`,
      `<div class="weather-empty" hidden><div class="tw-art" data-art="today-morning"></div><strong data-tw="weatherEmptyTitle"></strong><p data-tw="chooseCity"></p><button type="button" class="secondary-button tw-set-city" data-tw="setCity"></button></div>
       <div class="weather-current-line"><div id="weatherDetail"></div><span id="weatherDailyRange"></span></div>
       <div id="weatherPlot" tabindex="0" role="group"></div>
       <input id="weatherHour" class="sr-only" type="range" min="0" max="23" value="0" hidden>
       <span id="weatherPrecipHint" class="weather-rain-hint"></span>
       <div class="weather-footer"><span id="weatherStatus" class="tw-caption" role="status" hidden></span><a class="tw-caption" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo · CC BY 4.0</a></div>`),
    rhythm: shell("rhythm", `<strong class="tw-side tw-rhythm-pct"></strong>`, `<ol class="tw-rhythm-days"></ol><p class="tw-caption tw-rhythm-tomorrow"></p>`),
    heatmap: shell("heatmap", `<span class="tw-side tw-heat-month"></span>`, `<div class="tw-heat-stats"></div><div class="tw-heat-box"><div class="tw-heat-weekdays" aria-hidden="true"></div><div class="tw-heat-grid"></div></div><p class="tw-heat-legend"></p>`),
    // Photo wall = the photo itself (user 10/21): thin even frame, no visible buttons; all controls in settings.
    wall: wallShell("wall"), wall2: wallShell("wall2"), wall3: wallShell("wall3"),
    freq: shell("freq", `<span class="tw-side tw-freq-month"></span>`, `<div class="tw-freq-info"><div class="tw-ring"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15.5"/><circle class="on" cx="18" cy="18" r="15.5"/></svg><b class="tw-freq-count"></b></div><div class="tw-freq-tabs" role="tablist"></div></div><div class="tw-heat-box"><div class="tw-heat-weekdays" aria-hidden="true"></div><div class="tw-freq-grid tw-heat-grid"></div></div>`),
    photos: shell("photos", `<button type="button" class="text-button tw-open-day" data-tw="openDay"></button>`, `<div class="tw-photo-list"></div><p class="tw-caption tw-photo-note"></p>`),
    focus: shell("focus", "", `<div class="tw-art tw-focus-art"></div><div class="tw-focus-main"><div class="tw-ring tw-focus-ring"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15.5"/><circle class="on" cx="18" cy="18" r="15.5"/></svg><strong></strong></div><div class="tw-focus-meta"><span class="tw-focus-topic"></span><p class="tw-caption tw-focus-today"></p><button type="button" class="primary-button tw-focus-start"></button></div></div>`),
  };
  // Hero gets the weather chip (weather-widget.js fills #heroWeather).
  const chip = document.createElement("span");
  chip.id = "heroWeather"; chip.className = "date-chip hero-weather"; chip.hidden = true;
  $(".hero-copy #todayDateChip")?.after(chip);
  const shown = id => !cards[id].hidden;

  // ---- 7-day rhythm (from 858ede8 renderTodayContext) ----
  function rhythm() {
    const end = parseDate(selectedPlanningDate), days = [];
    for (let off = 6; off >= 0; off--) {
      const d = new Date(end); d.setDate(end.getDate() - off);
      const key = isoDate(d), scored = dailyHabits(key);
      days.push({ key, label: weekdayShortName(d.getDay()), done: scored.filter(h => getLog(key).completed.includes(h.id)).length, total: scored.length, future: isFutureDate(key) });
    }
    const past = days.filter(d => !d.future), sumDone = past.reduce((s, d) => s + d.done, 0), sumAll = past.reduce((s, d) => s + d.total, 0);
    const c = cards.rhythm;
    $(".tw-rhythm-pct", c).textContent = `${sumAll ? Math.round(sumDone / sumAll * 100) : 0}%`;
    $(".tw-rhythm-pct", c).title = t("rhythmAvg");
    $(".tw-rhythm-days", c).innerHTML = days.map(d => `<li><button type="button" data-date="${d.key}" class="${d.key === selectedPlanningDate ? "is-selected" : ""}" ${d.future ? "disabled" : ""}><span>${escapeHtml(d.label)}</span><i style="--fill:${d.total ? d.done / d.total : 0}"></i><b>${d.future ? "—" : `${d.done}/${d.total}`}</b></button></li>`).join("");
    const tm = parseDate(selectedPlanningDate); tm.setDate(tm.getDate() + 1);
    $(".tw-rhythm-tomorrow", c).textContent = `${t("tomorrow")} · ${t("tomorrowCount", { n: dailyHabits(isoDate(tm)).length })}`;
  }
  cards.rhythm.addEventListener("click", e => { const b = e.target.closest("button[data-date]"); if (b) selectPlanningDate(b.dataset.date); });

  // ---- habit heatmap (from 858ede8 today-extras heatmap) ----
  const PAL = { green: "#00ad7c", blue: "#258fe5" };
  const heatColor = (p, lv) => p === "spectrum" ? `hsl(${8 + lv * 26} 75% 53%)` : PAL[p] || PAL.green;
  const heatBg = (p, lv) => lv ? `color-mix(in srgb, ${heatColor(p, lv)} ${20 + lv * 10}%, var(--tw-surface))` : "var(--tw-heat-empty)";
  const dayScore = key => { const habits = dailyHabits(key), done = habits.filter(h => getLog(key).completed.includes(h.id)).length, future = isFutureDate(key); return { done, total: habits.length, future, ratio: habits.length && !future ? done / habits.length : 0 }; };
  const level = r => (r ? Math.max(1, Math.ceil(r * 4)) * 2 : 0);   // 0,2,4,6,8 → five visible steps
  function heatCell(key, palette, extra = "") {
    const d = dayScore(key), lv = level(d.ratio), label = `${key} · ${d.future ? "—" : `${d.done}/${d.total}`}`;
    return `<button type="button" class="tw-heat-cell${d.future ? " is-future" : ""}${key === selectedPlanningDate ? " is-selected" : ""}${key === isoDate(new Date()) ? " is-today" : ""}${extra}" data-date="${key}" title="${label}" aria-label="${label}" ${d.future ? "disabled" : ""} style="background:${heatBg(palette, lv)}"></button>`;
  }
  function heatmap() {
    const c = cards.heatmap, size = c.dataset.size || "S", sel = parseDate(selectedPlanningDate), y = sel.getFullYear(), m = sel.getMonth();
    const palette = read("life-ledger-heatmap-palette") || "green";
    paint(c.firstElementChild, "sage"); c.firstElementChild.style.setProperty("--w-solid", heatColor(palette, 6));
    const locale = { en: "en-GB", zh: "zh-CN", de: "de-DE" }[lang()];
    const grid = $(".tw-heat-grid", c), wd = $(".tw-heat-weekdays", c);
    c.classList.toggle("is-weeks", size === "M");
    const names = [1, 2, 3, 4, 5, 6, 0].map(d => `<span>${escapeHtml(weekdayShortName(d)).slice(0, lang() === "zh" ? 2 : 2)}</span>`).join("");
    if (size === "M") {
      // Last 26 weeks, Monday rows, newest week on the right — a real contribution heatmap.
      const mon = new Date(sel); mon.setDate(sel.getDate() - ((sel.getDay() + 6) % 7) - 25 * 7);
      const cells = [];
      for (let i = 0; i < 26 * 7; i++) { const d = new Date(mon); d.setDate(mon.getDate() + i); cells.push(heatCell(isoDate(d), palette)); }
      grid.innerHTML = cells.join(""); wd.innerHTML = names;
      $(".tw-heat-month", c).textContent = t("heat26");
    } else {
      wd.innerHTML = names;
      const offset = (new Date(y, m, 1).getDay() + 6) % 7, cells = Array.from({ length: offset }, () => `<span class="tw-heat-cell is-spacer" aria-hidden="true"></span>`);
      for (let day = 1; day <= new Date(y, m + 1, 0).getDate(); day++) cells.push(heatCell(isoDate(new Date(y, m, day, 12)), palette));
      while (cells.length < 42) cells.push(`<span class="tw-heat-cell is-spacer" aria-hidden="true"></span>`);
      grid.innerHTML = cells.join("");
      $(".tw-heat-month", c).textContent = new Intl.DateTimeFormat(locale, { year: size === "L" ? "numeric" : undefined, month: "short" }).format(new Date(y, m, 1, 12));
    }
    // L: month stats — completion rate, full days, best streak.
    let done = 0, all = 0, full = 0, run = 0, best = 0;
    for (let day = 1; day <= new Date(y, m + 1, 0).getDate(); day++) {
      const d = dayScore(isoDate(new Date(y, m, day, 12))); if (d.future) break;
      done += d.done; all += d.total; if (d.total && d.done === d.total) { full++; run++; best = Math.max(best, run); } else run = 0;
    }
    $(".tw-heat-stats", c).innerHTML = [[t("heatRate"), `${all ? Math.round(done / all * 100) : 0}%`], [t("heatFull"), `${full}`], [t("heatBest"), `${best} ${t("days")}`]].map(([k, v]) => `<div><b>${escapeHtml(v)}</b><span>${escapeHtml(k)}</span></div>`).join("");
    $(".tw-heat-legend", c).innerHTML = `<span>${escapeHtml(t("less"))}</span>${[0, 2, 4, 6, 8].map(lv => `<i style="background:${heatBg(palette, lv)}"></i>`).join("")}<span>${escapeHtml(t("more"))}</span>`;
  }
  cards.heatmap.addEventListener("click", e => { const d = e.target.closest("[data-date]")?.dataset.date; if (d && !view.classList.contains("tc-editing")) openDrawer(d); });

  // ---- weather (data logic from 858ede8 today-extras; drawing by weather-widget.js) ----
  let city = read("life-ledger-weather-city"), forecast = null, stamp = 0, busy = false, searchAbort;
  if (city && !(Number.isFinite(city.latitude) && Number.isFinite(city.longitude))) city = null;
  // The sample persona lives in Berlin: the demo shows real Berlin weather until a city is chosen.
  // (checked lazily: the demo is seeded after this script runs)
  // Until a city is chosen (user 10/27): Germany → Berlin, UK → London, Chinese → Beijing, from the system
  // region first, then the app language. Not saved, so choosing a city always wins.
  const regionCity = () => {
    const tag = (navigator.languages?.[0] || navigator.language || "").toLowerCase(), region = tag.split("-").slice(1).find(p => p.length === 2) || "";
    const by = { de: ["Berlin", 52.52, 13.405], at: ["Berlin", 52.52, 13.405], ch: ["Berlin", 52.52, 13.405], gb: ["London", 51.5072, -0.1276], uk: ["London", 51.5072, -0.1276], cn: ["北京", 39.9042, 116.4074] };
    const hit = by[region] || (tag.startsWith("zh") ? by.cn : null) || { de: by.de, zh: by.cn, en: by.gb }[lang()] || by.gb;
    return { name: hit[0] === "北京" && lang() !== "zh" ? "Beijing" : hit[0], latitude: hit[1], longitude: hit[2] };
  };
  const demoCity = () => {
    if (city) return;
    city = typeof state !== "undefined" && window.LifeLedgerDemoWorkspace?.isDemoActive?.(state) ? { name: "Berlin", latitude: 52.52, longitude: 13.405 } : regionCity();
  };
  const kind = code => ((code >= 71 && code <= 77) || code === 85 || code === 86) ? "snow" : code >= 95 ? "storm" : ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) ? "rain" : code > 1 ? "cloud" : "clear";
  async function json(url, signal) {
    const ctl = new AbortController(), abort = () => ctl.abort(), timer = setTimeout(abort, 12000);
    signal?.addEventListener("abort", abort, { once: true });
    try { const r = await fetch(url, { signal: ctl.signal, credentials: "omit" }); if (!r.ok) throw new Error(String(r.status)); return await r.json(); }
    finally { clearTimeout(timer); signal?.removeEventListener("abort", abort); }
  }
  const valid = d => d?.current?.time && Array.isArray(d.hourly?.time) && d.hourly.time.length > 2;
  function status(text, attention = false) { const s = $("#weatherStatus"); s.textContent = text; s.hidden = !attention; }
  function drawWeather() {
    demoCity();
    const empty = $(".weather-empty", cards.weather);
    empty.hidden = Boolean(city); cards.weather.classList.toggle("is-empty", !city);
    if (forecast && city) window.LifeLedgerWeather?.update(forecast, city, lang(), t, kind, selectedPlanningDate);
  }
  async function loadWeather(force = false) {
    demoCity();
    if (!city || busy) return;
    const key = `${city.latitude},${city.longitude},31-16`, cache = read("life-ledger-weather-cache");
    if (!forecast && cache?.city === key && valid(cache.data)) { forecast = cache.data; stamp = cache.stamp; drawWeather(); }
    if (!force && forecast && Date.now() - stamp < 30 * 60 * 1000) { status(`${t("updated")} ${forecast.current.time.slice(11, 16)}`); return; }
    if (!shown("weather")) return;
    const asked = city; busy = true; status(t("loading"), !forecast);
    try {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.search = new URLSearchParams({ latitude: city.latitude, longitude: city.longitude, current: "temperature_2m,weather_code", hourly: "temperature_2m,precipitation_probability,precipitation,snowfall,weather_code", past_days: "31", forecast_days: "16", timezone: "auto" });
      const data = await json(url);
      if (!valid(data)) throw new Error("invalid");
      if (city !== asked) return;
      forecast = data; stamp = Date.now(); save("life-ledger-weather-cache", { city: key, stamp, data });
      drawWeather(); status(`${t("updated")} ${data.current.time.slice(11, 16)}`);
    } catch { status(forecast ? t("cached") : t("unavailable"), true); }
    finally { busy = false; if (city !== asked) void loadWeather(true); }
  }
  function setCity(place) {
    city = { name: place.name, latitude: place.latitude, longitude: place.longitude };
    save("life-ledger-weather-city", city); forecast = null; window.LifeLedgerWeather?.clear(); drawWeather(); void loadWeather(true);
  }
  // City search UI, shown in the weather card's settings (edit mode).
  function weatherSettings(box) {
    // No nested <form>: the settings sheet is already a form, and the parser would drop it.
    box.innerHTML = `<div class="tw-city-form"><label><span>${escapeHtml(t("city"))}</span><input type="search" maxlength="100" autocomplete="off" value="${escapeHtml(city?.name || "")}"></label><button type="button" class="secondary-button">${escapeHtml(t("search"))}</button></div><div class="tw-city-results"></div>`;
    $("input", box).addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); search(); } });
    $(".tw-city-form button", box).addEventListener("click", () => search());
    const search = async () => {
      const name = $("input", box).value.trim(), out = $(".tw-city-results", box);
      if (name.length < 2) return;
      searchAbort?.abort(); searchAbort = new AbortController(); out.textContent = t("loading");
      try {
        const data = await json(`https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({ name, count: "5", language: lang(), format: "json" })}`, searchAbort.signal);
        const places = (data.results || []).filter(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
        out.innerHTML = places.length ? places.map((p, i) => `<button type="button" class="tw-city" data-i="${i}">${escapeHtml([p.name, p.admin1, p.country].filter(Boolean).join(" · "))}</button>`).join("") : escapeHtml(t("noCity"));
        out.onclick = ev => { const b = ev.target.closest("[data-i]"); if (!b) return; setCity(places[Number(b.dataset.i)]); $("input", box).value = city.name; out.textContent = `✓ ${city.name}`; };
      } catch (err) { if (err.name !== "AbortError") out.textContent = t("unavailable"); }
    };
  }
  $(".tw-set-city", cards.weather).addEventListener("click", e => { e.stopPropagation(); window.LifeLedgerTodayCards?.openSettings("weather"); });
  setInterval(() => { if (!document.hidden) void loadWeather(); }, 30 * 60 * 1000);

  // ---- photo wall (from 858ede8 today-extras wall; tiny IndexedDB store) ----
  // Any number of walls (user 10/21): each instance has its own store and prefs (suffix "", "-2", "-3"…).
  function makeWall(W, id, suffix) {
    const store = (() => {
      let db;
      const open = () => db ||= new Promise((ok, no) => { const r = indexedDB.open("life-ledger-wall" + suffix + NS, 1); r.onupgradeneeded = () => r.result.createObjectStore("photos", { keyPath: "id" }); r.onsuccess = () => { r.result.onversionchange = () => { r.result.close(); db = null; }; ok(r.result); }; r.onerror = () => no(r.error); });
      const run = (mode, fn) => open().then(d => new Promise((ok, no) => { const tx = d.transaction("photos", mode), q = fn(tx.objectStore("photos")); tx.oncomplete = () => ok(q.result); tx.onerror = tx.onabort = () => no(tx.error || q.error); }));
      return { all: () => run("readonly", s => s.getAll()), put: row => run("readwrite", s => s.put(row)), delete: id => run("readwrite", s => s.delete(id)) };
    })();
    let wall = [], wallAt = 0, wallTimer, wallUrl, wallLoaded = false, wallHold = false;
    const wallPrefs = () => ({ auto: true, fit: "cover", ...(read("life-ledger-wall-prefs" + suffix) || {}) });
    const pos = row => `${row.x ?? 50}% ${row.y ?? 50}%`;
    function mediaEl(row, { controls = false } = {}) {
      const video = row.type.startsWith("video/"), media = document.createElement(video ? "video" : "img");
      media.src = URL.createObjectURL(row.blob);
      if (video) Object.assign(media, { muted: true, loop: true, playsInline: true, controls });
      else media.alt = row.name;
      media.style.objectPosition = pos(row); media.style.objectFit = wallPrefs().fit;
      return media;
    }
    function renderWall() {
      const stage = $(".tw-wall-stage", W);
      $("video", stage)?.pause(); stage.replaceChildren();
      if (wallUrl) { URL.revokeObjectURL(wallUrl); wallUrl = null; }
      const row = wall[wallAt];
      W.classList.toggle("is-empty", !row); W.classList.toggle("is-fit", wallPrefs().fit === "contain");
      if (row) {
        const media = mediaEl(row); wallUrl = media.src; stage.append(media);
        if (media.tagName === "VIDEO" && !reduced() && wallOnScreen()) media.play().catch(() => {});
        stage.setAttribute("aria-label", `${t("wall")} · ${wallAt + 1} / ${wall.length} · ${t("wallTip")}`);
      } else {
        stage.innerHTML = `<div class="tw-empty"><div class="tw-art" data-art="empty-photos"></div><strong>${escapeHtml(t("wallAddHint"))}</strong><p>${escapeHtml(t("wallEmptyShort"))}</p></div>`; arts(W);
        stage.setAttribute("aria-label", t("wall"));
      }
      $(".tw-wall-dots", W).innerHTML = wall.length > 1 ? wall.map((_, i) => `<i class="${i === wallAt ? "on" : ""}"></i>`).join("") : "";
      W.querySelectorAll(".tw-wall-nav").forEach(b => { b.hidden = wall.length < 2; });
      clearTimeout(wallTimer); wallTimer = 0;
      if (wallPrefs().auto && wall.length > 1 && !wallHold && !reduced() && wallOnScreen()) wallTimer = setTimeout(() => step(1), 8000);
    }
    const step = d => { if (wall.length < 2) return; wallAt = (wallAt + d + wall.length) % wall.length; renderWall(); };
    const wallOnScreen = () => shown(id) && view.classList.contains("active") && !document.hidden;
    function wallVisibility() {
      const video = $(".tw-wall-stage video", W);
      if (!wallOnScreen()) { clearTimeout(wallTimer); wallTimer = 0; video?.pause(); return; }
      if (video && !reduced()) video.play().catch(() => {});
      if (wallPrefs().auto && wall.length > 1 && !wallTimer) renderWall();
    }
    document.addEventListener("visibilitychange", wallVisibility);
    new MutationObserver(wallVisibility).observe(view, { attributes: true, attributeFilter: ["class"] });
    new MutationObserver(wallVisibility).observe(W, { attributes: true, attributeFilter: ["hidden"] });
    async function addMedia(files, status) {
      try {
        if (wall.length + files.length > 20) throw new Error("invalid");
        const ok = f => f.size && f.size <= 50 * 1024 * 1024 && (/^image\/(jpeg|png|webp|gif)$/.test(f.type) || (/^video\//.test(f.type) && document.createElement("video").canPlayType(f.type)));
        if (!files.every(ok)) throw new Error("invalid");
        const now = Date.now(); for (const [i, f] of files.entries()) { const row = { id: crypto.randomUUID(), name: f.name, type: f.type, blob: f, created: now + i, x: 50, y: 50 }; await store.put(row); wall.push(row); }
        wallAt = Math.max(0, wall.length - files.length); status.textContent = t("wallLocal");
      } catch (e) { status.textContent = e.message === "invalid" ? t("invalidMedia") : t("storageError"); }
      finally { renderWall(); }
    }
    function loadWall() {
      if (wallLoaded || !shown(id)) return;
      wallLoaded = true;
      store.all().then(rows => {
        wall = rows.sort((a, b) => a.created - b.created); renderWall();
      }).catch(() => {});
    }
    // On the card: tap the sides, swipe, or arrow keys switch; tapping an empty wall opens its settings.
    let swiped = false;
    W.addEventListener("click", e => {
      if (swiped) { swiped = false; return; }
      const a = e.target.closest("[data-wall]")?.dataset.wall;
      if (a) { step(a === "next" ? 1 : -1); return; }
      if (!wall.length) window.LifeLedgerTodayCards?.openSettings(id);
    });
    $(".tw-wall-stage", W).addEventListener("keydown", e => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); step(e.key === "ArrowRight" ? 1 : -1); } });
    let swipeX = null;
    W.addEventListener("pointerdown", e => { swipeX = e.pointerType === "mouse" ? null : e.clientX; });
    W.addEventListener("pointerup", e => { if (swipeX !== null && Math.abs(e.clientX - swipeX) > 40 && !view.classList.contains("tc-editing")) { swiped = true; setTimeout(() => { swiped = false; }, 400); step(e.clientX < swipeX ? 1 : -1); } swipeX = null; });
    W.addEventListener("pointercancel", () => { swipeX = null; });

    // Settings: add / remove, auto-play, fill or fit, and a focus point per photo (tap or drag the preview).
    function wallSettings(box) {
      const p = wallPrefs();
      box.innerHTML = `<div class="tw-wall-set">
        <div class="tw-wall-set-head"><span>${escapeHtml(t("wallMedia"))} · ${wall.length}/20</span><button type="button" class="secondary-button tw-wall-add">＋ ${escapeHtml(t("addMedia"))}</button><input class="tw-wall-files" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" multiple hidden></div>
        <div class="tw-wall-thumbs" role="listbox" aria-label="${escapeHtml(t("wallMedia"))}"></div>
        <div class="tw-wall-preview" tabindex="0" aria-label="${escapeHtml(t("wallFocus"))}"><i class="tw-wall-pin" aria-hidden="true"></i></div>
        <p class="tc-note tw-wall-hint">${escapeHtml(t("wallFocus"))}</p>
        <div class="tw-wall-opts"><label class="tw-check"><input type="checkbox" class="tw-wall-auto" ${p.auto ? "checked" : ""}> ${escapeHtml(t("wallAuto"))}</label>
          <span class="tw-seg" role="radiogroup" aria-label="${escapeHtml(t("wallFit"))}"><button type="button" data-fit="cover" aria-checked="${p.fit === "cover"}">${escapeHtml(t("fill"))}</button><button type="button" data-fit="contain" aria-checked="${p.fit === "contain"}">${escapeHtml(t("fit"))}</button></span>
          <button type="button" class="text-button tw-wall-remove">${escapeHtml(t("remove"))}</button></div>
        <p class="tw-caption tw-wall-status" role="status"></p></div>`;
      const prev = $(".tw-wall-preview", box), pin = $(".tw-wall-pin", box), status = $(".tw-wall-status", box);
      let urls = [];
      wallHold = true; clearTimeout(wallTimer); wallTimer = 0;
      const st = $(".tw-wall-stage", W).getBoundingClientRect();
      if (st.width && st.height) prev.style.setProperty("--ar", (st.width / st.height).toFixed(3));
      box.closest("dialog")?.addEventListener("close", () => { wallHold = false; urls.forEach(u => URL.revokeObjectURL(u)); urls = []; renderWall(); }, { once: true });
      const paint = () => {
        urls.forEach(u => URL.revokeObjectURL(u)); urls = [];
        $(".tw-wall-set-head span", box).textContent = `${t("wallMedia")} · ${wall.length}/20`;
        $(".tw-wall-thumbs", box).innerHTML = wall.map((r, i) => { const u = URL.createObjectURL(r.blob); urls.push(u); return `<button type="button" role="option" data-i="${i}" aria-selected="${i === wallAt}" aria-label="${escapeHtml(r.name)}">${r.type.startsWith("video/") ? `<video src="${u}" muted></video>` : `<img src="${u}" alt="">`}</button>`; }).join("");
        prev.querySelector("img, video")?.remove();
        const row = wall[wallAt];
        prev.hidden = $(".tw-wall-hint", box).hidden = $(".tw-wall-remove", box).hidden = !row;
        if (!row) return;
        const m = mediaEl(row); urls.push(m.src); m.style.objectFit = wallPrefs().fit; prev.prepend(m);
        pin.style.left = `${row.x ?? 50}%`; pin.style.top = `${row.y ?? 50}%`;
      };
      const setPoint = e => {
        const row = wall[wallAt]; if (!row) return;
        const r = prev.getBoundingClientRect();
        row.x = Math.round(Math.min(100, Math.max(0, (e.clientX - r.left) / r.width * 100)));
        row.y = Math.round(Math.min(100, Math.max(0, (e.clientY - r.top) / r.height * 100)));
        const m = prev.querySelector("img, video"); m.style.objectPosition = pos(row); pin.style.left = `${row.x}%`; pin.style.top = `${row.y}%`;
      };
      const commit = () => { const row = wall[wallAt]; if (row) store.put(row).catch(() => {}); renderWall(); };
      prev.addEventListener("pointerdown", e => { prev.setPointerCapture(e.pointerId); setPoint(e); });
      prev.addEventListener("pointermove", e => { if (prev.hasPointerCapture(e.pointerId)) setPoint(e); });
      prev.addEventListener("pointerup", commit);
      prev.addEventListener("keydown", e => {
        const row = wall[wallAt], d = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] }[e.key];
        if (!row || !d) return; e.preventDefault();
        row.x = Math.min(100, Math.max(0, (row.x ?? 50) + d[0])); row.y = Math.min(100, Math.max(0, (row.y ?? 50) + d[1])); paint(); commit();
      });
      $(".tw-wall-add", box).addEventListener("click", () => $(".tw-wall-files", box).click());
      $(".tw-wall-files", box).addEventListener("change", async e => { await addMedia([...e.target.files], status); e.target.value = ""; paint(); });
      $(".tw-wall-thumbs", box).addEventListener("click", e => { const b = e.target.closest("[data-i]"); if (!b) return; wallAt = Number(b.dataset.i); renderWall(); paint(); });
      $(".tw-wall-auto", box).addEventListener("change", e => { save("life-ledger-wall-prefs" + suffix, { ...wallPrefs(), auto: e.target.checked }); renderWall(); });
      $(".tw-seg", box).addEventListener("click", e => { const b = e.target.closest("[data-fit]"); if (!b) return; save("life-ledger-wall-prefs" + suffix, { ...wallPrefs(), fit: b.dataset.fit }); box.querySelectorAll("[data-fit]").forEach(x => x.setAttribute("aria-checked", String(x === b))); renderWall(); paint(); });
      $(".tw-wall-remove", box).addEventListener("click", async () => {
        const row = wall[wallAt]; if (!row || !(await window.appConfirm(t("removeConfirm")))) return;
        await store.delete(row.id).catch(() => {}); wall.splice(wallAt, 1); wallAt = Math.max(0, Math.min(wallAt, wall.length - 1)); renderWall(); paint();
      });
      paint();
    }
    // The sample workspace starts with a filled, visible photo wall (persona photos stored like user media).
    async function seedDemo(names) {
      if ((await store.all()).length) return;
      for (const [i, name] of names.entries()) {
        try { const blob = await (await fetch(`./assets/demo-memories/${name}.jpg`)).blob(); await store.put({ id: "demo-" + name, name, type: "image/jpeg", blob, created: i, x: 50, y: 50 }); } catch {}
      }
      wallLoaded = false; window.LifeLedgerTodayCards?.show(id); loadWall();
    }
    return { renderWall, loadWall, wallSettings, seedDemo, W };
  }

  const walls = { wall: makeWall(cards.wall, "wall", ""), wall2: makeWall(cards.wall2, "wall2", "-2"), wall3: makeWall(cards.wall3, "wall3", "-3") };
  const loadWall = () => Object.values(walls).forEach(w => w.loadWall());
  setTimeout(() => {
    if (typeof state === "undefined" || !window.LifeLedgerDemoWorkspace?.isDemoActive?.(state) || read("life-ledger-wall-demo-seeded")) return;
    save("life-ledger-wall-demo-seeded", 1);
    void walls.wall.seedDemo(["spree-sunset", "run-park", "meetup-talk", "weekend-hike", "analyst-desk", "dinner-friends"]);
    // a second wall shows that any card can be added more than once (user 10/21)
    void walls.wall2.seedDemo(["dashboard-screen", "team-whiteboard", "notebook-plan", "german-books"]);
  }, 1200);

  // ---- frequency habits (weekly / monthly targets): this month's record distribution (user 10/21) ----
  const freqHabits = date => activeHabits(date).filter(h => ["weekly", "monthly"].includes(versionFor(h, date)?.frequency));
  let freqPick = read("life-ledger-freq-habit");
  function freq() {
    const c = cards.freq, date = selectedPlanningDate, sel = parseDate(date), y = sel.getFullYear(), m = sel.getMonth();
    const list = freqHabits(date), tabs = $(".tw-freq-tabs", c), grid = $(".tw-freq-grid", c), count = $(".tw-freq-count", c);
    c.classList.toggle("is-empty", !list.length);
    if (!list.length) { tabs.innerHTML = ""; $(".tw-heat-weekdays", c).innerHTML = ""; count.textContent = ""; $(".tw-freq-month", c).textContent = ""; grid.innerHTML = `<div class="tw-empty tw-freq-empty"><div class="tw-art" data-art="empty-habits"></div><strong>${escapeHtml(t("freqEmptyTitle"))}</strong><p>${escapeHtml(t("freqEmpty"))}</p></div>`; arts(c); return; }
    const habit = list.find(h => h.id === freqPick) || list[0], v = versionFor(habit, date), color = (colors[habit.color] || colors.sage).solid;
    paint(c.firstElementChild, colors[habit.color] ? habit.color : "sage");
    $(".tw-freq-month", c).textContent = new Intl.DateTimeFormat({ en: "en-GB", zh: "zh-CN", de: "de-DE" }[lang()], { month: "short" }).format(new Date(y, m, 1, 12));
    tabs.innerHTML = list.length > 1 ? list.map(h => `<button type="button" role="tab" data-h="${escapeHtml(h.id)}" aria-selected="${h === habit}">${escapeHtml(displayHabitName(h))}</button>`).join("") : `<strong>${escapeHtml(displayHabitName(habit))}</strong>`;
    tabs.insertAdjacentHTML("afterbegin", `<span class="tw-freq-icon" style="--c:${color}">${renderIcon(habit.icon)}</span>`);
    $(".tw-heat-weekdays", c).innerHTML = [1, 2, 3, 4, 5, 6, 0].map(d => `<span>${escapeHtml(weekdayShortName(d))}</span>`).join("");
    const offset = (new Date(y, m, 1).getDay() + 6) % 7, cells = Array.from({ length: offset }, () => `<span class="tw-heat-cell is-spacer" aria-hidden="true"></span>`);
    let monthDone = 0;
    for (let day = 1; day <= new Date(y, m + 1, 0).getDate(); day++) {
      const key = isoDate(new Date(y, m, day, 12)), done = getLog(key).completed.includes(habit.id), future = isFutureDate(key);
      if (done) monthDone++;
      cells.push(`<button type="button" class="tw-heat-cell tw-freq-day${done ? " is-done" : ""}${future ? " is-future" : ""}${key === date ? " is-selected" : ""}" data-date="${key}" aria-pressed="${done}" aria-label="${key}" ${future ? "disabled" : ""} style="--c:${color}">${day}</button>`);
    }
    while (cells.length < 42) cells.push(`<span class="tw-heat-cell is-spacer" aria-hidden="true"></span>`);
    grid.innerHTML = cells.join("");
    // Week target counts Monday–Sunday of the selected date; month target counts the month.
    let n = monthDone;
    if (v.frequency === "weekly") { const mon = new Date(sel); mon.setDate(sel.getDate() - ((sel.getDay() + 6) % 7)); n = 0; for (let i = 0; i < 7; i++) { const d = new Date(mon); d.setDate(mon.getDate() + i); if (getLog(isoDate(d)).completed.includes(habit.id)) n++; } }
    const target = periodTargetFor(v) || 1;
    count.textContent = `${n}/${target}`; count.title = t(v.frequency === "weekly" ? "freqWeek" : "freqMonth", { done: n, target });
    c.firstElementChild.style.setProperty("--p", Math.min(1, n / target));
    $(".tw-ring", c).setAttribute("aria-label", count.title);
  }
  cards.freq.addEventListener("click", e => {
    const h = e.target.closest("[data-h]")?.dataset.h;
    if (h) { freqPick = h; save("life-ledger-freq-habit", h); freq(); return; }
    const d = e.target.closest("[data-date]")?.dataset.date;
    if (d) openDrawer(d);
  });

  // ---- day photos: cloud edition from private storage, local editions from this device (user 10/27) ----
  let photoAsk = 0;
  async function photos() {
    const c = cards.photos, list = $(".tw-photo-list", c), note = $(".tw-photo-note", c), date = selectedPlanningDate;
    const emptyArt = text => { list.innerHTML = `<div class="tw-empty"><div class="tw-art" data-art="photos-day-empty"></div><strong>${escapeHtml(t("photosLocalTitle"))}</strong><p>${escapeHtml(text)}</p></div>`; note.textContent = ""; arts(c); };
    const demo = window.LifeLedgerDemoWorkspace?.isDemoActive?.(state);
    if (!demo && (!photosEnabled || !photoMemories)) { emptyArt(t("photosLocal")); return; }
    const ask = ++photoAsk;
    let rows = [];
    try { rows = await photoMemories?.listRange(date, date) || []; } catch {}
    rows = mergeDemoTimelinePhotos(rows, date, date);
    if (ask !== photoAsk) return;
    if (!rows.length) { emptyArt(t("photosEmpty")); return; }
    list.innerHTML = rows.slice(0, 3).map(p => `<img src="${escapeHtml(p.url)}" alt="" loading="lazy">`).join("");
    note.textContent = "";
  }
  $(".tw-open-day", cards.photos).addEventListener("click", () => openDrawer(selectedPlanningDate));

  // ---- focus: mirrors the original timer; the button runs the original start/pause ----
  function focus() {
    const c = cards.focus, src = $("#focusInlineTimer"), btn = $("#focusQuickPrimary")?.textContent || "";
    $(".tw-focus-ring strong", c).textContent = $("#focusInlineTime")?.textContent || "25:00";
    $(".tw-focus-topic", c).textContent = $("#focusInlineLabel")?.textContent || "";
    $(".tw-focus-today", c).textContent = `${t("focusToday")} · ${focusTodayStats().minutes} ${t("min")}`;
    $(".tw-focus-start", c).textContent = btn;
    const p = Number(src?.style.getPropertyValue("--focus-inline-progress")) || 0;
    c.firstElementChild.style.setProperty("--p", p);
    const running = btn === tr("focus.pause"), paused = btn === tr("focus.resume"), brk = ($("#focusInlinePhase")?.textContent || "") === tr("focus.phaseBreak");
    c.classList.toggle("is-running", running);
    const art = $(".tw-focus-art", c); art.dataset.art = paused ? "focus-paused" : brk ? "focus-break" : p > 0.999 ? "focus-complete" : "focus-idle"; arts(c);
  }
  $(".tw-focus-start", cards.focus).addEventListener("click", () => handleFocusQuickPrimary());
  const focusSrc = $("#focusInlineTimer");
  if (focusSrc) new MutationObserver(() => { if (shown("focus")) focus(); }).observe(focusSrc, { subtree: true, characterData: true, childList: true });

  // Mount every hairline placeholder (data-art) inside a card once; hairline.js caches the SVGs.
  function arts(scope) { scope.querySelectorAll(".tw-art[data-art]").forEach(n => window.LifeLedgerHairline?.mount(n, n.dataset.art)); }
  function labels() {
    view.querySelectorAll("[data-tw]").forEach(n => { n.textContent = t(n.dataset.tw); });
    Object.values(walls).forEach(({ W }) => { $('[data-wall="prev"]', W).setAttribute("aria-label", t("prev")); $('[data-wall="next"]', W).setAttribute("aria-label", t("next")); });
    $("#weatherHour").setAttribute("aria-label", t("hour"));
    view.querySelectorAll(".tw-wall-stage[aria-label]").forEach(stage => { stage.setAttribute("aria-label", stage.getAttribute("aria-label").replace(/^[^·]+/, t("wall") + " ").replace(/·[^·]+$/, m => stage.getAttribute("aria-label").split("·").length > 2 ? "· " + t("wallTip") : m)); });
  }
  function render() {
    labels();
    if (shown("rhythm")) rhythm();
    if (shown("heatmap")) heatmap();
    if (shown("photos")) void photos();
    if (shown("focus")) focus();
    if (shown("freq")) freq();
    drawWeather(); void loadWeather();
    loadWall();
    arts(cards.weather);
  }
  // Re-render with every original Today render (date change, check-in, language).
  const original = window.renderToday;
  window.renderToday = function (...args) { const r = original.apply(this, args); try { render(); } catch (e) { console.error(e); } return r; };

  // Month card shows moods only (heatmap is its own card now, user 10/18).
  if (typeof calendarViewMode !== "undefined" && calendarViewMode === "heatmap") setCalendarViewMode("mood");

  const heatSettings = box => {
    box.innerHTML = `<label class="tw-setting"><span>${escapeHtml(t("palette"))}</span><select>${["green", "blue", "spectrum"].map(p => `<option value="${p}">${escapeHtml(t(p))}</option>`).join("")}</select></label>`;
    const s = $("select", box); s.value = read("life-ledger-heatmap-palette") || "green";
    s.addEventListener("change", () => { save("life-ledger-heatmap-palette", s.value); heatmap(); });
  };
  // Allowed sizes (S 1×1, M 2×1, L 2×2, X 4×2); first = default. hidden = only in the widget library at first.
  window.LifeLedgerExtraCards = [
    { id: "weather", el: cards.weather, sizes: ["L", "M", "S"], hidden: false, settings: weatherSettings, relabel: box => { $(".tw-city-form span", box).textContent = t("city"); $(".tw-city-form button", box).textContent = t("search"); }, onShow: () => { drawWeather(); void loadWeather(); } },
    { id: "freq", el: cards.freq, sizes: ["L", "M"], hidden: false, onShow: freq },
    { id: "rhythm", el: cards.rhythm, sizes: ["M", "S"], hidden: false, onShow: rhythm },
    { id: "heatmap", el: cards.heatmap, sizes: ["S", "M", "L"], hidden: false, settings: heatSettings, relabel: heatSettings, onShow: heatmap },
    ...Object.entries(walls).map(([id, w]) => ({ id, el: cards[id], sizes: ["L", "S", "M", "X"], hidden: true, settings: w.wallSettings, onShow: w.loadWall })),
    { id: "photos", el: cards.photos, sizes: ["M", "L"], hidden: true, onShow: photos },
    { id: "focus", el: cards.focus, sizes: ["S", "M"], hidden: false, onShow: focus },
  ];
  window.LifeLedgerTodayWidgets = { render, text: t };
  setTimeout(render);
})();
