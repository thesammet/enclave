import type { ReactNode } from 'react'
import { navigate } from '../router'
import { useTheme } from '../store/theme'
import { allTools } from '../tools'

const ARC = [
  {
    n: '01',
    title: 'It notices',
    body: 'Revenue by region, month by month. EMEA falls 52% in March 2025 and no other region moves.',
  },
  {
    n: '02',
    title: 'It finds the cause',
    body: 'Broken down by supplier, one name is missing from March entirely: Aurora Supply sold nothing in EMEA that month.',
  },
  {
    n: '03',
    title: 'It checks the shelf',
    body: 'All four Aurora products are still at zero stock, below their reorder level. The revenue hole and the empty shelf are the same fact.',
  },
  {
    n: '04',
    title: 'You decide',
    body: 'It proposes a restock order with its reasoning and stops. Nothing changes until you approve it on screen.',
  },
]

const GROUPS = [
  { label: 'Explore the data', names: ['get_schema', 'profile_column', 'sample_rows', 'run_sql'] },
  {
    label: 'Build the analysis',
    names: [
      'add_kpi', 'add_chart', 'add_table', 'add_note', 'update_card',
      'remove_card', 'reorder_cards', 'resize_card', 'highlight_points',
    ],
  },
  { label: 'Read it back and steer', names: ['read_dashboard', 'set_global_filter', 'undo'] },
  {
    label: 'Run the store',
    names: [
      'search_orders', 'get_product', 'list_low_stock',
      'list_restock_orders', 'create_restock_order', 'set_product_price',
    ],
  },
]

function Section({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`mx-auto w-full max-w-5xl px-6 ${className}`}>{children}</section>
}

function Cta({ label = 'Open the back-office' }: { label?: string }) {
  return (
    <button
      onClick={() => navigate('/app')}
      className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition
        hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
    >
      {label}
    </button>
  )
}

