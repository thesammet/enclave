import { useRef, useState } from 'react'
import { STORE_BASE_SELECT } from '../data/bootstrap'
import { assertLooksLikeCsv } from '../data/csv'
import type { QueryEngine } from '../data/engine'
import { useStore } from '../store/store'

const SAMPLES = [
  { file: 'support-tickets.csv', label: 'Support tickets', hint: '20k rows · 2024–2025' },
  { file: 'orders.csv', label: 'Orders export', hint: '60k rows · flat order lines' },
]


export function DropZone({
  engine,
  onLoaded,
}: {
  engine: QueryEngine
  onLoaded?: () => void
}) {
  const setSchema = useStore((s) => s.setSchema)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [over, setOver] = useState(false)
  const picker = useRef<HTMLInputElement>(null)

  async function load(name: string, text: string) {
    setBusy(name)
    setError(null)
    try {
      assertLooksLikeCsv(name, text)
      setSchema(await engine.loadCsv(name, text))
      onLoaded?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  const loadFile = async (file: File) => load(file.name, await file.text())

  async function loadSample(file: string) {
    setBusy(file)
    try {
      const res = await fetch(`/samples/${file}`)
      if (!res.ok) throw new Error(`Could not load ${file}`)
      await load(file, await res.text())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-6">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          const file = e.dataTransfer.files[0]
          if (file) void loadFile(file)
        }}
        onClick={() => picker.current?.click()}
        className={`flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border
          border-dashed px-8 py-14 text-center transition ${
            over
              ? 'border-neutral-500 bg-neutral-100 dark:bg-neutral-900'
              : 'border-neutral-300 dark:border-neutral-700'
          }`}
      >
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {busy ? `Loading ${busy}…` : 'Drop a CSV here'}
        </p>
        <p className="max-w-sm text-xs leading-relaxed text-neutral-500">
          It is read in this tab and never uploaded. The agent gets tools, not your data.
        </p>
        <input
          ref={picker}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void loadFile(file)
          }}
        />
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex w-full flex-col gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
          Or analyse
        </p>
        <button
          onClick={async () => {
            setBusy('the store')
            setError(null)
            try {
              setSchema(await engine.setBase(STORE_BASE_SELECT))
              onLoaded?.()
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e))
            } finally {
              setBusy(null)
            }
          }}
          disabled={Boolean(busy)}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-left transition
            hover:border-neutral-400 disabled:opacity-40 dark:border-neutral-800
            dark:hover:border-neutral-600"
        >
          <div className="text-sm text-neutral-900 dark:text-neutral-100">
            Northwind&rsquo;s own data
          </div>
          <div className="text-xs text-neutral-500">
            Orders joined to the catalogue — the default view
          </div>
        </button>
        <div className="grid grid-cols-2 gap-2">
          {SAMPLES.map((s) => (
            <button
              key={s.file}
              onClick={() => void loadSample(s.file)}
              disabled={Boolean(busy)}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-left transition
                hover:border-neutral-400 disabled:opacity-40 dark:border-neutral-800
                dark:hover:border-neutral-600"
            >
              <div className="text-sm text-neutral-900 dark:text-neutral-100">{s.label}</div>
              <div className="text-xs text-neutral-500">{s.hint}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
