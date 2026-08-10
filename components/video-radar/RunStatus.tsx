import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { RadarDashboard } from "@/lib/video-radar/view";

/**
 * Run status and coverage (spec §45).
 *
 * Reports what happened, including the parts that went wrong. A run with
 * failures shows as `partial` with the failures listed — a dashboard that
 * rendered a partial run as a clean success would be the single most
 * misleading thing this UI could do.
 */
export function RunStatus({ dashboard }: { dashboard: RadarDashboard }) {
  const run = dashboard.latestRun;

  return (
    <div className="grid gap-6">
      {!dashboard.durable ? (
        <Card hover={false} className="border-copper/40 bg-copper/5">
          <p className="text-sm">
            <strong>Not persisting.</strong> No Supabase project is configured, so the Radar is
            running on the in-memory store. Results are real but will not survive a restart, and
            baselines cannot accumulate between runs. Set <code>SUPABASE_URL</code> and{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> to make runs durable.
          </p>
        </Card>
      ) : null}

      <Card hover={false}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Latest run</h2>
          {run ? (
            <Badge tone={run.status === "completed" ? "sage" : run.status === "partial" ? "copper" : "neutral"}>
              {run.status}
            </Badge>
          ) : (
            <Badge>never run</Badge>
          )}
        </div>

        {!run ? (
          <p className="mt-3 text-sm text-muted">
            No run has been recorded yet. Trigger one with <code>POST /api/internal/video-radar/run</code>.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted">
              Started {new Date(run.startedAt).toLocaleString()}
              {run.completedAt ? ` · finished ${new Date(run.completedAt).toLocaleString()}` : ""} ·
              pipeline {run.pipelineVersion} · scoring {run.scoringVersion}
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
              <Counter label="Discovered" value={run.counters.videosDiscovered} />
              <Counter label="Updated" value={run.counters.videosUpdated} />
              <Counter label="Scored" value={run.counters.videosScored} />
              <Counter label="Shortlisted" value={run.counters.shortlisted} />
              <Counter
                label="Transcripts"
                value={`${run.counters.transcriptsSucceeded}/${run.counters.transcriptsAttempted}`}
              />
              <Counter
                label="Analyses"
                value={`${run.counters.analysesSucceeded}/${run.counters.analysesAttempted}`}
              />
              <Counter label="Opportunities" value={run.counters.opportunitiesProduced} />
              <Counter label="Provider failures" value={run.counters.providerFailures} />
            </dl>

            {run.failures.length > 0 ? (
              <details className="mt-5 rounded-lg border border-line bg-surface p-4">
                <summary className="cursor-pointer text-sm font-medium">
                  {run.failures.length} item {run.failures.length === 1 ? "failure" : "failures"} — the
                  run continued past each one
                </summary>
                <ul className="mt-3 grid gap-2 text-xs text-muted">
                  {run.failures.slice(0, 25).map((failure, index) => (
                    <li key={`${failure.stage}-${index}`}>
                      <code>{failure.stage}</code> · {failure.code}
                      {failure.subjectId ? ` · ${failure.subjectId}` : ""} — {failure.message}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </>
        )}
      </Card>

      <Card hover={false}>
        <h2 className="text-lg font-semibold">Coverage</h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <Counter label="Known videos" value={dashboard.coverage.discovered} />
          <Counter label="Scored this run" value={dashboard.coverage.monitored} />
          <Counter label="Shortlisted" value={dashboard.coverage.shortlisted} />
          <Counter label="Analysed" value={dashboard.coverage.analyzed} />
        </dl>
      </Card>

      {dashboard.runs.length > 1 ? (
        <Card hover={false}>
          <h2 className="text-lg font-semibold">Run history</h2>
          <ul className="mt-4 grid gap-2 text-sm">
            {dashboard.runs.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-3">
                <Badge tone={entry.status === "completed" ? "sage" : "neutral"}>{entry.status}</Badge>
                <span className="text-muted">{new Date(entry.startedAt).toLocaleString()}</span>
                <span className="text-muted">
                  {entry.counters.shortlisted} shortlisted · {entry.counters.opportunitiesProduced}{" "}
                  opportunities
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

function Counter({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
