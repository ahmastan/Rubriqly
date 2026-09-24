/**
 * Shown for a moment while a page's code downloads: just the page's background color, so the
 * screen doesn't flash. The landing pages are dark; the app follows the user's theme.
 */
export function PageFallback({ dark = false }: { dark?: boolean }) {
  return (
    <div
      data-page-fallback=""
      className={dark ? 'theme-dark min-h-screen bg-bg' : 'min-h-screen bg-bg'}
    />
  )
}
