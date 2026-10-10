import SwiftUI
import WidgetKit

@main
struct LifeLedgerWidgetBundle: WidgetBundle {
    var body: some Widget {
        LifeLedgerHabitWidget()
    }
}

struct LifeLedgerHabitWidget: Widget {
    let kind = "LifeLedgerHabitWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HabitTimelineProvider()) { entry in
            LifeLedgerWidgetView(entry: entry)
        }
        .configurationDisplayName("Life Ledger")
        .description("Today's habits and progress, with one tap to check a habit off.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct LifeLedgerWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: HabitEntry

    var body: some View {
        switch family {
        case .systemMedium:
            MediumWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}
