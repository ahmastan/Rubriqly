import { useQuery } from '@tanstack/react-query'
import { Check, RotateCw, X } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { ConfidencePill } from '../components/ConfidencePill'
import { LevelBar } from '../components/LevelBar'
import { ParagraphTag, TagDot } from '../components/ParagraphTag'
import { getCheck } from '../lib/api'
import { timeAgo } from '../lib/text'
import type { CheckResult, CheckView } from '../lib/types'
import { buttonStyles, cn, pageBar, sectionLabel } from '../lib/ui'

export function ResultsPage() {
  const { checkId = '' } = useParams()
  const query = useQuery({ queryKey: ['check', checkId], queryFn: () => getCheck(checkId) })

  if (query.isPending) {
    return (
      <Shell>
        <p className="p-10 text-sm text-ink-2" role="status">
          Loading results…
        </p>
      </Shell>
    )
  }
  if (query.isError) {
    return (
      <Shell>
        <div className="flex flex-col items-start gap-4 p-10">
          <h1 className="m-0 text-xl font-semibold">We couldn’t open this check</h1>
          <p className="m-0 text-sm text-ink-2">{query.error.message}</p>
          <Link to="/check/new" className={buttonStyles.primary}>
            Start a new check
          </Link>
        </div>
      </Shell>
    )
  }

  const { check, assignment, draft, previous, history } = query.data
  return (
    <Shell view={query.data}>
      <div className="flex min-h-0 grow flex-col lg:flex-row">
        <DraftColumn check={check} />
        <section
          aria-label="Results"
          className="flex min-w-0 grow flex-col gap-[18px] px-4 py-6 sm:px-8 lg:py-7"
        >
          <div className="flex flex-col gap-3.5 sm:flex-row">
            <OverallCard check={check} />
            {previous && (
              <SinceCard
                change={check.overall.value - previous.check.overall.value}
                previousNumber={previous.draft.versionNumber}
                history={history}
                levelCount={check.overall.levelCount}
              />
            )}
          </div>
          <CriteriaCard check={check} />
          <ChecklistCard check={check} />
          <p className="m-0 text-xs leading-normal text-ink-2">
            {assignment.name} · draft {draft.versionNumber} · scored with {check.rubricTitle} v
            {check.rubricVersion}
          </p>
        </section>
      </div>
    </Shell>
  )
}

