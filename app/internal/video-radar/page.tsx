import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { CandidateCard } from "@/components/video-radar/CandidateCard";
import { ConfigPanel } from "@/components/video-radar/ConfigPanel";
import { FilterBar } from "@/components/video-radar/FilterBar";
import { OperatorGate } from "@/components/video-radar/OperatorGate";
import { PatternPanel } from "@/components/video-radar/PatternPanel";
import { RunNowButton } from "@/components/video-radar/RunNowButton";
import { RunStatus } from "@/components/video-radar/RunStatus";
import { RADAR_OPERATOR_COOKIE, isOperatorCookieValid } from "@/lib/video-radar/auth";
import { getRadarStore } from "@/lib/video-radar/store";
import { loadDashboard, parseFilters } from "@/lib/video-radar/view";

export const runtime = "nodejs";
/** Always rendered fresh: a cached Radar page would show stale run state. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Video Radar — internal",
  // Operator tooling, never indexed. app/robots.ts disallows /internal/ as well;
  // this is the second lock rather than the only one.
  robots: { index: false, follow: false, nocache: true },
};

export default async function VideoRadarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const cookieStore = await cookies();
  const authorized = isOperatorCookieValid(cookieStore.get(RADAR_OPERATOR_COOKIE)?.value);

  if (!authorized) {
    return (
      <div className="bg-ivory py-20">
        <Container size="narrow">
          <OperatorGate />
        </Container>
      </div>
    );
  }

  const filters = parseFilters(await searchParams);
  const dashboard = await loadDashboard(getRadarStore(), filters);

  return (
    <div className="bg-ivory py-12 sm:py-16">
      <Container size="wide" className="grid gap-8">
        <header>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-copper-deep">
            Intelligence
          </p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Video Research Radar</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Videos performing unusually well relative to their own creator&rsquo;s normal
            performance, the observable patterns inside them, and the content opportunities those
            patterns suggest for existing projects. Measured evidence and AI interpretation are shown
            separately, and never merged.
          </p>
          <div className="mt-5">
            <RunNowButton />
          </div>
        </header>

        <RunStatus dashboard={dashboard} />

        <ConfigPanel
          topics={dashboard.topics}
          creators={dashboard.creators}
          projects={dashboard.projects}
        />

        <FilterBar filters={filters} projects={dashboard.projects} />

        <section className="grid gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">Candidates</h2>
            <p className="text-sm text-muted">
              {dashboard.candidates.length}{" "}
              {dashboard.candidates.length === 1 ? "video" : "videos"} matching these filters
            </p>
          </div>

          {dashboard.candidates.length === 0 ? (
            <Card hover={false}>
              <p className="text-sm text-muted">
                Nothing to show. That is a real result, not an error — if no video cleared the
                quality gate, the Radar returns nothing rather than filling the page with weak
                candidates.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {dashboard.candidates.slice(0, 50).map((candidate) => (
                <CandidateCard key={candidate.video.id} candidate={candidate} />
              ))}
            </div>
          )}
        </section>

        <PatternPanel patterns={dashboard.patterns} />

        <section className="grid gap-4">
          <h2 className="text-lg font-semibold">Opportunities by project</h2>
          {dashboard.opportunitiesByProject.length === 0 ? (
            <Card hover={false}>
              <p className="text-sm text-muted">
                No opportunities yet. They are produced from analysed videos and always link to a
                project that already exists in the registry.
              </p>
            </Card>
          ) : (
            dashboard.opportunitiesByProject.map(({ project, opportunities }) => (
              <Card hover={false} key={project.slug}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-base font-semibold">{project.name}</h3>
                  <p className="text-sm text-muted">
                    {opportunities.length}{" "}
                    {opportunities.length === 1 ? "opportunity" : "opportunities"}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted">{project.category}</p>
                <ul className="mt-3 grid gap-2 text-sm">
                  {opportunities.slice(0, 8).map((opportunity) => (
                    <li key={opportunity.id} className="rounded-md border border-line bg-surface p-3">
                      <p className="font-medium">{opportunity.proposedAngle}</p>
                      <p className="mt-1 text-muted">{opportunity.proposedHook}</p>
                      <p className="mt-1 text-xs text-muted">
                        {opportunity.status.replace(/_/g, " ")}
                        {opportunity.factRequirements.length > 0
                          ? ` · ${opportunity.factRequirements.length} fact(s) required`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            ))
          )}
        </section>
      </Container>
    </div>
  );
}
