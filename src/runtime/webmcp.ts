import { type ToolContext, allTools, runTool } from '../tools'
import type { ModelContext } from './webmcp-types'

/**
 * The spec moved the API from navigator to document; Chrome 150 deprecated the
 * old name while the origin trial still ships both. Read whichever is present.
 */
function getModelContext(): ModelContext | undefined {
  return document.modelContext ?? navigator.modelContext
}

export function isWebMcpAvailable(): boolean {
  return getModelContext() !== undefined
}

export function registerWebMcpTools(ctx: ToolContext): {
  supported: boolean
  dispose: () => void
} {
  const mc = getModelContext()
  if (!mc) return { supported: false, dispose: () => {} }

  const controller = new AbortController()

  for (const tool of allTools) {
    void mc.registerTool(
      {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: { readOnlyHint: Boolean(tool.readOnly) },
        execute: async (args) => {
          const started = performance.now()
          const text = await runTool(tool, args, ctx)
          ctx.store.getState().logCall({
            tool: tool.name,
            args,
            bytes: new TextEncoder().encode(text).length,
            ms: Math.round(performance.now() - started),
            ok: !text.startsWith('Error:'),
          })
          return { content: [{ type: 'text', text }] }
        },
      },
      { signal: controller.signal },
    )
  }

  return { supported: true, dispose: () => controller.abort() }
}
