import { create } from 'zustand'
import { DEFAULT_LIMITS, type Limits } from '../data/budget'
import type { Schema } from '../data/types'
import type { AuditEntry, Card } from './types'

const HISTORY_LIMIT = 20

interface Snapshot {
  cards: Card[]
  globalFilter: string | null
}

interface State {
  schema: Schema | null
  cards: Card[]
  globalFilter: string | null
  filterVersion: number
  auditLog: AuditEntry[]
  bytesOut: number
  history: Snapshot[]
  /** How much any single tool result may carry out of the browser. */
  resultBudget: Limits

  setSchema: (schema: Schema | null) => void
  addCard: (card: Omit<Card, 'id'>) => string
  updateCard: (id: string, patch: Partial<Omit<Card, 'id'>>) => void
  removeCard: (id: string) => void
  reorderCards: (ids: string[]) => void
  resizeCard: (id: string, span: 1 | 2 | 3) => void
  setHighlights: (id: string, highlights: string[]) => void
  setGlobalFilter: (where: string | null) => void
  undo: () => boolean
  logCall: (entry: Omit<AuditEntry, 'id' | 'at'>) => void
  setResultBudget: (limits: Limits) => void
  loadBoard: (cards: Card[], globalFilter: string | null) => void
}

let counter = 0
const nextId = () => `c${++counter}-${Date.now().toString(36)}`

export const useStore = create<State>((set, get) => {
  /** Snapshot cards and filter before every board mutation. Never the dataset. */
  const push = () => {
    const { cards, globalFilter, history } = get()
    set({ history: [...history, { cards, globalFilter }].slice(-HISTORY_LIMIT) })
  }

  return {
    schema: null,
    cards: [],
    globalFilter: null,
    filterVersion: 0,
    auditLog: [],
    bytesOut: 0,
    history: [],
    resultBudget: DEFAULT_LIMITS,

    setSchema: (schema) => set({ schema }),

    addCard: (card) => {
      push()
      const id = nextId()
      set({ cards: [...get().cards, { ...card, id }] })
      return id
    },

    updateCard: (id, patch) => {
      push()
      set({ cards: get().cards.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
    },

    removeCard: (id) => {
      push()
      set({ cards: get().cards.filter((c) => c.id !== id) })
    },

    reorderCards: (ids) => {
      push()
      const byId = new Map(get().cards.map((c) => [c.id, c]))
      const ordered = ids.map((id) => byId.get(id)).filter((c): c is Card => Boolean(c))
      const missing = get().cards.filter((c) => !ids.includes(c.id))
      set({ cards: [...ordered, ...missing] })
    },

    resizeCard: (id, span) => {
      push()
      set({ cards: get().cards.map((c) => (c.id === id ? { ...c, span } : c)) })
    },

    setHighlights: (id, highlights) => {
      push()
      set({ cards: get().cards.map((c) => (c.id === id ? { ...c, highlights } : c)) })
    },

    setGlobalFilter: (where) => {
      push()
      set({ globalFilter: where, filterVersion: get().filterVersion + 1 })
    },

    undo: () => {
      const { history } = get()
      const last = history[history.length - 1]
      if (!last) return false
      set({
        cards: last.cards,
        globalFilter: last.globalFilter,
        filterVersion: get().filterVersion + 1,
        history: history.slice(0, -1),
      })
      return true
    },

    setResultBudget: (limits) =>
      set({
        resultBudget: {
          maxRows: Math.max(1, Math.min(500, Math.round(limits.maxRows))),
          maxBytes: Math.max(256, Math.min(32768, Math.round(limits.maxBytes))),
        },
      }),

    loadBoard: (cards, globalFilter) => {
      push()
      set({ cards, globalFilter, filterVersion: get().filterVersion + 1 })
    },

    logCall: (entry) =>
      set({
        auditLog: [...get().auditLog, { ...entry, id: nextId(), at: Date.now() }],
        bytesOut: get().bytesOut + entry.bytes,
      }),
  }
})
