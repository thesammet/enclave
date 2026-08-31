import type { QueryEngine } from '../../data/engine'
import type { Card } from '../../store/types'
import { useCardQuery } from '../useCardQuery'
import { CardMessage, CardShell } from './CardShell'

export function TableCard({ card, engine }: { card: Card; engine: QueryEngine }) {
  const { data, error, loading } = useCardQuery(card.sql, engine)

  let body
  if (error) body = <CardMessage text={error} tone="error" />
  else if (loading || !data) body = <CardMessage text="Running…" />
  else
    body = (
      <div className="max-h-60 overflow-auto">
        <table className="w-full text-left text-xs tabular-nums">
          <thead className="sticky top-0 bg-[#fcfcfb] dark:bg-[#1a1a19]">
            <tr>
              {data.columns.map((c) => (
                <th
                  key={c}
                  className="border-b border-neutral-200 py-1.5 pr-3 font-medium
                    text-neutral-500 dark:border-neutral-800 dark:text-neutral-400"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i} className="border-b border-neutral-100 last:border-0 dark:border-neutral-900">
                {row.map((cell, j) => (
                  <td key={j} className="py-1.5 pr-3 text-neutral-700 dark:text-neutral-300">
                    {String(cell ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )

  return (
    <CardShell id={card.id} title={card.title} subtitle={`${data?.rows.length ?? 0} rows`}>
      {body}
    </CardShell>
  )
}
