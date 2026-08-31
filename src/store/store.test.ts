import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from './store'

const reset = () => useStore.setState(useStore.getInitialState(), true)

describe('store', () => {
  beforeEach(reset)

  it('adds a card and returns its id', () => {
    const id = useStore.getState().addCard({ kind: 'note', title: 'Hi', span: 1, markdown: 'x' })
    const cards = useStore.getState().cards
    expect(cards).toHaveLength(1)
    expect(cards[0].id).toBe(id)
    expect(cards[0].title).toBe('Hi')
  })

  it('generates unique ids', () => {
    const a = useStore.getState().addCard({ kind: 'note', title: 'A', span: 1 })
    const b = useStore.getState().addCard({ kind: 'note', title: 'B', span: 1 })
    expect(a).not.toBe(b)
  })

  it('updates a card in place', () => {
    const id = useStore.getState().addCard({ kind: 'note', title: 'A', span: 1 })
    useStore.getState().updateCard(id, { title: 'B' })
    expect(useStore.getState().cards[0].title).toBe('B')
  })

  it('removes a card', () => {
    const id = useStore.getState().addCard({ kind: 'note', title: 'A', span: 1 })
    useStore.getState().removeCard(id)
    expect(useStore.getState().cards).toHaveLength(0)
  })

  it('reorders cards by id list', () => {
    const a = useStore.getState().addCard({ kind: 'note', title: 'A', span: 1 })
    const b = useStore.getState().addCard({ kind: 'note', title: 'B', span: 1 })
    useStore.getState().reorderCards([b, a])
    expect(useStore.getState().cards.map((c) => c.title)).toEqual(['B', 'A'])
  })

  it('bumps filterVersion when the global filter changes', () => {
    const before = useStore.getState().filterVersion
    useStore.getState().setGlobalFilter("region = 'EMEA'")
    expect(useStore.getState().globalFilter).toBe("region = 'EMEA'")
    expect(useStore.getState().filterVersion).toBe(before + 1)
  })

  it('undoes the last card mutation', () => {
    useStore.getState().addCard({ kind: 'note', title: 'A', span: 1 })
    useStore.getState().addCard({ kind: 'note', title: 'B', span: 1 })
    useStore.getState().undo()
    expect(useStore.getState().cards.map((c) => c.title)).toEqual(['A'])
  })

  it('undoes a global filter change', () => {
    useStore.getState().setGlobalFilter("region = 'EMEA'")
    useStore.getState().undo()
    expect(useStore.getState().globalFilter).toBeNull()
  })

  it('reports nothing to undo on an empty history', () => {
    expect(useStore.getState().undo()).toBe(false)
  })

  it('never undoes the loaded dataset', () => {
    useStore.getState().setSchema({ table: 'data', rowCount: 1, columns: [] })
    useStore.getState().addCard({ kind: 'note', title: 'A', span: 1 })
    useStore.getState().undo()
    expect(useStore.getState().schema).not.toBeNull()
  })

  it('clamps the result budget to a sane range', () => {
    useStore.getState().setResultBudget({ maxRows: 9999, maxBytes: 10 })
    expect(useStore.getState().resultBudget).toEqual({ maxRows: 500, maxBytes: 256 })
    useStore.getState().setResultBudget({ maxRows: 0, maxBytes: 999999 })
    expect(useStore.getState().resultBudget).toEqual({ maxRows: 1, maxBytes: 32768 })
  })

  it('defaults the result budget to 50 rows and 4 KB', () => {
    expect(useStore.getState().resultBudget).toEqual({ maxRows: 50, maxBytes: 4096 })
  })

  it('loads a saved board over the current one, undoably', () => {
    useStore.getState().addCard({ kind: 'note', title: 'Old', span: 1 })
    useStore.getState().loadBoard([{ id: 'x', kind: 'note', title: 'New', span: 1 }], "region = 'EMEA'")
    expect(useStore.getState().cards.map((c) => c.title)).toEqual(['New'])
    expect(useStore.getState().globalFilter).toBe("region = 'EMEA'")
    useStore.getState().undo()
    expect(useStore.getState().cards.map((c) => c.title)).toEqual(['Old'])
  })

  it('accumulates bytesOut across logged calls', () => {
    useStore.getState().logCall({ tool: 'get_schema', args: {}, bytes: 100, ms: 1, ok: true })
    useStore.getState().logCall({ tool: 'run_sql', args: {}, bytes: 47, ms: 2, ok: true })
    expect(useStore.getState().bytesOut).toBe(147)
    expect(useStore.getState().auditLog).toHaveLength(2)
  })
})
