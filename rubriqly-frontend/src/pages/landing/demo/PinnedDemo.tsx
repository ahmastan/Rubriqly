import * as m from 'motion/react-m'
import {
  AnimatePresence,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { LogoMark } from '../../../components/Logo'
import { ParagraphTag } from '../../../components/ParagraphTag'
import { countWords } from '../../../lib/text'
import { cn } from '../../../lib/ui'
import { demoDraft, demoFrame, demoResults, demoSteps } from '../content'
import { ScrollGrow, ScrollLevelBar, ScrollReveal } from './ScrollParts'
import { STEPS, stepAt, stepRange } from './steps'

const SHADES = ['bg-accent-pale', 'bg-accent-mid', 'bg-accent']
const WORDS = countWords(demoDraft.paragraphs.map((p) => p.text).join(' '))

/** Which part of the app each step is about. That part stays bright; the rest dims. */
const SPOTLIGHT: Record<'essay' | 'rubric' | 'score' | 'since', number[]> = {
  essay: [0, 2, 4],
  rubric: [1, 3],
  score: [3],
  since: [5],
}

/**
 * Desktop version: a tall section whose inner frame is "sticky", so it stays on screen while
 * you scroll through it. How far you've scrolled (0 to 1) drives six steps:
 * 1 the draft is pasted, 2 the rubric is picked, 3 a scan line tags each paragraph,
 * 4 level bars fill (one turns amber), 5 the weak paragraph gets the rubric's tip,
 * 6 the change since the last draft.
 */
export function PinnedDemo() {
  const ref = useRef<HTMLDivElement>(null)
  // 0 when the section's top reaches the top of the screen, 1 when its bottom reaches the bottom.
  const { scrollYProgress: progress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })
  const [step, setStep] = useState(0)
  // Only re-render when the step number changes, not on every scrolled pixel.
  useMotionValueEvent(progress, 'change', (value) => setStep(stepAt(value)))

  return (
    <div ref={ref} data-demo="pinned" className="relative h-[600vh]">
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] items-center py-6">
        <div className="mx-auto grid w-full max-w-[1480px] grid-cols-[minmax(260px,330px)_minmax(0,1fr)] items-center gap-12 px-8">
          <StepCaption step={step} progress={progress} />
          <figure className="m-0 flex min-w-0 flex-col gap-2.5">
            <AppFrame step={step} progress={progress} />
            <figcaption className="font-mono text-xs text-ink-2">
              Example: a made-up draft and made-up results.
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  )
}

/** One big caption for the current step, plus a six-part progress bar. */
function StepCaption({ step, progress }: { step: number; progress: MotionValue<number> }) {
  const current = demoSteps[step]
  return (
    <div className="flex flex-col gap-8">
      {/* Screen readers get every step as a list; the big caption below is visual. */}
      <ol className="sr-only">
        {demoSteps.map((s, i) => (
          <li key={s.n} aria-current={i === step ? 'step' : undefined}>
            {s.title}. {s.body}
          </li>
        ))}
      </ol>
      <div aria-hidden="true" className="relative min-h-[260px]">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={step}
            className="flex flex-col gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="font-mono text-6xl font-medium tracking-[-0.04em] text-accent">
              {current.n}
            </span>
            <span className="text-3xl leading-tight font-semibold tracking-[-0.03em]">
              {current.title}
            </span>
            <span className="text-lg leading-relaxed text-ink-soft">{current.body}</span>
          </m.div>
        </AnimatePresence>
      </div>
      <div aria-hidden="true" className="flex gap-1.5">
        {Array.from({ length: STEPS }, (_, i) => (
          <StepSegment key={i} index={i} progress={progress} />
        ))}
      </div>
    </div>
  )
}

