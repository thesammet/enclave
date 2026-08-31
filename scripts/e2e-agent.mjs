// Drives the app exactly as a WebMCP agent would: injects a stub
// document.modelContext before the app boots, captures the tools it registers,
// then calls them in sequence and screenshots the result.
//   node scripts/e2e-agent.mjs [url] [outfile]
import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:5173/'
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
  document.modelContext = {
    registerTool: async (tool) => { window.__tools[tool.name] = tool },
  }
})

await page.goto(url, { waitUntil: 'domcontentloaded' })
console.log('registered tools:', await page.evaluate(() => Object.keys(window.__tools).length))

await page.getByText('Retail sales').click()
await page.waitForFunction(() => document.body.innerText.includes('50,000 rows'), { timeout: 90000 })

const call = async (name, args = {}) =>
  page.evaluate(
    async ([n, a]) => (await window.__tools[n].execute(a, {})).content[0].text,
    [name, args],
  )

const log = (label, text) => console.log(`\n── ${label}\n${text}`)

log('get_schema', await call('get_schema'))
log('profile_column region', (await call('profile_column', { column: 'region' })).slice(0, 300))
log(
  'run_sql monthly EMEA',
  await call('run_sql', {
    sql: "SELECT strftime(order_date, '%Y-%m') AS month, round(sum(revenue)) AS revenue FROM data WHERE region = 'EMEA' AND order_date >= '2025-01-01' AND order_date < '2025-06-01' GROUP BY 1 ORDER BY 1",
  }),
)
log(
  'add_kpi',
  await call('add_kpi', {
    title: 'Total revenue',
    sql: 'SELECT round(sum(revenue)) AS revenue FROM data',
    format: 'currency',
  }),
)
log(
  'add_chart',
  await call('add_chart', {
    title: 'Monthly revenue by region',
    chartType: 'line',
    sql: "SELECT strftime(order_date, '%Y-%m') AS month, region, round(sum(revenue)) AS revenue FROM data GROUP BY 1, 2 ORDER BY 1",
    x: 'month',
    y: 'revenue',
    series: 'region',
    span: 3,
  }),
)
log(
  'add_chart bar',
  await call('add_chart', {
    title: 'EMEA revenue, 2025',
    chartType: 'bar',
    sql: "SELECT strftime(order_date, '%Y-%m') AS month, round(sum(revenue)) AS revenue FROM data WHERE region = 'EMEA' AND order_date >= '2025-01-01' GROUP BY 1 ORDER BY 1",
    x: 'month',
    y: 'revenue',
    span: 2,
  }),
)
const boardText = await call('read_dashboard')
const chartId = boardText.match(/\[([^\]]+)\] chart "EMEA revenue, 2025"/)?.[1]
log('highlight_points', await call('highlight_points', { id: chartId, values: ['2025-03'] }))
log(
  'add_note',
  await call('add_note', {
    title: 'Finding',
    markdown:
      '**EMEA revenue fell 68% in March 2025** against the February and April average. No other region shows a comparable drop, so this is regional rather than seasonal.',
  }),
)
log('read_dashboard', await call('read_dashboard'))
log('set_global_filter', await call('set_global_filter', { where: "region = 'EMEA'" }))
log('undo', await call('undo'))

await page.waitForTimeout(1500)
await page.screenshot({ path: out, fullPage: true })
console.log('\nsaved', out, '| console errors:', errors.length ? errors : 'none')
await browser.close()
