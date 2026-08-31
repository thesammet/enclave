// Verifies the submission's central claim: that a real WebMCP-capable browser
// discovers this page's tools through the native API and can execute them.
//   node scripts/verify-native-webmcp.mjs [url]
import { chromium } from 'playwright'

const url = process.argv[2] ?? 'https://enclave-bay.vercel.app'
const browser = await chromium.launch({ args: ['--enable-features=WebMCP'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(url, { waitUntil: 'domcontentloaded' })

console.log('API surface:', await page.evaluate(() =>
  Object.getOwnPropertyNames(Object.getPrototypeOf(document.modelContext)),
))

await page.getByText('Retail sales').click()
await page.waitForFunction(() => document.body.innerText.includes('50,000 rows'), { timeout: 90000 })

const tools = await page.evaluate(async () => {
  const list = await document.modelContext.getTools()
  return list.map((t) => t.name)
})
console.log(`\nnative getTools() → ${tools.length} tools`)
console.log(tools.join(', '))

// The native API is string-based: executeTool takes the RegisteredTool object
// and its arguments as a JSON STRING. Passing a plain object is rejected with
// "Failed to parse input arguments".
const run = async (name, args) =>
  page.evaluate(
    async ([n, a]) => {
      const tools = await document.modelContext.getTools()
      const tool = tools.find((t) => t.name === n)
      const res = await document.modelContext.executeTool(tool, a)
      return res?.content?.[0]?.text ?? JSON.stringify(res)
    },
    [name, JSON.stringify(args)],
  )

console.log('\nexecuteTool get_schema →\n' + (await run('get_schema', {})))
console.log('\nexecuteTool add_chart →\n' + (await run('add_chart', {
  title: 'Monthly revenue by region',
  chartType: 'line',
  sql: "SELECT strftime(order_date, '%Y-%m') AS month, region, round(sum(revenue)) AS revenue FROM data GROUP BY 1, 2 ORDER BY 1",
  x: 'month', y: 'revenue', series: 'region', span: 3,
})))

await page.waitForTimeout(1200)
await page.screenshot({ path: '/tmp/native.png' })
console.log('\npage errors:', errors.length ? errors : 'none')
await browser.close()
