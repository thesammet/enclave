import { describe, expect, it } from 'vitest'
import { budget, MAX_BYTES, MAX_ROWS } from './budget'
import type { QueryResult } from './types'

const make = (n: number, cell = 'x'): QueryResult => ({
  columns: ['a', 'b'],
  rows: Array.from({ length: n }, (_, i) => [i, cell]),
})

describe('budget', () => {
  it('passes a small result through untruncated', () => {
    const out = budget(make(3))
    expect(out.truncated).toBe(false)
    expect(out.text).toContain('"a"')
    expect(out.text).toContain('3 rows')
    expect(out.bytes).toBe(new TextEncoder().encode(out.text).length)
  })

  it('caps rows at MAX_ROWS and says so', () => {
    const out = budget(make(500))
    expect(out.truncated).toBe(true)
    expect(out.text).toContain('showing 50 of 500')
  })

  it('caps bytes below MAX_BYTES even when rows are few', () => {
    const out = budget(make(10, 'y'.repeat(2000)))
    expect(out.bytes).toBeLessThanOrEqual(MAX_BYTES)
    expect(out.truncated).toBe(true)
  })

  it('never emits more than MAX_ROWS rows', () => {
    const out = budget(make(MAX_ROWS + 1))
    const parsed = JSON.parse(out.text.slice(out.text.indexOf('[')))
    expect(parsed.length).toBeLessThanOrEqual(MAX_ROWS)
  })

  it('handles an empty result', () => {
    const out = budget({ columns: ['a'], rows: [] })
    expect(out.truncated).toBe(false)
    expect(out.text).toContain('0 rows')
  })
})
