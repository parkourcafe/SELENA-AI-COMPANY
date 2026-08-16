import { test } from "node:test";
import assert from "node:assert/strict";
import { commercialFacts, COMMERCIAL_FACTS_VERSION } from "@/lib/commercial-facts";
import { homepage } from "@/lib/data/homepage";
import { ruHomepage } from "@/lib/data/homepage-ru";
import { buildHomeStructuredData } from "@/lib/structured-data";
import { getSampleReport } from "@/lib/visibility/sample-report-data";

test("one versioned registry owns current public prices", () => {
  assert.equal(COMMERCIAL_FACTS_VERSION, commercialFacts.version);
  assert.equal(commercialFacts.aiSystems.sprint.amount, 4_500);
  assert.equal(homepage.packages.find((item) => item.name === "AI Sprint")?.price, commercialFacts.aiSystems.sprint.en);
  assert.equal(ruHomepage.packages.find((item) => item.name === "AI-спринт")?.price, commercialFacts.aiSystems.sprint.ru);

  for (const locale of ["en", "ru"] as const) {
    const serialized = JSON.stringify(buildHomeStructuredData(locale));
    assert.match(serialized, /"name":"AI Systems Sprint","price":"4500"/);
    assert.ok(!serialized.includes('"price":"4000"'));
  }
});

test("sample-report routing uses the locked AI Visibility catalog", () => {
  for (const locale of ["en", "ru"] as const) {
    const report = getSampleReport(locale);
    assert.deepEqual(report.routing.options.map((item) => item.name), [
      "AI Visibility Snapshot",
      "AI Visibility Landscape",
      "Expert Verified",
      "Implementation + 90 days",
    ]);
    const serialized = JSON.stringify(report.routing.options);
    for (const stale of ["$9", "$4,000", "$4 000", "Visibility Sprint", "Visibility Audit"]) {
      assert.ok(!serialized.includes(stale), `${locale} still contains ${stale}`);
    }
  }
});
