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

mod widget_bridge;
use widget_bridge::{ack_widget_mutations, publish_widget_snapshot, read_pending_widget_mutations};

const MAX_JSON_IMPORT_BYTES: u64 = 10 * 1024 * 1024;
const LAST_WORKSPACE_FILE: &str = "last-workspace.txt";
const MENU_EVENT: &str = "menu://action";
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

fn load_last_workspace(app: &AppHandle) -> Option<Workspace> {
    let path = last_workspace_path(app)?;
    let contents = fs::read_to_string(path).ok()?;
    classify_workspace(&contents)
}

fn focused_main_window(app: &AppHandle) -> Option<WebviewWindow> {
    app.get_webview_window("local")
        .or_else(|| app.get_webview_window("cloud"))
}

fn emit_menu_action(app: &AppHandle, action: &str) {
    if action == "settings" {
        if app.get_webview_window("local").is_some() {
            let _ = open_settings_window(app.clone());
            return;
        }
        if let Some(window) = app.get_webview_window("cloud") {
            let _ = window.emit(MENU_EVENT, action);
            return;
        }
    }
    if action == "workspace:switch" {
        if let Some(launcher) = app.get_webview_window("launcher") {
            let _ = launcher.show();
            let _ = launcher.set_focus();
        }
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
        "find" => Some("find"),
        "view_today" => Some("view:today"),
        "view_week" => Some("view:week"),
        "view_timeline" => Some("view:timeline"),
        "view_review" => Some("view:review"),
        "view_habits" => Some("view:habits"),
        "sidebar_toggle" => Some("sidebar:toggle"),
        "inspector_toggle" => Some("inspector:toggle"),
        "date_today" => Some("date:today"),
        "date_prev" => Some("date:prev"),
        "date_next" => Some("date:next"),
        "help" => Some("help"),
        _ => None,
    }
}

