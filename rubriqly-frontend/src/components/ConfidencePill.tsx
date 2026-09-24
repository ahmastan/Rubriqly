import { CONFIDENCE_THRESHOLD } from '../lib/scoring'
import { cn } from '../lib/ui'

export function ConfidencePill({ value }: { value: number }) {
  const low = value < CONFIDENCE_THRESHOLD
  const shown = value.toFixed(2)
  return (
    <span
      title={low ? 'Low confidence: check this criterion yourself' : undefined}
      aria-label={low ? `Confidence ${shown}, low: check this yourself` : `Confidence ${shown}`}
      className={cn(
        'shrink-0 rounded-full px-2 py-[3px] font-mono text-xs',
        low ? 'bg-warn-bg text-warn' : 'bg-muted text-ink-soft',
      )}
    >
      conf {shown}
      {low && ' · check'}
    </span>
  )
}
