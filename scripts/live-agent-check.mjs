// Dev tool: drives the built-in agent panel against the real OpenAI API and
// reports how many rounds it took, what it called, and what it concluded. It
// auto-approves whatever the agent proposes so the whole arc can be measured
// unattended — a person is in that loop everywhere except this script.
//
//   OPENAI_KEY=sk-... node scripts/live-agent-check.mjs
import { chromium } from 'playwright'

const key = process.env.OPENAI_KEY
if (!key) { console.error('no key'); process.exit(1) }

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 950 }, colorScheme: 'dark' })
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e))
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url().slice(0, 60)} ${r.failure()?.errorText}`))
page.on('response', async (r) => {
  if (r.url().includes('api.openai.com') && !r.ok()) {
    errors.push(`OpenAI HTTP ${r.status()}: ${(await r.text().catch(() => '')).slice(0, 500)}`)
  }
})

const origin = process.argv[2] ?? 'http://localhost:5173'
await page.goto(`${origin}/app`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(5000)
const skip = page.getByRole('button', { name: 'Skip' })
if (await skip.count()) { await skip.click(); await page.waitForTimeout(300) }

await page.locator('input[type=password]').fill(key)
await page.getByRole('button', { name: 'Connect' }).click()
await page.waitForTimeout(400)
console.log('connected, model:', await page.locator('select').first().inputValue())

await page.getByText('EMEA fell in March. Find the cause and fix it.').click()
console.log('question sent, waiting…\n')

// Approve anything the agent proposes, and log the reasoning it gave.
let approved = 0
const watcher = setInterval(async () => {
  try {
    const card = page.locator('text=Needs your approval')
    if (await card.count()) {
      const text = await page.locator('[class*=amber]').first().innerText().catch(() => '')
      console.log('--- APPROVAL REQUESTED ---\n' + text + '\n')
      await page.getByRole('button', { name: 'Approve' }).click()
      approved++
    }
  } catch { /* transient */ }
}, 1500)

const deadline = Date.now() + 240000
let last = ''
while (Date.now() < deadline) {
  await page.waitForTimeout(3000)
  const busy = await page.locator('text=/thinking…|running /').count()
  const log = await page.locator('[data-tour=activity]').innerText().catch(() => '')
  if (log !== last) { last = log; }
  const msgs = await page.locator('aside').last().innerText()
  if (!busy && msgs.includes('AGENT')) break
}
clearInterval(watcher)

const log = await page.locator('[data-tour=activity]').innerText()
const calls = log.split('\n').filter((l) => /^[a-z_]+$/.test(l.trim()))
const counts = {}
for (const c of calls) counts[c] = (counts[c] ?? 0) + 1
console.log('=== TOOL CALLS ===', calls.length, 'rounds')
console.log(Object.entries(counts).map(([k, v]) => `${k}×${v}`).join('  '))
console.log('failed:', (log.match(/✕/g) ?? []).length)
console.log('bytes:', log.match(/([\d,]+) B left your browser/)?.[1])

console.log('\n=== AGENT REPLY ===')
const rail = await page.locator('aside').last().innerText()
const i = rail.lastIndexOf('AGENT')
console.log(i >= 0 ? rail.slice(i, i + 1400) : '(no agent reply)')

console.log('\n=== BOARD ===')
await page.goto(`${origin}/app/analytics`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)
console.log((await page.locator('main').innerText()).split('COLUMNS')[0])
console.log('\napprovals handled:', approved)
console.log('errors:', errors.length ? errors : 'none')
await page.screenshot({ path: '/tmp/live.png' })
await browser.close()
