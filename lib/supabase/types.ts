/**
 * Hand-authored placeholder types mirroring supabase/migrations/*.sql.
 * Regenerate with `supabase gen types typescript` once a real project
 * exists (Decision Log D-005, NEEDS_OWNER) and replace this file —
 * do not hand-maintain both in parallel long-term.
 */

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
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
        };
        Insert: Partial<Database["public"]["Tables"]["leads"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["leads"]["Row"]>;
      };
      sites: {
        Row: {
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
        };
        Insert: Partial<Database["public"]["Tables"]["sites"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["sites"]["Row"]>;
      };
      diagnostic_runs: {
        Row: {
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
        };
        Insert: Partial<Database["public"]["Tables"]["diagnostic_runs"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["diagnostic_runs"]["Row"]>;
      };
      reports: {
        Row: {
          id: string;
          run_id: string;
          summary_json: Record<string, unknown>;
          full_json: Record<string, unknown>;
          generated_at: string;
          unlocked_at: string | null;
          locale: string;
          report_version: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reports"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["reports"]["Row"]>;
      };
    };
  };
}
