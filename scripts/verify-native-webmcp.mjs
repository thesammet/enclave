// Verifies the submission's central claim: that a real WebMCP-capable browser
// discovers this page's tools through the native API and can execute them.
//   node scripts/verify-native-webmcp.mjs [url]
import { chromium } from 'playwright'

const url = process.argv[2] ?? 'https://enclave-bay.vercel.app'
const browser = await chromium.launch({ args: ['--enable-features=WebMCP'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(new URL('/app', url).href, { waitUntil: 'domcontentloaded' })

console.log('API surface:', await page.evaluate(() =>
  Object.getOwnPropertyNames(Object.getPrototypeOf(document.modelContext)),
))

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
      // The native API hands the envelope back as a JSON string.
      const parsed = typeof res === 'string' ? JSON.parse(res) : res
      return parsed?.content?.[0]?.text ?? String(res)
    },
    [name, JSON.stringify(args)],
  )

// The store's data loads at boot; wait until the tools can actually answer.
for (let i = 0; i < 90; i++) {
  const r = await run('get_schema', {})
  if (!r.startsWith('Error')) break
  await page.waitForTimeout(1000)
}

console.log('\nexecuteTool get_schema →\n' + (await run('get_schema', {})))
console.log('\nexecuteTool list_low_stock →\n' + (await run('list_low_stock', {})))

await page.waitForTimeout(1200)
await page.screenshot({ path: '/tmp/native.png' })
console.log('\npage errors:', errors.length ? errors : 'none')
await browser.close()
