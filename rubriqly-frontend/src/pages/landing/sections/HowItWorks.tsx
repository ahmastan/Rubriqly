import * as m from 'motion/react-m'
import { stagger, useReducedMotion } from 'motion/react'
import { cn } from '../../../lib/ui'
import { howItWorks } from '../content'
import { AddDraftArt, PickRubricArt, ReviseArt } from '../howItWorks/StepArt'
import { container, eyebrow, h2, sectionPad } from '../ui'

const ART = [PickRubricArt, AddDraftArt, ReviseArt]

/** A paper-colored band. Each step's little scene plays once as it scrolls into view. */
export function HowItWorks() {
  const reduceMotion = useReducedMotion()
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className={cn(sectionPad, 'theme-light bg-bg text-ink')}
    >
      <div className={cn(container, 'flex flex-col gap-14')}>
        <div className="flex flex-col gap-4">
          <p className={cn(eyebrow, 'm-0')}>How it works</p>
          <h2 id="how-heading" className={h2}>
            {howItWorks.heading}
          </h2>
        </div>
        <m.ol
          className="m-0 grid list-none gap-5 p-0 md:grid-cols-3"
          initial={reduceMotion ? 'show' : 'hidden'}
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={{ hidden: {}, show: { transition: { delayChildren: stagger(0.12) } } }}
        >
          {howItWorks.steps.map((step, i) => {
            const Art = ART[i]
            return (
              <m.li
                key={step.n}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
                className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5"
              >
                <Art />
                <div className="flex flex-col gap-2 px-1 pb-1">
                  <span className="font-mono text-xs text-accent">Step {step.n}</span>
                  <h3 className="m-0 text-xl font-semibold tracking-[-0.02em]">{step.title}</h3>
                  <p className="m-0 text-[15px] leading-relaxed text-ink-2">{step.body}</p>
                </div>
              </m.li>
            )
          })}
        </m.ol>
      </div>
    </section>
  )
}
