import { useEffect, useState } from 'react'

/** Two routes, no dependency: '/' is the landing page, '/app' the workbench. */
export function usePath(): string {
  const [path, setPath] = useState(() => window.location.pathname)
  useEffect(() => {
    const on = () => setPath(window.location.pathname)
    window.addEventListener('popstate', on)
    window.addEventListener('enclave:navigate', on)
    return () => {
      window.removeEventListener('popstate', on)
      window.removeEventListener('enclave:navigate', on)
    }
  }, [])
  return path
}

export function navigate(to: string): void {
  if (window.location.pathname === to) return
  window.history.pushState({}, '', to)
  window.dispatchEvent(new Event('enclave:navigate'))
  window.scrollTo(0, 0)
}
