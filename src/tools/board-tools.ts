import { type ToolDef, assertSelectOnly } from './registry'

export const boardTools: ToolDef[] = [
  {
    name: 'read_dashboard',
    description:
      'Read what is currently on the board: every card with its id, kind, title and query, ' +
      'plus the active global filter. Call this before modifying cards you did not create.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    readOnly: true,
    async execute(_args, ctx) {
      const { cards, globalFilter } = ctx.store.getState()
      const filterLine = globalFilter ? `Global filter: ${globalFilter}` : 'Global filter: none'
      if (cards.length === 0) return `The board is empty.\n${filterLine}`
      const lines = cards.map((c, i) => {
        const detail =
          c.kind === 'note'
            ? (c.markdown ?? '').slice(0, 120)
            : `${c.chartType ? c.chartType + ', ' : ''}sql: ${c.sql}`
        return `${i + 1}. [${c.id}] ${c.kind} "${c.title}" (span ${c.span}) — ${detail}`
      })
      return `${cards.length} card(s) on the board:\n${lines.join('\n')}\n${filterLine}`
    },
  },

  {
    name: 'set_global_filter',
    description:
      'Apply one SQL WHERE clause across the entire board at once. Every card re-runs its ' +
      'query against the filtered data. Call with no arguments to clear the filter. Write the ' +
      "clause without the WHERE keyword, for example: region = 'EMEA' AND order_date >= '2025-01-01'.",
    inputSchema: {
      type: 'object',
      properties: {
        where: {
          type: 'string',
          description: 'A SQL boolean expression, without the WHERE keyword. Omit to clear.',
        },
      },
      additionalProperties: false,
    },
    async execute({ where }: { where?: string }, ctx) {
      if (!where) {
        await ctx.engine.setFilter(null)
        ctx.store.getState().setGlobalFilter(null)
        return 'Cleared the global filter. The board now shows the full dataset.'
      }
      assertSelectOnly(where)
      await ctx.engine.setFilter(where)
      ctx.store.getState().setGlobalFilter(where)
      const rows = ctx.engine.getSchema()?.rowCount
      return `Global filter set to: ${where}. ${
        rows !== undefined ? `${rows} rows now visible.` : ''
      }`.trim()
    },
  },

  {
    name: 'undo',
    description:
      'Revert the last change to the board — a card added, edited, removed, reordered, or a ' +
      'filter applied. Never touches the loaded dataset.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    async execute(_args, ctx) {
      const ok = ctx.store.getState().undo()
      if (!ok) return 'Nothing to undo.'
      await ctx.engine.setFilter(ctx.store.getState().globalFilter)
      return 'Undid the last board change.'
    },
  },
]
