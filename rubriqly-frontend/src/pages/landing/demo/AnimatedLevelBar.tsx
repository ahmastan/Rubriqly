import * as m from 'motion/react-m'
import { useReducedMotion } from 'motion/react'
import { cn } from '../../../lib/ui'

/**
 * The app's 4-segment level bar, but each filled segment grows in from the left in turn.
 * Animates `transform: scaleX` only, which the browser can do cheaply on the graphics card.
 */
export function AnimatedLevelBar({
  level,
  count = 4,
  label,
  delay = 0,
  play = true,
  className,
}: {
  level: number
  count?: number
  label: string
  delay?: number
  /** False holds the bar empty (e.g. until scrolled into view). */
  play?: boolean
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  return (
    <div
      role="img"
      aria-label={`${label}: level ${level} of ${count}`}
      className={cn('flex w-40 gap-1', className)}
    >
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="h-2 grow overflow-hidden rounded-[3px] bg-border">
          {i < level && (
            <m.span
              className="block h-full origin-left bg-accent"
              initial={reduceMotion ? false : { scaleX: 0 }}
              animate={{ scaleX: play || reduceMotion ? 1 : 0 }}
              transition={{ delay: delay + i * 0.14, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </span>
      ))}
    </div>
  )
}
