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

  // toolbar search pill (checklist A2): opens the ⌘K palette
  const actions = $("#mobileTopActions");
  if (actions && !$("#deskSearch")) {
    const pill = document.createElement("button");
    pill.type = "button"; pill.id = "deskSearch"; pill.className = "desk-search";
    pill.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg><span></span><kbd>⌘K</kbd>';
    pill.addEventListener("click", () => window.LifeLedgerPalette?.open());
    actions.prepend(pill);
  }
  const labelSearch = () => { const s = $("#deskSearch span"); if (s) s.textContent = languageText("搜索或跳转", "Search or jump to", "Suchen oder springen"); };
  labelSearch();
  new MutationObserver(labelSearch).observe(root, { attributes: true, attributeFilter: ["lang"] });

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
