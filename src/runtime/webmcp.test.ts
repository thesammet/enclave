import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeEngine } from '../data/fake-engine'
import { useStore } from '../store/store'
import { allTools } from '../tools'
import { isWebMcpAvailable, registerWebMcpTools } from './webmcp'

const COUNT = allTools.length

const ctx = () => ({ engine: new FakeEngine(), store: useStore })

beforeEach(() => {
  useStore.setState(useStore.getInitialState(), true)
  delete (document as unknown as Record<string, unknown>).modelContext
  delete (navigator as unknown as Record<string, unknown>).modelContext
})

describe('webmcp adapter', () => {
  it('reports unavailable when neither global exists', () => {
    expect(isWebMcpAvailable()).toBe(false)
    expect(registerWebMcpTools(ctx()).supported).toBe(false)
  })

  it('prefers document.modelContext over the deprecated navigator one', async () => {
    const onDoc = vi.fn().mockResolvedValue(undefined)
    const onNav = vi.fn().mockResolvedValue(undefined)
    Object.assign(document, { modelContext: { registerTool: onDoc } })
    Object.assign(navigator, { modelContext: { registerTool: onNav } })
    registerWebMcpTools(ctx())
    await vi.waitFor(() => expect(onDoc).toHaveBeenCalledTimes(COUNT))
    expect(onNav).not.toHaveBeenCalled()
  })

  it('falls back to navigator.modelContext', async () => {
    const onNav = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { modelContext: { registerTool: onNav } })
    expect(registerWebMcpTools(ctx()).supported).toBe(true)
    await vi.waitFor(() => expect(onNav).toHaveBeenCalledTimes(COUNT))
  })

  it('passes readOnlyHint through for read-only tools', async () => {
    const calls: unknown[] = []
    Object.assign(document, {
      modelContext: { registerTool: async (t: unknown) => void calls.push(t) },
    })
    registerWebMcpTools(ctx())
    await vi.waitFor(() => expect(calls).toHaveLength(COUNT))
    const find = (n: string) =>
      calls.find((t) => (t as { name: string }).name === n) as {
        annotations: { readOnlyHint: boolean }
      }
    expect(find('get_schema').annotations.readOnlyHint).toBe(true)
    expect(find('add_note').annotations.readOnlyHint).toBe(false)
  })

  it('wraps tool output in the MCP content shape and logs the call', async () => {
    const calls: unknown[] = []
    Object.assign(document, {
      modelContext: { registerTool: async (t: unknown) => void calls.push(t) },
    })
    registerWebMcpTools(ctx())
    await vi.waitFor(() => expect(calls).toHaveLength(COUNT))
    const addNote = calls.find((t) => (t as { name: string }).name === 'add_note') as {
      execute: (a: unknown, o: unknown) => Promise<{ content: Array<{ type: string; text: string }> }>
    }
    const out = await addNote.execute({ markdown: 'hello' }, {})
    expect(out.content[0].type).toBe('text')
    expect(out.content[0].text).toContain('Added note')
    const log = useStore.getState().auditLog
    expect(log[0].tool).toBe('add_note')
    expect(log[0].ok).toBe(true)
    expect(useStore.getState().bytesOut).toBeGreaterThan(0)
  })

  it('logs a failed call as not ok and still returns text', async () => {
    const calls: unknown[] = []
    Object.assign(document, {
      modelContext: { registerTool: async (t: unknown) => void calls.push(t) },
    })
    registerWebMcpTools(ctx())
    await vi.waitFor(() => expect(calls).toHaveLength(COUNT))
    const removeCard = calls.find((t) => (t as { name: string }).name === 'remove_card') as {
      execute: (a: unknown, o: unknown) => Promise<{ content: Array<{ text: string }> }>
    }
    const out = await removeCard.execute({ id: 'nope' }, {})
    expect(out.content[0].text).toContain('Error')
    expect(useStore.getState().auditLog[0].ok).toBe(false)
  })

  it('dispose aborts the registration signal', async () => {
    let seen: AbortSignal | undefined
    Object.assign(document, {
      modelContext: {
        registerTool: async (_t: unknown, o: { signal?: AbortSignal }) => {
          seen = o?.signal
        },
      },
    })
    const handle = registerWebMcpTools(ctx())
    await vi.waitFor(() => expect(seen).toBeDefined())
    expect(seen!.aborted).toBe(false)
    handle.dispose()
    expect(seen!.aborted).toBe(true)
  })
})
