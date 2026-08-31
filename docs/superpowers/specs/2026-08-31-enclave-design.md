# Enclave — Design Spec

**Date:** 2026-08-31
**Context:** Submission for The WebMCP Challenge (hosted by OpenAI, Devpost).
Deadline 2026-09-03 13:00 PDT.
**Status:** Approved, ready for implementation planning.

---

## 1. Problem

You cannot paste your company's sales data, your patients' records, or your
users' export into ChatGPT. So the most capable analyst available to you is
locked out of exactly the data you most need help with.

Uploading to a hosted notebook does not solve it either — the data still
leaves the machine.

## 2. Product

Enclave is a browser-only analysis workbench. The user drags a CSV or Parquet
file onto the page. The file is never uploaded: DuckDB-WASM holds it in the
tab's memory and runs real SQL over it.

An AI agent — ChatGPT via WebMCP, or the built-in panel — cannot see the data.
It can only call the tools the page exposes. Using them it profiles columns,
runs queries, and assembles a dashboard of KPI, chart, table and note cards.
The human works on the same board: reordering, resizing, editing, deleting by
hand.

**One-line pitch:** *Drag your data in. Let ChatGPT analyse it without ever
seeing it.*

## 3. Architecture

```
             ┌─────────────── Enclave (browser tab) ───────────────┐
             │                                                     │
  ChatGPT ───┼──→ document.modelContext ──┐                        │
             │                            ├──→ TOOL REGISTRY       │
  Built-in ──┼──→ OpenAI Responses API ───┘    (16 tools, one      │
  panel      │    (user's own key,              definition site)   │
             │     browser → api.openai.com)         │             │
             │                                       ▼             │
             │                              Zustand store          │
             │                              ├─ dataset             │
             │                              ├─ cards[]             │
             │                              └─ auditLog[]          │
             │                                       │             │
             │                                       ▼             │
             │                          DuckDB-WASM ←── CSV        │
             │                          (tab memory)               │
             └─────────────────────────────────────────────────────┘
                    no server. data never leaves the tab.
```

### 3.1 One registry, two runtimes

Tools are defined once in `src/tools/*.ts`. Two thin adapters consume that
registry:

- `src/runtime/webmcp.ts` — registers each tool with
  `document.modelContext ?? navigator.modelContext`.
- `src/runtime/openai.ts` — maps the same registry to OpenAI Responses API
  tool definitions and dispatches calls back to the same `execute`.

Consequence: the capability surface is identical no matter which agent drives
it, and there is exactly one place to add a tool.

### 3.2 WebMCP API surface (as of Aug 2026)

The spec moved from `navigator.modelContext` to `document.modelContext`;
Chrome 150 deprecated the old name but the origin trial still ships both.
Feature-detect both.

```js
const mc = document.modelContext ?? navigator.modelContext;
await mc.registerTool({
  name, description, inputSchema,        // JSON Schema
  annotations: { readOnlyHint: true },   // optional
  execute: async (args, { signal }) => ({ content: [{ type: 'text', text }] })
}, { signal: controller.signal });       // controller.abort() unregisters
```

Deployment requirements: the document must be origin-isolated
(`Origin-Agent-Cluster: ?1`), and WebMCP is gated by the `tools` Permissions
Policy, which defaults to `self` — adequate for us.

### 3.3 No backend

Static deploy to Vercel. The only server-side artefact is `vercel.json`
setting the `Origin-Agent-Cluster` header. The built-in agent panel calls the
OpenAI API directly from the browser using a key the user pastes, held in
`localStorage` and never transmitted anywhere but api.openai.com.

## 4. Tool surface (16)

Designed for bidirectionality, not count: the agent must be able to read the
current state of both the data and the board, not only write to them.

### Explore the data (read-only)
| Tool | Behaviour |
|---|---|
| `get_schema` | Column names, types, row count |
| `profile_column` | min/max/nulls/distinct/histogram/top values for one column |
| `sample_rows` | A few rows so the agent can see the shape (capped) |
| `run_sql` | Arbitrary DuckDB SQL against the loaded table |

