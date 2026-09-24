import { screen } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { renderRoute } from '../../test/renderRoute'

// Its own file, so Motion reads this fake "reduce motion" system setting fresh.
beforeAll(() => {
  window.matchMedia = (query: string) =>
    ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
})

describe('Landing page with reduced motion', () => {
  it('shows the hero fully, with nothing waiting to animate in', async () => {
    await renderRoute('/')
    const heading = await screen.findByRole('heading', { level: 1 })
    const hidden = [heading, ...document.querySelectorAll<HTMLElement>('[style]')].filter(
      (el) => el.style.opacity === '0' || /scaleX\(0\)/.test(el.style.transform),
    )
    expect(hidden).toEqual([])
  })
})

describe('Scroll demo with reduced motion', () => {
  it('shows the still version with every step instead of pinning', async () => {
    await renderRoute('/')
    await screen.findByRole('heading', { name: 'From pasted draft to a clear next step.' })
    expect(document.querySelector('[data-demo="pinned"]')).toBeNull()
    expect(document.querySelector('[data-demo="stacked"]')).toBeNull()
    const still = document.querySelector('[data-demo="static"]') as HTMLElement
    expect(still.querySelectorAll('li')).not.toHaveLength(0)
    expect(still).toHaveTextContent('Know exactly where to revise')
  })
})

describe('Rubric library with reduced motion', () => {
  it('uses the plain swipeable row, not the scroll-driven one', async () => {
    await renderRoute('/')
    await screen.findByRole('heading', { level: 1 })
    expect(document.querySelector('[data-library="pinned"]')).toBeNull()
    expect(document.querySelector('[data-library="swipe"]')).toHaveTextContent('Build your own')
  })
})
