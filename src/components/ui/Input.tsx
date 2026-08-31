import type { InputHTMLAttributes } from 'react'

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm
        outline-none placeholder:text-neutral-400 focus:border-neutral-500
        dark:border-neutral-800 dark:bg-neutral-900 dark:focus:border-neutral-600 ${className}`}
    />
  )
}
