import Foundation

/// Опциональная AI-очистка текста через ЛОКАЛЬНЫЙ Ollama (http://127.0.0.1:11434).
///
/// По умолчанию выключена, чтобы не добавлять задержку. Когда включена —
/// убирает слова-паразиты, расставляет пунктуацию, приводит текст в порядок.
/// Обращение идёт только на localhost; при любой ошибке (Ollama не запущен,
/// модель не скачана, таймаут) возвращается исходный текст без изменений.
struct TextCleanup {
    private static let endpoint = URL(string: "http://127.0.0.1:11434/api/generate")!

    static func clean(_ text: String, model: String) async -> String {
        guard !text.isEmpty else { return text }

        let prompt = """
        Ты — редактор диктовки. Приведи текст в аккуратный вид: расставь \
        пунктуацию и заглавные буквы, убери слова-паразиты («э-э», «ну», \
        «как бы», «типа», «uh», «um») и оговорки-повторы. НЕ меняй смысл, \
        НЕ добавляй ничего от себя, НЕ переводи на другой язык. \
        Ответь ТОЛЬКО исправленным текстом, без пояснений.

        Текст: \(text)
        """

        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 20

        let body: [String: Any] = [
            "model": model,
            "prompt": prompt,
            "stream": false,
            "options": ["temperature": 0.1],
        ]
        guard let data = try? JSONSerialization.data(withJSONObject: body) else { return text }
        request.httpBody = data

        do {
            let (responseData, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200,
                  let json = try JSONSerialization.jsonObject(with: responseData) as? [String: Any],
                  let cleaned = (json["response"] as? String)?
                      .trimmingCharacters(in: .whitespacesAndNewlines),
                  !cleaned.isEmpty else {
                return text
            }
            return cleaned
        } catch {
            return text // Ollama недоступен — молча отдаём оригинал
        }
    }
}
