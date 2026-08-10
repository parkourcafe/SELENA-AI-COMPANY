/**
 * YouTube Data API v3 provider.
 *
 * Uses `fetch` rather than the official client library: three endpoints, no
 * auth flow beyond an API key, and the repo's stated preference for few
 * dependencies. Requests are batched at 50 ids (the API's own maximum) so
 * monitoring N videos costs ceil(N/50) calls rather than N (spec §50).
 *
 * `YOUTUBE_API_KEY` is read server-side only and never reaches the client.
 */

import { sanitizeShortText } from "@/lib/diagnostics/validators";
import { radarConfig } from "../config";
import { classifyVideoType, parseIsoDurationSeconds } from "../videoType";
import {
  ProviderError,
  type ChannelUploadsOptions,
  type ProviderChannel,
  type ProviderVideo,
  type SearchOptions,
  type VideoProvider,
} from "./types";

const API_BASE = "https://www.googleapis.com/youtube/v3";
const MAX_TITLE = 300;
const MAX_DESCRIPTION = 5_000;

interface YouTubeListResponse<T> {
  items?: T[];
  error?: { code?: number; message?: string; errors?: { reason?: string }[] };
}

/**
 * A daily quota limit is not a rate limit.
 *
 * YouTube reports an exhausted per-day metric as HTTP 429 with reason
 * `rateLimitExceeded` — indistinguishable, by status code alone, from "you are
 * going too fast". Retrying a per-day limit cannot succeed: it costs three
 * requests per call, three times the wall clock, and buys nothing. The
 * distinguishing signal is in the message, so that is what we read.
 */
function isDailyQuotaMessage(message: string): boolean {
  const lowered = message.toLowerCase();
  return lowered.includes("per day") || lowered.includes("daily limit");
}

export function toProviderError(status: number, body: YouTubeListResponse<unknown>): ProviderError {
  const reason = body.error?.errors?.[0]?.reason ?? "";
  const message = body.error?.message ?? `YouTube API returned ${status}`;

  if (reason === "quotaExceeded" || reason === "dailyLimitExceeded" || isDailyQuotaMessage(message)) {
    return new ProviderError("PROVIDER_QUOTA_EXCEEDED", message, false);
  }
  if (status === 401 || status === 403) {
    // 403 is overloaded on this API: quota reasons are handled above, so what
    // is left is genuinely an auth/permission problem and must not be retried.
    return new ProviderError("PROVIDER_AUTH_FAILED", message, false);
  }
  if (status === 429) return new ProviderError("PROVIDER_RATE_LIMITED", message, true);
  return new ProviderError("PROVIDER_UNAVAILABLE", message, status >= 500);
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    out.push(items.slice(index, index + size));
  }
  return out;
}

