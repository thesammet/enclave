import * as duckdb from '@duckdb/duckdb-wasm'
import type { QueryEngine } from './engine'
import type { Column, ColumnType, QueryResult, Schema } from './types'

function toColumnType(sqlType: string): ColumnType {
  const t = sqlType.toUpperCase()
  if (/INT|DECIMAL|DOUBLE|FLOAT|REAL|HUGEINT|NUMERIC/.test(t)) return 'number'
  if (/DATE|TIME/.test(t)) return 'date'
  if (/BOOL/.test(t)) return 'boolean'
  return 'string'
}

/**
 * Arrow does not hand back plain numbers for every DuckDB type. Int64 arrives
 * as BigInt; aggregates like sum() over integers come back as DECIMAL(38,0),
 * which Arrow represents as a DecimalBigNum object whose String() form is the
 * exact value. Temporal types arrive as Date. Everything the UI and the tools
 * see must be a plain JSON value, so it is flattened here, once.
 */
export function normalise(v: unknown): unknown {
  if (typeof v === 'bigint') return Number(v)
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  if (v !== null && typeof v === 'object') {
    const s = String(v)
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s)
  }
  return v
}

export class DuckDbEngine implements QueryEngine {
  private db: duckdb.AsyncDuckDB | null = null
  private conn: duckdb.AsyncDuckDBConnection | null = null
  private schema: Schema | null = null
  private booting: Promise<duckdb.AsyncDuckDBConnection> | null = null

  private async init(): Promise<duckdb.AsyncDuckDBConnection> {
    if (this.conn) return this.conn
    if (this.booting) return this.booting

    this.booting = (async () => {
      const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles())
      const workerUrl = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' }),
      )
      const worker = new Worker(workerUrl)
      this.db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker)
      await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker)
      URL.revokeObjectURL(workerUrl)
      this.conn = await this.db.connect()
      return this.conn
    })()

    return this.booting
  }

  async loadCsv(fileName: string, text: string): Promise<Schema> {
    const conn = await this.init()
    await this.db!.registerFileText(fileName, text)
    await conn.query('DROP VIEW IF EXISTS data')
    await conn.query('DROP TABLE IF EXISTS raw')
    await conn.insertCSVFromPath(fileName, { name: 'raw', detect: true, header: true })
    await conn.query('CREATE VIEW data AS SELECT * FROM raw')
    return this.refreshSchema()
  }

  private async refreshSchema(): Promise<Schema> {
    const conn = await this.init()
    const desc = await conn.query('DESCRIBE data')
    const columns: Column[] = desc.toArray().map((r) => {
      const o = r.toJSON() as { column_name: string; column_type: string }
      return {
        name: String(o.column_name),
        type: toColumnType(String(o.column_type)),
        sqlType: String(o.column_type),
      }
    })
    const count = await conn.query('SELECT count(*)::BIGINT AS n FROM data')
    const rowCount = Number(normalise((count.toArray()[0].toJSON() as { n: unknown }).n))
    this.schema = { table: 'data', columns, rowCount }
    return this.schema
  }

  getSchema(): Schema | null {
    return this.schema
  }

  async query(sql: string): Promise<QueryResult> {
    const conn = await this.init()
    const res = await conn.query(sql)
    const columns = res.schema.fields.map((f) => f.name)
    const rows = res.toArray().map((r) => {
      const o = r.toJSON() as Record<string, unknown>
      return columns.map((c) => normalise(o[c]))
    })
    return { columns, rows }
  }

  /** One statement re-filters every card on the board: they all read `data`. */
  async setFilter(where: string | null): Promise<void> {
    const conn = await this.init()
    await conn.query(
      where
        ? `CREATE OR REPLACE VIEW data AS SELECT * FROM raw WHERE ${where}`
        : 'CREATE OR REPLACE VIEW data AS SELECT * FROM raw',
    )
    await this.refreshSchema()
  }
}
