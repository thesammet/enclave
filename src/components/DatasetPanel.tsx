import { useStore } from '../store/store'

const TYPE_STYLE: Record<string, string> = {
  number: 'text-blue-600 dark:text-blue-400',
  string: 'text-neutral-500',
  date: 'text-emerald-600 dark:text-emerald-400',
  boolean: 'text-violet-600 dark:text-violet-400',
}

export function DatasetPanel() {
  const schema = useStore((s) => s.schema)
  const globalFilter = useStore((s) => s.globalFilter)

  if (!schema) {
    return (
      <div className="text-xs text-neutral-400">
        No dataset loaded.
      </div>
    )
  }

  return (
    <div>
      <div className="pb-2 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
        Columns
      </div>

      {globalFilter && (
        <div className="mb-3 rounded-md border border-neutral-200 px-2 py-1.5 dark:border-neutral-800">
          <div className="text-[10px] uppercase tracking-wide text-neutral-400">Filter</div>
          <code className="block break-words font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
            {globalFilter}
          </code>
        </div>
      )}

      <ul className="space-y-0.5">
        {schema.columns.map((c) => (
          <li key={c.name} className="flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate text-neutral-700 dark:text-neutral-300">{c.name}</span>
            <span className={`shrink-0 font-mono text-[10px] ${TYPE_STYLE[c.type]}`}>
              {c.type}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
