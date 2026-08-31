# Enclave

**Drag your data in. Let ChatGPT analyse it without ever seeing it.**

🔗 **[enclave-bay.vercel.app](https://enclave-bay.vercel.app)** · Built for [The WebMCP Challenge](https://webmcp.devpost.com/)

![Enclave](docs/images/screenshot.png)

---

## The problem

You cannot paste your company's sales figures, your patients' records, or your
users' export into ChatGPT. So the most capable analyst available to you is
locked out of exactly the data you most need help with. Uploading to a hosted
notebook does not solve it either — the data still leaves the machine.

## What Enclave does

Drop a CSV on the page. DuckDB-WASM holds it in the tab's memory and runs real
SQL over it. The file is never uploaded.

An AI agent — ChatGPT over WebMCP, or the built-in panel — **cannot see the
data**. It can only call the sixteen tools this page registers. Using them it
profiles columns, runs queries, and assembles a dashboard of KPI, chart, table
and note cards. You work on the same board: reordering, resizing, deleting by
hand.

The Activity Log on the right counts every byte that left the browser. In the
screenshot above, a full exploratory analysis of 50,000 rows cost **2,256
bytes** and zero rows uploaded.

## The sixteen tools

**Explore the data** — read-only

| Tool | Behaviour |
|---|---|
| `get_schema` | Columns, SQL types, row count |
| `profile_column` | Nulls, distinct count, min/max, ten most frequent values |
| `sample_rows` | A few raw rows for orientation, capped at 20 |
| `run_sql` | Arbitrary DuckDB `SELECT` against the table `data` |

**Build the board**

| Tool | Behaviour |
|---|---|
| `add_kpi` | Single-number card |
| `add_chart` | bar / line / area / scatter / pie, fed by SQL |
| `add_table` | Query-result table |
| `add_note` | Markdown card — where the agent records its finding |
| `update_card` | Change title, query or chart configuration |
| `remove_card` · `reorder_cards` · `resize_card` | Layout |
| `highlight_points` | Emphasise specific x values on a chart |

**Read the board and control it**

| Tool | Behaviour |
|---|---|
| `read_dashboard` | Every card with its id, kind, title and query |
| `set_global_filter` | One `WHERE` clause across the whole board at once |
| `undo` | Revert the last board change |

The surface is deliberately **bidirectional**: the agent can read the current
state of both the data and the board, not only write to them. `read_dashboard`
is what lets it revise work it did not do itself.

## How it is built

```
             ┌─────────────── Enclave (browser tab) ───────────────┐
             │                                                     │
  ChatGPT ───┼──→ document.modelContext ──┐                        │
             │                            ├──→ TOOL REGISTRY       │
  Built-in ──┼──→ OpenAI Responses API ───┘    (16 tools, one      │
  panel      │    (your own key,                definition site)   │
             │     browser → api.openai.com)         │             │
             │                                       ▼             │
             │                              Zustand store          │
             │                              ├─ dataset             │
             │                              ├─ cards[]             │
             │                              └─ auditLog[]          │
             │                                       │             │
             │                                       ▼             │
             │                          DuckDB-WASM ←── your CSV   │
             │                          (tab memory)               │
             └─────────────────────────────────────────────────────┘
                    no server. data never leaves the tab.
```

**One registry, two runtimes.** Tools are defined once in `src/tools/`. One
adapter registers them with `document.modelContext`; another exposes the same
list to the OpenAI Responses API for the built-in panel. The capability surface
is identical no matter which agent drives it.

**The global filter is a view swap.** Cards read from the view `data`, never the
base table `raw`. `set_global_filter` runs one statement —
`CREATE OR REPLACE VIEW data AS SELECT * FROM raw WHERE …` — and every card on
the board re-renders against the filtered data.

**Every result is budgeted.** Tool output passes through a single cap of
**50 rows and 4 KB** before it can reach an agent. Raw row dumps are refused
with a message steering the agent toward aggregation. This keeps the agent's
context small, keeps queries honest, and makes the privacy claim measurable
rather than rhetorical.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 100 tests
npm run build
```

### Using it with native WebMCP

WebMCP is available in Chrome 149+ behind an origin trial, or locally via
`chrome://flags/#enable-webmcp-testing`. Verified here against Chromium 151
launched with `--enable-features=WebMCP`:

```bash
node scripts/verify-native-webmcp.mjs https://enclave-bay.vercel.app
```

That script is the receipt for the claim: it discovers all sixteen tools
through the native `document.modelContext.getTools()` on the deployed URL and
executes them. Two things worth knowing if you build against the native API:
`executeTool` takes the arguments as a **JSON string**, not an object, and
`inputSchema` comes back as a string too.

The page sets `Origin-Agent-Cluster: ?1` (see `vercel.json`), which WebMCP
requires. It deliberately does **not** set COOP/COEP: that would make
DuckDB's `selectBundle()` choose the threaded `coi` bundle and demand
cross-origin isolation. Without those headers it selects `eh`, which needs
neither.

### Using it without WebMCP

Paste an OpenAI key into the panel on the right. It is stored in your browser
and sent only to `api.openai.com`. Your data still goes nowhere.

## Saved boards

A board is the analysis, not the data: the cards and the filter, never a row.
Save one and it re-runs against whichever dataset is loaded — so the analysis
can travel between machines while the data stays put. Boards live in
`localStorage`.

## The result budget is a dial

The 50-row / 4 KB cap is the default, not a fixed law. Settings exposes it, so
the person holding the data decides how much any single tool result may carry
out of the browser. Lower it and the agent has to aggregate harder.

## Sample data

`public/samples/` holds two synthetic datasets, generated deterministically by
`scripts/generate-samples.mjs`. The retail one seeds a single finding for the
agent to discover: EMEA revenue falls 68% in March 2025, and nowhere else.

## Stack

Vite · React · TypeScript · Tailwind · Zustand · DuckDB-WASM · ECharts ·
Vitest. No backend.

Chart colours come from a validated categorical palette (worst adjacent
colour-vision-deficiency ΔE 9.1 light / 8.4 dark). `highlight_points` uses
focus-and-context — highlighted marks keep their series colour and the rest
recede — rather than repainting marks to a signal colour.

## Licence

MIT — see [LICENSE](LICENSE).
