import assert from "node:assert/strict";
import test from "node:test";
import { CLIENT_PORTAL_ENABLED, selenaAppRoutes } from "@/lib/visibility/routes";

test("the portal stays hidden unless the env var explicitly enables it", () => {
  assert.equal(CLIENT_PORTAL_ENABLED, process.env.NEXT_PUBLIC_CLIENT_PORTAL_ENABLED === "true");
});

test("every link into the portal is rendered behind the flag", async () => {
  const { readFile } = await import("node:fs/promises");
  const files = [
    "components/layout/Header.tsx",
    "components/layout/Footer.tsx",
    "components/visibility/PricingTracks.tsx",
  ];
  for (const file of files) {
    const source = await readFile(new URL(`../../${file}`, import.meta.url), "utf8");
    const links = source.match(/selenaAppRoutes\.login|content\.portal\.href/g) ?? [];
    assert.ok(links.length > 0, `${file} still owns a portal link to guard`);
    assert.equal(
      source.match(/CLIENT_PORTAL_ENABLED &&/g)?.length ?? 0,
      links.length,
      `${file}: every portal link needs its own CLIENT_PORTAL_ENABLED guard`,
    );
  }
});

test("the portal hostname is reachable from one module only", () => {
  assert.match(selenaAppRoutes.login, /^https:\/\/app\.selenasystems\.com\//);
});
