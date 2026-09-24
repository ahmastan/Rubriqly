export function countWords(text: string): number {
  const matches = text.trim().match(/\S+/g)
  return matches ? matches.length : 0
}

/** Split on blank lines; single line breaks inside a paragraph are joined with a space. */
export function splitParagraphs(text: string): string[] {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
}

/**
 * Treat a short first line with no closing punctuation as the draft's title,
 * e.g. "Why the 1918 Flu Changed Public Health".
 */
export function extractTitle(paragraphs: string[]): { title?: string; body: string[] } {
  const [first, ...rest] = paragraphs
  if (first && rest.length > 0 && countWords(first) <= 14 && !/[.!?:;,]$/.test(first)) {
    return { title: first, body: rest }
  }
  return { body: paragraphs }
}

export function timeAgo(iso: string, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}

/** Up to two initials for an avatar, e.g. "Ada Lovelace" → "AL". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}
