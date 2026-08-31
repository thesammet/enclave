// Dev tool: loads the app, optionally loads a sample dataset, and writes a
// screenshot so the UI can be reviewed from the terminal.
//   node scripts/screenshot.mjs [url] [outfile]
import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:5173/'
const out = process.argv[3] ?? 'shot.png'
const dark = process.env.DARK !== '0'

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  colorScheme: dark ? 'dark' : 'light',
})
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.getByText('Retail sales').click()
await page.waitForSelector('text=/rows/', { timeout: 90000 })
await page.waitForTimeout(1200)
await page.screenshot({ path: out })
console.log('saved', out, '| console errors:', errors.length ? errors : 'none')
await browser.close()
