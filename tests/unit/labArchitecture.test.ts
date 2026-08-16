import { test } from "node:test";
import assert from "node:assert/strict";
import { homepage } from "@/lib/data/homepage";
import { ruHomepage } from "@/lib/data/homepage-ru";
import {
  getLabItem,
  getLabItems,
  labContent,
  labLanguages,
  labPath,
  labSectionIds,
} from "@/lib/lab/content";
import { alternateLocalePath, isEnglishPublicPath } from "@/lib/localized-routes";

test("Selena Lab has the five approved public sections and no separate Blog or Academy", () => {
  assert.deepEqual(labSectionIds, ["research", "guides", "experiments", "articles", "courses"]);
  for (const locale of ["en", "ru"] as const) {
    assert.deepEqual(labContent[locale].sections.map((section) => section.id), labSectionIds);
    assert.ok(!/\bAcademy\b|\/blog\b/i.test(JSON.stringify(labContent[locale])));
  }
});

test("the three owner-selected foundation topics are published in both languages", () => {
  const routes = [
    ["articles", "what-is-ai-visibility"],
    ["guides", "prepare-site-for-ai-systems"],
    ["guides", "read-ai-visibility-report-evidence"],
  ] as const;

  for (const [section, slug] of routes) {
    const en = getLabItem("en", section, slug);
    const ru = getLabItem("ru", section, slug);
    assert.ok(en, `missing English ${section}/${slug}`);
    assert.ok(ru, `missing Russian ${section}/${slug}`);
    assert.ok(en.blocks.length >= 4, `${slug} must be a useful article, not a placeholder`);
    assert.equal(en.blocks.length, ru.blocks.length, `${slug} must remain equivalent across locales`);
  }
});

test("Lab courses disclose that nothing is for sale and reserve the shared learning workspace", () => {
  for (const locale of ["en", "ru"] as const) {
    assert.equal(getLabItems(locale, "courses").length, 0);
    assert.match(labContent[locale].coursesBoundary, /app\.selenasystems\.com\/app\/learn/);
    assert.match(labContent[locale].coursesBoundary, locale === "en" ? /No course is currently offered for sale/ : /ни один курс не выставлен на продажу/i);
  }
});

test("Lab locale switching preserves section and article paths", () => {
  const enArticle = labPath("en", "guides", "prepare-site-for-ai-systems");
  const ruArticle = labPath("ru", "guides", "prepare-site-for-ai-systems");
  assert.equal(alternateLocalePath(enArticle), ruArticle);
  assert.equal(alternateLocalePath(ruArticle), enArticle);
  assert.equal(isEnglishPublicPath(enArticle), true);
  assert.equal(isEnglishPublicPath(ruArticle), false);
  assert.deepEqual(labLanguages("guides", "prepare-site-for-ai-systems"), {
    "x-default": enArticle,
    en: enArticle,
    ru: ruArticle,
  });
});

test("both home navigations expose Selena Lab as a supporting destination", () => {
  assert.ok(homepage.nav.some((item) => item.href === "/lab" && item.label === "Lab"));
  assert.ok(ruHomepage.nav.some((item) => item.href === "/ru/lab" && item.label === "Lab"));
});

test("technical Lab guidance cites primary official sources", () => {
  const guide = getLabItem("en", "guides", "prepare-site-for-ai-systems")!;
  assert.ok(guide.sources.length >= 4);
  for (const source of guide.sources) {
    const host = new URL(source.href).hostname;
    assert.ok(
      host === "help.openai.com" || host === "developers.google.com" || host === "schema.org",
      `unexpected non-primary technical source: ${host}`,
    );
  }
});
