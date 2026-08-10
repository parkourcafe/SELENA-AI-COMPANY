"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";

/** ui/Button renders a Link, so form submits use a native button with the same styling. */
const BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-full bg-copper-deep px-6 py-3 text-[0.95rem] font-medium text-surface transition-all duration-300 hover:bg-copper-deeper disabled:opacity-60";

/**
 * Exchanges the operator token for an httpOnly cookie.
 *
 * The token is posted once and never stored client-side — no localStorage, no
 * query string — so it does not end up in browser history or a log line.
 */
export function OperatorGate() {
  const [token, setToken] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "error">("idle");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("submitting");

    const response = await fetch("/api/internal/video-radar/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch(() => null);

    if (response?.ok) {
      window.location.reload();
      return;
    }
    setState("error");
  }

  return (
    <Card hover={false} className="mx-auto max-w-md">
      <h1 className="text-xl font-semibold">Video Radar</h1>
      <p className="mt-2 text-sm text-muted">
        Internal research tooling. Enter the operator token to continue.
      </p>

      <form onSubmit={submit} className="mt-6 grid gap-3">
        <label htmlFor="radar-token" className="text-sm font-medium">
          Operator token
        </label>
        <input
          id="radar-token"
          type="password"
          value={token}
          autoComplete="off"
          onChange={(event) => setToken(event.target.value)}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
          required
        />
        {state === "error" ? (
          <p role="alert" className="text-sm text-red-700">
            That token was not accepted.
          </p>
        ) : null}
        <button type="submit" className={BUTTON_CLASS} disabled={state === "submitting"}>
          {state === "submitting" ? "Checking…" : "Continue"}
        </button>
      </form>
    </Card>
  );
}
