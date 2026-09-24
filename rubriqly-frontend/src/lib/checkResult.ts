import { overallEstimate, toCriterionResult } from './scoring'
import { countWords, extractTitle, splitParagraphs } from './text'
import type { ChecklistResult, CheckResponse, CheckResult, Rubric } from './types'

/** What's sent with each check: everything Jev needs, and never the tips. */
export function rubricForScoring(rubric: Rubric) {
  return {
    id: rubric.id,
    version: rubric.version,
    title: rubric.title,
    levels: rubric.levels,
    criteria: rubric.criteria.map(({ id, name, question, descriptors }) => ({
      id,
      name,
      question,
      descriptors,
    })),
    checklist: rubric.checklist.map(({ id, name, question }) => ({ id, name, question })),
  }
}

/** The rubric's word-count rule, counted in plain code (no model needed). */
export function wordCountRule(rubric: Rubric, wordCount: number): ChecklistResult | undefined {
  const range = rubric.rules.word_count
  if (!range) return undefined
  const bounds = `${range.min ?? 0}–${range.max ?? '∞'}`
  return {
    id: 'rule:word_count',
    label: `Length ${bounds} words (${wordCount})`,
    passed: wordCount >= (range.min ?? 0) && wordCount <= (range.max ?? Infinity),
    source: 'rule',
  }
}

/** Combine the backend's scores with the rubric (tips, level names, weights) into a result. */
export function buildCheckResult(
  rubric: Rubric,
  text: string,
  response: CheckResponse,
  ids: { id: string; draftId: string; assignmentId: string },
): CheckResult {
  const body = extractTitle(splitParagraphs(text)).body
  const wordCount = countWords(text)

  const criteria = rubric.criteria.map((criterion) => {
    const scored = response.criteria.find((c) => c.id === criterion.id)
    if (!scored) throw new Error(`The result is missing “${criterion.name}”. Please try again.`)
    return toCriterionResult(criterion, rubric.levels, scored.level, scored.confidence)
  })

  const checklist: ChecklistResult[] = rubric.checklist.map((item) => {
    const probability = response.checklist.find((c) => c.id === item.id)?.probability ?? 0
    return {
      id: item.id,
      label: item.name,
      passed: probability >= 0.5,
      source: 'model',
      probability,
    }
  })
  const rule = wordCountRule(rubric, wordCount)
  if (rule) checklist.push(rule)

  return {
    ...ids,
    rubricId: rubric.id,
    rubricVersion: rubric.version,
    rubricTitle: rubric.title,
    createdAt: new Date().toISOString(),
    title: response.title ?? undefined,
    wordCount,
    paragraphs: response.paragraphs.map((p) => ({
      n: p.n,
      text: body[p.n - 1] ?? '',
      isIntro: p.is_intro,
      isConclusion: p.is_conclusion,
      tags: p.tags.map(({ label, present }) => ({ label, present })),
      weak: p.weak,
    })),
    criteria,
    checklist,
    overall: overallEstimate(rubric, criteria),
    model: response.model,
  }
}
