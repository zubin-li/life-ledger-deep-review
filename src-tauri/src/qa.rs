//! QA probe for the real Mac window (cargo feature `qa`, never in release builds).
//! The page reports the rectangles of its controls; this checks, with AppKit's own hit-testing, that each
//! control actually receives the mouse (and is not covered by the hidden title bar or the traffic lights),
//! records where macOS drew the traffic lights, writes JSON to $LL_QA_OUT and quits.
use objc2::rc::Retained;
use objc2::runtime::AnyObject;
use objc2_app_kit::{NSView, NSWindow, NSWindowButton};
use objc2_foundation::{NSPoint, NSRect};
use tauri::{AppHandle, Manager, WebviewWindow};

#[derive(serde::Deserialize)]
pub struct Probe {
    name: String,
    x: f64,
    y: f64,
}

fn class_name(view: &NSView) -> String {
    let obj: &AnyObject = view.as_ref();
    obj.class().name().to_string_lossy().into_owned()
}

/// "web" when the point lands in the page (the WKWebView or one of its internal views), else the AppKit class.
fn owner(view: Option<Retained<NSView>>) -> String {
    let mut current = view;
    let first = current.as_deref().map(class_name).unwrap_or_else(|| "none".into());
    while let Some(v) = current {
        if class_name(&v).contains("WebView") {
            return "web".into();
        }
        current = unsafe { v.superview() };
    }
    first
}

