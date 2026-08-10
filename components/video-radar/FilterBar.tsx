import { Card } from "@/components/ui/Card";
import type { RadarFilters } from "@/lib/video-radar/view";
import type { RadarProject } from "@/lib/video-radar/projects";

/**
 * Filters (spec §47).
 *
 * A plain GET form, so filtering needs no client JavaScript and every filtered
 * view is a shareable URL. Kept to the useful minimum the spec lists — extra
 * filter complexity is explicitly warned against.
 */
export function FilterBar({
  filters,
  projects,
}: {
  filters: RadarFilters;
  projects: RadarProject[];
}) {
  return (
    <Card hover={false}>
      <form method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Format" name="type" value={filters.videoType}>
          <option value="">Any</option>
          <option value="short">Shorts</option>
          <option value="long">Long-form</option>
          <option value="unknown">Unknown</option>
        </Field>

        <Field label="Project" name="project" value={filters.projectId}>
          <option value="">Any</option>
          {projects.map((project) => (
            <option key={project.slug} value={project.slug}>
              {project.name}
            </option>
          ))}
        </Field>

        <Field label="Min outlier" name="minOutlier" value={filters.minOutlier?.toString()}>
          <option value="">Any</option>
          <option value="1.5">1.5x+</option>
          <option value="2">2x+</option>
          <option value="5">5x+</option>
          <option value="10">10x+</option>
        </Field>

        <Field label="Baseline confidence" name="confidence" value={filters.baselineConfidence}>
          <option value="">Any</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="unavailable">Unavailable</option>
        </Field>

        <Field label="Maturity" name="maturity" value={filters.maturity}>
          <option value="">Any</option>
          <option value="mature">Mature</option>
          <option value="provisional">Provisional</option>
        </Field>

        <Field label="Analysed" name="analyzed" value={filters.analyzed}>
          <option value="">Any</option>
          <option value="yes">Analysed</option>
          <option value="no">Not analysed</option>
        </Field>

        <Field label="Transcript" name="transcript" value={filters.transcript}>
          <option value="">Any</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </Field>

        <Field label="Published within" name="days" value={filters.publishedWithinDays?.toString()}>
          <option value="">Any time</option>
          <option value="7">7 days</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
        </Field>

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            className="rounded-full bg-copper-deep px-5 py-2 text-sm font-medium text-surface transition-colors hover:bg-copper-deeper"
          >
            Apply filters
          </button>
          <a
            href="/internal/video-radar"
            className="rounded-full border border-line bg-white px-5 py-2 text-sm font-medium transition-colors hover:border-copper-deep/60"
          >
            Clear
          </a>
        </div>
      </form>
    </Card>
  );
}

function Field({
  label,
  name,
  value,
  children,
}: {
  label: string;
  name: string;
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={`filter-${name}`} className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </label>
      <select
        id={`filter-${name}`}
        name={name}
        defaultValue={value ?? ""}
        className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
      >
        {children}
      </select>
    </div>
  );
}
