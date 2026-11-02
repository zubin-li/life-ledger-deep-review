//! In-app updates (user 11/02: "发布一个更新，然后我这边收到提醒了，然后可以自动更新").
//! Checks the signed update feed at launch and once a day while the app runs, and from the menu / Settings.
//! Never installs silently: a native sheet asks first. Updates are verified against the public key in
//! tauri.conf.json (Tauri updater signature, independent of Apple signing); the bundle id stays the same,
//! so local records (WebKit storage) are untouched.
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::time::Duration;

use tauri::AppHandle;
use tauri_plugin_updater::UpdaterExt;

static CHECKING: AtomicBool = AtomicBool::new(false);
/// Version the user answered "Later" for in this run: automatic checks do not ask again for it.
static POSTPONED: Mutex<String> = Mutex::new(String::new());
const DAY: Duration = Duration::from_secs(24 * 60 * 60);
const MAX_NOTES: usize = 700;

fn lang() -> String {
    crate::current_menu_language()
}

fn text(key: &str) -> &'static str {
    let row: [&'static str; 3] = match key {
        "title" => ["有新版本", "Update available", "Update verfügbar"],
        "body" => [
            "Life Ledger {new} 已发布（当前 {cur}）。",
            "Life Ledger {new} is available (you have {cur}).",
            "Life Ledger {new} ist verfügbar (installiert: {cur}).",
        ],
        "data" => [
            "更新只替换应用本身，你的记录不受影响。",
            "Updating replaces only the app; your records stay as they are.",
            "Das Update ersetzt nur die App; deine Einträge bleiben erhalten.",
        ],
        "install" => ["更新并重启", "Update and Restart", "Aktualisieren und neu starten"],
        "later" => ["稍后", "Later", "Später"],
        "latest" => ["已是最新版本", "You're up to date", "Du bist auf dem neuesten Stand"],
        "latest_body" => ["当前版本 {cur} 是最新的。", "Version {cur} is the latest.", "Version {cur} ist aktuell."],
        "failed" => ["无法更新", "Update failed", "Update fehlgeschlagen"],
        "failed_body" => [
            "这次没能检查或安装更新，请稍后再试，或到 GitHub 发布页下载。\n\n{err}",
            "The update could not be checked or installed. Try again later, or download it from the GitHub release page.\n\n{err}",
            "Das Update konnte nicht geprüft oder installiert werden. Versuche es später erneut oder lade es von der GitHub-Release-Seite.\n\n{err}",
        ],
        _ => ["", "", ""],
    };
    match lang().as_str() {
        "zh" => row[0],
        "de" => row[2],
        _ => row[1],
    }
}

fn trim_notes(notes: &str) -> String {
    let notes = notes.trim();
    if notes.chars().count() <= MAX_NOTES {
        return notes.to_string();
    }
    let cut: String = notes.chars().take(MAX_NOTES).collect();
    format!("{}…", cut.trim_end())
}

async fn notice(title: &str, body: String) {
    let _ = rfd::AsyncMessageDialog::new()
        .set_level(rfd::MessageLevel::Info)
        .set_title(title)
        .set_description(&body)
        .set_buttons(rfd::MessageButtons::Ok)
        .show()
        .await;
}

/// `manual`: started by the user (menu / Settings) — also reports "up to date" and errors.
pub async fn check(app: AppHandle, manual: bool) {
    if CHECKING.swap(true, Ordering::SeqCst) {
        return;
    }
    let result = run_check(&app, manual).await;
    CHECKING.store(false, Ordering::SeqCst);
    if let Err(error) = result {
        if manual {
            notice(text("failed"), text("failed_body").replace("{err}", &error)).await;
        }
    }
}

async fn run_check(app: &AppHandle, manual: bool) -> Result<(), String> {
    let current = app.package_info().version.to_string();
    let update = app
        .updater()
        .map_err(|e| e.to_string())?
        .check()
        .await
        .map_err(|e| e.to_string())?;
    let Some(update) = update else {
        if manual {
            notice(text("latest"), text("latest_body").replace("{cur}", &current)).await;
        }
        return Ok(());
    };
    if !manual && *POSTPONED.lock().unwrap() == update.version {
        return Ok(());
    }
    let mut body = text("body").replace("{new}", &update.version).replace("{cur}", &current);
    if let Some(notes) = update.body.as_deref().map(trim_notes).filter(|n| !n.is_empty()) {
        body.push_str("\n\n");
        body.push_str(&notes);
    }
    body.push_str("\n\n");
    body.push_str(text("data"));
    let install = text("install").to_string();
    // QA builds only (cargo --features qa, never released): the end-to-end updater test accepts without a click.
    #[cfg(feature = "qa")]
    if std::env::var_os("LL_QA_ACCEPT_UPDATE").is_some() {
        update.download_and_install(|_, _| {}, || {}).await.map_err(|e| e.to_string())?;
        app.restart();
    }
    let answer = rfd::AsyncMessageDialog::new()
        .set_level(rfd::MessageLevel::Info)
        .set_title(text("title"))
        .set_description(&body)
        .set_buttons(rfd::MessageButtons::OkCancelCustom(install.clone(), text("later").to_string()))
        .show()
        .await;
    if !crate::confirmed(&answer, &install) {
        *POSTPONED.lock().unwrap() = update.version.clone();
        return Ok(());
    }
    update
        .download_and_install(|_, _| {}, || {})
        .await
        .map_err(|e| e.to_string())?;
    app.restart();
}

/// Launch check (after the windows are up) and one check a day while the app keeps running.
pub fn schedule(app: AppHandle) {
    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_secs(8));
        loop {
            tauri::async_runtime::block_on(check(app.clone(), false));
            std::thread::sleep(DAY);
        }
    });
}

#[cfg(test)]
mod tests {
    use super::trim_notes;

    #[test]
    fn release_notes_are_trimmed_for_the_sheet() {
        assert_eq!(trim_notes("  short  "), "short");
        let long = "字".repeat(900);
        let trimmed = trim_notes(&long);
        assert_eq!(trimmed.chars().count(), 701);
        assert!(trimmed.ends_with('…'));
    }
}
