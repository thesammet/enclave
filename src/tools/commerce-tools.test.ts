import { beforeEach, describe, expect, it } from 'vitest'
import { FakeEngine } from '../data/fake-engine'
import { useApprovals } from '../store/approvals'
import { useCommerce } from '../store/commerce'
import { useStore } from '../store/store'
import { commerceTools } from './commerce-tools'
import { runTool, type ToolContext } from './registry'

const call = (name: string, args: unknown, ctx: ToolContext) => {
  const t = commerceTools.find((d) => d.name === name)
  if (!t) throw new Error(`no tool ${name}`)
  return runTool(t, args, ctx)
}

const PRODUCT_COLS = ['product_id', 'name', 'category', 'supplier', 'price', 'stock', 'reorder_level']
const AURORA = ['SKU-1001', 'Nimbus Wireless Earbuds', 'Electronics', 'Aurora Supply', 199, 0, 60]

const lookup = (query: string) =>
  `SELECT product_id, name, category, supplier, price, stock, reorder_level FROM products
     WHERE product_id = '${query}' OR lower(name) LIKE '%${query.toLowerCase()}%'
     LIMIT 5`

let engine: FakeEngine
let ctx: ToolContext

beforeEach(() => {
  useStore.setState(useStore.getInitialState(), true)
  useApprovals.setState(useApprovals.getInitialState(), true)
  useCommerce.setState(useCommerce.getInitialState(), true)
  engine = new FakeEngine()
  ctx = { engine, store: useStore }
})

/** Approves (or rejects) the next request as soon as it appears. */
function autoDecide(approved: boolean) {
  const stop = useApprovals.subscribe((s) => {
    const [first] = s.pending
    if (first) useApprovals.getState().decide(first.id, approved)
  })
  return stop
}

