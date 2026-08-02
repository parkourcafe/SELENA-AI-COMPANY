import Foundation
import AppKit
import Combine

/// Оркестратор всего пайплайна:
/// hotkey → запись → whisper → (опц. очистка) → вставка текста.
@MainActor
final class DictationController: ObservableObject {
    static let shared = DictationController()

    @Published private(set) var state: PipelineState = .idle
    @Published private(set) var modelReady = false
    /// Последнее событие хоткея — показывается в настройках для самопроверки.
    @Published private(set) var lastHotkeyEvent = "событий пока не было"

    let settings = AppSettings.shared
    let permissions = PermissionsManager.shared
    let models = ModelManager.shared

    private let hotkey = HotkeyManager()
    private let recorder = AudioRecorder()
    private let transcriber = Transcriber()
    private let injector = TextInjector()
    private let overlay = OverlayController()

    private var levelTimer: Timer?
    private var recordingStartedAt: Date?
    private var cancellables = Set<AnyCancellable>()

    /// Минимальная длительность записи; более короткие нажатия считаем случайными.
    private let minimumRecordingDuration: TimeInterval = 0.25
    /// Предохранитель от бесконечной записи в toggle-режиме.
    private let maximumRecordingDuration: TimeInterval = 5 * 60

    // MARK: - Запуск

    func start() {
        hotkey.activeKey = settings.hotkeyKey
        hotkey.onPress = { [weak self] in self?.handleHotkeyPress() }
        hotkey.onRelease = { [weak self] in self?.handleHotkeyRelease() }
        hotkey.onCancelledByCombo = { [weak self] in self?.cancelRecording() }
        hotkey.onDiagnostic = { [weak self] message in self?.lastHotkeyEvent = message }
        hotkey.shouldSwallowKeyDown = { [weak self] in
            self?.recorder.isRecording ?? false
        }

        // При смене модели в настройках перезагружаем её в фоне.
        settings.$model
            .removeDuplicates()
            .dropFirst()
            .sink { newModel in
                Task { @MainActor [weak self] in self?.loadModel(newModel) }
            }
            .store(in: &cancellables)

        // Смена хоткея применяется мгновенно, без перезапуска tap.
        settings.$hotkeyKey
            .removeDuplicates()
            .dropFirst()
            .sink { newKey in
                Task { @MainActor [weak self] in
                    guard let self else { return }
                    self.cancelRecording()
                    self.hotkey.activeKey = newKey
                }
            }
            .store(in: &cancellables)

        Task {
            await permissions.requestAll()
            startHotkeyIfPossible()
            loadModel(settings.model)
        }
    }

    func startHotkeyIfPossible() {
        permissions.refresh()
        guard permissions.accessibilityGranted else { return }
        if !hotkey.isRunning {
            _ = hotkey.start()
        }
    }

    /// Загрузка модели: скачивание при необходимости, затем инициализация
    /// whisper-контекста один раз и прогрев холостым прогоном.
    private func loadModel(_ model: WhisperModel) {
        modelReady = false
        setState(.loadingModel)
        Task {
            do {
                let url = try await models.download(model)
                try await transcriber.loadModel(at: url.path, model: model)
                await transcriber.warmUp()
                modelReady = true
                setState(.idle)
            } catch {
                setState(.error(error.localizedDescription))
                setStateLater(.idle)
            }
        }
    }

    // MARK: - Hotkey

    private func handleHotkeyPress() {
        switch settings.hotkeyMode {
        case .hold:
            beginRecording()
        case .toggle:
            if recorder.isRecording {
                finishRecordingAndTranscribe()
            } else {
                beginRecording()
            }
        }
    }

    private func handleHotkeyRelease() {
        guard settings.hotkeyMode == .hold else { return }
        finishRecordingAndTranscribe()
    }

    // MARK: - Пайплайн

    /// Клавиша была частью комбо (Fn+F-клавиша, Fn+стрелка, ⌥+буква и т.п.) —
    /// прерываем запись без распознавания и без вставки текста.
    private func cancelRecording() {
        guard recorder.isRecording else { return }
        levelTimer?.invalidate()
        levelTimer = nil
        _ = recorder.stop()
        recordingStartedAt = nil
        setState(.idle)
    }

