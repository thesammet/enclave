import { useState } from 'react'
import { useEngine } from '../app/EngineContext'
import { Board } from '../components/Board'
import { DatasetPanel } from '../components/DatasetPanel'
import { DropZone } from '../components/DropZone'
import { useStore } from '../store/store'

export function Analytics() {
  const { engine } = useEngine()
  const schema = useStore((s) => s.schema)
  const [replacing, setReplacing] = useState(false)

  if (replacing || !schema) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight">Analytics</h1>
          {schema && (
            <button
              onClick={() => setReplacing(false)}
              className="ml-auto text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              Back to the board
            </button>
          )}
        </div>
        <div className="h-[70vh]">
          <DropZone engine={engine} onLoaded={() => setReplacing(false)} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full gap-5">
      <aside className="w-[180px] shrink-0 overflow-y-auto">
        <div className="pb-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            Analysing
          </div>
          <div className="text-xs text-neutral-900 dark:text-neutral-100">
            {schema.rowCount.toLocaleString()} rows
          </div>
        </div>
        <DatasetPanel />
        <button
          onClick={() => setReplacing(true)}
          className="mt-3 w-full rounded-md border border-neutral-200 px-2 py-1.5 text-[11px]
            text-neutral-500 transition hover:border-neutral-400 dark:border-neutral-800
            dark:hover:border-neutral-600"
        >
          Analyse a different file
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        <Board engine={engine} />
      </div>
    </div>
  )
}
