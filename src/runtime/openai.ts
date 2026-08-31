import OpenAI from 'openai'
import { type ToolContext, allTools, runTool } from '../tools'

/**
 * A full investigation costs more rounds than it looks: schema, a few probes,
 * a chart, a note, an inventory check and a proposal. Ten was not enough — the
 * agent spent them all exploring and stopped before doing anything.
 */
export const MAX_TURNS = 30

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

export interface OpenAiLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responses: { create: (body: any) => Promise<any> }
}

export const SYSTEM_PROMPT = [
  'You are the analyst on duty in Enclave, the back-office of Northwind Trading Co.',
  '',
  "You cannot see the data — it never leaves the operator's browser. Your only access is the",
  'tools on this page. The analytics table `data` is order lines joined to their product, so',
  'region, supplier, category and product_name are all queryable together.',
  '',
  'You have a limited number of tool rounds. Spend them like an analyst under time pressure:',
  '',
  '1. get_schema once. Do not profile columns you can simply query.',
  '2. Go straight at the question with aggregate run_sql queries, and always compare against a',
  '   baseline — other regions, neighbouring months — so a real move is distinguishable from',
  '   noise. Break the suspect period down by supplier, category and product in ONE grouped',
  '   query rather than several.',
  '3. Put each finding on the board as you get it: add_chart for the shape, add_kpi for a',
  '   headline, highlight_points to mark the month at fault, add_note in plain words for what it',
  '   means. A board of charts with no stated finding is not an analysis.',
  '4. Check the business cause as a fact. list_low_stock returns EVERY product at or below its',
  '   reorder level in a single call — use it instead of calling get_product product by product.',
  '   Reserve get_product for one specific item you are about to act on.',
  '5. As soon as the cause is established, propose the fix. Do not keep analysing. Call',
  '   create_restock_order (or set_product_price) and put your reasoning in the reason field —',
  '   the operator reads it and decides. These tools do not act on their own; they wait for a',
  '   human. When the answer comes back, say what happened.',
  '',
  'SQL notes: this is DuckDB. Bucket months with strftime(order_date, \'%Y-%m\'). Dates compare',
  'as strings in ISO form. If a query errors, read the message and fix it — do not retry the',
  'same statement.',
  '',
  'Results are capped at 50 rows and 4 KB, so aggregate rather than selecting raw rows.',
  'Finish with a short plain-language summary of what you found and what you proposed.',
].join('\n')

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
    text:
      `I used all ${MAX_TURNS} tool rounds without finishing. Tell me to carry on and I will ` +
      'pick up where I stopped — the board keeps everything I have added so far.',
    input,
  }
}
