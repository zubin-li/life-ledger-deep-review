use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex, OnceLock};
use std::thread;
use std::time::Duration;
use tauri::{
    menu::{AboutMetadata, MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder},
    AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder, WindowEvent,
};
use url::Url;

const MAX_JSON_IMPORT_BYTES: u64 = 10 * 1024 * 1024;
const LAST_WORKSPACE_FILE: &str = "last-workspace.txt";
const MENU_EVENT: &str = "menu://action";
/// The cloud window says it is Safari: Google refuses OAuth sign-in in embedded web views it does not recognise,
/// and Cloudflare's login page is written for real browsers. Same engine (WebKit), so the claim is true in practice.
const SAFARI_UA: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15";
/// Cloudflare Access ends the session on this path of the deployment itself (all Access apps, cookie cleared).
const ACCESS_LOGOUT_PATH: &str = "/cdn-cgi/access/logout";
/// Menu language last reported by the page, so the menu can be rebuilt when the cloud window opens or closes.
static MENU_LANG: Mutex<String> = Mutex::new(String::new());
/// Trailing debounce window for coalescing Moved/Resized bursts (e.g. a drag) into one write.
const WINDOW_STATE_DEBOUNCE: Duration = Duration::from_millis(300);

/// Parses the flat "x:y:width:height" window-state format written by `flush_window_state`.
/// Values are always logical (DPI-independent) pixels.
fn parse_window_state(contents: &str) -> Option<(f64, f64, f64, f64)> {
    let mut parts = contents.trim().split(':');
    let x: f64 = parts.next()?.parse().ok()?;
    let y: f64 = parts.next()?.parse().ok()?;
    let width: f64 = parts.next()?.parse().ok()?;
    let height: f64 = parts.next()?.parse().ok()?;
    if parts.next().is_some() || width <= 0.0 || height <= 0.0 {
        return None;
    }
    Some((x, y, width, height))
}

/// Converts a physical window position/size pair (what the OS reports) into logical,
/// DPI-independent units at the given scale factor — the same units `WebviewWindowBuilder`'s
/// `position`/`inner_size` expect. Saving physical values but restoring them as logical would
/// misplace/mis-size the window on any Retina or mixed-DPI display.
fn physical_to_logical(position: PhysicalPosition<i32>, size: PhysicalSize<u32>, scale_factor: f64) -> (f64, f64, f64, f64) {
    let logical_position = position.to_logical::<f64>(scale_factor);
    let logical_size = size.to_logical::<f64>(scale_factor);
    (logical_position.x, logical_position.y, logical_size.width, logical_size.height)
}

static WINDOW_STATE_DIR: OnceLock<Option<PathBuf>> = OnceLock::new();

/// Resolves and creates the window-state directory exactly once for the process lifetime, so
/// no directory I/O ever happens on the Moved/Resized event-delivery (drag/resize) hot path.
fn window_state_dir(app: &AppHandle) -> Option<PathBuf> {
    WINDOW_STATE_DIR
        .get_or_init(|| {
            let dir = app.path().app_data_dir().ok()?;
            fs::create_dir_all(&dir).ok()?;
            Some(dir)
        })
        .clone()
}

fn window_state_path(app: &AppHandle, label: &str) -> Option<PathBuf> {
    window_state_dir(app).map(|dir| dir.join(format!("window-state-{label}.txt")))
}

fn load_window_state(app: &AppHandle, label: &str) -> Option<(f64, f64, f64, f64)> {
    let path = window_state_path(app, label)?;
    let contents = fs::read_to_string(path).ok()?;
    parse_window_state(&contents)
}

fn flush_window_state(app: &AppHandle, label: &str, geometry: (f64, f64, f64, f64)) {
    let Some(path) = window_state_path(app, label) else {
        return;
    };
    let contents = format!("{}:{}:{}:{}", geometry.0, geometry.1, geometry.2, geometry.3);
    let _ = fs::write(path, contents);
}

#[derive(Default)]
struct PendingWindowState {
    generation: u64,
    geometry: Option<(f64, f64, f64, f64)>,
}

/// Takes the pending geometry only if `generation` is still the latest one queued (i.e. no
/// newer update arrived while this write was waiting out the debounce) — otherwise a fresher
/// write has already superseded it, so this one does nothing and returns `None`.
fn commit_if_current(pending: &Mutex<PendingWindowState>, generation: u64) -> Option<(f64, f64, f64, f64)> {
    let mut state = pending.lock().unwrap();
    if state.generation != generation {
        return None;
    }
    state.geometry.take()
}

/// Unconditionally takes whatever geometry is pending and invalidates any in-flight debounced
/// writer, for a final synchronous flush on window close.
fn take_pending_geometry(pending: &Mutex<PendingWindowState>) -> Option<(f64, f64, f64, f64)> {
    let mut state = pending.lock().unwrap();
    state.generation += 1;
    state.geometry.take()
}

/// Records the latest geometry and schedules a debounced write on a short-lived background
/// thread, so a Moved/Resized burst (dragging or resizing) coalesces into a single filesystem
/// write instead of one per event. The spawned thread only holds plain data (an `AppHandle`,
/// a label, and the geometry) — never the `WebviewWindow` itself — so it cannot keep the
/// native window alive.
fn queue_window_state_write(app: &AppHandle, label: &str, pending: &Arc<Mutex<PendingWindowState>>, geometry: (f64, f64, f64, f64)) {
    let generation = {
        let mut state = pending.lock().unwrap();
        state.generation += 1;
        state.geometry = Some(geometry);
        state.generation
    };
    let app_handle = app.clone();
    let label = label.to_string();
    let pending = pending.clone();
    thread::spawn(move || {
        thread::sleep(WINDOW_STATE_DEBOUNCE);
        if let Some(geometry) = commit_if_current(&pending, generation) {
            flush_window_state(&app_handle, &label, geometry);
        }
    });
}

