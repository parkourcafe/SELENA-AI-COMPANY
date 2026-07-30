import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { discoverAndCrawl } from "@/lib/visibility/crawler/discover";

function listen(server: http.Server): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve((server.address() as AddressInfo).port));
  });
}

function makeSiteServer() {
  return http.createServer((req, res) => {
    if (req.url === "/sitemap.xml") {
      res.writeHead(200, { "Content-Type": "application/xml" });
      res.end("<urlset></urlset>");
      return;
    }
    if (req.url === "/robots.txt") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("User-agent: *\nAllow: /\n");
      return;
    }
    if (req.url === "/about") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<html><head><title>About</title></head><body><h1>About us</h1></body></html>");
      return;
    }
    if (req.url === "/contact") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<html><head><title>Contact</title></head><body><h1>Contact</h1></body></html>");
      return;
    }
    if (req.url === "/services") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<html><head><title>Services</title></head><body><h1>Services</h1></body></html>");
      return;
    }
    // homepage
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      `<html><head><title>Example Villas</title>
        <script type="application/ld+json">{"@type":"LocalBusiness","name":"Example Villas"}</script>
      </head><body>
        <h1>Example Villas</h1>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
        <a href="/services">Services</a>
      </body></html>`,
    );
  });
}

test("discoverAndCrawl fetches the homepage plus about/contact/service candidates", async () => {
  const server = makeSiteServer();
  const port = await listen(server);
  const baseUrl = `http://127.0.0.1:${port}/`;

  try {
    const result = await discoverAndCrawl(baseUrl, { unsafeAllowPrivateHostsForTesting: true });
    assert.equal(result.sitemapFound, true);
    assert.equal(result.robotsDisallowsAll, false);

    const roles = result.pages.map((p) => p.role).sort();
    assert.deepEqual(roles, ["about", "contact", "homepage", "service"]);

    const homepage = result.pages.find((p) => p.role === "homepage")!;
    assert.equal(homepage.fetch.statusCode, 200);
    assert.ok(homepage.fetch.html?.includes("Example Villas"));

    assert.ok(result.homepageChecks.some((c) => c.ruleId === "identity.jsonld_entity_present" && c.state === "pass"));
  } finally {
    server.close();
  }
});

test("discoverAndCrawl reports sitemapFound=false and no crawl-blocking robots when both are absent", async () => {
  const server = http.createServer((req, res) => {
    if (req.url !== "/") {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<html><head><title>Bare site</title></head><body><h1>Bare site</h1></body></html>");
  });
  const port = await listen(server);
  const baseUrl = `http://127.0.0.1:${port}/`;

  try {
    const result = await discoverAndCrawl(baseUrl, { unsafeAllowPrivateHostsForTesting: true });
    assert.equal(result.sitemapFound, false);
    assert.equal(result.robotsDisallowsAll, false);
    assert.equal(result.pages.length, 1);
    assert.equal(result.pages[0].role, "homepage");
  } finally {
    server.close();
  }
});
