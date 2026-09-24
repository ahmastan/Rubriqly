import { describe, expect, it } from 'vitest'
import { countWords, extractTitle, initials, splitParagraphs, timeAgo } from './text'

describe('countWords', () => {
  it('counts words separated by any whitespace', () => {
    expect(countWords('  one two\nthree\t four ')).toBe(4)
    expect(countWords('')).toBe(0)
  })
})

describe('splitParagraphs', () => {
  it('splits on blank lines and joins wrapped lines', () => {
    const text = 'First line\nwraps here.\n\n\nSecond paragraph.\r\n\r\nThird.'
    expect(splitParagraphs(text)).toEqual(['First line wraps here.', 'Second paragraph.', 'Third.'])
  })
})

describe('extractTitle', () => {
  it('treats a short unpunctuated first paragraph as the title', () => {
    expect(extractTitle(['My Essay Title', 'Body.'])).toEqual({
      title: 'My Essay Title',
      body: ['Body.'],
    })
  })

  it('keeps a sentence as a paragraph', () => {
    expect(extractTitle(['This is a sentence.', 'Body.']).title).toBeUndefined()
  })
})

describe('timeAgo', () => {
  it('formats recent times', () => {
    const now = new Date('2026-09-22T12:00:00Z')
    expect(timeAgo('2026-09-22T11:59:30Z', now)).toBe('just now')
    expect(timeAgo('2026-09-22T11:58:00Z', now)).toBe('2 min ago')
  })
})

describe('initials', () => {
  it('uses the first and last name', () => {
    expect(initials('Ada Lovelace')).toBe('AL')
    expect(initials('  test student one ')).toBe('TO')
    expect(initials('Ada')).toBe('A')
    expect(initials('   ')).toBe('')
  })
})
