import * as m from 'motion/react-m'
import { ArrowRight, Check, Plus } from 'lucide-react'
import { useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useLenis } from 'lenis/react'
import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { cn } from '../../../lib/ui'
import { rubricLibrary } from '../content'
import { container, eyebrow, h2 } from '../ui'

type LibraryRubric = (typeof rubricLibrary.rubrics)[number]
const CARD_COUNT = rubricLibrary.rubrics.length + 1

/**
 * Desktop: the section pins and the row of rubric cards glides sideways as you scroll down,
 * like flipping through the library. Phones and reduced motion: a normal swipeable row.
 */
export function RubricLibrary() {
  const reduceMotion = useReducedMotion()
  return (
    <section
      id="rubrics"
      aria-label="Rubric library"
      className="scroll-mt-16 py-24 sm:py-32 lg:py-0"
    >
      {reduceMotion ? (
        <SwipeLibrary />
      ) : (
        <>
          <div className="hidden lg:block">
            <PinnedLibrary />
          </div>
          <div className="lg:hidden">
            <SwipeLibrary />
          </div>
        </>
      )}
    </section>
  )
}

function Heading() {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <p className={cn(eyebrow, 'm-0')}>Rubric library</p>
      <h2 className={h2}>{rubricLibrary.heading}</h2>
      <p className="m-0 text-lg leading-relaxed text-ink-soft">{rubricLibrary.body}</p>
    </div>
  )
}

/** Share of the scroll spent holding still at each end, so the first and last cards can be read. */
const HOLD = 0.1

