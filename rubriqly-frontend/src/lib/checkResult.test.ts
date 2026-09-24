import { describe, expect, it } from 'vitest'
import { buildCheckResult, rubricForScoring, wordCountRule } from './checkResult'
import { mockCheckResponse } from './mockJev'
import { SAMPLE_ESSAY } from './sampleEssay'
import { STARTER_RUBRICS } from './starterRubrics'
import type { CheckResponse } from './types'

const rubric = STARTER_RUBRICS[0]
const ids = { id: 'chk_1', draftId: 'drf_1', assignmentId: 'asg_1' }

describe('rubricForScoring', () => {
  it('sends what Jev needs and never the tips', () => {
    const sent = rubricForScoring(rubric)
    expect(sent.criteria[0]).toEqual({
      id: rubric.criteria[0].id,
      name: rubric.criteria[0].name,
      question: rubric.criteria[0].question,
      descriptors: rubric.criteria[0].descriptors,
    })
    expect(JSON.stringify(sent)).not.toContain(rubric.criteria[0].tips[0])
  })
})

describe('buildCheckResult', () => {
  const response: CheckResponse = {
    ...mockCheckResponse(rubric, SAMPLE_ESSAY),
    model: 'typesafe-ai/jev',
  }
  response.criteria[0] = { ...response.criteria[0], level: 1.4, confidence: 0.5 }

  it('rounds levels, adds tips and flags low confidence', () => {
    const result = buildCheckResult(rubric, SAMPLE_ESSAY, response, ids)
    const thesis = result.criteria[0]
    expect(thesis.level).toBe(1)
    expect(thesis.levelName).toBe(rubric.levels[0])
    expect(thesis.tip).toBe(rubric.criteria[0].tips[0])
    expect(thesis.lowConfidence).toBe(true)
    expect(result.model).toBe('typesafe-ai/jev')
    expect(result.overall.levelCount).toBe(4)
  })

  it('puts the paragraph text back next to its tags', () => {
    const result = buildCheckResult(rubric, SAMPLE_ESSAY, response, ids)
    expect(result.paragraphs[0].text).toMatch(/^When the influenza pandemic of 1918/)
    expect(result.paragraphs.at(-1)!.isConclusion).toBe(true)
  })

  it('adds the word count rule as a counted checklist item', () => {
    const result = buildCheckResult(rubric, SAMPLE_ESSAY, response, ids)
    const rule = result.checklist.find((c) => c.id === 'rule:word_count')!
    expect(rule.source).toBe('rule')
    expect(rule.passed).toBe(false) // the sample is well under 500 words
    expect(rule.label).toMatch(/^Length 500–900 words \(\d+\)$/)
  })

  it('refuses a result that is missing a criterion', () => {
    const missing = { ...response, criteria: response.criteria.slice(1) }
    expect(() => buildCheckResult(rubric, SAMPLE_ESSAY, missing, ids)).toThrow(/missing/)
  })
})

describe('wordCountRule', () => {
  it('is skipped when the rubric has no length rule', () => {
    expect(wordCountRule({ ...rubric, rules: {} }, 100)).toBeUndefined()
  })
})
