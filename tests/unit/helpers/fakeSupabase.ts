/**
 * A recording fake of the PostgREST query builder.
 *
 * Not a Postgres emulator, on purpose. Re-implementing upsert semantics,
 * partial unique indexes and conflict resolution would mean testing the fake
 * rather than the store. What this catches instead is the class of bug that is
 * actually plausible here and invisible to the type checker: a wrong column
 * name, a wrong `onConflict` target, a nullable filter written as `.eq(col,
 * null)` instead of `.is(col, null)`, or a payload that includes a column it
 * must leave alone.
 *
 * Every call is recorded so a test can assert the shape of the query the store
 * issued, and canned responses are keyed by table so mapping can be checked
 * in both directions.
 */

export interface RecordedFilter {
  op: "eq" | "is" | "in";
  column: string;
  value: unknown;
}

export interface RecordedCall {
  table: string;
  operation: "select" | "insert" | "update" | "upsert";
  payload: unknown;
  onConflict: string | null;
  filters: RecordedFilter[];
  head: boolean;
  order: { column: string; ascending: boolean } | null;
  limit: number | null;
}

export interface CannedResponse {
  data?: unknown;
  error?: { code?: string; message?: string } | null;
  count?: number;
}

type Responder = (call: RecordedCall) => CannedResponse;

class FakeQueryBuilder implements PromiseLike<CannedResponse> {
  private readonly call: RecordedCall;

  constructor(
    table: string,
    operation: RecordedCall["operation"],
    payload: unknown,
    onConflict: string | null,
    private readonly calls: RecordedCall[],
    private readonly responder: Responder,
  ) {
    this.call = {
      table,
      operation,
      payload,
      onConflict,
      filters: [],
      head: false,
      order: null,
      limit: null,
    };
    this.calls.push(this.call);
  }

  select(_columns?: string, options?: { count?: string; head?: boolean }): this {
    if (options?.head) this.call.head = true;
    return this;
  }

  eq(column: string, value: unknown): this {
    this.call.filters.push({ op: "eq", column, value });
    return this;
  }

  is(column: string, value: unknown): this {
    this.call.filters.push({ op: "is", column, value });
    return this;
  }

  in(column: string, value: unknown): this {
    this.call.filters.push({ op: "in", column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.call.order = { column, ascending: options?.ascending !== false };
    return this;
  }

  limit(count: number): this {
    this.call.limit = count;
    return this;
  }

  /** PostgREST returns the single row itself, not an array, for these. */
  single(): Promise<CannedResponse> {
    return this.resolveSingle();
  }

  maybeSingle(): Promise<CannedResponse> {
    return this.resolveSingle();
  }

  private async resolveSingle(): Promise<CannedResponse> {
    const response = this.responder(this.call);
    if (Array.isArray(response.data)) {
      return { ...response, data: response.data[0] ?? null };
    }
    return response;
  }

  then<TResult1 = CannedResponse, TResult2 = never>(
    onfulfilled?: ((value: CannedResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.responder(this.call)).then(onfulfilled, onrejected);
  }
}

export class FakeSupabaseClient {
  readonly calls: RecordedCall[] = [];

  constructor(private readonly responder: Responder = () => ({ data: [], error: null })) {}

  from(table: string) {
    const make = (
      operation: RecordedCall["operation"],
      payload: unknown = null,
      onConflict: string | null = null,
    ) => new FakeQueryBuilder(table, operation, payload, onConflict, this.calls, this.responder);

    return {
      select: (columns?: string, options?: { count?: string; head?: boolean }) =>
        make("select").select(columns, options),
      insert: (payload: unknown) => make("insert", payload),
      update: (payload: unknown) => make("update", payload),
      upsert: (payload: unknown, options?: { onConflict?: string }) =>
        make("upsert", payload, options?.onConflict ?? null),
    };
  }

  /** All recorded calls against one table, in order. */
  callsFor(table: string): RecordedCall[] {
    return this.calls.filter((call) => call.table === table);
  }

  lastCall(table: string): RecordedCall {
    const forTable = this.callsFor(table);
    const last = forTable[forTable.length - 1];
    if (!last) throw new Error(`No calls recorded for ${table}`);
    return last;
  }
}

/** Builds a responder that answers per table, falling back to an empty result. */
export function respondWith(byTable: Record<string, CannedResponse | Responder>): Responder {
  return (call) => {
    const entry = byTable[call.table];
    if (!entry) return { data: [], error: null };
    return typeof entry === "function" ? entry(call) : entry;
  };
}
