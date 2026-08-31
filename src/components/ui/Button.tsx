import type { ButtonHTMLAttributes } from 'react'

export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white
        transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40
        dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white ${className}`}
    />
  )
}
