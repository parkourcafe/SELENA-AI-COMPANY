import Foundation
import AppKit
import CoreGraphics

/// Вставка распознанного текста в активное приложение.
///
/// Основной режим — через буфер обмена: сохранить текущее содержимое →
/// положить текст → эмулировать Cmd+V → восстановить прежний буфер.
/// Работает в любых приложениях, включая те, что фильтруют синтетический ввод.
///
/// Fallback — посимвольный «ввод с клавиатуры» через keyboardSetUnicodeString:
/// не трогает буфер обмена вовсе, но медленнее и изредка теряет символы в
/// приложениях с нестандартной обработкой ввода.
final class TextInjector {
    /// Снимок содержимого pasteboard: все item'ы со всеми типами данных.
    private struct PasteboardSnapshot {
        let items: [[NSPasteboard.PasteboardType: Data]]
    }

    func inject(_ text: String, mode: InjectionMode) {
        guard !text.isEmpty else { return }
        switch mode {
        case .paste: pasteViaClipboard(text)
        case .type: typeUnicode(text)
        }
    }

    // MARK: - Clipboard-paste

    private func pasteViaClipboard(_ text: String) {
        let pasteboard = NSPasteboard.general
        let snapshot = snapshotPasteboard(pasteboard)

        pasteboard.clearContents()
        pasteboard.setString(text, forType: .string)

        sendCmdV()

        // Восстанавливаем буфер после того, как активное приложение успело
        // прочитать наш текст по Cmd+V. 400 мс — с запасом даже для Electron.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { [weak self] in
            self?.restorePasteboard(pasteboard, snapshot: snapshot)
        }
    }

    private func snapshotPasteboard(_ pasteboard: NSPasteboard) -> PasteboardSnapshot {
        var items: [[NSPasteboard.PasteboardType: Data]] = []
        for item in pasteboard.pasteboardItems ?? [] {
            var entry: [NSPasteboard.PasteboardType: Data] = [:]
            for type in item.types {
                if let data = item.data(forType: type) {
                    entry[type] = data
                }
            }
            if !entry.isEmpty { items.append(entry) }
        }
        return PasteboardSnapshot(items: items)
    }

    private func restorePasteboard(_ pasteboard: NSPasteboard, snapshot: PasteboardSnapshot) {
        pasteboard.clearContents()
        guard !snapshot.items.isEmpty else { return }
        let restored = snapshot.items.map { entry in
            let item = NSPasteboardItem()
            for (type, data) in entry {
                item.setData(data, forType: type)
            }
            return item
        }
        pasteboard.writeObjects(restored)
    }

    private func sendCmdV() {
        let source = CGEventSource(stateID: .combinedSessionState)
        let vKeyCode: CGKeyCode = 9 // kVK_ANSI_V

        guard let keyDown = CGEvent(keyboardEventSource: source, virtualKey: vKeyCode, keyDown: true),
              let keyUp = CGEvent(keyboardEventSource: source, virtualKey: vKeyCode, keyDown: false) else { return }
        keyDown.flags = .maskCommand
        keyUp.flags = .maskCommand
        keyDown.post(tap: .cghidEventTap)
        keyUp.post(tap: .cghidEventTap)
    }

    // MARK: - Unicode typing fallback

    private func typeUnicode(_ text: String) {
        let source = CGEventSource(stateID: .combinedSessionState)
        // keyboardSetUnicodeString надёжно работает небольшими порциями.
        let chunkSize = 20
        var rest = Substring(text)
        while !rest.isEmpty {
            let chunk = String(rest.prefix(chunkSize))
            rest = rest.dropFirst(chunk.count)

            var utf16 = Array(chunk.utf16)
            guard let keyDown = CGEvent(keyboardEventSource: source, virtualKey: 0, keyDown: true),
                  let keyUp = CGEvent(keyboardEventSource: source, virtualKey: 0, keyDown: false) else { continue }
            keyDown.keyboardSetUnicodeString(stringLength: utf16.count, unicodeString: &utf16)
            keyUp.keyboardSetUnicodeString(stringLength: utf16.count, unicodeString: &utf16)
            keyDown.post(tap: .cghidEventTap)
            keyUp.post(tap: .cghidEventTap)
            // Небольшая пауза, чтобы приложения-получатели не теряли события.
            usleep(8_000)
        }
    }
}
