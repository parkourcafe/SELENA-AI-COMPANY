import Foundation
import AVFoundation
import ApplicationServices
import IOKit.hid
import AppKit

/// Проверка и запрос системных разрешений macOS.
///
/// Нужны три разрешения:
/// - Микрофон — запись голоса (AVAudioEngine);
/// - Универсальный доступ (Accessibility) — эмуляция Cmd+V и активный event tap;
/// - Мониторинг ввода (Input Monitoring) — глобальный перехват клавиатуры.
@MainActor
final class PermissionsManager: ObservableObject {
    static let shared = PermissionsManager()

    @Published var microphoneGranted = false
    @Published var accessibilityGranted = false
    @Published var inputMonitoringGranted = false

    var allGranted: Bool {
        microphoneGranted && accessibilityGranted && inputMonitoringGranted
    }

    private init() {
        refresh()
    }

    func refresh() {
        microphoneGranted = AVCaptureDevice.authorizationStatus(for: .audio) == .authorized
        accessibilityGranted = AXIsProcessTrusted()
        inputMonitoringGranted = IOHIDCheckAccess(kIOHIDRequestTypeListenEvent) == kIOHIDAccessTypeGranted
    }

    /// Запрашивает все недостающие разрешения (системные диалоги/подсветка в
    /// Системных настройках).
    func requestAll() async {
        if AVCaptureDevice.authorizationStatus(for: .audio) == .notDetermined {
            _ = await AVCaptureDevice.requestAccess(for: .audio)
        }
        if !AXIsProcessTrusted() {
            let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true] as CFDictionary
            AXIsProcessTrustedWithOptions(options)
        }
        if IOHIDCheckAccess(kIOHIDRequestTypeListenEvent) != kIOHIDAccessTypeGranted {
            IOHIDRequestAccess(kIOHIDRequestTypeListenEvent)
        }
        refresh()
    }

    // MARK: - Ссылки на нужные панели Системных настроек

    func openMicrophoneSettings() {
        open("x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone")
    }

    func openAccessibilitySettings() {
        open("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
    }

    func openInputMonitoringSettings() {
        open("x-apple.systempreferences:com.apple.preference.security?Privacy_ListenEvent")
    }

    private func open(_ urlString: String) {
        if let url = URL(string: urlString) {
            NSWorkspace.shared.open(url)
        }
    }
}
