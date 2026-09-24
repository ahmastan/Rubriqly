// Build-time settings (Vite env). Each deployment sets its own, e.g. in render.yaml or a local
// `.env.local` (git-ignored). All are optional.
interface ImportMetaEnv {
  /** Public contact address shown on the Contact, Privacy and Terms pages. */
  readonly VITE_CONTACT_EMAIL?: string
  /** The site's full address, e.g. https://rubriqly.com (used for link-preview tags). */
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
