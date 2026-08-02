#!/usr/bin/env swift
//
// Автономный пробник клавиатурных событий.
//
// Отвечает на вопрос: какие СОБЫТИЯ реально приходят от macOS, когда вы
// нажимаете Fn/🌐 на ЭТОЙ машине с ЭТОЙ клавиатурой. Не зависит от FlowLocal
// и его разрешений — это отдельный процесс.
//
// Запуск:  swift scripts/probe-keys.swift
// Выход:   Ctrl+C
//
// Терминалу (или iTerm) понадобятся права «Мониторинг ввода» —
// macOS спросит сама при первом запуске.

import Foundation
import CoreGraphics
import AppKit

func describe(_ flags: CGEventFlags) -> String {
    var parts: [String] = []
    if flags.contains(.maskSecondaryFn) { parts.append("Fn") }
    if flags.contains(.maskAlternate)   { parts.append("Option") }
    if flags.contains(.maskShift)       { parts.append("Shift") }
    if flags.contains(.maskControl)     { parts.append("Control") }
    if flags.contains(.maskCommand)     { parts.append("Command") }
    if flags.contains(.maskAlphaShift)  { parts.append("CapsLock") }
    return parts.isEmpty ? "—" : parts.joined(separator: "+")
}

let callback: CGEventTapCallBack = { _, type, event, _ in
    let keyCode = event.getIntegerValueField(.keyboardEventKeycode)
    let flags = event.flags
    let hex = String(flags.rawValue, radix: 16)

    switch type {
    case .flagsChanged:
        var note = ""
        if keyCode == 63 { note = "  <<< это Fn/Globe (kVK_Function)" }
        if keyCode == 61 { note = "  <<< это ПРАВЫЙ Option" }
        if keyCode == 58 { note = "  (левый Option)" }
        print("flagsChanged  keyCode=\(keyCode)  flags=0x\(hex)  [\(describe(flags))]\(note)")
    case .keyDown:
        print("keyDown       keyCode=\(keyCode)  flags=0x\(hex)  [\(describe(flags))]")
    default:
        if type.rawValue == 14 {
            print("systemDefined (медиа-клавиша)  flags=0x\(hex)  [\(describe(flags))]")
        }
    }
    return Unmanaged.passUnretained(event)
}

let systemDefined: UInt32 = 14
let mask: CGEventMask =
    (1 << CGEventType.flagsChanged.rawValue) |
    (1 << CGEventType.keyDown.rawValue) |
    (1 << CGEventMask(systemDefined))

guard let tap = CGEvent.tapCreate(
    tap: .cgSessionEventTap,
    place: .headInsertEventTap,
    options: .listenOnly,          // только слушаем, ничего не поглощаем
    eventsOfInterest: mask,
    callback: callback,
    userInfo: nil
) else {
    print("""
    ❌ НЕ УДАЛОСЬ создать event tap.

    Значит, у терминала нет прав на чтение клавиатуры. Выдайте их:
      Системные настройки → Конфиденциальность и безопасность
        → Мониторинг ввода  → включить Terminal (или iTerm)
        → Универсальный доступ → включить Terminal (или iTerm)
    Затем ПОЛНОСТЬЮ закройте терминал (Cmd+Q) и запустите пробник снова.
    """)
    exit(1)
}

CFRunLoopAddSource(CFRunLoopGetCurrent(),
                   CFMachPortCreateRunLoopSource(kCFAllocatorDefault, tap, 0),
                   .commonModes)
CGEvent.tapEnable(tap: tap, enable: true)

print("""
=== Пробник клавиш запущен ===

Нажмите и отпустите Fn/🌐 несколько раз. Затем правый Option.
Каждое событие будет напечатано ниже.

Что мы ищем:
  • при нажатии Fn должна появиться строка с keyCode=63 и флагом Fn;
  • если при нажатии Fn НИЧЕГО не печатается — эта клавиша на вашей
    клавиатуре не доходит до системного слоя событий, и FlowLocal
    физически не может её поймать (нужен правый Option).

Выход: Ctrl+C
------------------------------------------------------------
""")

CFRunLoopRun()
