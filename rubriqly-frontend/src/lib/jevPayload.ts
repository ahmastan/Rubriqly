import type { Rubric } from './types'

// What the backend sends to Jev for a rubric (rubriqly-backend/src/rubriqly/scoring/compile.py),
// shown live in the rubric builder. Keep the two in sync. Tips are never included.

export type JevQuestion =
  | { type: 'score'; instructions: string; criteria: string[] }
  | { type: 'boolean'; instructions: string }

export interface BuilderItem {
  id: string
  name: string
  kind: 'score' | 'yesno'
  question: string
  descriptors: string[]
  tips: string[]
}

export function itemToJevQuestion(item: BuilderItem): JevQuestion {
  if (item.kind === 'yesno') return { type: 'boolean', instructions: item.question }
  return { type: 'score', instructions: item.question, criteria: item.descriptors }
}

export function rubricToJevQuestions(rubric: Rubric): Record<string, JevQuestion> {
  const questions: Record<string, JevQuestion> = {}
  for (const c of rubric.criteria) {
    questions[c.id] = { type: 'score', instructions: c.question, criteria: c.descriptors }
  }
  for (const item of rubric.checklist) {
    questions[item.id] = { type: 'boolean', instructions: item.question }
  }
  return questions
}
