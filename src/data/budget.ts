import type { QueryResult } from './types'

export const MAX_ROWS = 50
export const MAX_BYTES = 4096

const enc = new TextEncoder()

function render(result: QueryResult, take: number, total: number): string {
  const objects = result.rows
    .slice(0, take)
    .map((row) => Object.fromEntries(result.columns.map((c, i) => [c, row[i]])))
  const header =
    take < total ? `${total} rows (showing ${take} of ${total}):\n` : `${total} rows:\n`
  return header + JSON.stringify(objects)
}

/**
 * The privacy invariant. Every tool result passes through here before it can
 * reach an agent, so what leaves the browser is bounded and measurable.
 */
export function budget(result: QueryResult): {
  text: string
  bytes: number
  truncated: boolean
} {
  const total = result.rows.length
  let take = Math.min(total, MAX_ROWS)
  let text = render(result, take, total)

  while (enc.encode(text).length > MAX_BYTES && take > 0) {
    take -= 1
    text = render(result, take, total)
  }

  if (take === 0 && total > 0) {
    text =
      `${total} rows, but a single row exceeds the ${MAX_BYTES} byte result budget. ` +
      `Aggregate the data or select fewer columns.`
  }

  return {
    text,
    bytes: enc.encode(text).length,
    truncated: take < total,
  }
}
