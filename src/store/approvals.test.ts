import { beforeEach, describe, expect, it } from 'vitest'
import { requestApproval, useApprovals } from './approvals'

const req = { tool: 'create_restock_order', summary: 'Order 200 units', detail: [['SKU', 'SKU-1001']] as Array<[string, string]> }

beforeEach(() => useApprovals.setState(useApprovals.getInitialState(), true))

describe('approvals', () => {
  it('puts the request on screen before anything happens', () => {
    void requestApproval(req)
    const [p] = useApprovals.getState().pending
    expect(p.tool).toBe('create_restock_order')
    expect(p.summary).toBe('Order 200 units')
  })

  it('stays unresolved until a person decides', async () => {
    let done = false
    void requestApproval(req).then(() => (done = true))
    await Promise.resolve()
    expect(done).toBe(false)
  })

  it('resolves true when approved', async () => {
    const promise = requestApproval(req)
    useApprovals.getState().decide(useApprovals.getState().pending[0].id, true)
    expect(await promise).toBe(true)
  })

  it('resolves false when rejected', async () => {
    const promise = requestApproval(req)
    useApprovals.getState().decide(useApprovals.getState().pending[0].id, false)
    expect(await promise).toBe(false)
  })

  it('clears the request from the pending list once decided', async () => {
    const promise = requestApproval(req)
    useApprovals.getState().decide(useApprovals.getState().pending[0].id, true)
    await promise
    expect(useApprovals.getState().pending).toHaveLength(0)
  })

  it('keeps a record of what was decided', async () => {
    const promise = requestApproval(req)
    useApprovals.getState().decide(useApprovals.getState().pending[0].id, true)
    await promise
    const [record] = useApprovals.getState().decided
    expect(record.approved).toBe(true)
    expect(record.action.tool).toBe('create_restock_order')
  })

  it('refuses rather than hangs when nobody decides in time', async () => {
    const promise = requestApproval(req, 5)
    expect(await promise).toBe(false)
    expect(useApprovals.getState().pending).toHaveLength(0)
  })

  it('ignores a second decision on the same request', async () => {
    const promise = requestApproval(req)
    const id = useApprovals.getState().pending[0].id
    useApprovals.getState().decide(id, true)
    useApprovals.getState().decide(id, false)
    expect(await promise).toBe(true)
  })

  it('generates a distinct id per request', () => {
    void requestApproval(req)
    void requestApproval(req)
    const [a, b] = useApprovals.getState().pending
    expect(a.id).not.toBe(b.id)
  })
})
