import Foundation

public enum MutationQueue {
    /// Coalesces a mutation into a queue: any existing pending entry for the same
    /// (habitId, date) is replaced (last write wins) rather than appended, so a rapid or
    /// repeated identical widget tap can never grow the queue unboundedly and always converges
    /// to the latest desired state.
    ///
    /// Must match `upsert_pending_mutation` in `src-tauri/src/widget_bridge.rs` exactly — that
    /// Rust function is the unit-tested reference implementation this mirrors; the tests in
    /// `MutationQueueTests.swift` are this side's half of the same shared spec.
    public static func upsert(_ mutation: PendingMutation, into queue: inout PendingMutationQueue) {
        queue.mutations.removeAll { existing in
            existing.habitId == mutation.habitId && existing.date == mutation.date
        }
        queue.mutations.append(mutation)
    }

    /// Bounds the queue defensively before it's written to disk, mirroring
    /// `MAX_PENDING_MUTATIONS` in widget_bridge.rs. `perform()` runs on a strict time budget, so
    /// this trims the *oldest* entries rather than rejecting the new write outright.
    public static func bounded(_ queue: PendingMutationQueue, limit: Int = widgetMaxPendingMutations) -> PendingMutationQueue {
        guard queue.mutations.count > limit else { return queue }
        var trimmed = queue
        trimmed.mutations = Array(trimmed.mutations.suffix(limit))
        return trimmed
    }
}
