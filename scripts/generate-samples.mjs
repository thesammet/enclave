// Generates Northwind Trading Co.'s demo dataset, served from public/samples.
// Deterministic, so the demo is identical on every run.
//
// The data carries one causally complete story for the agent to uncover:
//   Aurora Supply's four Electronics products went out of stock in the EMEA
//   warehouse through March 2025. EMEA orders for them collapse that month,
//   which drags EMEA revenue down ~68%. Those products still sit at zero
//   stock, below their reorder level — so the fix is a restock order.
//
//   node scripts/generate-samples.mjs
import { writeFileSync } from 'node:fs'

let seed = 20260831
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
const pick = (a) => a[Math.floor(rnd() * a.length)]

const days = []
for (let d = new Date('2024-01-01'); d <= new Date('2025-12-31'); d.setDate(d.getDate() + 1)) {
  days.push(d.toISOString().slice(0, 10))
}

const REGIONS = ['EMEA', 'AMER', 'APAC', 'LATAM']
const CHANNELS = ['Web', 'Retail', 'Wholesale']
const STATUSES = ['fulfilled', 'fulfilled', 'fulfilled', 'fulfilled', 'refunded', 'cancelled']

// --- products -------------------------------------------------------------
const CATALOGUE = [
  ['Electronics', 'Aurora Supply', ['Nimbus Wireless Earbuds', 'Nimbus Charging Dock', 'Halo Smart Bulb 4-pack', 'Halo Motion Sensor']],
  ['Electronics', 'Kestrel Devices', ['Vector Bluetooth Speaker', 'Vector Soundbar']],
  ['Apparel', 'Loom & Co', ['Merino Crew Sweater', 'Rain Shell Jacket', 'Everyday Chino']],
  ['Home', 'Hearth Goods', ['Cast Iron Skillet', 'Linen Duvet Set', 'Stoneware Mug Set']],
  ['Beauty', 'Verdant Labs', ['Rosewater Toner', 'Clay Mask', 'Repair Serum']],
  ['Outdoor', 'Ridgeline', ['Trail Daypack 22L', 'Insulated Bottle', 'Camp Stove']],
  ['Grocery', 'Field & Vine', ['Single-Origin Coffee 1kg', 'Olive Oil 750ml', 'Wildflower Honey']],
]

/** The four products whose EMEA stockout caused the March collapse. */
const STOCKED_OUT = new Set(['SKU-1001', 'SKU-1002', 'SKU-1003', 'SKU-1004'])

const products = []
let sku = 1000
for (const [category, supplier, names] of CATALOGUE) {
  for (const name of names) {
    sku += 1
    const id = `SKU-${sku}`
    // Aurora's line is Northwind's premium Electronics range and sells
    // disproportionately well in EMEA — which is exactly why losing it for a
    // month is visible in the regional revenue line.
    const price = STOCKED_OUT.has(id)
      ? Number((129 + rnd() * 90).toFixed(2))
      : Number((12 + rnd() * 90).toFixed(2))
    const reorder = 40 + Math.floor(rnd() * 60)
    products.push({
      product_id: id,
      name,
      category,
      supplier,
      price,
      // The culprits are still at zero, below their reorder level — which is
      // what makes the fix discoverable through list_low_stock.
      stock: STOCKED_OUT.has(id) ? 0 : Math.floor(reorder * (0.6 + rnd() * 3)),
      reorder_level: reorder,
    })
  }
}

writeFileSync(
  'public/samples/products.csv',
  ['product_id,name,category,supplier,price,stock,reorder_level']
    .concat(
      products.map(
        (p) => `${p.product_id},"${p.name}",${p.category},"${p.supplier}",${p.price},${p.stock},${p.reorder_level}`,
      ),
    )
    .join('\n') + '\n',
)

// --- orders ---------------------------------------------------------------
const orders = ['order_id,order_date,region,channel,customer_id,product_id,units,revenue,status']
let orderNo = 100000

/** Aurora's line is weighted heavily toward EMEA; elsewhere it is ordinary. */
const weighted = {}
for (const region of REGIONS) {
  const bag = []
  for (const p of products) {
    const weight = STOCKED_OUT.has(p.product_id) ? (region === 'EMEA' ? 3 : 1) : 1
    for (let i = 0; i < weight; i++) bag.push(p)
  }
  weighted[region] = bag
}

for (let i = 0; i < 60000; i++) {
  const date = pick(days)
  const region = pick(REGIONS)
  const product = pick(weighted[region])
  const month = date.slice(0, 7)

  // EMEA orders for the Aurora products essentially stop during March 2025.
  if (region === 'EMEA' && month === '2025-03' && STOCKED_OUT.has(product.product_id)) {
    if (rnd() > 0.06) continue
  }

  const seasonal = 1 + 0.18 * Math.sin((new Date(date).getMonth() / 12) * 2 * Math.PI)
  const units = 1 + Math.floor(rnd() * 5)
  const revenue = Number((units * product.price * seasonal * (0.85 + rnd() * 0.3)).toFixed(2))
  orderNo += 1

  orders.push(
    [
      `ORD-${orderNo}`,
      date,
      region,
      pick(CHANNELS),
      `CUST-${1000 + Math.floor(rnd() * 4000)}`,
      product.product_id,
      units,
      revenue,
      pick(STATUSES),
    ].join(','),
  )
}

writeFileSync('public/samples/orders.csv', orders.join('\n') + '\n')

// --- a plain analytics-only sample, for the "bring your own CSV" path ------
const tickets = ['created_at,queue,priority,first_response_minutes,resolved,satisfaction']
const QUEUES = ['Billing', 'Technical', 'Onboarding', 'Account']
const PRIORITIES = ['low', 'normal', 'high', 'urgent']
for (let i = 0; i < 20000; i++) {
  const priority = pick(PRIORITIES)
  const urgent = priority === 'urgent' || priority === 'high'
  const first = Math.round((urgent ? 8 : 45) * (0.3 + rnd() * 2.4))
  const resolved = rnd() > (urgent ? 0.08 : 0.16)
  const satisfaction = resolved ? Math.min(5, Math.max(1, Math.round(5 - first / 60 + rnd()))) : ''
  tickets.push(`${pick(days)},${pick(QUEUES)},${priority},${first},${resolved},${satisfaction}`)
}
writeFileSync('public/samples/support-tickets.csv', tickets.join('\n') + '\n')

console.log(`wrote ${products.length} products, ${orders.length - 1} orders, 20000 tickets`)
