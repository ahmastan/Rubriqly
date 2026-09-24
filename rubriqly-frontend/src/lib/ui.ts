import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

const buttonBase =
  'inline-flex h-[38px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-50'

/**
 * Class names for buttons and button-styled links. Primary buttons use the ink color with the
 * page background as text: near-black with white text in light mode, the reverse in dark mode.
 */
export const buttonStyles = {
  primary: cn(buttonBase, 'bg-ink text-bg hover:bg-ink/85 hover:text-bg'),
  secondary: cn(
    buttonBase,
    'border border-border bg-surface px-3.5 text-ink hover:bg-muted hover:text-ink',
  ),
  ghost: cn(buttonBase, 'bg-transparent px-3 text-ink-soft hover:bg-muted hover:text-ink'),
  danger: cn(
    buttonBase,
    'border border-danger-ring bg-danger-bg px-3.5 text-danger hover:border-danger hover:text-danger',
  ),
  /** Solid red, for the final "yes, delete" button. */
  dangerSolid: cn(buttonBase, 'bg-danger text-bg hover:bg-danger/85 hover:text-bg'),
  darkOutline: cn(
    buttonBase,
    'h-[42px] border border-dark-border bg-transparent text-white hover:bg-dark-2 hover:text-white',
  ),
}

export const sectionLabel = 'text-xs font-semibold uppercase tracking-[0.06em] text-ink-2'

export const fieldStyles =
  'w-full rounded-xl border border-field-border bg-surface px-3 text-ink placeholder:text-ink-2 focus-visible:border-accent'

/** The slim bar at the top of each page inside the app shell. */
export const pageBar =
  'flex min-h-14 shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-divider px-4 py-2.5 sm:px-6'
