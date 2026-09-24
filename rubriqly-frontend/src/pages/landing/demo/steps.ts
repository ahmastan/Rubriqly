/** Number of steps in the scroll demo (matches `demoSteps` in content.ts). */
export const STEPS = 6

/**
 * The slice of overall scroll progress (0 to 1) for part of step `i`. `from` and `to` are
 * fractions of that step: stepRange(2, 0, 0.5) is the first half of step 3.
 * Each step animates during roughly its first 70% and holds still for the rest.
 */
export function stepRange(i: number, from = 0, to = 0.7): [number, number] {
  return [(i + from) / STEPS, (i + to) / STEPS]
}

/** Which step (0-based) a scroll progress value falls in. */
export function stepAt(progress: number): number {
  return Math.min(STEPS - 1, Math.max(0, Math.floor(progress * STEPS)))
}