fn build_app_menu(app: &AppHandle) -> Result<tauri::menu::Menu<tauri::Wry>, tauri::Error> {
    let about = PredefinedMenuItem::about(
        app,
        Some("About Life Ledger"),
        Some(AboutMetadata {
            name: Some("Life Ledger".into()),
            ..Default::default()
        }),
    )?;
    let settings = MenuItemBuilder::with_id("settings", "Settings…")
        .accelerator("CmdOrCtrl+,")
        .build(app)?;
    let app_menu = SubmenuBuilder::new(app, "Life Ledger")
        .item(&about)
        .item(&settings)
        .separator()
        .services()
        .separator()
        .hide()
        .hide_others()
        .show_all()
        .quit()
        .build()?;

    let new_habit = MenuItemBuilder::with_id("new_habit", "New Habit")
        .accelerator("CmdOrCtrl+N")
        .build(app)?;
    let export_backup = MenuItemBuilder::with_id("export_backup", "Export Backup…")
        .accelerator("CmdOrCtrl+Shift+E")
        .build(app)?;
    let import_backup = MenuItemBuilder::with_id("import_backup", "Import Backup…")
        .build(app)?;
    let workspace_switch = MenuItemBuilder::with_id("workspace_switch", "Switch Workspace…")
        .build(app)?;
    let close_window = PredefinedMenuItem::close_window(app, None)?;
    let file_menu = SubmenuBuilder::new(app, "File")
        .item(&new_habit)
        .item(&export_backup)
        .item(&import_backup)
        .separator()
        .item(&workspace_switch)
        .separator()
        .item(&close_window)
        .build()?;

    let undo = PredefinedMenuItem::undo(app, None)?;
    let redo = PredefinedMenuItem::redo(app, None)?;
    let cut = PredefinedMenuItem::cut(app, None)?;
    let copy = PredefinedMenuItem::copy(app, None)?;
    let paste = PredefinedMenuItem::paste(app, None)?;
    let select_all = PredefinedMenuItem::select_all(app, None)?;
    let find = MenuItemBuilder::with_id("find", "Find…")
        .accelerator("CmdOrCtrl+F")
        .build(app)?;
    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .item(&undo)
        .item(&redo)
        .separator()
        .item(&cut)
        .item(&copy)
        .item(&paste)
        .item(&select_all)
        .separator()
        .item(&find)
        .build()?;

    let view_today = MenuItemBuilder::with_id("view_today", "Today")
        .accelerator("CmdOrCtrl+1")
        .build(app)?;
    let view_week = MenuItemBuilder::with_id("view_week", "Week")
        .accelerator("CmdOrCtrl+2")
        .build(app)?;
    let view_timeline = MenuItemBuilder::with_id("view_timeline", "Timeline")
        .accelerator("CmdOrCtrl+3")
        .build(app)?;
    let view_review = MenuItemBuilder::with_id("view_review", "Review")
        .accelerator("CmdOrCtrl+4")
        .build(app)?;
    let view_habits = MenuItemBuilder::with_id("view_habits", "Habits")
        .accelerator("CmdOrCtrl+5")
        .build(app)?;
    let sidebar_toggle = MenuItemBuilder::with_id("sidebar_toggle", "Toggle Sidebar")
        .accelerator("CmdOrCtrl+B")
        .build(app)?;
    let inspector_toggle = MenuItemBuilder::with_id("inspector_toggle", "Toggle Inspector")
        .accelerator("CmdOrCtrl+Alt+0")
        .build(app)?;
    let date_today = MenuItemBuilder::with_id("date_today", "Go to Today")
        .accelerator("CmdOrCtrl+T")
        .build(app)?;
    let date_prev = MenuItemBuilder::with_id("date_prev", "Previous Day")
        .accelerator("CmdOrCtrl+[")
        .build(app)?;
    let date_next = MenuItemBuilder::with_id("date_next", "Next Day")
        .accelerator("CmdOrCtrl+]")
        .build(app)?;
    let fullscreen = PredefinedMenuItem::fullscreen(app, None)?;
    let view_menu = SubmenuBuilder::new(app, "View")
        .item(&view_today)
        .item(&view_week)
        .item(&view_timeline)
        .item(&view_review)
        .item(&view_habits)
        .separator()
        .item(&sidebar_toggle)
        .item(&inspector_toggle)
        .separator()
        .item(&date_today)
        .item(&date_prev)
        .item(&date_next)
        .separator()
        .item(&fullscreen)
        .build()?;

    let minimize = PredefinedMenuItem::minimize(app, None)?;
    let maximize = PredefinedMenuItem::maximize(app, None)?;
    let window_menu = SubmenuBuilder::new(app, "Window")
        .item(&minimize)
        .item(&maximize)
        .separator()
        .build()?;

    let help_item = MenuItemBuilder::with_id("help", "Life Ledger Help")
        .build(app)?;
    let help_menu = SubmenuBuilder::new(app, "Help")
        .item(&help_item)
        .build()?;

    MenuBuilder::new(app)
        .items(&[
            &app_menu,
            &file_menu,
            &edit_menu,
            &view_menu,
            &window_menu,
            &help_menu,
        ])
        .build()
}

#[tauri::command]
fn open_settings_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("settings") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    let mut builder = WebviewWindowBuilder::new(
        &app,
        "settings",
        WebviewUrl::App("index.html?settings=1&mode=local&desktop=tauri-local".into()),
    )
    .title("Life Ledger 4 · Settings")
    .inner_size(680.0, 560.0)
    .min_inner_size(560.0, 480.0)
    .resizable(true);

    #[cfg(target_os = "macos")]
    {
        builder = builder.title_bar_style(tauri::TitleBarStyle::Overlay).hidden_title(true);
    }
    #[cfg(target_os = "macos")]
    {
        builder = builder.traffic_light_position(tauri::LogicalPosition::new(16.0, 16.0));
    }

    builder = match load_window_state(&app, "settings") {
        Some((x, y, width, height)) => builder
            .position(x, y)
            .inner_size(width.max(560.0), height.max(480.0)),
        None => builder,
    };

    let window = builder.build().map_err(|e| e.to_string())?;
    watch_window_lifecycle(&app, &window, false);
    Ok(())
}

#[tauri::command]
fn forget_workspace(app: AppHandle) -> Result<(), String> {
    if let Some(path) = last_workspace_path(&app) {
        let _ = fs::remove_file(path);
    }
    Ok(())
}

