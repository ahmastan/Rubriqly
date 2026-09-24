import { Menu, X } from 'lucide-react'
import { useMotionValueEvent, useScroll } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router'
import { LogoMark } from '../../components/Logo'
import { buttonStyles, cn } from '../../lib/ui'
import { nav } from './content'
import { container } from './ui'

export function Wordmark() {
  return (
    <Link
      to="/"
      aria-label="Rubriqly home"
      className="flex items-center gap-2.5 text-ink no-underline hover:text-ink"
    >
      <LogoMark />
      <span className="text-base font-semibold tracking-[-0.01em]">Rubriqly</span>
    </Link>
  )
}

export function LandingNav() {
  const [open, setOpen] = useState(false)
  // See-through over the hero; frosted with a border once you've scrolled past most of it.
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > window.innerHeight * 0.6))
  const solid = scrolled || open

  return (
    <header
      data-scrolled={solid ? '' : undefined}
      className={cn(
        'sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-300',
        solid ? 'border-border bg-bg/80 backdrop-blur-md' : 'border-transparent bg-transparent',
      )}
    >
      <div className={cn(container, 'flex h-16 items-center gap-6')}>
        <Wordmark />
        <nav aria-label="Page sections" className="hidden grow items-center gap-1 md:flex">
          {nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-ink-soft no-underline hover:bg-muted hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <span className="grow md:hidden" />
        <div className="hidden items-center gap-2 md:flex">
          <Link to={nav.signIn.to} className={buttonStyles.ghost}>
            {nav.signIn.label}
          </Link>
          <Link to={nav.signUp.to} className={buttonStyles.primary}>
            {nav.signUp.label}
          </Link>
        </div>
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="landing-menu"
          onClick={() => setOpen((v) => !v)}
          className="flex size-10 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-ink hover:bg-muted md:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div id="landing-menu" className="border-t border-border md:hidden">
          <nav aria-label="Page sections" className={cn(container, 'flex flex-col gap-1 py-3')}>
            {nav.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[15px] text-ink no-underline hover:bg-muted hover:text-ink"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex gap-2 border-t border-border pt-3">
              <Link to={nav.signIn.to} className={cn(buttonStyles.secondary, 'grow')}>
                {nav.signIn.label}
              </Link>
              <Link to={nav.signUp.to} className={cn(buttonStyles.primary, 'grow')}>
                {nav.signUp.label}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
