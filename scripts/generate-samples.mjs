// Generates the two synthetic sample datasets served from public/samples.
// Deterministic, so the demo is identical on every run.
//
// retail-sales.csv carries one deliberate story for the agent to find:
// EMEA revenue collapses in March 2025 and nowhere else.
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
const CATEGORIES = ['Apparel', 'Home', 'Electronics', 'Beauty', 'Outdoor', 'Grocery']
const CHANNELS = ['Web', 'Retail', 'Wholesale']
const BASE = { EMEA: 118, AMER: 132, APAC: 96, LATAM: 74 }

const sales = ['order_date,region,category,channel,units,revenue']
for (let i = 0; i < 50000; i++) {
  const date = pick(days)
  const region = pick(REGIONS)
  const shock = region === 'EMEA' && date.slice(0, 7) === '2025-03' ? 0.55 : 1
  const seasonal = 1 + 0.18 * Math.sin((new Date(date).getMonth() / 12) * 2 * Math.PI)
  const units = Math.max(1, Math.round((1 + rnd() * 6) * shock))
  const price = BASE[region] * seasonal * (0.75 + rnd() * 0.5)
  sales.push(
    `${date},${region},${pick(CATEGORIES)},${pick(CHANNELS)},${units},${(units * price * shock).toFixed(2)}`,
  )
}
writeFileSync('public/samples/retail-sales.csv', sales.join('\n') + '\n')

const QUEUES = ['Billing', 'Technical', 'Onboarding', 'Account']
const PRIORITIES = ['low', 'normal', 'high', 'urgent']
const tickets = ['created_at,queue,priority,first_response_minutes,resolved,satisfaction']
for (let i = 0; i < 20000; i++) {
  const priority = pick(PRIORITIES)
  const urgent = priority === 'urgent' || priority === 'high'
  const first = Math.round((urgent ? 8 : 45) * (0.3 + rnd() * 2.4))
  const resolved = rnd() > (urgent ? 0.08 : 0.16)
  const satisfaction = resolved ? Math.min(5, Math.max(1, Math.round(5 - first / 60 + rnd()))) : ''
  tickets.push(`${pick(days)},${pick(QUEUES)},${priority},${first},${resolved},${satisfaction}`)
}
writeFileSync('public/samples/support-tickets.csv', tickets.join('\n') + '\n')

console.log('wrote public/samples/retail-sales.csv and support-tickets.csv')
