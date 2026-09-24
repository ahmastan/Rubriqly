import { useEffect } from 'react'

/**
 * Keeps the page background dark while a landing page is open (so overscroll and the moment
 * before it loads aren't light), and gives it back to the app's theme when you leave.
 */
export function useLandingBackground() {
  useEffect(() => {
    document.documentElement.dataset.landing = ''
    return () => {
      delete document.documentElement.dataset.landing
    }
  }, [])
}
