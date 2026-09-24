import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { runCheck } from '../lib/api'
import { SAMPLE_ESSAY } from '../lib/sampleEssay'
import { renderRoute } from '../test/renderRoute'

const REVISED = SAMPLE_ESSAY.replace(
  'It was a dangerous time for everyone.',
  'Death records from 1918 show that this shows the cost of waiting, which suggests timing mattered most.',
)

describe('Results', () => {
  it('shows the draft, criteria, and checklist', async () => {
    const { checkId } = await runCheck({
      rubricId: 'argumentative-essay',
      prompt: '',
      text: SAMPLE_ESSAY,
    })
    await renderRoute(`/checks/${checkId}`)

    expect(
      await screen.findByRole('heading', { name: 'Why the 1918 Flu Changed Public Health' }),
    ).toBeInTheDocument()
    const draft = screen.getByRole('region', { name: 'Your draft' })
    expect(within(draft).getByText('¶3')).toBeInTheDocument()
    expect(within(draft).getAllByText('Evidence missing').length).toBeGreaterThan(0)

    const results = screen.getByRole('region', { name: 'Results' })
    expect(within(results).getByText(/of 4$/)).toBeInTheDocument()
    for (const name of ['Thesis', 'Evidence', 'Analysis', 'Organization', 'Conventions']) {
      expect(within(results).getByRole('img', { name: new RegExp(`^${name}: level \\d of 4$`) }))
    }
    expect(within(results).getByText('Addresses a counterargument')).toBeInTheDocument()
    expect(within(results).getByText(/^Length 500–900 words/)).toBeInTheDocument()
    // Scored by the server, so it isn't labelled as a demo.
    expect(screen.queryByText('Demo results')).not.toBeInTheDocument()
    // First draft: nothing to compare with yet.
    expect(screen.queryByText(/^Since draft/)).not.toBeInTheDocument()
  })

  it('compares with the previous draft of the same assignment', async () => {
    const first = await runCheck({
      rubricId: 'argumentative-essay',
      prompt: '',
      text: SAMPLE_ESSAY,
    })
    const { loadData } = await import('../lib/localStore')
    const assignmentId = loadData().checks.find((c) => c.id === first.checkId)!.assignmentId
    const second = await runCheck({
      rubricId: 'argumentative-essay',
      assignmentId,
      prompt: '',
      text: REVISED,
    })
    await renderRoute(`/checks/${second.checkId}`)

    expect(await screen.findByText('Since draft 1')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent('Draft 2')
  })

  it('labels checks saved by the old demo scorer', async () => {
    const { checkId } = await runCheck({
      rubricId: 'argumentative-essay',
      prompt: '',
      text: SAMPLE_ESSAY,
    })
    const { updateData } = await import('../lib/localStore')
    updateData((data) => {
      data.checks[0].model = 'mock'
    })
    await renderRoute(`/checks/${checkId}`)
    expect(await screen.findByText('Demo results')).toBeInTheDocument()
  })

  it('explains when a check is not on this device', async () => {
    await renderRoute('/checks/chk_missing')
    expect(await screen.findByText('We couldn’t open this check')).toBeInTheDocument()
  })
})
