/**
 * Hand-authored placeholder types mirroring supabase/migrations/*.sql.
 * Regenerate with `supabase gen types typescript` once a real project
 * exists (Decision Log D-005, NEEDS_OWNER) and replace this file —
 * do not hand-maintain both in parallel long-term.
 *
 * Shape note: postgrest-js requires a schema to satisfy `GenericSchema`
 * (`Tables` + `Views` + `Functions`) and each table to satisfy `GenericTable`
 * (`Row` + `Insert` + `Update` + `Relationships`). Anything missing makes the
 * whole schema fail the constraint, and every `.from()` result silently
 * degrades to `never` rather than erroring at the type's definition. The keys
 * below are load-bearing even though several are empty — the Video Radar store
 * is the first code in this repo to actually call `.from()`.
 */

import type { RadarTables } from "./radar-types";

type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };

export type LeadRow = {
  id: string;
  email: string | null;
  name: string | null;
  company: string | null;
  marketing_opt_in: boolean;
  marketing_consent_version: string | null;
  transactional_consent_at: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export type SiteRow = {
  id: string;
  submitted_url: string;
  normalized_url: string;
  registrable_domain: string;
  final_url: string | null;
  brand_name: string;
  business_category: string;
  market_code: string;
  language_code: string;
  created_at: string;
  updated_at: string;
}

export type DiagnosticRunRow = {
  id: string;
  site_id: string;
  lead_id: string | null;
  diagnostic_type: "visibility" | "process" | "villa-response";
  public_token_hash: string;
  status: string;
  stage: string | null;
  methodology_version: string;
  scoring_version: string;
  prompt_set_version: string | null;
  requested_at: string;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  coverage: number | null;
  confidence: "high" | "medium" | "low" | null;
  error_code: string | null;
  error_summary: string | null;
  idempotency_key: string | null;
  feature_flags: Record<string, boolean> | null;
  created_at: string;
  updated_at: string;
}

export type ReportRow = {
  id: string;
  run_id: string;
  summary_json: Record<string, unknown>;
  full_json: Record<string, unknown>;
  generated_at: string;
  unlocked_at: string | null;
  locale: string;
  report_version: string;
}

/**
 * Type aliases, not interfaces, all the way down. `GenericSchema` types
 * `Tables` as `Record<string, GenericTable>`, and TypeScript only gives
 * *anonymous object types* an implicit index signature — an interface never
 * satisfies that constraint. Declaring these as interfaces makes the schema
 * silently fail `extends GenericSchema` and every query row becomes `never`.
 */
export type DiagnosticsTables = {
  leads: Table<LeadRow>;
  sites: Table<SiteRow>;
  diagnostic_runs: Table<DiagnosticRunRow>;
  reports: Table<ReportRow>;
};

/**
 * Flattened through a mapped type on purpose. A bare `DiagnosticsTables &
 * RadarTables` intersection is not eligible for an implicit index signature
 * either, so it fails `Record<string, GenericTable>` exactly like an interface
 * does. Mapping over the keys produces a single anonymous object type, which is.
 */
type Flatten<T> = { [Key in keyof T]: T[Key] };

export type PublicTables = Flatten<DiagnosticsTables & RadarTables>;

export interface Database {
  public: {
    Tables: PublicTables;
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
