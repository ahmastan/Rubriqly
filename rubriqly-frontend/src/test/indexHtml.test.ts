import { describe, expect, it } from 'vitest'
import html from '../../index.html?raw'

// Vite lists these files at build time, so the test needs no Node file-system access.
const publicFiles = Object.keys(import.meta.glob('../../public/*')).map((p) => p.split('/').pop())
const meta = (attr: string, key: string) =>
  html.match(new RegExp(`<meta\\s+${attr}="${key}"\\s+content="([^"]*)"`))?.[1]

describe('index.html sharing and search tags', () => {
  it('has a title, description and social cards', () => {
    expect(html).toMatch(/<title>Rubriqly[^<]*<\/title>/)
    expect(meta('name', 'description')).toMatch(/never writes/)
    expect(html).toMatch(/property="og:title"\s+content="Rubriqly/)
    expect(meta('name', 'twitter:card')).toBe('summary_large_image')
  })

  it('points at icon and share image files that exist', () => {
    for (const file of ['favicon.svg', 'apple-touch-icon.png', 'og-image.png']) {
      expect(html).toContain(`/${file}`)
      expect(publicFiles).toContain(file)
    }
  })

  it('makes no requests to other sites (fonts are self-hosted)', () => {
    const hosts = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map(
      (m) => new URL(m[1]).host,
    )
    expect(hosts).toEqual([])
  })
})
