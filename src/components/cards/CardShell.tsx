import type { ReactNode } from 'react'
import { useStore } from '../../store/store'

export function CardShell({
  id,
  title,
  subtitle,
  children,
}: {
  id: string
  title: string
  subtitle?: string
  children: ReactNode
}) {
  const removeCard = useStore((s) => s.removeCard)
  return (
    <section className="group flex flex-col rounded-lg border border-neutral-200 bg-[#fcfcfb] dark:border-neutral-800 dark:bg-[#1a1a19]">
      <header className="flex items-start justify-between gap-2 px-4 pt-3 pb-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {title}
          </h3>
          {subtitle && (
            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p>
          )}
        </div>
        <button
          onClick={() => removeCard(id)}
          aria-label={`Remove ${title}`}
          className="shrink-0 rounded px-1 text-neutral-300 opacity-0 transition
            group-hover:opacity-100 hover:text-neutral-600 dark:text-neutral-600
            dark:hover:text-neutral-300"
        >
          ✕
        </button>
      </header>
      <div className="min-h-0 flex-1 px-4 pb-3">{children}</div>
    </section>
  )
}

export function CardMessage({ text, tone }: { text: string; tone?: 'error' }) {
  return (
    <p
      className={`py-6 text-xs ${
        tone === 'error' ? 'text-red-600 dark:text-red-400' : 'text-neutral-400'
      }`}
    >
      {text}
    </p>
  )
}
