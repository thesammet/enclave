import type { QueryEngine } from '../../data/engine'
import type { Card } from '../../store/types'
import { useCardQuery } from '../useCardQuery'
import { CardMessage, CardShell } from './CardShell'

function format(value: unknown, kind: string | undefined): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return String(value ?? '—')
  if (kind === 'currency')
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(n)
  if (kind === 'percent') return `${n.toFixed(1)}%`
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n)
}

export function KpiCard({ card, engine }: { card: Card; engine: QueryEngine }) {
  const { data, error, loading } = useCardQuery(card.sql, engine)

  let body
  if (error) body = <CardMessage text={error} tone="error" />
  else if (loading || !data) body = <CardMessage text="Running…" />
  else if (data.rows.length === 0) body = <CardMessage text="No rows" />
  else
    body = (
      <div className="py-2">
        <div className="text-3xl font-semibold tabular-nums tracking-tight text-neutral-900 dark:text-neutral-100">
          {format(data.rows[0][0], card.format)}
        </div>
        <div className="pt-0.5 text-xs text-neutral-400">{data.columns[0]}</div>
      </div>
    )

  return (
    <CardShell id={card.id} title={card.title}>
      {body}
    </CardShell>
  )
}