/// Persists position/size (debounced, off the event-delivery thread) on every move or resize,
/// and (for local/cloud windows only) re-shows and focuses the launcher once this window is
/// destroyed — flushing any not-yet-written geometry synchronously first.
fn watch_window_lifecycle(app: &AppHandle, window: &WebviewWindow, restore_launcher_on_close: bool) {
    let app_handle = app.clone();
    let tracked_window = window.clone();
    let label = window.label().to_string();
    let pending: Arc<Mutex<PendingWindowState>> = Arc::default();
    window.on_window_event(move |event| match event {
        WindowEvent::Moved(_) | WindowEvent::Resized(_) => {
            let (Ok(scale_factor), Ok(position), Ok(size)) = (
                tracked_window.scale_factor(),
                tracked_window.outer_position(),
                tracked_window.inner_size(),
            ) else {
                return;
            };
            let geometry = physical_to_logical(position, size, scale_factor);
            queue_window_state_write(&app_handle, &label, &pending, geometry);
        }
        WindowEvent::Destroyed => {
            if let Some(geometry) = take_pending_geometry(&pending) {
                flush_window_state(&app_handle, &label, geometry);
            }
            if restore_launcher_on_close {
                if let Some(launcher) = app_handle.get_webview_window("launcher") {
                    let _ = launcher.show();
                    let _ = launcher.set_focus();
                }
            }
        }
        _ => {}
    });
}

fn show_launcher(app: &AppHandle) {
    if let Some(launcher) = app.get_webview_window("launcher") {
        let _ = launcher.show();
        let _ = launcher.set_focus();
    }
}

/// Settings → "Switch to local / sync mode": forget the remembered workspace (so the next start asks again)
/// and bring back the start window. The current window stays open until the user picks.
#[tauri::command]
fn switch_workspace(app: AppHandle) -> Result<(), String> {
    if let Some(path) = last_workspace_path(&app) {
        let _ = fs::remove_file(path);
    }
    show_launcher(&app);
    Ok(())
}

fn hide_launcher(app: &AppHandle) {
    if let Some(launcher) = app.get_webview_window("launcher") {
        let _ = launcher.hide();
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum Workspace {
    Local,
    Cloud(String),
}

fn classify_workspace(raw: &str) -> Option<Workspace> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return None;
    }
    if trimmed == "local" {
        return Some(Workspace::Local);
    }
    validate_cloud_url(trimmed)
        .ok()
        .map(|url| Workspace::Cloud(url.to_string()))
}

fn last_workspace_path(app: &AppHandle) -> Option<PathBuf> {
    window_state_dir(app).map(|dir| dir.join(LAST_WORKSPACE_FILE))
}

fn save_last_workspace(app: &AppHandle, workspace: &Workspace) {
    let Some(path) = last_workspace_path(app) else {
        return;
    };
    let contents = match workspace {
        Workspace::Local => "local".to_string(),
        Workspace::Cloud(url) => url.clone(),
    };
    let _ = fs::write(path, contents);
}

/// Same as `load_last_workspace`, for callbacks without an `AppHandle` (the directory is cached at startup).
fn cached_last_workspace() -> Option<Workspace> {
    let dir = WINDOW_STATE_DIR.get()?.clone()?;
    classify_workspace(&fs::read_to_string(dir.join(LAST_WORKSPACE_FILE)).ok()?)
}

fn load_last_workspace(app: &AppHandle) -> Option<Workspace> {
    let path = last_workspace_path(app)?;
    let contents = fs::read_to_string(path).ok()?;
    classify_workspace(&contents)
}

fn focused_main_window(app: &AppHandle) -> Option<WebviewWindow> {
    let local = app.get_webview_window("local");
    let cloud = app.get_webview_window("cloud");
    let focused = |w: &Option<WebviewWindow>| w.as_ref().is_some_and(|w| w.is_focused().unwrap_or(false));
    if focused(&cloud) {
        return cloud;
    }
    if focused(&local) {
        return local;
    }
    local.or(cloud)
}

fn emit_menu_action(app: &AppHandle, action: &str) {
    if action == "cloud:signout" {
        sign_out_of_cloud(app);
        return;
    }
    if action == "workspace:switch" {
        show_launcher(app);
        return;
    }
    if let Some(window) = focused_main_window(app) {
        let _ = window.emit(MENU_EVENT, action);
    }
}

fn menu_action_for_id(id: &str) -> Option<&'static str> {
    match id {
        "settings" => Some("settings"),
        "new_habit" => Some("new-habit"),
        "export_backup" => Some("export"),
        "import_backup" => Some("import"),
        "workspace_switch" => Some("workspace:switch"),
        "cloud_sign_out" => Some("cloud:signout"),
        "view_today" => Some("view:today"),
        "view_week" => Some("view:week"),
        "view_longrange" => Some("view:longrange"),
        "view_timeline" => Some("view:timeline"),
        "view_review" => Some("view:review"),
        "view_habits" => Some("view:habits"),
        "sidebar_toggle" => Some("sidebar:toggle"),
        "date_today" => Some("date:today"),
        "date_prev" => Some("date:prev"),
        "date_next" => Some("date:next"),
        _ => None,
    }
}

