import Foundation
import Combine
import CoreGraphics

/// Какая физическая клавиша используется как хоткей диктовки.
enum HotkeyKey: String, CaseIterable, Identifiable {
    case fn          // Fn / Globe — по умолчанию
    case rightOption // правый Option — запасной вариант

    var id: String { rawValue }

    var title: String {
        switch self {
        case .fn: return "Fn / 🌐 Globe (по умолчанию)"
        case .rightOption: return "Правый Option ⌥ (запасной вариант)"
        }
    }

    /// virtual keyCode, который приходит в CGEvent для этой клавиши.
    var keyCode: Int64 {
        switch self {
        case .fn: return 63           // kVK_Function
        case .rightOption: return 61  // kVK_RightOption
        }
    }

    /// Флаг в CGEventFlags, которым сопровождается нажатие этой клавиши.
    var modifierFlag: CGEventFlags {
        switch self {
        case .fn: return .maskSecondaryFn
        case .rightOption: return .maskAlternate
        }
    }

    /// Съедать ли flagsChanged-событие целиком (не пропускать систему/приложение).
    /// Для правого Option — да (иначе печатаются спецсимволы). Для Fn — нет:
    /// сам по себе Fn ничего не печатает, событие безопасно пропустить дальше.
    var shouldConsumeFlagsChanged: Bool {
        switch self {
        case .fn: return false
        case .rightOption: return true
        }
    }
}

/// Режим срабатывания горячей клавиши.
enum HotkeyMode: String, CaseIterable, Identifiable {
    case hold   // запись, пока клавиша зажата (по умолчанию)
    case toggle // нажал — старт, нажал ещё раз — стоп

    var id: String { rawValue }
    var title: String {
        switch self {
        case .hold: return "Удерживать (hold-to-talk)"
        case .toggle: return "Переключатель (toggle)"
        }
    }
}

/// Язык распознавания.
enum RecognitionLanguage: String, CaseIterable, Identifiable {
    case auto
    case ru
    case en

    var id: String { rawValue }
    var title: String {
        switch self {
        case .auto: return "Авто (ru/en)"
        case .ru: return "Русский"
        case .en: return "English"
        }
    }
    /// nil для whisper == автоопределение.
    var whisperCode: String? { self == .auto ? nil : rawValue }
}

/// Способ вставки текста в активное приложение.
enum InjectionMode: String, CaseIterable, Identifiable {
    case paste // clipboard + Cmd+V с восстановлением буфера (по умолчанию)
    case type  // посимвольный ввод через CGEvent keyboardSetUnicodeString

    var id: String { rawValue }
    var title: String {
        switch self {
        case .paste: return "Через буфер обмена (Cmd+V)"
        case .type: return "Посимвольный ввод (fallback)"
        }
    }
}

/// Настройки приложения. Хранятся в UserDefaults, переживают перезапуск.
final class AppSettings: ObservableObject {
    static let shared = AppSettings()

    private let d = UserDefaults.standard

    @Published var model: WhisperModel {
        didSet { d.set(model.rawValue, forKey: "model") }
    }
    @Published var language: RecognitionLanguage {
        didSet { d.set(language.rawValue, forKey: "language") }
    }
    @Published var hotkeyKey: HotkeyKey {
        didSet { d.set(hotkeyKey.rawValue, forKey: "hotkeyKey") }
    }
    @Published var hotkeyMode: HotkeyMode {
        didSet { d.set(hotkeyMode.rawValue, forKey: "hotkeyMode") }
    }
    @Published var injectionMode: InjectionMode {
        didSet { d.set(injectionMode.rawValue, forKey: "injectionMode") }
    }
    @Published var cleanupEnabled: Bool {
        didSet { d.set(cleanupEnabled, forKey: "cleanupEnabled") }
    }
    @Published var cleanupModel: String {
        didSet { d.set(cleanupModel, forKey: "cleanupModel") }
    }
    @Published var launchAtLogin: Bool {
        didSet { d.set(launchAtLogin, forKey: "launchAtLogin") }
    }

    private init() {
        model = WhisperModel(rawValue: d.string(forKey: "model") ?? "") ?? .largeV3Turbo
        language = RecognitionLanguage(rawValue: d.string(forKey: "language") ?? "") ?? .auto
        hotkeyKey = HotkeyKey(rawValue: d.string(forKey: "hotkeyKey") ?? "") ?? .fn
        hotkeyMode = HotkeyMode(rawValue: d.string(forKey: "hotkeyMode") ?? "") ?? .hold
        injectionMode = InjectionMode(rawValue: d.string(forKey: "injectionMode") ?? "") ?? .paste
        cleanupEnabled = d.bool(forKey: "cleanupEnabled") // по умолчанию ВЫКЛ
        cleanupModel = d.string(forKey: "cleanupModel") ?? "qwen2.5:3b"
        launchAtLogin = d.bool(forKey: "launchAtLogin")
    }
}
