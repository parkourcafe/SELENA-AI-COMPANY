import Foundation
import Combine

/// Доступные ggml-модели Whisper.
enum WhisperModel: String, CaseIterable, Identifiable {
    case small
    case medium
    case largeV3Turbo = "large-v3-turbo"

    var id: String { rawValue }

    var fileName: String { "ggml-\(rawValue).bin" }

    /// Официальные конвертированные веса из репозитория ggerganov/whisper.cpp.
    var downloadURL: URL {
        URL(string: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/\(fileName)")!
    }

    var approximateSize: String {
        switch self {
        case .small: return "~488 МБ"
        case .medium: return "~1.5 ГБ"
        case .largeV3Turbo: return "~1.6 ГБ"
        }
    }

    var title: String {
        switch self {
        case .small: return "small (\(approximateSize)) — быстрее, слабее на русском"
        case .medium: return "medium (\(approximateSize))"
        case .largeV3Turbo: return "large-v3-turbo (\(approximateSize)) — рекомендуется"
        }
    }
}

/// Скачивание и хранение моделей.
/// Модели лежат в ~/Library/Application Support/FlowLocal/models/.
/// Скачивание — единственное сетевое обращение приложения (кроме опционального
/// локального Ollama); после него всё работает офлайн.
@MainActor
final class ModelManager: ObservableObject {
    static let shared = ModelManager()

    @Published var downloadProgress: Double? // nil = не качаем
    @Published var downloadingModel: WhisperModel?
    @Published var lastError: String?

    let modelsDirectory: URL

    private init() {
        let appSupport = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        modelsDirectory = appSupport.appendingPathComponent("FlowLocal/models", isDirectory: true)
        try? FileManager.default.createDirectory(at: modelsDirectory, withIntermediateDirectories: true)
    }

    func localURL(for model: WhisperModel) -> URL {
        modelsDirectory.appendingPathComponent(model.fileName)
    }

    func isDownloaded(_ model: WhisperModel) -> Bool {
        FileManager.default.fileExists(atPath: localURL(for: model).path)
    }

    /// Скачивает модель с прогрессом. Возвращает локальный путь.
    func download(_ model: WhisperModel) async throws -> URL {
        let destination = localURL(for: model)
        if isDownloaded(model) { return destination }

        downloadingModel = model
        downloadProgress = 0
        lastError = nil
        defer {
            downloadingModel = nil
            downloadProgress = nil
        }

        let tmp = destination.appendingPathExtension("download")
        FileManager.default.createFile(atPath: tmp.path, contents: nil)
        let handle = try FileHandle(forWritingTo: tmp)
        defer { try? handle.close() }

        let (bytes, response) = try await URLSession.shared.bytes(from: model.downloadURL)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw FlowLocalError.modelDownloadFailed("HTTP-ошибка при скачивании модели")
        }
        let total = response.expectedContentLength

        var buffer = Data()
        buffer.reserveCapacity(1 << 20)
        var written: Int64 = 0
        for try await byte in bytes {
            buffer.append(byte)
            if buffer.count >= 1 << 20 {
                try handle.write(contentsOf: buffer)
                written += Int64(buffer.count)
                buffer.removeAll(keepingCapacity: true)
                if total > 0 { downloadProgress = Double(written) / Double(total) }
            }
        }
        if !buffer.isEmpty {
            try handle.write(contentsOf: buffer)
            written += Int64(buffer.count)
        }
        try handle.close()

        if total > 0 && written < total {
            try? FileManager.default.removeItem(at: tmp)
            throw FlowLocalError.modelDownloadFailed("Скачивание оборвалось, попробуйте ещё раз")
        }
        try? FileManager.default.removeItem(at: destination)
        try FileManager.default.moveItem(at: tmp, to: destination)
        return destination
    }
}

enum FlowLocalError: LocalizedError {
    case modelDownloadFailed(String)
    case modelNotLoaded
    case whisperInitFailed
    case audioEngineFailed(String)

    var errorDescription: String? {
        switch self {
        case .modelDownloadFailed(let s): return s
        case .modelNotLoaded: return "Модель ещё не загружена"
        case .whisperInitFailed: return "Не удалось инициализировать whisper.cpp"
        case .audioEngineFailed(let s): return "Ошибка аудио: \(s)"
        }
    }
}