function PinnedLibrary() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const distanceRef = useRef(0)
  const [distance, setDistance] = useState(0)
  const [index, setIndex] = useState(0)
  const lenis = useLenis()

  // How far the row must travel: its full width minus what fits on screen.
  useLayoutEffect(() => {
    const measure = () => {
      const track = trackRef.current
      const viewport = viewportRef.current
      if (!track || !viewport) return
      const next = Math.max(0, track.scrollWidth - viewport.clientWidth)
      distanceRef.current = next
      setDistance(next)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const { scrollYProgress: progress } = useScroll({
    target: wrapperRef,
    offset: ['start start', 'end end'],
  })
  const travel = (v: number) => Math.min(1, Math.max(0, (v - HOLD) / (1 - 2 * HOLD)))
  const x = useTransform(progress, (v) => -distanceRef.current * travel(v))
  const bar = useTransform(progress, travel)
  useMotionValueEvent(progress, 'change', (v) => setIndex(Math.round(travel(v) * (CARD_COUNT - 1))))

  // Tabbing onto a card that's off to the side scrolls the page so that card slides into view.
  const onFocusCard = (i: number) => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    viewportRef.current?.scrollTo({ left: 0 })
    const scrollable = wrapper.offsetHeight - window.innerHeight
    const at = HOLD + (1 - 2 * HOLD) * (i / (CARD_COUNT - 1))
    const top = wrapper.getBoundingClientRect().top + window.scrollY + scrollable * at
    // Go through smooth scrolling when it's on, so the two don't fight.
    if (lenis) lenis.scrollTo(top)
    else window.scrollTo({ top })
  }

  return (
    // Tall enough that scrolling down moves the row about the same distance sideways.
    <div
      ref={wrapperRef}
      data-library="pinned"
      className="relative"
      style={{ height: `calc(100vh + ${Math.round(distance * 1.3)}px + 30vh)` }}
    >
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col justify-center gap-10 overflow-hidden py-10">
        <div className={cn(container, 'flex items-end justify-between gap-10')}>
          <Heading />
          <div aria-hidden="true" className="flex w-48 shrink-0 flex-col gap-2.5 pb-2">
            <span className="font-mono text-sm text-ink-2">
              <span className="text-ink">{String(index + 1).padStart(2, '0')}</span> /{' '}
              {String(CARD_COUNT).padStart(2, '0')}
            </span>
            <span className="h-1 overflow-hidden rounded-full bg-border">
              <m.span className="block h-full origin-left bg-accent" style={{ scaleX: bar }} />
            </span>
          </div>
        </div>
        <div ref={viewportRef} className="overflow-hidden">
          <m.ul
            ref={trackRef}
            style={{ x }}
            className="m-0 flex w-max list-none gap-5 py-2 pr-[max(2rem,calc((100vw-72rem)/2+2rem))] pl-[max(2rem,calc((100vw-72rem)/2+2rem))]"
          >
            {rubricLibrary.rubrics.map((r, i) => (
              <li key={r.id} className="flex w-[440px] shrink-0" onFocus={() => onFocusCard(i)}>
                <RubricCard rubric={r} />
              </li>
            ))}
            <li className="flex w-[440px] shrink-0" onFocus={() => onFocusCard(CARD_COUNT - 1)}>
              <BuildCard />
            </li>
          </m.ul>
        </div>
      </div>
    </div>
  )
}

function SwipeLibrary() {
  return (
    <div data-library="swipe" className="flex flex-col gap-12">
      <div className={container}>
        <Heading />
      </div>
      <ul
        className={cn(container, 'flex list-none snap-x snap-mandatory gap-4 overflow-x-auto pb-4')}
      >
        {rubricLibrary.rubrics.map((r) => (
          <li key={r.id} className="flex w-[min(85vw,400px)] shrink-0 snap-start">
            <RubricCard rubric={r} />
          </li>
        ))}
        <li className="flex w-[min(85vw,400px)] shrink-0 snap-start">
          <BuildCard />
        </li>
      </ul>
    </div>
  )
}

/** A preview of what the rubric actually checks, so the card is worth reading. */
function RubricCard({ rubric }: { rubric: LibraryRubric }) {
  const range = rubric.wordCount
  return (
    <Link
      to={rubric.to}
      className="flex w-full flex-col gap-5 rounded-3xl border border-border bg-surface p-7 text-ink no-underline transition-colors hover:border-field-border hover:text-ink"
    >
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs text-ink-2">
          Built-in · {rubric.criteria.length} criteria · {rubric.levels.length} levels
        </span>
        <span className="text-2xl font-semibold tracking-[-0.02em]">{rubric.title}</span>
        <span className="text-[15px] leading-relaxed text-ink-soft">{rubric.purpose}</span>
      </div>

      <ul className="m-0 flex list-none flex-col gap-1.5 border-t border-divider p-0 pt-4">
        {rubric.criteria.map((c) => (
          <li key={c.name} className="flex gap-2 text-sm leading-snug">
            <span
              className="mt-[7px] size-1.5 shrink-0 rounded-full bg-accent"
              aria-hidden="true"
            />
            <span>
              <span className="font-medium">{c.name}</span>{' '}
              <span className="text-ink-2">{c.desc}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 border-t border-divider pt-4 text-[13px] text-ink-2">
        <span className="font-mono text-xs">
          {rubric.levels[0]} → {rubric.levels[rubric.levels.length - 1]}
        </span>
        {rubric.checklist.map((item) => (
          <span key={item} className="flex items-center gap-2">
            <Check
              size={13}
              strokeWidth={2.5}
              className="shrink-0 text-accent"
              aria-hidden="true"
            />
            {item}
          </span>
        ))}
        {range && (
          <span className="flex items-center gap-2">
            <Check
              size={13}
              strokeWidth={2.5}
              className="shrink-0 text-accent"
              aria-hidden="true"
            />
            {range.min ?? 0}–{range.max} words
          </span>
        )}
      </div>

      <span className="mt-auto flex items-center gap-1.5 text-sm font-medium text-accent">
        Use this rubric <ArrowRight size={15} aria-hidden="true" />
      </span>
    </Link>
  )
}

function BuildCard() {
  const card = rubricLibrary.buildYourOwn
  return (
    <Link
      to={card.to}
      className="flex w-full flex-col gap-5 rounded-3xl border border-dashed border-field-border bg-transparent p-7 text-ink no-underline transition-colors hover:bg-surface hover:text-ink"
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-accent-2-soft text-accent-2">
        <Plus size={20} aria-hidden="true" />
      </span>
      <span className="text-2xl font-semibold tracking-[-0.02em]">{card.title}</span>
      <span className="text-[15px] leading-relaxed text-ink-soft">{card.body}</span>
      <span className="mt-auto flex items-center gap-1.5 text-sm font-medium text-accent-2">
        Open the builder <ArrowRight size={15} aria-hidden="true" />
      </span>
    </Link>
  )
}