describe('commerce tools', () => {
  it('exposes six tools', () => {
    expect(commerceTools.map((t) => t.name).sort()).toEqual([
      'create_restock_order', 'get_product', 'list_low_stock',
      'list_restock_orders', 'search_orders', 'set_product_price',
    ])
  })

  it('marks only the reading tools read-only', () => {
    const writers = commerceTools.filter((t) => !t.readOnly).map((t) => t.name).sort()
    expect(writers).toEqual(['create_restock_order', 'set_product_price'])
  })

  it('get_product reports stock against the reorder level', async () => {
    engine.script(lookup('SKU-1001'), { columns: PRODUCT_COLS, rows: [AURORA] })
    const out = await call('get_product', { query: 'SKU-1001' }, ctx)
    expect(out).toContain('Nimbus Wireless Earbuds')
    expect(out).toContain('Aurora Supply')
    expect(out).toContain('Stock: 0 (reorder at 60)')
  })

  it('get_product asks the agent to disambiguate a name that matches several', async () => {
    engine.script(lookup('nimbus'), {
      columns: PRODUCT_COLS,
      rows: [AURORA, ['SKU-1002', 'Nimbus Charging Dock', 'Electronics', 'Aurora Supply', 149, 0, 50]],
    })
    const out = await call('get_product', { query: 'nimbus' }, ctx)
    expect(out).toContain('SKU-1001')
    expect(out).toContain('SKU-1002')
    expect(out).toContain('product_id')
  })

  it('get_product suggests a way forward when nothing matches', async () => {
    engine.script(lookup('nope'), { columns: PRODUCT_COLS, rows: [] })
    expect(await call('get_product', { query: 'nope' }, ctx)).toContain('list_low_stock')
  })

  it('list_low_stock says so when nothing is low', async () => {
    engine.script(
      `SELECT product_id, name, supplier, stock, reorder_level
         FROM products WHERE stock <= reorder_level
         ORDER BY stock - reorder_level ASC`,
      { columns: ['product_id'], rows: [] },
    )
    expect(await call('list_low_stock', {}, ctx)).toContain('above its reorder level')
  })

  it('search_orders builds a filtered query and budgets the result', async () => {
    engine.script(
      `SELECT o.order_id, o.order_date, o.region, o.channel, p.name AS product,
                o.units, o.revenue, o.status
         FROM orders o LEFT JOIN products p USING (product_id)
         WHERE o.region = 'EMEA' AND o.order_date >= '2025-03-01'
         ORDER BY o.order_date DESC LIMIT 20`,
      { columns: ['order_id'], rows: [['ORD-1']] },
    )
    const out = await call('search_orders', { region: 'EMEA', from: '2025-03-01' }, ctx)
    expect(out).toContain('ORD-1')
  })

  it('search_orders caps the limit at 50', async () => {
    engine.script(
      `SELECT o.order_id, o.order_date, o.region, o.channel, p.name AS product,
                o.units, o.revenue, o.status
         FROM orders o LEFT JOIN products p USING (product_id)
         
         ORDER BY o.order_date DESC LIMIT 50`,
      { columns: ['order_id'], rows: [] },
    )
    await call('search_orders', { limit: 9999 }, ctx)
    expect(engine.queries[0]).toContain('LIMIT 50')
  })

  it('create_restock_order waits for approval and changes nothing until it comes', async () => {
    engine.script(lookup('SKU-1001'), { columns: PRODUCT_COLS, rows: [AURORA] })
    const promise = call('create_restock_order', { product_id: 'SKU-1001', quantity: 200, reason: 'Stockout' }, ctx)
    await new Promise((r) => setTimeout(r, 0))

    const [pending] = useApprovals.getState().pending
    expect(pending.summary).toContain('200 units')
    expect(pending.detail.find(([k]) => k === 'Reason')?.[1]).toBe('Stockout')
    expect(useCommerce.getState().restockOrders).toHaveLength(0)
    expect(engine.mutations).toHaveLength(0)

    useApprovals.getState().decide(pending.id, true)
    const out = await promise
    expect(out).toContain('Approved')
    expect(useCommerce.getState().restockOrders).toHaveLength(1)
    expect(engine.mutations[0]).toContain('stock = stock + 200')
  })

  it('create_restock_order changes nothing when the operator declines', async () => {
    engine.script(lookup('SKU-1001'), { columns: PRODUCT_COLS, rows: [AURORA] })
    const stop = autoDecide(false)
    const out = await call('create_restock_order', { product_id: 'SKU-1001', quantity: 200, reason: 'x' }, ctx)
    stop()
    expect(out).toContain('declined')
    expect(useCommerce.getState().restockOrders).toHaveLength(0)
    expect(engine.mutations).toHaveLength(0)
  })

  it('create_restock_order rejects an absurd quantity before asking anyone', async () => {
    engine.script(lookup('SKU-1001'), { columns: PRODUCT_COLS, rows: [AURORA] })
    const out = await call('create_restock_order', { product_id: 'SKU-1001', quantity: 99999, reason: 'x' }, ctx)
    expect(out).toContain('between 1 and 10000')
    expect(useApprovals.getState().pending).toHaveLength(0)
  })

  it('set_product_price shows the operator the size of the change', async () => {
    engine.script(lookup('SKU-1001'), { columns: PRODUCT_COLS, rows: [AURORA] })
    const promise = call('set_product_price', { product_id: 'SKU-1001', price: 149, reason: 'Clear stock' }, ctx)
    await new Promise((r) => setTimeout(r, 0))
    const [pending] = useApprovals.getState().pending
    expect(pending.detail.find(([k]) => k === 'Change')?.[1]).toBe('-25.1%')
    useApprovals.getState().decide(pending.id, true)
    expect(await promise).toContain('149.00')
    expect(engine.mutations[0]).toContain('price = 149')
  })

  it('set_product_price refuses a non-positive price', async () => {
    engine.script(lookup('SKU-1001'), { columns: PRODUCT_COLS, rows: [AURORA] })
    expect(await call('set_product_price', { product_id: 'SKU-1001', price: 0, reason: 'x' }, ctx))
      .toContain('positive number')
  })

  it('list_restock_orders reports what has been raised', async () => {
    useCommerce.getState().addRestockOrder({
      productId: 'SKU-1001', productName: 'Nimbus Wireless Earbuds', quantity: 200, createdBy: 'agent',
    })
    const out = await call('list_restock_orders', {}, ctx)
    expect(out).toContain('200 × Nimbus Wireless Earbuds')
  })
})
