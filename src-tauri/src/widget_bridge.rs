//! Bridge between the local Tauri window and the native macOS WidgetKit extension.
//!
//! The extension is a *separate process* that only ever talks to this app through a shared
//! App Group container on disk (`~/Library/Group Containers/<group-id>/`), never through Tauri
//! IPC. This module is the sole owner of that container from the Rust side: it validates every
//! value crossing the boundary, writes atomically (temp file + rename, same directory), and
//! never accepts a caller-supplied filesystem path — the container path is always resolved here
//! from the configured App Group id, so JS can only ever talk about habit ids/dates/booleans.
//!
//! These commands are registered only on the `local-only` capability (the `local` window). The
//! `cloud` window has no capability entry at all and therefore no access to any command in this
//! module — publishing/consuming widget data never happens for remote/cloud content.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

pub const WIDGET_CONTRACT_SCHEMA_VERSION: u32 = 1;
pub const MAX_WIDGET_HABITS: usize = 8;
pub const MAX_PENDING_MUTATIONS: usize = 64;
pub const MAX_ID_LEN: usize = 128;
pub const MAX_NAME_LEN: usize = 60;
pub const MAX_ICON_LEN: usize = 32;
/// Bounded payload guard at the Rust trust boundary: reject anything implausibly large before
/// it ever touches disk, independent of the structural limits above (belt and suspenders).
pub const MAX_SNAPSHOT_JSON_BYTES: usize = 32 * 1024;
pub const MAX_PENDING_QUEUE_JSON_BYTES: usize = 16 * 1024;

