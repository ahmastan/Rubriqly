import { cn } from '../lib/ui'

/** Levels as filled blue accent segments (not red/yellow/green), so it reads as revision help, not a grade. */
export function LevelBar({
  level,
  count,
  label,
  size = 'md',
  className,
}: {
  level: number
  count: number
  label: string
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <div
      role="img"
      aria-label={`${label}: level ${level} of ${count}`}
      className={cn('flex', size === 'md' ? 'w-40 gap-1' : 'w-[72px] gap-[3px]', className)}
    >
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cn(
            'grow',
            size === 'md' ? 'h-2 rounded-[3px]' : 'h-1.5 rounded-[2px]',
            i < level ? 'bg-accent' : 'bg-border',
          )}
        />
      ))}
    </div>
  )
}
