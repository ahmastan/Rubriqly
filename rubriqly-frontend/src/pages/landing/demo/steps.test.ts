import { describe, expect, it } from 'vitest'
import { demoSteps } from '../content'
import { STEPS, stepAt, stepRange } from './steps'

describe('scroll demo steps', () => {
  it('has one caption per step', () => {
    expect(demoSteps).toHaveLength(STEPS)
  })

  it('splits scroll progress evenly between the steps', () => {
    expect(stepAt(0)).toBe(0)
    expect(stepAt(0.17)).toBe(1)
    expect(stepAt(0.5)).toBe(3)
    expect(stepAt(0.99)).toBe(5)
    expect(stepAt(1)).toBe(5) // the very end stays on the last step
    expect(stepAt(-0.1)).toBe(0)
  })

  it('maps a part of a step to overall progress', () => {
    expect(stepRange(0)).toEqual([0, 0.7 / 6])
    const [a, b] = stepRange(2, 0, 0.5)
    expect(a).toBeCloseTo(2 / 6)
    expect(b).toBeCloseTo(2.5 / 6)
  })
})
