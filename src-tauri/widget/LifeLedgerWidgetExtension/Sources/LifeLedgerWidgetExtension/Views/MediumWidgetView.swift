import SwiftUI
import WidgetKit
import WidgetSharedKit

struct MediumWidgetView: View {
    let entry: HabitEntry
    private let maxVisibleRows = 4

    private var snapshot: WidgetSnapshot { entry.snapshot ?? LifeLedgerWidgetConfig.placeholderSnapshot }

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            VStack(alignment: .leading, spacing: 4) {
                Text(formattedDate)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                Text("\(snapshot.completedCount)/\(snapshot.totalCount)")
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .minimumScaleFactor(0.7)
                    .lineLimit(1)
                Text(progressCaption)
                    .font(.system(size: 10))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            .frame(width: 66, alignment: .leading)
            .accessibilityElement(children: .combine)

            VStack(alignment: .leading, spacing: 7) {
                if snapshot.habits.isEmpty {
                    Text("No active habits today")
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(snapshot.habits.prefix(maxVisibleRows), id: \.id) { habit in
                        HabitRow(habit: habit, date: snapshot.date)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(4)
        .containerBackground(for: .widget) { Color.clear }
    }

    private var progressCaption: String {
        guard snapshot.totalCount > 0 else { return "" }
        return snapshot.completedCount >= snapshot.totalCount ? "All done" : "today"
    }

    private var formattedDate: String {
        guard let date = isoDateFormatter.date(from: snapshot.date) else { return "" }
        return displayDateFormatter.string(from: date)
    }
}

private struct HabitRow: View {
    let habit: WidgetHabit
    let date: String

    var body: some View {
        Button(intent: ToggleHabitIntent(habitId: habit.id, date: date, desiredDone: !habit.done)) {
            HStack(spacing: 8) {
                ZStack {
                    Circle()
                        .strokeBorder(habit.done ? Color.clear : Color(hex: WidgetPalette.hex(for: habit.color)).opacity(0.55), lineWidth: 1.5)
                    Circle()
                        .fill(habit.done ? Color(hex: WidgetPalette.hex(for: habit.color)) : Color.clear)
                    if habit.done {
                        Image(systemName: "checkmark")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundStyle(.white)
                    }
                }
                .frame(width: 18, height: 18)

                Text(habit.name)
                    .font(.system(size: 12, weight: habit.done ? .regular : .medium))
                    .foregroundStyle(habit.done ? .secondary : .primary)
                    .strikethrough(habit.done, pattern: .solid, color: .secondary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.85)

                Spacer(minLength: 0)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .frame(minHeight: 22)
        .accessibilityLabel(Text(habit.name))
        .accessibilityValue(Text(habit.done ? "Completed" : "Not completed"))
        .accessibilityAddTraits(habit.done ? [.isSelected] : [])
        .accessibilityHint(Text(habit.done ? "Mark as not completed" : "Mark as completed"))
    }
}
