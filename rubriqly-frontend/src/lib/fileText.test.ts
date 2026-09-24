import { describe, expect, it } from 'vitest'
import {
  FileReadError,
  pdfPagesToText,
  readDraftFile,
  tidyParagraphs,
  type PdfTextItem,
} from './fileText'
import { makeDocx } from '../test/files'

/** Text pieces for one PDF page: each line at its y position (top of the page first). */
function page(lines: { text: string; y: number; x?: number }[], size = 12): PdfTextItem[] {
  return lines.map(({ text, y, x = 72 }) => ({
    str: text,
    x,
    y,
    width: text.length * size * 0.5,
    height: size,
  }))
}

describe('tidyParagraphs', () => {
  it('keeps one blank line between paragraphs and trims spaces', () => {
    expect(tidyParagraphs('  One  two \r\n\r\n\r\n\u00a0Three\n\n  \n')).toBe('One two\n\nThree')
  })
})

describe('pdfPagesToText', () => {
  it('starts a new paragraph after a bigger gap between lines', () => {
    const text = pdfPagesToText([
      page([
        { text: 'The first paragraph starts here', y: 700 },
        { text: 'and ends here.', y: 686 },
        { text: 'The second paragraph.', y: 660 },
      ]),
    ])
    expect(text).toBe('The first paragraph starts here and ends here.\n\nThe second paragraph.')
  })

  it('starts a new paragraph at an indented line (double-spaced essays)', () => {
    const text = pdfPagesToText([
      page([
        { text: 'Opening line of the essay', y: 700, x: 108 },
        { text: 'continues here.', y: 676 },
        { text: 'A new paragraph begins', y: 652, x: 108 },
        { text: 'and wraps.', y: 628 },
      ]),
    ])
    expect(text).toBe(
      'Opening line of the essay continues here.\n\nA new paragraph begins and wraps.',
    )
  })

  it('drops page numbers, rejoins hyphenated words and continues across pages', () => {
    const text = pdfPagesToText([
      page([
        { text: 'A sentence that is cut in exam-', y: 700 },
        { text: 'ple and carries on to the', y: 686 },
        { text: '1', y: 40 },
      ]),
      page([
        { text: 'next page.', y: 700 },
        { text: '2', y: 40 },
      ]),
    ])
    expect(text).toBe('A sentence that is cut in example and carries on to the next page.')
  })

  it('puts spaces between words stored as separate pieces', () => {
    const text = pdfPagesToText([
      [
        { str: 'Hello', x: 72, y: 700, width: 30, height: 12 },
        { str: 'world.', x: 106, y: 700, width: 36, height: 12 },
      ],
    ])
    expect(text).toBe('Hello world.')
  })
})

describe('readDraftFile', () => {
  it('reads .txt files', async () => {
    const draft = await readDraftFile(new File(['Title\n\nFirst.\n\nSecond.'], 'draft.txt'))
    expect(draft).toEqual({ text: 'Title\n\nFirst.\n\nSecond.', paragraphs: 3, approximate: false })
  })

  it('reads .docx files, one paragraph per Word paragraph', async () => {
    const file = await makeDocx(['My Essay Title', 'The first paragraph.', 'The second one.'])
    const draft = await readDraftFile(file)
    expect(draft.text).toBe('My Essay Title\n\nThe first paragraph.\n\nThe second one.')
    expect(draft.paragraphs).toBe(3)
  })

  it('explains broken .docx files, old .doc files and other types', async () => {
    await expect(readDraftFile(new File(['not a zip'], 'draft.docx'))).rejects.toThrow(
      /couldn’t read this .docx/,
    )
    await expect(readDraftFile(new File(['x'], 'draft.doc'))).rejects.toThrow(/Save it as .docx/)
    await expect(readDraftFile(new File(['x'], 'draft.pages'))).rejects.toThrow(
      'Upload a .docx, .pdf or .txt file.',
    )
  })

  it('refuses files over 5 MB and files with no text', async () => {
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.txt')
    await expect(readDraftFile(big)).rejects.toBeInstanceOf(FileReadError)
    await expect(readDraftFile(new File(['  \n\n '], 'empty.txt'))).rejects.toThrow(/no text/)
  })
})
