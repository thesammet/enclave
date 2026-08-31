import type { QueryEngine } from './engine'
import type { Schema } from './types'

/**
 * The analytics view the agent reads: order lines with their product joined in,
 * so a question about suppliers or categories is answerable without the agent
 * having to know the schema is split across two tables.
 */
export const STORE_BASE_SELECT = `SELECT o.*, p.name AS product_name, p.category,
       p.supplier, p.price AS unit_price
  FROM orders o LEFT JOIN products p USING (product_id)`

/**
 * One bootstrap per engine, ever. React runs effects twice under StrictMode,
 * and two concurrent loads race on the same DROP/CREATE — the loser fails with
 * "table already exists". Callers share the first flight instead.
 */
const inFlight = new WeakMap<QueryEngine, Promise<Schema>>()

export function bootstrapStore(engine: QueryEngine): Promise<Schema> {
  const existing = inFlight.get(engine)
  if (existing) return existing
  const run = load(engine).catch((e) => {
    inFlight.delete(engine)
    throw e
  })
  inFlight.set(engine, run)
  return run
}

/**
 * Northwind's data arrives from the store's own systems into this tab, and
 * stops here. Nothing about it is sent onward.
 */
async function load(engine: QueryEngine): Promise<Schema> {
  const [orders, products] = await Promise.all([
    fetch('/samples/orders.csv').then((r) => {
      if (!r.ok) throw new Error('Could not load the store order data.')
      return r.text()
    }),
    fetch('/samples/products.csv').then((r) => {
      if (!r.ok) throw new Error('Could not load the product catalogue.')
      return r.text()
    }),
  ])

  await engine.loadTable('orders', orders)
  await engine.loadTable('products', products)
  return engine.setBase(STORE_BASE_SELECT)
}
