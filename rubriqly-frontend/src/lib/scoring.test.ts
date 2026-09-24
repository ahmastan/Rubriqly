import { describe, expect, it } from 'vitest'
import { clampLevel, overallEstimate, shouldShowTip, toCriterionResult } from './scoring'
import { STARTER_RUBRICS } from './starterRubrics'

const rubric = STARTER_RUBRICS[0]
const analysis = rubric.criteria.find((c) => c.id === 'analysis')!

describe('clampLevel', () => {
  it('rounds and clamps into the valid range', () => {
    expect(clampLevel(2.4, 4)).toBe(2)
    expect(clampLevel(2.6, 4)).toBe(3)
    expect(clampLevel(-3, 4)).toBe(1)
    expect(clampLevel(9, 4)).toBe(4)
  })
})

describe('toCriterionResult', () => {
  it('looks up the level name and the author tip for weaker levels', () => {
    const result = toCriterionResult(analysis, rubric.levels, 2.2, 0.77)
    expect(result.level).toBe(2)
    expect(result.levelName).toBe('Developing')
    expect(result.tip).toBe(analysis.tips[1])
    expect(result.lowConfidence).toBe(false)
  })

  it('hides tips for strong levels and flags low confidence', () => {
    const result = toCriterionResult(analysis, rubric.levels, 3, 0.52)
    expect(result.tip).toBeUndefined()
    expect(result.lowConfidence).toBe(true)
  })

  it('shows tips below the second-highest level', () => {
    expect(shouldShowTip(2, 4)).toBe(true)
    expect(shouldShowTip(3, 4)).toBe(false)
  })
})

describe('overallEstimate', () => {
  it('is the weighted average of levels', () => {
    const weighted = {
      ...rubric,
      criteria: rubric.criteria.map((c) => ({ ...c, weight: c.id === 'thesis' ? 3 : 1 })),
    }
    const results = weighted.criteria.map((c) =>
      toCriterionResult(c, rubric.levels, c.id === 'thesis' ? 4 : 2, 0.9),
    )
    // (4*3 + 2*4) / 7 = 2.857...
    expect(overallEstimate(weighted, results)).toEqual({
      value: 2.9,
      level: 3,
      levelName: 'Proficient',
      levelCount: 4,
    })
  })
})
