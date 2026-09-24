import * as m from 'motion/react-m'
import { useReducedMotion } from 'motion/react'
import { ParagraphTag } from '../../../components/ParagraphTag'
import { cn } from '../../../lib/ui'
import { demoDraft } from '../content'

/** Seconds between one paragraph's tags appearing and the next paragraph's. */
const PARAGRAPH_GAP = 0.35

const hiddenTag = { opacity: 0, y: 6, scale: 0.9 }
const shownTag = { opacity: 1, y: 0, scale: 1 }

/**
 * The made-up draft as a paper page, using the app's real paragraph tags. With `revealDelay`,
 * the tags pop in paragraph by paragraph and the weak paragraph's highlight fades in last,
 * like someone annotating the page. Without it (or with reduced motion) it's static.
 */
export function EssayMock({
  paragraphs = demoDraft.paragraphs.length,
  revealDelay,
  play = true,
  className,
}: {
  /** How many paragraphs to show (the hero shows fewer). */
  paragraphs?: number
  /** Seconds to wait before annotating. */
  revealDelay?: number
  /** With `revealDelay`: false holds the annotations back (e.g. until scrolled into view). */
  play?: boolean
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  const reveal = revealDelay !== undefined && !reduceMotion
  const shown = demoDraft.paragraphs.slice(0, paragraphs)

  return (
    <div
      className={cn(
        'theme-light flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 text-ink shadow-[0_24px_60px_-20px_rgb(0_0_0/0.6)] sm:p-8',
        className,
      )}
    >
      <p className="m-0 font-serif text-2xl leading-tight font-medium tracking-[-0.01em]">
        {demoDraft.title}
      </p>
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {shown.map((p, i) => {
          const start = (revealDelay ?? 0) + i * PARAGRAPH_GAP
          return (
            <li key={i} className="relative isolate -mx-3 flex gap-3 rounded-xl px-3 py-2.5">
              {p.weak && (
                <m.span
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 rounded-xl bg-highlight"
                  initial={reveal ? { opacity: 0 } : false}
                  animate={{ opacity: !reveal || play ? 1 : 0 }}
                  transition={{
                    delay: (revealDelay ?? 0) + shown.length * PARAGRAPH_GAP,
                    duration: 0.6,
                  }}
                />
              )}
              <span className="w-5 shrink-0 pt-0.5 font-mono text-[11px] text-ink-2">¶{i + 1}</span>
              <div className="flex flex-col gap-2">
                <p className="m-0 font-serif text-[15px] leading-[1.6] text-ink-body">{p.text}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map((t, j) => (
                    <m.span
                      key={t.label}
                      className="inline-flex"
                      initial={reveal ? hiddenTag : false}
                      animate={!reveal || play ? shownTag : hiddenTag}
                      transition={{
                        delay: start + j * 0.12,
                        type: 'spring',
                        stiffness: 420,
                        damping: 26,
                      }}
                    >
                      <ParagraphTag label={t.label} present={t.present} />
                    </m.span>
                  ))}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