/// Menu titles for the app languages (zh / en / de); the frontend calls `set_menu_language` on load and on change.
fn menu_label(lang: &str, key: &str) -> &'static str {
    let row: [&'static str; 3] = match key {
        "about" => ["关于 Life Ledger", "About Life Ledger", "Über Life Ledger"],
        "settings" => ["设置…", "Settings…", "Einstellungen …"],
        "services" => ["服务", "Services", "Dienste"],
        "hide" => ["隐藏 Life Ledger", "Hide Life Ledger", "Life Ledger ausblenden"],
        "hide_others" => ["隐藏其他", "Hide Others", "Andere ausblenden"],
        "show_all" => ["全部显示", "Show All", "Alle einblenden"],
        "quit" => ["退出 Life Ledger", "Quit Life Ledger", "Life Ledger beenden"],
        "file" => ["文件", "File", "Ablage"],
        "new_habit" => ["新增习惯", "New Habit", "Neue Gewohnheit"],
        "export_backup" => ["导出备份…", "Export Backup…", "Backup exportieren …"],
        "import_backup" => ["导入备份…", "Import Backup…", "Backup importieren …"],
        "workspace_switch" => ["切换工作区…", "Switch Workspace…", "Arbeitsbereich wechseln …"],
        "cloud_sign_out" => ["退出云端登录", "Sign Out of Cloud", "Von der Cloud abmelden"],
        "close" => ["关闭窗口", "Close Window", "Fenster schließen"],
        "edit" => ["编辑", "Edit", "Bearbeiten"],
        "undo" => ["撤销", "Undo", "Widerrufen"],
        "redo" => ["重做", "Redo", "Wiederholen"],
        "cut" => ["剪切", "Cut", "Ausschneiden"],
        "copy" => ["拷贝", "Copy", "Kopieren"],
        "paste" => ["粘贴", "Paste", "Einsetzen"],
        "select_all" => ["全选", "Select All", "Alles auswählen"],
        "view" => ["显示", "View", "Darstellung"],
        "view_today" => ["今日", "Today", "Heute"],
        "view_week" => ["本周", "Week", "Woche"],
        "view_longrange" => ["长期", "Horizon", "Horizont"],
        "view_timeline" => ["时间线", "Timeline", "Zeitleiste"],
        "view_review" => ["复盘", "Review", "Rückblick"],
        "view_habits" => ["习惯设置", "Habits", "Gewohnheiten"],
        "sidebar_toggle" => ["显示或隐藏边栏", "Show or Hide Sidebar", "Seitenleiste ein-/ausblenden"],
        "date_today" => ["回到今天", "Go to Today", "Zu heute"],
        "date_prev" => ["上一天 / 上一页", "Previous", "Zurück"],
        "date_next" => ["下一天 / 下一页", "Next", "Weiter"],
        "fullscreen" => ["进入全屏幕", "Enter Full Screen", "Vollbildmodus"],
        "window" => ["窗口", "Window", "Fenster"],
        "minimize" => ["最小化", "Minimize", "Im Dock ablegen"],
        "zoom" => ["缩放", "Zoom", "Zoomen"],
        _ => ["", "", ""],
    };
    match lang {
        "zh" => row[0],
        "de" => row[2],
        _ => row[1],
    }
}

fn build_app_menu(app: &AppHandle, lang: &str) -> Result<tauri::menu::Menu<tauri::Wry>, tauri::Error> {
    let t = |key: &str| menu_label(lang, key);
    let item = |id: &str, accel: Option<&str>| {
        let builder = MenuItemBuilder::with_id(id, t(id));
        match accel {
            Some(a) => builder.accelerator(a).build(app),
            None => builder.build(app),
        }
    };
    let about = PredefinedMenuItem::about(
        app,
        Some(t("about")),
        Some(AboutMetadata {
            name: Some(app.package_info().name.clone()),
            version: Some(app.package_info().version.to_string()),
            ..Default::default()
        }),
    )?;
    let app_menu = SubmenuBuilder::new(app, "Life Ledger")
        .item(&about)
        .separator()
        .item(&item("settings", Some("CmdOrCtrl+,"))?)
        .separator()
        .item(&PredefinedMenuItem::services(app, Some(t("services")))?)
        .separator()
        .item(&PredefinedMenuItem::hide(app, Some(t("hide")))?)
        .item(&PredefinedMenuItem::hide_others(app, Some(t("hide_others")))?)
        .item(&PredefinedMenuItem::show_all(app, Some(t("show_all")))?)
        .separator()
        .item(&PredefinedMenuItem::quit(app, Some(t("quit")))?)
        .build()?;

    let file_menu = SubmenuBuilder::new(app, t("file"))
        .item(&item("new_habit", Some("CmdOrCtrl+N"))?)
        .separator()
        .item(&item("import_backup", Some("CmdOrCtrl+O"))?)
        .item(&item("export_backup", Some("CmdOrCtrl+Shift+E"))?)
        .separator()
        .item(&item("workspace_switch", None)?)
        .item(&MenuItemBuilder::with_id("cloud_sign_out", t("cloud_sign_out")).enabled(app.get_webview_window("cloud").is_some()).build(app)?)
        .separator()
        .item(&PredefinedMenuItem::close_window(app, Some(t("close")))?)
        .build()?;

    let edit_menu = SubmenuBuilder::new(app, t("edit"))
        .item(&PredefinedMenuItem::undo(app, Some(t("undo")))?)
        .item(&PredefinedMenuItem::redo(app, Some(t("redo")))?)
        .separator()
        .item(&PredefinedMenuItem::cut(app, Some(t("cut")))?)
        .item(&PredefinedMenuItem::copy(app, Some(t("copy")))?)
        .item(&PredefinedMenuItem::paste(app, Some(t("paste")))?)
        .item(&PredefinedMenuItem::select_all(app, Some(t("select_all")))?)
        .build()?;

    let view_menu = SubmenuBuilder::new(app, t("view"))
        .item(&item("view_today", Some("CmdOrCtrl+1"))?)
        .item(&item("view_week", Some("CmdOrCtrl+2"))?)
        .item(&item("view_longrange", Some("CmdOrCtrl+3"))?)
        .item(&item("view_timeline", Some("CmdOrCtrl+4"))?)
        .item(&item("view_review", Some("CmdOrCtrl+5"))?)
        .item(&item("view_habits", Some("CmdOrCtrl+6"))?)
        .separator()
        .item(&item("date_today", Some("CmdOrCtrl+T"))?)
        .item(&item("date_prev", Some("CmdOrCtrl+["))?)
        .item(&item("date_next", Some("CmdOrCtrl+]"))?)
        .separator()
        .item(&item("sidebar_toggle", Some("Ctrl+CmdOrCtrl+S"))?)
        .item(&PredefinedMenuItem::fullscreen(app, Some(t("fullscreen")))?)
        .build()?;

    let window_menu = SubmenuBuilder::new(app, t("window"))
        .item(&PredefinedMenuItem::minimize(app, Some(t("minimize")))?)
        .item(&PredefinedMenuItem::maximize(app, Some(t("zoom")))?)
        .build()?;

    MenuBuilder::new(app)
        .items(&[&app_menu, &file_menu, &edit_menu, &view_menu, &window_menu])
        .build()
}

