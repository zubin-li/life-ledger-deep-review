import Foundation

/// Parses/formats the contract's plain "YYYY-MM-DD" local-calendar date string. Fixed
/// `en_US_POSIX` locale + explicit format on the parser (not the display formatter) keeps
/// parsing itself locale-independent even though the *displayed* text is localized.
let isoDateFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.dateFormat = "yyyy-MM-dd"
    formatter.timeZone = TimeZone.current
    return formatter
}()

let displayDateFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.dateStyle = .medium
    formatter.timeStyle = .none
    return formatter
}()
