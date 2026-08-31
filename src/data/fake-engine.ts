import type { QueryEngine } from './engine'
import type { QueryResult, Schema } from './types'

/**
 * Test double for QueryEngine. Queries must be scripted in advance: an
 * unscripted query throws, so a test can never pass because a tool happened
 * to build SQL nobody checked.
 */
export class FakeEngine implements QueryEngine {
  schema: Schema | null = null
  filter: string | null = null
  base: string | null = null
  queries: string[] = []
  mutations: string[] = []
  tables: Record<string, string> = {}
  private scripted = new Map<string, QueryResult>()
  private readonly onLoad?: Schema

  constructor(onLoad?: Schema) {
    this.onLoad = onLoad
  }

  script(sql: string, result: QueryResult): void {
    this.scripted.set(sql.trim(), result)
  }

  async loadCsv(_fileName: string, _text: string): Promise<Schema> {
    this.schema = this.onLoad ?? { table: 'data', rowCount: 0, columns: [] }
    return this.schema
  }

  getSchema(): Schema | null {
    return this.schema
  }

  async query(sql: string): Promise<QueryResult> {
    this.queries.push(sql)
    const hit = this.scripted.get(sql.trim())
    if (!hit) throw new Error(`unscripted query: ${sql}`)
    return hit
  }

  async loadTable(table: string, text: string): Promise<void> {
    this.tables[table] = text
  }

  async setBase(select: string): Promise<Schema> {
    this.base = select
    this.filter = null
    this.schema = this.onLoad ?? { table: 'data', rowCount: 0, columns: [] }
    return this.schema
  }

  async mutate(sql: string): Promise<void> {
    this.mutations.push(sql)
  }

  async setFilter(where: string | null): Promise<void> {
    this.filter = where
  }
}
