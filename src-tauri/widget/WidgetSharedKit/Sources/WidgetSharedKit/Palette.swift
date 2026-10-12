import Foundation

/// The fixed six-color habit palette, mirrored exactly from `colors` in `public/app.js` (solid
/// values only — the widget has no CSS, so it needs concrete hex, not a CSS custom property).
/// `WidgetHabit.color` is validated against these exact keys at the Rust trust boundary
/// (`ALLOWED_COLORS` in widget_bridge.rs), so any value that reaches the widget is one of these.
public enum WidgetPalette {
    public static let solidHex: [String: String] = [
        "sage": "#6F8F7D",
        "amber": "#D7A84C",
        "coral": "#D97861",
        "blue": "#6E8C98",
        "violet": "#8B79C6",
        "cyan": "#4D9DB3",
    ]

    /// Falls back to sage for any unrecognized key, matching `habitStyle()`'s fallback in
    /// public/app.js — defensive in case a future contract version adds a color this build of
    /// the widget doesn't know about yet.
    public static func hex(for key: String) -> String {
        solidHex[key] ?? solidHex["sage"]!
    }
}
