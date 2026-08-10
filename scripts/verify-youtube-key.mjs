#!/usr/bin/env node
/**
 * Verifies that YOUTUBE_API_KEY actually works against YouTube Data API v3,
 * before the Radar is pointed at it.
 *
 * The key is never printed. It is redacted from every line of output —
 * including error bodies, because the API echoes the request URL (key and all)
 * into some error payloads, and a verification script that leaks the secret
 * into a terminal scrollback or CI log would defeat its own purpose.
 *
 *   node --env-file=.env.local scripts/verify-youtube-key.mjs
 *
 * Exits 0 only when the key works for the calls the Radar actually makes.
 */

const KEY = process.env.YOUTUBE_API_KEY;
const API = "https://www.googleapis.com/youtube/v3";

/** Redact the key anywhere it might appear before anything reaches stdout. */
function safe(text) {
  const value = String(text ?? "");
  if (!KEY) return value;
  return value.split(KEY).join("***REDACTED***");
}

function say(line = "") {
  console.log(safe(line));
}

function fail(message, hints = []) {
  say(`\n  FAILED  ${message}`);
  for (const hint of hints) say(`          → ${hint}`);
  process.exit(1);
}

if (!KEY) {
  say("YOUTUBE_API_KEY is not set in this process.\n");
  say("Add it to .env.local (git-ignored, never committed), then re-run:");
  say("  node --env-file=.env.local scripts/verify-youtube-key.mjs");
  process.exit(1);
}

// Shape check only — a warning, never a block. Google has issued other formats,
// so refusing to try would be worse than trying and reporting the real error.
if (!/^AIza[0-9A-Za-z_-]{35}$/.test(KEY)) {
  say("  NOTE    The key does not match the usual Google API key shape (AIza… , 39 chars).");
  say("          Continuing anyway — the API's own answer is what counts.\n");
}

/**
 * Turns Google's error payloads into the actual cause. These four account for
 * almost every real failure, and the messages Google returns for them are not
 * self-explanatory — particularly the referrer one, which is what you get when
 * a key was created as a "browser key" and is then used server-side.
 */
function diagnose(status, body) {
  const error = body?.error ?? {};
  const reason = error.errors?.[0]?.reason ?? "";
  const message = error.message ?? `HTTP ${status}`;

  if (reason === "API_KEY_INVALID" || message.includes("API key not valid")) {
    return [message, ["The key is wrong or was deleted. Check it in Google Cloud Console → Credentials."]];
  }
  if (reason === "accessNotConfigured" || reason === "SERVICE_DISABLED") {
    return [
      message,
      [
        "YouTube Data API v3 is not enabled for this Google Cloud project.",
        "Enable it: Console → APIs & Services → Library → 'YouTube Data API v3' → Enable.",
        "It can take a minute or two to take effect after enabling.",
      ],
    ];
  }
  if (reason === "API_KEY_HTTP_REFERRER_BLOCKED" || reason === "ipRefererBlocked") {
    return [
      message,
      [
        "The key is restricted to HTTP referrers (a 'browser key'), so server-side calls are refused.",
        "Console → Credentials → your key → Application restrictions → set to 'None' or 'IP addresses'.",
        "This is the single most common failure — a browser-restricted key looks valid but never works from a server.",
      ],
    ];
  }
  if (reason === "API_KEY_SERVICE_BLOCKED") {
    return [
      message,
      [
        "The key is restricted to a set of APIs that does not include YouTube Data API v3.",
        "Console → Credentials → your key → API restrictions → add 'YouTube Data API v3'.",
      ],
    ];
  }
  if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
    return [
      message,
      [
        "The daily quota (10,000 units by default) is already spent.",
        "It resets at midnight Pacific Time.",
      ],
    ];
  }
  return [message, reason ? [`Reason code: ${reason}`] : []];
}

async function call(path, params, costUnits) {
  const url = new URL(`${API}/${path}`);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  url.searchParams.set("key", KEY);

  let response;
  try {
    response = await fetch(url, { headers: { accept: "application/json" } });
  } catch (cause) {
    fail(`Could not reach the YouTube API: ${safe(cause?.message ?? "network error")}`);
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const [message, hints] = diagnose(response.status, body);
    fail(`${path} → HTTP ${response.status}: ${message}`, hints);
  }

  say(`  OK      ${path}  (${costUnits} quota unit${costUnits === 1 ? "" : "s"})`);
  return body;
}

say("Verifying YOUTUBE_API_KEY against YouTube Data API v3…\n");

// 1 unit, and references no channel or video — this only asks whether the key
// is valid and the API is enabled.
await call("i18nLanguages", { part: "snippet" }, 1);

// 100 units, but worth it: discovery depends entirely on search.list, and it
// fails independently of the cheap call above under some key restrictions.
const search = await call("search", { part: "snippet", type: "video", q: "ai automation", maxResults: "1" }, 100);

const found = Array.isArray(search.items) ? search.items.length : 0;
say(`  OK      search returned ${found} result${found === 1 ? "" : "s"}`);

say("\n  PASSED  The key works for both calls the Radar makes.");
say("          Spent ~101 of the 10,000 daily quota units on this check.\n");
say("Next: set VIDEO_RADAR_DISCOVERY_ENABLED=true in .env.local and run the Radar.");
