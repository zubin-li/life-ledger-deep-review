import XCTest
@testable import WidgetSharedKit

final class EffectiveSnapshotTests: XCTestCase {
    private func snapshot(completed: Int, total: Int, habits: [WidgetHabit]) -> WidgetSnapshot {
        WidgetSnapshot(
            schemaVersion: widgetContractSchemaVersion, date: "2026-09-29", timezone: "UTC",
            revision: 1, updatedAt: 0, completedCount: completed, totalCount: total, habits: habits
        )
    }

    func testNoPendingMutationsReturnsTheSnapshotUnchanged() {
        let base = snapshot(completed: 1, total: 2, habits: [
            WidgetHabit(id: "exercise", name: "Exercise", icon: "running", color: "coral", done: true, countsTowardDaily: true),
        ])
        let merged = EffectiveSnapshot.merge(snapshot: base, pending: PendingMutationQueue())
        XCTAssertEqual(merged, base)
    }

    func testAPendingCompletionOptimisticallyMarksTheHabitDoneAndBumpsTheCount() {
        let base = snapshot(completed: 0, total: 1, habits: [
            WidgetHabit(id: "exercise", name: "Exercise", icon: "running", color: "coral", done: false, countsTowardDaily: true),
        ])
        var queue = PendingMutationQueue()
        queue.mutations.append(PendingMutation(
            mutationId: mutationId(habitId: "exercise", date: "2026-09-29", desiredDone: true),
            habitId: "exercise", date: "2026-09-29", desiredDone: true, createdAt: 1
        ))
        let merged = EffectiveSnapshot.merge(snapshot: base, pending: queue)
        XCTAssertEqual(merged.habits.first?.done, true)
        XCTAssertEqual(merged.completedCount, 1)
    }

    func testAPendingUncompletionOptimisticallyMarksTheHabitNotDoneAndDropsTheCount() {
        let base = snapshot(completed: 1, total: 1, habits: [
            WidgetHabit(id: "exercise", name: "Exercise", icon: "running", color: "coral", done: true, countsTowardDaily: true),
        ])
        var queue = PendingMutationQueue()
        queue.mutations.append(PendingMutation(
            mutationId: mutationId(habitId: "exercise", date: "2026-09-29", desiredDone: false),
            habitId: "exercise", date: "2026-09-29", desiredDone: false, createdAt: 1
        ))
        let merged = EffectiveSnapshot.merge(snapshot: base, pending: queue)
        XCTAssertEqual(merged.habits.first?.done, false)
        XCTAssertEqual(merged.completedCount, 0)
    }

    func testCompletedCountNeverGoesNegativeOrAboveTotal() {
        let base = snapshot(completed: 0, total: 1, habits: [
            WidgetHabit(id: "exercise", name: "Exercise", icon: "running", color: "coral", done: false, countsTowardDaily: true),
        ])
        var queue = PendingMutationQueue()
        // Redundant "already false" mutation must not push completedCount negative.
        queue.mutations.append(PendingMutation(
            mutationId: mutationId(habitId: "exercise", date: "2026-09-29", desiredDone: false),
            habitId: "exercise", date: "2026-09-29", desiredDone: false, createdAt: 1
        ))
        let merged = EffectiveSnapshot.merge(snapshot: base, pending: queue)
        XCTAssertEqual(merged.completedCount, 0)
    }

    func testMutationsForAnotherDateAreIgnored() {
        let base = snapshot(completed: 0, total: 1, habits: [
            WidgetHabit(id: "exercise", name: "Exercise", icon: "running", color: "coral", done: false, countsTowardDaily: true),
        ])
        var queue = PendingMutationQueue()
        queue.mutations.append(PendingMutation(
            mutationId: mutationId(habitId: "exercise", date: "2026-09-28", desiredDone: true),
            habitId: "exercise", date: "2026-09-28", desiredDone: true, createdAt: 1
        ))
        let merged = EffectiveSnapshot.merge(snapshot: base, pending: queue)
        XCTAssertEqual(merged, base)
    }

    func testAHabitThatDoesNotCountTowardDailyDoesNotShiftTheCompletedCount() {
        let base = snapshot(completed: 0, total: 0, habits: [
            WidgetHabit(id: "strength", name: "Strength", icon: "dumbbell", color: "coral", done: false, countsTowardDaily: false),
        ])
        var queue = PendingMutationQueue()
        queue.mutations.append(PendingMutation(
            mutationId: mutationId(habitId: "strength", date: "2026-09-29", desiredDone: true),
            habitId: "strength", date: "2026-09-29", desiredDone: true, createdAt: 1
        ))
        let merged = EffectiveSnapshot.merge(snapshot: base, pending: queue)
        XCTAssertEqual(merged.habits.first?.done, true)
        XCTAssertEqual(merged.completedCount, 0)
    }
}