/// Must match `LifeLedgerHabitWidget.kind` in `widget/LifeLedgerWidgetExtension/LifeLedgerWidgetBundle.swift`.
const WIDGET_KIND: &str = "LifeLedgerHabitWidget";
const SNAPSHOT_FILE_NAME: &str = "snapshot.json";
const PENDING_MUTATIONS_FILE_NAME: &str = "pending-mutations.json";
const ALLOWED_COLORS: [&str; 6] = ["sage", "amber", "coral", "blue", "violet", "cyan"];

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct WidgetHabit {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub color: String,
    pub done: bool,
    #[serde(rename = "countsTowardDaily")]
    pub counts_toward_daily: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct WidgetSnapshot {
    #[serde(rename = "schemaVersion")]
    pub schema_version: u32,
    /// Local calendar date, "YYYY-MM-DD" — must match the app's own `isoDate()` output, not UTC.
    pub date: String,
    /// IANA timezone identifier (e.g. "Asia/Shanghai"), informational only.
    pub timezone: String,
    /// Monotonically increasing counter the app bumps on every publish; lets the widget/reader
    /// side detect a stale read without relying on wall-clock comparisons.
    pub revision: u64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
    #[serde(rename = "completedCount")]
    pub completed_count: u32,
    #[serde(rename = "totalCount")]
    pub total_count: u32,
    pub habits: Vec<WidgetHabit>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct PendingMutation {
    /// Deterministic: `"{habit_id}#{date}#{desired_done}"`. Re-submitting the same
    /// (habit, date, desired state) triple always yields the same id, so a naive retry or a
    /// duplicate widget tap can never produce more than one logical pending change.
    #[serde(rename = "mutationId")]
    pub mutation_id: String,
    #[serde(rename = "habitId")]
    pub habit_id: String,
    pub date: String,
    #[serde(rename = "desiredDone")]
    pub desired_done: bool,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Default)]
pub struct PendingMutationQueue {
    #[serde(rename = "schemaVersion")]
    pub schema_version: u32,
    pub mutations: Vec<PendingMutation>,
}

fn is_id_char(c: char) -> bool {
    c.is_ascii_alphanumeric() || c == '-' || c == '_'
}

fn validate_id(value: &str, field: &str) -> Result<(), String> {
    if value.is_empty() || value.len() > MAX_ID_LEN {
        return Err(format!("{field}: invalid length"));
    }
    if !value.chars().all(is_id_char) {
        return Err(format!("{field}: invalid characters"));
    }
    Ok(())
}

fn validate_date(value: &str) -> Result<(), String> {
    let bytes = value.as_bytes();
    if bytes.len() != 10 || bytes[4] != b'-' || bytes[7] != b'-' {
        return Err("date: invalid format, expected YYYY-MM-DD".to_string());
    }
    let year: u32 = value.get(0..4).and_then(|s| s.parse().ok()).ok_or("date: invalid year")?;
    let month: u32 = value.get(5..7).and_then(|s| s.parse().ok()).ok_or("date: invalid month")?;
    let day: u32 = value.get(8..10).and_then(|s| s.parse().ok()).ok_or("date: invalid day")?;
    if !(2000..=2100).contains(&year) || !(1..=12).contains(&month) || !(1..=31).contains(&day) {
        return Err("date: value out of range".to_string());
    }
    Ok(())
}

fn validate_habit(habit: &WidgetHabit) -> Result<(), String> {
    validate_id(&habit.id, "habit.id")?;
    if habit.name.is_empty() || habit.name.chars().count() > MAX_NAME_LEN {
        return Err("habit.name: invalid length".to_string());
    }
    if habit.icon.is_empty() || habit.icon.len() > MAX_ICON_LEN || !habit.icon.chars().all(|c| c.is_ascii_lowercase()) {
        return Err("habit.icon: invalid".to_string());
    }
    if !ALLOWED_COLORS.contains(&habit.color.as_str()) {
        return Err("habit.color: not in the fixed palette".to_string());
    }
    Ok(())
}

pub fn validate_snapshot(snapshot: &WidgetSnapshot) -> Result<(), String> {
    if snapshot.schema_version != WIDGET_CONTRACT_SCHEMA_VERSION {
        return Err("schemaVersion: unsupported".to_string());
    }
    validate_date(&snapshot.date)?;
    if snapshot.timezone.is_empty() || snapshot.timezone.len() > 64 {
        return Err("timezone: invalid length".to_string());
    }
    if snapshot.completed_count > snapshot.total_count || snapshot.total_count > 500 {
        return Err("completedCount/totalCount: inconsistent or implausible".to_string());
    }
    if snapshot.habits.len() > MAX_WIDGET_HABITS {
        return Err(format!("habits: exceeds bound of {MAX_WIDGET_HABITS}"));
    }
    for habit in &snapshot.habits {
        validate_habit(habit)?;
    }
    let serialized = serde_json::to_vec(snapshot).map_err(|e| e.to_string())?;
    if serialized.len() > MAX_SNAPSHOT_JSON_BYTES {
        return Err("snapshot: serialized payload exceeds the bounded size limit".to_string());
    }
    Ok(())
}

fn validate_pending_mutation(mutation: &PendingMutation) -> Result<(), String> {
    validate_id(&mutation.habit_id, "mutation.habitId")?;
    validate_date(&mutation.date)?;
    let expected_id = mutation_id_for(&mutation.habit_id, &mutation.date, mutation.desired_done);
    if mutation.mutation_id != expected_id {
        return Err("mutation.mutationId: does not match its own habitId/date/desiredDone".to_string());
    }
    Ok(())
}

pub fn mutation_id_for(habit_id: &str, date: &str, desired_done: bool) -> String {
    format!("{habit_id}#{date}#{desired_done}")
}

fn validate_pending_queue(queue: &PendingMutationQueue) -> Result<(), String> {
    if queue.schema_version != WIDGET_CONTRACT_SCHEMA_VERSION {
        return Err("schemaVersion: unsupported".to_string());
    }
    if queue.mutations.len() > MAX_PENDING_MUTATIONS {
        return Err(format!("mutations: exceeds bound of {MAX_PENDING_MUTATIONS}"));
    }
    for mutation in &queue.mutations {
        validate_pending_mutation(mutation)?;
    }
    let serialized = serde_json::to_vec(queue).map_err(|e| e.to_string())?;
    if serialized.len() > MAX_PENDING_QUEUE_JSON_BYTES {
        return Err("mutations: serialized payload exceeds the bounded size limit".to_string());
    }
    Ok(())
}

/// Coalesces a mutation into a queue: any existing pending entry for the same (habitId, date)
/// is replaced (last write wins) rather than appended, so rapid or repeated identical taps can
/// never grow the queue unboundedly and always converge to the latest desired state.
///
/// The widget extension (Swift, not this Rust binary) is what actually appends to
/// `pending-mutations.json` at runtime — `ToggleHabitIntent.perform()` must coalesce the same
/// way. This function is the authoritative, unit-tested reference implementation of that
/// coalescing rule; `WidgetSharedKit`'s Swift `upsertPendingMutation` (see
/// `src-tauri/widget/WidgetSharedKit/Sources`) is required to match its behavior exactly, and
/// the tests below are the spec both sides are checked against. Rust itself never calls this at
/// runtime (it only ever removes acknowledged entries), hence the explicit allow.
#[allow(dead_code)]
pub fn upsert_pending_mutation(queue: &mut PendingMutationQueue, mutation: PendingMutation) {
    queue.mutations.retain(|existing| !(existing.habit_id == mutation.habit_id && existing.date == mutation.date));
    queue.mutations.push(mutation);
}

fn atomic_write_json<T: Serialize>(path: &Path, value: &T) -> Result<(), String> {
    let dir = path.parent().ok_or_else(|| "widget bridge: invalid target path".to_string())?;
    fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    let bytes = serde_json::to_vec(value).map_err(|e| e.to_string())?;
    let tmp_name = format!(
        ".{}.tmp-{}",
        path.file_name().and_then(|n| n.to_str()).unwrap_or("widget-bridge"),
        std::process::id()
    );
    let tmp_path = dir.join(tmp_name);
    fs::write(&tmp_path, &bytes).map_err(|e| e.to_string())?;
    fs::rename(&tmp_path, path).map_err(|e| e.to_string())?;
    Ok(())
}

/// The App Group identifier, shared by the main app's and the widget extension's entitlements.
/// Baked in at compile time from `LIFE_LEDGER_APP_GROUP_ID` (see `scripts/build-widget.sh`),
/// with a runtime override for local development so this binary doesn't need to be rebuilt just
/// to point at a different App Group while iterating.
fn widget_group_id() -> String {
    std::env::var("LIFE_LEDGER_APP_GROUP_ID")
        .ok()
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| option_env!("LIFE_LEDGER_APP_GROUP_ID").unwrap_or("group.app.zubinli.lifeledger").to_string())
}

