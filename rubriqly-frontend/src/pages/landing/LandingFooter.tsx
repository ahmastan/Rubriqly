import { Link } from 'react-router'
import { cn } from '../../lib/ui'
import { footer } from './content'
import { Wordmark } from './LandingNav'
import { container } from './ui'

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className={cn(container, 'flex flex-col gap-6 py-10 sm:flex-row sm:items-center')}>
        <Wordmark />
        <p className="m-0 grow font-mono text-xs text-ink-2">
          © {new Date().getFullYear()} Rubriqly · {footer.note}
        </p>
        <nav aria-label="Legal and contact" className="flex gap-5">
          {footer.links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm text-ink-soft no-underline hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={footer.github.href}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-ink-soft no-underline hover:text-ink"
          >
            {footer.github.label}
          </a>
        </nav>
      </div>
    </footer>
  )
}
