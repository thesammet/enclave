import type { QueryResult, Schema } from './types'

export interface QueryEngine {
  /** Load CSV text as the base table `raw` and expose it as the view `data`. */
  loadCsv(fileName: string, text: string): Promise<Schema>
  /** Register a named table (orders, products) without touching `data`. */
  loadTable(table: string, text: string): Promise<void>
  /**
   * Point the analytics view `data` at an arbitrary SELECT — for the store,
   * orders joined to their products. Any global filter wraps this.
   */
  setBase(select: string): Promise<Schema>
  /** The schema of `data`, or null before anything is loaded. */
  getSchema(): Schema | null
  /** Run SQL. Card and tool SQL must reference `data` or a named table. */
  query(sql: string): Promise<QueryResult>
  /** Run a statement that changes data. Never reachable from agent SQL. */
  mutate(sql: string): Promise<void>
  /** Redefine `data` as the base SELECT filtered by `where`. Null clears it. */
  setFilter(where: string | null): Promise<void>
}
