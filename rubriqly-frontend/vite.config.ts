import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

/**
 * Fills %SITE_URL% in index.html with VITE_SITE_URL (e.g. https://rubriqly.com). Without it, the
 * share image falls back to a relative address and the og:url tag is left out.
 */
function siteUrl(): Plugin {
  let url = ''
  return {
    name: 'rubriqly-site-url',
    configResolved(config) {
      const env = loadEnv(config.mode, config.envDir || process.cwd(), 'VITE_')
      url = (env.VITE_SITE_URL ?? '').trim().replace(/\/+$/, '')
    },
    transformIndexHtml(html) {
      if (url) return html.replaceAll('%SITE_URL%', url)
      return html
        .replace(/\s*<meta property="og:url" content="%SITE_URL%\/" \/>/, '')
        .replaceAll('%SITE_URL%', '')
    },
  }
}

// The backend, for `npm run dev` and `npm run preview`. In production, Render forwards /api the
// same way, so the site and the API share one address (and the sign-in cookie just works).
const api = { '/api': 'http://localhost:8000' }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), siteUrl()],
  server: { proxy: api },
  preview: { proxy: api },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
