export interface ModelContextTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean }
  execute: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: any,
    options: { signal?: AbortSignal },
  ) => Promise<{ content: Array<{ type: 'text'; text: string }> }>
}

export interface ModelContext {
  registerTool: (
    tool: ModelContextTool,
    options?: { signal?: AbortSignal },
  ) => Promise<void>
}

declare global {
  interface Document {
    modelContext?: ModelContext
  }
  interface Navigator {
    modelContext?: ModelContext
  }
}
