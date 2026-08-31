import { describe, expect, it } from 'vitest'
import { FakeEngine } from './fake-engine'

describe('FakeEngine', () => {
  it('returns null schema before a file is loaded', () => {
    expect(new FakeEngine().getSchema()).toBeNull()
  })

  it('reports the schema it was constructed with after loadCsv', async () => {
    const e = new FakeEngine({
      table: 'data',
      rowCount: 3,
      columns: [{ name: 'region', type: 'string', sqlType: 'VARCHAR' }],
    })
    const schema = await e.loadCsv('x.csv', 'region\nEMEA\n')
    expect(schema.table).toBe('data')
    expect(schema.columns[0].name).toBe('region')
    expect(e.getSchema()).toEqual(schema)
  })

  it('returns scripted results and records the queries it saw', async () => {
    const e = new FakeEngine()
    e.script('SELECT 1', { columns: ['n'], rows: [[1]] })
    const out = await e.query('SELECT 1')
    expect(out.rows).toEqual([[1]])
    expect(e.queries).toEqual(['SELECT 1'])
  })

  it('throws on an unscripted query so tests cannot pass by accident', async () => {
    await expect(new FakeEngine().query('SELECT 2')).rejects.toThrow('unscripted query')
  })

  it('records the filter it was given', async () => {
    const e = new FakeEngine()
    await e.setFilter("region = 'EMEA'")
    expect(e.filter).toBe("region = 'EMEA'")
    await e.setFilter(null)
    expect(e.filter).toBeNull()
  })
})