export function Landing() {
  const toggle = useTheme((s) => s.toggle)
  const byName = new Map(allTools.map((t) => [t.name, t]))

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="mx-auto flex w-full max-w-5xl items-center gap-3 px-6 py-5">
        <span className="text-sm font-semibold tracking-tight">Enclave</span>
        <div className="ml-auto flex items-center gap-4 text-xs text-neutral-500">
          <button onClick={toggle} className="hover:text-neutral-900 dark:hover:text-neutral-100">
            Theme
          </button>
          <a
            href="https://github.com/thesammet/enclave"
            target="_blank"
            rel="noreferrer"
            className="hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            GitHub
          </a>
        </div>
      </header>

      <Section className="pt-12 pb-14 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
          Built on WebMCP
        </p>
        <h1 className="mx-auto max-w-3xl pt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          A back-office your AI agent can actually operate.
        </h1>
        <p className="mx-auto max-w-xl pt-5 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
          Enclave is a commerce back-office where the store&rsquo;s data loads into the browser and
          stops there. ChatGPT works the business through {allTools.length} tools — investigating,
          then proposing changes you approve. It never sees a row.
        </p>
        <div className="flex items-center justify-center gap-3 pt-8">
          <Cta />
          <a
            href="https://github.com/thesammet/enclave"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium
              transition hover:border-neutral-500 dark:border-neutral-700 dark:hover:border-neutral-500"
          >
            Read the code
          </a>
        </div>
        <p className="pt-4 text-xs text-neutral-400">
          No account, no upload. A demo store is already loaded.
        </p>
      </Section>

      <Section className="pb-20">
        <img
          src="/screenshot.png"
          alt="Enclave's overview: store KPIs, revenue by region, and products below their reorder level"
          className="w-full rounded-xl border border-neutral-200 shadow-2xl dark:border-neutral-800"
        />
      </Section>

      <Section className="border-t border-neutral-200 py-16 dark:border-neutral-800">
        <div className="grid gap-8 md:grid-cols-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Two things stop an agent being useful in a real business.
          </h2>
          <div className="space-y-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            <p>
              <span className="text-neutral-900 dark:text-neutral-100">It cannot see your data.</span>{' '}
              Revenue, customers, orders — none of it can be pasted into a chat window, so the
              analysis never happens.
            </p>
            <p>
              <span className="text-neutral-900 dark:text-neutral-100">
                And it should not be clicking around your admin panel.
              </span>{' '}
              An agent guessing its way through a UI is slow, brittle, and occasionally
              catastrophic.
            </p>
            <p className="text-neutral-900 dark:text-neutral-100">
              WebMCP answers both. The page states exactly what an agent may do; the data stays
              where it is; and anything consequential waits for a human.
            </p>
          </div>
        </div>
      </Section>

      <Section className="border-t border-neutral-200 py-16 dark:border-neutral-800">
        <h2 className="text-2xl font-semibold tracking-tight">From a number to a decision</h2>
        <p className="max-w-2xl pt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          The demo store carries one real problem. Watch an agent walk the whole way to it —
          without ever receiving a row of the data it is reasoning about.
        </p>
        <div className="grid gap-8 pt-8 md:grid-cols-4">
          {ARC.map((s) => (
            <div key={s.n}>
              <div className="font-mono text-xs text-neutral-400">{s.n}</div>
              <h3 className="pt-2 text-sm font-medium">{s.title}</h3>
              <p className="pt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="border-t border-neutral-200 py-16 dark:border-neutral-800">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Nothing changes without you.
            </h2>
            <p className="pt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              Reading is free. Anything that touches the business — a restock order, a price —
              is <em>proposed</em>. The tool call blocks, a card appears with the agent&rsquo;s
              reasoning, and the change happens only if you approve it.
            </p>
            <p className="pt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              That pause is the product. It is where the human and the agent actually meet.
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/40 bg-amber-50 p-5 dark:bg-amber-500/5">
            <div className="text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-500">
              Needs your approval
            </div>
            <p className="pt-1.5 text-sm font-medium">Order 400 units of Nimbus Wireless Earbuds</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 pt-3 text-[11px]">
              {[
                ['Supplier', 'Aurora Supply'],
                ['Current stock', '0 (reorder at 42)'],
                ['Reason', 'Zero stock since March; EMEA revenue down 52% while out of stock.'],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-neutral-500">{k}</dt>
                  <dd className="text-neutral-800 dark:text-neutral-200">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="pt-3 text-[10px] text-neutral-500">
              The agent is waiting. Nothing has changed yet.
            </p>
          </div>
        </div>
      </Section>

      <Section className="border-t border-neutral-200 py-16 dark:border-neutral-800">
        <h2 className="text-2xl font-semibold tracking-tight">
          {allTools.length} tools, and they read as well as write
        </h2>
        <p className="max-w-2xl pt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          Most tool surfaces only let an agent act. Enclave&rsquo;s lets it read the current state of
          the data, the analysis board and the catalogue — which is what lets it revise work it did
          not do itself.
        </p>
        <div className="grid gap-8 pt-8 md:grid-cols-4">
          {GROUPS.map((g) => (
            <div key={g.label}>
              <h3 className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                {g.label}
              </h3>
              <ul className="space-y-2 pt-3">
                {g.names.map((n) => (
                  <li key={n}>
                    <code className="text-xs text-neutral-900 dark:text-neutral-100">{n}</code>
                    <p className="pt-0.5 text-[11px] leading-snug text-neutral-500">
                      {byName.get(n)?.description.split('.')[0]}.
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section className="border-t border-neutral-200 py-16 dark:border-neutral-800">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              The privacy claim is metered, not promised.
            </h2>
            <p className="pt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              Every tool result passes through one cap — 50 rows and 4 KB — before it can reach an
              agent, and you can lower it in settings. Raw row dumps are refused with a message
              steering the agent toward aggregation.
            </p>
            <p className="pt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              The Activity Log counts every byte, on screen, the whole time. GPT-5 walking the
              entire investigation above — sixteen tool calls, four restock orders proposed —
              cost this much:
            </p>
          </div>
          <div className="flex flex-col justify-center rounded-xl border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="font-mono text-4xl font-semibold tabular-nums">7,758 B</div>
            <div className="pt-1 text-sm text-neutral-500">left the browser</div>
            <div className="pt-5 font-mono text-4xl font-semibold tabular-nums">0</div>
            <div className="pt-1 text-sm text-neutral-500">rows uploaded</div>
          </div>
        </div>
      </Section>

      <Section className="border-t border-neutral-200 py-16 dark:border-neutral-800">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Works with or without WebMCP</h2>
            <p className="pt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              WebMCP ships in Chrome 149+ behind an origin trial, or locally via{' '}
              <code className="text-xs">chrome://flags/#enable-webmcp-testing</code>. There, ChatGPT
              discovers these tools and operates the store directly.
            </p>
            <p className="pt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              Everywhere else, the built-in panel runs the same tools with your own OpenAI key. One
              registry, two runtimes — identical capabilities, identical approval gates.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
              Verify it yourself
            </p>
            <pre className="overflow-x-auto pt-2 font-mono text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">
{`node scripts/verify-native-webmcp.mjs \\
     https://enclave-bay.vercel.app

→ native getTools() → ${allTools.length} tools
→ executeTool get_schema →
  Table: data
  Rows: 59615`}
            </pre>
          </div>
        </div>
      </Section>

      <Section className="border-t border-neutral-200 py-16 text-center dark:border-neutral-800">
        <h2 className="text-2xl font-semibold tracking-tight">
          Or bring your own file.
        </h2>
        <p className="pt-3 text-sm text-neutral-600 dark:text-neutral-400">
          Analytics takes any CSV. It will not leave your browser either — that is the whole point.
        </p>
        <div className="pt-7">
          <Cta />
        </div>
      </Section>

      <footer className="mx-auto w-full max-w-5xl border-t border-neutral-200 px-6 py-8 text-xs text-neutral-400 dark:border-neutral-800">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span>Enclave · MIT licensed</span>
          <span>Northwind Trading Co. is a fictional store; its data is synthetic.</span>
          <a href="https://github.com/thesammet/enclave" target="_blank" rel="noreferrer" className="hover:text-neutral-600">
            Source
          </a>
          <a href="https://webmcp.devpost.com/" target="_blank" rel="noreferrer" className="hover:text-neutral-600">
            The WebMCP Challenge
          </a>
        </div>
      </footer>
    </div>
  )
}
