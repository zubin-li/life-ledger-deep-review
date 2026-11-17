/* Visible hairline art in every main view header + scroll reveal for feed / horizon cards. */
(function (root) {
  const VIEW_ROOT = {
    today: "todayView",
    week: "weekView",
    longrange: "longrangeView",
    timeline: "timelineView",
    ledger: "ledgerView",
    review: "reviewView",
    insights: "insightsView",
  };

  function artName(view) {
    if (view === "today") return new Date().getHours() < 17 ? "today-morning" : "today-evening";
    if (view === "week") return "empty-week";
    if (view === "longrange") return "horizon-plans-quiet";
    if (view === "timeline") return "journal-section-quiet";
    if (view === "ledger") return "today-quick-ledger";
    if (view === "review") return "review-section-quiet";
    if (view === "insights") return "insights-first-week";
    return "";
  }

  function mountViewArt(view) {
    const name = artName(view);
    const HL = root.LifeLedgerHairline;
    if (!name || !HL) return;
    const id = VIEW_ROOT[view];
    const el = document.getElementById(id);
    if (!el) return;
    let host = null;

    if (view === "today") {
      // Inside the hero card (a separate header row became an empty grid cell on Today).
      el.querySelector(":scope > .view-page-header--today")?.remove();
      const hero = el.querySelector(".hero-card");
      if (!hero) return;
      let wrap = hero.querySelector(".page-art");
      if (!wrap) {
        wrap = document.createElement("div");
        wrap.className = "page-art page-art--hero";
        wrap.setAttribute("aria-hidden", "true");
        const art = document.createElement("div");
        art.className = "ll-art";
        art.setAttribute("data-art", "");
        wrap.append(art);
        hero.append(wrap);
      }
      host = wrap.querySelector("[data-art]");
    } else if (view === "week") {
      const header = el.querySelector(".week-page-header");
      if (!header) return;
      header.querySelector(".week-page-art")?.remove();
      let wrap = header.querySelector(".page-art");
      if (!wrap) {
        wrap = document.createElement("div");
        wrap.className = "page-art";
        const art = document.createElement("div");
        art.className = "ll-art";
        art.setAttribute("data-art", "");
        wrap.append(art);
        const nav = header.querySelector(".week-navigation");
        if (nav) header.insertBefore(wrap, nav);
        else header.append(wrap);
      }
      host = wrap.querySelector("[data-art]");
    } else if (view === "longrange") {
      const header = el.querySelector(".horizon-heading");
      if (!header) return;
      let wrap = header.querySelector(".page-art");
      if (!wrap) {
        wrap = document.createElement("div");
        wrap.className = "page-art";
        const art = document.createElement("div");
        art.className = "ll-art";
        art.setAttribute("data-art", "");
        wrap.append(art);
        header.insertBefore(wrap, header.firstChild);
      }
      host = wrap.querySelector("[data-art]");
    } else if (view === "timeline") {
      const header = el.querySelector(".journal-feed-heading");
      if (!header) return;
      header.querySelector(".journal-page-art")?.remove();
      let wrap = header.querySelector(".page-art");
      if (!wrap) {
        wrap = document.createElement("div");
        wrap.className = "page-art";
        const art = document.createElement("div");
        art.className = "ll-art";
        art.setAttribute("data-art", "");
        wrap.append(art);
        const titleBlock = header.querySelector(":scope > div");
        if (titleBlock?.nextSibling) header.insertBefore(wrap, titleBlock.nextSibling);
        else header.append(wrap);
      }
      host = wrap.querySelector("[data-art]");
    } else if (view === "ledger") {
      const head = el.querySelector(".money-head");
      if (!head) return;
      let wrap = head.querySelector(".page-art");
      if (!wrap) {
        wrap = document.createElement("div");
        wrap.className = "page-art";
        const art = document.createElement("div");
        art.className = "ll-art";
        art.setAttribute("data-art", "");
        wrap.append(art);
        head.append(wrap);
      }
      host = wrap.querySelector("[data-art]");
    } else if (view === "review") {
      const intro = el.querySelector(".review-intro");
      if (!intro) return;
      intro.querySelector(".review-page-art")?.remove();
      let wrap = intro.querySelector(".page-art");
      if (!wrap) {
        wrap = document.createElement("div");
        wrap.className = "page-art";
        const art = document.createElement("div");
        art.className = "ll-art";
        art.setAttribute("data-art", "");
        wrap.append(art);
        intro.append(wrap);
      }
      host = wrap.querySelector("[data-art]");
    } else if (view === "insights") {
      host = el.querySelector(".ins-hero-art [data-art]");
    }

    if (!host) return;
    if (host.dataset.mounted !== name) HL.mount(host, name);
  }

  function mountAll() {
    Object.keys(VIEW_ROOT).forEach(mountViewArt);
  }

  function observeScrollReveal(scope) {
    const box = scope && scope.querySelectorAll ? scope : document;
    const nodes = [...box.querySelectorAll(".ll-scroll-reveal:not(.is-visible)")];
    if (!nodes.length) return;
    if (document.documentElement.classList.contains("motion-reduced")) {
      nodes.forEach(n => n.classList.add("is-visible"));
      return;
    }
    let stagger = 0;
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.style.setProperty("--reveal-delay", `${Math.min(stagger, 12) * 60}ms`);
        stagger += 1;
        el.classList.add("is-visible");
        io.unobserve(el);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    nodes.forEach(n => io.observe(n));
  }

  function onActiveViewChange() {
    const view = document.body.dataset.activeView;
    if (view) mountViewArt(view);
  }

  function boot() {
    mountAll();
    onActiveViewChange();
    new MutationObserver(onActiveViewChange).observe(document.body, { attributes: true, attributeFilter: ["data-active-view"] });
    root.addEventListener?.("longrange-rendered", () => mountViewArt("longrange"));
    root.addEventListener?.("money-rendered", () => mountViewArt("ledger"));
    root.addEventListener?.("insights-rendered", () => mountViewArt("insights"));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  root.LifeLedgerViewHeaders = { mountViewArt, mountAll, observeScrollReveal };
})(typeof window !== "undefined" ? window : globalThis);