### Build the board (write)
| Tool | Behaviour |
|---|---|
| `add_kpi` | Single-number card with optional comparison |
| `add_chart` | bar / line / area / scatter / pie, fed by SQL |
| `add_table` | Query-result table card |
| `add_note` | Markdown card — where the agent writes its finding |
| `update_card` | Change title, type, or query of an existing card |
| `remove_card` | Delete a card |
| `reorder_cards` | Set board order |
| `resize_card` | Set card span |
| `highlight_points` | Mark anomalies on an existing chart |

### Read the board and control it
| Tool | Behaviour |
|---|---|
| `read_dashboard` | What is on the board now, and by which queries |
| `set_global_filter` | Apply one WHERE clause across every card at once |
| `undo` | Revert the last board mutation (cards and filter only — never the loaded dataset) |

### 4.1 Result budget (privacy invariant)

Every tool result passes through one capping function before it is returned:
**max 50 rows and 4 KB of text.** Raw row dumps are refused with a message
steering the agent toward aggregation. This serves three purposes: it keeps
the agent's context small, it keeps queries honest, and it makes the privacy
claim measurable rather than rhetorical.

## 5. Interface

Three regions:

- **Left** — dataset panel: column list, types, inline mini-profiles.
- **Centre** — the board: responsive card grid, drag to reorder.
- **Right** — **Activity Log**: every tool call the agent made, with its
  arguments, result size in bytes, and duration.

The Activity Log is the differentiator. It is the only thing that makes WebMCP
*visible* in a demo video, and it doubles as the evidence for the privacy
claim — a running counter beneath it reads
**"247 B left your browser · 0 rows uploaded"**.

### 5.1 Stack

Vite · React · TypeScript · Tailwind · shadcn/ui · Zustand · DuckDB-WASM ·
ECharts. Chart colour, axis and mark decisions come from the `dataviz` skill,
consulted before any chart code is written.

## 6. Demo video (< 3 min, narrated)

| Time | Beat |
|---|---|
| 0:00 | The problem: you can't paste this file into ChatGPT |
| 0:20 | Drop a 200k-row CSV. Network tab stays empty |
| 0:40 | "Explore this and build me a dashboard" — schema, profiles, queries, then KPI and chart cards appearing live while the Activity Log ticks |
| 1:40 | "Why the March dip?" — agent drills down, adds a chart and a note |
| 2:20 | "Only EMEA, last 12 months" — `set_global_filter`, whole board re-renders |
| 2:40 | Close on the Activity Log and the bytes counter |

## 7. Schedule

| When | Work |
|---|---|
| **Aug 31** | Scaffold · DuckDB-WASM CSV load · `get_schema` + `run_sql` + `add_chart` end to end · **deploy to Vercel today** · verify native WebMCP in Chrome Canary |
| **Sep 1** | All 16 tools · chart types · built-in agent panel (BYO key) · Activity Log |
| **Sep 2** | UI polish · 2 bundled sample datasets · README + MIT licence · record demo video |
| **Sep 3 AM** | Buffer · submission write-up · submit (23:00 TR hard stop) |

## 8. Risks

**DuckDB-WASM cross-origin isolation (highest).** Some DuckDB-WASM builds want
`SharedArrayBuffer`, which requires COOP/COEP headers that may interact badly
with WebMCP's origin-isolation requirement. Tested first, before anything else
is built. Fallback ladder: the DuckDB MVP bundle that does not need SAB →
Arquero (pure JS). Under Arquero, `run_sql` becomes a structured query tool
and the rest of the design stands unchanged.

**No Chrome on the dev machine.** Only Brave and Safari are installed. Chrome
Canary with `chrome://flags/#enable-webmcp-testing` must be installed to
verify the native path. The built-in panel means this does not block
development, but the submission claims native WebMCP support and that claim
must be verified before submitting.

**Scope.** The tool surface is the scored artefact; UI polish is not. If time
runs short, cut polish, never tools.

## 9. Out of scope

No accounts, no persistence beyond `localStorage`, no collaboration, no
multi-file joins, no Excel parsing, no data export to a server.

## 10. Licence

MIT, visible in the repository About section as the Devpost rules require.
