import * as m from 'motion/react-m'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { stagger, useReducedMotion, useScroll, useTransform, type Variants } from 'motion/react'
import { useRef } from 'react'
import { Link } from 'react-router'
import { buttonStyles, cn } from '../../../lib/ui'
import { hero } from '../content'
import { AnimatedLevelBar } from '../demo/AnimatedLevelBar'
import { EssayMock } from '../demo/EssayMock'
import { container, eyebrow } from '../ui'

/** A soft "ease out" curve: fast start, gentle landing. */
const EASE_OUT = [0.22, 1, 0.36, 1] as const

const textGroup: Variants = {
  hidden: {},
  show: { transition: { delayChildren: stagger(0.08) } },
}
const textItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
}
/**
 * The headline only rises; it never starts invisible. Browsers don't count invisible text as
 * painted, so fading it in would make the page score as slower to show its main content.
 */
const headlineItem: Variants = {
  hidden: { y: 18 },
  show: { y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
}

/*
 * Timeline (seconds after the page loads):
 * 0.0  eyebrow, headline, subheadline and buttons rise in one after another
 * 0.25 the essay page drops in and settles at a slight tilt (a spring, so it feels physical)
 * 0.9  paragraph tags pop in, paragraph by paragraph; then the weak paragraph is highlighted
 * 2.1  the level card slides in and its bar fills to 2 of 4
 * While scrolling past the hero, the page tilts flat and drifts up.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()

  // 0 when the hero's top is at the top of the screen, 1 when the hero has scrolled away.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const tilt = useTransform(scrollYProgress, [0, 0.6], [1.5, 0])
  const lift = useTransform(scrollYProgress, [0, 1], [0, -80])

  const initial = reduceMotion ? false : 'hidden'

  return (
    <section ref={sectionRef} aria-labelledby="hero-heading" className="relative overflow-hidden">
      {/* A faint measuring grid, like an instrument panel. Decorative only. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.04)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black_40%,transparent)]"
      />
      <div
        className={cn(
          container,
          'relative grid items-center gap-14 pt-20 pb-24 lg:grid-cols-[1.1fr_0.9fr] lg:pt-28 lg:pb-32',
        )}
      >
        <m.div
          className="flex flex-col items-start gap-7"
          variants={textGroup}
          initial={initial}
          animate="show"
        >
          <m.p variants={textItem} className={cn(eyebrow, 'm-0')}>
            {hero.eyebrow}
          </m.p>
          <m.h1
            variants={headlineItem}
            id="hero-heading"
            className="m-0 text-5xl leading-[0.98] font-semibold tracking-[-0.045em] sm:text-7xl"
          >
            {hero.headline}
          </m.h1>
          <m.p variants={textItem} className="m-0 max-w-xl text-lg leading-relaxed text-ink-soft">
            {hero.subheadline}
          </m.p>
          <m.div variants={textItem} className="flex flex-wrap gap-3">
            <Link
              to={hero.primaryCta.to}
              className={cn(buttonStyles.primary, 'h-12 px-6 text-[15px]')}
            >
              {hero.primaryCta.label}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <a
              href={hero.secondaryCta.href}
              className={cn(buttonStyles.secondary, 'h-12 px-5 text-[15px]')}
            >
              {hero.secondaryCta.label}
              <ArrowDown size={16} aria-hidden="true" />
            </a>
          </m.div>
        </m.div>

        {/* Outer layer follows the scroll; inner layer plays the entrance. Decorative only. */}
        <m.div
          aria-hidden="true"
          className="relative"
          style={reduceMotion ? { rotate: 1.5 } : { rotate: tilt, y: lift }}
        >
          <m.div
            initial={reduceMotion ? false : { opacity: 0, y: 56, rotate: 4 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 70, damping: 16 }}
          >
            <EssayMock paragraphs={3} revealDelay={0.9} />
          </m.div>
          <m.div
            className="absolute -bottom-6 -left-4 flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-lg sm:-left-8"
            initial={reduceMotion ? false : { opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.1, duration: 0.6, ease: EASE_OUT }}
          >
            <span className="text-sm font-medium">Analysis</span>
            <AnimatedLevelBar level={2} label="Analysis" delay={2.4} className="w-24" />
            <span className="font-mono text-xs text-ink-2">2 of 4</span>
          </m.div>
        </m.div>
      </div>
    </section>
  )
}
