use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{plugin::PluginHandle, Manager, Runtime, State};

pub const PLUGIN_NAME: &str = "life-ledger-backup";
const PLUGIN_CLASS: &str = "app.zubinli.lifeledger.androidtest.backup";
pub const BACKUP_CANCELLED_ERROR: &str = "backup-cancelled";

pub struct BackupHandle<R: Runtime>(pub(crate) Mutex<Option<PluginHandle<R>>>);

fn plugin_handle<R: Runtime>(state: &State<'_, BackupHandle<R>>) -> Result<PluginHandle<R>, String> {
    state
        .0
        .lock()
        .map_err(|_| "backup plugin unavailable".to_string())?
        .clone()
        .ok_or_else(|| "backup plugin unavailable".to_string())
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PickResponse {
    cancelled: bool,
    uri: Option<String>,
    display_name: Option<String>,
}

#[derive(Debug, Deserialize)]
struct OpenHandleResponse {
    handle: i32,
}

#[derive(Debug, Deserialize)]
struct DocumentLengthResponse {
    length: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct PickExportPayload<'a> {
    file_name: &'a str,
    mime_type: &'a str,
}

#[derive(Debug, Serialize)]
struct UriPayload<'a> {
    uri: &'a str,
}

#[derive(Debug, Serialize)]
struct WriteChunkPayload<'a> {
    handle: i32,
    data: &'a str,
}

#[derive(Debug, Serialize)]
struct HandlePayload {
    handle: i32,
}

