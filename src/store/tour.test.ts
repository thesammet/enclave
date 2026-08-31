import { beforeEach, describe, expect, it } from 'vitest'
import { TOUR_STEPS, hasSeenTour, useTour } from './tour'

beforeEach(() => {
  localStorage.clear()
  useTour.setState(useTour.getInitialState(), true)
})

describe('tour', () => {
  it('has a step for every part a newcomer needs to find', () => {
    expect(TOUR_STEPS.map((s) => s.target)).toEqual(['nav', 'agent', 'suggestion', 'activity'])
  })

  it('gives every step a title and a body worth reading', () => {
    for (const s of TOUR_STEPS) {
      expect(s.title.length).toBeGreaterThan(4)
      expect(s.body.length).toBeGreaterThan(40)
    }
  })

  it('is not running until it is started', () => {
    expect(useTour.getState().active).toBe(false)
  })

  it('walks forward through the steps', () => {
    useTour.getState().start()
    expect(useTour.getState().step).toBe(0)
    useTour.getState().next()
    expect(useTour.getState().step).toBe(1)
  })

  it('walks back, and stops at the first step', () => {
    useTour.getState().start()
    useTour.getState().next()
    useTour.getState().prev()
    useTour.getState().prev()
    expect(useTour.getState().step).toBe(0)
  })

  it('ends itself after the last step', () => {
    useTour.getState().start()
    for (let i = 0; i < TOUR_STEPS.length; i++) useTour.getState().next()
    expect(useTour.getState().active).toBe(false)
  })

  it('is not shown again once it has run to the end', () => {
    expect(hasSeenTour()).toBe(false)
    useTour.getState().start()
    for (let i = 0; i < TOUR_STEPS.length; i++) useTour.getState().next()
    expect(hasSeenTour()).toBe(true)
  })

  it('is not shown again once it has been skipped', () => {
    useTour.getState().start()
    useTour.getState().end()
    expect(hasSeenTour()).toBe(true)
  })

  it('can be replayed on demand after being seen', () => {
    useTour.getState().start()
    useTour.getState().end()
    useTour.getState().start()
    expect(useTour.getState().active).toBe(true)
    expect(useTour.getState().step).toBe(0)
  })
})
