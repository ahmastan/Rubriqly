import { cn } from '../../../lib/ui'
import { demoSteps } from '../content'
import { container } from '../ui'
import { EssayMock } from './EssayMock'
import { ResultsMock } from './ResultsMock'
import { SinceMock } from './SinceMock'
import { StepList } from './StackedDemo'

/** Reduced-motion version: every step's text, and the demo in its finished state. */
export function StaticDemo() {
  return (
    <div
      data-demo="static"
      className={cn(container, 'grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)]')}
    >
      <StepList steps={demoSteps.map((_, i) => i)} />
      <figure className="m-0 flex flex-col gap-3">
        <div
          aria-hidden="true"
          className="grid gap-5 rounded-3xl border border-border bg-chrome p-4 sm:p-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
        >
          <EssayMock />
          <div className="flex flex-col gap-3">
            <ResultsMock />
            <SinceMock />
          </div>
        </div>
        <figcaption className="font-mono text-xs text-ink-2">
          Example: a made-up draft and made-up results.
        </figcaption>
      </figure>
    </div>
  )
}
