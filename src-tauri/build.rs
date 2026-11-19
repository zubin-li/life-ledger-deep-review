// Every app command gets an ACL permission (allow-<command>) so a capability can grant it per window.
// This matters for the cloud window: Tauri refuses all app commands to a remote page unless a capability names them.
const COMMANDS: &[&str] = &[
    "open_local_window",
    "open_cloud_window",
    "forget_workspace",
    "open_setup_guide",
    "switch_workspace",
    "save_backup_json",
    "open_backup_json",
    "save_backup_binary",
    "open_backup_file",
    "ask_confirm",
    "show_alert",
    "set_menu_language",
    "check_for_updates",
    "qa_probe",
    "qa_report",
    "qa_sign_out",
    "android_pick_import",
    "android_pick_export",
    "android_document_length",
    "android_backup_open_write",
    "android_backup_write_chunk",
    "android_backup_close_write",
    "android_backup_open_read",
    "android_backup_read_chunk",
    "android_backup_close_read",
];

fn main() {
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(tauri_build::AppManifest::new().commands(COMMANDS)))
        .expect("tauri build");
}