import XCTest
@testable import WidgetSharedKit

final class ModelCodingTests: XCTestCase {
    func testSnapshotRoundTripsThroughJSON() throws {
        let snapshot = WidgetSnapshot(
            schemaVersion: widgetContractSchemaVersion,
            date: "2026-09-29",
            timezone: "Asia/Shanghai",
            revision: 3,
            updatedAt: 1_700_000_000_000,
            completedCount: 1,
            totalCount: 2,
            habits: [
                WidgetHabit(id: "exercise", name: "Exercise", icon: "running", color: "coral", done: true, countsTowardDaily: true),
                WidgetHabit(id: "reading", name: "Reading", icon: "book", color: "amber", done: false, countsTowardDaily: true),
            ]
        )
        let data = try JSONEncoder().encode(snapshot)
        let decoded = try JSONDecoder().decode(WidgetSnapshot.self, from: data)
        XCTAssertEqual(decoded, snapshot)
    }

    func testSnapshotEncodesTheExactCamelCaseFieldNamesTheRustAndJSSidesExpect() throws {
        let snapshot = WidgetSnapshot(
            schemaVersion: 1, date: "2026-09-29", timezone: "UTC", revision: 1, updatedAt: 0,
            completedCount: 0, totalCount: 0, habits: []
        )
        let data = try JSONEncoder().encode(snapshot)
        let json = String(data: data, encoding: .utf8) ?? ""
        for key in ["schemaVersion", "timezone", "updatedAt", "completedCount", "totalCount"] {
            XCTAssertTrue(json.contains("\"\(key)\""), "missing key \(key) in \(json)")
        }
    }

    func testHabitEncodesCountsTowardDailyAsCamelCase() throws {
        let habit = WidgetHabit(id: "exercise", name: "Exercise", icon: "running", color: "coral", done: false, countsTowardDaily: true)
        let data = try JSONEncoder().encode(habit)
        let json = String(data: data, encoding: .utf8) ?? ""
        XCTAssertTrue(json.contains("\"countsTowardDaily\":true"))
    }

    func testDecodingARealSnapshotPayloadWrittenByTheRustSide() throws {
        // A literal example of exactly what widget_bridge.rs's atomic_write_json would produce,
        // pinned here so a field-name drift on either side breaks this test loudly.
        let json = """
        {"schemaVersion":1,"date":"2026-09-29","timezone":"Asia/Shanghai","revision":7,"updatedAt":1700000000000,\
        "completedCount":1,"totalCount":2,"habits":[{"id":"exercise","name":"Exercise","icon":"running",\
        "color":"coral","done":true,"countsTowardDaily":true}]}
        """
        let snapshot = try JSONDecoder().decode(WidgetSnapshot.self, from: Data(json.utf8))
        XCTAssertEqual(snapshot.date, "2026-09-29")
        XCTAssertEqual(snapshot.habits.first?.id, "exercise")
        XCTAssertEqual(snapshot.habits.first?.done, true)
    }

    func testPendingMutationQueueDefaultsToCurrentSchemaVersionAndEmptyMutations() {
        let queue = PendingMutationQueue()
        XCTAssertEqual(queue.schemaVersion, widgetContractSchemaVersion)
        XCTAssertTrue(queue.mutations.isEmpty)
    }
}
