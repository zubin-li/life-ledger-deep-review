// swift-tools-version:5.9
import PackageDescription

/// Foundation-only shared logic between the macOS app and the WidgetKit extension.
///
/// Deliberately depends on nothing beyond Foundation: no WidgetKit, no SwiftUI, no AppIntents.
/// That is what makes it buildable and testable with a plain `swift build` / `swift test` on any
/// machine with a Swift toolchain, independent of the Apple-SDK-only WidgetKit extension target
/// that consumes it (see ../LifeLedgerWidgetExtension, which cannot build outside Xcode/macOS).
let package = Package(
    name: "WidgetSharedKit",
    platforms: [.macOS(.v12)],
    products: [
        .library(name: "WidgetSharedKit", targets: ["WidgetSharedKit"])
    ],
    targets: [
        .target(name: "WidgetSharedKit", dependencies: []),
        .testTarget(name: "WidgetSharedKitTests", dependencies: ["WidgetSharedKit"]),
    ]
)
