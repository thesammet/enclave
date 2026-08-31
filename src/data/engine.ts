import type { QueryResult, Schema } from './types'

export interface QueryEngine {
  /** Load CSV text as the base table `raw` and expose it as the view `data`. */
  loadCsv(fileName: string, text: string): Promise<Schema>
  /** The schema of `data`, or null before a file is loaded. */
  getSchema(): Schema | null
  /** Run SQL. Card and tool SQL must reference `data`, never `raw`. */
  query(sql: string): Promise<QueryResult>
  /** Redefine `data` as `raw` filtered by `where`. Pass null to clear. */
  setFilter(where: string | null): Promise<void>
}
