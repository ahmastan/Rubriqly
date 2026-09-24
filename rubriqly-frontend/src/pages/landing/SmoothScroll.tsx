import { ReactLenis } from 'lenis/react'
import { domAnimation, LazyMotion } from 'motion/react'
import 'lenis/dist/lenis.css'
import type { ReactNode } from 'react'

/**
 * Smooth, gliding scroll and slim-mode animations for the landing page only (the app keeps normal scrolling).
 * Lenis smooths wheel and trackpad input on top of the browser's own scrolling, so sticky
 * sections, Motion's scroll tracking and keyboard scrolling keep working. It switches itself
 * off for people who ask their system for reduced motion.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      autoRaf
      options={{
        // How quickly the page catches up with your scrolling (0–1). Lower is floatier.
        lerp: 0.1,
        // Make "#section" links glide too, stopping below the 64px sticky nav.
        anchors: { offset: -72 },
        // Let sideways rows and other inner scroll areas scroll normally.
        allowNestedScroll: true,
        respectReducedMotion: true,
      }}
    >
      {/* Motion's slim mode: only the animation features this page uses (see the Stage 7 notes). */}
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </ReactLenis>
  )
}
