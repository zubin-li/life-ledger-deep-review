// Life Ledger for Mac — ⌘K command palette. Mac app only.
(() => {
  if (!document.documentElement.hasAttribute("data-mac")) return;

  const L = (zh, en, de) => {
    if (typeof languageText === "function") return languageText(zh, en, de);
    const lang = typeof currentLang === "string" ? currentLang : "en";
    return lang === "zh" ? zh : lang === "de" ? de : en;
  };

  const getState = () => (typeof state !== "undefined" ? state : window.state || {});

  const backdrop = document.createElement("div");
  backdrop.className = "palette-backdrop";
  backdrop.hidden = true;

  const dialog = document.createElement("div");
  dialog.className = "palette-dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", "Command palette");

  const inputWrap = document.createElement("div");
  inputWrap.className = "palette-input-wrap";
  inputWrap.innerHTML = `
    <svg class="palette-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
    <input
      class="palette-input"
      type="text"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      role="combobox"
      aria-autocomplete="list"
      aria-expanded="true"
      aria-controls="paletteListbox"
      aria-activedescendant=""
    />
    <span class="palette-esc-hint" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">esc</span>
  `;

  const listbox = document.createElement("div");
  listbox.className = "palette-listbox";
  listbox.id = "paletteListbox";
  listbox.setAttribute("role", "listbox");

  dialog.appendChild(inputWrap);
  dialog.appendChild(listbox);
  backdrop.appendChild(dialog);
  document.body.appendChild(backdrop);

  const input = inputWrap.querySelector(".palette-input");

  let isOpen = false;
  let previousActiveElement = null;
  let flatItems = [];
  let selectedIndex = 0;

  function parseDateQuery(q) {
    const s = q.trim();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
    let m = s.match(/^(\d{4})[-/. ](\d{1,2})[-/. ](\d{1,2})$/);
    if (m) {
      const y = parseInt(m[1], 10), mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
      if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
        return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
    }

    // MM-DD or MM/DD
    m = s.match(/^(\d{1,2})[-/](\d{1,2})$/);
    if (m) {
      const mo = parseInt(m[1], 10), d = parseInt(m[2], 10);
      if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
        let y = currentYear;
        if (mo > currentMonth + 3) y = currentYear - 1;
        return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
    }

    // DD.MM. or DD.MM or DD.MM.YYYY
    m = s.match(/^(\d{1,2})\.(\d{1,2})\.?(\d{4})?\.?$/);
    if (m) {
      const d = parseInt(m[1], 10), mo = parseInt(m[2], 10);
      let y = m[3] ? parseInt(m[3], 10) : currentYear;
      if (!m[3] && mo > currentMonth + 3) y = currentYear - 1;
      if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
        return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
    }

    return null;
  }

  function formatDateLabel(iso) {
    const parts = iso.split("-").map(Number);
    const day = parts[2];
    const year = parts[0];
    const thisYear = new Date().getFullYear();
    const yearSuffix = year !== thisYear ? ` ${year}` : "";

    const lang = typeof currentLang === "string" ? currentLang : "en";
    if (lang === "zh") {
      return `打开 ${year !== thisYear ? `${year}年` : ""}${parts[1]}月${day}日`;
    }
    if (lang === "de") {
      const monthsDe = [
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember"
      ];
      return `${day}. ${monthsDe[parts[1] - 1]}${yearSuffix} öffnen`;
    }
    const monthsEn = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `Open ${day} ${monthsEn[parts[1] - 1]}${yearSuffix}`;
  }

  function formatDay(dateStr) {
    try {
      const parts = dateStr.split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2], 12);
      if (typeof formatLocalizedDate === "function") {
        return formatLocalizedDate(d, { year: "numeric", month: "short", day: "numeric" });
      }
      const loc = (typeof currentLang === "string" ? currentLang : "en") === "zh" ? "zh-CN" : (typeof currentLang === "string" ? currentLang : "en") === "de" ? "de-DE" : "en-US";
      return new Intl.DateTimeFormat(loc, { year: "numeric", month: "short", day: "numeric" }).format(d);
    } catch {
      return dateStr;
    }
  }

  function buildSections(query) {
    const q = query.trim().toLowerCase();
    const sections = [];
    const st = getState();

    // Date Jump (if query matches date pattern)
    let dateItem = null;
    if (q) {
      const dateParsed = parseDateQuery(q);
      if (dateParsed) {
        dateItem = {
          type: "date",
          date: dateParsed,
          title: formatDateLabel(dateParsed),
          run() {
            if (typeof openDrawer === "function") {
              openDrawer(dateParsed);
            }
            close();
          },
        };
      }
    }

    if (dateItem) {
      sections.push({
        label: L("日期", "Days", "Tage"),
        items: [dateItem],
      });
    }

    // 1. Go to (Views)
    const views = [
      { id: "today", shortcut: "⌘1", en: ["today"] },
      { id: "week", shortcut: "⌘2", en: ["week", "this week"] },
      { id: "longrange", shortcut: "⌘3", en: ["longrange", "long-range", "long range", "longterm", "long-term", "long term"] },
      { id: "timeline", shortcut: "⌘4", en: ["timeline"] },
      { id: "review", shortcut: "⌘5", en: ["review"] },
      { id: "habits", shortcut: "⌘6", en: ["habits", "settings"] },
    ];

    const viewItems = [];
    for (const v of views) {
      const navEl = document.querySelector(`.nav-item[data-view="${v.id}"]`);
      const label = (navEl?.querySelector(".nav-label") || navEl)?.textContent?.trim() || v.id;

      let matches = !q;
      if (q) {
        if (label.toLowerCase().includes(q)) matches = true;
        if (v.en.some(kw => kw.includes(q))) matches = true;
        if (v.id.includes(q)) matches = true;
      }

      if (matches) {
        viewItems.push({
          type: "view",
          id: v.id,
          title: label,
          shortcut: v.shortcut,
          run() {
            if (typeof switchToView === "function") {
              switchToView(v.id);
            } else {
              navEl?.click();
            }
            close();
          },
        });
      }
    }

    if (viewItems.length > 0) {
      sections.push({
        label: L("前往", "Go to", "Gehe zu"),
        items: viewItems,
      });
    }

    // 2. Today's habits
    const today = typeof isoDate === "function" ? isoDate(new Date()) : new Date().toISOString().slice(0, 10);
    const activeHabitList = typeof activeHabits === "function" ? activeHabits(today) : (st.habits || []).filter(h => h.active);
    const log = typeof getLog === "function" ? getLog(today) : (st.logs?.[today] || { completed: [] });
    const completedIds = log.completed || [];

    const habitItems = [];
    for (const habit of activeHabitList) {
      const name = typeof displayHabitName === "function" ? displayHabitName(habit) : (habit.name || habit.id);
      const done = completedIds.includes(habit.id);
      const title = `${done ? "✓" : "○"} ${name}`;

      let matches = !q;
      if (q) {
        if (name.toLowerCase().includes(q)) matches = true;
        if (habit.id.toLowerCase().includes(q)) matches = true;
        if (title.toLowerCase().includes(q)) matches = true;
      }

      if (matches) {
        const v = typeof versionFor === "function" ? versionFor(habit, today) : habit.versions?.[0];
        const meta = typeof habitMetaLabel === "function" && v ? habitMetaLabel(v) : "";
        habitItems.push({
          type: "habit",
          id: habit.id,
          title,
          subtitle: meta,
          done,
          run() {
            if (typeof toggleHabit === "function") {
              toggleHabit(today, habit.id);
            }
            render(true);
          },
        });
      }
    }

    if (habitItems.length > 0) {
      sections.push({
        label: L("今日习惯", "Today's habits", "Heutige Gewohnheiten"),
        items: habitItems,
      });
    }

    // 3. Days (Note search for queries with length >= 2)
    if (q && q.length >= 2 && st.logs) {
      const noteMatches = Object.entries(st.logs)
        .filter(([date, l]) => typeof l?.note === "string" && l.note.toLowerCase().includes(q))
        .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
        .slice(0, 6);

      const noteItems = [];
      for (const [date, l] of noteMatches) {
        const clean = l.note.replace(/\s+/g, " ").trim();
        const idx = clean.toLowerCase().indexOf(q);
        const start = Math.max(0, idx - 20);
        const end = Math.min(clean.length, idx + q.length + 30);
        let excerpt = clean.slice(start, end).trim();
        if (start > 0) excerpt = "…" + excerpt;
        if (end < clean.length) excerpt = excerpt + "…";

        noteItems.push({
          type: "note",
          date,
          title: formatDay(date),
          subtitle: excerpt,
          run() {
            if (typeof openDrawer === "function") {
              openDrawer(date);
            }
            close();
          },
        });
      }

      if (noteItems.length > 0) {
        sections.push({
          label: L("日记与记录", "Journal & Notes", "Tagebuch & Notizen"),
          items: noteItems,
        });
      }
    }

    // 4. Actions
    const actionDefs = [
      {
        title: L("新增习惯", "New habit", "Neue Gewohnheit"),
        subtitle: L("创建新习惯并设定目标", "Create a new habit and set targets", "Neue Gewohnheit erstellen und Ziel festlegen"),
        keywords: ["new habit", "add habit", "create habit", "新增习惯", "添加习惯", "neue gewohnheit"],
        run() {
          close();
          if (typeof openHabitDialog === "function") openHabitDialog();
          else document.getElementById("addHabitButton")?.click();
        },
      },
      {
        title: L("导入与导出备份", "Import / Export backup", "Backup importieren / exportieren"),
        subtitle: L("管理本地备份文件", "Manage local backup files", "Lokale Backupdateien verwalten"),
        keywords: ["backup", "export", "import", "备份", "导出", "导入", "sicherung"],
        run() {
          close();
          if (typeof openBackupDialog === "function") openBackupDialog();
          else document.getElementById("exportButton")?.click();
        },
      },
      {
        title: L("设置", "Settings", "Einstellungen"),
        subtitle: L("偏好设置与个性化", "Preferences and customization", "Einstellungen und Anpassung"),
        keywords: ["settings", "preferences", "设置", "偏好", "einstellungen"],
        run() {
          close();
          document.getElementById("settingsButton")?.click();
        },
      },
      {
        title: L("回到今天", "Go to today", "Zu heute springen"),
        subtitle: L("回到今日概览与打卡", "Return to today overview", "Zurück zur heutigen Übersicht"),
        keywords: ["today", "go to today", "回到今天", "今天", "zu heute", "heute"],
        run() {
          close();
          document.getElementById("todayButton")?.click();
        },
      },
      {
        title: L("外观：跟随系统", "Theme: System", "Design: System"),
        subtitle: L("自动匹配系统外观", "Match system appearance", "Automatisch an Systemeinstellung anpassen"),
        keywords: ["theme", "system", "auto", "跟随系统", "系统主题", "systemeinstellung", "design"],
        run() {
          close();
          const sel = document.getElementById("themeSelect");
          if (sel) { sel.value = "system"; sel.dispatchEvent(new Event("change", { bubbles: true })); }
        },
      },
      {
        title: L("外观：浅色模式", "Theme: Light", "Design: Hell"),
        subtitle: L("切换为明亮界面", "Switch to light appearance", "Zu hellem Erscheinungsbild wechseln"),
        keywords: ["theme", "light", "appearance", "浅色", "亮色", "主题", "hell", "design"],
        run() {
          close();
          const sel = document.getElementById("themeSelect");
          if (sel) { sel.value = "light"; sel.dispatchEvent(new Event("change", { bubbles: true })); }
        },
      },
      {
        title: L("外观：深色模式", "Theme: Dark", "Design: Dunkel"),
        subtitle: L("切换为暗黑界面", "Switch to dark appearance", "Zu dunklem Erscheinungsbild wechseln"),
        keywords: ["theme", "dark", "appearance", "深色", "暗色", "主题", "dunkel", "design"],
        run() {
          close();
          const sel = document.getElementById("themeSelect");
          if (sel) { sel.value = "dark"; sel.dispatchEvent(new Event("change", { bubbles: true })); }
        },
      },
      {
        title: L("语言：中文", "Language: Chinese", "Sprache: Chinesisch"),
        subtitle: L("切换界面语言为中文", "Switch interface language to Chinese", "Oberflächensprache auf Chinesisch umstellen"),
        keywords: ["language", "chinese", "zh", "中文", "语言", "sprache", "chinesisch"],
        run() {
          close();
          const sel = document.getElementById("languageSelect");
          if (sel) { sel.value = "zh"; sel.dispatchEvent(new Event("change", { bubbles: true })); }
        },
      },
      {
        title: L("语言：English", "Language: English", "Sprache: Englisch"),
        subtitle: L("切换界面语言为 English", "Switch interface language to English", "Oberflächensprache auf Englisch umstellen"),
        keywords: ["language", "english", "en", "英语", "英文", "语言", "sprache", "englisch"],
        run() {
          close();
          const sel = document.getElementById("languageSelect");
          if (sel) { sel.value = "en"; sel.dispatchEvent(new Event("change", { bubbles: true })); }
        },
      },
      {
        title: L("语言：Deutsch", "Language: German", "Sprache: Deutsch"),
        subtitle: L("切换界面语言为 Deutsch", "Switch interface language to German", "Oberflächensprache auf Deutsch umstellen"),
        keywords: ["language", "german", "deutsch", "de", "德语", "德文", "语言", "sprache"],
        run() {
          close();
          const sel = document.getElementById("languageSelect");
          if (sel) { sel.value = "de"; sel.dispatchEvent(new Event("change", { bubbles: true })); }
        },
      },
    ];

    const actionItems = [];
    for (const act of actionDefs) {
      let matches = !q;
      if (q) {
        if (act.title.toLowerCase().includes(q)) matches = true;
        if (act.keywords.some(kw => kw.includes(q))) matches = true;
      }
      if (matches) actionItems.push(act);
    }

    if (actionItems.length > 0) {
      sections.push({
        label: L("操作", "Actions", "Aktionen"),
        items: actionItems,
      });
    }

    return sections;
  }

  function render(preserveSelection = false) {
    const sections = buildSections(input.value);
    flatItems = sections.flatMap(s => s.items);

    if (!preserveSelection || selectedIndex >= flatItems.length) {
      selectedIndex = flatItems.length > 0 ? 0 : -1;
    }

    listbox.innerHTML = "";

    if (flatItems.length === 0) {
      const emptyEl = document.createElement("div");
      emptyEl.className = "palette-empty";
      emptyEl.style.overflow = "hidden";
      emptyEl.style.textOverflow = "ellipsis";
      emptyEl.style.whiteSpace = "nowrap";
      emptyEl.textContent = L("未找到相关结果", "No matching commands or records", "Keine passenden Befehle oder Einträge");
      listbox.appendChild(emptyEl);
      input.removeAttribute("aria-activedescendant");
      return;
    }

    let itemIndex = 0;
    for (const section of sections) {
      const labelEl = document.createElement("div");
      labelEl.className = "palette-section-label";
      labelEl.setAttribute("role", "presentation");
      labelEl.style.overflow = "hidden";
      labelEl.style.textOverflow = "ellipsis";
      labelEl.style.whiteSpace = "nowrap";
      labelEl.textContent = section.label;
      listbox.appendChild(labelEl);

      for (const item of section.items) {
        const curIndex = itemIndex;
        const opt = document.createElement("div");
        opt.className = "palette-item";
        opt.setAttribute("role", "option");
        opt.id = `palette-item-${curIndex}`;
        if (item.date) opt.dataset.date = item.date;
        opt.setAttribute("aria-selected", String(curIndex === selectedIndex));

        const main = document.createElement("div");
        main.className = "palette-item-main";

        const title = document.createElement("div");
        title.className = "palette-item-title";
        title.textContent = item.title;
        main.appendChild(title);

        if (item.subtitle) {
          const sub = document.createElement("div");
          sub.className = "palette-item-subtitle";
          sub.textContent = item.subtitle;
          main.appendChild(sub);
        }

        opt.appendChild(main);

        if (item.shortcut) {
          const sc = document.createElement("div");
          sc.className = "palette-item-shortcut";
          sc.style.overflow = "hidden";
          sc.style.textOverflow = "ellipsis";
          sc.style.whiteSpace = "nowrap";
          sc.textContent = item.shortcut;
          opt.appendChild(sc);
        }

        opt.addEventListener("pointerdown", e => {
          e.preventDefault();
        });
        opt.addEventListener("click", () => {
          selectedIndex = curIndex;
          item.run();
        });

        listbox.appendChild(opt);
        itemIndex++;
      }
    }

    updateActiveDescendant();
  }

  function updateActiveDescendant() {
    const options = listbox.querySelectorAll('[role="option"]');
    options.forEach((opt, idx) => {
      const isSelected = idx === selectedIndex;
      opt.setAttribute("aria-selected", String(isSelected));
      if (isSelected) {
        input.setAttribute("aria-activedescendant", opt.id);
        opt.scrollIntoView({ block: "nearest" });
      }
    });
    if (selectedIndex < 0) {
      input.removeAttribute("aria-activedescendant");
    }
  }

  function moveSelection(delta) {
    if (flatItems.length === 0) return;
    selectedIndex = (selectedIndex + delta + flatItems.length) % flatItems.length;
    updateActiveDescendant();
  }

  function executeSelected() {
    if (selectedIndex >= 0 && selectedIndex < flatItems.length) {
      flatItems[selectedIndex].run();
    }
  }

  function open() {
    if (!isOpen) {
      previousActiveElement = document.activeElement;
      isOpen = true;
      backdrop.hidden = false;
    }
    input.value = "";
    input.placeholder = L("搜索页面、习惯、日期或操作…", "Type a command, habit, date or view…", "Befehl, Gewohnheit, Datum oder Ansicht suchen…");
    selectedIndex = 0;
    render();
    input.focus({ preventScroll: true });
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    backdrop.hidden = true;
    if (previousActiveElement && typeof previousActiveElement.focus === "function") {
      try {
        previousActiveElement.focus({ preventScroll: true });
      } catch {}
    }
    previousActiveElement = null;
  }

  input.addEventListener("input", () => {
    selectedIndex = 0;
    render();
  });

  input.addEventListener("keydown", event => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveSelection(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSelection(-1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      executeSelected();
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      event.preventDefault();
      moveSelection(event.shiftKey ? -1 : 1);
    } else if (event.metaKey && !event.shiftKey && !event.altKey && !event.ctrlKey) {
      if (event.key >= "1" && event.key <= "6") {
        const viewIndex = parseInt(event.key, 10) - 1;
        const viewIds = ["today", "week", "longrange", "timeline", "review", "habits"];
        if (viewIds[viewIndex]) {
          event.preventDefault();
          if (typeof switchToView === "function") switchToView(viewIds[viewIndex]);
          close();
        }
      }
    }
  });

  backdrop.addEventListener("pointerdown", event => {
    if (event.target === backdrop) {
      event.preventDefault();
      close();
    }
  });

  window.addEventListener("keydown", event => {
    if ((event.metaKey || event.ctrlKey) && (event.key === "k" || event.key === "K")) {
      event.preventDefault();
      if (isOpen) {
        close();
      } else {
        open();
      }
    } else if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  }, true);

  window.addEventListener("ll-mac-action", event => {
    if (event.detail === "palette") {
      open();
    }
  });

  window.LifeLedgerPalette = {
    open,
    close,
  };
})();
