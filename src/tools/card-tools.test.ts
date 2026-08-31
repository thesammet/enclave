import { beforeEach, describe, expect, it } from 'vitest'
import { FakeEngine } from '../data/fake-engine'
import { useStore } from '../store/store'
import { cardTools } from './card-tools'
import { runTool, type ToolContext } from './registry'

const call = (name: string, args: unknown, ctx: ToolContext) => {
  const t = cardTools.find((d) => d.name === name)
  if (!t) throw new Error(`no tool ${name}`)
  return runTool(t, args, ctx)
}

const schema = {
  table: 'data',
  rowCount: 3,
  columns: [
    { name: 'region', type: 'string' as const, sqlType: 'VARCHAR' },
    { name: 'amount', type: 'number' as const, sqlType: 'INTEGER' },
  ],
}

const GROUPED = 'SELECT region, sum(amount) AS total FROM data GROUP BY 1'

let engine: FakeEngine
let ctx: ToolContext

beforeEach(async () => {
  useStore.setState(useStore.getInitialState(), true)
  engine = new FakeEngine(schema)
  await engine.loadCsv('t.csv', '')
  useStore.getState().setSchema(schema)
  ctx = { engine, store: useStore }
})

const addChart = () => {
  engine.script(GROUPED, { columns: ['region', 'total'], rows: [['EMEA', 25]] })
  return call(
    'add_chart',
    { title: 'By region', chartType: 'bar', x: 'region', y: 'total', sql: GROUPED },
    ctx,
  )
}

describe('card tools', () => {
  it('exposes exactly nine tools', () => {
    expect(cardTools).toHaveLength(9)
  })

  it('add_kpi validates the query then stores a kpi card', async () => {
    engine.script('SELECT sum(amount) AS total FROM data', { columns: ['total'], rows: [[32]] })
    const out = await call(
      'add_kpi',
      { title: 'Total', sql: 'SELECT sum(amount) AS total FROM data' },
      ctx,
    )
    const cards = useStore.getState().cards
    expect(cards).toHaveLength(1)
    expect(cards[0].kind).toBe('kpi')
    expect(cards[0].title).toBe('Total')
    expect(out).toContain(cards[0].id)
  })

  it('add_kpi refuses a query it cannot run and adds no card', async () => {
    const out = await call('add_kpi', { title: 'Bad', sql: 'SELECT bogus FROM data' }, ctx)
    expect(out).toContain('Error')
    expect(useStore.getState().cards).toHaveLength(0)
  })

  it('add_chart stores chart configuration', async () => {
    await addChart()
    const card = useStore.getState().cards[0]
    expect(card.kind).toBe('chart')
    expect(card.chartType).toBe('bar')
    expect(card.x).toBe('region')
    expect(card.y).toBe('total')
  })

  it('add_chart rejects an unknown chart type', async () => {
    const out = await call(
      'add_chart',
      { title: 'X', chartType: 'donut', x: 'region', y: 'total', sql: 'SELECT 1' },
      ctx,
    )
    expect(out).toContain('donut')
    expect(useStore.getState().cards).toHaveLength(0)
  })

  it('add_chart rejects x or y columns absent from the query result', async () => {
    engine.script('SELECT region FROM data', { columns: ['region'], rows: [['EMEA']] })
    const out = await call(
      'add_chart',
      { title: 'X', chartType: 'bar', x: 'region', y: 'total', sql: 'SELECT region FROM data' },
      ctx,
    )
    expect(out).toContain('total')
    expect(useStore.getState().cards).toHaveLength(0)
  })

  it('add_table stores a table card', async () => {
    engine.script('SELECT * FROM data LIMIT 10', { columns: ['region'], rows: [['EMEA']] })
    await call('add_table', { title: 'Rows', sql: 'SELECT * FROM data LIMIT 10' }, ctx)
    expect(useStore.getState().cards[0].kind).toBe('table')
  })

  it('add_note stores markdown without touching the engine', async () => {
    await call('add_note', { markdown: '**March dipped 40%**' }, ctx)
    const card = useStore.getState().cards[0]
    expect(card.kind).toBe('note')
    expect(card.markdown).toContain('March')
    expect(engine.queries).toHaveLength(0)
  })

  it('update_card changes the title of an existing card', async () => {
    await call('add_note', { markdown: 'x' }, ctx)
    const id = useStore.getState().cards[0].id
    await call('update_card', { id, title: 'Renamed' }, ctx)
    expect(useStore.getState().cards[0].title).toBe('Renamed')
  })

  it('update_card reports an unknown id and lists the real ones', async () => {
    await call('add_note', { markdown: 'x' }, ctx)
    const out = await call('update_card', { id: 'nope', title: 'X' }, ctx)
    expect(out).toContain('nope')
    expect(out).toContain(useStore.getState().cards[0].id)
  })

  it('remove_card deletes it', async () => {
    await call('add_note', { markdown: 'x' }, ctx)
    const id = useStore.getState().cards[0].id
    await call('remove_card', { id }, ctx)
    expect(useStore.getState().cards).toHaveLength(0)
  })

  it('reorder_cards applies the given order', async () => {
    await call('add_note', { markdown: 'A', title: 'A' }, ctx)
    await call('add_note', { markdown: 'B', title: 'B' }, ctx)
    const [a, b] = useStore.getState().cards.map((c) => c.id)
    await call('reorder_cards', { ids: [b, a] }, ctx)
    expect(useStore.getState().cards.map((c) => c.title)).toEqual(['B', 'A'])
  })

  it('resize_card clamps the span to 1-3', async () => {
    await call('add_note', { markdown: 'x' }, ctx)
    const id = useStore.getState().cards[0].id
    await call('resize_card', { id, span: 9 }, ctx)
    expect(useStore.getState().cards[0].span).toBe(3)
  })

  it('highlight_points marks values on a chart card', async () => {
    await addChart()
    const id = useStore.getState().cards[0].id
    await call('highlight_points', { id, values: ['EMEA'] }, ctx)
    expect(useStore.getState().cards[0].highlights).toEqual(['EMEA'])
  })

  it('highlight_points refuses a non-chart card', async () => {
    await call('add_note', { markdown: 'x' }, ctx)
    const id = useStore.getState().cards[0].id
    const out = await call('highlight_points', { id, values: ['x'] }, ctx)
    expect(out).toContain('chart')
  })
})
