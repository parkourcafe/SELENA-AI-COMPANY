import Foundation
import whisper

/// Обёртка над whisper.cpp.
///
/// Почему прямой C-bridge, а не SwiftWhisper: SwiftWhisper давно не обновлялся,
/// привязан к старой версии whisper.cpp без Metal-ускорения и не поддерживает
/// large-v3-turbo. Прямая линковка со свежим whisper.cpp даёт Metal, актуальные
/// модели и контроль над параметрами.
///
/// Actor: whisper_context не потокобезопасен, все вызовы сериализуются здесь.
/// Модель грузится один раз и держится в памяти «прогретой».
actor Transcriber {
    private var ctx: OpaquePointer?
    private(set) var loadedModel: WhisperModel?

    var isReady: Bool { ctx != nil }

    /// Загружает модель (один раз). Повторный вызов с той же моделью — no-op.
    func loadModel(at path: String, model: WhisperModel) throws {
        if loadedModel == model, ctx != nil { return }
        unload()

        var params = whisper_context_default_params()
        params.use_gpu = true      // Metal на Apple Silicon
        params.flash_attn = true

        guard let newCtx = whisper_init_from_file_with_params(path, params) else {
            throw FlowLocalError.whisperInitFailed
        }
        ctx = newCtx
        loadedModel = model
    }

    func unload() {
        if let ctx { whisper_free(ctx) }
        ctx = nil
        loadedModel = nil
    }

    /// Холостой прогон на секунде тишины: первый вызов whisper_full компилирует
    /// Metal-пайплайны и прогревает кеши — без этого первая реальная диктовка
    /// была бы заметно медленнее.
    func warmUp() {
        guard ctx != nil else { return }
        let silence = [Float](repeating: 0, count: 16_000)
        _ = try? transcribe(pcm: silence, language: "en")
    }

    /// pcm: 16 kHz mono Float32 в диапазоне [-1, 1].
    /// language: код языка whisper ("ru", "en") или nil для автоопределения.
    func transcribe(pcm: [Float], language: String?) throws -> String {
        guard let ctx else { throw FlowLocalError.modelNotLoaded }
        // Whisper нестабилен на сверхкоротких отрывках — дополняем до 1 с.
        var samples = pcm
        if samples.count < 16_000 {
            samples.append(contentsOf: [Float](repeating: 0, count: 16_000 - samples.count))
        }

        var params = whisper_full_default_params(WHISPER_SAMPLING_GREEDY)
        params.print_progress = false
        params.print_realtime = false
        params.print_special = false
        params.print_timestamps = false
        params.translate = false
        params.no_context = true
        params.suppress_blank = true
        params.single_segment = false
        params.n_threads = Int32(max(2, min(8, ProcessInfo.processInfo.activeProcessorCount - 2)))

        // Строка языка должна жить, пока идёт whisper_full.
        let langCString: UnsafeMutablePointer<CChar>? = language.flatMap { strdup($0) }
        defer { free(langCString) }
        params.language = langCString.map { UnsafePointer($0) }
        params.detect_language = false

        let status = samples.withUnsafeBufferPointer { buf in
            whisper_full(ctx, params, buf.baseAddress, Int32(buf.count))
        }
        guard status == 0 else { throw FlowLocalError.whisperInitFailed }

        var result = ""
        let n = whisper_full_n_segments(ctx)
        for i in 0..<n {
            if let cText = whisper_full_get_segment_text(ctx, i) {
                result += String(cString: cText)
            }
        }
        return result.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
