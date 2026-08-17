import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAiSystemsStructuredData,
  buildAiVisibilityStructuredData,
  buildLabArticleStructuredData,
  buildPublicReadinessStructuredData,
} from "@/lib/structured-data";

function graphOf(value: { "@graph": unknown[] }) {
  return value["@graph"] as Array<Record<string, unknown>>;
}

test("AI Visibility structured data keeps free readiness separate from paid measurement", () => {
  const graph = graphOf(buildAiVisibilityStructuredData("en"));
  const service = graph.find((item) => item["@type"] === "Service");
  assert.ok(service);

  const catalog = service.offers as { itemListElement: Array<Record<string, string>> };
  assert.deepEqual(
    catalog.itemListElement.map((offer) => offer.name),
    [
      "Public Readiness",
      "AI Visibility Snapshot",
      "AI Visibility Landscape",
      "Expert Verified",
      "Implementation + 90 days",
    ],
  );
  assert.equal(catalog.itemListElement[0].price, "0");
  assert.equal(catalog.itemListElement[1].price, "49");
  assert.equal(catalog.itemListElement[2].price, "79");
  assert.equal(catalog.itemListElement[3].price, "399");
  assert.equal(catalog.itemListElement[4].price, "2490");
});

test("AI Systems structured data exposes the four custom service offers", () => {
  const graph = graphOf(buildAiSystemsStructuredData("en"));
  const service = graph.find((item) => item["@type"] === "Service");
  assert.ok(service);
  const catalog = service.offers as { itemListElement: Array<Record<string, string>> };
  assert.deepEqual(catalog.itemListElement.map((offer) => offer.price), ["100", "500", "4500", "10000"]);
});

test("Public Readiness structured data contains a zero-price offer only", () => {
  const graph = graphOf(buildPublicReadinessStructuredData("ru"));
  const service = graph.find((item) => item["@type"] === "Service");
  assert.ok(service);
  assert.equal((service.offers as Record<string, string>).price, "0");
});

test("Lab article structured data records modification date and breadcrumb", () => {
  const graph = graphOf(buildLabArticleStructuredData({
    locale: "en",
    pageUrl: "https://www.selenasystems.com/lab/articles/example",
    title: "Example article",
    description: "Evidence-safe article summary.",
    updatedAt: "2026-08-16",
  }));
  const article = graph.find((item) => item["@type"] === "Article");
  const breadcrumb = graph.find((item) => item["@type"] === "BreadcrumbList");
  assert.equal(article?.dateModified, "2026-08-16");
  assert.equal((breadcrumb?.itemListElement as Array<Record<string, string>>).length, 2);
});
