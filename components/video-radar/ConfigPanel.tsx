"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { RadarCreator, RadarTopic } from "@/lib/video-radar/contracts";

const FIELD =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm placeholder:text-muted/70";
const PRIMARY =
  "rounded-full bg-copper-deep px-5 py-2 text-sm font-medium text-surface transition-colors hover:bg-copper-deeper disabled:opacity-60";
const QUIET =
  "rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium transition-colors hover:border-copper-deep/60 hover:text-copper-deep disabled:opacity-50";

/** Same shape as the API validator, so a bad id is caught before the round trip. */
const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;

async function send(url: string, method: "POST" | "PATCH", body: unknown): Promise<boolean> {
  const response = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  return Boolean(response?.ok);
}

/**
 * Runtime configuration of research topics and the creator watchlist (spec
 * §10, §11, §48). Deliberately a thin form over the same API routes an
 * operator could curl — no second validation story, and nothing here can write
 * anything the API would reject.
 */
export function ConfigPanel({
  topics,
  creators,
  projects,
}: {
  topics: RadarTopic[];
  creators: RadarCreator[];
  projects: { slug: string; name: string }[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <TopicSection topics={topics} projects={projects} />
      <CreatorSection creators={creators} projects={projects} />
    </div>
  );
}

function TopicSection({
  topics,
  projects,
}: {
  topics: RadarTopic[];
  projects: { slug: string; name: string }[];
}) {
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [priority, setPriority] = useState("3");
  const [targetProject, setTargetProject] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addTopic(event: React.FormEvent) {
    event.preventDefault();
    const parsed = keywords.split(",").map((keyword) => keyword.trim()).filter(Boolean);
    if (!name.trim() || parsed.length === 0) {
      setError("A name and at least one keyword are required.");
      return;
    }

    setPending(true);
    setError(null);
    const ok = await send("/api/internal/video-radar/topics", "POST", {
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: name.trim(),
      keywords: parsed,
      priority: Number(priority),
      languages: ["en", "ru"],
      targetProjects: targetProject ? [targetProject] : [],
    });
    setPending(false);

    if (!ok) {
      setError("Could not save that topic.");
      return;
    }
    window.location.reload();
  }

  return (
    <Card hover={false}>
      <h3 className="text-base font-semibold">Research topics</h3>
      <p className="mt-1 text-sm text-muted">
        Drive topic discovery. Deactivating keeps a topic&rsquo;s discovery provenance intact;
        deleting would lose it.
      </p>

      <ul className="mt-4 grid max-h-72 gap-2 overflow-y-auto pr-1">
        {topics.length === 0 ? (
          <li className="text-sm text-muted">
            None yet — the seed set is written on the first run.
          </li>
        ) : (
          topics.map((topic) => <TopicRow key={topic.id} topic={topic} />)
        )}
      </ul>

      <form onSubmit={addTopic} className="mt-5 grid gap-3 border-t border-line pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Add a topic</p>
        <input
          aria-label="Topic name"
          className={FIELD}
          placeholder="Topic name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          aria-label="Keywords, comma separated"
          className={FIELD}
          placeholder="Keywords, comma separated"
          value={keywords}
          onChange={(event) => setKeywords(event.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            aria-label="Priority"
            className={FIELD}
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                Priority {value}
              </option>
            ))}
          </select>
          <select
            aria-label="Target project"
            className={FIELD}
            value={targetProject}
            onChange={(event) => setTargetProject(event.target.value)}
          >
            <option value="">No target project</option>
            {projects.map((project) => (
              <option key={project.slug} value={project.slug}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <button type="submit" className={PRIMARY} disabled={pending}>
          {pending ? "Saving…" : "Add topic"}
        </button>
      </form>
    </Card>
  );
}

function TopicRow({ topic }: { topic: RadarTopic }) {
  const [active, setActive] = useState(topic.active);
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    const ok = await send(`/api/internal/video-radar/topics/${topic.id}`, "PATCH", {
      active: !active,
    });
    if (ok) setActive(!active);
    setPending(false);
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {topic.name}{" "}
          <span className="font-normal text-muted">· priority {topic.priority}</span>
        </p>
        <p className="truncate text-xs text-muted">{topic.keywords.join(", ")}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge tone={active ? "sage" : "neutral"}>{active ? "active" : "off"}</Badge>
        <button type="button" onClick={toggle} disabled={pending} className={QUIET}>
          {active ? "Deactivate" : "Activate"}
        </button>
      </div>
    </li>
  );
}

function CreatorSection({
  creators,
  projects,
}: {
  creators: RadarCreator[];
  projects: { slug: string; name: string }[];
}) {
  const [channelId, setChannelId] = useState("");
  const [channelName, setChannelName] = useState("");
  const [priority, setPriority] = useState("3");
  const [targetProject, setTargetProject] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addCreator(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = channelId.trim();
    if (!CHANNEL_ID.test(trimmed)) {
      setError("That is not a YouTube channel id (UC…, 24 characters).");
      return;
    }

    setPending(true);
    setError(null);
    const ok = await send("/api/internal/video-radar/creators", "POST", {
      externalChannelId: trimmed,
      channelName: channelName.trim(),
      priority: Number(priority),
      languages: ["en"],
      targetProjects: targetProject ? [targetProject] : [],
    });
    setPending(false);

    if (!ok) {
      setError("Could not save that creator.");
      return;
    }
    window.location.reload();
  }

  return (
    <Card hover={false}>
      <h3 className="text-base font-semibold">Creator watchlist</h3>
      <p className="mt-1 text-sm text-muted">
        Manually curated. A channel id must be real — the Radar will not invent one, and a
        fabricated id would silently never match.
      </p>

      <ul className="mt-4 grid max-h-72 gap-2 overflow-y-auto pr-1">
        {creators.length === 0 ? (
          <li className="text-sm text-muted">
            Empty. Watchlist discovery does nothing until a real channel is added.
          </li>
        ) : (
          creators.map((creator) => <CreatorRow key={creator.id} creator={creator} />)
        )}
      </ul>

      <form onSubmit={addCreator} className="mt-5 grid gap-3 border-t border-line pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Add a creator</p>
        <input
          aria-label="YouTube channel id"
          className={FIELD}
          placeholder="UCxxxxxxxxxxxxxxxxxxxxxx"
          value={channelId}
          onChange={(event) => setChannelId(event.target.value)}
        />
        <input
          aria-label="Channel name"
          className={FIELD}
          placeholder="Channel name"
          value={channelName}
          onChange={(event) => setChannelName(event.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            aria-label="Creator priority"
            className={FIELD}
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                Priority {value}
              </option>
            ))}
          </select>
          <select
            aria-label="Creator target project"
            className={FIELD}
            value={targetProject}
            onChange={(event) => setTargetProject(event.target.value)}
          >
            <option value="">No target project</option>
            {projects.map((project) => (
              <option key={project.slug} value={project.slug}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <button type="submit" className={PRIMARY} disabled={pending}>
          {pending ? "Saving…" : "Add creator"}
        </button>
      </form>
    </Card>
  );
}

function CreatorRow({ creator }: { creator: RadarCreator }) {
  const [active, setActive] = useState(creator.active);
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    const ok = await send(`/api/internal/video-radar/creators/${creator.id}`, "PATCH", {
      active: !active,
    });
    if (ok) setActive(!active);
    setPending(false);
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {creator.channelName || creator.externalChannelId}{" "}
          <span className="font-normal text-muted">· priority {creator.priority}</span>
        </p>
        <p className="truncate text-xs text-muted">
          {creator.lastScannedAt
            ? `last scanned ${new Date(creator.lastScannedAt).toLocaleDateString()}`
            : "never scanned"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge tone={active ? "sage" : "neutral"}>{active ? "active" : "off"}</Badge>
        <button type="button" onClick={toggle} disabled={pending} className={QUIET}>
          {active ? "Deactivate" : "Activate"}
        </button>
      </div>
    </li>
  );
}
