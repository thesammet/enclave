import OpenAI from 'openai'
import { type ToolContext, allTools, runTool } from '../tools'

const MAX_TURNS = 10

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

export interface OpenAiLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responses: { create: (body: any) => Promise<any> }
}

export const SYSTEM_PROMPT =
  'You are a data analyst working inside Enclave, a browser-only workbench. ' +
  "You cannot see the dataset — it never leaves the user's machine. Your only access is the " +
  'tools on this page. Start with get_schema. Investigate with run_sql and profile_column, ' +
  'then build the answer on the board with add_kpi, add_chart, add_table and add_note. Always ' +
  'write a note recording what you found; a board of charts without a stated finding is not an ' +
  'analysis. Results are capped at 50 rows and 4 KB, so aggregate rather than selecting raw rows.'

export function toOpenAiTools() {
  return allTools.map((t) => ({
    type: 'function' as const,
    name: t.name,
    description: t.description,
    parameters: t.inputSchema,
  }))
}

/**
 * Drives one user turn to completion: calls the model, runs whatever tools it
 * asks for against the same registry WebMCP uses, feeds the outputs back, and
 * repeats until the model answers or the turn budget runs out.
 */
export async function runAgentTurn(opts: {
  apiKey: string
  model: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any[]
  ctx: ToolContext
  onToolCall?: (name: string) => void
  client?: OpenAiLike
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): Promise<{ text: string; input: any[] }> {
  const client: OpenAiLike =
    opts.client ?? (new OpenAI({ apiKey: opts.apiKey, dangerouslyAllowBrowser: true }) as OpenAiLike)

  let input = [...opts.input]

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await client.responses.create({
      model: opts.model,
      instructions: SYSTEM_PROMPT,
      input,
      tools: toOpenAiTools(),
    })

    const output = response.output ?? []
    const calls = output.filter((o: { type?: string }) => o.type === 'function_call')
    input = [...input, ...output]

    if (calls.length === 0) {
      return { text: response.output_text ?? '', input }
    }

    for (const call of calls) {
      opts.onToolCall?.(call.name)
      const tool = allTools.find((t) => t.name === call.name)
      const started = performance.now()
      let result: string

      if (!tool) {
        result = `Error: no tool named ${call.name}`
      } else {
        try {
          result = await runTool(tool, JSON.parse(call.arguments), opts.ctx)
        } catch (e) {
          result = `Error: could not parse arguments for ${call.name}: ${
            e instanceof Error ? e.message : String(e)
          }`
        }
      }

      opts.ctx.store.getState().logCall({
        tool: call.name,
        args: call.arguments,
        bytes: new TextEncoder().encode(result).length,
        ms: Math.round(performance.now() - started),
        ok: !result.startsWith('Error'),
      })

      input = [...input, { type: 'function_call_output', call_id: call.call_id, output: result }]
    }
  }

  return {
    text: `I stopped after ${MAX_TURNS} tool rounds. Ask me to continue if that was too soon.`,
    input,
  }
}
