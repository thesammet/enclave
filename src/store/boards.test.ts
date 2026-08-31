import { beforeEach, describe, expect, it } from 'vitest'
import { deleteBoard, listBoards, saveBoard } from './boards'
import type { Card } from './types'

let mem: Record<string, string>
const fake = {
  getItem: (k: string) => mem[k] ?? null,
  setItem: (k: string, v: string) => {
    mem[k] = v
  },
}

const card = (title: string): Card => ({ id: title, kind: 'note', title, span: 1 })

beforeEach(() => {
  mem = {}
})

describe('saved boards', () => {
  it('starts empty', () => {
    expect(listBoards(fake)).toEqual([])
  })

  it('saves a board with its cards and filter', () => {
    saveBoard('Q1 review', [card('A')], "region = 'EMEA'", fake)
    const [b] = listBoards(fake)
    expect(b.name).toBe('Q1 review')
    expect(b.cards).toHaveLength(1)
    expect(b.globalFilter).toBe("region = 'EMEA'")
  })

  it('stores no data rows, only the analysis', () => {
    saveBoard('Q1', [card('A')], null, fake)
    expect(mem['enclave.boards']).not.toContain('EMEA')
  })

  it('overwrites a board saved under the same name', () => {
    saveBoard('Q1', [card('A')], null, fake)
    saveBoard('Q1', [card('A'), card('B')], null, fake)
    const boards = listBoards(fake)
    expect(boards).toHaveLength(1)
    expect(boards[0].cards).toHaveLength(2)
  })

  it('keeps the most recently saved board first', () => {
    saveBoard('one', [], null, fake)
    saveBoard('two', [], null, fake)
    expect(listBoards(fake).map((b) => b.name)).toEqual(['two', 'one'])
  })

  it('refuses a blank name', () => {
    expect(() => saveBoard('   ', [], null, fake)).toThrow('needs a name')
  })

  it('deletes a board by id', () => {
    const b = saveBoard('one', [], null, fake)
    saveBoard('two', [], null, fake)
    deleteBoard(b.id, fake)
    expect(listBoards(fake).map((n) => n.name)).toEqual(['two'])
  })

  it('survives corrupt storage rather than throwing', () => {
    mem['enclave.boards'] = 'not json'
    expect(listBoards(fake)).toEqual([])
  })

  it('tolerates storage being unavailable', () => {
    expect(listBoards(null)).toEqual([])
    expect(() => saveBoard('x', [], null, null)).not.toThrow()
  })
})
