import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '../routes'

/**
 * Render the whole app at `path`, with a fresh query cache, and wait until the page's code has
 * loaded (pages are downloaded on demand), like a real visit.
 */
export async function renderRoute(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const user = userEvent.setup()
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  // Done when the router has loaded the page AND React has replaced the loading placeholder.
  await waitFor(
    () => {
      const loading =
        !router.state.initialized ||
        router.state.navigation.state !== 'idle' ||
        utils.container.querySelector('[data-page-fallback]') !== null
      if (loading) throw new Error('page still loading')
      // The first visit downloads a page's code; slow CI machines can need more than the 1 s default.
    },
    { timeout: 5000 },
  )
  return { ...utils, router, user }
}
