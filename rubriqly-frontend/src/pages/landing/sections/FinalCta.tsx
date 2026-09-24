import * as m from 'motion/react-m'
import { ArrowRight } from 'lucide-react'
import { type Variants } from 'motion/react'
import { Link } from 'react-router'
import { buttonStyles, cn } from '../../../lib/ui'
import { finalCta } from '../content'
import { EASE_OUT, fadeUp, staggered, useRevealOnScroll } from '../reveal'
import { container } from '../ui'

/** Each word rises from behind an invisible edge (its parent clips anything below it). */
const riseWord: Variants = {
  hidden: { y: '110%' },
  show: { y: '0%', transition: { duration: 0.8, ease: EASE_OUT } },
}

export function FinalCta() {
  const reveal = useRevealOnScroll(0.5)
  const words = finalCta.headline.split(' ')
  return (
    <section
      aria-labelledby="final-heading"
      className="border-t border-border bg-chrome py-28 sm:py-36"
    >
      <m.div
        {...reveal}
        variants={staggered(0.06)}
        className={cn(container, 'flex flex-col items-center gap-8 text-center')}
      >
        <h2
          id="final-heading"
          className="m-0 max-w-4xl text-5xl leading-[1.02] font-semibold tracking-[-0.045em] sm:text-7xl"
        >
          {/* Screen readers read the headline whole; the separate words are visual only. */}
          <span className="sr-only">{finalCta.headline}</span>
          <span aria-hidden="true">
            {words.map((word, i) => (
              <span key={i}>
                <span className="inline-block overflow-hidden pb-[0.1em] align-bottom">
                  <m.span variants={riseWord} className="inline-block">
                    {word}
                  </m.span>
                </span>{' '}
              </span>
            ))}
          </span>
        </h2>
        <m.div variants={fadeUp}>
          <Link to={finalCta.cta.to} className={cn(buttonStyles.primary, 'h-12 px-7 text-[15px]')}>
            {finalCta.cta.label}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </m.div>
      </m.div>
    </section>
  )
}