fn measure(window: &WebviewWindow, probes: &[Probe]) -> String {
    let ns: &NSWindow = unsafe { &*(window.ns_window().expect("ns_window") as *const NSWindow) };
    let content = ns.contentView().expect("content view");
    let height = content.frame().size.height;
    let theme = unsafe { content.superview() }.unwrap_or(content.clone());
    let top_left = |r: NSRect| (r.origin.x, height - r.origin.y - r.size.height, r.size.width, r.size.height);
    let mut buttons = Vec::new();
    for (name, kind) in [("close", NSWindowButton::CloseButton), ("minimize", NSWindowButton::MiniaturizeButton), ("zoom", NSWindowButton::ZoomButton)] {
        if let Some(b) = ns.standardWindowButton(kind) {
            let r = b.convertRect_toView(b.bounds(), None);
            let (x, y, w, h) = top_left(r);
            let hit = owner(theme.hitTest(NSPoint::new(x + w / 2.0, height - (y + h / 2.0))));
            buttons.push(format!(r#"{{"name":"{name}","x":{x},"y":{y},"w":{w},"h":{h},"hit":"{hit}"}}"#));
        }
    }
    let hits: Vec<String> = probes
        .iter()
        .map(|p| {
            let hit = owner(theme.hitTest(NSPoint::new(p.x, height - p.y)));
            format!(r#"{{"name":{:?},"x":{},"y":{},"hit":"{}"}}"#, p.name, p.x, p.y, hit)
        })
        .collect();
    let size = content.frame().size;
    format!(
        r#"{{"window":{{"w":{},"h":{}}},"buttons":[{}],"probes":[{}]}}"#,
        size.width,
        size.height,
        buttons.join(","),
        hits.join(",")
    )
}

#[tauri::command]
pub fn qa_probe(app: AppHandle, probes: Vec<Probe>) {
    let Some(window) = app.get_webview_window("local").or_else(|| app.get_webview_window("cloud")) else { return };
    let out = std::env::var("LL_QA_OUT").unwrap_or_else(|_| "/tmp/ll-qa.json".into());
    let handle = app.clone();
    let _ = app.run_on_main_thread(move || {
        let json = measure(&window, &probes);
        let _ = std::fs::write(&out, json);
        if std::env::var("LL_QA_KEEP").is_err() {
            handle.exit(0);
        }
    });
}

/// Page side: after the page settles, report the controls near the top of the window and a row of points
/// along the drag strip.
pub const QA_SCRIPT: &str = r##"
addEventListener("load", () => setTimeout(() => {
  const probes = [];
  const add = (name, x, y) => probes.push({ name, x: Math.round(x), y: Math.round(y) });
  document.querySelectorAll(".sidebar-toggle, .brand, .nav-item, .topbar button, .topbar select, .topbar a, #todayButton, .date-jump select").forEach((el, i) => {
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    const n = (el.id || el.className || el.tagName).toString().split(" ")[0] + "#" + i;
    add(n + ":center", r.left + r.width / 2, r.top + r.height / 2);
    add(n + ":top", r.left + r.width / 2, r.top + 3);
  });
  for (let x = 120; x < innerWidth - 20; x += 160) add("drag-strip", x, 12);
  add("scrollY=" + Math.round(scrollY) + " view=" + (document.body.dataset.activeView || "") + " hash=" + location.hash, -1, -1);
  const st = (() => { try { return JSON.parse(localStorage.getItem("life-ledger-v1") || "{}"); } catch { return {}; } })();
  const sel = document.querySelector("#yearSelect"), mood = document.querySelector("#todayView .mood-card");
  add("state logs=" + Object.keys(st.logs || {}).length + " demo=" + Boolean(st.meta && st.meta.demo && st.meta.demo.active) + " backup=" + Boolean(localStorage.getItem("life-ledger-earlier-records"))
    + " demoNotice=" + !document.querySelector("#demoWorkspaceNotice")?.hidden + " clearBtn=" + Boolean(document.querySelector("#clearDemoWorkspace")?.offsetWidth)
    + " selAppearance=" + (sel ? getComputedStyle(sel).webkitAppearance || getComputedStyle(sel).appearance : "")
    + " moodWeek=" + Boolean(document.querySelector("#moodWeek")) + " moodText=" + (mood ? mood.innerText.replace(/\s+/g, "|").slice(0, 60) : "")
    + " noteColor=" + getComputedStyle(document.querySelector(".sidebar-note p")).color
    + " focusTab=" + Boolean(document.querySelector(".daily-tool-tabs")?.offsetWidth) + " mic=" + Boolean(document.querySelector("#journalDictate")?.offsetWidth)
    + " popout=" + Boolean(document.querySelector("#journalPopoutButton")?.offsetWidth) + " ver=" + (document.querySelector('link[href*="v202"]')?.getAttribute("href") || "none")
    + " speech=" + Boolean(window.SpeechRecognition || window.webkitSpeechRecognition) + " voiceHosted=" + !document.querySelector("#voiceReflectionButton")?.hidden, -1, -1);
  window.__TAURI__.core.invoke("qa_probe", { probes });
}, 4000));
"##;

/// Cloud-window scenario ($LL_QA_CLOUD): report how the page runs in the cloud window, save one test download,
/// then use "Sign Out of Cloud" and report again once the window is back on the deployment.
pub const QA_CLOUD_SCRIPT: &str = r##"
addEventListener("load", () => setTimeout(async () => {
  if (window.top !== window || location.pathname.startsWith("/cdn-cgi/")) return;
  const invoke = (cmd, args) => window.__TAURI__.core.invoke(cmd, args);
  const back = sessionStorage.getItem("ll-qa-signed-out") === "1";
  const api = await fetch("/api/state", { cache: "no-store" }).then(r => r.status).catch(() => -1);
  const report = {
    stage: back ? "after-sign-out" : "first-load",
    url: location.origin + location.pathname + location.search,
    ua: navigator.userAgent, cloudMode: typeof cloudMode !== "undefined" && cloudMode,
    desktop: typeof desktopMode !== "undefined" ? desktopMode : "", api,
    saveMode: document.querySelector("#saveMode")?.textContent.trim(),
    exportIconHidden: getComputedStyle(document.querySelector("#exportButton")).display === "none",
    photosOn: !document.querySelector("#moodPhotoSection")?.hidden || null, shell: document.documentElement.classList.contains("ll-mac")
  };
  if (back) { report.done = true; await invoke("qa_report", { line: JSON.stringify(report) }); return; }
  triggerFileDownload(new Blob(['{"qa":"mac cloud download"}'], { type: "application/json" }), "life-ledger-qa-download.json");
  await new Promise(r => setTimeout(r, 1500));
  await invoke("qa_report", { line: JSON.stringify(report) });
  sessionStorage.setItem("ll-qa-signed-out", "1");
  await invoke("qa_sign_out");
}, 3500));
"##;

#[tauri::command]
pub fn qa_report(line: String) {
    let out = std::env::var("LL_QA_OUT").unwrap_or_else(|_| "/tmp/ll-qa.json".into());
    let _ = std::fs::OpenOptions::new().create(true).append(true).open(out).and_then(|mut f| std::io::Write::write_all(&mut f, format!("{line}\n").as_bytes()));
}

#[tauri::command]
pub fn qa_sign_out(app: AppHandle) {
    crate::sign_out_of_cloud(&app);
}
