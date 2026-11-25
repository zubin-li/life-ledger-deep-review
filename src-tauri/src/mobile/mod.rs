mod backup;

use backup::ANDROID_INIT_SCRIPT;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(backup::plugin())
        .invoke_handler(tauri::generate_handler![
            backup::android_pick_import,
            backup::android_pick_export,
            backup::android_document_length,
            backup::android_backup_open_write,
            backup::android_backup_write_chunk,
            backup::android_backup_close_write,
            backup::android_backup_open_read,
            backup::android_backup_read_chunk,
            backup::android_backup_close_read,
            backup::android_get_ringer_mode,
            backup::android_set_back_enabled,
        ])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                window.eval(ANDROID_INIT_SCRIPT)?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}