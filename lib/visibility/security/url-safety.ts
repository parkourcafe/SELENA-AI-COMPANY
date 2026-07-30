import { promises as dns } from "node:dns";
import http from "node:http";
import https from "node:https";
import type { LookupAddress } from "node:dns";
import { isPubliclyRoutableIp, isBlockedHostname } from "./ipClassification";

/**
 * SSRF-safe fetch (SSOT §14.1). Every hop — the initial URL and every
 * redirect — is independently parsed, DNS-resolved, and validated before
 * a socket is opened, and the resolved IP is pinned for the actual
 * connection so a second DNS answer (rebinding) can never substitute a
 * private address after validation passed (Decision Log D-005 gate:
 * "SSRF-safe fetch не доказан тестами" blocks the live crawler flag —
 * see tests/unit/urlSafety.test.ts for the corresponding suite).
 */

export type UrlSafetyError =
  | "INVALID_URL"
  | "BLOCKED_HOST"
  | "DNS_REBINDING_BLOCKED"
  | "REDIRECT_BLOCKED"
  | "UNSUPPORTED_CONTENT_TYPE"
  | "FETCH_TIMEOUT"
  | "FETCH_TOO_LARGE";

export type SafeFetchResult =
  | {
      ok: true;
      finalUrl: string;
      statusCode: number;
      headers: Record<string, string>;
      body: string;
      bytesRead: number;
    }
  | { ok: false; error: UrlSafetyError; detail?: string };

export interface SafeFetchOptions {
  maxRedirects?: number;
  maxBytes?: number;
  timeoutMs?: number;
  allowedContentTypes?: RegExp[];
  userAgent?: string;
  /**
   * Test-only escape hatch: skips the private/loopback/metadata-IP block
   * so tests/unit/urlSafety.test.ts can point safeFetch at a local
   * `http.createServer` instance to exercise redirect-following,
   * content-type rejection and max-bytes enforcement without real
   * network access. No production code path ever sets this — it is not
   * derived from request input, an env var, or anything reachable from
   * an HTTP request, only a literal `true` a test passes directly.
   */
  unsafeAllowPrivateHostsForTesting?: boolean;
}

const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_MAX_BYTES = 2_000_000; // SSOT §14.2: "max 2 MB per HTML page"
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_ALLOWED_CONTENT_TYPES = [
  /^text\/html/i,
  /^application\/xhtml\+xml/i,
  /^text\/plain/i,
  /^application\/xml/i,
  /^text\/xml/i,
];
const DEFAULT_USER_AGENT = "SelenaVisibilityBot/1.0 (+https://www.selenasystems.com/methodology)";
const ALLOWED_PORTS = new Set(["", "80", "443"]);

function parseCandidateUrl(
  input: string,
  allowPrivateHosts: boolean,
): { ok: true; url: URL } | { ok: false; error: UrlSafetyError } {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, error: "INVALID_URL" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "INVALID_URL" };
  }
  if (url.username || url.password) {
    return { ok: false, error: "INVALID_URL" };
  }
  if (!allowPrivateHosts && !ALLOWED_PORTS.has(url.port)) {
    return { ok: false, error: "BLOCKED_HOST" };
  }
  if (!url.hostname) {
    return { ok: false, error: "INVALID_URL" };
  }

  return { ok: true, url };
}

async function resolveAllAddresses(hostname: string): Promise<LookupAddress[] | null> {
  try {
    const addresses = await dns.lookup(hostname, { all: true, verbatim: true });
    return addresses.length > 0 ? addresses : null;
  } catch {
    return null;
  }
}

/**
 * Validate a hostname and return the single IP to pin the connection to.
 * Every resolved address must be publicly routable — if DNS returns a mix
 * of a public and a private address, this fails closed rather than
 * gambling on which one the socket layer would actually pick.
 */
async function validateAndPinHost(
  hostname: string,
  allowPrivateHosts: boolean,
): Promise<{ ok: true; address: string; family: 4 | 6 } | { ok: false; error: UrlSafetyError }> {
  if (!allowPrivateHosts && isBlockedHostname(hostname)) {
    return { ok: false, error: "BLOCKED_HOST" };
  }

  const addresses = await resolveAllAddresses(hostname);
  if (!addresses) {
    return { ok: false, error: "BLOCKED_HOST" };
  }

  if (allowPrivateHosts) {
    const chosen = addresses[0];
    return { ok: true, address: chosen.address, family: chosen.family === 6 ? 6 : 4 };
  }

  for (const addr of addresses) {
    const family = addr.family === 6 ? 6 : 4;
    if (!isPubliclyRoutableIp(addr.address, family)) {
      return { ok: false, error: "BLOCKED_HOST" };
    }
  }

  const chosen = addresses[0];
  return { ok: true, address: chosen.address, family: chosen.family === 6 ? 6 : 4 };
}

