import WidgetKit
import WidgetSharedKit

struct HabitEntry: TimelineEntry {
    let date: Date
    /// `nil` only means "the app has never published a snapshot yet" (fresh install before
    /// first launch) — the view falls back to `LifeLedgerWidgetConfig.placeholderSnapshot`.
    let snapshot: WidgetSnapshot?
}

struct HabitTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> HabitEntry {
        HabitEntry(date: Date(), snapshot: LifeLedgerWidgetConfig.placeholderSnapshot)
    }

    func getSnapshot(in context: Context, completion: @escaping (HabitEntry) -> Void) {
        completion(context.isPreview ? placeholder(in: context) : currentEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<HabitEntry>) -> Void) {
        let entry = currentEntry()
        // A background safety net, not the primary refresh path: an AppIntent's perform()
        // already guarantees an immediate reload on its own, and the app nudges a reload after
        // every publish (see nudge_widget_reload in widget_bridge.rs). This just bounds how
        // stale the widget can get if neither of those fired recently (e.g. Mac asleep).
        let nextRefresh = Calendar.current.date(byAdding: .minute, value: 30, to: entry.date)
            ?? entry.date.addingTimeInterval(30 * 60)
        completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
    }

    private func currentEntry() -> HabitEntry {
        guard let base = GroupContainer.readSnapshot(groupIdentifier: LifeLedgerWidgetConfig.appGroupIdentifier) else {
            return HabitEntry(date: Date(), snapshot: nil)
        }
        let pending = GroupContainer.readPendingMutations(groupIdentifier: LifeLedgerWidgetConfig.appGroupIdentifier)
        let merged = EffectiveSnapshot.merge(snapshot: base, pending: pending)
        return HabitEntry(date: Date(), snapshot: merged)
    }
}
