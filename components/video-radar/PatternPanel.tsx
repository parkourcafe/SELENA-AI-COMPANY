import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { PatternEmergence, RadarPattern } from "@/lib/video-radar/contracts";

/**
 * Pattern library (spec §37, §38).
 *
 * Every row shows the evidence behind its status, not just the label. A
 * pattern is only badged "emerging" when it clears the configured video and
 * independent-creator thresholds inside the window — and the counts are printed
 * next to the badge so the claim is checkable rather than decorative.
 */
export function PatternPanel({
  patterns,
}: {
  patterns: { pattern: RadarPattern; emergence: PatternEmergence }[];
}) {
  if (patterns.length === 0) {
    return (
      <Card hover={false}>
        <h2 className="text-lg font-semibold">Patterns</h2>
        <p className="mt-2 text-sm text-muted">
          No patterns observed yet. Patterns are extracted from analysed videos, so this stays empty
          until deep analysis has run.
        </p>
      </Card>
    );
  }

  return (
    <Card hover={false}>
      <h2 className="text-lg font-semibold">Patterns</h2>
      <p className="mt-1 text-sm text-muted">
        A shared mechanic is not a trend. &ldquo;Emerging&rdquo; requires enough qualifying videos from
        enough independent creators inside the recent window.
      </p>

      <ul className="mt-4 grid gap-3">
        {patterns.map(({ pattern, emergence }) => (
          <li key={pattern.id} className="rounded-lg border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{pattern.canonicalName}</p>
              {emergence.emerging ? (
                <Badge tone="sage">emerging</Badge>
              ) : (
                <Badge>observed</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">{pattern.description}</p>
            <p className="mt-2 text-xs text-muted">
              {emergence.qualifyingVideos} qualifying{" "}
              {emergence.qualifyingVideos === 1 ? "video" : "videos"} from{" "}
              {emergence.independentCreators} independent{" "}
              {emergence.independentCreators === 1 ? "creator" : "creators"} in the last{" "}
              {emergence.windowDays} days · {pattern.observationCount} total observations
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
