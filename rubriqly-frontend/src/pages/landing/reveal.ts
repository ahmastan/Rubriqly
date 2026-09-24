import { stagger, useReducedMotion, type Variants } from 'motion/react'

/** A soft "ease out" curve: fast start, gentle landing. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const

/** Rise a little and fade in. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
}

/** A parent that starts its children's animations one after another. */
export function staggered(gap = 0.1): Variants {
  return { hidden: {}, show: { transition: { delayChildren: stagger(gap) } } }
}

/**
 * Props that play a "hidden" → "show" animation once, when the element scrolls into view.
 * With reduced motion it simply starts in "show".
 */
export function useRevealOnScroll(amount = 0.3) {
  const reduceMotion = useReducedMotion()
  return {
    initial: reduceMotion ? 'show' : 'hidden',
    whileInView: 'show',
    viewport: { once: true, amount },
  } as const
}
