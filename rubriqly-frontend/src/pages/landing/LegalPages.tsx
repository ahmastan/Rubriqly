import { Fragment, type ReactNode } from 'react'
import { cn } from '../../lib/ui'
import { CONTACT_EMAIL } from './content'
import { LandingFooter } from './LandingFooter'
import { LandingNav } from './LandingNav'
import { privacyPolicy, termsOfUse, type LegalBlock, type LegalDoc } from './legal'
import { useLandingBackground } from './useLandingBackground'
import { container } from './ui'

/** The contact address, or an honest "coming soon" until it's set in content.ts. */
function ContactEmail() {
  if (CONTACT_EMAIL) {
    return (
      <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-accent">
        {CONTACT_EMAIL}
      </a>
    )
  }
  return <span className="font-medium text-ink">our contact address (coming soon)</span>
}

/** Plain text, with `{contact}` replaced by the contact email. */
function Rich({ text }: { text: string }) {
  const parts = text.split('{contact}')
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 && <ContactEmail />}
        </Fragment>
      ))}
    </>
  )
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === 'string') {
    return (
      <p className="m-0">
        <Rich text={block} />
      </p>
    )
  }
  return (
    <ul className="m-0 flex flex-col gap-2 pl-5">
      {block.list.map((item) => (
        <li key={item}>
          <Rich text={item} />
        </li>
      ))}
    </ul>
  )
}

function LegalLayout({ children }: { children: ReactNode }) {
  useLandingBackground()
  return (
    <div className="theme-dark flex min-h-screen flex-col bg-bg text-ink">
      <LandingNav />
      <main className={cn(container, 'flex grow flex-col gap-10 py-16 sm:py-24')}>{children}</main>
      <LandingFooter />
    </div>
  )
}

function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <LegalLayout>
      <header className="flex max-w-2xl flex-col gap-3">
        <h1 className="m-0 text-4xl font-semibold tracking-[-0.03em]">{doc.title}</h1>
        <p className="m-0 font-mono text-xs text-ink-2">Last updated {doc.updated}</p>
        {doc.intro.map((text) => (
          <p key={text} className="m-0 text-lg leading-relaxed text-ink-soft">
            <Rich text={text} />
          </p>
        ))}
      </header>
      {doc.summary && (
        <section
          aria-labelledby="in-short"
          className="flex max-w-2xl flex-col gap-3 rounded-2xl border border-border bg-surface p-6"
        >
          <h2 id="in-short" className="m-0 text-base font-semibold">
            In short
          </h2>
          <ul className="m-0 flex flex-col gap-2 pl-5 text-[15px] leading-relaxed text-ink-soft">
            {doc.summary.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}
      <div className="flex max-w-2xl flex-col gap-9">
        {doc.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-3">
            <h2 className="m-0 text-xl font-semibold tracking-[-0.01em]">{section.heading}</h2>
            <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-ink-soft">
              {section.blocks.map((block, i) => (
                <Block key={i} block={block} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </LegalLayout>
  )
}

export const PrivacyPage = () => <LegalDocument doc={privacyPolicy} />
export const TermsPage = () => <LegalDocument doc={termsOfUse} />

const CONTACT_TOPICS = [
  {
    heading: 'Forgot your password?',
    text: 'Email us from the address you signed up with and we’ll reset it. We’ll never ask for your password.',
  },
  {
    heading: 'Your information',
    text: 'To find out what we hold about you, or to correct or delete it. See the Privacy Policy for what we store.',
  },
  {
    heading: 'Questions and feedback',
    text: 'Something not working, a rubric you’d like to see, or anything else about Rubriqly.',
  },
]

export function ContactPage() {
  return (
    <LegalLayout>
      <header className="flex max-w-2xl flex-col gap-3">
        <h1 className="m-0 text-4xl font-semibold tracking-[-0.03em]">Contact</h1>
        <p className="m-0 text-lg leading-relaxed text-ink-soft">
          Email <ContactEmail />.
          {!CONTACT_EMAIL && ' We’re setting it up, and it will be listed here soon.'}
        </p>
      </header>
      <div className="grid max-w-3xl gap-4 sm:grid-cols-3">
        {CONTACT_TOPICS.map((topic) => (
          <section
            key={topic.heading}
            className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5"
          >
            <h2 className="m-0 text-base font-semibold">{topic.heading}</h2>
            <p className="m-0 text-sm leading-relaxed text-ink-soft">{topic.text}</p>
          </section>
        ))}
      </div>
    </LegalLayout>
  )
}
