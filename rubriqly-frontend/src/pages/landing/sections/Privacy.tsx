import * as m from 'motion/react-m'
import { Check } from 'lucide-react'
import { type Variants } from 'motion/react'
import { Link } from 'react-router'
import { cn } from '../../../lib/ui'
import { privacy } from '../content'
import { fadeUp, staggered, useRevealOnScroll } from '../reveal'
import { container, eyebrow, h2, sectionPad } from '../ui'

/** Each check mark pops in with a small spring, just after its line appears. */
const popCheck: Variants = {
  hidden: { scale: 0 },
  show: { scale: 1, transition: { delay: 0.25, type: 'spring', stiffness: 500, damping: 20 } },
}

export function Privacy() {
  const reveal = useRevealOnScroll()
  return (
    <section aria-labelledby="privacy-heading" className={sectionPad}>
      <div className={cn(container, 'grid gap-12 lg:grid-cols-2')}>
        <m.div {...reveal} variants={staggered(0.08)} className="flex flex-col items-start gap-4">
          <m.p variants={fadeUp} className={cn(eyebrow, 'm-0')}>
            Privacy
          </m.p>
          <m.h2 variants={fadeUp} id="privacy-heading" className={h2}>
            {privacy.heading}
          </m.h2>
          <m.span variants={fadeUp}>
            <Link to={privacy.link.to} className="text-[15px]">
              {privacy.link.label}
            </Link>
          </m.span>
        </m.div>
        <m.ul
          {...reveal}
          variants={staggered(0.14)}
          className="m-0 flex list-none flex-col gap-4 p-0"
        >
          {privacy.points.map((point) => (
            <m.li
              key={point}
              variants={fadeUp}
              className="flex gap-3 text-[17px] leading-relaxed text-ink-soft"
            >
              <m.span
                variants={popCheck}
                className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent"
              >
                <Check size={13} strokeWidth={3} aria-hidden="true" />
              </m.span>
              {point}
            </m.li>
          ))}
        </m.ul>
      </div>
    </section>
  )
}
