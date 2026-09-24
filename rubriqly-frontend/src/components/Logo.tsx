import { Link } from 'react-router'

export function LogoMark() {
  return (
    <span
      className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-2 text-bg"
      aria-hidden="true"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 4v16" />
        <path d="M13 8h6" />
        <path d="M13 12h6" />
        <path d="M13 16h4" />
      </svg>
    </span>
  )
}

export function Logo() {
  return (
    <Link
      to="/check/new"
      aria-label="Rubriqly, new check"
      className="flex items-center gap-2.5 rounded-lg text-ink no-underline hover:text-ink"
    >
      <LogoMark />
      <span className="text-base font-semibold tracking-[-0.01em]">Rubriqly</span>
    </Link>
  )
}
