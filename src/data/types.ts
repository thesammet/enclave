export type ColumnType = 'number' | 'string' | 'date' | 'boolean'

export interface Column {
  name: string
  type: ColumnType
  sqlType: string
}

export interface Schema {
  table: string
  columns: Column[]
  rowCount: number
}

export interface QueryResult {
  columns: string[]
  rows: unknown[][]
}
