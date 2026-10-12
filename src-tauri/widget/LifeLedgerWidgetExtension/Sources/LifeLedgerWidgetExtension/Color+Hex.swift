import SwiftUI

extension Color {
    /// Parses a `#RRGGBB` hex string from `WidgetPalette`. Falls back to sage on any malformed
    /// input — the palette itself is validated at the Rust trust boundary, so this is only a
    /// defensive fallback, never expected to trigger in practice.
    init(hex: String) {
        var sanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        sanitized.removeAll { $0 == "#" }
        var value: UInt64 = 0
        guard sanitized.count == 6, Scanner(string: sanitized).scanHexInt64(&value) else {
            self = Color(red: 0.435, green: 0.561, blue: 0.490) // sage fallback
            return
        }
        let r = Double((value & 0xFF0000) >> 16) / 255
        let g = Double((value & 0x00FF00) >> 8) / 255
        let b = Double(value & 0x0000FF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
