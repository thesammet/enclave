import { type ReactNode, useEffect, useRef, useState } from 'react'

export function Menu({
  label,
  align = 'right',
  width = 'w-72',
  children,
}: {
  label: ReactNode
  align?: 'left' | 'right'
  width?: string
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={root} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="rounded-md px-2 py-1 text-xs text-neutral-600 transition hover:bg-neutral-200/60
          dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        {label}
      </button>
      {open && (
        <div
          className={`absolute z-20 mt-1 ${width} ${align === 'right' ? 'right-0' : 'left-0'}
            rounded-lg border border-neutral-200 bg-white p-2 shadow-lg
            dark:border-neutral-800 dark:bg-neutral-900`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}
