import Foundation
#if canImport(Darwin)
import Darwin
#elseif canImport(Glibc)
import Glibc
#endif

public enum GroupContainerError: Error, Equatable {
    case containerUnavailable(groupIdentifier: String)
    case atomicRenameFailed(errno: Int32)
}

/// Reads/writes the two files the app and the widget extension exchange through the shared App
/// Group container. The widget extension never writes `snapshot.json` (that file is the app's
/// canonical output only) — it only ever appends to `pending-mutations.json`, so there is no
/// write race between the two processes on the same file.
public enum GroupContainer {
    public static let snapshotFileName = "snapshot.json"
    public static let pendingMutationsFileName = "pending-mutations.json"

    public static func containerURL(groupIdentifier: String, fileManager: FileManager = .default) throws -> URL {
        guard let url = fileManager.containerURL(forSecurityApplicationGroupIdentifier: groupIdentifier) else {
            throw GroupContainerError.containerUnavailable(groupIdentifier: groupIdentifier)
        }
        return url
    }

    public static func readSnapshot(groupIdentifier: String, fileManager: FileManager = .default) -> WidgetSnapshot? {
        guard let dir = try? containerURL(groupIdentifier: groupIdentifier, fileManager: fileManager) else { return nil }
        let url = dir.appendingPathComponent(snapshotFileName)
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(WidgetSnapshot.self, from: data)
    }

    public static func readPendingMutations(groupIdentifier: String, fileManager: FileManager = .default) -> PendingMutationQueue {
        guard let dir = try? containerURL(groupIdentifier: groupIdentifier, fileManager: fileManager) else {
            return PendingMutationQueue()
        }
        let url = dir.appendingPathComponent(pendingMutationsFileName)
        guard let data = try? Data(contentsOf: url) else {
            return PendingMutationQueue()
        }
        return (try? JSONDecoder().decode(PendingMutationQueue.self, from: data)) ?? PendingMutationQueue()
    }

    /// Read-modify-write helper for the AppIntent: reads the current queue, lets `mutate` apply
    /// the coalescing upsert, then writes the bounded result back atomically. Returns the
    /// mutation id that was written, for callers that want to log/verify it.
    @discardableResult
    public static func writePendingMutations(
        groupIdentifier: String,
        fileManager: FileManager = .default,
        mutate: (inout PendingMutationQueue) -> Void
    ) throws -> PendingMutationQueue {
        var queue = readPendingMutations(groupIdentifier: groupIdentifier, fileManager: fileManager)
        mutate(&queue)
        queue = MutationQueue.bounded(queue)
        try writeAtomicJSON(queue, fileName: pendingMutationsFileName, groupIdentifier: groupIdentifier, fileManager: fileManager)
        return queue
    }

    static func writeAtomicJSON<T: Encodable>(
        _ value: T,
        fileName: String,
        groupIdentifier: String,
        fileManager: FileManager = .default
    ) throws {
        let dir = try containerURL(groupIdentifier: groupIdentifier, fileManager: fileManager)
        try fileManager.createDirectory(at: dir, withIntermediateDirectories: true)
        let url = dir.appendingPathComponent(fileName)
        let data = try JSONEncoder().encode(value)
        try writeAtomically(data, to: url, directory: dir)
    }

    /// Same shape as the Rust side's `atomic_write_json`: write to a temp file in the same
    /// directory, then POSIX `rename()` it over the destination — atomic on the same filesystem,
    /// so a concurrent reader (the app, or a fresh TimelineProvider request) never observes a
    /// partially written file, and works whether or not the destination already exists.
    static func writeAtomically(_ data: Data, to url: URL, directory: URL) throws {
        let tempURL = directory.appendingPathComponent(".\(url.lastPathComponent).tmp-\(ProcessInfo.processInfo.processIdentifier)")
        try data.write(to: tempURL, options: .atomic)
        let renamed = tempURL.path.withCString { tempPath in
            url.path.withCString { destPath in
                rename(tempPath, destPath)
            }
        }
        if renamed != 0 {
            let code = errno
            try? FileManager.default.removeItem(at: tempURL)
            throw GroupContainerError.atomicRenameFailed(errno: code)
        }
    }
}
