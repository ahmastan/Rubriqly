import * as m from 'motion/react-m'
import { useReducedMotion } from 'motion/react'
import { cn } from '../../../lib/ui'
import { demoResults } from '../content'

const SHADES = ['bg-accent-pale', 'bg-accent-mid', 'bg-accent']

/** The app's "Since draft 2" card with made-up history. With `play`, the bars grow in turn. */
export function SinceMock({ play = true, className }: { play?: boolean; className?: string }) {
  const reduceMotion = useReducedMotion()
  const { history, after, before } = demoResults
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-2xl border border-border bg-surface px-5 py-4',
        className,
      )}
    >
      <span className="text-[13px] text-ink-2">Since {before.draft.toLowerCase()}</span>
      <span className="text-3xl font-semibold tracking-[-0.02em] text-accent">{after.change}</span>
      <div className="flex h-9 items-end gap-1.5">
        {history.map((value, i) => (
          <m.span
            key={i}
            className={cn('w-6 origin-bottom rounded', SHADES[i])}
            style={{ height: `${(value / 4) * 36}px` }}
            initial={reduceMotion ? false : { scaleY: 0 }}
            animate={{ scaleY: play || reduceMotion ? 1 : 0 }}
            transition={{ delay: 0.15 + i * 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </div>
    </div>
  )
}
