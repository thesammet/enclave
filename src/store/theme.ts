import { create } from 'zustand'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'enclave.theme'

export function systemTheme(): Theme {
  try {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function storedTheme(): Theme | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggle: () => void
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: storedTheme() ?? systemTheme(),

  setTheme: (theme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* private mode: the choice just does not persist */
    }
    applyTheme(theme)
    set({ theme })
  },

  toggle: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}))
