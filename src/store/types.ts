export type CardKind = 'kpi' | 'chart' | 'table' | 'note'
export type ChartType = 'bar' | 'line' | 'area' | 'scatter' | 'pie'

export interface Card {
  id: string
  kind: CardKind
  title: string
  span: 1 | 2 | 3
  sql?: string
  chartType?: ChartType
  x?: string
  y?: string
  series?: string
  markdown?: string
  format?: string
  comparison?: string
  highlights?: string[]
}

export interface AuditEntry {
  id: string
  tool: string
  args: unknown
  bytes: number
  ms: number
  ok: boolean
  at: number
}
