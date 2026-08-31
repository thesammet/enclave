import { useState } from 'react'
import type { QueryEngine } from '../data/engine'
import { useStore } from '../store/store'
import { ChartCard } from './cards/ChartCard'
import { KpiCard } from './cards/KpiCard'
import { NoteCard } from './cards/NoteCard'
import { TableCard } from './cards/TableCard'

const SPAN = { 1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3' } as const

const EXAMPLES = [
  'Which region underperformed in 2025, and when?',
  'EMEA fell in March. Find the cause and fix it.',
  'Break revenue down by supplier, then filter to EMEA',
]

export function Board({ engine }: { engine: QueryEngine }) {
  const cards = useStore((s) => s.cards)
  const reorderCards = useStore((s) => s.reorderCards)
  const [dragging, setDragging] = useState<string | null>(null)

  if (cards.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-neutral-500">The board is empty.</p>
        <ul className="space-y-1">
          {EXAMPLES.map((e) => (
            <li key={e} className="text-xs text-neutral-400">
              “{e}”
            </li>
          ))}
        </ul>
      </div>
    )
  }

  function drop(targetId: string) {
    if (!dragging || dragging === targetId) return
    const ids = cards.map((c) => c.id).filter((id) => id !== dragging)
    ids.splice(ids.indexOf(targetId), 0, dragging)
    reorderCards(ids)
    setDragging(null)
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.id}
          draggable
          onDragStart={() => setDragging(card.id)}
          onDragEnd={() => setDragging(null)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => drop(card.id)}
          className={`${SPAN[card.span]} ${dragging === card.id ? 'opacity-40' : ''}`}
        >
          {card.kind === 'kpi' && <KpiCard card={card} engine={engine} />}
          {card.kind === 'chart' && <ChartCard card={card} engine={engine} />}
          {card.kind === 'table' && <TableCard card={card} engine={engine} />}
          {card.kind === 'note' && <NoteCard card={card} />}
        </div>
      ))}
    </div>
  )
}
