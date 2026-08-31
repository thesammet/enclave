import { create } from 'zustand'

export interface RestockOrder {
  id: string
  productId: string
  productName: string
  quantity: number
  createdAt: number
  createdBy: 'agent' | 'operator'
}

interface CommerceState {
  restockOrders: RestockOrder[]
  /** Bumped whenever the catalogue changes, so open views re-query. */
  version: number
  addRestockOrder: (o: Omit<RestockOrder, 'id' | 'createdAt'>) => RestockOrder
  bump: () => void
}

let counter = 0

export const useCommerce = create<CommerceState>((set, get) => ({
  restockOrders: [],
  version: 0,

  addRestockOrder: (o) => {
    const order: RestockOrder = { ...o, id: `RS-${1041 + ++counter}`, createdAt: Date.now() }
    set({ restockOrders: [order, ...get().restockOrders], version: get().version + 1 })
    return order
  },

  bump: () => set({ version: get().version + 1 }),
}))
