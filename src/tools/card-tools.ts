import type { ChartType } from '../store/types'
import { type ToolContext, type ToolDef, assertSelectOnly } from './registry'

const CHART_TYPES: ChartType[] = ['bar', 'line', 'area', 'scatter', 'pie']

const SPAN = {
  type: 'number',
  description: 'Card width in grid columns, 1 (narrow), 2, or 3 (full width). Defaults to 1.',
} as const

function clampSpan(span: unknown): 1 | 2 | 3 {
  const n = Math.round(Number(span))
  if (!Number.isFinite(n)) return 1
  return Math.max(1, Math.min(3, n)) as 1 | 2 | 3
}

function findCard(ctx: ToolContext, id: string) {
  const cards = ctx.store.getState().cards
  const card = cards.find((c) => c.id === id)
  if (!card) {
    throw new Error(
      `No card with id "${id}". Current card ids: ${
        cards.map((c) => c.id).join(', ') || '(none)'
      }. Call read_dashboard to see the board.`,
    )
  }
  return card
}

/** Runs the query once so a broken card is never added to the board. */
async function validate(ctx: ToolContext, sql: string) {
  assertSelectOnly(sql)
  return ctx.engine.query(sql)
}

export const cardTools: ToolDef[] = [
  {
    name: 'add_kpi',
    description:
      'Add a single-number card to the board. The SQL must return one row whose first column ' +
      'is the number to display.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        sql: { type: 'string', description: 'SELECT returning one row, one numeric column' },
        format: {
          type: 'string',
          enum: ['number', 'currency', 'percent'],
          description: 'Defaults to number',
        },
        span: SPAN,
      },
      required: ['title', 'sql'],
      additionalProperties: false,
    },
    async execute({ title, sql, format = 'number', span }, ctx) {
      await validate(ctx, sql)
      const id = ctx.store
        .getState()
        .addCard({ kind: 'kpi', title, sql, format, span: clampSpan(span) })
      return `Added KPI card "${title}" with id ${id}.`
    },
  },

  {
    name: 'add_chart',
    description:
      'Add a chart to the board. The SQL result supplies the data; x and y name columns in ' +
      'that result. Use series to split into multiple lines or bars.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        chartType: { type: 'string', enum: CHART_TYPES },
        sql: { type: 'string' },
        x: { type: 'string', description: 'Column in the result used for the category or x axis' },
        y: { type: 'string', description: 'Column in the result used for the value or y axis' },
        series: { type: 'string', description: 'Optional column to split the data by' },
        span: SPAN,
      },
      required: ['title', 'chartType', 'sql', 'x', 'y'],
      additionalProperties: false,
    },
    async execute({ title, chartType, sql, x, y, series, span }, ctx) {
      if (!CHART_TYPES.includes(chartType)) {
        throw new Error(
          `Unknown chartType "${chartType}". Use one of: ${CHART_TYPES.join(', ')}.`,
        )
      }
      const result = await validate(ctx, sql)
      for (const [label, col] of [
        ['x', x],
        ['y', y],
        ['series', series],
      ] as const) {
        if (col && !result.columns.includes(col)) {
          throw new Error(
            `The query result has no column "${col}" for ${label}. It returns: ${result.columns.join(
              ', ',
            )}.`,
          )
        }
      }
      const id = ctx.store.getState().addCard({
        kind: 'chart',
        title,
        sql,
        chartType,
        x,
        y,
        series,
        span: clampSpan(span ?? 2),
      })
      return `Added ${chartType} chart "${title}" with id ${id}.`
    },
  },

  {
    name: 'add_table',
    description: 'Add a table card showing the result of a query. Keep the row count small.',
    inputSchema: {
      type: 'object',
      properties: { title: { type: 'string' }, sql: { type: 'string' }, span: SPAN },
      required: ['title', 'sql'],
      additionalProperties: false,
    },
    async execute({ title, sql, span }, ctx) {
      await validate(ctx, sql)
      const id = ctx.store
        .getState()
        .addCard({ kind: 'table', title, sql, span: clampSpan(span ?? 2) })
      return `Added table card "${title}" with id ${id}.`
    },
  },

  {
    name: 'add_note',
    description:
      'Add a Markdown note to the board. Use this to record what you found — the finding is ' +
      'the point of the analysis, not the chart.',
    inputSchema: {
      type: 'object',
      properties: { title: { type: 'string' }, markdown: { type: 'string' }, span: SPAN },
      required: ['markdown'],
      additionalProperties: false,
    },
    async execute({ title = 'Note', markdown, span }, ctx) {
      const id = ctx.store
        .getState()
        .addCard({ kind: 'note', title, markdown, span: clampSpan(span) })
      return `Added note "${title}" with id ${id}.`
    },
  },

  {
    name: 'update_card',
    description:
      'Change the title, query, or chart configuration of a card already on the board.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        sql: { type: 'string' },
        chartType: { type: 'string', enum: CHART_TYPES },
        x: { type: 'string' },
        y: { type: 'string' },
        markdown: { type: 'string' },
      },
      required: ['id'],
      additionalProperties: false,
    },
    async execute({ id, ...patch }, ctx) {
      findCard(ctx, id)
      if (patch.sql) await validate(ctx, patch.sql)
      const clean = Object.fromEntries(
        Object.entries(patch).filter(([, v]) => v !== undefined),
      )
      ctx.store.getState().updateCard(id, clean)
      return `Updated card ${id}: ${Object.keys(clean).join(', ')}.`
    },
  },

  {
    name: 'remove_card',
    description:
      'Delete a card from the board by its id. Use read_dashboard first if you do not know ' +
      'the id. The deletion can be reversed with the undo tool.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
    async execute({ id }, ctx) {
      const card = findCard(ctx, id)
      ctx.store.getState().removeCard(id)
      return `Removed card "${card.title}".`
    },
  },

  {
    name: 'reorder_cards',
    description:
      'Set the order of cards on the board. Pass every card id in the order you want. ' +
      'Ids you omit are appended at the end.',
    inputSchema: {
      type: 'object',
      properties: { ids: { type: 'array', items: { type: 'string' } } },
      required: ['ids'],
      additionalProperties: false,
    },
    async execute({ ids }: { ids: string[] }, ctx) {
      ids.forEach((id) => findCard(ctx, id))
      ctx.store.getState().reorderCards(ids)
      return `Reordered ${ids.length} cards.`
    },
  },

  {
    name: 'resize_card',
    description: 'Set how many of the three grid columns a card spans.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, span: SPAN },
      required: ['id', 'span'],
      additionalProperties: false,
    },
    async execute({ id, span }, ctx) {
      findCard(ctx, id)
      const clamped = clampSpan(span)
      ctx.store.getState().resizeCard(id, clamped)
      return `Card ${id} now spans ${clamped} column(s).`
    },
  },

  {
    name: 'highlight_points',
    description:
      'Emphasise specific x-axis values on a chart — the months that dipped, the outlying ' +
      'regions. Highlighted points render in the accent colour while the rest fade back.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        values: {
          type: 'array',
          items: { type: 'string' },
          description: 'x values to emphasise',
        },
      },
      required: ['id', 'values'],
      additionalProperties: false,
    },
    async execute({ id, values }: { id: string; values: string[] }, ctx) {
      const card = findCard(ctx, id)
      if (card.kind !== 'chart') {
        throw new Error(
          `Card ${id} is a ${card.kind} card. highlight_points only works on chart cards.`,
        )
      }
      ctx.store.getState().setHighlights(id, values)
      return `Highlighted ${values.length} point(s) on "${card.title}".`
    },
  },
]
