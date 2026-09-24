import { describe, expect, it } from 'vitest'
import { mockCheckResponse, tagParagraphs } from './mockJev'
import { SAMPLE_ESSAY } from './sampleEssay'
import { STARTER_RUBRICS } from './starterRubrics'
import { extractTitle, splitParagraphs } from './text'

describe('mockCheckResponse', () => {
  it('is deterministic for the same text', () => {
    const a = mockCheckResponse(STARTER_RUBRICS[0], SAMPLE_ESSAY)
    const b = mockCheckResponse(STARTER_RUBRICS[0], SAMPLE_ESSAY)
    expect(b).toEqual(a)
  })

  it('has the backend’s shape, with one score per criterion', () => {
    const result = mockCheckResponse(STARTER_RUBRICS[0], SAMPLE_ESSAY)
    expect(result.title).toBe('Why the 1918 Flu Changed Public Health')
    expect(result.criteria.map((c) => c.id)).toEqual(STARTER_RUBRICS[0].criteria.map((c) => c.id))
    expect(result.checklist).toHaveLength(STARTER_RUBRICS[0].checklist.length)
    expect(result.paragraphs[0].is_intro).toBe(true)
    expect(result.paragraphs.at(-1)!.is_conclusion).toBe(true)
    expect(result.model).toBe('mock')
  })
})

describe('tagParagraphs', () => {
  it('marks a body paragraph with no evidence as weak', () => {
    const { body } = extractTitle(splitParagraphs(SAMPLE_ESSAY))
    const tagged = tagParagraphs(body)
    expect(tagged[0].isIntro).toBe(true)
    expect(tagged[1].weak).toBe(false)
    expect(tagged[2].weak).toBe(true)
    expect(tagged[2].tags.find((t) => t.label === 'Evidence')?.present).toBe(false)
  })
})
