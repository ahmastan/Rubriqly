import { useInView } from 'motion/react'
import { useRef, type ReactNode } from 'react'
import { cn } from '../../../lib/ui'
import { demoSteps } from '../content'
import { container } from '../ui'
import { EssayMock } from './EssayMock'
import { ResultsMock } from './ResultsMock'
import { SinceMock } from './SinceMock'

/**
 * Phone and tablet version: no pinning (too cramped). The steps stack, and each group's
 * picture animates once when it scrolls into view.
 */
export function StackedDemo() {
  return (
    <div data-demo="stacked" className={cn(container, 'flex flex-col gap-16')}>
      <Group steps={[0, 1, 2]}>{(play) => <EssayMock revealDelay={0.2} play={play} />}</Group>
      <Group steps={[3, 4]}>{(play) => <ResultsMock play={play} />}</Group>
      <Group steps={[5]}>{(play) => <SinceMock play={play} className="max-w-xs" />}</Group>
      <p className="m-0 font-mono text-xs text-ink-2">
        Example: a made-up draft and made-up results.
      </p>
    </div>
  )
}

function Group({ steps, children }: { steps: number[]; children: (play: boolean) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  // True once 40% of the picture has scrolled into view, and stays true.
  const inView = useInView(ref, { once: true, amount: 0.4 })
  return (
    <div className="flex flex-col gap-6">
      <StepList steps={steps} />
      <div ref={ref} aria-hidden="true">
        {children(inView)}
      </div>
    </div>
  )
}

/** Step captions as plain text: also the demo's meaning for screen readers. */
export function StepList({ steps, className }: { steps: number[]; className?: string }) {
  return (
    <ol start={steps[0] + 1} className={cn('m-0 flex list-none flex-col gap-5 p-0', className)}>
      {steps.map((i) => {
        const step = demoSteps[i]
        return (
          <li key={step.n} className="flex flex-col gap-1.5 border-l border-border pl-4">
            <span className="font-mono text-xs text-accent">{step.n}</span>
            <span className="text-base font-medium">{step.title}</span>
            <span className="text-sm leading-normal text-ink-2">{step.body}</span>
          </li>
        )
      })}
    </ol>
  )
}
