import { beforeEach, describe, expect, it, vi } from 'vitest'
import { bootstrapStore } from './bootstrap'
import { FakeEngine } from './fake-engine'

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => ({
      ok: true,
      text: async () => `# ${url}`,
    })),
  )
})

describe('bootstrapStore', () => {
  it('loads both store tables and points the analytics view at the join', async () => {
    const engine = new FakeEngine()
    await bootstrapStore(engine)
    expect(Object.keys(engine.tables).sort()).toEqual(['orders', 'products'])
    expect(engine.base).toContain('FROM orders o LEFT JOIN products p')
  })

  it('runs once per engine even when called concurrently', async () => {
    const engine = new FakeEngine()
    await Promise.all([bootstrapStore(engine), bootstrapStore(engine), bootstrapStore(engine)])
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(2)
  })

  it('lets a failed bootstrap be retried', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, text: async () => '' })))
    const engine = new FakeEngine()
    await expect(bootstrapStore(engine)).rejects.toThrow('Could not load')

    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => 'a,b\n1,2\n' })))
    await expect(bootstrapStore(engine)).resolves.toBeTruthy()
  })
})
