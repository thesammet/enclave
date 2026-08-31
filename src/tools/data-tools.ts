import { budget } from '../data/budget'
import { type ToolContext, type ToolDef, assertSelectOnly } from './registry'

const q = (ident: string) => `"${ident.replace(/"/g, '""')}"`

const limits = (ctx: ToolContext) => ctx.store.getState().resultBudget

function requireSchema(ctx: ToolContext) {
  const schema = ctx.engine.getSchema()
  if (!schema) {
    throw new Error('No dataset is loaded. Ask the user to drop a CSV file onto the page.')
  }
  return schema
}

export const dataTools: ToolDef[] = [
  {
    name: 'get_schema',
    description:
      'Describe the loaded dataset: every column with its SQL type, and the total row count. ' +
      'Call this first. The queryable table is always named `data`.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    readOnly: true,
    async execute(_args, ctx) {
      const schema = requireSchema(ctx)
      const cols = schema.columns.map((c) => `${c.name} (${c.sqlType})`).join(', ')
      return `Table: data\nRows: ${schema.rowCount}\nColumns: ${cols}`
    },
  },

  {
    name: 'profile_column',
    description:
      'Profile one column: null count, distinct count, min, max, and the ten most frequent ' +
      'values. Use this to understand a column before charting it.',
    inputSchema: {
      type: 'object',
      properties: {
        column: {
          type: 'string',
          description: 'Column name, exactly as get_schema reports it',
        },
      },
      required: ['column'],
      additionalProperties: false,
    },
    readOnly: true,
    async execute({ column }: { column: string }, ctx) {
      const schema = requireSchema(ctx)
      if (!schema.columns.some((c) => c.name === column)) {
        return `No column named "${column}". Available columns: ${schema.columns
          .map((c) => c.name)
          .join(', ')}`
      }
      const stats = await ctx.engine.query(
        `SELECT count(*)::BIGINT AS n, count(${q(column)})::BIGINT AS non_null, ` +
          `count(DISTINCT ${q(column)})::BIGINT AS distinct_values, ` +
          `min(${q(column)})::VARCHAR AS min_value, max(${q(column)})::VARCHAR AS max_value FROM data`,
      )
      const top = await ctx.engine.query(
        `SELECT ${q(column)} AS value, count(*)::BIGINT AS n FROM data GROUP BY 1 ORDER BY n DESC LIMIT 10`,
      )
      return `Profile of "${column}":\n${budget(stats, limits(ctx)).text}\nMost frequent values:\n${
        budget(top, limits(ctx)).text
      }`
    },
  },

  {
    name: 'sample_rows',
    description:
      'Return a handful of raw rows so you can see the shape of the data. Capped at 20 rows. ' +
      'Prefer aggregate queries via run_sql — this tool exists only for orientation.',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number', description: 'How many rows, 1-20' } },
      additionalProperties: false,
    },
    readOnly: true,
    async execute({ limit = 5 }: { limit?: number }, ctx) {
      requireSchema(ctx)
      const n = Math.max(1, Math.min(20, Math.floor(limit)))
      return budget(await ctx.engine.query(`SELECT * FROM data LIMIT ${n}`), limits(ctx)).text
    },
  },

  {
    name: 'run_sql',
    description:
      'Run a read-only DuckDB SQL SELECT against the table `data` and return the result. ' +
      'This is your main instrument. Results are capped at 50 rows and 4 KB, so aggregate ' +
      'rather than selecting raw rows. Note that `data` already reflects any global filter.',
    inputSchema: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'A SELECT statement referencing the table `data`' },
      },
      required: ['sql'],
      additionalProperties: false,
    },
    readOnly: true,
    async execute({ sql }: { sql: string }, ctx) {
      requireSchema(ctx)
      assertSelectOnly(sql)
      return budget(await ctx.engine.query(sql), limits(ctx)).text
    },
  },
]
