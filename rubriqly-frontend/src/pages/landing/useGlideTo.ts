import { useLenis } from 'lenis/react'
import type { MouseEvent } from 'react'
import { useLocation } from 'react-router'

/** Room left above a section so the 64px sticky nav doesn't cover its heading. */
const NAV_OFFSET = -72

/**
 * How long a glide takes: at least 0.9s, a little longer for far-away sections, at most 1.8s.
 * A fixed time with an ease-in-out curve starts and stops gently, instead of rushing off the mark.
 */
const glideSeconds = (distance: number) => Math.min(1.8, Math.max(0.9, 0.7 + distance / 5000))
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * Click handlers that glide the landing page to a section (`'#faq'`) or back to the top (`'top'`)
 * instead of jumping. They only take over when the target is on this page; otherwise the link
 * works as usual (for example the logo on /privacy still goes home).
 *
 * Lenis does the gliding when it's running (it jumps straight there for people who prefer reduced
 * motion); pages without Lenis fall back to the browser's own smooth scrolling.
 */
export function useGlideTo() {
  const lenis = useLenis()
  const { pathname } = useLocation()

  return (target: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    // Leave modified clicks (open in a new tab, etc.) to the browser.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return
    }
    const toTop = target === 'top'
    if (toTop && pathname !== '/') return
    const section = toTop ? null : document.querySelector<HTMLElement>(target)
    if (!toTop && !section) return

    event.preventDefault()
    // Keep the address in step (a section's #hash, or none at the top) without the browser jumping.
    window.history.replaceState(window.history.state, '', toTop ? pathname : target)

    // Wait a frame so layout changes from the same click (the mobile menu closing) have landed.
    requestAnimationFrame(() => {
      if (lenis) {
        const distance = section
          ? Math.abs(section.getBoundingClientRect().top + NAV_OFFSET)
          : window.scrollY
        lenis.scrollTo(section ?? 0, {
          offset: section ? NAV_OFFSET : 0,
          duration: glideSeconds(distance),
          easing: easeInOutCubic,
        })
      } else {
        const top = section ? section.getBoundingClientRect().top + window.scrollY + NAV_OFFSET : 0
        window.scrollTo({ top, behavior: 'smooth' })
      }
    })
  }
}
