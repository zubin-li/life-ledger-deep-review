import AppIntents
import WidgetSharedKit

/// Marks one habit's desired completion state for one date. Uses an explicit `desiredDone`
/// rather than "toggle the current state" on purpose: the system may invoke `perform()` more
/// than once for the same tap (retries, re-delivery), and re-stating the same target value is
/// what makes that safe — see `docs/macos-widget.md`'s idempotency section.
struct ToggleHabitIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle Life Ledger Habit"
    static var description = IntentDescription("Marks a Life Ledger habit complete or not complete for today, from the widget.")

    @Parameter(title: "Habit ID")
    var habitId: String

    @Parameter(title: "Date")
    var date: String

    @Parameter(title: "Desired completion state")
    var desiredDone: Bool

    init() {}

    init(habitId: String, date: String, desiredDone: Bool) {
        self.habitId = habitId
        self.date = date
        self.desiredDone = desiredDone
    }

    func perform() async throws -> some IntentResult {
        let mutation = PendingMutation(
            mutationId: mutationId(habitId: habitId, date: date, desiredDone: desiredDone),
            habitId: habitId,
            date: date,
            desiredDone: desiredDone,
            createdAt: Int64(Date().timeIntervalSince1970 * 1000)
        )
        // Best-effort: if the shared container can't be written to (e.g. entitlement
        // misconfiguration), fail quietly rather than crash the widget's host process — the
        // toggle simply won't take effect and the row's next render reflects that.
        _ = try? GroupContainer.writePendingMutations(groupIdentifier: WidgetConfiguration.appGroupIdentifier) { queue in
            MutationQueue.upsert(mutation, into: &queue)
        }
        // No manual WidgetCenter.reloadTimelines() call: per Apple's WidgetKit interactivity
        // guidance, returning from perform() always triggers an automatic timeline reload for
        // interactive Button/Toggle actions, and the TimelineProvider re-reads (and overlays,
        // via EffectiveSnapshot) this same pending-mutations.json on that reload.
        return .result()
    }
}
