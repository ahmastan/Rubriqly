import type { CriterionResult, OverallEstimate, Rubric, ScoreCriterion } from './types'

/** Answers below this confidence are flagged "check this yourself" (brief §3, step 5). */
export const CONFIDENCE_THRESHOLD = 0.6

export function clampLevel(raw: number, levelCount: number): number {
  return Math.min(levelCount, Math.max(1, Math.round(raw)))
}

/** Tips are shown for weaker criteria: anything below the second-highest level. */
export function shouldShowTip(level: number, levelCount: number): boolean {
  return level < levelCount - 1
}

export function toCriterionResult(
  criterion: ScoreCriterion,
  levels: string[],
  rawLevel: number,
  confidence: number,
): CriterionResult {
  const level = clampLevel(rawLevel, levels.length)
  return {
    criterionId: criterion.id,
    name: criterion.name,
    level,
    levelName: levels[level - 1],
    confidence,
    lowConfidence: confidence < CONFIDENCE_THRESHOLD,
    tip: shouldShowTip(level, levels.length) ? criterion.tips[level - 1] : undefined,
  }
}

/** Weighted average of criterion levels. Always shown as an estimate, never a grade. */
export function overallEstimate(rubric: Rubric, results: CriterionResult[]): OverallEstimate {
  let total = 0
  let weights = 0
  for (const result of results) {
    const weight = rubric.criteria.find((c) => c.id === result.criterionId)?.weight ?? 1
    total += result.level * weight
    weights += weight
  }
  const value = weights > 0 ? Math.round((total / weights) * 10) / 10 : 1
  const level = clampLevel(value, rubric.levels.length)
  return { value, level, levelName: rubric.levels[level - 1], levelCount: rubric.levels.length }
}
