import { chromium } from 'playwright'
const url = process.argv[2] ?? 'http://localhost:5173/'
const out = process.argv[3] ?? 'landing.png'
const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  colorScheme: process.env.DARK === '0' ? 'light' : 'dark',
})
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await page.goto(url, { waitUntil: 'networkidle' })
await page.screenshot({ path: out, fullPage: true })
console.log('saved', out, '| errors:', errors.length ? errors : 'none')
await browser.close()
