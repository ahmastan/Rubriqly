import { cn } from '../lib/ui'

export function ParagraphTag({ label, present }: { label: string; present: boolean }) {
  return (
    <span
      className={cn(
        'flex items-center gap-1.5 rounded-full px-[9px] py-[3px] text-xs font-medium',
        present ? 'bg-accent-soft text-accent-hover' : 'bg-warn-bg text-warn',
      )}
    >
      <TagDot present={present} />
      {present ? label : `${label} missing`}
    </span>
  )
}

export function TagDot({ present, className }: { present: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'box-border size-[7px] shrink-0 rounded-full',
        present ? 'bg-accent' : 'border-[1.5px] border-warn-ring',
        className,
      )}
    />
  )
}
