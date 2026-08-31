import { create } from 'zustand'

export interface PendingAction {
  id: string
  tool: string
  /** One line the operator reads before deciding. */
  summary: string
  /** The specifics, as label/value pairs. */
  detail: Array<[string, string]>
  createdAt: number
}

/** Resolvers live outside the store so its state stays serialisable. */
const resolvers = new Map<string, (approved: boolean) => void>()

interface ApprovalState {
  pending: PendingAction[]
  decided: Array<{ action: PendingAction; approved: boolean; at: number }>
  add: (action: PendingAction) => void
  decide: (id: string, approved: boolean) => void
}

export const useApprovals = create<ApprovalState>((set, get) => ({
  pending: [],
  decided: [],

  add: (action) => set({ pending: [...get().pending, action] }),

  decide: (id, approved) => {
    const action = get().pending.find((a) => a.id === id)
    if (!action) return
    set({
      pending: get().pending.filter((a) => a.id !== id),
      decided: [{ action, approved, at: Date.now() }, ...get().decided].slice(0, 20),
    })
    resolvers.get(id)?.(approved)
    resolvers.delete(id)
  },
}))

let counter = 0

/**
 * The collaboration seam. A write tool does not act; it proposes, and this
 * resolves only when the person watching the screen decides. The agent waits.
 */
export function requestApproval(
  request: Omit<PendingAction, 'id' | 'createdAt'>,
  timeoutMs = 120_000,
): Promise<boolean> {
  const id = `a${Date.now().toString(36)}-${++counter}`
  const action: PendingAction = { ...request, id, createdAt: Date.now() }

  return new Promise<boolean>((resolve) => {
    let settled = false
    const finish = (approved: boolean) => {
      if (settled) return
      settled = true
      resolve(approved)
    }

    resolvers.set(id, finish)
    useApprovals.getState().add(action)

    setTimeout(() => {
      if (settled) return
      resolvers.delete(id)
      useApprovals.setState((s) => ({ pending: s.pending.filter((a) => a.id !== id) }))
      finish(false)
    }, timeoutMs)
  })
}