/// Resolves the on-disk App Group container. macOS places App Group containers at the stable,
/// documented path `~/Library/Group Containers/<group-id>/` — the same location
/// `FileManager.containerURL(forSecurityApplicationGroupIdentifier:)` resolves to from Swift.
/// Rust has no supported way to call that Swift/Foundation API directly, so this constructs the
/// well-known path instead; see docs/macos-widget.md for the tradeoff.
fn widget_group_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let home = app.path().home_dir().map_err(|e| e.to_string())?;
    let dir = home.join("Library").join("Group Containers").join(widget_group_id());
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

/// Best-effort nudge so the widget doesn't wait for its next scheduled timeline refresh after
/// the app publishes new data from outside an AppIntent (WidgetKit's automatic post-`perform()`
/// reload only covers intent-originated changes). `WidgetCenter.reloadTimelines` is a
/// Swift/WidgetKit API with no supported Rust FFI, so this spawns a tiny prebuilt Swift helper
/// executable instead. Missing/failing is non-fatal: the widget's own timeline policy and its
/// AppIntent's guaranteed reload still keep it eventually consistent.
fn nudge_widget_reload(app: &AppHandle) {
    let Ok(resource_dir) = app.path().resource_dir() else {
        return;
    };
    let helper = resource_dir.join("life-ledger-widget-reload");
    if !helper.is_file() {
        return;
    }
    let _ = std::process::Command::new(helper).arg(WIDGET_KIND).spawn();
}

#[tauri::command]
pub fn publish_widget_snapshot(app: AppHandle, snapshot: WidgetSnapshot) -> Result<(), String> {
    validate_snapshot(&snapshot)?;
    let dir = widget_group_dir(&app)?;
    atomic_write_json(&dir.join(SNAPSHOT_FILE_NAME), &snapshot)?;
    nudge_widget_reload(&app);
    Ok(())
}

#[tauri::command]
pub fn read_pending_widget_mutations(app: AppHandle) -> Result<PendingMutationQueue, String> {
    let dir = widget_group_dir(&app)?;
    let path = dir.join(PENDING_MUTATIONS_FILE_NAME);
    if !path.is_file() {
        return Ok(PendingMutationQueue {
            schema_version: WIDGET_CONTRACT_SCHEMA_VERSION,
            mutations: Vec::new(),
        });
    }
    let contents = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let queue: PendingMutationQueue = serde_json::from_str(&contents).map_err(|e| e.to_string())?;
    validate_pending_queue(&queue)?;
    Ok(queue)
}

