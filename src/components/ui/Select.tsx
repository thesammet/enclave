import type { SelectHTMLAttributes } from 'react'

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={`relative ${className}`}>
      <select
        {...props}
        className="w-full appearance-none rounded-md border border-neutral-300 bg-white py-1.5
          pl-2.5 pr-7 text-xs text-neutral-900 outline-none transition focus:border-neutral-500
          dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100
          dark:focus:border-neutral-500"
      />
      <svg
        viewBox="0 0 12 12"
        aria-hidden
        className="pointer-events-none absolute right-2 top-1/2 h-2.5 w-2.5 -translate-y-1/2
          fill-none stroke-neutral-400 stroke-[1.5]"
      >
        <path d="M3 4.5 6 7.5 9 4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
