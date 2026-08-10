/**
 * Provider boundary (spec §9: "A small provider boundary is enough").
 *
 * Deliberately NOT a generic social-platform framework. These are the four
 * operations the Radar pipeline actually performs, expressed so that a v2
 * platform is a new implementation rather than a rewrite — and so that tests
 * never touch a live API (spec §57).
 */

import type { RadarPlatform, VideoType } from "../contracts";

/** Raw, normalized video metadata as returned by a platform. */
export interface ProviderVideo {
  platform: RadarPlatform;
  externalVideoId: string;
  channelId: string;
  channelName: string;
  title: string;
  description: string;
  sourceUrl: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  durationSeconds: number | null;
  videoType: VideoType;
  language: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
}

export interface ProviderChannel {
  platform: RadarPlatform;
  externalChannelId: string;
  channelName: string;
  subscriberCount: number | null;
  uploadsPlaylistId: string | null;
}

export interface SearchOptions {
  query: string;
  maxResults: number;
  publishedAfter?: string;
  languages?: string[];
}

export interface ChannelUploadsOptions {
  channelId: string;
  maxResults: number;
  publishedAfter?: string;
}

export class ProviderError extends Error {
  constructor(
    readonly code:
      | "PROVIDER_UNAVAILABLE"
      | "PROVIDER_RATE_LIMITED"
      | "PROVIDER_AUTH_FAILED"
      | "PROVIDER_QUOTA_EXCEEDED",
    message: string,
    /** Permanent failures must not be retried — retrying an auth failure is a retry storm (spec §42). */
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export interface VideoProvider {
  readonly platform: RadarPlatform;
  /** Topic discovery: find videos the system does not already know about. */
  search(options: SearchOptions): Promise<ProviderVideo[]>;
  /** Watchlist discovery: recent uploads from a monitored creator. */
  channelUploads(options: ChannelUploadsOptions): Promise<ProviderVideo[]>;
  /** Monitoring: refresh metrics for known videos. Batched by the implementation. */
  getVideos(externalVideoIds: string[]): Promise<ProviderVideo[]>;
  getChannels(externalChannelIds: string[]): Promise<ProviderChannel[]>;
}

export type TranscriptResultStatus =
  | "available"
  | "unavailable"
  | "blocked"
  | "failed"
  | "unsupported";

export interface TranscriptResult {
  status: TranscriptResultStatus;
  text: string | null;
  language: string | null;
  provider: string;
  failureReason: string | null;
}

export interface TranscriptProvider {
  readonly name: string;
  fetch(video: { externalVideoId: string; language: string | null }): Promise<TranscriptResult>;
}
