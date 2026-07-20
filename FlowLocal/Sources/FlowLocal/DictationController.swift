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
        hotkey.onPress = { [weak self] in self?.handleHotkeyPress() }
        hotkey.onRelease = { [weak self] in self?.handleHotkeyRelease() }
        hotkey.shouldSwallowKeyDown = { [weak self] in
            self?.recorder.isRecording ?? false
        }

        // При смене модели в настройках перезагружаем её в фоне.
        settings.$model
            .removeDuplicates()
            .dropFirst()
            .sink { [weak self] newModel in
                self?.loadModel(newModel)
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

    /// Убирает служебные метки whisper вида [MUSIC], (шум) на пустой записи.
    private static func stripArtifacts(_ text: String) -> String {
        var t = text
        for pattern in [#"\[[^\]]*\]"#, #"\([^)]*\)"#] {
            t = t.replacingOccurrences(of: pattern, with: "", options: .regularExpression)
        }
        return t.trimmingCharacters(in: .whitespacesAndNewlines)
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
