/* Life Ledger for Mac — window glue around the unchanged web app.
   Injected by the app (Tauri initialization script) into the local window and into the user's own cloud
   deployment. The web page itself never contains this code. It adds no UI of its own: the 2.0 desktop design
   is the app. It only (1) marks the page as running in the Mac window, (2) adds the invisible window drag strip,
   (3) turns browser behaviours off (Reload/Inspect menu, ⌘R, pinch zoom, image drag), (4) runs menu-bar commands,
   (5) keeps the native menus in the interface language, (6) uses native sheets for confirm/alert. */
(() => {
  if (window.top !== window || window.__llMac) return;
  window.__llMac = true;
  const T = window.__TAURI__;
  const invoke = T?.core?.invoke;
  // Runs at document start (no <html> yet): mark the page as soon as the root element exists.
  let root = document.documentElement;
  const whenRoot = fn => root ? fn() : new MutationObserver((_, o) => { if ((root = document.documentElement)) { o.disconnect(); fn(); } }).observe(document, { childList: true });
  whenRoot(() => root.classList.add("ll-mac"));

  // Native sheets instead of WebKit's (absent) confirm/alert UI. The page uses window.confirm/alert on the web.
  if (invoke) {
    const label = (zh, en, de) => ({ zh, en, de }[typeof currentLang === "string" ? currentLang : "en"] || en);
    window.appConfirm = message => invoke("ask_confirm", { message: String(message), ok: label("确定", "OK", "OK"), cancel: label("取消", "Cancel", "Abbrechen") }).catch(() => false);
    window.appAlert = message => invoke("show_alert", { message: String(message) }).catch(() => undefined);
  }

  const ready = fn => document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn, { once: true }) : fn();
  ready(() => {
    // the window drag strip along the top edge (Tauri handles mousedown on data-tauri-drag-region)
    const drag = document.createElement("div");
    drag.className = "ll-drag"; drag.setAttribute("data-tauri-drag-region", ""); drag.setAttribute("aria-hidden", "true");
    document.body.append(drag);

    // menu bar language follows the page language
    const menuLanguage = () => invoke?.("set_menu_language", { lang: typeof currentLang === "string" ? currentLang : document.documentElement.lang?.slice(0, 2) || "en" }).catch(() => {});
    menuLanguage();
    new MutationObserver(menuLanguage).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  });

  // the window starts hidden (no white flash); show it once the page has painted
  const win = T?.window?.getCurrentWindow?.();
  ready(() => requestAnimationFrame(() => requestAnimationFrame(() => win?.show().catch(() => {}))));

  // fullscreen: the traffic lights are gone, the sidebar takes its web spacing back
  const fullscreen = () => win?.isFullscreen().then(on => document.documentElement?.classList.toggle("ll-fullscreen", on)).catch(() => {});
  addEventListener("resize", fullscreen); ready(fullscreen);

  // no browser tells: WebKit's Reload/Inspect menu only where text is edited or selected; no ⌘R / ⌘+ zoom / pinch
  document.addEventListener("contextmenu", e => {
    if (e.target.closest?.("input, textarea, [contenteditable='true']") || String(getSelection())) return;
    e.preventDefault();
  });
  addEventListener("keydown", e => {
    if (!e.metaKey) return;
    const k = e.key.toLowerCase();
    if (k === "r" || k === "=" || k === "+" || k === "-" || k === "0") e.preventDefault();
  }, true);
  for (const type of ["gesturestart", "gesturechange"]) document.addEventListener(type, e => e.preventDefault());
  document.addEventListener("dragstart", e => { if (e.target instanceof HTMLImageElement && !e.target.closest(".tc-editing")) e.preventDefault(); });

  // menu-bar commands (Rust emits "menu://action"); they press the page's own buttons
  const $ = s => document.querySelector(s);
  const click = s => { const el = $(s); if (el && !el.disabled) el.click(); return Boolean(el); };
  const activeView = () => $(".nav-item.active")?.dataset.view || "today";
  const step = {
    today: d => typeof shiftPlanningDay === "function" && shiftPlanningDay(d),
    week: d => click(d < 0 ? "#previousWorkspaceWeek" : "#nextWorkspaceWeek"),
    timeline: d => click(d < 0 ? "#timelinePreviousMonth" : "#timelineNextMonth"),
    review: d => click(d < 0 ? "#prevMonth" : "#nextMonth"),
  };
  const closeDialogs = () => document.querySelectorAll("dialog[open]").forEach(d => d.close());
  function handle(action) {
    window.dispatchEvent(new CustomEvent("ll-mac-action", { detail: action }));
    if (action.startsWith("view:")) { closeDialogs(); click(`.nav-item[data-view="${action.slice(5)}"]`); return; }
    switch (action) {
      case "settings": closeDialogs(); click("#settingsButton"); break;
      case "new-habit": closeDialogs(); click('.nav-item[data-view="habits"]'); setTimeout(() => click("#addHabitButton"), 0); break;
      case "export": closeDialogs(); if (typeof openBackupDialog === "function") openBackupDialog(); break;
      case "import": closeDialogs(); if (typeof openBackupDialog === "function") { openBackupDialog(); click("#chooseImportFile"); } break;
      case "sidebar:toggle": click("#sidebarToggle"); break;
      case "date:today": click("#todayButton"); break;
      case "date:prev": step[activeView()]?.(-1); break;
      case "date:next": step[activeView()]?.(1); break;
    }
  }
  window.LifeLedgerMac = { handle };
  T?.event?.listen?.("menu://action", e => handle(String(e.payload || "")));
})();
