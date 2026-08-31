import { describe, expect, it } from 'vitest'
import { allTools } from './index'

describe('allTools', () => {
  it('contains exactly the sixteen tools the spec promises', () => {
    expect(allTools.map((t) => t.name).sort()).toEqual([
      'add_chart',
      'add_kpi',
      'add_note',
      'add_table',
      'get_schema',
      'highlight_points',
      'profile_column',
      'read_dashboard',
      'remove_card',
      'reorder_cards',
      'resize_card',
      'run_sql',
      'sample_rows',
      'set_global_filter',
      'undo',
      'update_card',
    ])
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
