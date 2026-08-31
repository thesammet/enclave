# Enclave — Devpost submission

**Live:** https://enclave-bay.vercel.app
**Repo:** https://github.com/thesammet/enclave
**Video:** _(to add)_
**Landing page:** https://enclave-bay.vercel.app · **Workbench:** https://enclave-bay.vercel.app/app
**Licence:** MIT

---

## Inspiration

Every analyst has the same standoff. The most capable analyst you have access to
is ChatGPT, and the data you most need help with is the data you are not allowed
to paste into it. Company revenue, patient records, a user export under GDPR —
the moment it leaves the machine, it is someone else's problem. Uploading to a
hosted notebook does not solve it; it just moves the leak.

WebMCP dissolves the standoff. If the page can expose tools, the agent no longer
needs the data — it needs the *ability to ask questions of* the data. Those are
different things, and only one of them has to leave your browser.

## What it does

Drop a CSV onto Enclave. DuckDB-WASM holds it in the tab's memory and runs real
SQL over it — the file is never uploaded. An agent, whether ChatGPT over WebMCP
or the built-in panel, cannot see a single row. It can only call the sixteen
tools the page registers: profile a column, run a query, add a KPI, chart, table
or note, read the board back, filter everything at once, undo.

You work on the same board it does — dragging cards, resizing, deleting. Neither
of you is driving alone.

## WebMCP leverage

**Sixteen tools, and they are bidirectional.** Most tool surfaces only let an
agent write. Enclave's lets it *read the current state of both the data and the
board* — `get_schema`, `profile_column`, `read_dashboard`. That is what lets an
agent revise a dashboard it did not build, or notice that the chart it wants
already exists.

**`set_global_filter` is one call that redraws everything.** Cards read from the
view `data`, never the base table. The tool issues one statement —
`CREATE OR REPLACE VIEW data AS SELECT * FROM raw WHERE …` — and every card on
the board re-renders against the filtered data. "Now just EMEA, last twelve
months" is a single tool call, not a rebuild.

**Errors are written for the agent, not the developer.** Name a column that does
not exist and the tool lists the ones that do. Pass a bad card id and it returns
the real ids. Ask for a chart whose y column is missing from the query result
and it names the columns the query actually returns. The agent recovers by
itself instead of stalling.

**Queries are validated before a card is created,** so a broken card never
reaches the board — the agent gets the database error back and fixes its SQL.

## Execution

No backend. No accounts. No API route. The only server-side artefact in the
repository is a `vercel.json` that sets one header. After first load the page
works offline.

86 tests. The data layer, the store, all sixteen tools and both runtime adapters
are unit-tested; `scripts/verify-native-webmcp.mjs` drives the deployed URL
through the real browser API as a receipt.

Two sample datasets load in one click, so a judge can try the product without
finding a CSV first.

It is a product, not a demo harness. A landing page explains the idea before you
touch anything; the workbench carries saved boards, settings and a theme
toggle. Nothing in the interface is decorative — every control does something,
because a dead menu tells a judge more than a working one does.

## Potential impact

The privacy claim is not rhetorical, it is metered. Every tool result passes
through a single cap — 50 rows and 4 KB — before it can reach an agent, and the
Activity Log counts the bytes. A full exploratory analysis of 50,000 rows in our
demo costs **2,256 bytes and zero rows uploaded**, and the number is on screen
the whole time.

That number is the argument. It turns "your data is safe" from a promise into a
figure a sceptical person can watch tick upward and check.

## Creativity

Most agent integrations move the data to the model. Enclave moves the questions
to the data and leaves the data where it is. The result-budget cap started as
context hygiene and became the product's central claim: the same mechanism that
keeps the agent's context small is what makes the privacy guarantee auditable.

The Activity Log exists because WebMCP is otherwise invisible. You cannot see a
tool call. Putting every one on screen with its byte cost makes the mechanism
legible to someone who has never heard of WebMCP.

## How we built it

Vite, React, TypeScript, Tailwind, Zustand, DuckDB-WASM, ECharts. Tools are
defined once in `src/tools/` and consumed by two thin adapters — one registering
them with `document.modelContext`, one exposing the same list to the OpenAI
Responses API. One definition site, identical capabilities either way.

## Challenges

**DuckDB-WASM versus WebMCP's headers.** DuckDB's threaded `coi` bundle needs
cross-origin isolation, which conflicts with how we needed to serve the page.
It turned out `selectBundle()` only picks `coi` when the page is *already*
cross-origin isolated — so by deliberately not setting COOP/COEP we get the `eh`
bundle, which needs neither, alongside the `Origin-Agent-Cluster: ?1` that
WebMCP does require.

**Arrow's numbers are not numbers.** DuckDB returns `sum()` over integers as
`DECIMAL(38,0)`, which Arrow hands back as an object, and `count()` as a BigInt.
Both had to be flattened before anything downstream could read them.

**The native API is string-based.** `executeTool` takes its arguments as a JSON
string, not an object; passing an object fails with "Failed to parse input
arguments". `inputSchema` comes back as a string too.

## What's next

Multiple files and joins; Parquet and Excel; sharing a saved board as a link so
someone else's copy of Enclave re-runs it against their own data — the analysis
travels, the data never does.
