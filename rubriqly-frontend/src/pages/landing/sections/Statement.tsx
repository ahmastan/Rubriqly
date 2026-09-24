import * as m from 'motion/react-m'
import { useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef } from 'react'
import { cn } from '../../../lib/ui'
import { statement } from '../content'
import { container, sectionPad } from '../ui'

const WORDS = statement.text.split(' ')

/**
 * The key promise, revealed word by word as you scroll: each word goes from faint to full ink
 * in turn, so the sentence "writes itself" only as you read it.
 */
export function Statement() {
  const ref = useRef<HTMLParagraphElement>(null)
  const reduceMotion = useReducedMotion()
  // 0 when the sentence's top is 85% down the screen, 1 when its bottom is 55% down.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.55'] })

  return (
    <section aria-label="Rubriqly can't write for you" className={cn(sectionPad, 'bg-chrome')}>
      <div className={cn(container, 'flex max-w-5xl flex-col gap-10')}>
        <p
          ref={ref}
          className="m-0 text-4xl leading-[1.1] font-semibold tracking-[-0.035em] sm:text-6xl"
        >
          {/* Screen readers read the sentence whole; the separate words are visual only. */}
          <span className="sr-only">{statement.text}</span>
          <span aria-hidden="true">
            {WORDS.map((word, i) =>
              reduceMotion ? (
                <span key={i}>{word} </span>
              ) : (
                <Word key={i} progress={scrollYProgress} index={i}>
                  {word}
                </Word>
              ),
            )}
          </span>
        </p>
        <m.p
          className="m-0 max-w-2xl text-lg leading-relaxed text-ink-soft"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {statement.teachers}
        </m.p>
      </div>
    </section>
  )
}

function Word({
  progress,
  index,
  children,
}: {
  progress: MotionValue<number>
  index: number
  children: string
}) {
  // Each word owns a slice of the scroll; slices overlap a little so the reveal flows.
  const start = index / WORDS.length
  const end = Math.min(1, start + 2 / WORDS.length)
  const opacity = useTransform(progress, [start, end], [0.15, 1])
  return (
    <>
      <m.span style={{ opacity }}>{children}</m.span>{' '}
    </>
  )
}
