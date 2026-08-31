import type { QueryEngine } from '../data/engine'
import type { useStore } from '../store/store'

export interface ToolContext {
  engine: QueryEngine
  store: typeof useStore
}

export interface ToolDef {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  /** Marks tools that mutate neither the board nor the data. */
  readOnly?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (args: any, ctx: ToolContext) => Promise<string>
}

/** Rejects SQL that could mutate or escape the read-only contract. */
export function assertSelectOnly(sql: string): void {
  const forbidden =
    /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|ATTACH|COPY|INSTALL|LOAD|PRAGMA)\b/i
  if (forbidden.test(sql)) {
    throw new Error(
      'Only SELECT queries are allowed. Use set_global_filter to change what data is visible.',
    )
  }
}

/** Runs a tool, converting a throw into agent-readable text. Both adapters use this. */
export async function runTool(
  tool: ToolDef,
  args: unknown,
  ctx: ToolContext,
): Promise<string> {
  try {
    return await tool.execute(args, ctx)
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`
  }
}
