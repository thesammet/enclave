import { beforeEach, describe, expect, it } from 'vitest'
import { FakeEngine } from '../data/fake-engine'
import { useStore } from '../store/store'
import { boardTools } from './board-tools'
import { runTool, type ToolContext } from './registry'

const call = (name: string, args: unknown, ctx: ToolContext) => {
  const t = boardTools.find((d) => d.name === name)
  if (!t) throw new Error(`no tool ${name}`)
  return runTool(t, args, ctx)
}

let engine: FakeEngine
let ctx: ToolContext

beforeEach(() => {
  useStore.setState(useStore.getInitialState(), true)
  engine = new FakeEngine()
  ctx = { engine, store: useStore }
})

describe('board tools', () => {
  it('exposes exactly three tools', () => {
    expect(boardTools.map((t) => t.name).sort()).toEqual([
      'read_dashboard',
      'set_global_filter',
      'undo',
    ])
  })

  it('read_dashboard says the board is empty', async () => {
    expect(await call('read_dashboard', {}, ctx)).toContain('empty')
  })

  it('read_dashboard lists cards with their ids, kinds and queries', async () => {
    const id = useStore.getState().addCard({
      kind: 'chart',
      title: 'Sales',
      span: 2,
      chartType: 'bar',
      x: 'region',
      y: 'total',
      sql: 'SELECT region, sum(amount) AS total FROM data GROUP BY 1',
    })
    const out = await call('read_dashboard', {}, ctx)
    expect(out).toContain(id)
    expect(out).toContain('Sales')
    expect(out).toContain('bar')
    expect(out).toContain('sum(amount)')
  })

  it('read_dashboard reports the active global filter', async () => {
    useStore.getState().setGlobalFilter("region = 'EMEA'")
    expect(await call('read_dashboard', {}, ctx)).toContain("region = 'EMEA'")
  })

  it('set_global_filter applies the where clause to the engine and the store', async () => {
    const out = await call('set_global_filter', { where: "region = 'EMEA'" }, ctx)
    expect(engine.filter).toBe("region = 'EMEA'")
    expect(useStore.getState().globalFilter).toBe("region = 'EMEA'")
    expect(out).toContain('EMEA')
  })

  it('set_global_filter with no where clause clears the filter', async () => {
    await call('set_global_filter', { where: "region = 'EMEA'" }, ctx)
    const out = await call('set_global_filter', {}, ctx)
    expect(engine.filter).toBeNull()
    expect(useStore.getState().globalFilter).toBeNull()
    expect(out).toContain('Cleared')
  })

  it('set_global_filter rejects a clause containing a statement keyword', async () => {
    const out = await call('set_global_filter', { where: '1=1; DROP TABLE raw' }, ctx)
    expect(out).toContain('Only SELECT')
    expect(useStore.getState().globalFilter).toBeNull()
  })

  it('undo reverts the last board change', async () => {
    useStore.getState().addCard({ kind: 'note', title: 'A', span: 1 })
    useStore.getState().addCard({ kind: 'note', title: 'B', span: 1 })
    const out = await call('undo', {}, ctx)
    expect(useStore.getState().cards.map((c) => c.title)).toEqual(['A'])
    expect(out).toContain('Undid')
  })

  it('undo re-applies the restored filter to the engine', async () => {
    await call('set_global_filter', { where: "region = 'EMEA'" }, ctx)
    await call('undo', {}, ctx)
    expect(engine.filter).toBeNull()
  })

  it('undo says so when there is nothing to undo', async () => {
    expect(await call('undo', {}, ctx)).toContain('Nothing')
  })
})
