import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '../../test/renderRoute'
import { CONTACT_EMAIL } from './content'
import { privacyPolicy, termsOfUse } from './legal'

async function pageText(path: string) {
  await renderRoute(path)
  await screen.findByRole('heading', { level: 1 })
  return document.body.textContent!
}

describe('Privacy policy', () => {
  it('says what really happens to drafts, accounts and the data sent for scoring', async () => {
    const text = await pageText('/privacy')
    for (const fact of [
      'Your drafts are saved in your browser',
      'Vercel AI Gateway',
      'TypeSafe AI',
      'Render',
      'Neon',
      'Argon2',
      'rubriqly_session',
      '30 days',
      'never the tips',
      'don’t train AI models',
      'You must be 13 or older',
      'United States',
      'The file itself isn’t sent anywhere',
    ]) {
      expect(text).toContain(fact)
    }
    // Fonts are self-hosted now, so Google isn't one of the companies that sees visitors.
    expect(text).not.toContain('Google')
  })

  it('lists every section as a heading', async () => {
    await renderRoute('/privacy')
    for (const section of privacyPolicy.sections) {
      expect(await screen.findByRole('heading', { level: 2, name: section.heading })).toBeVisible()
    }
  })
})

describe('Terms of use', () => {
  it('covers age, what results mean, and US law', async () => {
    const text = await pageText('/terms')
    expect(text).toContain('at least 13 years old')
    expect(text).toContain('an estimate, not a grade')
    expect(text).toContain('never writes or rewrites your text')
    expect(text).toContain('laws of the United States')
    expect(text).toContain('MIT License')
    expect(termsOfUse.sections.length).toBeGreaterThan(5)
  })
})

describe('Legal pages follow the honesty rules', () => {
  it.each(['/privacy', '/terms', '/contact'])('%s', async (path) => {
    const text = (await pageText(path)).toLowerCase()
    for (const banned of [
      'proprietary',
      'all rights reserved',
      'closed source',
      'grader',
      'guaranteed',
      'cloudflare',
    ]) {
      expect(text).not.toContain(banned)
    }
    // Every mention of "grade" is a denial.
    expect(text.match(/\bgrades?\b/g)?.length ?? 0).toBe(
      text.match(/not a grade|not grades|decides the grade/g)?.length ?? 0,
    )
  })
})

describe('Contact', () => {
  it('shows the contact address, or says honestly that it is coming', async () => {
    const text = await pageText('/contact')
    if (CONTACT_EMAIL) {
      expect(screen.getAllByRole('link', { name: CONTACT_EMAIL })[0]).toHaveAttribute(
        'href',
        `mailto:${CONTACT_EMAIL}`,
      )
    } else {
      expect(text).toContain('our contact address (coming soon)')
    }
    expect(text).toContain('Forgot your password?')
  })
})
