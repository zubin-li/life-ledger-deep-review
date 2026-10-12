import XCTest
@testable import WidgetSharedKit

/// Exercises the atomic-write primitive directly against a plain temp directory. The
/// `containerURL(forSecurityApplicationGroupIdentifier:)`-backed path can't be tested this way
/// (it requires a real, entitled, sandboxed App Group and returns nil in a plain `swift test`
/// run), but the atomic write itself — the part most worth verifying — takes a directory
/// directly and has no such dependency.
final class GroupContainerAtomicWriteTests: XCTestCase {
    private var tempDir: URL!

    override func setUpWithError() throws {
        tempDir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)
    }

    override func tearDownWithError() throws {
        try? FileManager.default.removeItem(at: tempDir)
    }

    func testWriteAtomicallyCreatesTheDestinationFileWithTheExactBytes() throws {
        let url = tempDir.appendingPathComponent("pending-mutations.json")
        let payload = Data(#"{"schemaVersion":1,"mutations":[]}"#.utf8)
        try GroupContainer.writeAtomically(payload, to: url, directory: tempDir)
        XCTAssertEqual(try Data(contentsOf: url), payload)
    }

    func testWriteAtomicallyReplacesAnExistingFileWithoutLeavingTempFilesBehind() throws {
        let url = tempDir.appendingPathComponent("pending-mutations.json")
        try GroupContainer.writeAtomically(Data("first".utf8), to: url, directory: tempDir)
        try GroupContainer.writeAtomically(Data("second".utf8), to: url, directory: tempDir)
        XCTAssertEqual(try Data(contentsOf: url), Data("second".utf8))
        let leftovers = try FileManager.default.contentsOfDirectory(atPath: tempDir.path).filter { $0.contains(".tmp-") }
        XCTAssertTrue(leftovers.isEmpty, "atomic write must not leave temp files behind: \(leftovers)")
    }

    func testPendingMutationQueueRoundTripsThroughEncodeAndAtomicWrite() throws {
        let url = tempDir.appendingPathComponent("pending-mutations.json")
        var queue = PendingMutationQueue()
        queue.mutations.append(PendingMutation(
            mutationId: mutationId(habitId: "exercise", date: "2026-09-29", desiredDone: true),
            habitId: "exercise", date: "2026-09-29", desiredDone: true, createdAt: 1
        ))
        let data = try JSONEncoder().encode(queue)
        try GroupContainer.writeAtomically(data, to: url, directory: tempDir)
        let decoded = try JSONDecoder().decode(PendingMutationQueue.self, from: Data(contentsOf: url))
        XCTAssertEqual(decoded, queue)
    }
}