/// The frontend reports its language so the menu bar speaks it too.
#[tauri::command]
fn set_menu_language(app: AppHandle, lang: String) -> Result<(), String> {
    let lang = match lang.as_str() {
        "zh" | "de" => lang,
        _ => "en".to_string(),
    };
    *MENU_LANG.lock().unwrap() = lang;
    refresh_menu(&app);
    Ok(())
}

/// Rebuilds the menu bar in the last reported language (e.g. "Sign Out of Cloud" follows the cloud window).
fn refresh_menu(app: &AppHandle) {
    let lang = MENU_LANG.lock().unwrap().clone();
    if let Ok(menu) = build_app_menu(app, if lang.is_empty() { "en" } else { &lang }) {
        let _ = app.set_menu(menu);
    }
}

/// Ends the Cloudflare Access session; when the logout page has loaded, `mac_window` sends the window back to
/// the deployment, which then shows the email-code login again.
fn sign_out_of_cloud(app: &AppHandle) {
    let Some(window) = app.get_webview_window("cloud") else { return };
    let Some(Workspace::Cloud(raw)) = load_last_workspace(app) else { return };
    let Ok(mut url) = validate_cloud_url(&raw) else { return };
    url.set_path(ACCESS_LOGOUT_PATH);
    url.set_query(None);
    url.set_fragment(None);
    let _ = window.navigate(url);
}

/// Public setup guide (Cloudflare Access with email codes), in the launcher's language.
#[tauri::command]
fn open_setup_guide(lang: String) -> Result<(), String> {
    let file = if lang == "zh" { "macos-cloud.zh-CN.md" } else { "macos-cloud.md" };
    let url = format!("https://github.com/zubin-li/life-ledger-deep-review/blob/main/docs/{file}");
    std::process::Command::new("/usr/bin/open").arg(url).spawn().map(|_| ()).map_err(|e| e.to_string())
}

#[tauri::command]
fn forget_workspace(app: AppHandle) -> Result<(), String> {
    if let Some(path) = last_workspace_path(&app) {
        let _ = fs::remove_file(path);
    }
    Ok(())
}

#[cfg(all(feature = "qa", target_os = "macos"))]
mod qa;

/// Mac glue injected into the app's own windows (local page and the user's cloud deployment).
/// The web page never contains it; it only fits the unchanged web design into a Mac window.
const MAC_SHELL_JS: &str = include_str!("../../desktop/mac/shell.js");
const MAC_SHELL_CSS: &str = include_str!("../../desktop/mac/shell.css");

fn mac_shell_script() -> String {
    #[cfg(all(feature = "qa", target_os = "macos"))]
    let qa = if std::env::var("LL_QA_CLOUD").is_ok() { qa::QA_CLOUD_SCRIPT } else { qa::QA_SCRIPT };
    #[cfg(not(all(feature = "qa", target_os = "macos")))]
    let qa = "";
    // `{:?}` gives a double-quoted, escaped literal; the CSS is plain ASCII/UTF-8 text, so it is valid JavaScript.
    format!(
        "{}\n(()=>{{if(window.top!==window)return;const s=document.createElement('style');s.id='ll-mac-shell';s.textContent={:?};const put=()=>{{const r=document.head||document.documentElement;if(!r)return false;r.appendChild(s);return true}};if(!put())new MutationObserver((_,o)=>{{if(put())o.disconnect()}}).observe(document,{{childList:true,subtree:true}})}})();\n{}",
        qa, MAC_SHELL_CSS, MAC_SHELL_JS
    )
}

/// Traffic lights sit inside the web sidebar card (card at 16,16; buttons 14 pt, centre y = position.y - 2).
const TRAFFIC_LIGHTS: (f64, f64) = (34.0, 44.0);

