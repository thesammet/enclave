import { beforeEach, describe, expect, it } from 'vitest'
import { FakeEngine } from '../data/fake-engine'
import { useStore } from '../store/store'
import { dataTools } from './data-tools'
import { runTool, type ToolContext } from './registry'

const tool = (name: string) => {
  const t = dataTools.find((d) => d.name === name)
  if (!t) throw new Error(`no tool ${name}`)
  return { execute: (args: unknown, c: ToolContext) => runTool(t, args, c) }
}

const schema = {
  table: 'data',
  rowCount: 3,
  columns: [
    { name: 'region', type: 'string' as const, sqlType: 'VARCHAR' },
    { name: 'amount', type: 'number' as const, sqlType: 'INTEGER' },
  ],
}

let engine: FakeEngine
let ctx: ToolContext

beforeEach(async () => {
  useStore.setState(useStore.getInitialState(), true)
  engine = new FakeEngine(schema)
  await engine.loadCsv('t.csv', '')
  useStore.getState().setSchema(schema)
  ctx = { engine, store: useStore }
})

describe('data tools', () => {
  it('exposes exactly four tools', () => {
    expect(dataTools.map((t) => t.name).sort()).toEqual([
      'get_schema',
      'profile_column',
      'run_sql',
      'sample_rows',
    ])
  })

  it('marks every data tool read-only', () => {
    expect(dataTools.every((t) => t.readOnly)).toBe(true)
  })

  it('get_schema reports columns, types and row count', async () => {
    const out = await tool('get_schema').execute({}, ctx)
    expect(out).toContain('region')
    expect(out).toContain('VARCHAR')
    expect(out).toContain('3')
  })

  it('get_schema explains itself when no file is loaded', async () => {
    const empty = { engine: new FakeEngine(), store: useStore }
    const out = await tool('get_schema').execute({}, empty)
    expect(out).toContain('No dataset')
  })

  it('profile_column queries stats for the named column', async () => {
    engine.script(
      'SELECT count(*)::BIGINT AS n, count("region")::BIGINT AS non_null, count(DISTINCT "region")::BIGINT AS distinct_values, min("region")::VARCHAR AS min_value, max("region")::VARCHAR AS max_value FROM data',
      {
        columns: ['n', 'non_null', 'distinct_values', 'min_value', 'max_value'],
        rows: [[3, 3, 2, 'APAC', 'EMEA']],
      },
    )
    engine.script(
      'SELECT "region" AS value, count(*)::BIGINT AS n FROM data GROUP BY 1 ORDER BY n DESC LIMIT 10',
      { columns: ['value', 'n'], rows: [['EMEA', 2], ['APAC', 1]] },
    )
    const out = await tool('profile_column').execute({ column: 'region' }, ctx)
    expect(out).toContain('EMEA')
    expect(out).toContain('distinct_values')
  })

  it('profile_column rejects a column that is not in the schema', async () => {
    const out = await tool('profile_column').execute({ column: 'nope' }, ctx)
    expect(out).toContain('nope')
    expect(out).toContain('region')
  })

  it('sample_rows caps the requested count at 20', async () => {
    engine.script('SELECT * FROM data LIMIT 20', { columns: ['region'], rows: [['EMEA']] })
    await tool('sample_rows').execute({ limit: 5000 }, ctx)
    expect(engine.queries[0]).toBe('SELECT * FROM data LIMIT 20')
  })

  it('run_sql returns budgeted results', async () => {
    engine.script('SELECT * FROM data', {
      columns: ['region'],
      rows: Array.from({ length: 500 }, () => ['EMEA']),
    })
    const out = await tool('run_sql').execute({ sql: 'SELECT * FROM data' }, ctx)
    expect(out).toContain('showing 50 of 500')
  })

  it('run_sql refuses statements that are not SELECT', async () => {
    const out = await tool('run_sql').execute({ sql: 'DROP TABLE raw' }, ctx)
    expect(out).toContain('Only SELECT')
    expect(engine.queries).toHaveLength(0)
  })

  it('run_sql returns the database error rather than throwing', async () => {
    const out = await tool('run_sql').execute({ sql: 'SELECT nope FROM data' }, ctx)
    expect(out).toContain('unscripted query')
  })
})
