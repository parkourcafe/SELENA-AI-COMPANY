import Foundation
import AVFoundation

/// Захват микрофона и ресемплинг в 16 kHz mono Float32 — ровно тот формат,
/// который требует Whisper. Реальный формат микрофона (обычно 48 kHz, 1–2
/// канала) конвертируется потоково через AVAudioConverter.
///
/// Аудио живёт только в памяти и нигде не сохраняется.
final class AudioRecorder {
    static let targetSampleRate: Double = 16_000

    private let engine = AVAudioEngine()
    private var converter: AVAudioConverter?
    private var samples: [Float] = []
    private let lock = NSLock()
    private(set) var isRecording = false

    /// Пиковый уровень последнего буфера — для индикатора «слушаю».
    private(set) var currentLevel: Float = 0

    func start() throws {
        guard !isRecording else { return }
        lock.lock(); samples.removeAll(keepingCapacity: true); lock.unlock()

        let input = engine.inputNode
        let inputFormat = input.inputFormat(forBus: 0)
        guard inputFormat.sampleRate > 0, inputFormat.channelCount > 0 else {
            throw FlowLocalError.audioEngineFailed("Микрофон недоступен")
        }
        guard let outputFormat = AVAudioFormat(
            commonFormat: .pcmFormatFloat32,
            sampleRate: Self.targetSampleRate,
            channels: 1,
            interleaved: false
        ), let converter = AVAudioConverter(from: inputFormat, to: outputFormat) else {
            throw FlowLocalError.audioEngineFailed("Не удалось создать конвертер 16 kHz")
        }
        self.converter = converter

        input.installTap(onBus: 0, bufferSize: 4096, format: inputFormat) { [weak self] buffer, _ in
            self?.process(buffer: buffer, outputFormat: outputFormat)
        }

        engine.prepare()
        do {
            try engine.start()
        } catch {
            input.removeTap(onBus: 0)
            throw FlowLocalError.audioEngineFailed(error.localizedDescription)
        }
        isRecording = true
    }

    /// Останавливает запись и возвращает накопленный PCM (16 kHz mono).
    @discardableResult
    func stop() -> [Float] {
        guard isRecording else { return [] }
        engine.inputNode.removeTap(onBus: 0)
        engine.stop()
        isRecording = false
        converter = nil
        currentLevel = 0
        lock.lock(); defer { lock.unlock() }
        let result = samples
        samples.removeAll(keepingCapacity: false)
        return result
    }

    private func process(buffer: AVAudioPCMBuffer, outputFormat: AVAudioFormat) {
        guard let converter else { return }

        let ratio = outputFormat.sampleRate / buffer.format.sampleRate
        let capacity = AVAudioFrameCount(Double(buffer.frameLength) * ratio) + 64
        guard let outBuffer = AVAudioPCMBuffer(pcmFormat: outputFormat, frameCapacity: capacity) else { return }

        var consumed = false
        var error: NSError?
        let status = converter.convert(to: outBuffer, error: &error) { _, outStatus in
            if consumed {
                outStatus.pointee = .noDataNow
                return nil
            }
            consumed = true
            outStatus.pointee = .haveData
            return buffer
        }
        guard status != .error, error == nil,
              let channel = outBuffer.floatChannelData?[0], outBuffer.frameLength > 0 else { return }

        let frames = Int(outBuffer.frameLength)
        var peak: Float = 0
        for i in 0..<frames { peak = max(peak, abs(channel[i])) }
        currentLevel = peak

        lock.lock()
        samples.append(contentsOf: UnsafeBufferPointer(start: channel, count: frames))
        lock.unlock()
    }
}