/// Hidden title bar, lights in the sidebar card, hidden until the page paints (no white flash).
fn mac_window<'a, R: tauri::Runtime, M: tauri::Manager<R>>(
    builder: WebviewWindowBuilder<'a, R, M>,
) -> WebviewWindowBuilder<'a, R, M> {
    let builder = builder
        .visible(false)
        .initialization_script(mac_shell_script())
        // Backups and photo exports are <a download> links; without a handler WebKit drops them silently.
        // wry saves to ~/Downloads under a free name ("name (1).json"), like Safari.
        .on_download(|_, _| true)
        .on_page_load(|window, payload| {
            // QA build only: record every page the window loads (origin + path, no query) to $LL_QA_NAV.
            #[cfg(all(feature = "qa", target_os = "macos"))]
            if let Ok(path) = std::env::var("LL_QA_NAV") {
                let u = payload.url();
                let line = format!("{:?} {}://{}{}\n", payload.event(), u.scheme(), u.host_str().unwrap_or(""), u.path());
                let _ = std::fs::OpenOptions::new().create(true).append(true).open(path).and_then(|mut f| std::io::Write::write_all(&mut f, line.as_bytes()));
            }
            // after "Sign Out of Cloud": back to the deployment, which now asks for the email code
            if window.label() == "cloud"
                && payload.event() == tauri::webview::PageLoadEvent::Finished
                && payload.url().path() == ACCESS_LOGOUT_PATH
            {
                if let Some(Workspace::Cloud(raw)) = cached_last_workspace() {
                    if let Ok(url) = validate_cloud_url(&raw) {
                        let _ = window.navigate(with_desktop_cloud_flag(url));
                    }
                }
            }
        });
    #[cfg(target_os = "macos")]
    let builder = builder
        .title_bar_style(tauri::TitleBarStyle::Overlay)
        .hidden_title(true)
        .traffic_light_position(tauri::LogicalPosition::new(TRAFFIC_LIGHTS.0, TRAFFIC_LIGHTS.1));
    builder
}

/// Fallback: show the window even if the page never reported its first paint (e.g. an unreachable cloud URL).
fn show_soon(window: &WebviewWindow) {
    let window = window.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(1500));
        let _ = window.show();
    });
}

#[tauri::command]
fn open_local_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("local") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        hide_launcher(&app);
        return Ok(());
    }

    let mut builder = mac_window(WebviewWindowBuilder::new(
        &app,
        "local",
        WebviewUrl::App("index.html?mode=local&desktop=tauri-local".into()),
    ))
    .title("Life Ledger")
    .min_inner_size(980.0, 700.0)
    .initialization_script(
        r#"
window.LifeLedgerDesktopBridge = {
  saveBackupJson: (payload) => window.__TAURI__.core.invoke("save_backup_json", payload),
  openBackupJson: () => window.__TAURI__.core.invoke("open_backup_json")
};
"#,
    );

    builder = match load_window_state(&app, "local") {
        Some((x, y, width, height)) => builder.position(x, y).inner_size(width.max(980.0), height.max(700.0)),
        None => builder.inner_size(1280.0, 860.0),
    };

    let window = builder.build().map_err(|e| e.to_string())?;
    show_soon(&window);
    watch_window_lifecycle(&app, &window, false);
    save_last_workspace(&app, &Workspace::Local);
    hide_launcher(&app);
    Ok(())
}

fn validate_cloud_url(raw_url: &str) -> Result<Url, String> {
    let url = Url::parse(raw_url.trim()).map_err(|_| "Malformed URL".to_string())?;
    let scheme = url.scheme();
    if scheme == "javascript" || scheme == "data" || scheme == "file" {
        return Err("Forbidden scheme".to_string());
    }
    if !url.username().is_empty() || url.password().is_some() {
        return Err("Credentials are not allowed".to_string());
    }
    if scheme == "https" {
        return Ok(url);
    }
    if scheme == "http" && (url.host_str() == Some("localhost") || url.host_str() == Some("127.0.0.1")) {
        return Ok(url);
    }
    Err("HTTPS is required".to_string())
}

/// Appends `desktop=tauri-cloud` to the URL's query string while preserving any existing
/// query parameters and the fragment (hash), so the shared frontend can detect desktop mode.
fn with_desktop_cloud_flag(mut url: Url) -> Url {
    url.query_pairs_mut().append_pair("desktop", "tauri-cloud");
    url
}

/// URL pattern for the remote capability: exactly the deployment's origin, every path on it.
fn cloud_capability_pattern(url: &Url) -> Option<String> {
    let host = url.host_str()?;
    let port = url.port().map(|p| format!(":{p}")).unwrap_or_default();
    Some(format!("{}://{}{}/*", url.scheme(), host, port))
}

/// The cloud window shows the user's own deployment; give that origin (only) the shell permissions the local window has.
fn grant_cloud_shell(app: &AppHandle, url: &Url) -> Result<(), String> {
    let pattern = cloud_capability_pattern(url).ok_or("URL has no host")?;
    let capability = tauri::ipc::CapabilityBuilder::new(format!("cloud-shell-{pattern}"))
        .remote(pattern)
        .local(false)
        .window("cloud")
        .permission("core:event:default")
        .permission("core:window:allow-start-dragging")
        .permission("core:window:allow-internal-toggle-maximize")
        .permission("core:window:allow-is-fullscreen")
        .permission("core:window:allow-show")
        // the page's confirm/alert use native sheets, and the menu follows the page language; nothing else of the
        // app (no file access) is reachable from the remote page
        .permission("allow-ask-confirm")
        .permission("allow-show-alert")
        .permission("allow-set-menu-language")
        .permission("allow-switch-workspace")
        .permission("core:app:allow-version");
    #[cfg(all(feature = "qa", target_os = "macos"))]
    let capability = capability.permission("allow-qa-probe").permission("allow-qa-report").permission("allow-qa-sign-out");
    app.add_capability(capability).map_err(|e| e.to_string())
}

