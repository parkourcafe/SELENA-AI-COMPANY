// swift-tools-version:5.9
import PackageDescription

// FlowLocal — локальная диктовка для macOS на whisper.cpp (Metal).
//
// Перед первой сборкой выполните: ./scripts/build-whisper.sh
// Скрипт соберёт whisper.cpp с Metal и положит Frameworks/whisper.xcframework.

let package = Package(
    name: "FlowLocal",
    platforms: [
        .macOS(.v14)
    ],
    targets: [
        .executableTarget(
            name: "FlowLocal",
            dependencies: ["whisper"],
            path: "Sources/FlowLocal",
            linkerSettings: [
                .linkedLibrary("c++"),
                .linkedFramework("Accelerate"),
                .linkedFramework("Metal"),
                .linkedFramework("MetalKit"),
                .linkedFramework("Foundation"),
                .linkedFramework("AVFoundation"),
                .linkedFramework("AppKit"),
                .linkedFramework("CoreGraphics"),
                .linkedFramework("IOKit"),
                .linkedFramework("ServiceManagement"),
            ]
        ),
        // Собирается скриптом scripts/build-whisper.sh (whisper.cpp + Metal, arm64).
        .binaryTarget(
            name: "whisper",
            path: "Frameworks/whisper.xcframework"
        ),
    ]
)
