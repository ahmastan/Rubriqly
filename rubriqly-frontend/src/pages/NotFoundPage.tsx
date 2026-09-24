import { Link } from 'react-router'
import { buttonStyles } from '../lib/ui'

export function NotFoundPage() {
  return (
    <div className="flex grow flex-col items-start justify-center gap-4 px-8 py-16 sm:px-16">
      <h1 className="m-0 text-[28px] font-semibold tracking-[-0.02em]">Page not found</h1>
      <p className="m-0 text-ink-2">This page doesn’t exist.</p>
      <Link to="/check/new" className={buttonStyles.primary}>
        Check a draft
      </Link>
    </div>
  )
}
