import { allTools } from '../tools'
import { navigate } from '../router'
import { useTheme } from '../store/theme'

const STEPS = [
  {
    n: '01',
    title: 'Drop a CSV',
    body: 'DuckDB-WASM holds it in this tab and runs real SQL over it. Nothing is uploaded — there is no server to upload it to.',
  },
  {
    n: '02',
    title: 'The agent asks, it never receives',
    body: 'ChatGPT cannot see a row. It calls the sixteen tools this page registers: profile a column, run a query, read the board back.',
  },
  {
    n: '03',
    title: 'The board builds itself',
    body: 'KPIs, charts, tables and written findings appear as the agent works. You edit the same board by hand — drag, resize, delete.',
  },
]

const GROUPS = [
  { label: 'Explore the data', names: ['get_schema', 'profile_column', 'sample_rows', 'run_sql'] },
  {
    label: 'Build the board',
    names: [
      'add_kpi', 'add_chart', 'add_table', 'add_note', 'update_card',
      'remove_card', 'reorder_cards', 'resize_card', 'highlight_points',
    ],
  },
  { label: 'Read it back and steer', names: ['read_dashboard', 'set_global_filter', 'undo'] },
]

function Section({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`mx-auto w-full max-w-5xl px-6 ${className}`}>{children}</section>
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

      {/* Hero */}
      <Section className="pt-12 pb-14 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
          Built on WebMCP
        </p>
        <h1 className="mx-auto max-w-3xl pt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          Analyse the data you are not allowed to paste into ChatGPT.
        </h1>
        <p className="mx-auto max-w-xl pt-5 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
          Enclave keeps your file in the browser and hands the agent tools instead of rows. It
          runs the analysis. It never sees the data.
        </p>
        <div className="flex items-center justify-center gap-3 pt-8">
          <button
            onClick={() => navigate('/app')}
            className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white
              transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900
              dark:hover:bg-white"
          >
            Open the workbench
          </button>
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
          No account. No upload. Two sample datasets load in one click.
        </p>
      </Section>

      {/* Screenshot */}
      <Section className="pb-20">
        <img
          src="/screenshot.png"
          alt="Enclave with a dashboard the agent built from a 50,000-row retail dataset"
          className="w-full rounded-xl border border-neutral-200 shadow-2xl dark:border-neutral-800"
        />
      </Section>

      {/* The problem */}
      <Section className="border-t border-neutral-200 py-16 dark:border-neutral-800">
        <div className="grid gap-8 md:grid-cols-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            The best analyst you have access to is locked out of the data that needs analysing.
          </h2>
          <div className="space-y-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            <p>
              Company revenue. Patient records. A user export under GDPR. The moment it leaves the
              machine it becomes someone else&rsquo;s problem, so it never leaves — and the analysis
              never happens.
            </p>
            <p>
              Uploading to a hosted notebook does not fix this. It moves the leak.
            </p>
            <p className="text-neutral-900 dark:text-neutral-100">
              But an agent does not need your data. It needs the ability to ask questions of your
              data. Only one of those has to cross the network.
            </p>
          </div>
        </div>
      </Section>

      {/* How it works */}
      <Section className="border-t border-neutral-200 py-16 dark:border-neutral-800">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <div className="grid gap-8 pt-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n}>
              <div className="font-mono text-xs text-neutral-400">{s.n}</div>
              <h3 className="pt-2 text-sm font-medium">{s.title}</h3>
              <p className="pt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {s.body}
              </p>
            </div>
          ))}
        </div>

        <pre className="mt-10 overflow-x-auto rounded-xl border border-neutral-200 bg-white p-5 font-mono text-[11px] leading-relaxed text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
{`  ChatGPT ───→ document.modelContext ──┐
                                       ├──→  TOOL REGISTRY  ──→  DuckDB-WASM
  Built-in ──→ OpenAI Responses API ───┘     16 tools             your CSV
  panel        (your own key)                                     (tab memory)

                        no server · data never leaves the tab`}
        </pre>
      </Section>

      {/* Tools */}
      <Section className="border-t border-neutral-200 py-16 dark:border-neutral-800">
        <h2 className="text-2xl font-semibold tracking-tight">Sixteen tools, both directions</h2>
        <p className="max-w-2xl pt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          Most tool surfaces only let an agent write. Enclave&rsquo;s lets it read the current state
          of both the data and the board — which is what lets it revise an analysis it did not build
          itself.
        </p>
        <div className="grid gap-8 pt-8 md:grid-cols-3">
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

      {/* Proof */}
      <Section className="border-t border-neutral-200 py-16 dark:border-neutral-800">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              The privacy claim is metered, not promised.
            </h2>
            <p className="pt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              Every tool result passes through one cap — 50 rows and 4 KB — before it can reach an
              agent. Raw row dumps are refused with a message steering the agent toward
              aggregation. The Activity Log counts every byte, on screen, the whole time.
            </p>
            <p className="pt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              A full exploratory analysis of fifty thousand rows costs this much:
            </p>
          </div>
          <div className="flex flex-col justify-center rounded-xl border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="font-mono text-4xl font-semibold tabular-nums">2,256 B</div>
            <div className="pt-1 text-sm text-neutral-500">left the browser</div>
            <div className="pt-4 font-mono text-4xl font-semibold tabular-nums">0</div>
            <div className="pt-1 text-sm text-neutral-500">rows uploaded</div>
          </div>
        </div>
      </Section>

      {/* WebMCP */}
      <Section className="border-t border-neutral-200 py-16 dark:border-neutral-800">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Works with or without WebMCP</h2>
            <p className="pt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              WebMCP ships in Chrome 149+ behind an origin trial, or locally via{' '}
              <code className="text-xs">chrome://flags/#enable-webmcp-testing</code>. There,
              ChatGPT discovers these sixteen tools and drives the page directly.
            </p>
            <p className="pt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              Everywhere else, the built-in panel runs the same tools with your own OpenAI key. One
              registry, two runtimes — the capabilities are identical either way.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
              Verify it yourself
            </p>
            <pre className="overflow-x-auto pt-2 font-mono text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">
{`node scripts/verify-native-webmcp.mjs \\
     https://enclave-bay.vercel.app

→ native getTools() → 16 tools
→ executeTool get_schema →
  Table: data
  Rows: 50000`}
            </pre>
          </div>
        </div>
      </Section>

      <Section className="border-t border-neutral-200 py-16 text-center dark:border-neutral-800">
        <h2 className="text-2xl font-semibold tracking-tight">Try it on your own file.</h2>
        <p className="pt-3 text-sm text-neutral-600 dark:text-neutral-400">
          It will not leave your browser. That is the whole point.
        </p>
        <button
          onClick={() => navigate('/app')}
          className="mt-7 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white
            transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900
            dark:hover:bg-white"
        >
          Open the workbench
        </button>
      </Section>

      <footer className="mx-auto w-full max-w-5xl border-t border-neutral-200 px-6 py-8 text-xs text-neutral-400 dark:border-neutral-800">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span>Enclave · MIT licensed</span>
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
