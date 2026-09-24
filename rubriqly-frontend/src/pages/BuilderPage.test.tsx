import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { listRubrics } from '../lib/api'
import { renderRoute } from '../test/renderRoute'

describe('Rubric builder', () => {
  it('shows the exact question sent to Jev, without tips', async () => {
    const { user } = await renderRoute('/rubrics/argumentative-essay/edit')
    await user.click(await screen.findByRole('button', { name: /^Analysis/ }))

    const panel = screen.getByRole('complementary', { name: 'What Jev receives' })
    const json = JSON.parse(within(panel).getByText(/"analysis"/).textContent!)
    expect(json.analysis.type).toBe('score')
    expect(json.analysis.criteria).toHaveLength(4)
    expect(panel).not.toHaveTextContent('Pick one quote')
  })

  it('updates the preview live as the question changes', async () => {
    await renderRoute('/rubrics/argumentative-essay/edit')
    const question = await screen.findByRole('textbox', { name: 'Question for Jev' })
    fireEvent.change(question, { target: { value: 'Is the thesis arguable?' } })
    const panel = screen.getByRole('complementary', { name: 'What Jev receives' })
    expect(panel).toHaveTextContent('Is the thesis arguable?')
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
  })

  it('shows yes/no items as boolean questions without a levels table', async () => {
    const { user } = await renderRoute('/rubrics/argumentative-essay/edit')
    await user.click(await screen.findByRole('button', { name: /^Addresses a counterargument/ }))
    expect(screen.getByRole('complementary', { name: 'What Jev receives' })).toHaveTextContent(
      '"type": "boolean"',
    )
    expect(screen.queryByRole('textbox', { name: /what it looks like/ })).not.toBeInTheDocument()
  })

  it('validates missing level text before saving', async () => {
    const { user } = await renderRoute('/rubrics/new')
    fireEvent.change(await screen.findByRole('textbox', { name: 'Criterion name' }), {
      target: { value: 'Thesis' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Question for Jev' }), {
      target: { value: 'Is there a clear thesis?' },
    })
    await user.click(screen.getByRole('button', { name: 'Save rubric' }))
    expect((await screen.findAllByText('Describe this level.')).length).toBe(4)
    expect(screen.getAllByText('Add a tip for this level.').length).toBe(4)
  })

  it('saves a copy of a built-in pack as your own rubric', async () => {
    const { user, router } = await renderRoute('/rubrics/lab-report/edit')
    await user.click(await screen.findByRole('button', { name: 'Save rubric' }))
    // Saving a pack creates a copy with its own id, then reopens the builder on it.
    await waitFor(
      () =>
        expect(router.state.location.pathname).toMatch(/^\/rubrics\/lab_report_my_copy_.+\/edit$/),
      { timeout: 3000 },
    )
    expect(await screen.findByText('Saved on this computer', {}, { timeout: 3000 })).toBeVisible()
    const mine = (await listRubrics()).filter((r) => r.source === 'mine')
    expect(mine.map((r) => r.title)).toEqual(['Lab report (my copy)'])
  })

  it('adds and removes criteria', async () => {
    const { user } = await renderRoute('/rubrics/new')
    const nav = await screen.findByRole('navigation', { name: 'Criteria' })
    await user.click(within(nav).getByRole('button', { name: '+ Add criterion' }))
    expect(within(nav).getAllByRole('button', { name: /^Untitled criterion/ })).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Remove criterion' }))
    expect(within(nav).getAllByRole('button', { name: /^Untitled criterion/ })).toHaveLength(1)
  })
})
