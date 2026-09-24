import { useReducedMotion } from 'motion/react'
import { cn } from '../../../lib/ui'
import { PinnedDemo } from '../demo/PinnedDemo'
import { StackedDemo } from '../demo/StackedDemo'
import { StaticDemo } from '../demo/StaticDemo'
import { container, eyebrow, h2 } from '../ui'

/**
 * The centerpiece. Desktop: pinned and driven by scroll. Phones and tablets: stacked steps that
 * animate as they come into view. Reduced motion: the finished demo, still.
 */
export function DemoSection() {
  const reduceMotion = useReducedMotion()
  return (
    <section
      id="demo"
      aria-labelledby="demo-heading"
      className="scroll-mt-16 border-t border-border pt-24 pb-24 sm:pt-32"
    >
      <div className={cn(container, 'mb-14 flex max-w-2xl flex-col gap-4 lg:mb-0')}>
        <p className={cn(eyebrow, 'm-0')}>See it work</p>
        <h2 id="demo-heading" className={h2}>
          From pasted draft to a clear next step.
        </h2>
      </div>
      {reduceMotion ? (
        <StaticDemo />
      ) : (
        <>
          <div className="hidden lg:block">
            <PinnedDemo />
          </div>
          <div className="lg:hidden">
            <StackedDemo />
          </div>
        </>
      )}
    </section>
  )
}
