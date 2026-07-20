import Foundation
import CoreGraphics
import AppKit

/// Глобальный перехват ПРАВОГО Option (⌥) через CGEventTap.
///
/// Почему event tap, а не Carbon-хоткеи или KeyboardShortcuts: модификатор
/// «соло» (без обычной клавиши) генерирует только событие .flagsChanged,
/// которое shortcut-API не отдают. Event tap видит его и позволяет отличить
/// правый Option (keyCode 61 / kVK_RightOption) от левого (keyCode 58), а
/// также СЪЕСТЬ событие, чтобы система и активное приложение его не увидели.
///
/// Пока идёт запись, дополнительно глотаются keyDown с зажатым Option —
/// чтобы правый Option не печатал спецсимволы в активное поле.
final class HotkeyManager {
    private static let rightOptionKeyCode: Int64 = 61 // kVK_RightOption
    private static let leftOptionKeyCode: Int64 = 58  // kVK_Option

    /// Вызывается на main thread.
    var onPress: (() -> Void)?
    var onRelease: (() -> Void)?
    /// Пока true — keyDown с Option-флагом проглатываются.
    var shouldSwallowKeyDown: (() -> Bool)?

    private var tap: CFMachPort?
    private var runLoopSource: CFRunLoopSource?
    private var rightOptionIsDown = false

    var isRunning: Bool { tap != nil }

    /// Запускает event tap. Возвращает false, если нет разрешений
    /// (Accessibility / Input Monitoring).
    @discardableResult
    func start() -> Bool {
        guard tap == nil else { return true }

        let mask: CGEventMask =
            (1 << CGEventType.flagsChanged.rawValue) |
            (1 << CGEventType.keyDown.rawValue)

        let callback: CGEventTapCallBack = { _, type, event, userInfo in
            guard let userInfo else { return Unmanaged.passUnretained(event) }
            let manager = Unmanaged<HotkeyManager>.fromOpaque(userInfo).takeUnretainedValue()
            return manager.handle(type: type, event: event)
        }

        guard let tap = CGEvent.tapCreate(
            tap: .cgSessionEventTap,
            place: .headInsertEventTap,
            options: .defaultTap, // активный tap — умеет глотать события
            eventsOfInterest: mask,
            callback: callback,
            userInfo: Unmanaged.passUnretained(self).toOpaque()
        ) else {
            return false
        }

        self.tap = tap
        let source = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, tap, 0)
        runLoopSource = source
        CFRunLoopAddSource(CFRunLoopGetMain(), source, .commonModes)
        CGEvent.tapEnable(tap: tap, enable: true)
        return true
    }

    func stop() {
        if let tap { CGEvent.tapEnable(tap: tap, enable: false) }
        if let runLoopSource { CFRunLoopRemoveSource(CFRunLoopGetMain(), runLoopSource, .commonModes) }
        tap = nil
        runLoopSource = nil
        rightOptionIsDown = false
    }

    private func handle(type: CGEventType, event: CGEvent) -> Unmanaged<CGEvent>? {
        // Система отключает tap при таймауте или вводе пароля — включаем обратно.
        if type == .tapDisabledByTimeout || type == .tapDisabledByUserInput {
            if let tap { CGEvent.tapEnable(tap: tap, enable: true) }
            return Unmanaged.passUnretained(event)
        }

        let keyCode = event.getIntegerValueField(.keyboardEventKeycode)

        switch type {
        case .flagsChanged:
            // Только ПРАВЫЙ Option. Левый (58) проходит насквозь.
            guard keyCode == Self.rightOptionKeyCode else {
                return Unmanaged.passUnretained(event)
            }
            let optionDown = event.flags.contains(.maskAlternate)
            if optionDown != rightOptionIsDown {
                rightOptionIsDown = optionDown
                DispatchQueue.main.async { [weak self] in
                    if optionDown { self?.onPress?() } else { self?.onRelease?() }
                }
            }
            // Съедаем событие: система и активное приложение правый Option не видят.
            return nil

        case .keyDown:
            // Во время записи глотаем комбинации с Option, чтобы «немой»
            // модификатор не печатал спецсимволы (´, ®, ™ и т.п.).
            if rightOptionIsDown,
               event.flags.contains(.maskAlternate),
               shouldSwallowKeyDown?() == true {
                return nil
            }
            return Unmanaged.passUnretained(event)

        default:
            return Unmanaged.passUnretained(event)
        }
    }
}
