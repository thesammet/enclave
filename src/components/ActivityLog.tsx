import { useStore } from '../store/store'

/**
 * Makes WebMCP visible and the privacy claim measurable: every tool call the
 * agent made, and the exact number of bytes that left the browser.
 */
export function ActivityLog() {
  const log = useStore((s) => s.auditLog)
  const bytesOut = useStore((s) => s.bytesOut)

  return (
    <div className="flex h-full flex-col border-t border-neutral-200 dark:border-neutral-800">
      <div className="px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
        Activity
      </div>

      <div className="flex-1 overflow-y-auto px-3 font-mono text-[11px]">
        {log.length === 0 && <div className="py-1 text-neutral-400">No tool calls yet.</div>}
        {log.map((e) => (
          <div key={e.id} className="flex items-baseline gap-2 py-0.5">
            <span
              className={e.ok ? 'text-emerald-500' : 'text-red-500'}
              title={e.ok ? 'ok' : 'failed'}
            >
              {e.ok ? '●' : '✕'}
            </span>
            <span className="truncate text-neutral-800 dark:text-neutral-200">{e.tool}</span>
            <span className="ml-auto shrink-0 tabular-nums text-neutral-400">
              {e.bytes} B · {e.ms} ms
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-neutral-200 px-3 py-2 text-[11px] dark:border-neutral-800">
        <span className="font-medium tabular-nums text-neutral-800 dark:text-neutral-200">
          {bytesOut} B left your browser
        </span>
        <span className="text-neutral-400"> · 0 rows uploaded</span>
      </div>
    </div>
  )
}
