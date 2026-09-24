import { ConfidencePill } from '../../../components/ConfidencePill'
import { LevelBar } from '../../../components/LevelBar'
import { AnimatedLevelBar } from './AnimatedLevelBar'
import { cn } from '../../../lib/ui'
import { demoResults } from '../content'

/** The results side of the app with made-up scores, using the app's real level bars and pills. */
export function ResultsMock({
  play,
  className,
}: {
  /** When set, the level bars fill in turn once it's true (false keeps them empty). */
  play?: boolean
  className?: string
}) {
  const { after } = demoResults
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-col gap-1.5 rounded-2xl bg-feature px-5 py-4 text-white">
        <span className="text-xs text-feature-ink-2">
          Estimated level · {demoResults.rubric} · {after.draft}
        </span>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-semibold tracking-[-0.03em]">{after.level} of 4</span>
          <span className="text-base font-medium">{after.levelName}</span>
          <span className="ml-auto font-mono text-sm text-feature-ink-2">{after.change}</span>
        </div>
        <span className="text-xs text-feature-ink-2">
          An estimate to guide revision, not a grade.
        </span>
      </div>
      <ul className="m-0 flex list-none flex-col rounded-2xl border border-border bg-surface p-0">
        {demoResults.criteria.map((c, i) => (
          <li
            key={c.name}
            className={cn('flex flex-col gap-2 px-4 py-3', i > 0 && 'border-t border-divider')}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="w-24 text-sm font-medium">{c.name}</span>
              {play === undefined ? (
                <LevelBar level={c.level} count={4} label={c.name} className="w-28" />
              ) : (
                <AnimatedLevelBar
                  level={c.level}
                  label={c.name}
                  play={play}
                  delay={i * 0.18}
                  className="w-28"
                />
              )}
              <span className="text-[13px] text-ink-2">{demoResults.levels[c.level - 1]}</span>
              <span className="grow" />
              <ConfidencePill value={c.confidence} />
            </div>
            {c.tip && (
              <p className="m-0 rounded-lg bg-bg px-3 py-2 text-xs leading-normal text-ink-soft">
                <strong className="font-semibold">From the rubric:</strong> {c.tip}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
