// Reading a draft out of an uploaded file, entirely in the browser: the file never leaves the
// device, and only the text goes to the server when the student presses Check (like pasting).
// The .docx and .pdf readers are large, so they're downloaded only when such a file is chosen.

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

/** A problem with the file itself, with a message to show the student. */
export class FileReadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FileReadError'
  }
}

export interface DraftFile {
  text: string
  paragraphs: number
  /** PDF paragraph breaks are worked out from the layout, so they're worth a quick check. */
  approximate: boolean
}

export async function readDraftFile(file: File): Promise<DraftFile> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new FileReadError('That file is over 5 MB. Try a smaller file or paste the text.')
  }
  const extension = file.name.split('.').pop()?.toLowerCase()
  let text: string
  if (extension === 'txt') text = await file.text()
  else if (extension === 'docx') text = await readDocx(file)
  else if (extension === 'pdf') text = await readPdf(file)
  else if (extension === 'doc') {
    throw new FileReadError(
      'Older .doc files can’t be read. Save it as .docx (File → Save As) or paste the text.',
    )
  } else throw new FileReadError('Upload a .docx, .pdf or .txt file.')

  const cleaned = tidyParagraphs(text)
  if (!cleaned)
    throw new FileReadError('This file has no text we can read. Paste the text instead.')
  return {
    text: cleaned,
    paragraphs: cleaned.split('\n\n').length,
    approximate: extension === 'pdf',
  }
}

/** One blank line between paragraphs, no stray spaces, no empty paragraphs. */
export function tidyParagraphs(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split('\n')
        .map((line) => line.replace(/[ \t\u00a0]+/g, ' ').trim())
        .filter(Boolean)
        .join('\n'),
    )
    .filter(Boolean)
    .join('\n\n')
}

async function readDocx(file: File): Promise<string> {
  const mammoth = (await import('mammoth')).default
  try {
    const data = await file.arrayBuffer()
    // Browsers use mammoth's browser build (reads `arrayBuffer`); tests run its Node build
    // (reads `buffer`, which also accepts an ArrayBuffer).
    const input = { arrayBuffer: data, buffer: data } as unknown as { arrayBuffer: ArrayBuffer }
    const result = await mammoth.extractRawText(input)
    return result.value
  } catch {
    throw new FileReadError(
      'We couldn’t read this .docx file. Try saving it again, or paste the text.',
    )
  }
}

/** A piece of text on a PDF page. Coordinates are in points, with y measured from the bottom. */
export interface PdfTextItem {
  str: string
  x: number
  y: number
  width: number
  height: number
}

interface Line {
  text: string
  x: number
  y: number
  height: number
}

function toLines(items: PdfTextItem[]): Line[] {
  const sorted = items
    .filter((item) => item.str.trim() !== '' || item.str === ' ')
    .sort((a, b) => b.y - a.y || a.x - b.x)
  const lines: { items: PdfTextItem[]; y: number; height: number }[] = []
  for (const item of sorted) {
    const line = lines.at(-1)
    const tolerance = Math.max(item.height, line?.height ?? 0) * 0.5
    if (line && Math.abs(line.y - item.y) <= tolerance) {
      line.items.push(item)
      line.height = Math.max(line.height, item.height)
    } else {
      lines.push({ items: [item], y: item.y, height: item.height })
    }
  }
  return lines.map((line) => {
    const parts = line.items.sort((a, b) => a.x - b.x)
    let text = ''
    let end = -Infinity
    for (const part of parts) {
      // Separate words that the PDF stored as separate pieces with a gap between them.
      const gap = part.x - end
      if (text && gap > part.height * 0.15 && !text.endsWith(' ') && !part.str.startsWith(' ')) {
        text += ' '
      }
      text += part.str
      end = part.x + part.width
    }
    return { text: text.trim(), x: parts[0].x, y: line.y, height: line.height }
  })
}

/**
 * Rebuild paragraphs from the positions of text on each page. A new paragraph starts after a
 * larger-than-usual gap between lines, or at an indented first line. Page numbers are dropped,
 * and a paragraph can continue onto the next page.
 */
export function pdfPagesToText(pages: PdfTextItem[][]): string {
  const paragraphs: string[] = []
  let current: string[] = []
  const finish = () => {
    if (current.length) paragraphs.push(current.join(' '))
    current = []
  }
  const append = (text: string) => {
    const last = current.at(-1)
    // Rejoin a word hyphenated across lines: "exam-" + "ple".
    if (last && /[a-z]-$/.test(last) && /^[a-z]/.test(text)) {
      current[current.length - 1] = last.slice(0, -1) + text
    } else {
      current.push(text)
    }
  }

  for (const items of pages) {
    const lines = toLines(items).filter((line) => line.text && !/^\d{1,4}$/.test(line.text))
    if (lines.length === 0) continue
    // Normal line spacing is the smallest ordinary gap; paragraph gaps are bigger.
    const gaps = lines
      .slice(1)
      .map((line, i) => ({ gap: lines[i].y - line.y, height: line.height }))
    const ordinary = gaps.filter(({ gap, height }) => gap >= height * 0.8).map(({ gap }) => gap)
    const usualGap = ordinary.length ? Math.min(...ordinary) : 0
    const left = Math.min(...lines.map((line) => line.x))

    // A new page continues the paragraph unless the previous one ended a sentence.
    if (current.length && /[.!?:"”)]$/.test(current.at(-1)!)) finish()

    lines.forEach((line, i) => {
      if (i > 0) {
        const gap = lines[i - 1].y - line.y
        const indented = line.x - left > line.height * 1.2
        if ((usualGap > 0 && gap > usualGap * 1.4) || indented) finish()
      }
      append(line.text)
    })
  }
  finish()
  return paragraphs.join('\n\n')
}

async function readPdf(file: File): Promise<string> {
  // The legacy build works in older browsers too (e.g. iPads on older Safari); the standard
  // build needs JavaScript features only the newest browsers have.
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const { default: workerUrl } = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
  let document
  try {
    document = await task.promise
  } catch (error) {
    void task.destroy()
    if (error instanceof Error && error.name === 'PasswordException') {
      throw new FileReadError(
        'This PDF is password-protected. Remove the password or paste the text.',
      )
    }
    throw new FileReadError('We couldn’t read this PDF. Try exporting it again, or paste the text.')
  }

  try {
    const pages: PdfTextItem[][] = []
    for (let number = 1; number <= document.numPages; number++) {
      const page = await document.getPage(number)
      const content = await page.getTextContent()
      pages.push(
        content.items.flatMap((item) =>
          'str' in item
            ? [
                {
                  str: item.str,
                  x: item.transform[4],
                  y: item.transform[5],
                  width: item.width,
                  height: item.height || Math.abs(item.transform[3]),
                },
              ]
            : [],
        ),
      )
    }
    const text = pdfPagesToText(pages)
    if (!text.trim()) {
      throw new FileReadError(
        'This PDF has no selectable text (it may be a scan or a photo). Paste the text instead.',
      )
    }
    return text
  } finally {
    // Frees the PDF reader's worker.
    void task.destroy()
  }
}
