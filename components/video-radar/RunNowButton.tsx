"use client";

import { useState } from "react";

interface RunResult {
  ok: boolean;
  discovery?: "live" | "disabled";
  run?: { status: string; counters: { shortlisted: number; opportunitiesProduced: number } };
}

/**
 * Manual run trigger (spec §48).
 *
 * Reports what actually happened rather than a generic success toast: a
 * `partial` run and a run with live discovery disabled both look like "done"
 * otherwise, and both are things the operator needs to know about.
 */
export function RunNowButton() {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [summary, setSummary] = useState<string | null>(null);

  async function run() {
    setState("running");
    setSummary(null);

    const response = await fetch("/api/internal/video-radar/run", { method: "POST" }).catch(
      () => null,
    );

    if (!response?.ok) {
      setState("error");
      setSummary(
        response ? `Run rejected (HTTP ${response.status}).` : "Could not reach the run endpoint.",
      );
      return;
    }

    const body = (await response.json().catch(() => null)) as RunResult | null;
    setState("done");
    setSummary(
      body?.run
        ? `${body.run.status} · ${body.run.counters.shortlisted} shortlisted · ${body.run.counters.opportunitiesProduced} opportunities` +
            (body.discovery === "disabled" ? " · live discovery is off" : "")
        : "Run finished.",
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={run}
        disabled={state === "running"}
        className="rounded-full bg-copper-deep px-5 py-2 text-sm font-medium text-surface transition-colors hover:bg-copper-deeper disabled:opacity-60"
      >
        {state === "running" ? "Running…" : "Run now"}
      </button>

      {summary ? (
        <p
          role="status"
          className={state === "error" ? "text-sm text-red-700" : "text-sm text-muted"}
        >
          {summary}
          {state === "done" ? (
            <>
              {" "}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="underline underline-offset-2"
              >
                Refresh
              </button>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
