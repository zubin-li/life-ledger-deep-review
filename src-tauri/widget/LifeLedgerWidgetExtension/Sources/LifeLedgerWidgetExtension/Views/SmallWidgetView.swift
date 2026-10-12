import SwiftUI
import WidgetKit
import WidgetSharedKit

/// systemSmall has no room for a per-habit interactive list, so it shows the calm essentials —
/// date and a progress ring — and (like any widget) opens the app on tap. The bounded per-habit
/// list with interactive Buttons lives in `MediumWidgetView`.
struct SmallWidgetView: View {
    let entry: HabitEntry

    private var snapshot: WidgetSnapshot { entry.snapshot ?? LifeLedgerWidgetConfig.placeholderSnapshot }

    var body: some View {
        VStack(spacing: 6) {
            Text(formattedDate)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)

            ZStack {
                Circle()
                    .stroke(Color.secondary.opacity(0.18), lineWidth: 6)
                Circle()
                    .trim(from: 0, to: progressFraction)
                    .stroke(Color(hex: WidgetPalette.hex(for: "sage")), style: StrokeStyle(lineWidth: 6, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                Text("\(snapshot.completedCount)/\(snapshot.totalCount)")
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)
            }
            .frame(width: 56, height: 56)
        }
        .padding(4)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Text("Life Ledger, \(formattedDate)"))
        .accessibilityValue(Text("\(snapshot.completedCount) of \(snapshot.totalCount) habits complete today"))
        .containerBackground(for: .widget) { Color.clear }
    }

    private var progressFraction: CGFloat {
        snapshot.totalCount > 0 ? CGFloat(snapshot.completedCount) / CGFloat(snapshot.totalCount) : 0
    }

    private var formattedDate: String {
        guard let date = isoDateFormatter.date(from: snapshot.date) else { return "" }
        return displayDateFormatter.string(from: date)
    }
}
