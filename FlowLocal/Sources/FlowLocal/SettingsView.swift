import SwiftUI
import ServiceManagement

struct SettingsView: View {
    @ObservedObject var controller: DictationController
    @ObservedObject private var settings = AppSettings.shared
    @ObservedObject private var models = ModelManager.shared
    @ObservedObject private var permissions = PermissionsManager.shared

    var body: some View {
        Form {
            // MARK: Распознавание
            Section("Распознавание") {
                Picker("Модель Whisper", selection: $settings.model) {
                    ForEach(WhisperModel.allCases) { model in
                        Text(model.title).tag(model)
                    }
                }
                if let downloading = models.downloadingModel {
                    HStack {
                        ProgressView(value: models.downloadProgress ?? 0)
                        Text("Скачиваю \(downloading.fileName)…")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                } else if !models.isDownloaded(settings.model) {
                    Text("Модель будет скачана автоматически (\(settings.model.approximateSize)).")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Picker("Язык", selection: $settings.language) {
                    ForEach(RecognitionLanguage.allCases) { lang in
                        Text(lang.title).tag(lang)
                    }
                }
            }

            // MARK: Горячая клавиша
            Section("Горячая клавиша — правый ⌥ (Option)") {
                Picker("Режим", selection: $settings.hotkeyMode) {
                    ForEach(HotkeyMode.allCases) { mode in
                        Text(mode.title).tag(mode)
                    }
                }
                Picker("Вставка текста", selection: $settings.injectionMode) {
                    ForEach(InjectionMode.allCases) { mode in
                        Text(mode.title).tag(mode)
                    }
                }
            }

            // MARK: AI-очистка
            Section("AI-очистка текста (локально, через Ollama)") {
                Toggle("Убирать слова-паразиты и расставлять пунктуацию", isOn: $settings.cleanupEnabled)
                if settings.cleanupEnabled {
                    TextField("Модель Ollama", text: $settings.cleanupModel)
                        .textFieldStyle(.roundedBorder)
                    Text("Требуется запущенный Ollama (ollama serve) и скачанная модель, например: ollama pull \(settings.cleanupModel). Работает полностью локально; при недоступности Ollama текст вставляется без очистки.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            // MARK: Система
            Section("Система") {
                Toggle("Запускать при входе в систему", isOn: $settings.launchAtLogin)
                    .onChange(of: settings.launchAtLogin) { _, enabled in
                        updateLaunchAtLogin(enabled)
                    }
                Text("Автозапуск работает только для собранного FlowLocal.app (не для swift run).")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            // MARK: Разрешения
            Section("Разрешения macOS") {
                permissionRow("Микрофон", granted: permissions.microphoneGranted) {
                    permissions.openMicrophoneSettings()
                }
                permissionRow("Универсальный доступ (Accessibility)", granted: permissions.accessibilityGranted) {
                    permissions.openAccessibilitySettings()
                }
                permissionRow("Мониторинг ввода (Input Monitoring)", granted: permissions.inputMonitoringGranted) {
                    permissions.openInputMonitoringSettings()
                }
                Button("Обновить статус разрешений") {
                    permissions.refresh()
                    controller.startHotkeyIfPossible()
                }
            }

            Section {
                Text("Приватность: аудио и текст не сохраняются на диск и никуда не отправляются. Сеть используется только для разового скачивания модели и, если включено, для запросов к локальному Ollama (127.0.0.1).")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .formStyle(.grouped)
        .frame(width: 480)
        .onAppear { permissions.refresh() }
    }

    @ViewBuilder
    private func permissionRow(_ title: String, granted: Bool, open: @escaping () -> Void) -> some View {
        HStack {
            Image(systemName: granted ? "checkmark.circle.fill" : "xmark.circle.fill")
                .foregroundStyle(granted ? .green : .red)
            Text(title)
            Spacer()
            if !granted {
                Button("Открыть настройки") { open() }
            }
        }
    }

    private func updateLaunchAtLogin(_ enabled: Bool) {
        do {
            if enabled {
                try SMAppService.mainApp.register()
            } else {
                try SMAppService.mainApp.unregister()
            }
        } catch {
            // Вне бандла (swift run) SMAppService недоступен — тихо откатываем.
            settings.launchAtLogin = false
        }
    }
}
