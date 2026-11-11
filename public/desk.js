// Life Ledger for Mac — desk interactions (inspector, list-detail). Mac app only.
(() => {
  const root = document.documentElement;
  if (!root.hasAttribute("data-mac")) return;

  const $ = (s, r = document) => r.querySelector(s);
  const drawer = $("#dayDrawer");
  const shell = $(".app-shell");
  if (!drawer || !shell) return;

  shell.appendChild(drawer);

  const syncInspector = () => {
    root.classList.toggle("desk-inspector", drawer.classList.contains("open"));
  };
  syncInspector();
  new MutationObserver(syncInspector).observe(drawer, { attributes: true, attributeFilter: ["class"] });

  drawer.tabIndex = -1;
  drawer.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !drawer.classList.contains("open")) return;
    if (!drawer.contains(document.activeElement)) return;
    e.stopPropagation();
    closeDrawer();
  });

  window.addEventListener("ll-mac-action", (e) => {
    if (e.detail !== "inspector:toggle") return;
    if (drawer.classList.contains("open")) closeDrawer();
    else openDrawer(selectedDate);
  });

  const nav = $(".sidebar .main-nav");
  let recentHost = $("#deskRecentDays");
  if (nav && !recentHost) {
    recentHost = document.createElement("div");
    recentHost.id = "deskRecentDays";
    recentHost.className = "desk-recent-days";
    recentHost.innerHTML = '<h3 class="desk-recent-heading"></h3><ul class="desk-recent-list" role="list"></ul>';
    nav.after(recentHost);
    recentHost.querySelector(".desk-recent-list").addEventListener("click", (e) => {
      const row = e.target.closest("[data-recent-day]");
      if (!row) return;
      openDrawer(row.dataset.recentDay);
    });
  }

  if (typeof switchToView === "function") {
    const baseSwitch = switchToView;
    window.switchToView = function deskSwitchToView(view) {
      baseSwitch.apply(this, arguments);
      if (view === "timeline" && typeof setJournalMode === "function") setJournalMode("timeline");
    };
  }

  const locale = () => (currentLang === "zh" ? "zh-CN" : currentLang === "de" ? "de-DE" : "en-US");
  const shortDate = (date) => {
    const d = parseDate(date);
    return new Intl.DateTimeFormat(locale(), { month: "short", day: "numeric", weekday: "short" }).format(d);
  };

  function renderRecentDays() {
    if (!recentHost) return;
    recentHost.querySelector(".desk-recent-heading").textContent = languageText("最近", "Recent", "Zuletzt");
    const list = recentHost.querySelector(".desk-recent-list");
    const open = drawer.classList.contains("open");
    const today = parseDate(isoDate(new Date()));
    const rows = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const date = isoDate(d);
      const habits = activeHabits(date);
      const log = getLog(date);
      const done = habits.filter((h) => log.completed.includes(h.id)).length;
      const mood = log.mood;
      const moodClass = mood ? moodCalendarClass(mood) : "";
      rows.push(`<li><button type="button" class="desk-recent-row" data-recent-day="${date}"${
        open && date === selectedDate ? ' aria-current="date"' : ""
      }><span class="desk-recent-date">${shortDate(date)}</span><span class="desk-recent-progress">${done}/${habits.length}</span>${
        mood ? `<span class="desk-recent-mood ${moodClass}" aria-hidden="true"></span>` : "<span aria-hidden=\"true\"></span>"
      }</button></li>`);
    }
    list.innerHTML = rows.join("");
  }

  const baseRenderAll = window.renderAll;
  if (typeof baseRenderAll === "function") {
    window.renderAll = function deskRenderAll(...args) {
      baseRenderAll.apply(this, args);
      renderRecentDays();
    };
  }
  renderRecentDays();
})();