    private func beginRecording() {
        guard !recorder.isRecording else { return }
        guard state != .transcribing else { return }

        permissions.refresh()
        guard permissions.microphoneGranted else {
            setState(.error("Нет доступа к микрофону"))
            setStateLater(.idle)
            return
        }
        guard modelReady else {
            setState(.error("Модель ещё загружается"))
            setStateLater(.idle)
            return
        }

        do {
            try recorder.start()
        } catch {
            setState(.error(error.localizedDescription))
            setStateLater(.idle)
            return
        }

        recordingStartedAt = Date()
        setState(.recording)

        levelTimer = Timer.scheduledTimer(withTimeInterval: 0.08, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self else { return }
                self.overlay.update(level: self.recorder.currentLevel)
                if let started = self.recordingStartedAt,
                   Date().timeIntervalSince(started) > self.maximumRecordingDuration {
                    self.finishRecordingAndTranscribe()
                }
            }
        }
    }

    private func finishRecordingAndTranscribe() {
        guard recorder.isRecording else { return }
        levelTimer?.invalidate()
        levelTimer = nil

        let pcm = recorder.stop()
        let duration = recordingStartedAt.map { Date().timeIntervalSince($0) } ?? 0
        recordingStartedAt = nil

        // Случайное короткое касание клавиши — молча игнорируем.
        guard duration >= minimumRecordingDuration, !pcm.isEmpty else {
            setState(.idle)
            return
        }

        // Тишина: на пустом входе whisper склонен «галлюцинировать» фразы
        // вроде «Продолжение следует…». Не запускаем распознавание вовсе.
        guard Self.containsSpeech(pcm) else {
            setState(.idle)
            return
        }

        setState(.transcribing)
        let language = settings.language.whisperCode
        let cleanupEnabled = settings.cleanupEnabled
        let cleanupModel = settings.cleanupModel
        let injectionMode = settings.injectionMode

        Task {
            do {
                var text = try await transcriber.transcribe(pcm: pcm, language: language)
                text = Self.stripArtifacts(text)
                if text.isEmpty {
                    setState(.idle)
                    return
                }
                if cleanupEnabled {
                    text = await TextCleanup.clean(text, model: cleanupModel)
                }
                injector.inject(text, mode: injectionMode)
                setState(.idle)
            } catch {
                setState(.error(error.localizedDescription))
                setStateLater(.idle)
            }
        }
    }

    /// Есть ли в записи речь. Считаем RMS всего фрагмента и долю «громких»
    /// отсчётов: у настоящей речи RMS заметно выше фонового шума микрофона.
    private static func containsSpeech(_ pcm: [Float]) -> Bool {
        guard !pcm.isEmpty else { return false }
        var sumSquares: Double = 0
        var loudSamples = 0
        for sample in pcm {
            let magnitude = abs(sample)
            sumSquares += Double(sample) * Double(sample)
            if magnitude > 0.02 { loudSamples += 1 }
        }
        let rms = (sumSquares / Double(pcm.count)).squareRoot()
        let loudRatio = Double(loudSamples) / Double(pcm.count)
        return rms > 0.006 && loudRatio > 0.01
    }

    /// Частые «галлюцинации» whisper на тишине/шуме — вставлять их нельзя.
    private static let hallucinations: Set<String> = [
        "продолжение следует...", "продолжение следует…", "продолжение следует",
        "спасибо за просмотр!", "спасибо за просмотр", "субтитры делал dimatorzok",
        "субтитры создавал dimatorzok", "редактор субтитров а.синецкая",
        "thank you.", "thanks for watching!", "thanks for watching",
        "you", "bye.", "bye", ".", "..", "...",
    ]

    /// Убирает служебные метки whisper вида [MUSIC], (шум) и отсекает
    /// известные галлюцинации на пустой записи.
    private static func stripArtifacts(_ text: String) -> String {
        var t = text
        for pattern in [#"\[[^\]]*\]"#, #"\([^)]*\)"#, #"♪"#] {
            t = t.replacingOccurrences(of: pattern, with: "", options: .regularExpression)
        }
        t = t.trimmingCharacters(in: .whitespacesAndNewlines)
        if hallucinations.contains(t.lowercased()) { return "" }
        return t
    }

    // MARK: - Состояние

    private func setState(_ new: PipelineState) {
        state = new
        overlay.update(state: new)
    }

    private func setStateLater(_ new: PipelineState, after seconds: TimeInterval = 2.5) {
        DispatchQueue.main.asyncAfter(deadline: .now() + seconds) { [weak self] in
            guard let self else { return }
            if case .error = self.state {
                self.setState(new)
            }
        }
    }
}
