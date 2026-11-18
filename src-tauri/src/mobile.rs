/// Android (and any other mobile target) starts here.
/// The window, test id, and offline assets come from `tauri.android.conf.json`.
/// No menus, file dialogs, or updater: those stay in the desktop module.
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