#[derive(Debug, Serialize)]
struct ReadChunkPayload {
    handle: i32,
    max_bytes: i32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PickImportResponse {
    pub cancelled: bool,
    pub uri: Option<String>,
    pub display_name: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PickExportResponse {
    pub cancelled: bool,
    pub uri: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct IoHandleResponse {
    pub handle: i32,
}

#[derive(Debug, Serialize)]
pub struct DocumentLength {
    pub length: u64,
}

#[derive(Debug, Serialize)]
pub struct WriteChunkResponse {
    pub written: usize,
}

#[derive(Debug, Deserialize)]
pub struct ReadChunkResponse {
    pub done: bool,
    pub data: String,
}

#[derive(Debug, Deserialize)]
pub struct CloseIoResponse {
    pub checksum: String,
}

#[derive(Debug, Deserialize)]
struct WriteChunkRaw {
    written: Option<u64>,
}

#[tauri::command]
pub async fn android_pick_import<R: Runtime>(backup: State<'_, BackupHandle<R>>) -> Result<PickImportResponse, String> {
    let handle = plugin_handle(&backup)?;
    let response = handle
        .run_mobile_plugin_async::<PickResponse>("pickImport", ())
        .await
        .map_err(|e| e.to_string())?;
    Ok(PickImportResponse {
        cancelled: response.cancelled,
        uri: response.uri,
        display_name: response.display_name,
    })
}

#[tauri::command]
pub async fn android_pick_export<R: Runtime>(
    backup: State<'_, BackupHandle<R>>,
    file_name: String,
    mime_type: String,
) -> Result<PickExportResponse, String> {
    let handle = plugin_handle(&backup)?;
    let payload = PickExportPayload {
        file_name: &file_name,
        mime_type: &mime_type,
    };
    let response = handle
        .run_mobile_plugin_async::<PickResponse>("pickExport", payload)
        .await
        .map_err(|e| e.to_string())?;
    Ok(PickExportResponse {
        cancelled: response.cancelled,
        uri: response.uri,
    })
}

#[tauri::command]
pub async fn android_document_length<R: Runtime>(backup: State<'_, BackupHandle<R>>, uri: String) -> Result<DocumentLength, String> {
    let handle = plugin_handle(&backup)?;
    let response = handle
        .run_mobile_plugin_async::<DocumentLengthResponse>("documentLength", UriPayload { uri: &uri })
        .await
        .map_err(|e| e.to_string())?;
    Ok(DocumentLength {
        length: response.length,
    })
}

#[tauri::command]
pub async fn android_backup_open_write<R: Runtime>(backup: State<'_, BackupHandle<R>>, uri: String) -> Result<IoHandleResponse, String> {
    let handle = plugin_handle(&backup)?;
    let response = handle
        .run_mobile_plugin_async::<OpenHandleResponse>("openWrite", UriPayload { uri: &uri })
        .await
        .map_err(|e| e.to_string())?;
    Ok(IoHandleResponse {
        handle: response.handle,
    })
}

#[tauri::command]
pub async fn android_backup_write_chunk<R: Runtime>(
    backup: State<'_, BackupHandle<R>>,
    handle: i32,
    data: String,
) -> Result<WriteChunkResponse, String> {
    let plugin = plugin_handle(&backup)?;
    let response = plugin
        .run_mobile_plugin_async::<WriteChunkRaw>("writeChunk", WriteChunkPayload { handle, data: &data })
        .await
        .map_err(|e| e.to_string())?;
    Ok(WriteChunkResponse {
        written: response.written.unwrap_or(0) as usize,
    })
}

#[tauri::command]
pub async fn android_backup_close_write<R: Runtime>(backup: State<'_, BackupHandle<R>>, handle: i32) -> Result<CloseIoResponse, String> {
    let plugin = plugin_handle(&backup)?;
    plugin
        .run_mobile_plugin_async::<CloseIoResponse>("closeWrite", HandlePayload { handle })
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn android_backup_open_read<R: Runtime>(backup: State<'_, BackupHandle<R>>, uri: String) -> Result<IoHandleResponse, String> {
    let handle = plugin_handle(&backup)?;
    let response = handle
        .run_mobile_plugin_async::<OpenHandleResponse>("openRead", UriPayload { uri: &uri })
        .await
        .map_err(|e| e.to_string())?;
    Ok(IoHandleResponse {
        handle: response.handle,
    })
}

#[tauri::command]
pub async fn android_backup_read_chunk<R: Runtime>(
    backup: State<'_, BackupHandle<R>>,
    handle: i32,
    max_bytes: Option<i32>,
) -> Result<ReadChunkResponse, String> {
    let plugin = plugin_handle(&backup)?;
    plugin
        .run_mobile_plugin_async::<ReadChunkResponse>(
            "readChunk",
            ReadChunkPayload {
                handle,
                max_bytes: max_bytes.unwrap_or(65536),
            },
        )
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn android_backup_close_read<R: Runtime>(backup: State<'_, BackupHandle<R>>, handle: i32) -> Result<CloseIoResponse, String> {
    let plugin = plugin_handle(&backup)?;
    plugin
        .run_mobile_plugin_async::<CloseIoResponse>("closeRead", HandlePayload { handle })
        .await
        .map_err(|e| e.to_string())
}

pub fn plugin<R: Runtime>() -> tauri::plugin::TauriPlugin<R> {
    tauri::plugin::Builder::new(PLUGIN_NAME)
        .setup(|app, api| {
            #[cfg(target_os = "android")]
            {
                let handle = api
                    .register_android_plugin(PLUGIN_CLASS, "BackupPlugin")
                    .map_err(|e| e.to_string())?;
                app.manage(BackupHandle(Mutex::new(Some(handle))));
            }
            #[cfg(not(target_os = "android"))]
            {
                let _ = (app, api);
            }
            Ok(())
        })
        .build()
}

pub const ANDROID_INIT_SCRIPT: &str = r#"
window.LifeLedgerAndroidBackup = {
  pickImport: () => window.__TAURI__.core.invoke("android_pick_import"),
  pickExport: (fileName, mimeType) => window.__TAURI__.core.invoke("android_pick_export", { fileName, mimeType }),
  documentLength: uri => window.__TAURI__.core.invoke("android_document_length", { uri }),
  openWrite: uri => window.__TAURI__.core.invoke("android_backup_open_write", { uri }),
  writeChunk: (handle, data) => window.__TAURI__.core.invoke("android_backup_write_chunk", { handle, data }),
  closeWrite: handle => window.__TAURI__.core.invoke("android_backup_close_write", { handle }),
  openRead: uri => window.__TAURI__.core.invoke("android_backup_open_read", { uri }),
  readChunk: (handle, maxBytes) => window.__TAURI__.core.invoke("android_backup_read_chunk", { handle, maxBytes }),
  closeRead: handle => window.__TAURI__.core.invoke("android_backup_close_read", { handle }),
};
"#;