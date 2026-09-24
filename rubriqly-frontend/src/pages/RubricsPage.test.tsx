import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { saveRubric } from '../lib/api'
import { STARTER_RUBRICS } from '../lib/starterRubrics'
import { renderRoute } from '../test/renderRoute'

describe('Rubrics', () => {
  it('lists built-in rubrics and links to use or copy them', async () => {
    const { user, router } = await renderRoute('/rubrics')
    const packs = (await screen.findByRole('heading', { name: 'Built-in rubrics' })).closest(
      'section',
    )!
    expect(await within(packs).findAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText(/You haven’t made a rubric yet/)).toBeInTheDocument()

    await user.click(within(packs).getAllByRole('link', { name: 'Use' })[1])
    await waitFor(() => expect(router.state.location.search).toBe('?rubric=lab-report'))
  })

  it('shows your saved rubrics', async () => {
    await saveRubric({ ...STARTER_RUBRICS[0], id: 'mine_1', title: 'My essay rubric' })
    await renderRoute('/rubrics')
    const mine = (await screen.findByRole('heading', { name: 'Your rubrics' })).closest('section')!
    expect(await within(mine).findByText('My essay rubric')).toBeInTheDocument()
    expect(within(mine).getByRole('link', { name: 'Edit My essay rubric' })).toHaveAttribute(
      'href',
      '/rubrics/mine_1/edit',
    )
  })
})
