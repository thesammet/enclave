/**
 * A dev server answers an unknown path with index.html, and a 200 response is
 * not proof of a CSV — without this, DuckDB cheerfully parses a web page and
 * reports a column called "<!doctype html>".
 */
export function assertLooksLikeCsv(name: string, text: string): void {
  const head = text.trimStart().slice(0, 200)
  if (head === '') throw new Error(`${name} is empty.`)
  if (head.startsWith('<')) throw new Error(`${name} is not a CSV file.`)
  const firstLine = head.split(/\r?\n/, 1)[0] ?? ''
  if (!firstLine.includes(',')) {
    throw new Error(`${name} does not look like a CSV — no columns found in the first line.`)
  }
}
