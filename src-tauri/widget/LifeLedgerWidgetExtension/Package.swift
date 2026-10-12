// swift-tools-version:5.9
import PackageDescription

/// Builds the widget extension's Mach-O executable via plain `swift build` (no .xcodeproj).
/// `scripts/build-widget.sh` wraps the resulting binary into a `LifeLedgerWidgetExtension.appex`
/// bundle by hand (Info.plist + this binary + entitlements + codesign) — see that script and
/// docs/macos-widget.md for why. This package only builds on macOS 14+ (WidgetKit/AppIntents are
/// Apple-SDK-only and unavailable on any other platform, including other Apple OSes here since
/// this widget is macOS-only).
let package = Package(
    name: "LifeLedgerWidgetExtension",
    platforms: [.macOS(.v14)],
    products: [
        .executable(name: "LifeLedgerWidgetExtension", targets: ["LifeLedgerWidgetExtension"])
    ],
    dependencies: [
        .package(path: "../WidgetSharedKit")
    ],
    targets: [
        .executableTarget(
            name: "LifeLedgerWidgetExtension",
            dependencies: ["WidgetSharedKit"],
            // Required for any macOS/iOS app-extension binary (WidgetKit extensions included):
            // marks the compiled objects and the linked Mach-O as extension-safe. Without both
            // of these, the OS will refuse to load this binary as an NSExtension (WidgetKit
            // extension point) even though it compiles and runs fine as a plain executable.
            // `-application-extension` has no stable SwiftPM `.unsafeFlags`-free spelling, so it
            // must be passed through `unsafeFlags` — safe here because this package is a leaf
            // executable, not something another package depends on.
            swiftSettings: [
                .unsafeFlags(["-application-extension"])
            ],
            linkerSettings: [
                .unsafeFlags(["-application-extension"])
            ]
        )
    ]
)
