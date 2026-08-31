# Enclave — Devpost submission

**Live:** https://enclave-bay.vercel.app · **Back-office:** https://enclave-bay.vercel.app/app
**Repo:** https://github.com/thesammet/enclave
**Video:** _(to add)_
**Licence:** MIT

---

## Inspiration

Two things stop an AI agent being useful in a real business, and they pull in
opposite directions.

It cannot see your data. Revenue, customers, orders — none of it can be pasted
into a chat window, so the analysis that would actually help never happens.

And it should not be clicking around your admin panel. An agent guessing its way
through a UI is slow, brittle, and occasionally catastrophic — nobody wants to
discover it changed the wrong price by inferring which button was "Save".

WebMCP resolves both at once. The page declares exactly what an agent may do, so
it never has to guess. And because the tools run inside the page, the data can
stay in the browser: the agent asks questions of it without ever receiving it.

## What it does

Enclave is a commerce back-office for Northwind Trading Co. Its orders and
catalogue load into the browser tab and stop there. Overview, Orders, Products
and Analytics are all real views over that data.

An agent — ChatGPT over WebMCP, or the built-in panel — operates the store
through 22 registered tools. It investigates freely. When it wants to change
something, it proposes and waits for you.

The demo store carries one causally complete story, discoverable end to end
without the agent seeing a row:

1. Revenue by region: EMEA falls 52% in March 2025, and no other region moves.
2. Broken down by supplier, one name is missing from March entirely — Aurora
   Supply sold nothing in EMEA that month.
3. All four Aurora products are still at zero stock, below their reorder level.
   The revenue hole and the empty shelf are the same fact.
4. It proposes a restock order with its reasoning, and stops. You approve.

## WebMCP leverage

**Twenty-two tools, and they read as well as write.** Most tool surfaces only let
an agent act. Enclave's lets it read the current state of the data, the analysis
board and the catalogue — `get_schema`, `profile_column`, `read_dashboard`,
`list_low_stock`. That is what lets an agent revise an analysis it did not build,
or check the shelf before recommending anything.

**Writes are proposals, not actions.** `create_restock_order` and
`set_product_price` do not change anything. The tool call blocks; an approval
card appears carrying the agent's own stated reason; the change applies only if
the operator approves, and the tool reports back honestly if they decline or
never answer. This is the human-agent seam the challenge asks for, expressed as
a mechanism rather than a claim.

**`set_global_filter` is one call that redraws everything.** Analytics cards read
from a view. The tool issues one `CREATE OR REPLACE VIEW` and the whole board
re-renders against the filtered data.

**Errors are written for the agent, not the developer.** Name a column that does
not exist and the tool lists the ones that do. Ask for a product by an ambiguous
name and it returns the candidates and asks for a product_id. Pass a bad card id
and it returns the real ids. The agent recovers by itself instead of stalling.

**Queries are validated before a card is created,** so a broken card never
reaches the board — the agent gets the database error back and fixes its SQL.

## Execution

No backend. No accounts. No API route. The only server-side artefact in the
repository is a `vercel.json` that sets one header. After first load the page
works offline.

127 tests cover the data layer, the store, all 22 tools, the approval gate and
both runtime adapters. Two scripts are the receipts a judge can run:
`scripts/e2e-agent.mjs` walks the entire arc against the deployed URL, and
`scripts/verify-native-webmcp.mjs` proves a real WebMCP browser discovers and
executes the tools.

It is a product, not a demo harness. A landing page explains the idea before you
touch anything; the back-office has working sections, saved boards, settings and
a theme toggle. Nothing in the interface is decorative — a dead menu tells a
judge more than a working one does.

## Potential impact

The privacy claim is not rhetorical, it is metered. Every tool result passes
through one cap — 50 rows and 4 KB, adjustable in settings — before it can reach
an agent, and the Activity Log counts the bytes. Walking the entire
investigation above costs **3,212 bytes and zero rows uploaded**, with the
number on screen the whole time.

That figure is the argument. It turns "your data is safe" from a promise into
something a sceptical person can watch tick upward and check.

The approval gate matters for the same reason. "The agent is supervised" is a
policy; a tool call that is still blocked while a card sits on screen saying
*nothing has changed yet* is a mechanism.

## Creativity

Most agent integrations move the data to the model. Enclave moves the questions
to the data and leaves the data where it is — then goes one step further and
lets the agent act on what it found, under a gate the human holds.

The result-budget cap started as context hygiene and became the product's
central claim: the same mechanism that keeps the agent's context small is what
makes the privacy guarantee auditable. The Activity Log exists because WebMCP is
otherwise invisible — you cannot see a tool call — and putting every one on
screen with its byte cost makes the mechanism legible to someone who has never
heard of the standard.

## How we built it

Vite, React, TypeScript, Tailwind, Zustand, DuckDB-WASM, ECharts. Tools are
defined once in `src/tools/` and consumed by two thin adapters — one registering
them with `document.modelContext`, one exposing the same list to the OpenAI
Responses API. One definition site, identical capabilities and identical
approval gates either way.

## Challenges

**DuckDB-WASM versus WebMCP's headers.** DuckDB's threaded `coi` bundle needs
cross-origin isolation, which conflicts with how we needed to serve the page. It
turned out `selectBundle()` only picks `coi` when the page is *already*
cross-origin isolated — so by deliberately not setting COOP/COEP we get the `eh`
bundle, which needs neither, alongside the `Origin-Agent-Cluster: ?1` that
WebMCP does require.

**Arrow's numbers are not numbers.** DuckDB returns `sum()` over integers as
`DECIMAL(38,0)`, which Arrow hands back as an object, and `count()` as a BigInt.
Both had to be flattened before anything downstream could read them.

**A race we only saw in a screenshot.** React StrictMode runs effects twice, and
two concurrent bootstraps collided on the same `DROP`/`CREATE`. Bootstrap is now
single-flight per engine, with a test that calls it three times at once.

**The native API is string-based.** `executeTool` takes its arguments as a JSON
string and hands the result envelope back as one; passing an object fails with
"Failed to parse input arguments". `inputSchema` comes back as a string too.

## What's next

Multi-store tenancy; approval policies that let an operator pre-authorise
low-risk actions while holding the rest; sharing a saved board as a link so
another operator's copy re-runs it against their own data — the analysis
travels, the data never does.
