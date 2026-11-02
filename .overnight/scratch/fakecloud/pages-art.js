/* Week / Timeline / Insights / Habits: hairline art for empty and done states (web and Mac app). */
(function () {

  const VIEW_IDS = ["weekView", "timelineView", "reviewView", "habitsView"];
  const PALETTE = {
    coral: { soft: "#f4d8d0", solid: "#d97861" },
    sage: { soft: "#dbe6dc", solid: "#6f8f7d" },
    violet: { soft: "#e7e0f4", solid: "#8b79c6" },
    blue: { soft: "#d9e4e7", solid: "#6e8c98" },
    amber: { soft: "#f3e5bf", solid: "#d7a84c" },
  };

  const L = () => ({ en: "en", de: "de" }[(document.documentElement.lang || "zh").slice(0, 2)] || "zh");
  const T = {
    zh: { allDone: "本周目标已全部完成", noHabits: "还没有习惯", addFirst: "添加第一个习惯，让每日节奏更清晰。" },
    en: { allDone: "All weekly goals done", noHabits: "No habits yet", addFirst: "Add your first habit to give each day a rhythm." },
    de: { allDone: "Alle Wochenziele erledigt", noHabits: "Noch keine Gewohnheiten", addFirst: "Lege deine erste Gewohnheit an, um deinem Tag Rhythmus zu geben." },
  };
  const t = k => T[L()][k];
  let frame = 0;
  let enhancing = false;

  function hairline() {
    return window.LifeLedgerHairline;
  }

  function icon(name) {
    if (typeof renderIcon === "function") return renderIcon(name);
    return '<svg class="lucide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg>';
  }

  function applyChip(host, iconName, tone) {
    if (!host || host.dataset.llChip) return;
    const colors = PALETTE[tone] || PALETTE.sage;
    host.dataset.llChip = "1";
    host.classList.add("ll-panel-title");
    host.style.setProperty("--w-soft", colors.soft);
    host.style.setProperty("--w-solid", colors.solid);
    host.style.setProperty("--accent", colors.solid);
    const chip = document.createElement("span");
    chip.className = "ll-chip";
    chip.setAttribute("aria-hidden", "true");
    chip.innerHTML = icon(iconName);
    host.prepend(chip);
  }

  function mountArt(host, name, accent) {
    const HL = hairline();
    if (!host || !HL || !name) return;
    if (accent) host.style.setProperty("--accent", accent);
    HL.mount(host, name);
  }

  function prependArt(container, name, accent) {
    if (!container) return;
    let art = container.querySelector(":scope > .ll-art");
    if (!art) {
      art = document.createElement("div");
      art.className = "ll-art";
      container.prepend(art);
    }
    container.classList.add("ll-empty");
    mountArt(art, name, accent);
  }

  function polishHeaders(root) {
    applyChip(root.querySelector(".weekly-card-heading:not(.long-term-heading) > div"), "target", "coral");
    applyChip(root.querySelector(".weekly-card-heading.long-term-heading > div"), "target", "sage");
    applyChip(root.querySelector(".weekly-writing-heading > div:first-child"), "pen", "amber");
    applyChip(root.querySelector(".timeline-intro > div:first-child"), "pen", "sage");
    applyChip(root.querySelector(".focus-review-panel .panel-heading > div:first-child"), "timer", "violet");
    applyChip(root.querySelector(".chart-panel .panel-heading > div:first-child"), "sunrise", "sage");
    applyChip(root.querySelector(".resistance-panel .panel-heading > div:first-child"), "chart", "blue");
    applyChip(root.querySelector(".monthly-reflection-panel .panel-heading > div:first-child"), "book", "amber");
    applyChip(root.querySelector(".settings-intro > div:first-child"), "footprints", "sage");
  }

  function polishWeek(root) {
    const empty = root.querySelector(".weekly-goal-empty");
    if (empty && !empty.dataset.llEmpty) {
      empty.dataset.llEmpty = "1";
      prependArt(empty, "empty-week-goals", PALETTE.coral.solid);
    }
    const list = root.querySelector("#weeklyGoalList");
    if (list) {
      const goals = list.querySelectorAll(".weekly-goal");
      const done = list.querySelectorAll(".weekly-goal.done");
      let banner = list.querySelector(".ll-week-all-done");
      if (goals.length && goals.length === done.length) {
        if (!banner) {
          banner = document.createElement("div");
          banner.className = "ll-week-all-done ll-empty";
          banner.innerHTML = "<strong></strong>";
          list.appendChild(banner);
        }
        const label = root.querySelector("#weeklyGoalProgress")?.textContent?.trim() || "";
        banner.querySelector("strong").textContent = label ? `${t("allDone")} · ${label}` : t("allDone");
        if (!banner.querySelector(".ll-art")) {
          const art = document.createElement("div");
          art.className = "ll-art";
          banner.prepend(art);
        }
        mountArt(banner.querySelector(".ll-art"), "week-all-done", PALETTE.coral.solid);
      } else if (banner) {
        banner.remove();
      }
    }
    const writing = root.querySelector(".weekly-writing-panel");
    const heading = writing?.querySelector(".weekly-writing-heading");
    const textarea = root.querySelector("#weeklyOutputText");
    if (heading && textarea) {
      let deco = heading.querySelector(".ll-writing-art");
      if (!deco) {
        deco = document.createElement("div");
        deco.className = "ll-writing-art ll-art";
        heading.appendChild(deco);
      }
      const artName = textarea.value.trim() ? "week-review-done" : "week-review-empty";
      mountArt(deco, artName, PALETTE.amber.solid);
    }
  }

  function polishTimeline(root) {
    const empty = root.querySelector(".memory-empty");
    if (!empty) return;
    empty.classList.add("ll-polished", "ll-empty");
    if (!empty.dataset.llEmpty) {
      empty.dataset.llEmpty = "1";
      prependArt(empty, "empty-journal", PALETTE.sage.solid);
    }
  }

  function polishReview(root) {
    const empty = root.querySelector(".period-dashboard-empty");
    if (empty && !empty.dataset.llEmpty) {
      empty.dataset.llEmpty = "1";
      empty.classList.add("ll-polished", "ll-empty");
      const hasHelp = Boolean(empty.querySelector("p"));
      const artName = hasHelp ? "empty-habits" : "insights-first-week";
      const accent = hasHelp ? PALETTE.sage.solid : PALETTE.blue.solid;
      prependArt(empty, artName, accent);
    }
    root.querySelectorAll(".score-card").forEach(card => {
      if (!card.dataset.llAccent) {
        card.dataset.llAccent = "1";
        card.style.setProperty("--w-soft", PALETTE.sage.soft);
        card.style.setProperty("--w-solid", PALETTE.sage.solid);
        card.style.setProperty("--accent", PALETTE.sage.solid);
      }
    });
  }

  function polishHabits(root) {
    const list = root.querySelector("#habitSettingsList");
    if (!list) return;
    const rows = list.querySelectorAll(".setting-row");
    if (rows.length) {
      const stale = list.querySelector(":scope > .ll-habits-fallback");
      stale?.remove();
    }
    rows.forEach(row => {
      if (row.dataset.llRow) return;
      row.dataset.llRow = "1";
      const main = row.querySelector(".setting-main strong");
      if (!main) return;
      const style = row.getAttribute("style") || "";
      const solid = /--habit-color:\s*([^;]+)/i.exec(style)?.[1]?.trim();
      const soft = /--habit-soft:\s*([^;]+)/i.exec(style)?.[1]?.trim();
      if (solid) row.style.setProperty("--w-solid", solid);
      if (soft) row.style.setProperty("--w-soft", soft);
      if (solid) row.style.setProperty("--accent", solid);
    });
    let empty = list.querySelector(":scope > .ll-empty");
    if (!rows.length) {
      if (!empty) {
        const HL = hairline();
        const title = root.querySelector("#habitSummary")?.textContent?.trim() || t("noHabits");
        empty = HL ? HL.empty("empty-habits", title, t("addFirst")) : document.createElement("div");
        if (!HL) {
          empty.className = "ll-empty";
          empty.innerHTML = "<strong></strong><p></p>"; empty.querySelector("strong").textContent = title; empty.querySelector("p").textContent = t("addFirst");
          prependArt(empty, "empty-habits", PALETTE.sage.solid);
        }
        list.appendChild(empty);
      }
    }
    if (empty) empty.classList.add("ll-habits-fallback");
  }

  function shouldIgnoreMutation(mutations) {
    return mutations.every(m => {
      const node = m.target.nodeType === 3 ? m.target.parentElement : m.target;
      return node?.closest?.(".ll-art, .ll-chip, .ll-writing-art");
    });
  }

  function enhance() {
    if (enhancing) return;
    enhancing = true;
    try {
      VIEW_IDS.forEach(id => {
        const root = document.getElementById(id);
        if (!root) return;
        polishHeaders(root);
        if (id === "weekView") polishWeek(root);
        if (id === "timelineView") polishTimeline(root);
        if (id === "reviewView") polishReview(root);
        if (id === "habitsView") polishHabits(root);
      });
    } catch (error) {
      console.warn("pages-art enhance failed", error);
    } finally {
      enhancing = false;
    }
  }

  function schedule() {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      enhance();
    });
  }

  function observe() {
    VIEW_IDS.forEach(id => {
      const node = document.getElementById(id);
      if (!node) return;
      new MutationObserver(mutations => {
        if (enhancing || shouldIgnoreMutation(mutations)) return;
        schedule();
      }).observe(node, { childList: true, subtree: true, characterData: true });
    });
    const output = document.getElementById("weeklyOutputText");
    output?.addEventListener("input", schedule);
    enhance();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observe);
  else observe();
})();
