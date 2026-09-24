import * as m from 'motion/react-m'
import { useTransform, type MotionValue } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '../../../lib/ui'

type Range = [number, number]

/** Fades and slides its children in while scroll progress moves through `range`. */
export function ScrollReveal({
  progress,
  range,
  x = 0,
  y = 12,
  className,
  children,
}: {
  progress: MotionValue<number>
  range: Range
  x?: number
  y?: number
  className?: string
  children: ReactNode
}) {
  const opacity = useTransform(progress, range, [0, 1])
  const tx = useTransform(progress, range, [x, 0])
  const ty = useTransform(progress, range, [y, 0])
  return (
    <m.div className={className} style={{ opacity, x: tx, y: ty }}>
      {children}
    </m.div>
  )
}

/** A 4-segment level bar whose filled segments grow in, one after another, across `range`. */
export function ScrollLevelBar({
  progress,
  range,
  level,
  count = 4,
  className,
}: {
  progress: MotionValue<number>
  range: Range
  level: number
  count?: number
  className?: string
}) {
  const [start, end] = range
  const slice = (end - start) / level
  return (
    <div className={cn('flex w-28 gap-1', className)}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="h-2 grow overflow-hidden rounded-[3px] bg-border">
          {i < level && (
            <Fill progress={progress} range={[start + i * slice, start + (i + 1) * slice]} />
          )}
        </span>
      ))}
    </div>
  )
}

function Fill({ progress, range }: { progress: MotionValue<number>; range: Range }) {
  const scaleX = useTransform(progress, range, [0, 1])
  return <m.span className="block h-full origin-left bg-accent" style={{ scaleX }} />
}

/** Grows from the bottom across `range` (for the little "since last draft" bars). */
export function ScrollGrow({
  progress,
  range,
  className,
  height,
}: {
  progress: MotionValue<number>
  range: Range
  className?: string
  height: number
}) {
  const scaleY = useTransform(progress, range, [0, 1])
  return <m.span className={cn('origin-bottom', className)} style={{ scaleY, height }} />
}