#[tauri::command]
fn open_cloud_window(app: AppHandle, raw_url: String) -> Result<(), String> {
    let normalized = with_desktop_cloud_flag(validate_cloud_url(&raw_url)?);
    grant_cloud_shell(&app, &normalized)?;
    if let Some(window) = app.get_webview_window("cloud") {
        window.navigate(normalized).map_err(|e| e.to_string())?;
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        hide_launcher(&app);
        return Ok(());
    }

    let mut builder = mac_window(WebviewWindowBuilder::new(&app, "cloud", WebviewUrl::External(normalized)))
        .title("Life Ledger")
        .user_agent(SAFARI_UA)
        .min_inner_size(980.0, 700.0);

    builder = match load_window_state(&app, "cloud") {
        Some((x, y, width, height)) => builder.position(x, y).inner_size(width.max(980.0), height.max(700.0)),
        None => builder.inner_size(1280.0, 860.0),
    };

    let window = builder.build().map_err(|e| e.to_string())?;
    show_soon(&window);
    watch_window_lifecycle(&app, &window, false);
    save_last_workspace(&app, &Workspace::Cloud(raw_url.trim().to_string()));
    refresh_menu(&app);
    let handle = app.clone();
    window.on_window_event(move |event| {
        if let WindowEvent::Destroyed = event {
            let handle = handle.clone();
            // the window is unregistered after this event; rebuild once it is gone
            std::thread::spawn(move || {
                std::thread::sleep(Duration::from_millis(200));
                let h = handle.clone();
                let _ = handle.run_on_main_thread(move || refresh_menu(&h));
            });
        }
    });
    hide_launcher(&app);
    Ok(())
}

#[derive(serde::Deserialize)]
struct SaveBackupRequest {
    filename: String,
    contents: String,
}

#[derive(serde::Serialize)]
struct SaveBackupResponse {
    cancelled: bool,
    path: Option<String>,
}

#[tauri::command]
fn save_backup_json(payload: SaveBackupRequest) -> Result<SaveBackupResponse, String> {
    let maybe_path = rfd::FileDialog::new()
        .set_file_name(&payload.filename)
        .add_filter("JSON", &["json"])
        .save_file();

    match maybe_path {
        None => Ok(SaveBackupResponse {
            cancelled: true,
            path: None,
        }),
        Some(path) => {
            fs::write(&path, payload.contents).map_err(|e| e.to_string())?;
            Ok(SaveBackupResponse {
                cancelled: false,
                path: Some(path.to_string_lossy().to_string()),
            })
        }
    }
}

#[derive(serde::Serialize)]
struct OpenBackupResponse {
    cancelled: bool,
    name: Option<String>,
    contents: Option<String>,
}

/// Native confirmation sheet on the calling window (WKWebView shows no UI for window.confirm).
#[tauri::command]
fn ask_confirm(window: WebviewWindow, message: String, ok: Option<String>, cancel: Option<String>) -> bool {
    let ok = ok.unwrap_or_else(|| "OK".into());
    let cancel = cancel.unwrap_or_else(|| "Cancel".into());
    let result = rfd::MessageDialog::new()
        .set_parent(&window)
        .set_level(rfd::MessageLevel::Warning)
        .set_title("Life Ledger")
        .set_description(&message)
        .set_buttons(rfd::MessageButtons::OkCancelCustom(ok.clone(), cancel))
        .show();
    confirmed(&result, &ok)
}

fn confirmed(result: &rfd::MessageDialogResult, ok: &str) -> bool {
    match result {
        rfd::MessageDialogResult::Ok | rfd::MessageDialogResult::Yes => true,
        rfd::MessageDialogResult::Custom(label) => label == ok,
        _ => false,
    }
}

/// Native notice sheet (replaces window.alert).
#[tauri::command]
fn show_alert(window: WebviewWindow, message: String) {
    let _ = rfd::MessageDialog::new()
        .set_parent(&window)
        .set_level(rfd::MessageLevel::Info)
        .set_title("Life Ledger")
        .set_description(&message)
        .set_buttons(rfd::MessageButtons::Ok)
        .show();
}

/// Dock click with no visible window: reopen the remembered workspace, else the launcher.
fn reopen_main_window(app: &AppHandle) {
    if let Some(window) = focused_main_window(app) {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
        return;
    }
    match load_last_workspace(app) {
        Some(Workspace::Local) => {
            let _ = open_local_window(app.clone());
        }
        Some(Workspace::Cloud(url)) => {
            let _ = open_cloud_window(app.clone(), url);
        }
        None => {
            if let Some(launcher) = app.get_webview_window("launcher") {
                let _ = launcher.show();
                let _ = launcher.set_focus();
            }
        }
    }
}

