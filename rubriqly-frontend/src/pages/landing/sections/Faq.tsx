import * as m from 'motion/react-m'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../../lib/ui'
import { faq } from '../content'
import { fadeUp, staggered, useRevealOnScroll } from '../reveal'
import { container, eyebrow, h2, sectionPad } from '../ui'

/**
 * An accordion made from native <details>: keyboard and screen reader support come built in.
 * Answers slide open with CSS (see landing.css).
 */
export function Faq() {
  const reveal = useRevealOnScroll(0.2)
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className={cn(sectionPad, 'border-t border-border')}
    >
      <div className={cn(container, 'grid gap-12 lg:grid-cols-[0.8fr_1.2fr]')}>
        <m.div {...reveal} variants={staggered(0.08)} className="flex flex-col gap-4">
          <m.p variants={fadeUp} className={cn(eyebrow, 'm-0')}>
            FAQ
          </m.p>
          <m.h2 variants={fadeUp} id="faq-heading" className={h2}>
            {faq.heading}
          </m.h2>
        </m.div>
        <m.div {...reveal} variants={staggered(0.07)} className="flex flex-col">
          {faq.items.map((item) => (
            <m.details
              key={item.q}
              variants={fadeUp}
              className="faq-item group border-b border-border [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center gap-4 py-5 text-lg font-medium">
                <span className="grow">{item.q}</span>
                <ChevronDown
                  size={18}
                  aria-hidden="true"
                  className="shrink-0 text-ink-2 transition-transform duration-300 group-open:rotate-180"
                />
              </summary>
              <p className="faq-answer m-0 max-w-2xl pb-5 text-[15px] leading-relaxed text-ink-2">
                {item.a}
              </p>
            </m.details>
          ))}
        </m.div>
      </div>
    </section>
  )
}
