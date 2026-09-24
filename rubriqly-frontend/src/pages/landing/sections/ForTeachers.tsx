import * as m from 'motion/react-m'
import { type Variants } from 'motion/react'
import { cn } from '../../../lib/ui'
import { teachers } from '../content'
import { EASE_OUT, fadeUp, staggered, useRevealOnScroll } from '../reveal'
import { container, eyebrow, h2, sectionPad } from '../ui'

/** The divider above each point draws in from the left, like ruling a line on a page. */
const drawLine: Variants = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: 0.9, ease: EASE_OUT } },
}

export function ForTeachers() {
  const reveal = useRevealOnScroll()
  return (
    <section
      id="teachers"
      aria-labelledby="teachers-heading"
      className={cn(sectionPad, 'theme-light bg-bg text-ink')}
    >
      <div className={cn(container, 'grid gap-12 lg:grid-cols-[0.8fr_1.2fr]')}>
        <m.div {...reveal} variants={staggered(0.08)} className="flex flex-col gap-4">
          <m.p variants={fadeUp} className={cn(eyebrow, 'm-0')}>
            {teachers.heading}
          </m.p>
          <m.h2 variants={fadeUp} id="teachers-heading" className={h2}>
            Revision help that stays honest.
          </m.h2>
        </m.div>
        <m.ul {...reveal} variants={staggered(0.18)} className="m-0 flex list-none flex-col p-0">
          {teachers.points.map((point, i) => (
            <m.li key={point.title} variants={fadeUp} className="relative flex flex-col gap-2 py-6">
              {i > 0 && (
                <m.span
                  aria-hidden="true"
                  variants={drawLine}
                  className="absolute inset-x-0 top-0 h-px origin-left bg-border"
                />
              )}
              <h3 className="m-0 text-xl font-semibold tracking-[-0.02em]">{point.title}</h3>
              <p className="m-0 text-[15px] leading-relaxed text-ink-2">{point.body}</p>
            </m.li>
          ))}
        </m.ul>
      </div>
    </section>
  )
}