#[tauri::command]
pub fn ack_widget_mutations(app: AppHandle, mutation_ids: Vec<String>) -> Result<(), String> {
    if mutation_ids.len() > MAX_PENDING_MUTATIONS {
        return Err("mutationIds: exceeds bound".to_string());
    }
    let dir = widget_group_dir(&app)?;
    let path = dir.join(PENDING_MUTATIONS_FILE_NAME);
    if !path.is_file() {
        return Ok(());
    }
    let contents = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let mut queue: PendingMutationQueue = serde_json::from_str(&contents).map_err(|e| e.to_string())?;
    validate_pending_queue(&queue)?;
    queue.mutations.retain(|m| !mutation_ids.contains(&m.mutation_id));
    atomic_write_json(&path, &queue)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_habit() -> WidgetHabit {
        WidgetHabit {
            id: "exercise".to_string(),
            name: "Exercise".to_string(),
            icon: "running".to_string(),
            color: "coral".to_string(),
            done: false,
            counts_toward_daily: true,
        }
    }

    fn sample_snapshot() -> WidgetSnapshot {
        WidgetSnapshot {
            schema_version: WIDGET_CONTRACT_SCHEMA_VERSION,
            date: "2026-09-29".to_string(),
            timezone: "Asia/Shanghai".to_string(),
            revision: 1,
            updated_at: 1_000_000,
            completed_count: 1,
            total_count: 2,
            habits: vec![sample_habit()],
        }
    }

    #[test]
    fn valid_snapshot_passes() {
        assert!(validate_snapshot(&sample_snapshot()).is_ok());
    }

    #[test]
    fn rejects_unsupported_schema_version() {
        let mut snapshot = sample_snapshot();
        snapshot.schema_version = 99;
        assert!(validate_snapshot(&snapshot).is_err());
    }

    #[test]
    fn rejects_malformed_dates() {
        for bad in ["2026-9-29", "2026/09/29", "", "not-a-date", "2026-13-01", "2026-01-32", "1999-01-01"] {
            let mut snapshot = sample_snapshot();
            snapshot.date = bad.to_string();
            assert!(validate_snapshot(&snapshot).is_err(), "expected rejection for {bad}");
        }
    }

    #[test]
    fn rejects_inconsistent_counts() {
        let mut snapshot = sample_snapshot();
        snapshot.completed_count = 5;
        snapshot.total_count = 2;
        assert!(validate_snapshot(&snapshot).is_err());
    }

    #[test]
    fn rejects_too_many_habits() {
        let mut snapshot = sample_snapshot();
        snapshot.habits = (0..MAX_WIDGET_HABITS + 1)
            .map(|i| WidgetHabit { id: format!("habit-{i}"), ..sample_habit() })
            .collect();
        assert!(validate_snapshot(&snapshot).is_err());
    }

    #[test]
    fn rejects_habit_ids_with_unsafe_characters() {
        for bad in ["../etc/passwd", "habit id", "habit;rm -rf", ""] {
            let mut snapshot = sample_snapshot();
            snapshot.habits[0].id = bad.to_string();
            assert!(validate_snapshot(&snapshot).is_err(), "expected rejection for {bad:?}");
        }
    }

    #[test]
    fn rejects_color_outside_the_fixed_palette() {
        let mut snapshot = sample_snapshot();
        snapshot.habits[0].color = "rainbow".to_string();
        assert!(validate_snapshot(&snapshot).is_err());
    }

    #[test]
    fn rejects_oversized_name() {
        let mut snapshot = sample_snapshot();
        snapshot.habits[0].name = "x".repeat(MAX_NAME_LEN + 1);
        assert!(validate_snapshot(&snapshot).is_err());
    }

    #[test]
    fn mutation_id_is_deterministic_and_distinguishes_desired_state() {
        let on = mutation_id_for("exercise", "2026-09-29", true);
        let off = mutation_id_for("exercise", "2026-09-29", false);
        assert_eq!(on, mutation_id_for("exercise", "2026-09-29", true));
        assert_ne!(on, off);
    }

    #[test]
    fn repeated_identical_mutations_do_not_grow_the_queue() {
        let mut queue = PendingMutationQueue { schema_version: WIDGET_CONTRACT_SCHEMA_VERSION, mutations: vec![] };
        for _ in 0..5 {
            upsert_pending_mutation(
                &mut queue,
                PendingMutation {
                    mutation_id: mutation_id_for("exercise", "2026-09-29", true),
                    habit_id: "exercise".to_string(),
                    date: "2026-09-29".to_string(),
                    desired_done: true,
                    created_at: 1,
                },
            );
        }
        assert_eq!(queue.mutations.len(), 1);
        assert_eq!(queue.mutations[0].desired_done, true);
    }

    #[test]
    fn a_later_opposite_mutation_for_the_same_habit_and_date_replaces_the_earlier_one() {
        let mut queue = PendingMutationQueue { schema_version: WIDGET_CONTRACT_SCHEMA_VERSION, mutations: vec![] };
        upsert_pending_mutation(
            &mut queue,
            PendingMutation {
                mutation_id: mutation_id_for("exercise", "2026-09-29", true),
                habit_id: "exercise".to_string(),
                date: "2026-09-29".to_string(),
                desired_done: true,
                created_at: 1,
            },
        );
        upsert_pending_mutation(
            &mut queue,
            PendingMutation {
                mutation_id: mutation_id_for("exercise", "2026-09-29", false),
                habit_id: "exercise".to_string(),
                date: "2026-09-29".to_string(),
                desired_done: false,
                created_at: 2,
            },
        );
        assert_eq!(queue.mutations.len(), 1);
        assert_eq!(queue.mutations[0].desired_done, false);
    }

    #[test]
    fn mutations_for_different_habits_or_dates_do_not_collide() {
        let mut queue = PendingMutationQueue { schema_version: WIDGET_CONTRACT_SCHEMA_VERSION, mutations: vec![] };
        upsert_pending_mutation(
            &mut queue,
            PendingMutation {
                mutation_id: mutation_id_for("exercise", "2026-09-29", true),
                habit_id: "exercise".to_string(),
                date: "2026-09-29".to_string(),
                desired_done: true,
                created_at: 1,
            },
        );
        upsert_pending_mutation(
            &mut queue,
            PendingMutation {
                mutation_id: mutation_id_for("reading", "2026-09-29", true),
                habit_id: "reading".to_string(),
                date: "2026-09-29".to_string(),
                desired_done: true,
                created_at: 2,
            },
        );
        upsert_pending_mutation(
            &mut queue,
            PendingMutation {
                mutation_id: mutation_id_for("exercise", "2026-09-30", true),
                habit_id: "exercise".to_string(),
                date: "2026-09-30".to_string(),
                desired_done: true,
                created_at: 3,
            },
        );
        assert_eq!(queue.mutations.len(), 3);
    }

    #[test]
    fn rejects_pending_queue_over_the_bound() {
        let mutations = (0..MAX_PENDING_MUTATIONS + 1)
            .map(|i| PendingMutation {
                mutation_id: mutation_id_for(&format!("habit-{i}"), "2026-09-29", true),
                habit_id: format!("habit-{i}"),
                date: "2026-09-29".to_string(),
                desired_done: true,
                created_at: 1,
            })
            .collect();
        let queue = PendingMutationQueue { schema_version: WIDGET_CONTRACT_SCHEMA_VERSION, mutations };
        assert!(validate_pending_queue(&queue).is_err());
    }

    #[test]
    fn rejects_a_mutation_id_that_does_not_match_its_own_fields() {
        let queue = PendingMutationQueue {
            schema_version: WIDGET_CONTRACT_SCHEMA_VERSION,
            mutations: vec![PendingMutation {
                mutation_id: "forged-id".to_string(),
                habit_id: "exercise".to_string(),
                date: "2026-09-29".to_string(),
                desired_done: true,
                created_at: 1,
            }],
        };
        assert!(validate_pending_queue(&queue).is_err());
    }

    #[test]
    fn snapshot_round_trips_through_json_with_camel_case_field_names() {
        let snapshot = sample_snapshot();
        let json = serde_json::to_string(&snapshot).unwrap();
        assert!(json.contains("\"schemaVersion\""));
        assert!(json.contains("\"completedCount\""));
        assert!(json.contains("\"countsTowardDaily\""));
        let round_tripped: WidgetSnapshot = serde_json::from_str(&json).unwrap();
        assert_eq!(round_tripped, snapshot);
    }
}
