import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { bootstrapStore } from '../data/bootstrap'
import { DuckDbEngine } from '../data/duckdb-engine'
import type { QueryEngine } from '../data/engine'
import { registerWebMcpTools } from '../runtime/webmcp'
import { useStore } from '../store/store'
import type { ToolContext } from '../tools'

interface EngineValue {
  engine: QueryEngine
  ctx: ToolContext
  loading: boolean
  error: string | null
}

const Ctx = createContext<EngineValue | null>(null)

export function EngineProvider({ children }: { children: React.ReactNode }) {
  /** One engine for the life of the tab. The data lives inside it and nowhere else. */
  const engine = useMemo(() => new DuckDbEngine(), [])
  const ctx: ToolContext = useMemo(() => ({ engine, store: useStore }), [engine])
  const setSchema = useStore((s) => s.setSchema)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => registerWebMcpTools(ctx).dispose, [ctx])

  useEffect(() => {
    let cancelled = false
    bootstrapStore(engine)
      .then((schema) => {
        if (!cancelled) setSchema(schema)
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
  }, [engine, setSchema])

  const value = useMemo(() => ({ engine, ctx, loading, error }), [engine, ctx, loading, error])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useEngine(): EngineValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useEngine must be used inside EngineProvider')
  return v
}
