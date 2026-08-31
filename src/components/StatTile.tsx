export function StatTile({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'warning'
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-[#fcfcfb] p-4 dark:border-neutral-800 dark:bg-[#1a1a19]">
      <div className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
        {label}
      </div>
      <div
        className={`pt-1.5 text-2xl font-semibold tabular-nums tracking-tight ${
          tone === 'warning'
            ? 'text-amber-600 dark:text-amber-500'
            : 'text-neutral-900 dark:text-neutral-100'
        }`}
      >
        {value}
      </div>
      {hint && <div className="pt-0.5 text-[11px] text-neutral-500">{hint}</div>}
    </div>
  )
}
