import { budget } from '../data/budget'
import { requestApproval } from '../store/approvals'
import { useCommerce } from '../store/commerce'
import type { ToolContext, ToolDef } from './registry'

const str = (v: unknown) => String(v ?? '').replace(/'/g, "''")
const limits = (ctx: ToolContext) => ctx.store.getState().resultBudget

/** Looks a product up by id or by a fragment of its name. */
async function findProduct(ctx: ToolContext, query: string) {
  const res = await ctx.engine.query(
    `SELECT product_id, name, category, supplier, price, stock, reorder_level FROM products
     WHERE product_id = '${str(query)}' OR lower(name) LIKE '%${str(query).toLowerCase()}%'
     LIMIT 5`,
  )
  if (res.rows.length === 0) {
    throw new Error(
      `No product matches "${query}". Try list_low_stock, or search by a word from the product name.`,
    )
  }
  if (res.rows.length > 1) {
    const names = res.rows.map((r) => `${r[0]} (${r[1]})`).join(', ')
    throw new Error(`"${query}" matches several products: ${names}. Name one by its product_id.`)
  }
  const [id, name, category, supplier, price, stock, reorder] = res.rows[0]
  return {
    id: String(id),
    name: String(name),
    category: String(category),
    supplier: String(supplier),
    price: Number(price),
    stock: Number(stock),
    reorder: Number(reorder),
  }
}

export const commerceTools: ToolDef[] = [
  {
    name: 'search_orders',
    description:
      'Search Northwind order lines by region, status, product or date range. Returns the ' +
      'matching orders, newest first. Use this to see the individual orders behind a trend ' +
      'you found in the analytics board.',
    inputSchema: {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'EMEA, AMER, APAC or LATAM' },
        status: { type: 'string', enum: ['fulfilled', 'refunded', 'cancelled'] },
        product_id: { type: 'string' },
        from: { type: 'string', description: 'Inclusive start date, YYYY-MM-DD' },
        to: { type: 'string', description: 'Exclusive end date, YYYY-MM-DD' },
        limit: { type: 'number', description: 'How many to return, up to 50' },
      },
      additionalProperties: false,
    },
    readOnly: true,
    async execute(args: Record<string, string | number>, ctx) {
      const where: string[] = []
      if (args.region) where.push(`o.region = '${str(args.region)}'`)
      if (args.status) where.push(`o.status = '${str(args.status)}'`)
      if (args.product_id) where.push(`o.product_id = '${str(args.product_id)}'`)
      if (args.from) where.push(`o.order_date >= '${str(args.from)}'`)
      if (args.to) where.push(`o.order_date < '${str(args.to)}'`)
      const n = Math.max(1, Math.min(50, Number(args.limit) || 20))

      const res = await ctx.engine.query(
        `SELECT o.order_id, o.order_date, o.region, o.channel, p.name AS product,
                o.units, o.revenue, o.status
         FROM orders o LEFT JOIN products p USING (product_id)
         ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
         ORDER BY o.order_date DESC LIMIT ${n}`,
      )
      return budget(res, limits(ctx)).text
    },
  },

  {
    name: 'get_product',
    description:
      'Look one product up by its product_id or by part of its name, and return its category, ' +
      'supplier, price, current stock and reorder level.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'A product_id, or part of the name' } },
      required: ['query'],
      additionalProperties: false,
    },
    readOnly: true,
    async execute({ query }: { query: string }, ctx) {
      const p = await findProduct(ctx, query)
      return (
        `${p.id} — ${p.name}\nCategory: ${p.category}\nSupplier: ${p.supplier}\n` +
        `Price: ${p.price}\nStock: ${p.stock} (reorder at ${p.reorder})`
      )
    },
  },

  {
    name: 'list_low_stock',
    description:
      'List every product at or below its reorder level, worst first. This is where a supply ' +
      'problem shows up as a fact rather than an inference.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    readOnly: true,
    async execute(_args, ctx) {
      const res = await ctx.engine.query(
        `SELECT product_id, name, supplier, stock, reorder_level
         FROM products WHERE stock <= reorder_level
         ORDER BY stock - reorder_level ASC`,
      )
      if (res.rows.length === 0) return 'Every product is above its reorder level.'
      return budget(res, limits(ctx)).text
    },
  },

  {
    name: 'list_restock_orders',
    description: 'List the restock orders raised in this session, newest first.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    readOnly: true,
    async execute() {
      const orders = useCommerce.getState().restockOrders
      if (orders.length === 0) return 'No restock orders have been raised.'
      return orders
        .map((o) => `${o.id}: ${o.quantity} × ${o.productName} (${o.productId}), by ${o.createdBy}`)
        .join('\n')
    },
  },

  {
    name: 'create_restock_order',
    description:
      'Raise a restock order for a product. This changes the business, so it is proposed to ' +
      'the operator and only goes through once they approve it on screen. Explain your reasoning ' +
      'in the reason field — they read it before deciding.',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: { type: 'string' },
        quantity: { type: 'number', description: 'Units to order, 1-10000' },
        reason: { type: 'string', description: 'Why this restock is needed' },
      },
      required: ['product_id', 'quantity', 'reason'],
      additionalProperties: false,
    },
    async execute(
      { product_id, quantity, reason }: { product_id: string; quantity: number; reason: string },
      ctx,
    ) {
      const p = await findProduct(ctx, product_id)
      const qty = Math.round(Number(quantity))
      if (!Number.isFinite(qty) || qty < 1 || qty > 10000) {
        throw new Error(`Quantity must be between 1 and 10000, not ${quantity}.`)
      }

      const approved = await requestApproval({
        tool: 'create_restock_order',
        summary: `Order ${qty} units of ${p.name}`,
        detail: [
          ['Product', `${p.id} — ${p.name}`],
          ['Supplier', p.supplier],
          ['Current stock', `${p.stock} (reorder at ${p.reorder})`],
          ['Quantity', String(qty)],
          ['Reason', reason],
        ],
      })

      if (!approved) {
        return `The operator declined the restock order for ${p.name}. Nothing was changed.`
      }

      const order = useCommerce.getState().addRestockOrder({
        productId: p.id,
        productName: p.name,
        quantity: qty,
        createdBy: 'agent',
      })
      await ctx.engine.mutate(
        `UPDATE products SET stock = stock + ${qty} WHERE product_id = '${str(p.id)}'`,
      )
      return `Approved. Restock order ${order.id} raised for ${qty} × ${p.name}; stock is now ${
        p.stock + qty
      }.`
    },
  },

  {
    name: 'set_product_price',
    description:
      'Change a product\'s price. Proposed to the operator and applied only once they approve. ' +
      'Say why in the reason field.',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: { type: 'string' },
        price: { type: 'number' },
        reason: { type: 'string' },
      },
      required: ['product_id', 'price', 'reason'],
      additionalProperties: false,
    },
    async execute(
      { product_id, price, reason }: { product_id: string; price: number; reason: string },
      ctx,
    ) {
      const p = await findProduct(ctx, product_id)
      const next = Number(price)
      if (!Number.isFinite(next) || next <= 0) {
        throw new Error(`Price must be a positive number, not ${price}.`)
      }

      const delta = ((next - p.price) / p.price) * 100
      const approved = await requestApproval({
        tool: 'set_product_price',
        summary: `Change ${p.name} from ${p.price} to ${next.toFixed(2)}`,
        detail: [
          ['Product', `${p.id} — ${p.name}`],
          ['Current price', String(p.price)],
          ['New price', next.toFixed(2)],
          ['Change', `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`],
          ['Reason', reason],
        ],
      })

      if (!approved) return `The operator declined the price change for ${p.name}.`

      await ctx.engine.mutate(
        `UPDATE products SET price = ${next} WHERE product_id = '${str(p.id)}'`,
      )
      useCommerce.getState().bump()
      return `Approved. ${p.name} is now priced at ${next.toFixed(2)}.`
    },
  },
]

