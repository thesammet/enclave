import { create } from 'zustand'

export interface TourStep {
  /** Matches a data-tour attribute in the DOM. */
  target: string
  title: string
  body: string
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: 'nav',
    title: 'A real back-office',
    body: 'Orders, products and analytics — every section runs on the same store data, loaded into this browser tab and going no further.',
  },
  {
    target: 'agent',
    title: 'The agent works through tools',
    body: 'ChatGPT operates this page through 22 tools it registers with the browser. It never receives a row of your data — only the answers the tools give back.',
  },
  {
    target: 'suggestion',
    title: 'Start here',
    body: 'Ask this and watch it work: it finds the March collapse, traces it to a supplier who went out of stock, and proposes a restock order for you to approve.',
  },
  {
    target: 'activity',
    title: 'Everything is on the record',
    body: 'Every tool call the agent makes, with its cost in bytes. The figure underneath is the exact amount of data that has left your browser.',
  },
]

const SEEN_KEY = 'enclave.tour.seen'

export function hasSeenTour(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return true // no storage: never nag
  }
}

function markSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, '1')
  } catch {
    /* private mode: the tour may show again, which is harmless */
  }
}

interface TourState {
  active: boolean
  step: number
  start: () => void
  next: () => void
  prev: () => void
  /** Ends the tour and remembers it, whether finished or skipped. */
  end: () => void
}

export const useTour = create<TourState>((set, get) => ({
  active: false,
  step: 0,

  start: () => set({ active: true, step: 0 }),

  next: () => {
    const next = get().step + 1
    if (next >= TOUR_STEPS.length) {
      get().end()
      return
    }
    set({ step: next })
  },

  prev: () => set({ step: Math.max(0, get().step - 1) }),

  end: () => {
    markSeen()
    set({ active: false, step: 0 })
  },
}))
