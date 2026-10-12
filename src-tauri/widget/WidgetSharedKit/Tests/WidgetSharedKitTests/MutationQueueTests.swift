import XCTest
@testable import WidgetSharedKit

final class MutationQueueTests: XCTestCase {
    func testRepeatedIdenticalMutationsDoNotGrowTheQueue() {
        var queue = PendingMutationQueue()
        for _ in 0..<5 {
            let mutation = PendingMutation(
                mutationId: mutationId(habitId: "exercise", date: "2026-09-29", desiredDone: true),
                habitId: "exercise", date: "2026-09-29", desiredDone: true, createdAt: 1
            )
            MutationQueue.upsert(mutation, into: &queue)
        }
        XCTAssertEqual(queue.mutations.count, 1)
        XCTAssertEqual(queue.mutations.first?.desiredDone, true)
    }

    func testALaterOppositeMutationForTheSameHabitAndDateReplacesTheEarlierOne() {
        var queue = PendingMutationQueue()
        MutationQueue.upsert(
            PendingMutation(mutationId: mutationId(habitId: "exercise", date: "2026-09-29", desiredDone: true),
                             habitId: "exercise", date: "2026-09-29", desiredDone: true, createdAt: 1),
            into: &queue
        )
        MutationQueue.upsert(
            PendingMutation(mutationId: mutationId(habitId: "exercise", date: "2026-09-29", desiredDone: false),
                             habitId: "exercise", date: "2026-09-29", desiredDone: false, createdAt: 2),
            into: &queue
        )
        XCTAssertEqual(queue.mutations.count, 1)
        XCTAssertEqual(queue.mutations.first?.desiredDone, false)
    }

    func testMutationsForDifferentHabitsOrDatesDoNotCollide() {
        var queue = PendingMutationQueue()
        MutationQueue.upsert(
            PendingMutation(mutationId: mutationId(habitId: "exercise", date: "2026-09-29", desiredDone: true),
                             habitId: "exercise", date: "2026-09-29", desiredDone: true, createdAt: 1),
            into: &queue
        )
        MutationQueue.upsert(
            PendingMutation(mutationId: mutationId(habitId: "reading", date: "2026-09-29", desiredDone: true),
                             habitId: "reading", date: "2026-09-29", desiredDone: true, createdAt: 2),
            into: &queue
        )
        MutationQueue.upsert(
            PendingMutation(mutationId: mutationId(habitId: "exercise", date: "2026-09-30", desiredDone: true),
                             habitId: "exercise", date: "2026-09-30", desiredDone: true, createdAt: 3),
            into: &queue
        )
        XCTAssertEqual(queue.mutations.count, 3)
    }

    func testMutationIdIsDeterministicAndDistinguishesDesiredState() {
        let on = mutationId(habitId: "exercise", date: "2026-09-29", desiredDone: true)
        let off = mutationId(habitId: "exercise", date: "2026-09-29", desiredDone: false)
        XCTAssertEqual(on, mutationId(habitId: "exercise", date: "2026-09-29", desiredDone: true))
        XCTAssertNotEqual(on, off)
    }

    func testBoundedTrimsTheOldestEntriesWhenOverTheLimit() {
        var queue = PendingMutationQueue()
        for i in 0..<(widgetMaxPendingMutations + 5) {
            queue.mutations.append(
                PendingMutation(mutationId: "id-\(i)", habitId: "habit-\(i)", date: "2026-09-29", desiredDone: true, createdAt: Int64(i))
            )
        }
        let bounded = MutationQueue.bounded(queue)
        XCTAssertEqual(bounded.mutations.count, widgetMaxPendingMutations)
        // The newest entries (highest createdAt) must be the ones kept.
        XCTAssertEqual(bounded.mutations.last?.mutationId, "id-\(widgetMaxPendingMutations + 4)")
    }
}
