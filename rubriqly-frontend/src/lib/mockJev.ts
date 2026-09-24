import { countWords, extractTitle, splitParagraphs } from './text'
import type { CheckResponse, ParagraphResult, Rubric, ScoreCriterion } from './types'

// A stand-in scorer for tests and the rubric builder's demo. It returns deterministic,
// plausible-looking results from simple text patterns. It is NOT a scorer: real checks are
// scored by Jev on the backend (POST /api/checks).

/** FNV-1a hash mapped to [0, 1). */
export function hashUnit(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0) / 0x100000000
}

const EVIDENCE =
  /\d|["“”]|according to|for example|for instance|historians|stud(y|ies)|data|percent|\(\w+,? \d{4}\)/i
const ANALYSIS =
  /\b(shows? that|suggests?|demonstrates?|this means|which means|therefore|as a result|point(s)? to|because|explains? why|led to)\b/i
const CLAIM = /\b(argues?|should|must|changed|caused|forced|proves?|is why|the difference)\b/i

function sentences(text: string): number {
  return text.split(/[.!?]+(\s|$)/).filter((s) => s.trim().length > 0).length
}

export function tagParagraphs(paragraphs: string[]): ParagraphResult[] {
  return paragraphs.map((text, i) => {
    if (i === 0) {
      return {
        n: 1,
        text,
        isIntro: true,
        tags: [
          { label: 'Claim', present: CLAIM.test(text) || sentences(text) >= 2 },
          { label: 'Context', present: countWords(text) >= 25 },
        ],
        weak: false,
      }
    }
    const evidence = EVIDENCE.test(text)
    const analysis = ANALYSIS.test(text) && evidence
    return {
      n: i + 1,
      text,
      isIntro: false,
      tags: [
        { label: 'Claim', present: CLAIM.test(text) || sentences(text) >= 3 },
        { label: 'Evidence', present: evidence },
        { label: 'Analysis', present: analysis },
      ],
      weak: !evidence || !analysis,
    }
  })
}

/** A fake level in [1, levelCount], nudged by how many body paragraphs have evidence and analysis. */
export function mockCriterionScore(
  criterion: Pick<ScoreCriterion, 'id'>,
  text: string,
  levelCount: number,
): { raw: number; confidence: number } {
  const body = tagParagraphs(splitParagraphs(text)).filter((p) => !p.isIntro)
  const strength = body.length
    ? body.filter((p) => p.tags.every((t) => t.present)).length / body.length
    : 0
  const jitter = hashUnit(criterion.id + text) - 0.5
  const raw = 1 + strength * (levelCount - 1) + jitter * 1.4
  const confidence = Math.round((0.48 + 0.45 * hashUnit(text + criterion.id + 'conf')) * 100) / 100
  return { raw, confidence }
}

/**
 * A fake `POST /api/checks` response for the tests' stand-in backend (src/test/fakeBackend.ts).
 * Same shape as the real backend's answer.
 */
export function mockCheckResponse(rubric: Rubric, text: string): CheckResponse {
  const { title, body } = extractTitle(splitParagraphs(text))
  const paragraphs = tagParagraphs(body)
  return {
    model: 'mock',
    word_count: countWords(text),
    title: title ?? null,
    criteria: rubric.criteria.map((criterion) => {
      const { raw, confidence } = mockCriterionScore(criterion, text, rubric.levels.length)
      return { id: criterion.id, level: raw, confidence, probabilities: [] }
    }),
    checklist: rubric.checklist.map((item) => ({
      id: item.id,
      probability: Math.round(hashUnit(item.id + text) * 100) / 100,
    })),
    paragraphs: paragraphs.map((p, i) => ({
      n: p.n,
      is_intro: p.isIntro,
      is_conclusion: paragraphs.length >= 3 && i === paragraphs.length - 1,
      tags: p.tags.map((t) => ({ ...t, probability: t.present ? 0.9 : 0.1 })),
      weak: p.weak,
    })),
  }
}
