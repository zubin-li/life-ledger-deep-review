import Foundation
import WidgetSharedKit

/// Build-time configuration read from the extension's own Info.plist, so no Swift source needs
/// templating — `scripts/build-widget.sh` substitutes `LifeLedgerAppGroupIdentifier` in
/// `Info.plist` from the `APP_GROUP_ID` environment variable at packaging time. The fallback
/// below only matters for previews/local iteration before that substitution has ever run.
///
/// Deliberately named `LifeLedgerWidgetConfig`, not `WidgetConfiguration`: WidgetKit/SwiftUI
/// already declare a protocol named `WidgetConfiguration` (what `Widget.body` must return), and
/// a same-module type of that exact name shadows it, so `some WidgetConfiguration` in
/// `LifeLedgerWidgetBundle.swift` resolves to this type instead of the framework protocol —
/// which fails to compile ("a 'some' type must specify only Any...") and makes the widget not
/// conform to `Widget`. Keep this name unique from any WidgetKit/SwiftUI symbol.
enum LifeLedgerWidgetConfig {
    static let appGroupIdentifier: String = {
        (Bundle.main.object(forInfoDictionaryKey: "LifeLedgerAppGroupIdentifier") as? String)
            .flatMap { $0.isEmpty ? nil : $0 }
            ?? "group.app.zubinli.lifeledger"
    }()

    /// Shown in the widget gallery preview and briefly before the first real snapshot exists.
    static let placeholderSnapshot = WidgetSnapshot(
        schemaVersion: widgetContractSchemaVersion,
        date: isoDateFormatter.string(from: Date()),
        timezone: TimeZone.current.identifier,
        revision: 0,
        updatedAt: 0,
        completedCount: 2,
        totalCount: 4,
        habits: [
            WidgetHabit(id: "placeholder-exercise", name: "Exercise", icon: "running", color: "coral", done: true, countsTowardDaily: true),
            WidgetHabit(id: "placeholder-reading", name: "Reading", icon: "book", color: "amber", done: false, countsTowardDaily: true),
            WidgetHabit(id: "placeholder-hydration", name: "Hydration", icon: "droplets", color: "cyan", done: true, countsTowardDaily: true),
            WidgetHabit(id: "placeholder-meditation", name: "Meditation", icon: "brain", color: "violet", done: false, countsTowardDaily: true),
        ]
    )
}
