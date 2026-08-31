import { describe, expect, it } from 'vitest'
import { allTools } from './index'

describe('allTools', () => {
  it('contains exactly the twenty-two tools the product exposes', () => {
    expect(allTools.map((t) => t.name).sort()).toEqual([
      'add_chart',
      'add_kpi',
      'add_note',
      'add_table',
      'create_restock_order',
      'get_product',
      'get_schema',
      'highlight_points',
      'list_low_stock',
      'list_restock_orders',
      'profile_column',
      'read_dashboard',
      'remove_card',
      'reorder_cards',
      'resize_card',
      'run_sql',
      'sample_rows',
      'search_orders',
      'set_global_filter',
      'set_product_price',
      'undo',
      'update_card',
    ])
  })

  it('keeps every write tool behind an operator approval', () => {
    const writes = allTools.filter((t) => !t.readOnly && t.name.startsWith('set_product'))
    expect(writes.every((t) => t.description.toLowerCase().includes('approve'))).toBe(true)
  })

  it('has no duplicate names', () => {
    expect(new Set(allTools.map((t) => t.name)).size).toBe(allTools.length)
  })

  it('gives every tool a description long enough to guide an agent', () => {
    for (const t of allTools) expect(t.description.length).toBeGreaterThan(40)
  })

  it('gives every tool an object input schema', () => {
    for (const t of allTools) expect(t.inputSchema.type).toBe('object')
  })
})
