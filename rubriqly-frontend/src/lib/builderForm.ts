import { z } from 'zod'
import type { BuilderItem } from './jevPayload'
import type { Rubric } from './types'

export const DEFAULT_LEVELS = ['Beginning', 'Developing', 'Proficient', 'Exemplary']

export interface BuilderValues {
  id: string
  version: number
  title: string
  levels: string[]
  items: BuilderItem[]
  rules: Rubric['rules']
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'criterion'
  )
}

export function emptyItem(levelCount: number): BuilderItem {
  return {
    id: '',
    name: '',
    kind: 'score',
    question: '',
    descriptors: Array(levelCount).fill(''),
    tips: Array(levelCount).fill(''),
  }
}

export function blankRubricValues(): BuilderValues {
  return {
    id: '',
    version: 1,
    title: 'Untitled rubric',
    levels: DEFAULT_LEVELS,
    items: [emptyItem(DEFAULT_LEVELS.length)],
    rules: {},
  }
}

export function rubricToValues(rubric: Rubric): BuilderValues {
  const n = rubric.levels.length
  return {
    // Built-in packs can't be edited in place: saving creates your own copy.
    id: rubric.source === 'mine' ? rubric.id : '',
    version: rubric.source === 'mine' ? rubric.version : 1,
    title: rubric.source === 'mine' ? rubric.title : `${rubric.title} (my copy)`,
    levels: rubric.levels,
    rules: rubric.rules,
    items: [
      ...rubric.criteria.map((c) => ({
        id: c.id,
        name: c.name,
        kind: 'score' as const,
        question: c.question,
        descriptors: c.descriptors,
        tips: c.tips,
      })),
      ...rubric.checklist.map((item) => ({
        id: item.id,
        name: item.name,
        kind: 'yesno' as const,
        question: item.question,
        descriptors: Array(n).fill(''),
        tips: Array(n).fill(''),
      })),
    ],
  }
}

/** Ids come from names when missing, and are made unique so each question has its own key. */
export function assignIds(items: BuilderItem[]): BuilderItem[] {
  const used = new Set<string>()
  return items.map((item) => {
    const base = item.id || slugify(item.name)
    let id = base
    for (let i = 2; used.has(id); i++) id = `${base}_${i}`
    used.add(id)
    return { ...item, id }
  })
}

export function valuesToRubric(values: BuilderValues, id: string): Rubric {
  const items = assignIds(values.items)
  return {
    id,
    version: values.version,
    title: values.title.trim(),
    source: 'mine',
    levels: values.levels,
    rules: values.rules,
    criteria: items
      .filter((i) => i.kind === 'score')
      .map((i) => ({
        id: i.id,
        name: i.name.trim(),
        type: 'score' as const,
        weight: 1,
        question: i.question.trim(),
        descriptors: i.descriptors.map((d) => d.trim()),
        tips: i.tips.map((t) => t.trim()),
      })),
    checklist: items
      .filter((i) => i.kind === 'yesno')
      .map((i) => ({ id: i.id, name: i.name.trim(), question: i.question.trim() })),
  }
}

const required = (what: string) => z.string().trim().min(1, `Add ${what}.`)

export const builderSchema = z.object({
  id: z.string(),
  version: z.number(),
  title: required('a rubric name'),
  levels: z.array(z.string()).min(2),
  rules: z.custom<Rubric['rules']>(),
  items: z
    .array(
      z
        .object({
          id: z.string(),
          name: required('a criterion name'),
          kind: z.enum(['score', 'yesno']),
          question: required('the question for Jev'),
          descriptors: z.array(z.string()),
          tips: z.array(z.string()),
        })
        .superRefine((item, ctx) => {
          if (item.kind !== 'score') return
          item.descriptors.forEach((d, i) => {
            if (!d.trim())
              ctx.addIssue({
                code: 'custom',
                path: ['descriptors', i],
                message: 'Describe this level.',
              })
          })
          item.tips.forEach((t, i) => {
            if (!t.trim())
              ctx.addIssue({
                code: 'custom',
                path: ['tips', i],
                message: 'Add a tip for this level.',
              })
          })
        }),
    )
    .min(1, 'Add at least one criterion.')
    .refine((items) => items.some((i) => i.kind === 'score'), {
      message: 'Add at least one score criterion.',
    }),
})