function Shell({ view, children }: { view?: CheckView; children: React.ReactNode }) {
  return (
    <div className="flex grow flex-col">
      <div className={pageBar}>
        {view && (
          <nav aria-label="Breadcrumb" className="min-w-0 text-sm text-ink-2">
            <ol className="m-0 flex list-none items-center gap-2 p-0">
              {view.assignment.course && (
                <>
                  <li>{view.assignment.course}</li>
                  <li aria-hidden="true">/</li>
                </>
              )}
              <li className="max-w-64 truncate">{view.assignment.name}</li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="font-medium whitespace-nowrap text-ink">
                Draft {view.draft.versionNumber}
              </li>
            </ol>
          </nav>
        )}
        <span className="grow" />
        {view?.check.model === 'mock' && (
          <span
            className="rounded-full bg-muted px-2.5 py-1 text-xs text-ink-soft"
            title="This check was made with the demo scorer, before real scoring was connected."
          >
            Demo results
          </span>
        )}
        {view && (
          <Link
            to={`/check/new?assignment=${view.assignment.id}&rubric=${view.check.rubricId}`}
            className={buttonStyles.secondary}
          >
            <RotateCw size={15} strokeWidth={2} aria-hidden="true" />
            Check next draft
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

function DraftColumn({ check }: { check: CheckResult }) {
  return (
    <section
      aria-label="Your draft"
      className="flex shrink-0 flex-col gap-[18px] border-b border-border bg-surface px-4 py-8 sm:px-10 lg:w-1/2 lg:border-r lg:border-b-0"
    >
      <div className="flex flex-wrap items-center gap-3 text-[13px] text-ink-2">
        <span className="grow">
          Your draft · {check.wordCount.toLocaleString()} words · checked {timeAgo(check.createdAt)}
        </span>
        <span className="flex items-center gap-1.5">
          <TagDot present className="size-2" />
          present
        </span>
        <span className="flex items-center gap-1.5">
          <TagDot present={false} className="size-2" />
          missing
        </span>
      </div>
      {check.title && (
        <h1 className="m-0 font-serif text-[30px] leading-[1.2] font-medium tracking-[-0.01em]">
          {check.title}
        </h1>
      )}
      <ol className="m-0 flex list-none flex-col gap-[18px] p-0">
        {check.paragraphs.map((p) => (
          <li
            key={p.n}
            className={cn(
              '-mx-4 flex gap-4 rounded-xl px-4 py-3.5',
              p.weak ? 'bg-highlight' : 'bg-surface',
            )}
          >
            <span className="w-[22px] shrink-0 pt-1 font-mono text-xs text-ink-2">¶{p.n}</span>
            <div className="flex grow flex-col gap-2.5">
              <p className="m-0 font-serif text-[17px] leading-[1.65] text-ink-body">{p.text}</p>
              <div className="flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <ParagraphTag key={t.label} label={t.label} present={t.present} />
                ))}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function OverallCard({ check }: { check: CheckResult }) {
  const { overall } = check
  return (
    <div className="flex grow flex-col gap-2.5 rounded-[14px] bg-feature px-[22px] py-5 text-white">
      <span className="text-[13px] text-feature-ink-2">
        Estimated level · {check.rubricTitle} rubric
      </span>
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-[44px] font-semibold tracking-[-0.03em]">
          {overall.level} of {overall.levelCount}
        </span>
        <span className="text-lg font-medium">{overall.levelName}</span>
      </div>
      <span className="text-[13px] text-feature-ink-2">
        An estimate to guide revision, not a grade.
      </span>
    </div>
  )
}

function SinceCard({
  change,
  previousNumber,
  history,
  levelCount,
}: {
  change: number
  previousNumber: number
  history: number[]
  levelCount: number
}) {
  const rounded = Math.round(change * 10) / 10
  const shown = rounded > 0 ? `+${rounded}` : rounded === 0 ? '±0' : `${rounded}`
  const bars = history.slice(-3)
  const shades = ['bg-accent-pale', 'bg-accent-mid', 'bg-accent']
  return (
    <div className="flex flex-col gap-2 rounded-[14px] border border-border bg-surface px-[22px] py-5 sm:w-[220px]">
      <span className="text-[13px] text-ink-2">Since draft {previousNumber}</span>
      <span
        className={cn(
          'text-[30px] font-semibold tracking-[-0.02em]',
          rounded >= 0 ? 'text-accent' : 'text-ink',
        )}
      >
        {shown}
      </span>
      <div
        role="img"
        aria-label={`Average level across drafts: ${bars.join(', ')}`}
        className="flex h-[34px] items-end gap-1.5"
      >
        {bars.map((value, i) => (
          <span
            key={i}
            className={cn('w-[22px] rounded', shades[i + 3 - bars.length])}
            style={{ height: `${Math.max(4, (value / levelCount) * 34)}px` }}
          />
        ))}
      </div>
    </div>
  )
}

function CriteriaCard({ check }: { check: CheckResult }) {
  const levelCount = check.overall.levelCount
  return (
    <div className="flex flex-col rounded-[14px] border border-border bg-surface">
      <div className="flex items-center border-b border-divider px-5 py-3.5">
        <h2 className={cn(sectionLabel, 'm-0 grow')}>By criterion</h2>
        <span className="text-xs text-ink-2">
          {check.criteria.length > 0 && 'lowest → highest level'}
        </span>
      </div>
      <ul className="m-0 list-none p-0">
        {check.criteria.map((c, i) => (
          <li
            key={c.criterionId}
            className={cn('flex flex-col gap-2 px-5 py-3.5', i > 0 && 'border-t border-divider')}
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="w-[150px] text-[15px] font-medium">{c.name}</span>
              <LevelBar level={c.level} count={levelCount} label={c.name} />
              <span className="w-[100px] text-sm font-medium">{c.levelName}</span>
              <span className="grow" />
              <ConfidencePill value={c.confidence} />
            </div>
            {c.tip && (
              <p className="m-0 rounded-[10px] bg-bg px-3 py-2.5 text-[13px] leading-normal text-ink-soft sm:ml-[166px]">
                <strong className="font-semibold">From the rubric:</strong> {c.tip}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ChecklistCard({ check }: { check: CheckResult }) {
  if (check.checklist.length === 0) return null
  return (
    <div className="flex flex-col gap-2.5 rounded-[14px] border border-border bg-surface px-5 py-3.5">
      <h2 className={cn(sectionLabel, 'm-0')}>Assignment checklist</h2>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {check.checklist.map((item) => (
          <li key={item.id} className="flex items-center gap-3 text-sm">
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-md',
                item.passed ? 'bg-accent-soft text-accent-hover' : 'bg-warn-bg text-warn',
              )}
            >
              {item.passed ? (
                <Check size={13} strokeWidth={3} aria-label="Yes" />
              ) : (
                <X size={13} strokeWidth={3} aria-label="No" />
              )}
            </span>
            <span className="grow">{item.label}</span>
            <span className="font-mono text-xs text-ink-2">
              {item.source === 'rule' ? 'counted' : `p ${item.probability?.toFixed(2)}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
