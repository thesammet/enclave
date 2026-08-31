// Dev tool: loads the running dev server in headless Chromium and prints the
// page's <pre> output plus any console errors. Used to verify browser-only
// behaviour (DuckDB-WASM, WebMCP) that Vitest cannot cover.
import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:5173/'
const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForFunction(
  () => {
    const t = document.querySelector('pre')?.textContent ?? ''
    return t.length > 0 && !t.includes('running…')
  },
  { timeout: 90000 },
)
console.log('OUTPUT:', await page.locator('pre').textContent())
console.log('CONSOLE ERRORS:', errors.length ? errors : 'none')
await browser.close()
