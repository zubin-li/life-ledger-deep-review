import Foundation
import WidgetKit

/// Usage: `life-ledger-widget-reload <widget-kind>`
/// Reloads just that widget kind's timelines, or all of them if no argument is given. Errors are
/// swallowed on purpose: the app that spawned this treats the whole call as best-effort (the
/// widget's own periodic timeline policy and its AppIntent's guaranteed reload keep it eventually
/// consistent even if this helper is missing, fails, or the App Group isn't set up yet).
let kind = CommandLine.arguments.dropFirst().first

if let kind, !kind.isEmpty {
    WidgetCenter.shared.reloadTimelines(ofKind: kind)
} else {
    WidgetCenter.shared.reloadAllTimelines()
}