#[tauri::command]
fn open_backup_json() -> Result<OpenBackupResponse, String> {
    let maybe_path = rfd::FileDialog::new().add_filter("JSON", &["json"]).pick_file();
    match maybe_path {
        None => Ok(OpenBackupResponse {
            cancelled: true,
            name: None,
            contents: None,
        }),
        Some(path) => {
            let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
            if metadata.len() > MAX_JSON_IMPORT_BYTES {
                return Err("file-too-large".to_string());
            }
            let contents = fs::read_to_string(&path).map_err(|e| e.to_string())?;
            let name = path.file_name().map(|v| v.to_string_lossy().to_string());
            Ok(OpenBackupResponse {
                cancelled: false,
                name,
                contents: Some(contents),
            })
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();
    #[cfg(all(feature = "qa", target_os = "macos"))]
    let builder = builder.invoke_handler(tauri::generate_handler![
        open_local_window,
        open_cloud_window,
        forget_workspace,
            switch_workspace,
        save_backup_json,
        open_backup_json,
        ask_confirm,
        show_alert,
        set_menu_language,
        open_setup_guide,
        qa::qa_probe,
        qa::qa_report,
        qa::qa_sign_out
    ]);
    #[cfg(not(all(feature = "qa", target_os = "macos")))]
    let builder = builder.invoke_handler(tauri::generate_handler![
            open_local_window,
            open_cloud_window,
            forget_workspace,
            switch_workspace,
            save_backup_json,
            open_backup_json,
            ask_confirm,
            show_alert,
            set_menu_language,
            open_setup_guide
        ]);
    builder
        .setup(|app| {
            let menu = build_app_menu(app.handle(), "en")?;
            app.set_menu(menu)?;
            app.on_menu_event(|app, event| {
                if let Some(action) = menu_action_for_id(event.id().as_ref()) {
                    emit_menu_action(app, action);
                }
            });

            if app.get_webview_window("launcher").is_none() {
                let mut builder = WebviewWindowBuilder::new(app, "launcher", WebviewUrl::App("launcher.html".into()))
                    .title("Life Ledger")
                    .min_inner_size(700.0, 620.0);

                #[cfg(target_os = "macos")]
                {
                    builder = builder
                        .title_bar_style(tauri::TitleBarStyle::Overlay)
                        .hidden_title(true)
                        .traffic_light_position(tauri::LogicalPosition::new(20.0, 28.0));
                }

                builder = match load_window_state(app.handle(), "launcher") {
                    Some((x, y, width, height)) => builder.position(x, y).inner_size(width.max(700.0), height.max(620.0)),
                    None => builder.inner_size(900.0, 760.0),
                };

                let window = builder.build()?;
                watch_window_lifecycle(app.handle(), &window, false);
            }

            if let Some(workspace) = load_last_workspace(app.handle()) {
                match workspace {
                    Workspace::Local => {
                        let _ = open_local_window(app.handle().clone());
                    }
                    Workspace::Cloud(url) => {
                        let _ = open_cloud_window(app.handle().clone(), url);
                    }
                }
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen { has_visible_windows: false, .. } = event {
                reopen_main_window(app);
            }
            #[cfg(not(target_os = "macos"))]
            let _ = (app, event);
        });
}

#[cfg(test)]
mod tests {
    use super::{
        classify_workspace, commit_if_current, menu_action_for_id, parse_window_state, physical_to_logical,
        take_pending_geometry, validate_cloud_url, with_desktop_cloud_flag, PendingWindowState, PhysicalPosition,
        PhysicalSize, Workspace,
    };
    use std::sync::Mutex;
    use url::Url;

    #[test]
    fn every_menu_accelerator_maps_to_command_on_macos() {
        // muda: "Cmd" is META (not ⌘ on macOS); only "CmdOrCtrl" becomes ⌘. Guard every accelerator.
        let src = include_str!("lib.rs");
        let accels: Vec<&str> = src.match_indices("accelerator(a)").map(|_| "").collect();
        assert!(!accels.is_empty());
        for line in src.lines().filter(|l| l.contains("Some(\"") && l.contains("+") && l.contains(".item(&item(")) {
            assert!(line.contains("CmdOrCtrl+"), "accelerator without CmdOrCtrl: {line}");
            assert!(!line.contains("\"Cmd+") && !line.contains("+Cmd+"), "bare Cmd is not ⌘ on macOS: {line}");
        }
    }

    #[test]
    fn mac_shell_script_embeds_css_and_js() {
        let script = super::mac_shell_script();
        assert!(script.contains("ll-mac-shell") && script.contains("__llMac") && script.contains(".sidebar"));
        assert!(!script.contains("\\u{"), "Rust-only escape in injected JS");
        assert!(super::TRAFFIC_LIGHTS.0 >= 30.0, "lights must sit inside the sidebar card");
    }

    #[test]
    fn cloud_capability_covers_only_the_deployment_origin() {
        use super::cloud_capability_pattern;
        let u = url::Url::parse("https://life.example.com/app?desktop=tauri-cloud").unwrap();
        assert_eq!(cloud_capability_pattern(&u).as_deref(), Some("https://life.example.com/*"));
        let p = url::Url::parse("http://127.0.0.1:8787/").unwrap();
        assert_eq!(cloud_capability_pattern(&p).as_deref(), Some("http://127.0.0.1:8787/*"));
    }

    #[test]
    fn menu_labels_cover_every_language() {
        use super::menu_label;
        for key in ["settings", "file", "new_habit", "view_longrange", "sidebar_toggle", "window", "zoom"] {
            for lang in ["zh", "en", "de"] {
                assert!(!menu_label(lang, key).is_empty(), "{key} {lang}");
            }
        }
        assert_eq!(menu_label("fr", "file"), "File");
        assert_eq!(menu_label("zh", "view_habits"), "习惯设置");
    }

    #[test]
    fn confirm_maps_only_the_ok_button_to_true() {
        use super::confirmed;
        assert!(confirmed(&rfd::MessageDialogResult::Custom("删除".into()), "删除"));
        assert!(!confirmed(&rfd::MessageDialogResult::Custom("取消".into()), "删除"));
        assert!(!confirmed(&rfd::MessageDialogResult::Cancel, "删除"));
        assert!(confirmed(&rfd::MessageDialogResult::Ok, "OK"));
    }

    #[test]
    fn allows_https() {
        assert!(validate_cloud_url("https://example.com/app").is_ok());
    }

    #[test]
    fn allows_local_http() {
        assert!(validate_cloud_url("http://localhost:8787").is_ok());
        assert!(validate_cloud_url("http://127.0.0.1:3000").is_ok());
    }

    #[test]
    fn rejects_non_https() {
        assert!(validate_cloud_url("http://example.com").is_err());
        assert!(validate_cloud_url("file:///tmp/a").is_err());
        assert!(validate_cloud_url("javascript:alert(1)").is_err());
    }

    #[test]
    fn rejects_credentials() {
        assert!(validate_cloud_url("https://user:pass@example.com").is_err());
    }

    #[test]
    fn desktop_cloud_flag_preserves_existing_query_and_hash() {
        let url = Url::parse("https://example.com/app?tenant=acme#section-2").unwrap();
        let flagged = with_desktop_cloud_flag(url);
        assert_eq!(
            flagged.as_str(),
            "https://example.com/app?tenant=acme&desktop=tauri-cloud#section-2"
        );
    }

    #[test]
    fn desktop_cloud_flag_handles_url_without_query_or_hash() {
        let url = Url::parse("https://example.com/app").unwrap();
        let flagged = with_desktop_cloud_flag(url);
        assert_eq!(flagged.as_str(), "https://example.com/app?desktop=tauri-cloud");
    }

    #[test]
    fn window_state_round_trips_valid_values() {
        assert_eq!(parse_window_state("10:20:1280:860"), Some((10.0, 20.0, 1280.0, 860.0)));
        assert_eq!(parse_window_state("-40:-5:900.5:760"), Some((-40.0, -5.0, 900.5, 760.0)));
    }

    #[test]
    fn window_state_rejects_malformed_or_nonsensical_values() {
        assert_eq!(parse_window_state(""), None);
        assert_eq!(parse_window_state("10:20:1280"), None);
        assert_eq!(parse_window_state("10:20:1280:860:extra"), None);
        assert_eq!(parse_window_state("nope:20:1280:860"), None);
        assert_eq!(parse_window_state("10:20:0:860"), None);
        assert_eq!(parse_window_state("10:20:1280:-1"), None);
    }

    #[test]
    fn physical_to_logical_divides_by_the_scale_factor() {
        let position = PhysicalPosition::new(150, 300);
        let size = PhysicalSize::new(1920u32, 1080u32);
        assert_eq!(physical_to_logical(position, size, 1.0), (150.0, 300.0, 1920.0, 1080.0));
        assert_eq!(physical_to_logical(position, size, 1.5), (100.0, 200.0, 1280.0, 720.0));
        assert_eq!(physical_to_logical(position, size, 2.0), (75.0, 150.0, 960.0, 540.0));
    }

    #[test]
    fn window_state_round_trip_survives_a_physical_to_logical_conversion() {
        let position = PhysicalPosition::new(240, 90);
        let size = PhysicalSize::new(2560u32, 1720u32);
        let logical = physical_to_logical(position, size, 2.0);
        let contents = format!("{}:{}:{}:{}", logical.0, logical.1, logical.2, logical.3);
        assert_eq!(parse_window_state(&contents), Some(logical));
    }

    #[test]
    fn commit_if_current_returns_geometry_only_for_the_latest_generation() {
        let pending = Mutex::new(PendingWindowState {
            generation: 3,
            geometry: Some((1.0, 2.0, 3.0, 4.0)),
        });
        // A stale (superseded) debounced writer must not write, and must not consume the geometry.
        assert_eq!(commit_if_current(&pending, 2), None);
        assert_eq!(pending.lock().unwrap().geometry, Some((1.0, 2.0, 3.0, 4.0)));
        // The current generation's writer takes it exactly once.
        assert_eq!(commit_if_current(&pending, 3), Some((1.0, 2.0, 3.0, 4.0)));
        assert_eq!(pending.lock().unwrap().geometry, None);
        assert_eq!(commit_if_current(&pending, 3), None);
    }

    #[test]
    fn menu_action_for_id_maps_known_menu_items() {
        assert_eq!(menu_action_for_id("view_today"), Some("view:today"));
        assert_eq!(menu_action_for_id("sidebar_toggle"), Some("sidebar:toggle"));
        assert_eq!(menu_action_for_id("view_longrange"), Some("view:longrange"));
        assert_eq!(menu_action_for_id("export_backup"), Some("export"));
        assert_eq!(menu_action_for_id("unknown_item"), None);
    }

    #[test]
    fn menu_action_for_id_maps_date_navigation() {
        assert_eq!(menu_action_for_id("date_today"), Some("date:today"));
        assert_eq!(menu_action_for_id("date_prev"), Some("date:prev"));
        assert_eq!(menu_action_for_id("date_next"), Some("date:next"));
    }

    #[test]
    fn classify_workspace_validates_local_and_cloud_urls() {
        assert_eq!(classify_workspace("local"), Some(Workspace::Local));
        assert_eq!(
            classify_workspace("https://example.com/app"),
            Some(Workspace::Cloud("https://example.com/app".into()))
        );
        assert_eq!(classify_workspace("http://example.com"), None);
        assert_eq!(classify_workspace(""), None);
        assert_eq!(classify_workspace("   "), None);
    }

    #[test]
    fn take_pending_geometry_flushes_and_invalidates_any_in_flight_debounced_write() {
        let pending = Mutex::new(PendingWindowState {
            generation: 5,
            geometry: Some((10.0, 20.0, 980.0, 700.0)),
        });
        let queued_generation = pending.lock().unwrap().generation;
        // A window-close flush takes whatever is pending immediately.
        assert_eq!(take_pending_geometry(&pending), Some((10.0, 20.0, 980.0, 700.0)));
        // The debounced writer that was already in flight for `queued_generation` is superseded
        // and must write nothing when it eventually wakes up.
        assert_eq!(commit_if_current(&pending, queued_generation), None);
        // A duplicate close flush finds nothing left to write.
        assert_eq!(take_pending_geometry(&pending), None);
    }
}
