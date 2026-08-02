import Foundation
import CoreGraphics
import AppKit

/// Глобальный перехват выбранной горячей клавиши через CGEventTap.
///
/// Почему event tap, а не Carbon-хоткеи или KeyboardShortcuts: одиночный
/// модификатор (без обычной клавиши) генерирует только событие .flagsChanged,
/// которое shortcut-API не отдают. Event tap видит его напрямую по флагу и
/// keyCode, а также умеет СЪЕДАТЬ событие, чтобы система его не увидела.
///
/// Поддерживаются два варианта (см. `HotkeyKey`):
/// - `.fn`     — Fn/Globe, keyCode 63 (kVK_Function), флаг `.maskSecondaryFn`;
/// - `.rightOption` — правый Option, keyCode 61 (kVK_RightOption), флаг
///   `.maskAlternate` (левый Option, keyCode 58, не трогается).
///
/// Защита от «комбо»: реальные нажатия Fn+F-клавиша (яркость/громкость),
/// Fn+стрелка (Home/End/PageUp/PageDown) и подобные на macOS приходят как
/// flagsChanged(key down) → keyDown(другая клавиша, с тем же флагом) →
/// keyUp → flagsChanged(key up). Мы стартуем запись сразу по flagsChanged
/// (минимальная задержка), но если ДО отпускания придёт keyDown любой
/// другой клавиши — это комбо, а не соло-нажатие: помечаем запись как
/// отменённую и на release вызываем `onCancelledByCombo` вместо `onRelease`,
/// чтобы распознанный (или ещё пишущийся) звук не превращался в текст.
final class HotkeyManager {
    /// Меняется на лету из настроек; изменение применяется без перезапуска tap.
    var activeKey: HotkeyKey = .fn {
        didSet {
            keyIsDown = false
            comboDetected = false
        }
    }

    /// Вызывается на main thread.
    var onPress: (() -> Void)?
    var onRelease: (() -> Void)?
    /// Клавиша была отпущена, но во время удержания была нажата другая
    /// клавиша (комбо) — текущую запись нужно отменить без вставки текста.
    var onCancelledByCombo: (() -> Void)?
    /// Пока true — keyDown с зажатым правым Option проглатываются (чтобы не
    /// печатались спецсимволы). Для Fn не используется: Fn сам по себе не
    /// печатает символы.
    var shouldSwallowKeyDown: (() -> Bool)?
    /// Диагностика для окна настроек: человекочитаемое описание последнего
    /// распознанного события хоткея. Помогает убедиться, что клавиша реально
    /// видна обработчику, не включая запись.
    var onDiagnostic: ((String) -> Void)?

    private var tap: CFMachPort?
    private var runLoopSource: CFRunLoopSource?
    private var keyIsDown = false
    private var comboDetected = false

    var isRunning: Bool { tap != nil }

    /// Запускает event tap. Возвращает false, если нет разрешений
    /// (Accessibility / Input Monitoring).
    @discardableResult
    func start() -> Bool {
        guard tap == nil else { return true }

        // NX_SYSDEFINED (14) — медиа-клавиши (яркость, громкость, подсветка),
        // которые Fn+F1…F12 генерируют вместо обычного keyDown. Без него
        // Fn+F2 не распознавался бы как комбо.
        let systemDefined: UInt32 = 14
        let mask: CGEventMask =
            (1 << CGEventType.flagsChanged.rawValue) |
            (1 << CGEventType.keyDown.rawValue) |
            (1 << CGEventMask(systemDefined))

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
        keyIsDown = false
        comboDetected = false
    }

    private func handle(type: CGEventType, event: CGEvent) -> Unmanaged<CGEvent>? {
        // Система отключает tap при таймауте или вводе пароля — включаем обратно.
        if type == .tapDisabledByTimeout || type == .tapDisabledByUserInput {
            if let tap { CGEvent.tapEnable(tap: tap, enable: true) }
            return Unmanaged.passUnretained(event)
        }

        let keyCode = event.getIntegerValueField(.keyboardEventKeycode)
        let key = activeKey

        switch type {
        case .flagsChanged:
            guard keyCode == key.keyCode else { return Unmanaged.passUnretained(event) }

            let passThrough: Unmanaged<CGEvent>? =
                key.shouldConsumeFlagsChanged ? nil : Unmanaged.passUnretained(event)

            let isDown = event.flags.contains(key.modifierFlag)
            // Игнорируем повторные flagsChanged с тем же состоянием (защита от
            // дублирующихся событий — одна запись на одно нажатие).
            guard isDown != keyIsDown else { return passThrough }

            keyIsDown = isDown
            let rawFlags = event.flags.rawValue
            if isDown {
                comboDetected = false
                DispatchQueue.main.async { [weak self] in
                    self?.onDiagnostic?("нажатие: keyCode \(keyCode), flags 0x\(String(rawFlags, radix: 16))")
                    self?.onPress?()
                }
            } else {
                let wasCombo = comboDetected
                comboDetected = false
                DispatchQueue.main.async { [weak self] in
                    self?.onDiagnostic?(wasCombo
                        ? "отпускание: keyCode \(keyCode) — было комбо, запись отменена"
                        : "отпускание: keyCode \(keyCode), flags 0x\(String(rawFlags, radix: 16))")
                    if wasCombo {
                        self?.onCancelledByCombo?()
                    } else {
                        self?.onRelease?()
                    }
                }
            }

            // Правый Option съедаем полностью (система не должна печатать
            // спецсимволы). Fn не съедаем: сам по себе он ничего не печатает,
            // а поглощение flagsChanged для Fn ломает Fn+F-клавиши и Fn+стрелки.
            return passThrough

        case .keyDown:
            if keyIsDown, keyCode != key.keyCode {
                // Хотkey удерживается, а пришла ДРУГАЯ клавиша — это комбо
                // (Fn+F1, Fn+←, ⌥+буква и т.п.), а не соло-нажатие.
                // Помечаем текущую запись как отменённую.
                comboDetected = true
            }
            if key == .rightOption, keyIsDown,
               event.flags.contains(.maskAlternate),
               shouldSwallowKeyDown?() == true {
                return nil
            }
            return Unmanaged.passUnretained(event)

        default:
            // NX_SYSDEFINED: медиа-клавиша нажата при удерживаемом хоткее —
            // это Fn+F1…F12 (яркость/громкость), тоже комбо.
            if type.rawValue == 14, keyIsDown {
                comboDetected = true
            }
            return Unmanaged.passUnretained(event)
        }
    }
}
