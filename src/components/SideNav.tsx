import { navigate, usePath } from '../router'
import { useApprovals } from '../store/approvals'

const SECTIONS = [
  { path: '/app', label: 'Overview' },
  { path: '/app/orders', label: 'Orders' },
  { path: '/app/products', label: 'Products' },
  { path: '/app/analytics', label: 'Analytics' },
]

export function SideNav() {
  const path = usePath()
  const pending = useApprovals((s) => s.pending.length)

  return (
    <nav data-tour="nav" className="flex w-[190px] shrink-0 flex-col gap-0.5 border-r border-neutral-200 p-2 dark:border-neutral-800">
      <div className="px-2 pt-1 pb-3">
        <div className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
          Northwind Trading Co.
        </div>
        <div className="text-[10px] text-neutral-400">Commerce back-office</div>
      </div>

      {SECTIONS.map((s) => (
        <button
          key={s.path}
          onClick={() => navigate(s.path)}
          className={`flex items-center justify-between rounded-md px-2 py-1.5 text-left text-xs
            transition ${
              path === s.path
                ? 'bg-neutral-200/70 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                : 'text-neutral-600 hover:bg-neutral-200/40 dark:text-neutral-400 dark:hover:bg-neutral-800/60'
            }`}
        >
          {s.label}
          {s.label === 'Overview' && pending > 0 && (
            <span className="rounded-full bg-amber-500 px-1.5 text-[10px] font-medium text-white">
              {pending}
            </span>
          )}
        </button>
      ))}

      <div className="mt-auto px-2 pb-1 text-[10px] leading-relaxed text-neutral-400">
        Store data is loaded into this browser tab and goes no further.
      </div>
    </nav>
  )
}
