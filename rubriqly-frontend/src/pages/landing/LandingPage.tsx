import { LandingFooter } from './LandingFooter'
import { useLandingBackground } from './useLandingBackground'
import { LandingNav } from './LandingNav'
import { DemoSection } from './sections/DemoSection'
import { Faq } from './sections/Faq'
import { FinalCta } from './sections/FinalCta'
import { ForTeachers } from './sections/ForTeachers'
import { Hero } from './sections/Hero'
import { HowItWorks } from './sections/HowItWorks'
import { Privacy } from './sections/Privacy'
import { RubricLibrary } from './sections/RubricLibrary'
import { Statement } from './sections/Statement'
import { SmoothScroll } from './SmoothScroll'
import './landing.css'

/** The marketing page at `/`. Direction B: dark first, with paper-colored bands. */
export function LandingPage() {
  useLandingBackground()
  return (
    <SmoothScroll>
      <div className="theme-dark min-h-screen bg-bg text-ink">
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-ink px-4 py-2 text-bg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <LandingNav />
        <main id="main">
          <Hero />
          <DemoSection />
          <Statement />
          <HowItWorks />
          <RubricLibrary />
          <ForTeachers />
          <Privacy />
          <Faq />
          <FinalCta />
        </main>
        <LandingFooter />
      </div>
    </SmoothScroll>
  )
}
