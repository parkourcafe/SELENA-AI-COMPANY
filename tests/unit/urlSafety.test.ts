import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { safeFetch } from "@/lib/visibility/security/url-safety";

test("safeFetch blocks loopback IP literals without any escape hatch", async () => {
  const result = await safeFetch("http://127.0.0.1/");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "BLOCKED_HOST");
});

test("safeFetch blocks the cloud metadata address", async () => {
  const result = await safeFetch("http://169.254.169.254/latest/meta-data/");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "BLOCKED_HOST");
});

test("safeFetch blocks private RFC1918 ranges", async () => {
  const a = await safeFetch("http://10.0.0.5/");
  const b = await safeFetch("http://192.168.1.1/");
  assert.equal(a.ok, false);
  assert.equal(b.ok, false);
});

test("safeFetch rejects non-http(s) schemes and credentials before any DNS lookup", async () => {
  const ftp = await safeFetch("ftp://example.com/");
  const withCreds = await safeFetch("http://user:pass@127.0.0.1/");
  assert.equal(ftp.ok, false);
  if (!ftp.ok) assert.equal(ftp.error, "INVALID_URL");
  assert.equal(withCreds.ok, false);
});

test("safeFetch rejects a non-standard port", async () => {
  const result = await safeFetch("http://example.com:8080/");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "BLOCKED_HOST");
});

/**
 * The tests below use the `unsafeAllowPrivateHostsForTesting` escape
 * hatch to point safeFetch at a local server — every other test in this
 * file proves that hatch is never reachable from real request input.
 */
function listen(server: http.Server): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve((server.address() as AddressInfo).port);
    });
  });
}

test("safeFetch follows a redirect and re-fetches the final URL", async () => {
  const server = http.createServer((req, res) => {
    if (req.url === "/start") {
      res.writeHead(302, { Location: "/final" });
      res.end();
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<html>final content</html>");
  });
  const port = await listen(server);

  try {
    const result = await safeFetch(`http://127.0.0.1:${port}/start`, {
      unsafeAllowPrivateHostsForTesting: true,
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.match(result.finalUrl, /\/final$/);
      assert.match(result.body, /final content/);
    }
  } finally {
    server.close();
  }
});

test("safeFetch rejects a disallowed content type", async () => {
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end("{}");
  });
  const port = await listen(server);

  try {
    const result = await safeFetch(`http://127.0.0.1:${port}/`, {
      unsafeAllowPrivateHostsForTesting: true,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "UNSUPPORTED_CONTENT_TYPE");
  } finally {
    server.close();
  }
});

test("safeFetch enforces maxBytes and aborts an oversized response", async () => {
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("x".repeat(1000));
  });
  const port = await listen(server);

  try {
    const result = await safeFetch(`http://127.0.0.1:${port}/`, {
      unsafeAllowPrivateHostsForTesting: true,
      maxBytes: 100,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "FETCH_TOO_LARGE");
  } finally {
    server.close();
  }
});

test("safeFetch stops a timed-out destination without retry fan-out", async () => {
  const server = http.createServer((_req, res) => {
    const timer = setTimeout(() => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<html>too late</html>");
    }, 250);
    res.on("close", () => clearTimeout(timer));
  });
  const port = await listen(server);

  try {
    const result = await safeFetch(`http://127.0.0.1:${port}/slow`, {
      unsafeAllowPrivateHostsForTesting: true,
      timeoutMs: 25,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "FETCH_TIMEOUT");
  } finally {
    server.close();
  }
});

test("safeFetch stops following redirects past maxRedirects", async () => {
  const server = http.createServer((_req, res) => {
    res.writeHead(302, { Location: "/loop" });
    res.end();
  });
  const port = await listen(server);

  try {
    const result = await safeFetch(`http://127.0.0.1:${port}/loop`, {
      unsafeAllowPrivateHostsForTesting: true,
      maxRedirects: 2,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "REDIRECT_BLOCKED");
  } finally {
    server.close();
  }
});
