// swift-tools-version:5.9
import PackageDescription

/// A tiny, separate executable — not the widget extension itself — that the main (Rust) app
/// spawns as a subprocess after publishing a new snapshot, purely to call
/// `WidgetCenter.shared.reloadTimelines(ofKind:)`. That call is Rust-inaccessible (it's a
/// Swift/WidgetKit API with no supported FFI), and WidgetKit's own automatic post-`perform()`
/// reload only covers intent-originated changes, not app-initiated ones. See
/// docs/macos-widget.md for why this exists as its own tiny binary instead of living inside the
/// widget extension or a Rust FFI shim.
let package = Package(
    name: "WidgetReloadHelper",
    platforms: [.macOS(.v14)],
    targets: [
        .executableTarget(
            name: "WidgetReloadHelper",
            dependencies: []
        )
    ]
)
