import { describe, expect, it } from 'vitest'
import { normalise } from './duckdb-engine'

/** Stands in for Arrow's DecimalBigNum: an object that stringifies to a number. */
const bigNum = (s: string) => ({ toString: () => s })

describe('normalise', () => {
  it('converts Int64 BigInt to a number', () => {
    expect(normalise(42n)).toBe(42)
  })

  it('converts an Arrow decimal object to a number', () => {
    expect(normalise(bigNum('25'))).toBe(25)
  })

  it('converts a negative and a fractional decimal object', () => {
    expect(normalise(bigNum('-7'))).toBe(-7)
    expect(normalise(bigNum('3.5'))).toBe(3.5)
  })

  it('renders a Date as an ISO day', () => {
    expect(normalise(new Date('2025-03-14T12:00:00Z'))).toBe('2025-03-14')
  })

  it('leaves strings, numbers, booleans and null alone', () => {
    expect(normalise('EMEA')).toBe('EMEA')
    expect(normalise(7)).toBe(7)
    expect(normalise(true)).toBe(true)
    expect(normalise(null)).toBeNull()
  })

  it('leaves an object that is not numeric alone', () => {
    const o = bigNum('not a number')
    expect(normalise(o)).toBe(o)
  })
})