#[tauri::command]
fn open_local_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("local") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        hide_launcher(&app);
        return Ok(());
    }

    let mut builder = WebviewWindowBuilder::new(
        &app,
        "local",
        WebviewUrl::App("index.html?mode=local&desktop=tauri-local".into()),
    )
    .title("Life Ledger 4 · Local")
    .min_inner_size(980.0, 700.0)
    .initialization_script(
        r#"
window.LifeLedgerDesktopBridge = {
  saveBackupJson: (payload) => window.__TAURI__.core.invoke("save_backup_json", payload),
  openBackupJson: () => window.__TAURI__.core.invoke("open_backup_json"),
  publishWidgetSnapshot: (snapshot) => window.__TAURI__.core.invoke("publish_widget_snapshot", { snapshot }),
  readPendingWidgetMutations: () => window.__TAURI__.core.invoke("read_pending_widget_mutations"),
  ackWidgetMutations: (mutationIds) => window.__TAURI__.core.invoke("ack_widget_mutations", { mutationIds })
};
"#,
    );

    #[cfg(target_os = "macos")]
    {
        builder = builder.title_bar_style(tauri::TitleBarStyle::Overlay).hidden_title(true);
    }
    #[cfg(target_os = "macos")]
    {
        builder = builder.traffic_light_position(tauri::LogicalPosition::new(16.0, 16.0));
    }

    builder = match load_window_state(&app, "local") {
        Some((x, y, width, height)) => builder.position(x, y).inner_size(width.max(980.0), height.max(700.0)),
        None => builder.inner_size(1280.0, 860.0),
    };

    let window = builder.build().map_err(|e| e.to_string())?;
    watch_window_lifecycle(&app, &window, true);
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

#[tauri::command]
fn open_cloud_window(app: AppHandle, raw_url: String) -> Result<(), String> {
    let normalized = with_desktop_cloud_flag(validate_cloud_url(&raw_url)?);
    if let Some(window) = app.get_webview_window("cloud") {
        window.navigate(normalized).map_err(|e| e.to_string())?;
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        hide_launcher(&app);
        return Ok(());
    }

    let mut builder = WebviewWindowBuilder::new(&app, "cloud", WebviewUrl::External(normalized))
        .title("Life Ledger 4 · Connected")
        .min_inner_size(980.0, 700.0);

    #[cfg(target_os = "macos")]
    {
        builder = builder.title_bar_style(tauri::TitleBarStyle::Overlay).hidden_title(true);
    }
    #[cfg(target_os = "macos")]
    {
        builder = builder.traffic_light_position(tauri::LogicalPosition::new(16.0, 16.0));
    }

    builder = match load_window_state(&app, "cloud") {
        Some((x, y, width, height)) => builder.position(x, y).inner_size(width.max(980.0), height.max(700.0)),
        None => builder.inner_size(1280.0, 860.0),
    };

    let window = builder.build().map_err(|e| e.to_string())?;
    watch_window_lifecycle(&app, &window, true);
    save_last_workspace(&app, &Workspace::Cloud(raw_url.trim().to_string()));
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
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_local_window,
            open_cloud_window,
            open_settings_window,
            forget_workspace,
            save_backup_json,
            open_backup_json,
            publish_widget_snapshot,
            read_pending_widget_mutations,
            ack_widget_mutations
        ])
        .setup(|app| {
            let menu = build_app_menu(app.handle())?;
            app.set_menu(menu)?;
            app.on_menu_event(|app, event| {
                if let Some(action) = menu_action_for_id(event.id().as_ref()) {
                    emit_menu_action(app, action);
                }
            });

            if app.get_webview_window("launcher").is_none() {
                let mut builder = WebviewWindowBuilder::new(app, "launcher", WebviewUrl::App("launcher.html".into()))
                    .title("Life Ledger 4 · Deep Review")
                    .min_inner_size(700.0, 620.0);

                #[cfg(target_os = "macos")]
                {
                    builder = builder.title_bar_style(tauri::TitleBarStyle::Overlay).hidden_title(true);
                }
                #[cfg(target_os = "macos")]
                {
                    builder = builder.traffic_light_position(tauri::LogicalPosition::new(16.0, 16.0));
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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
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
        assert_eq!(menu_action_for_id("inspector_toggle"), Some("inspector:toggle"));
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
