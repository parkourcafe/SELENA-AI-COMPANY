/**
 * Transcript layer (spec §29, §30).
 *
 * Kept deliberately thin. The spec is explicit that transcript retrieval must
 * not become the product's reliability bottleneck: one configured method, no
 * elaborate fallback chain, and every failure is a structured state rather than
 * an exception that takes the batch down with it. When a transcript cannot be
 * obtained the Radar keeps working at metadata level and marks deep analysis
 * unavailable.
 *
 * KNOWN LIMITATION: the YouTube Data API's `captions.download` requires OAuth
 * as the video *owner*, so it cannot read third-party transcripts. This
 * implementation reads the public timedtext endpoint instead, which is
 * best-effort: many videos have no published track and will legitimately return
 * `unavailable`. That is the honest outcome, not a bug to paper over. Swapping
 * in a contracted transcription provider means implementing this one interface.
 */

import { sanitizeShortText } from "@/lib/diagnostics/validators";
import type { TranscriptProvider, TranscriptResult } from "./types";

const TIMEDTEXT_ENDPOINT = "https://video.google.com/timedtext";
const MAX_TRANSCRIPT_CHARS = 40_000;
const FETCH_TIMEOUT_MS = 10_000;

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}

export function parseTimedTextXml(xml: string): string | null {
  const segments = [...xml.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map((match) =>
    decodeXmlEntities(match[1]).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  );
  const text = segments.filter(Boolean).join(" ").trim();
  return text.length > 0 ? text.slice(0, MAX_TRANSCRIPT_CHARS) : null;
}

export class TimedTextTranscriptProvider implements TranscriptProvider {
  readonly name = "youtube-timedtext";

  constructor(
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly defaultLanguages: string[] = ["en"],
  ) {}

  async fetch(video: { externalVideoId: string; language: string | null }): Promise<TranscriptResult> {
    const languages = [video.language, ...this.defaultLanguages].filter(
      (language): language is string => Boolean(language),
    );
    const tried = [...new Set(languages)];

    for (const language of tried) {
      const url = new URL(TIMEDTEXT_ENDPOINT);
      url.searchParams.set("v", video.externalVideoId);
      url.searchParams.set("lang", language);

      let response: Response;
      try {
        response = await this.fetchImpl(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      } catch (cause) {
        return {
          status: "failed",
          text: null,
          language: null,
          provider: this.name,
          failureReason: cause instanceof Error ? cause.message.slice(0, 200) : "network failure",
        };
      }

      if (response.status === 403 || response.status === 401) {
        return {
          status: "blocked",
          text: null,
          language: null,
          provider: this.name,
          failureReason: `HTTP ${response.status}`,
        };
      }
      if (!response.ok) continue;

      const text = parseTimedTextXml(await response.text());
      if (text) {
        return {
          status: "available",
          // Transcripts are untrusted external text and go straight into an AI
          // prompt, so control characters are stripped before they are stored.
          text: sanitizeShortText(text, MAX_TRANSCRIPT_CHARS),
          language,
          provider: this.name,
          failureReason: null,
        };
      }
    }

    return {
      status: "unavailable",
      text: null,
      language: null,
      provider: this.name,
      failureReason: `No published caption track for: ${tried.join(", ")}`,
    };
  }
}

/** Used when transcripts are flagged off. Reports `unsupported` rather than pretending to try. */
export class DisabledTranscriptProvider implements TranscriptProvider {
  readonly name = "disabled";

  async fetch(): Promise<TranscriptResult> {
    return {
      status: "unsupported",
      text: null,
      language: null,
      provider: this.name,
      failureReason: "Transcript retrieval is disabled (VIDEO_RADAR_TRANSCRIPTS_ENABLED)",
    };
  }
}

export class FixtureTranscriptProvider implements TranscriptProvider {
  readonly name = "fixture";

  constructor(private readonly byVideoId: Record<string, TranscriptResult> = {}) {}

  async fetch(video: { externalVideoId: string }): Promise<TranscriptResult> {
    return (
      this.byVideoId[video.externalVideoId] ?? {
        status: "unavailable",
        text: null,
        language: null,
        provider: this.name,
        failureReason: "No fixture transcript",
      }
    );
  }
}
