import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { applyTheme, watchSystemTheme } from './lib/theme'
import { routes } from './routes'

const router = createBrowserRouter(routes)

export default function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
      }),
  )

  useEffect(() => {
    applyTheme()
    return watchSystemTheme()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
