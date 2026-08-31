import { useEffect, useState } from 'react'
import type { QueryEngine } from '../data/engine'
import type { QueryResult } from '../data/types'
import { useStore } from '../store/store'

/**
 * Runs a card's query, and re-runs it whenever the global filter changes.
 * That filterVersion dependency is the whole global-filter mechanism on the
 * UI side: one set_global_filter call re-renders every card on the board.
 */
export function useCardQuery(sql: string | undefined, engine: QueryEngine) {
  const filterVersion = useStore((s) => s.filterVersion)
  const [data, setData] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!sql) return
    let cancelled = false
    setLoading(true)
    engine
      .query(sql)
      .then((r) => {
        if (!cancelled) {
          setData(r)
          setError(null)
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sql, filterVersion, engine])

  return { data, error, loading }
}
