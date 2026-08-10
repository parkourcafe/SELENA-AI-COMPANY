/**
 * The Radar's project registry (spec §34: "Use the existing Command Center
 * project registry. Do not create duplicate project definitions.").
 *
 * The audit found no project *entity* in this repository — the six real Selena
 * projects live as marketing copy in lib/data/homepage.ts -> proof.projects.
 * That file stays the single source of truth: this module reads it and adds
 * nothing but a stable slug and matching keywords (from
 * data/video-radar/project-focus.json). No name, url, category or claim is
 * restated here, so the two can never drift.
 */

import { homepage } from "@/lib/data/homepage";
import projectFocus from "@/data/video-radar/project-focus.json";

export interface RadarProject {
  /** Stable id derived from the project name; used as `project_id` throughout the Radar. */
  slug: string;
  name: string;
  url: string;
  category: string;
  /** The project's own description, verbatim from the existing registry. */
  summary: string;
  /** Matching hints only — never presented as facts about the project. */
  keywords: string[];
}

/**
 * Slugify a project name from the existing registry.
 *
 * A trailing `.com` is dropped because it carries no meaning ("remhaos.com" ->
 * "remhaos"), while a branded TLD is kept because it is part of the name
 * ("PetID.care" -> "petid-care", "Doki.help" -> "doki-help").
 */
export function projectSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.com$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const focusMap = projectFocus.projects as Record<string, { keywords: string[] } | undefined>;

export function radarProjects(): RadarProject[] {
  return homepage.proof.projects.map((project) => {
    const slug = projectSlug(project.name);
    return {
      slug,
      name: project.name,
      url: project.url,
      category: project.category,
      summary: project.text,
      keywords: focusMap[slug]?.keywords ?? [],
    };
  });
}

export function findRadarProject(slug: string): RadarProject | null {
  return radarProjects().find((project) => project.slug === slug) ?? null;
}

export function isKnownProject(slug: string): boolean {
  return findRadarProject(slug) !== null;
}
