import { useEffect, useMemo } from 'react'
import { ActivityLog } from './components/ActivityLog'
import { AgentPanel } from './components/AgentPanel'
import { Board } from './components/Board'
import { DatasetPanel } from './components/DatasetPanel'
import { DropZone } from './components/DropZone'
import { DuckDbEngine } from './data/duckdb-engine'
import { registerWebMcpTools } from './runtime/webmcp'
import { useStore } from './store/store'
import type { ToolContext } from './tools'

export default function App() {
  /** One engine for the life of the tab. The CSV lives inside it and nowhere else. */
  const engine = useMemo(() => new DuckDbEngine(), [])
  const ctx: ToolContext = useMemo(() => ({ engine, store: useStore }), [engine])
  const schema = useStore((s) => s.schema)

  useEffect(() => registerWebMcpTools(ctx).dispose, [ctx])

  return (
    <div className="flex h-screen bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <aside className="hidden w-[240px] shrink-0 overflow-y-auto border-r border-neutral-200 md:block dark:border-neutral-800">
        <div className="px-3 pt-3">
          <div className="text-sm font-semibold tracking-tight">Enclave</div>
          <div className="text-[11px] leading-tight text-neutral-500">
            Analyse data ChatGPT can’t see
          </div>
        </div>
        <DatasetPanel />
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        {schema ? <Board engine={engine} /> : <DropZone engine={engine} />}
      </main>

      <aside className="flex w-[360px] shrink-0 flex-col border-l border-neutral-200 dark:border-neutral-800">
        <div className="min-h-0 flex-1">
          <AgentPanel ctx={ctx} />
        </div>
        <div className="h-[38%] min-h-[180px]">
          <ActivityLog />
        </div>
      </aside>
    </div>
  )
}
