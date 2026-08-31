# Enclave

**Drag your data in. Let ChatGPT analyse it without ever seeing it.**

A browser-only analysis workbench built for [The WebMCP Challenge](https://webmcp.devpost.com/).

Your CSV never leaves the tab. DuckDB-WASM holds it in memory and runs real SQL
over it. An AI agent — ChatGPT over WebMCP, or the built-in panel — cannot see
the data; it can only call the 16 tools this page exposes to profile columns,
run queries, and assemble a dashboard alongside you.

Design spec: [`docs/superpowers/specs/2026-08-31-enclave-design.md`](docs/superpowers/specs/2026-08-31-enclave-design.md)

## Licence

MIT
