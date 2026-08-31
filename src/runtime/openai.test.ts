import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeEngine } from '../data/fake-engine'
import { useStore } from '../store/store'
import { allTools } from '../tools'
import { MAX_TURNS, type OpenAiLike, runAgentTurn, toOpenAiTools } from './openai'

const ctx = () => ({ engine: new FakeEngine(), store: useStore })

/** Stand-in for the OpenAI client: returns queued responses in order. */
function fakeClient(responses: unknown[]) {
  const create = vi.fn().mockImplementation(async () => responses.shift())
  return { client: { responses: { create } } as OpenAiLike, create }
}

beforeEach(() => useStore.setState(useStore.getInitialState(), true))

const base = { apiKey: 'k', model: 'gpt-5' }

describe('openai adapter', () => {
  it('maps every registered tool into the function tool shape', () => {
    const tools = toOpenAiTools()
    expect(tools).toHaveLength(allTools.length)
    expect(tools[0].type).toBe('function')
    expect(tools.find((t) => t.name === 'run_sql')!.parameters.type).toBe('object')
  })

  it('returns assistant text when the model calls no tools', async () => {
    const { client } = fakeClient([{ output: [], output_text: 'Hello.' }])
    const out = await runAgentTurn({
      ...base,
      input: [{ role: 'user', content: 'hi' }],
      ctx: ctx(),
      client,
    })
    expect(out.text).toBe('Hello.')
  })

  it('executes a tool call, feeds the output back, and returns the final text', async () => {
    const { client, create } = fakeClient([
      {
        output: [
          { type: 'function_call', call_id: 'c1', name: 'add_note', arguments: '{"markdown":"hi"}' },
        ],
        output_text: '',
      },
      { output: [], output_text: 'Added it.' },
    ])
    const out = await runAgentTurn({
      ...base,
      input: [{ role: 'user', content: 'note' }],
      ctx: ctx(),
      client,
    })
    expect(useStore.getState().cards).toHaveLength(1)
    expect(out.text).toBe('Added it.')
    const second = create.mock.calls[1][0]
    const fed = second.input.find(
      (i: { type?: string }) => i.type === 'function_call_output',
    )
    expect(fed.call_id).toBe('c1')
    expect(fed.output).toContain('Added note')
  })

  it('logs every tool call to the audit log', async () => {
    const { client } = fakeClient([
      {
        output: [
          { type: 'function_call', call_id: 'c1', name: 'add_note', arguments: '{"markdown":"hi"}' },
        ],
        output_text: '',
      },
      { output: [], output_text: 'done' },
    ])
    await runAgentTurn({ ...base, input: [{ role: 'user', content: 'x' }], ctx: ctx(), client })
    expect(useStore.getState().auditLog[0].tool).toBe('add_note')
    expect(useStore.getState().bytesOut).toBeGreaterThan(0)
  })

  it('reports malformed tool arguments back to the model instead of throwing', async () => {
    const { client, create } = fakeClient([
      {
        output: [
          { type: 'function_call', call_id: 'c1', name: 'add_note', arguments: 'not json' },
        ],
        output_text: '',
      },
      { output: [], output_text: 'ok' },
    ])
    await runAgentTurn({ ...base, input: [{ role: 'user', content: 'x' }], ctx: ctx(), client })
    const fed = create.mock.calls[1][0].input.find(
      (i: { type?: string }) => i.type === 'function_call_output',
    )
    expect(fed.output).toContain('Error')
  })

  it('reports a tool name it does not know', async () => {
    const { client, create } = fakeClient([
      { output: [{ type: 'function_call', call_id: 'c1', name: 'fly', arguments: '{}' }], output_text: '' },
      { output: [], output_text: 'ok' },
    ])
    await runAgentTurn({ ...base, input: [{ role: 'user', content: 'x' }], ctx: ctx(), client })
    const fed = create.mock.calls[1][0].input.find(
      (i: { type?: string }) => i.type === 'function_call_output',
    )
    expect(fed.output).toContain('no tool named fly')
  })

  it('stops after the turn limit rather than looping forever', async () => {
    const responses = Array.from({ length: MAX_TURNS + 5 }, () => ({
      output: [
        { type: 'function_call', call_id: 'c', name: 'add_note', arguments: '{"markdown":"x"}' },
      ],
      output_text: '',
    }))
    const { client, create } = fakeClient(responses)
    const out = await runAgentTurn({
      ...base,
      input: [{ role: 'user', content: 'x' }],
      ctx: ctx(),
      client,
    })
    expect(create.mock.calls.length).toBe(MAX_TURNS)
    expect(out.text).toContain('carry on')
  })

  it('notifies the caller of each tool name for live UI feedback', async () => {
    const seen: string[] = []
    const { client } = fakeClient([
      {
        output: [
          { type: 'function_call', call_id: 'c1', name: 'add_note', arguments: '{"markdown":"hi"}' },
        ],
        output_text: '',
      },
      { output: [], output_text: 'done' },
    ])
    await runAgentTurn({
      ...base,
      input: [{ role: 'user', content: 'x' }],
      ctx: ctx(),
      client,
      onToolCall: (n) => seen.push(n),
    })
    expect(seen).toEqual(['add_note'])
  })
})
