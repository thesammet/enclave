// Drives the back-office exactly as a WebMCP agent would: injects a stub
// document.modelContext before boot, captures the registered tools, then walks
// the whole arc — analyse, find the cause, act, wait for the operator.
//   node scripts/e2e-agent.mjs [origin] [outfile]
import { chromium } from 'playwright'

const origin = process.argv[2] ?? 'http://localhost:5173'
const out = process.argv[3] ?? 'shot.png'

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1600, height: 1000 },
  colorScheme: process.env.DARK === '0' ? 'light' : 'dark',
})
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push(String(e)))

await page.addInitScript(() => {
  window.__tools = {}
  document.modelContext = { registerTool: async (t) => { window.__tools[t.name] = t } }
})

await page.goto(`${origin}/app/analytics`, { waitUntil: 'domcontentloaded' })
console.log('registered tools:', await page.evaluate(() => Object.keys(window.__tools).length))
const call = (name, args = {}) =>
  page.evaluate(
    async ([n, a]) => (await window.__tools[n].execute(a, {})).content[0].text,
    [name, args],
  )

// Wait on the tool itself, not on page text: the data is ready exactly when
// get_schema can answer. (waitForFunction with numeric polling treats a
// pending Promise as truthy, so poll from here instead.)
let ready = ''
for (let i = 0; i < 90; i++) {
  ready = await call('get_schema')
  if (!ready.startsWith('Error')) break
  await page.waitForTimeout(1000)
}
if (ready.startsWith('Error')) {
  console.error('data never loaded:', ready)
  console.error('page said:', (await page.locator('body').innerText()).slice(0, 400))
  await browser.close()
  process.exit(1)
}
const log = (label, text) => console.log(`\n── ${label}\n${String(text).slice(0, 420)}`)

log('get_schema', await call('get_schema'))
log('run_sql · monthly revenue by region', await call('run_sql', {
  sql: `SELECT strftime(order_date, '%Y-%m') AS month, region, round(sum(revenue)) AS revenue
        FROM data WHERE order_date >= '2025-01-01' AND order_date < '2025-05-01'
        GROUP BY 1,2 ORDER BY 2,1`,
}))
log('run_sql · EMEA March by supplier', await call('run_sql', {
  sql: `SELECT supplier, round(sum(revenue)) AS revenue FROM data
        WHERE region='EMEA' AND strftime(order_date,'%Y-%m')='2025-03'
        GROUP BY 1 ORDER BY 2 DESC`,
}))
log('list_low_stock', await call('list_low_stock'))
log('get_product', await call('get_product', { query: 'SKU-1001' }))

log('add_chart', await call('add_chart', {
  title: 'EMEA revenue by month, 2025', chartType: 'bar',
  sql: `SELECT strftime(order_date,'%Y-%m') AS month, round(sum(revenue)) AS revenue
        FROM data WHERE region='EMEA' AND order_date >= '2025-01-01' GROUP BY 1 ORDER BY 1`,
  x: 'month', y: 'revenue', span: 2,
}))
const board = await call('read_dashboard')
const chartId = board.match(/\[([^\]]+)\] chart/)?.[1]
log('highlight_points', await call('highlight_points', { id: chartId, values: ['2025-03'] }))
log('add_note', await call('add_note', {
  title: 'Root cause',
  markdown: '**EMEA revenue fell 52% in March 2025.** The whole shortfall sits with `Aurora Supply` — their four SKUs sold nothing in EMEA that month and are still at zero stock, below reorder level.',
}))

// The write tool must block until a human decides.
console.log('\n── create_restock_order (agent proposes, then waits)')
const pending = call('create_restock_order', {
  product_id: 'SKU-1001', quantity: 400,
  reason: 'Zero stock since March; EMEA revenue down 52% while out of stock.',
})
await page.waitForSelector('text=Needs your approval', { timeout: 15000 })
console.log('   approval card shown to the operator ✓')
console.log('   restock orders before approval:',
  await page.evaluate(() => document.body.innerText.includes('RS-') ? 'present' : 'none'))

await page.screenshot({ path: out.replace('.png', '-approval.png') })
await page.getByRole('button', { name: 'Approve' }).click()
log('   result', await pending)

await page.goto(`${origin}/app`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)
await page.screenshot({ path: out })
console.log('\nsaved', out, '| console errors:', errors.length ? errors : 'none')
await browser.close()
