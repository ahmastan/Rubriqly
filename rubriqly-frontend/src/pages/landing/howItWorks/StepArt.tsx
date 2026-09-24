import * as m from 'motion/react-m'
import { ArrowUp } from 'lucide-react'
import { useReducedMotion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'
import { ParagraphTag } from '../../../components/ParagraphTag'
import { cn } from '../../../lib/ui'

const EASE_OUT = [0.22, 1, 0.36, 1] as const

/**
 * A small decorative scene that plays once when it scrolls into view. Children use the
 * "hidden" and "show" variants; with reduced motion they start in their "show" state.
 */
function Scene({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion()
  return (
    <m.div
      aria-hidden="true"
      className={cn('relative h-40 overflow-hidden rounded-xl bg-bg', className)}
      initial={reduceMotion ? 'show' : 'hidden'}
      whileInView="show"
      viewport={{ once: true, amount: 0.6 }}
    >
      {children}
    </m.div>
  )
}

const RUBRICS = ['Lab report', 'Argumentative essay', 'Research paper']

/** Step 1: three rubric cards fan out; the middle one is picked and lifts forward. */
export function PickRubricArt() {
  const fan: Variants[] = [-1, 0, 1].map((side) => ({
    hidden: { x: 0, y: 8, rotate: 0 },
    show: {
      x: side * 70,
      y: side === 0 ? -8 : 6,
      rotate: side * 7,
      transition: { type: 'spring', stiffness: 160, damping: 18, delay: 0.15 },
    },
  }))
  return (
    <Scene className="flex items-center justify-center">
      {RUBRICS.map((title, i) => {
        const picked = i === 1
        return (
          <m.div
            key={title}
            variants={fan[i]}
            className={cn(
              'absolute flex w-32 flex-col gap-2 rounded-lg border bg-surface p-3',
              picked ? 'z-10 border-accent shadow-md' : 'border-border',
            )}
          >
            <span className="text-[11px] leading-tight font-semibold">{title}</span>
            {[0.9, 0.7, 0.8].map((w, j) => (
              <span
                key={j}
                className="h-1 rounded-full bg-border"
                style={{ width: `${w * 100}%` }}
              />
            ))}
            {picked && (
              <m.span
                className="mt-1 self-start rounded-full bg-accent-soft px-1.5 py-0.5 font-mono text-[9px] text-accent"
                variants={{
                  hidden: { opacity: 0, scale: 0.8 },
                  show: { opacity: 1, scale: 1, transition: { delay: 0.55 } },
                }}
              >
                Selected
              </m.span>
            )}
          </m.div>
        )
      })}
    </Scene>
  )
}

/** Step 2: lines of a draft fill the input box, then it's ready to check. */
export function AddDraftArt() {
  const lines = [0.95, 0.88, 0.92, 0.6, 0.9, 0.75]
  return (
    <Scene className="flex items-center justify-center p-5">
      <div className="flex w-full max-w-60 flex-col gap-2.5 rounded-xl border border-border bg-surface p-3.5">
        <div className="flex flex-col gap-1.5">
          {lines.map((w, i) => (
            <m.span
              key={i}
              className={cn('h-1.5 origin-left rounded-full bg-field-border', i === 3 && 'mb-1')}
              style={{ width: `${w * 100}%` }}
              variants={{
                hidden: { scaleX: 0 },
                show: {
                  scaleX: 1,
                  transition: { delay: 0.1 + i * 0.09, duration: 0.35, ease: EASE_OUT },
                },
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <m.span
            className="rounded-full bg-muted px-2 py-0.5 font-mono text-[9px] text-ink-2"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.8 } } }}
          >
            Draft 3 · added
          </m.span>
          <span className="grow" />
          <m.span
            className="flex size-6 items-center justify-center rounded-full bg-ink text-bg"
            variants={{
              hidden: { opacity: 0.3, scale: 0.85 },
              show: {
                opacity: 1,
                scale: 1,
                transition: { delay: 0.95, type: 'spring', stiffness: 400, damping: 18 },
              },
            }}
          >
            <ArrowUp size={12} strokeWidth={2.5} />
          </m.span>
        </div>
      </div>
    </Scene>
  )
}

/**
 * Step 3: feedback, then revision. "Analysis missing" pops up at level 2; a moment later the
 * tag turns into "Analysis" and the bar grows to level 3.
 */
export function ReviseArt() {
  const reduceMotion = useReducedMotion()
  const segment = (i: number): Variants => ({
    hidden: { scaleX: 0 },
    show: {
      scaleX: 1,
      // Segments 1–2 fill with the feedback; segment 3 fills after the revision.
      transition: { delay: i < 2 ? 0.2 + i * 0.15 : 1.9, duration: 0.35, ease: EASE_OUT },
    },
  })
  return (
    <Scene className="flex flex-col justify-center gap-4 px-6">
      <div className="flex flex-col gap-1.5">
        {[0.95, 0.9, 0.7].map((w, i) => (
          <span
            key={i}
            className="h-1.5 rounded-full bg-field-border"
            style={{ width: `${w * 100}%` }}
          />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="grid">
          {/* With reduced motion, skip straight to the revised state. */}
          {!reduceMotion && (
            <m.span
              className="col-start-1 row-start-1 inline-flex"
              variants={{
                hidden: { opacity: 0, y: 6 },
                show: {
                  opacity: [0, 1, 1, 0],
                  y: [6, 0, 0, 0],
                  transition: { duration: 1.9, times: [0, 0.15, 0.85, 1], delay: 0.45 },
                },
              }}
            >
              <ParagraphTag label="Analysis" present={false} />
            </m.span>
          )}
          <m.span
            className="col-start-1 row-start-1 inline-flex"
            variants={{
              hidden: { opacity: 0, scale: 0.9 },
              show: {
                opacity: 1,
                scale: 1,
                transition: { delay: 2.3, type: 'spring', stiffness: 420, damping: 22 },
              },
            }}
          >
            <ParagraphTag label="Analysis" present />
          </m.span>
        </span>
        <span className="grow" />
        <span className="flex w-24 gap-1">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-2 grow overflow-hidden rounded-[3px] bg-border">
              {i < 3 && (
                <m.span className="block h-full origin-left bg-accent" variants={segment(i)} />
              )}
            </span>
          ))}
        </span>
      </div>
    </Scene>
  )
}