function optionalCount(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/**
 * YouTube omits `likeCount`/`commentCount` entirely when a creator hides them.
 * `optionalCount` returns null in that case, and the pipeline keeps it null all
 * the way through — never coerced to 0 (spec §23).
 */
function toProviderVideo(item: {
  id?: string | { videoId?: string };
  snippet?: Record<string, unknown>;
  contentDetails?: Record<string, unknown>;
  statistics?: Record<string, unknown>;
}): ProviderVideo | null {
  const externalVideoId = typeof item.id === "string" ? item.id : item.id?.videoId;
  const snippet = item.snippet ?? {};
  const channelId = typeof snippet.channelId === "string" ? snippet.channelId : "";
  const publishedAt = typeof snippet.publishedAt === "string" ? snippet.publishedAt : "";

  if (!externalVideoId || !channelId || !publishedAt) return null;

  const durationSeconds = parseIsoDurationSeconds(item.contentDetails?.duration);
  const thumbnails = (snippet.thumbnails ?? {}) as Record<string, { url?: string } | undefined>;
  const thumbnailUrl =
    thumbnails.medium?.url ?? thumbnails.high?.url ?? thumbnails.default?.url ?? null;

  return {
    platform: "youtube",
    externalVideoId,
    channelId,
    channelName: sanitizeShortText(snippet.channelTitle, 200),
    // External text is untrusted (spec §53) — sanitized on the way in, so
    // nothing downstream has to remember to do it.
    title: sanitizeShortText(snippet.title, MAX_TITLE),
    description: sanitizeShortText(snippet.description, MAX_DESCRIPTION),
    sourceUrl: `https://www.youtube.com/watch?v=${externalVideoId}`,
    thumbnailUrl: typeof thumbnailUrl === "string" ? thumbnailUrl : null,
    publishedAt,
    durationSeconds,
    videoType: classifyVideoType(durationSeconds),
    language:
      typeof snippet.defaultAudioLanguage === "string"
        ? snippet.defaultAudioLanguage.slice(0, 2).toLowerCase()
        : typeof snippet.defaultLanguage === "string"
          ? snippet.defaultLanguage.slice(0, 2).toLowerCase()
          : null,
    views: optionalCount(item.statistics?.viewCount),
    likes: optionalCount(item.statistics?.likeCount),
    comments: optionalCount(item.statistics?.commentCount),
  };
}

export class YouTubeProvider implements VideoProvider {
  readonly platform = "youtube" as const;

  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async call<T>(path: string, params: Record<string, string>): Promise<T[]> {
    const url = new URL(`${API_BASE}/${path}`);
    url.searchParams.set("key", this.apiKey);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

    let lastError: ProviderError | null = null;
    const { maxProviderRetries, retryBaseDelayMs } = radarConfig.pipeline;

    for (let attempt = 0; attempt < maxProviderRetries; attempt += 1) {
      let response: Response;
      try {
        response = await this.fetchImpl(url, { headers: { accept: "application/json" } });
      } catch (cause) {
        lastError = new ProviderError(
          "PROVIDER_UNAVAILABLE",
          cause instanceof Error ? cause.message : "network failure",
          true,
        );
        await delay(retryBaseDelayMs * 2 ** attempt);
        continue;
      }

      const body = (await response.json().catch(() => ({}))) as YouTubeListResponse<T>;
      if (response.ok) return body.items ?? [];

      lastError = toProviderError(response.status, body);
      // Bounded retries for transient failures only; a permanent failure exits
      // immediately rather than burning the remaining attempts (spec §42).
      if (!lastError.retryable) throw lastError;
      await delay(retryBaseDelayMs * 2 ** attempt);
    }

    throw lastError ?? new ProviderError("PROVIDER_UNAVAILABLE", "YouTube API unavailable", true);
  }

  async search(options: SearchOptions): Promise<ProviderVideo[]> {
    const params: Record<string, string> = {
      part: "snippet",
      type: "video",
      order: "viewCount",
      q: options.query,
      maxResults: String(Math.min(50, Math.max(1, options.maxResults))),
    };
    if (options.publishedAfter) params.publishedAfter = options.publishedAfter;

    const items = await this.call<{ id?: { videoId?: string } }>("search", params);
    const ids = items.map((item) => item.id?.videoId).filter((id): id is string => Boolean(id));
    // `search` returns neither duration nor statistics, so it can only ever
    // yield ids — the hydrating videos.list call is what makes the record usable.
    return ids.length > 0 ? this.getVideos(ids) : [];
  }

  async channelUploads(options: ChannelUploadsOptions): Promise<ProviderVideo[]> {
    const channels = await this.getChannels([options.channelId]);
    const uploadsPlaylistId = channels[0]?.uploadsPlaylistId;
    if (!uploadsPlaylistId) return [];

    const items = await this.call<{ contentDetails?: { videoId?: string } }>("playlistItems", {
      part: "contentDetails",
      playlistId: uploadsPlaylistId,
      maxResults: String(Math.min(50, Math.max(1, options.maxResults))),
    });

    const ids = items
      .map((item) => item.contentDetails?.videoId)
      .filter((id): id is string => Boolean(id));
    if (ids.length === 0) return [];

    const videos = await this.getVideos(ids);
    if (!options.publishedAfter) return videos;
    const cutoff = new Date(options.publishedAfter).getTime();
    return videos.filter((video) => new Date(video.publishedAt).getTime() >= cutoff);
  }

  async getVideos(externalVideoIds: string[]): Promise<ProviderVideo[]> {
    const unique = [...new Set(externalVideoIds.filter(Boolean))];
    if (unique.length === 0) return [];

    const results: ProviderVideo[] = [];
    for (const batch of chunk(unique, radarConfig.pipeline.providerBatchSize)) {
      const items = await this.call<Parameters<typeof toProviderVideo>[0]>("videos", {
        part: "snippet,contentDetails,statistics",
        id: batch.join(","),
      });
      for (const item of items) {
        const video = toProviderVideo(item);
        if (video) results.push(video);
      }
    }
    return results;
  }

  async getChannels(externalChannelIds: string[]): Promise<ProviderChannel[]> {
    const unique = [...new Set(externalChannelIds.filter(Boolean))];
    if (unique.length === 0) return [];

    const results: ProviderChannel[] = [];
    for (const batch of chunk(unique, radarConfig.pipeline.providerBatchSize)) {
      const items = await this.call<{
        id?: string;
        snippet?: { title?: string };
        statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean };
        contentDetails?: { relatedPlaylists?: { uploads?: string } };
      }>("channels", { part: "snippet,statistics,contentDetails", id: batch.join(",") });

      for (const item of items) {
        if (!item.id) continue;
        results.push({
          platform: "youtube",
          externalChannelId: item.id,
          channelName: sanitizeShortText(item.snippet?.title, 200),
          subscriberCount: item.statistics?.hiddenSubscriberCount
            ? null
            : optionalCount(item.statistics?.subscriberCount),
          uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads ?? null,
        });
      }
    }
    return results;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * In-memory provider used by tests and by any environment without a
 * YOUTUBE_API_KEY. Tests must never consume production quota (spec §57), and a
 * missing key should give an honest empty Radar rather than a crash (spec §58).
 */
export class FixtureVideoProvider implements VideoProvider {
  readonly platform = "youtube" as const;
  readonly calls: { method: string; detail: string }[] = [];

  constructor(
    private readonly videos: ProviderVideo[] = [],
    private readonly channels: ProviderChannel[] = [],
  ) {}

  async search(options: SearchOptions): Promise<ProviderVideo[]> {
    this.calls.push({ method: "search", detail: options.query });
    const needle = options.query.toLowerCase();
    // The discovery window is honoured here too: a fixture that quietly ignores
    // a parameter is a fixture that cannot catch a bug in it.
    const cutoff = options.publishedAfter ? new Date(options.publishedAfter).getTime() : null;
    return this.videos
      .filter(
        (video) =>
          video.title.toLowerCase().includes(needle) ||
          video.description.toLowerCase().includes(needle),
      )
      .filter((video) => cutoff === null || new Date(video.publishedAt).getTime() >= cutoff)
      .slice(0, options.maxResults);
  }

  async channelUploads(options: ChannelUploadsOptions): Promise<ProviderVideo[]> {
    this.calls.push({ method: "channelUploads", detail: options.channelId });
    return this.videos
      .filter((video) => video.channelId === options.channelId)
      .slice(0, options.maxResults);
  }

  async getVideos(externalVideoIds: string[]): Promise<ProviderVideo[]> {
    this.calls.push({ method: "getVideos", detail: externalVideoIds.join(",") });
    const wanted = new Set(externalVideoIds);
    return this.videos.filter((video) => wanted.has(video.externalVideoId));
  }

  async getChannels(externalChannelIds: string[]): Promise<ProviderChannel[]> {
    this.calls.push({ method: "getChannels", detail: externalChannelIds.join(",") });
    const wanted = new Set(externalChannelIds);
    return this.channels.filter((channel) => wanted.has(channel.externalChannelId));
  }
}
