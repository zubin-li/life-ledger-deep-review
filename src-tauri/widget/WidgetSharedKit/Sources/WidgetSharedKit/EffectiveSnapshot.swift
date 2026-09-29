import Foundation

public enum EffectiveSnapshot {
    /// Overlays same-date pending mutations onto the base snapshot's `done` flags, so the widget
    /// shows the optimistic result of a tap immediately without waiting for the app to wake up
    /// and republish. This mirrors Apple's own interactive-widget guidance: "Toggle updates its
    /// appearance optimistically ... without waiting for the result of the performed action."
    ///
    /// `completedCount` is nudged by the same delta so the progress summary stays visually
    /// consistent with the overlaid rows, clamped to `[0, totalCount]`. Only habits present in
    /// the bounded `habits` list can affect this delta — see docs/macos-widget.md for why
    /// `completedCount`/`totalCount` are separate summary fields rather than derived purely from
    /// the (bounded) `habits` array.
    public static func merge(snapshot: WidgetSnapshot, pending: PendingMutationQueue) -> WidgetSnapshot {
        var desiredByHabitId: [String: Bool] = [:]
        for mutation in pending.mutations where mutation.date == snapshot.date {
            desiredByHabitId[mutation.habitId] = mutation.desiredDone
        }
        guard !desiredByHabitId.isEmpty else { return snapshot }

        var completedDelta = 0
        for habit in snapshot.habits {
            guard let desired = desiredByHabitId[habit.id], habit.countsTowardDaily, desired != habit.done else { continue }
            completedDelta += desired ? 1 : -1
        }

        var merged = snapshot
        merged.habits = snapshot.habits.map { habit in
            var habit = habit
            if let desired = desiredByHabitId[habit.id] {
                habit.done = desired
            }
            return habit
        }
        merged.completedCount = max(0, min(merged.totalCount, snapshot.completedCount + completedDelta))
        return merged
    }
}