function StepSegment({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const scaleX = useTransform(progress, [index / STEPS, (index + 1) / STEPS], [0, 1])
  return (
    <span className="h-1 grow overflow-hidden rounded-full bg-border">
      <m.span className="block h-full origin-left bg-accent" style={{ scaleX }} />
    </span>
  )
}

/** Dims a part of the app when the current step isn't about it. */
function Spot({
  area,
  step,
  className,
  children,
}: {
  area: keyof typeof SPOTLIGHT
  step: number
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'transition-opacity duration-500',
        SPOTLIGHT[area].includes(step) ? 'opacity-100' : 'opacity-30',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** The demo, framed like the real app: its top bar and breadcrumb, then draft and results. */
function AppFrame({ step, progress }: { step: number; progress: MotionValue<number> }) {
  return (
    <div
      aria-hidden="true"
      className="flex max-h-[calc(100vh-9rem)] flex-col overflow-hidden rounded-3xl border border-border bg-chrome shadow-[0_40px_120px_-40px_rgb(0_0_0/0.8)]"
    >
      <div className="flex items-center gap-3 border-b border-border px-5 py-3">
        <LogoMark />
        <span className="text-sm font-semibold">Rubriqly</span>
        <span className="text-sm text-ink-2">
          / {demoFrame.assignment} / <span className="text-ink">{demoFrame.draft}</span>
        </span>
        <span className="grow" />
        <span className="rounded-full bg-muted px-2.5 py-1 font-mono text-[11px] text-ink-2">
          Example
        </span>
      </div>
      <div className="grid min-h-0 grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-6 p-6">
        <Spot area="essay" step={step}>
          <PinnedEssay progress={progress} />
        </Spot>
        <div className="flex min-w-0 flex-col gap-4">
          <Spot area="rubric" step={step}>
            <RubricPanel progress={progress} />
          </Spot>
          <Spot area="score" step={step}>
            <ScoreCard progress={progress} />
          </Spot>
          <Spot area="since" step={step}>
            <SinceCard progress={progress} />
          </Spot>
        </div>
      </div>
    </div>
  )
}

function PinnedEssay({ progress }: { progress: MotionValue<number> }) {
  const paragraphs = demoDraft.paragraphs
  const [scanStart, scanEnd] = stepRange(2, 0, 0.85)
  const scanY = useTransform(progress, [scanStart, scanEnd], ['0%', '100%'])
  const scanOpacity = useTransform(
    progress,
    [scanStart, scanStart + 0.01, scanEnd - 0.01, scanEnd],
    [0, 1, 1, 0],
  )

  return (
    <div className="theme-light flex h-full flex-col gap-4 rounded-2xl border border-border bg-surface p-7 text-ink">
      <div className="flex items-start gap-4">
        <p className="m-0 grow font-serif text-[clamp(20px,2.6vh,28px)] leading-tight font-medium tracking-[-0.01em]">
          {demoDraft.title}
        </p>
        <ScrollReveal
          progress={progress}
          range={stepRange(0, 0.6, 0.8)}
          y={0}
          className="shrink-0 rounded-full bg-muted px-2.5 py-1 font-mono text-xs text-ink-2"
        >
          Pasted · {WORDS} words
        </ScrollReveal>
      </div>
      <ol className="relative m-0 flex list-none flex-col gap-2 p-0">
        {/* The scan line: a full-height layer moved down by its own height, line at its top. */}
        <m.span
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-full"
          style={{ y: scanY, opacity: scanOpacity }}
        >
          <span className="block h-0.5 rounded-full bg-accent" />
          <span className="block h-10 bg-accent/10" />
        </m.span>
        {paragraphs.map((p, k) => {
          // When the scan line passes this paragraph (roughly), its tags appear.
          const at = (0.85 * (k + 0.55)) / paragraphs.length
          return (
            <ScrollReveal
              key={k}
              progress={progress}
              range={stepRange(0, k * 0.14, k * 0.14 + 0.25)}
              className="relative isolate -mx-3 flex gap-3 rounded-xl px-3 py-2.5"
            >
              {p.weak && (
                <>
                  <ScrollReveal
                    progress={progress}
                    range={stepRange(4, 0, 0.3)}
                    y={0}
                    className="absolute inset-0 -z-10 rounded-xl bg-highlight ring-1 ring-warn-ring/40"
                  >
                    {null}
                  </ScrollReveal>
                  <TipCallout progress={progress} />
                </>
              )}
              <span className="w-6 shrink-0 pt-1 font-mono text-xs text-ink-2">¶{k + 1}</span>
              <div className="flex flex-col gap-2">
                <p className="m-0 font-serif text-[clamp(14px,1.9vh,17px)] leading-[1.6] text-ink-body">
                  {p.text}
                </p>
                <ScrollReveal
                  progress={progress}
                  range={stepRange(2, at, at + 0.08)}
                  y={4}
                  className="flex flex-wrap gap-1.5"
                >
                  {p.tags.map((t) => (
                    <ParagraphTag key={t.label} label={t.label} present={t.present} />
                  ))}
                </ScrollReveal>
              </div>
            </ScrollReveal>
          )
        })}
      </ol>
    </div>
  )
}

function TipCallout({ progress }: { progress: MotionValue<number> }) {
  const tip = demoResults.criteria.find((c) => c.tip)
  return (
    <ScrollReveal
      progress={progress}
      range={stepRange(4, 0.25, 0.55)}
      y={12}
      className="absolute top-[78%] right-3 z-10 w-72 rounded-xl border border-accent/30 bg-surface p-4 shadow-xl"
    >
      <p className="m-0 font-mono text-[11px] text-accent">From the rubric · {tip?.name}</p>
      <p className="m-0 mt-1.5 text-sm leading-snug text-ink-body">{tip?.tip}</p>
    </ScrollReveal>
  )
}

function ScoreCard({ progress }: { progress: MotionValue<number> }) {
  const { after } = demoResults
  return (
    <ScrollReveal progress={progress} range={stepRange(3, 0.55, 0.85)}>
      <div className="flex flex-col gap-1 rounded-2xl bg-feature px-5 py-4 text-white">
        <span className="text-xs text-feature-ink-2">Estimated level · {demoResults.rubric}</span>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-semibold tracking-[-0.03em]">{after.level} of 4</span>
          <span className="text-base font-medium">{after.levelName}</span>
        </div>
        <span className="text-xs text-feature-ink-2">
          An estimate to guide revision, not a grade.
        </span>
      </div>
    </ScrollReveal>
  )
}

function RubricPanel({ progress }: { progress: MotionValue<number> }) {
  const { criteria, levels } = demoResults
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface">
      <ScrollReveal
        progress={progress}
        range={stepRange(1, 0, 0.2)}
        y={0}
        className="flex items-center gap-2 border-b border-divider px-4 py-3"
      >
        <span className="text-xs text-ink-2">Rubric</span>
        <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[13px] font-medium">
          {demoResults.rubric}
          <ChevronDown size={13} className="text-ink-2" />
        </span>
      </ScrollReveal>
      {criteria.map((c, k) => {
        const barRange = stepRange(3, k * 0.08, k * 0.08 + 0.3)
        return (
          <ScrollReveal
            key={c.name}
            progress={progress}
            range={stepRange(1, 0.15 + k * 0.1, 0.45 + k * 0.1)}
            x={28}
            y={0}
            className={cn('flex flex-col gap-1.5 px-4 py-2.5', k > 0 && 'border-t border-divider')}
          >
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-medium">{c.name}</span>
              <span className="truncate text-xs text-ink-2">{c.desc}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <ScrollLevelBar
                progress={progress}
                range={barRange}
                level={c.level}
                className="w-24"
              />
              <ScrollReveal
                progress={progress}
                range={[barRange[1] - 0.01, barRange[1]]}
                y={0}
                className="text-[13px] text-ink-soft"
              >
                {levels[c.level - 1]}
              </ScrollReveal>
              <span className="grow" />
              <ConfidenceSwap
                progress={progress}
                value={c.confidence}
                low={Boolean(c.lowConfidence)}
                appear={[barRange[1] - 0.01, barRange[1]]}
              />
            </div>
          </ScrollReveal>
        )
      })}
    </div>
  )
}

function SinceCard({ progress }: { progress: MotionValue<number> }) {
  const { after, before, history } = demoResults
  return (
    <ScrollReveal
      progress={progress}
      range={stepRange(5, 0, 0.35)}
      className="flex items-end gap-4 rounded-2xl border border-border bg-surface px-5 py-4"
    >
      <div className="flex grow flex-col">
        <span className="text-xs text-ink-2">
          {before.draft} → {after.draft}
        </span>
        <span className="text-3xl font-semibold tracking-[-0.02em] text-accent">
          {after.change}
        </span>
      </div>
      <div className="flex h-10 items-end gap-1.5">
        {history.map((value, i) => (
          <ScrollGrow
            key={i}
            progress={progress}
            range={stepRange(5, 0.2 + i * 0.12, 0.35 + i * 0.12)}
            className={cn('w-6 rounded', SHADES[i])}
            height={(value / 4) * 40}
          />
        ))}
      </div>
    </ScrollReveal>
  )
}

/**
 * The confidence pill fades in once the bar is full. The low-confidence one then turns amber:
 * two pills stacked in one spot, crossfading.
 */
function ConfidenceSwap({
  progress,
  value,
  low,
  appear,
}: {
  progress: MotionValue<number>
  value: number
  low: boolean
  appear: [number, number]
}) {
  const shown = useTransform(progress, appear, [0, 1])
  const turn = stepRange(3, 0.7, 0.85)
  const neutral = useTransform(
    progress,
    low ? [appear[0], appear[1], turn[0], turn[1]] : appear,
    low ? [0, 1, 1, 0] : [0, 1],
  )
  const amber = useTransform(progress, turn, [0, 1])
  const pill =
    'col-start-1 row-start-1 rounded-full px-2 py-[3px] font-mono text-[11px] whitespace-nowrap'
  return (
    <m.span className="grid justify-items-end" style={{ opacity: shown }}>
      <m.span className={cn(pill, 'bg-muted text-ink-soft')} style={{ opacity: neutral }}>
        conf {value.toFixed(2)}
      </m.span>
      {low && (
        <m.span className={cn(pill, 'bg-warn-bg text-warn')} style={{ opacity: amber }}>
          conf {value.toFixed(2)} · check yourself
        </m.span>
      )}
    </m.span>
  )
}
