import { useApprovals } from '../store/approvals'

/**
 * Where the human and the agent actually meet. The agent has stopped and is
 * waiting; nothing has changed until someone here says so.
 */
export function ApprovalPanel() {
  const pending = useApprovals((s) => s.pending)
  const decide = useApprovals((s) => s.decide)

  if (pending.length === 0) return null

  return (
    <div className="space-y-2 border-b border-neutral-200 p-3 dark:border-neutral-800">
      {pending.map((a) => (
        <div
          key={a.id}
          className="rounded-lg border border-amber-500/40 bg-amber-50 p-3 dark:bg-amber-500/5"
        >
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
            <span className="text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-500">
              Needs your approval
            </span>
          </div>

          <p className="pt-1.5 text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {a.summary}
          </p>

          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 pt-2 text-[11px]">
            {a.detail.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-neutral-500">{k}</dt>
                <dd className="text-neutral-800 dark:text-neutral-200">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="flex gap-2 pt-3">
            <button
              onClick={() => decide(a.id, true)}
              className="flex-1 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white
                transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
            >
              Approve
            </button>
            <button
              onClick={() => decide(a.id, false)}
              className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-xs
                transition hover:border-neutral-500 dark:border-neutral-700"
            >
              Decline
            </button>
          </div>

          <p className="pt-2 text-[10px] text-neutral-500">
            The agent is waiting. Nothing has changed yet.
          </p>
        </div>
      ))}
    </div>
  )
}
