import SwiftUI
import AppKit

@main
struct FlowLocalApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var controller = DictationController.shared

    var body: some Scene {
        MenuBarExtra {
            MenuContent(controller: controller)
        } label: {
            Image(systemName: menuBarIcon)
        }
        .menuBarExtraStyle(.menu)

        Settings {
            SettingsView(controller: controller)
        }
    }

    private var menuBarIcon: String {
        switch controller.state {
        case .recording: return "mic.fill"
        case .transcribing: return "waveform"
        case .loadingModel: return "arrow.down.circle"
        case .error: return "mic.slash"
        case .idle: return "mic"
        }
    }
}

/// Скрывает Dock-иконку при запуске без бандла (swift run) и запускает пайплайн.
final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        // В бандле это делает LSUIElement в Info.plist; для swift run — здесь.
        NSApp.setActivationPolicy(.accessory)
        DictationController.shared.start()
    }
}

struct MenuContent: View {
    @ObservedObject var controller: DictationController

    var body: some View {
        Text("FlowLocal — \(statusLine)")

        Divider()

        SettingsLink {
            Text("Настройки…")
        }
        .keyboardShortcut(",")

        Button("Проверить разрешения") {
            Task { await controller.permissions.requestAll()
                   controller.startHotkeyIfPossible() }
        }

        Divider()

        Text(hintLine)
            .font(.caption)

        Divider()

        Button("Выйти") {
            NSApplication.shared.terminate(nil)
        }
        .keyboardShortcut("q")
    }

    private var statusLine: String {
        if !controller.permissions.allGranted { return "нужны разрешения" }
        return controller.state.title
    }

    private var hintLine: String {
        controller.settings.hotkeyMode == .hold
            ? "Зажмите правый ⌥, диктуйте, отпустите"
            : "Нажмите правый ⌥ — старт, ещё раз — стоп"
    }
}