function collectBody(
  response: http.IncomingMessage,
  maxBytes: number,
): Promise<{ ok: true; body: string; bytesRead: number } | { ok: false; error: "FETCH_TOO_LARGE" }> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let total = 0;
    let settled = false;

    response.on("data", (chunk: Buffer) => {
      if (settled) return;
      total += chunk.length;
      if (total > maxBytes) {
        settled = true;
        response.destroy();
        resolve({ ok: false, error: "FETCH_TOO_LARGE" });
        return;
      }
      chunks.push(chunk);
    });

    response.on("end", () => {
      if (settled) return;
      settled = true;
      resolve({ ok: true, body: Buffer.concat(chunks).toString("utf8"), bytesRead: total });
    });

    response.on("error", () => {
      if (settled) return;
      settled = true;
      resolve({ ok: true, body: Buffer.concat(chunks).toString("utf8"), bytesRead: total });
    });
  });
}

function performRequest(
  url: URL,
  pinnedAddress: string,
  options: Required<Pick<SafeFetchOptions, "timeoutMs" | "userAgent">>,
): Promise<{ ok: true; response: http.IncomingMessage } | { ok: false; error: UrlSafetyError }> {
  return new Promise((resolve) => {
    const transport = url.protocol === "https:" ? https : http;
    const request = transport.request(
      {
        // Connect to the pinned, already-validated IP — never re-resolve
        // the hostname at socket-open time (that would reopen the
        // DNS-rebinding window between validation and connection).
        host: pinnedAddress,
        servername: url.protocol === "https:" ? url.hostname : undefined,
        headers: { Host: url.hostname, "User-Agent": options.userAgent, Accept: "text/html,application/xhtml+xml" },
        path: `${url.pathname}${url.search}`,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        timeout: options.timeoutMs,
        // This library never follows redirects itself — the caller
        // re-validates and re-pins every hop explicitly.
      },
      (response) => {
        resolve({ ok: true, response });
      },
    );

    request.on("timeout", () => {
      request.destroy();
      resolve({ ok: false, error: "FETCH_TIMEOUT" });
    });
    request.on("error", () => {
      resolve({ ok: false, error: "BLOCKED_HOST" });
    });
    request.end();
  });
}

export async function safeFetch(inputUrl: string, options: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const allowedContentTypes = options.allowedContentTypes ?? DEFAULT_ALLOWED_CONTENT_TYPES;
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;

  let currentUrl = inputUrl;

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const parsed = parseCandidateUrl(currentUrl, options.unsafeAllowPrivateHostsForTesting ?? false);
    if (!parsed.ok) return { ok: false, error: parsed.error };

    const hostCheck = await validateAndPinHost(
      parsed.url.hostname,
      options.unsafeAllowPrivateHostsForTesting ?? false,
    );
    if (!hostCheck.ok) return { ok: false, error: hostCheck.error };

    const requestResult = await performRequest(parsed.url, hostCheck.address, { timeoutMs, userAgent });
    if (!requestResult.ok) return { ok: false, error: requestResult.error };

    const { response } = requestResult;
    const statusCode = response.statusCode ?? 0;

    if (statusCode >= 300 && statusCode < 400 && response.headers.location) {
      response.resume(); // drain, we're not using this body
      if (hop === maxRedirects) {
        return { ok: false, error: "REDIRECT_BLOCKED", detail: "Too many redirects" };
      }
      try {
        currentUrl = new URL(response.headers.location, parsed.url).toString();
      } catch {
        return { ok: false, error: "INVALID_URL" };
      }
      continue; // re-validate and re-pin the redirect target from scratch
    }

    const contentType = response.headers["content-type"] ?? "";
    if (contentType && !allowedContentTypes.some((pattern) => pattern.test(contentType))) {
      response.resume();
      return { ok: false, error: "UNSUPPORTED_CONTENT_TYPE" };
    }

    const bodyResult = await collectBody(response, maxBytes);
    if (!bodyResult.ok) return { ok: false, error: bodyResult.error };

    return {
      ok: true,
      finalUrl: parsed.url.toString(),
      statusCode,
      headers: Object.fromEntries(
        Object.entries(response.headers).map(([key, value]) => [key, Array.isArray(value) ? value.join(", ") : (value ?? "")]),
      ),
      body: bodyResult.body,
      bytesRead: bodyResult.bytesRead,
    };
  }

  return { ok: false, error: "REDIRECT_BLOCKED", detail: "Too many redirects" };
}
