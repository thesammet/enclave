import { describe, expect, it } from 'vitest'
import { assertLooksLikeCsv } from './csv'

describe('assertLooksLikeCsv', () => {
  it('accepts a normal CSV', () => {
    expect(() => assertLooksLikeCsv('t.csv', 'a,b\n1,2\n')).not.toThrow()
  })

  it('accepts a CSV with leading blank lines', () => {
    expect(() => assertLooksLikeCsv('t.csv', '\n\na,b\n1,2\n')).not.toThrow()
  })

  it('rejects the HTML a dev server returns for a missing file', () => {
    expect(() => assertLooksLikeCsv('missing.csv', '<!doctype html>\n<html>…')).toThrow(
      'not a CSV file',
    )
  })

  it('rejects a single-column file, which DuckDB would misread', () => {
    expect(() => assertLooksLikeCsv('t.csv', 'justonecolumn\nvalue\n')).toThrow('no columns')
  })

  it('rejects an empty file', () => {
    expect(() => assertLooksLikeCsv('t.csv', '   ')).toThrow('empty')
  })

  it('names the file in every message so the user knows which one failed', () => {
    expect(() => assertLooksLikeCsv('sales.csv', '<html>')).toThrow('sales.csv')
  })
})
