/* Life Ledger for Mac: the window frame, menu-bar commands and Mac conventions around the shared 2.0 frontend.
   Runs only inside the Tauri app (html[data-mac], set in index.html from ?desktop=tauri-*). The web build never
   reaches past the first line. Traffic lights stay OS-owned; this file only owns the surface around them. */
(() => {
  const root = document.documentElement;
  if (!root.hasAttribute("data-mac")) return;
  const $ = (s, r = document) => r.querySelector(s);
  const L = (zh, en, de) => (typeof currentLang === "string" ? { zh, en, de }[currentLang] : en) || en;
  const cloud = root.dataset.mac === "tauri-cloud";
  const PROFILE_KEY = "ll-mac-profile"; // outside the life-ledger-* namespace: survives Load sample / Clear

  // ---- window bar: traffic-light space, sidebar toggle, title, workspace label (drag region = the empty parts) ----
  const bar = document.createElement("header");
  bar.id = "desktopWindowbar"; bar.className = "mac-windowbar"; bar.setAttribute("data-tauri-drag-region", "");
  bar.innerHTML = '<span class="mac-lights" data-tauri-drag-region aria-hidden="true"></span><span class="mac-bar-control" id="macSidebarSlot"></span>'
    + '<span class="mac-bar-title" data-tauri-drag-region>Life Ledger</span><span class="mac-bar-space" data-tauri-drag-region></span>'
    + '<span class="mac-bar-mode" id="macBarMode" data-tauri-drag-region></span>';
  document.body.prepend(bar);
  const toggle = $("#sidebarToggle");
  if (toggle) $("#macSidebarSlot").append(toggle);

  // ---- toolbar: Edit cards joins the pane toolbar; language moves into Settings ----
  const actions = $("#mobileTopActions");
  const editToggle = $("#tcEditToggle");
  if (actions && editToggle) actions.prepend(editToggle);
  const language = $(".language-switcher");
  const appearance = $("#settingsDialog .settings-group");
  if (language && appearance) {
    const row = document.createElement("div");
    row.className = "settings-row"; row.innerHTML = '<span id="macLanguageLabel"></span>';
    row.append(language);
    appearance.insertBefore(row, $("#settingsFontPreview", appearance));
  }

  // ---- account row at the sidebar bottom: device-local name + avatar, edited in Settings ----
  let profile = {};
  const validAvatar = v => typeof v === "string" && v.length <= 150000 && /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v);
  const loadProfile = () => {
    try { profile = JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}; } catch { profile = {}; }
    profile = { name: String(profile.name || "").slice(0, 60), avatar: validAvatar(profile.avatar) ? profile.avatar : "" };
  };
  const identity = $(".profile-identity");
  if (identity) {
    identity.setAttribute("role", "button"); identity.tabIndex = 0; identity.id = "macAccountRow";
    identity.addEventListener("click", () => $("#settingsButton")?.click());
    identity.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("#settingsButton")?.click(); } });
  }
  const dataGroup = $("#settingsDataTitle")?.closest(".settings-group");
  if (dataGroup) {
    const section = document.createElement("section");
    section.className = "settings-group mac-profile-group";
    section.innerHTML = '<h3 id="macProfileTitle"></h3><div class="mac-profile-editor"><span class="mac-profile-avatar" id="macProfileAvatar"></span>'
      + '<div class="mac-profile-fields"><input id="macProfileName" type="text" maxlength="60" autocomplete="off" />'
      + '<div class="mac-profile-buttons"><button type="button" class="secondary-button" id="macProfilePhoto"></button>'
      + '<button type="button" class="text-button" id="macProfileRemove"></button></div></div></div>'
      + '<p class="mac-profile-note" id="macProfileNote"></p><input type="file" id="macProfileFile" accept="image/png,image/jpeg,image/webp" hidden />';
    dataGroup.parentElement.insertBefore(section, $("#settingsDialog .settings-group"));
  }
  const fill = (node, small) => {
    if (!node) return;
    node.replaceChildren();
    if (profile.avatar) { const img = new Image(); img.src = profile.avatar; img.alt = ""; node.append(img); node.classList.add("has-photo"); }
    else if (profile.name) { node.textContent = Array.from(profile.name.trim())[0].toLocaleUpperCase(); node.classList.remove("has-photo"); }
    else if (small) { node.classList.remove("has-photo"); return false; }
    else { node.textContent = "L"; node.classList.remove("has-photo"); }
    return true;
  };
  let sidebarAvatarDefault = null;
  function refreshProfile() {
    const avatar = $(".profile .avatar");
    if (avatar) {
      sidebarAvatarDefault ??= avatar.innerHTML;
      if (!fill(avatar, true)) avatar.innerHTML = sidebarAvatarDefault;
    }
    if (profile.name) { const strong = $(".profile strong"); if (strong) strong.textContent = profile.name; }
    fill($("#macProfileAvatar"));
    const name = $("#macProfileName");
    if (name && document.activeElement !== name) name.value = profile.name;
    if ($("#macProfileRemove")) $("#macProfileRemove").hidden = !profile.avatar;
  }
  const saveProfile = next => {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(next)); profile = next; refreshProfile(); return true; }
    catch { $("#macProfileNote").textContent = L("无法保存，请检查磁盘空间。", "Could not save. Check disk space.", "Speichern fehlgeschlagen. Speicherplatz prüfen."); return false; }
  };
  async function choosePhoto(file) {
    if (!file) return;
    const note = $("#macProfileNote");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      note.textContent = L("请选择不超过 5 MB 的 PNG、JPEG 或 WebP 图片。", "Choose a PNG, JPEG or WebP image up to 5 MB.", "Bitte PNG, JPEG oder WebP bis 5 MB wählen."); return;
    }
    const url = URL.createObjectURL(file);
    try {
      const img = new Image(); img.src = url; await img.decode();
      const canvas = document.createElement("canvas"); canvas.width = canvas.height = 192;
      const side = Math.min(img.naturalWidth, img.naturalHeight), ctx = canvas.getContext("2d");
      ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, 192, 192);
      const avatar = canvas.toDataURL("image/jpeg", 0.85);
      if (!validAvatar(avatar)) throw new Error("invalid");
      saveProfile({ ...profile, avatar });
    } catch {
      note.textContent = L("图片无法读取，原头像已保留。", "Could not read this image. Your previous photo is unchanged.", "Bild nicht lesbar. Das bisherige Bild bleibt.");
    } finally { URL.revokeObjectURL(url); $("#macProfileFile").value = ""; }
  }
  $("#macProfilePhoto")?.addEventListener("click", () => $("#macProfileFile").click());
  $("#macProfileFile")?.addEventListener("change", e => void choosePhoto(e.target.files[0]));
  $("#macProfileRemove")?.addEventListener("click", () => saveProfile({ ...profile, avatar: "" }));
  $("#macProfileName")?.addEventListener("input", e => saveProfile({ ...profile, name: e.target.value.trim().slice(0, 60) }));

  // ---- copy that follows the interface language ----
  function label() {
    const mode = cloud ? L("连接工作区", "Connected workspace", "Verbundener Bereich") : L("本机工作区", "Local workspace", "Lokaler Bereich");
    $("#macBarMode").textContent = mode;
    if ($("#macLanguageLabel")) $("#macLanguageLabel").textContent = L("语言", "Language", "Sprache");
    if ($("#macProfileTitle")) {
      $("#macProfileTitle").textContent = L("你的空间", "Your space", "Dein Bereich");
      $("#macProfileName").placeholder = L("显示名称", "Display name", "Anzeigename");
      $("#macProfileName").setAttribute("aria-label", L("显示名称", "Display name", "Anzeigename"));
      $("#macProfilePhoto").textContent = L("选择头像", "Choose photo", "Bild auswählen");
      $("#macProfileRemove").textContent = L("移除", "Remove", "Entfernen");
      $("#macProfileNote").textContent = L("名称和头像只保存在这台 Mac 上。", "Name and photo stay on this Mac.", "Name und Bild bleiben auf diesem Mac.");
    }
    if (identity) identity.setAttribute("aria-label", L("你的空间与设置", "Your space and settings", "Dein Bereich und Einstellungen"));
    refreshProfile();
  }
  const invoke = window.__TAURI__?.core?.invoke;
  const menuLanguage = () => invoke?.("set_menu_language", { lang: typeof currentLang === "string" ? currentLang : "en" }).catch(() => {});
  loadProfile(); label(); menuLanguage();
  $("#languageSelect")?.addEventListener("change", () => setTimeout(() => { label(); menuLanguage(); }, 0));
  $("#settingsButton")?.addEventListener("click", () => setTimeout(label, 0));

  // ---- toolbar hairline once the pane scrolls; fullscreen drops the traffic-light gap ----
  const pane = $(".main-content");
  pane?.addEventListener("scroll", () => root.classList.toggle("mac-scrolled", pane.scrollTop > 4), { passive: true });
  const tauriWindow = window.__TAURI__?.window?.getCurrentWindow?.();
  const fullscreen = () => tauriWindow?.isFullscreen().then(on => root.classList.toggle("mac-fullscreen", on)).catch(() => {});
  addEventListener("resize", fullscreen); fullscreen();
  // inactive window: quieter chrome, like native title bars
  addEventListener("blur", () => root.classList.add("mac-inactive"));
  addEventListener("focus", () => root.classList.remove("mac-inactive"));

  // ---- no browser tells: WebKit's Reload/Inspect menu only where text is edited or selected ----
  document.addEventListener("contextmenu", e => {
    if (e.target.closest("input, textarea, [contenteditable='true']") || String(getSelection())) return;
    e.preventDefault();
  });
  document.addEventListener("dragstart", e => { if (e.target instanceof HTMLImageElement && !e.target.closest(".tc-grid.tc-editing")) e.preventDefault(); });

  // ---- first run on an empty Mac workspace: offer the three-month sample once (never shown over real records) ----
  const OFFER_KEY = "ll-mac-sample-offer-done";
  addEventListener("load", () => {
    const api = window.LifeLedgerDemoWorkspace;
    if (cloud || !api || localStorage.getItem(OFFER_KEY) || localStorage.getItem("life-ledger-earlier-records")) return;
    if (typeof state === "undefined" || api.isDemoActive(state) || api.hasMeaningfulUserData(state)) return;
    const offer = document.createElement("aside");
    offer.className = "demo-workspace-notice mac-sample-offer"; offer.id = "macSampleOffer";
    offer.innerHTML = '<p></p><div class="demo-workspace-actions"><button type="button" class="secondary-button" data-act="blank"></button><button type="button" class="primary-button" data-act="sample"></button></div>';
    offer.querySelector("p").textContent = L("第一次使用？可以先载入一份三个月的虚构示例，看看用久了是什么样子。随时能在「设置」里清除。",
      "New here? Load a fictional three-month sample to see what Life Ledger looks like after a while. You can clear it in Settings any time.",
      "Neu hier? Lade ein erfundenes Drei-Monats-Beispiel, um zu sehen, wie Life Ledger nach einer Weile aussieht. In den Einstellungen jederzeit löschbar.");
    offer.querySelector('[data-act="blank"]').textContent = L("从空白开始", "Start blank", "Leer beginnen");
    offer.querySelector('[data-act="sample"]').textContent = L("载入示例", "Load sample", "Beispiel laden");
    offer.addEventListener("click", e => {
      const act = e.target.closest("[data-act]")?.dataset.act; if (!act) return;
      localStorage.setItem(OFFER_KEY, "1"); offer.remove();
      if (act === "sample") window.LifeLedgerLoadMacSample?.();
    });
    ($("#demoWorkspaceNotice") || $(".topbar")).after(offer);
  });

  // ---- menu bar commands (Rust emits "menu://action") ----
  const click = s => { const el = $(s); if (el && !el.disabled) el.click(); return Boolean(el); };
  const activeView = () => $(".nav-item.active")?.dataset.view || "today";
  const step = {
    today: d => shiftPlanningDay(d),
    week: d => click(d < 0 ? "#previousWorkspaceWeek" : "#nextWorkspaceWeek"),
    timeline: d => click(d < 0 ? "#timelinePreviousMonth" : "#timelineNextMonth"),
    review: d => click(d < 0 ? "#prevMonth" : "#nextMonth"),
  };
  const closeOpenDialogs = () => document.querySelectorAll("dialog[open]").forEach(d => d.close());
  function handle(action) {
    window.dispatchEvent(new CustomEvent("ll-mac-action", { detail: action }));
    if (action.startsWith("view:")) { closeOpenDialogs(); click(`.nav-item[data-view="${action.slice(5)}"]`); return; }
    switch (action) {
      case "settings": closeOpenDialogs(); click("#settingsButton"); break;
      case "new-habit": closeOpenDialogs(); click('.nav-item[data-view="habits"]'); click("#addHabitButton"); break;
      case "export": closeOpenDialogs(); if (typeof openBackupDialog === "function") openBackupDialog(); break;
      case "import": closeOpenDialogs(); if (typeof openBackupDialog === "function") { openBackupDialog(); click("#chooseImportFile"); } break;
      case "sidebar:toggle": click("#sidebarToggle"); break;
      case "date:today": click("#todayButton"); break;
      case "date:prev": step[activeView()]?.(-1); break;
      case "date:next": step[activeView()]?.(1); break;
    }
  }
  window.LifeLedgerMac = { handle };
  window.__TAURI__?.event?.listen?.("menu://action", e => handle(String(e.payload || "")));
})();
