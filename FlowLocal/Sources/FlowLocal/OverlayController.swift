import Foundation
import AppKit
import SwiftUI

/// Состояние пайплайна для индикатора и меню.
enum PipelineState: Equatable {
    case idle
    case loadingModel
    case recording
    case transcribing
    case error(String)

    var title: String {
        switch self {
        case .idle: return "Готов"
        case .loadingModel: return "Загружаю модель…"
        case .recording: return "Слушаю…"
        case .transcribing: return "Распознаю…"
        case .error(let message): return message
        }
    }
}

/// Модель для SwiftUI-вью индикатора.
final class OverlayModel: ObservableObject {
    @Published var state: PipelineState = .idle
    @Published var level: Float = 0 // уровень микрофона 0…1
}

/// Floating-индикатор «слушаю / распознаю».
///
/// NSPanel c .nonactivatingPanel: показывается поверх всех окон и НЕ забирает
/// фокус — курсор остаётся в приложении, куда пользователь диктует.
@MainActor
final class OverlayController {
    private var panel: NSPanel?
    private let model = OverlayModel()

    func update(state: PipelineState) {
        model.state = state
        switch state {
        case .recording, .transcribing:
            show()
        case .idle, .loadingModel:
            hide()
        case .error:
            show()
            // Ошибку показываем недолго и прячем.
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) { [weak self] in
                if case .error = self?.model.state ?? .idle { self?.hide() }
            }
        }
    }

    func update(level: Float) {
        model.level = level
    }

    private func show() {
        if panel == nil { panel = makePanel() }
        position()
        panel?.orderFrontRegardless()
    }

    private func hide() {
        panel?.orderOut(nil)
    }

    private func makePanel() -> NSPanel {
        let panel = NSPanel(
            contentRect: NSRect(x: 0, y: 0, width: 190, height: 44),
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )
        panel.level = .statusBar
        panel.isFloatingPanel = true
        panel.hidesOnDeactivate = false
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = true
        panel.ignoresMouseEvents = true
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        panel.contentView = NSHostingView(rootView: OverlayView(model: model))
        return panel
    }

    /// Внизу по центру экрана с курсором мыши (там, где пользователь работает).
    private func position() {
        guard let panel else { return }
        let mouse = NSEvent.mouseLocation
        let screen = NSScreen.screens.first { NSMouseInRect(mouse, $0.frame, false) }
            ?? NSScreen.main
        guard let frame = screen?.visibleFrame else { return }
        let size = panel.frame.size
        let origin = NSPoint(
            x: frame.midX - size.width / 2,
            y: frame.minY + 48
        )
        panel.setFrameOrigin(origin)
    }
}

/// Вид индикатора: капсула с иконкой и статусом.
struct OverlayView: View {
    @ObservedObject var model: OverlayModel

    var body: some View {
        HStack(spacing: 8) {
            switch model.state {
            case .recording:
                Image(systemName: "mic.fill")
                    .foregroundStyle(.red)
                LevelBars(level: model.level)
                Text("Слушаю…")
            case .transcribing:
                ProgressView()
                    .controlSize(.small)
                Text("Распознаю…")
            case .error(let message):
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundStyle(.yellow)
                Text(message)
                    .lineLimit(1)
            default:
                EmptyView()
            }
        }
        .font(.system(size: 13, weight: .medium))
        .foregroundStyle(.white)
        .padding(.horizontal, 14)
        .padding(.vertical, 9)
        .background(.black.opacity(0.78), in: Capsule())
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

/// Простая «живая» индикация уровня микрофона.
struct LevelBars: View {
    var level: Float

    var body: some View {
        HStack(spacing: 2) {
            ForEach(0..<5, id: \.self) { i in
                Capsule()
                    .fill(.white.opacity(barActive(i) ? 0.95 : 0.3))
                    .frame(width: 3, height: barHeight(i))
            }
        }
        .animation(.linear(duration: 0.08), value: level)
    }

    private func barActive(_ index: Int) -> Bool {
        level > Float(index) * 0.15 + 0.03
    }

    private func barHeight(_ index: Int) -> CGFloat {
        [8, 12, 16, 12, 8][index]
    }
}
