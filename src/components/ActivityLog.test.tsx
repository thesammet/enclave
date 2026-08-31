import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from '../store/store'
import { ActivityLog } from './ActivityLog'

beforeEach(() => useStore.setState(useStore.getInitialState(), true))

describe('ActivityLog', () => {
  it('starts at zero bytes', () => {
    render(<ActivityLog />)
    expect(screen.getByText(/0 B left your browser/)).toBeTruthy()
  })

  it('lists each tool call with its byte count', () => {
    useStore.getState().logCall({ tool: 'get_schema', args: {}, bytes: 128, ms: 4, ok: true })
    render(<ActivityLog />)
    expect(screen.getByText('get_schema')).toBeTruthy()
    expect(screen.getByText(/128 B · 4 ms/)).toBeTruthy()
  })

  it('totals the bytes across calls', () => {
    useStore.getState().logCall({ tool: 'a', args: {}, bytes: 100, ms: 1, ok: true })
    useStore.getState().logCall({ tool: 'b', args: {}, bytes: 47, ms: 1, ok: true })
    render(<ActivityLog />)
    expect(screen.getByText(/147 B left your browser/)).toBeTruthy()
  })

  it('always reports zero rows uploaded', () => {
    useStore.getState().logCall({ tool: 'run_sql', args: {}, bytes: 900, ms: 1, ok: true })
    render(<ActivityLog />)
    expect(screen.getByText(/0 rows uploaded/)).toBeTruthy()
  })

  it('marks a failed call', () => {
    useStore.getState().logCall({ tool: 'remove_card', args: {}, bytes: 30, ms: 1, ok: false })
    render(<ActivityLog />)
    expect(screen.getByTitle('failed')).toBeTruthy()
  })
})
