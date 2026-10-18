use std::fs;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use url::Url;

const MAX_JSON_IMPORT_BYTES: u64 = 10 * 1024 * 1024;

#[tauri::command]
fn open_local_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("local") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    WebviewWindowBuilder::new(
        &app,
        "local",
        WebviewUrl::App("index.html?mode=local&desktop=tauri-local".into()),
    )
    .title("Life Ledger · Local")
    .inner_size(1280.0, 860.0)
    .min_inner_size(980.0, 700.0)
    .initialization_script(
        r#"
window.LifeLedgerDesktopBridge = {
  saveBackupJson: (payload) => window.__TAURI__.core.invoke("save_backup_json", payload),
  openBackupJson: () => window.__TAURI__.core.invoke("open_backup_json")
};
"#,
    )
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

fn validate_cloud_url(raw_url: &str) -> Result<String, String> {
    let url = Url::parse(raw_url.trim()).map_err(|_| "Malformed URL".to_string())?;
    let scheme = url.scheme();
    if scheme == "javascript" || scheme == "data" || scheme == "file" {
        return Err("Forbidden scheme".to_string());
    }
    if !url.username().is_empty() || url.password().is_some() {
        return Err("Credentials are not allowed".to_string());
    }
    if scheme == "https" {
        return Ok(url.to_string());
    }
    if scheme == "http" && (url.host_str() == Some("localhost") || url.host_str() == Some("127.0.0.1")) {
        return Ok(url.to_string());
    }
    Err("HTTPS is required".to_string())
}

#[tauri::command]
fn open_cloud_window(app: AppHandle, raw_url: String) -> Result<(), String> {
    let normalized = validate_cloud_url(&raw_url)?;
    if let Some(window) = app.get_webview_window("cloud") {
        window
            .navigate(Url::parse(&normalized).map_err(|e| e.to_string())?)
            .map_err(|e| e.to_string())?;
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    WebviewWindowBuilder::new(
        &app,
        "cloud",
        WebviewUrl::External(Url::parse(&normalized).map_err(|e| e.to_string())?),
    )
    .title("Life Ledger · Connected")
    .inner_size(1280.0, 860.0)
    .min_inner_size(980.0, 700.0)
    .build()
    .map_err(|e| e.to_string())?;
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
            save_backup_json,
            open_backup_json
        ])
        .setup(|app| {
            if app.get_webview_window("launcher").is_none() {
                WebviewWindowBuilder::new(app, "launcher", WebviewUrl::App("launcher.html".into()))
                    .title("Life Ledger · Deep Review")
                    .inner_size(900.0, 760.0)
                    .min_inner_size(700.0, 620.0)
                    .build()?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::validate_cloud_url;

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
}
