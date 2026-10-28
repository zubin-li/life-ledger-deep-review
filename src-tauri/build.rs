// Every app command gets an ACL permission (allow-<command>) so a capability can grant it per window.
// This matters for the cloud window: Tauri refuses all app commands to a remote page unless a capability names them.
const COMMANDS: &[&str] = &[
    "open_local_window", "open_cloud_window", "forget_workspace", "open_setup_guide", "switch_workspace",
    "save_backup_json", "open_backup_json", "ask_confirm", "show_alert", "set_menu_language",
    "qa_probe", "qa_report", "qa_sign_out",
];

fn main() {
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(tauri_build::AppManifest::new().commands(COMMANDS)))
        .expect("tauri build");
}
