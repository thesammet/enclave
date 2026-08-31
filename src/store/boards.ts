import type { Card } from './types'

const STORAGE_KEY = 'enclave.boards'

export interface SavedBoard {
  id: string
  name: string
  savedAt: number
  cards: Card[]
  globalFilter: string | null
}

type Store = Pick<Storage, 'getItem' | 'setItem'>

/** Date.now() alone collides when two boards are saved in the same tick. */
let counter = 0
const nextId = () => `b${Date.now().toString(36)}-${++counter}`

const store = (): Store | null => {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/**
 * Boards are the analysis, not the data: cards and the filter, never a row.
 * That is what makes a saved board portable — it re-runs against whichever
 * dataset is loaded, on whoever's machine.
 */
export function listBoards(s: Store | null = store()): SavedBoard[] {
  try {
    const raw = s?.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveBoard(
  name: string,
  cards: Card[],
  globalFilter: string | null,
  s: Store | null = store(),
): SavedBoard {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('A board needs a name.')

  const boards = listBoards(s)
  const existing = boards.find((b) => b.name === trimmed)
  const board: SavedBoard = {
    id: existing?.id ?? nextId(),
    name: trimmed,
    savedAt: Date.now(),
    cards,
    globalFilter,
  }
  const next = [board, ...boards.filter((b) => b.id !== board.id)]
  s?.setItem(STORAGE_KEY, JSON.stringify(next))
  return board
}

export function deleteBoard(id: string, s: Store | null = store()): void {
  s?.setItem(STORAGE_KEY, JSON.stringify(listBoards(s).filter((b) => b.id !== id)))
}
