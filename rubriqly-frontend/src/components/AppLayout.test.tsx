import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SAMPLE_ESSAY } from '../lib/sampleEssay'
import { renderRoute } from '../test/renderRoute'

function desktopSidebar() {
  return screen.getAllByRole('navigation', { name: 'Main' })[0]
}

describe('App shell', () => {
  it('lists a checked draft under Recent and links back to it', async () => {
    const { user, router } = await renderRoute('/check/new')
    const sidebar = desktopSidebar()
    expect(await within(sidebar).findByText('Drafts you check will show up here.')).toBeVisible()

    fireEvent.change(await screen.findByRole('textbox', { name: 'Your draft' }), {
      target: { value: SAMPLE_ESSAY },
    })
    await user.click(screen.getByRole('button', { name: 'Check draft' }))
    await screen.findByText('An estimate to guide revision, not a grade.')
    const resultsPath = router.state.location.pathname

    const recent = await within(sidebar).findByRole('link', {
      name: /Why the 1918 Flu Changed Public Health/,
    })
    expect(recent).toHaveAttribute('aria-current', 'page')

    await user.click(within(sidebar).getByRole('link', { name: 'New check' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/check/new'))
    await user.click(recent)
    await waitFor(() => expect(router.state.location.pathname).toBe(resultsPath))
  })

  it('opens settings from the account button', async () => {
    const { user, router } = await renderRoute('/check/new')
    await user.click(within(desktopSidebar()).getByRole('link', { name: /Test Student One/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/settings'))
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })

  it('toggles dark mode from the sidebar', async () => {
    const { user } = await renderRoute('/check/new')
    await user.click(within(desktopSidebar()).getByRole('button', { name: 'Switch to dark mode' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('rubriqly:theme')).toBe('dark')
    await user.click(within(desktopSidebar()).getByRole('button', { name: 'Switch to light mode' }))
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('collapses the sidebar to icons and remembers it', async () => {
    const { user } = await renderRoute('/check/new')
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }))
    expect(within(desktopSidebar()).queryByText('Recent')).not.toBeInTheDocument()
    expect(within(desktopSidebar()).getByRole('link', { name: 'New check' })).toBeInTheDocument()
    expect(localStorage.getItem('rubriqly:sidebar-collapsed')).toBe('1')
    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }))
    expect(within(desktopSidebar()).getByText('Recent')).toBeInTheDocument()
  })

  it('opens the mobile menu drawer and closes it with Escape', async () => {
    const { user } = await renderRoute('/check/new')
    const menuButton = screen.getByRole('button', { name: 'Open menu' })
    await user.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByRole('navigation', { name: 'Main' })).toHaveLength(2)

    // A real browser moves focus into the open dialog; jsdom doesn't, so focus it here.
    const drawer = screen.getAllByRole('navigation', { name: 'Main' })[1]
    within(drawer).getByRole('button', { name: 'Close menu' }).focus()
    await user.keyboard('{Escape}')
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getAllByRole('navigation', { name: 'Main' })).toHaveLength(1)
  })
})

describe('Deleting a draft from Recent', () => {
  async function checkSample() {
    const { runCheck } = await import('../lib/api')
    return runCheck({ rubricId: 'argumentative-essay', prompt: '', text: SAMPLE_ESSAY })
  }

  it('asks first, and Cancel keeps it', async () => {
    await checkSample()
    const { user } = await renderRoute('/check/new')
    const sidebar = desktopSidebar()
    await user.click(
      await within(sidebar).findByRole('button', {
        name: 'Delete Why the 1918 Flu Changed Public Health',
      }),
    )
    const dialog = screen.getByRole('dialog', { name: /Delete “Why the 1918 Flu/ })
    expect(dialog).toHaveTextContent(
      'This deletes its draft along with the results from this device.',
    )
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(within(sidebar).getByRole('link', { name: /Why the 1918 Flu/ })).toBeInTheDocument()
  })

  it('deletes it and leaves its results page', async () => {
    const { checkId } = await checkSample()
    const { user, router } = await renderRoute(`/checks/${checkId}`)
    await screen.findByText('An estimate to guide revision, not a grade.')
    const sidebar = desktopSidebar()
    await user.click(
      within(sidebar).getByRole('button', {
        name: 'Delete Why the 1918 Flu Changed Public Health',
      }),
    )
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))

    expect(await within(sidebar).findByText('Drafts you check will show up here.')).toBeVisible()
    await waitFor(() => expect(router.state.location.pathname).toBe('/check/new'))
    const { loadData } = await import('../lib/localStore')
    expect(loadData()).toMatchObject({ assignments: [], drafts: [], checks: [] })
  })
})
