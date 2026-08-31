import { useEffect, useState } from 'react'
import type { QueryEngine } from '../data/engine'
import type { QueryResult } from '../data/types'

/** Runs a query and re-runs it whenever `version` changes. */
export function useQuery(sql: string, engine: QueryEngine, version = 0) {
  const [data, setData] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
  }, [sql, engine, version])

  return { data, error, loading }
}
