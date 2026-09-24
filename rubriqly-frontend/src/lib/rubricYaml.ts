import type { Rubric } from './types'

// Writes a rubric in the rubric pack format (brief §6). Strings are written as JSON strings,
// which are valid double-quoted YAML, so no YAML library is needed to export.
// Importing needs a real parser and will go through the backend (POST /api/rubrics/import).

const q = (s: string) => JSON.stringify(s)

export function rubricToYaml(rubric: Rubric): string {
  const lines: string[] = [
    `id: ${q(rubric.id)}`,
    `version: ${rubric.version}`,
    `title: ${q(rubric.title)}`,
    `levels: [${rubric.levels.map(q).join(', ')}]`,
    'criteria:',
  ]
  for (const c of rubric.criteria) {
    lines.push(
      `  - id: ${q(c.id)}`,
      `    name: ${q(c.name)}`,
      `    type: score`,
      `    weight: ${c.weight}`,
      `    question: ${q(c.question)}`,
      `    descriptors:`,
      ...c.descriptors.map((d) => `      - ${q(d)}`),
      `    tips:`,
      ...c.tips.map((t) => `      - ${q(t)}`),
    )
  }
  if (rubric.checklist.length > 0) {
    lines.push('checklist:')
    for (const item of rubric.checklist) {
      lines.push(
        `  - id: ${q(item.id)}`,
        `    name: ${q(item.name)}`,
        `    question: ${q(item.question)}`,
      )
    }
  }
  const wc = rubric.rules.word_count
  if (wc && (wc.min !== undefined || wc.max !== undefined)) {
    const parts = [
      wc.min !== undefined && `min: ${wc.min}`,
      wc.max !== undefined && `max: ${wc.max}`,
    ]
    lines.push('rules:', `  word_count: {${parts.filter(Boolean).join(', ')}}`)
  }
  return lines.join('\n') + '\n'
}
