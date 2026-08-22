import assert from "node:assert/strict";
import test from "node:test";
import { alternateLocalePath } from "../../lib/localized-routes";

test("home and legal pages keep a real locale alternate", () => {
  assert.equal(alternateLocalePath("/"), "/ru");
  assert.equal(alternateLocalePath("/ru"), "/");
  assert.equal(alternateLocalePath("/en/contact"), "/contact");
  assert.equal(alternateLocalePath("/contact"), "/en/contact");
  assert.equal(alternateLocalePath("/ru/visibility"), "/visibility");
  assert.equal(alternateLocalePath("/lab/articles/what-is-ai-visibility"), "/ru/lab/articles/what-is-ai-visibility");
});

test("pages without a translation return null instead of dumping to home", () => {
  for (const path of ["/ai-systems", "/ai-systems/ai-audit", "/ai-training", "/ai-automation", "/ai-content", "/about"]) {
    assert.equal(alternateLocalePath(path), null, `${path} must not switch to a wrong page`);
  }
});
