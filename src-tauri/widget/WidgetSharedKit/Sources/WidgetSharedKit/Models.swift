import Foundation

/// Contract version. Must match `WIDGET_CONTRACT_SCHEMA_VERSION` in
/// `src-tauri/src/widget_bridge.rs` and `WIDGET_SCHEMA_VERSION` in
/// `public/widget-contract.js` — all three are the same versioned JSON contract.
public let widgetContractSchemaVersion = 1

/// Mirrors `MAX_WIDGET_HABITS` in widget_bridge.rs / `WIDGET_MAX_HABITS` in widget-contract.js.
public let widgetMaxHabits = 8

/// Mirrors `MAX_PENDING_MUTATIONS` in widget_bridge.rs.
public let widgetMaxPendingMutations = 64

/// One row the widget can render and let the person toggle. Property names match the JSON
/// contract's camelCase field names exactly, so no `CodingKeys` are needed.
public struct WidgetHabit: Codable, Equatable, Sendable {
    public var id: String
    public var name: String
    public var icon: String
    public var color: String
    public var done: Bool
    public var countsTowardDaily: Bool

    public init(id: String, name: String, icon: String, color: String, done: Bool, countsTowardDaily: Bool) {
        self.id = id
        self.name = name
        self.icon = icon
        self.color = color
        self.done = done
        self.countsTowardDaily = countsTowardDaily
    }
}

/// The app-published "today" snapshot — the widget's base source of truth. Never contains
/// journal notes, mood reasons, account identifiers, or cloud credentials; see
/// `docs/macos-widget.md` for the full boundary.
public struct WidgetSnapshot: Codable, Equatable, Sendable {
    public var schemaVersion: Int
    /// Local calendar date, "YYYY-MM-DD" — the same day the app itself considers "today".
    public var date: String
    /// IANA timezone identifier, informational only.
    public var timezone: String
    /// Monotonically increasing counter the app bumps on every publish.
    public var revision: UInt64
    public var updatedAt: Int64
    public var completedCount: Int
    public var totalCount: Int
    public var habits: [WidgetHabit]

    public init(
        schemaVersion: Int,
        date: String,
        timezone: String,
        revision: UInt64,
        updatedAt: Int64,
        completedCount: Int,
        totalCount: Int,
        habits: [WidgetHabit]
    ) {
        self.schemaVersion = schemaVersion
        self.date = date
        self.timezone = timezone
        self.revision = revision
        self.updatedAt = updatedAt
        self.completedCount = completedCount
        self.totalCount = totalCount
        self.habits = habits
    }
}

/// One widget-originated change the app has not yet applied. `desiredDone` (not "toggle") is the
/// whole idempotency story: replaying the same intent, or the system retrying it, always
/// expresses the same target state, so it can never double-toggle.
public struct PendingMutation: Codable, Equatable, Sendable {
    /// Deterministic: `"\(habitId)#\(date)#\(desiredDone)"`. See `mutationId(habitId:date:desiredDone:)`.
    public var mutationId: String
    public var habitId: String
    public var date: String
    public var desiredDone: Bool
    public var createdAt: Int64

    public init(mutationId: String, habitId: String, date: String, desiredDone: Bool, createdAt: Int64) {
        self.mutationId = mutationId
        self.habitId = habitId
        self.date = date
        self.desiredDone = desiredDone
        self.createdAt = createdAt
    }
}

public struct PendingMutationQueue: Codable, Equatable, Sendable {
    public var schemaVersion: Int
    public var mutations: [PendingMutation]

    public init(schemaVersion: Int = widgetContractSchemaVersion, mutations: [PendingMutation] = []) {
        self.schemaVersion = schemaVersion
        self.mutations = mutations
    }
}

/// Deterministic mutation id — must byte-for-byte match `mutation_id_for` in widget_bridge.rs
/// and `widgetMutationId` in widget-contract.js. Covered by `MutationIdTests`.
public func mutationId(habitId: String, date: String, desiredDone: Bool) -> String {
    "\(habitId)#\(date)#\(desiredDone)"
}
