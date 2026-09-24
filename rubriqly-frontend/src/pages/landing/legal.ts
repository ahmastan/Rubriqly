// The Privacy Policy and Terms of Use. Plain language, and every statement must match what
// Rubriqly really does (check the backend before changing anything here). `{contact}` is replaced
// by the contact email from content.ts. Not legal advice: have a qualified person review before
// a wide public launch.

export type LegalBlock = string | { list: string[] }

export interface LegalSection {
  heading: string
  blocks: LegalBlock[]
}

export interface LegalDoc {
  title: string
  updated: string
  intro: string[]
  summary?: string[]
  sections: LegalSection[]
}

const UPDATED = '23 September 2026'

export const privacyPolicy: LegalDoc = {
  title: 'Privacy policy',
  updated: UPDATED,
  intro: [
    'This page explains what information Rubriqly collects, why, who else handles it and what you can do about it. “Rubriqly”, “we” and “us” mean the Rubriqly service and the people who run it.',
  ],
  summary: [
    'Your drafts are saved in your browser, on your device. We don’t store them on our servers.',
    'When you check a draft, its text is sent to our server and to Vercel AI Gateway for scoring, with a setting that stops providers from training AI models on it. We don’t keep the text.',
    'We store your account (email, name, a scrambled version of your password), your sign-in sessions and a count of your checks.',
    'No ads, no selling your information, no analytics or tracking tools.',
  ],
  sections: [
    {
      heading: 'What we store on our servers',
      blocks: [
        {
          list: [
            'Account details: your email address and display name, and your password stored only as a scrambled fingerprint (an Argon2 hash). We can’t see or recover your password.',
            'Sign-in sessions: when you sign in, your browser gets one cookie holding a random code. We store a scrambled version of that code, and when the session started, was last used and expires (30 days after you last use it).',
            'Check records: for each check, the time, whether it succeeded, failed or was over a daily limit, how much text was processed (in “tokens”) and what it cost us. Not the text itself, the prompt or the results.',
            'Sign-up network: when you create an account, we keep a scrambled, keyed version of your internet (IP) address, so we can limit how many accounts are created from one network each day. We don’t store the address itself.',
          ],
        },
        'Our hosting provider records technical details of requests, such as the time, the address requested and the IP address, for security and troubleshooting. Our own logs record how much each check cost and never contain your draft text.',
      ],
    },
    {
      heading: 'What stays on your device',
      blocks: [
        'Your assignments, drafts, prompts, check results and the rubrics you create are saved in your browser’s storage on the device you use, kept separately for each account. We can’t see them. Your theme and sidebar preferences are saved there too.',
        'They stay until you delete them in Settings, delete your account on that device or clear your browser’s data. Drafts saved on one device aren’t available on another. You can download a copy from Settings (“Export my data”).',
        'If you upload a .docx, .pdf or .txt file, it’s read in your browser. The file itself isn’t sent anywhere; only its text is sent when you check it, as if you’d pasted it.',
      ],
    },
    {
      heading: 'What happens when you check a draft',
      blocks: [
        'To score a draft, we send its text, the assignment prompt you entered (if any) and the rubric’s questions and level descriptions (never the tips) from your browser to our server. Our server sends them to Vercel AI Gateway, which passes them to TypeSafe AI’s Jev model. Jev returns scores and probabilities only; it can’t write text.',
        'We ask Vercel AI Gateway to use only providers that don’t train AI models on the data they receive. We don’t store or log the text on our side. Vercel and TypeSafe AI handle the request under their own terms and privacy policies, which govern whether and for how long they keep request data.',
        'Please don’t put information in a draft that you don’t want sent for scoring, such as other people’s personal details.',
      ],
    },
    {
      heading: 'Why we use this information',
      blocks: [
        {
          list: [
            'To run Rubriqly: signing you in, scoring drafts and showing your account.',
            'To keep accounts secure, for example by limiting wrong password attempts.',
            'To prevent abuse and control costs, for example with daily limits on sign-ups and checks.',
            'To understand what running the service costs.',
          ],
        },
        'We don’t use your information for advertising, we don’t sell it and we don’t use it to train AI models.',
      ],
    },
    {
      heading: 'Who else handles your information',
      blocks: [
        'We use these service providers, only to run Rubriqly:',
        {
          list: [
            'Render: hosts the website and our server (United States).',
            'Neon: hosts our database (United States, on Amazon Web Services).',
            'Vercel (AI Gateway): passes draft text to the scoring model.',
            'TypeSafe AI: runs the Jev scoring model.',
          ],
        },
        'The website’s fonts and code are served from Rubriqly’s own site; your browser doesn’t contact other companies to load them. We may also share information if the law requires it, or to protect Rubriqly’s users or the service from harm.',
      ],
    },
    {
      heading: 'Cookies and browser storage',
      blocks: [
        'Rubriqly sets one cookie, called rubriqly_session, which keeps you signed in. It’s needed for the service to work, can’t be read by the website’s scripts, and is sent only to our server. We don’t use advertising or tracking cookies. Browser storage is used as described under “What stays on your device”.',
      ],
    },
    {
      heading: 'How long we keep it',
      blocks: [
        {
          list: [
            'Account details, check records and the sign-up network record: until you delete your account.',
            'Sign-in sessions: until you sign out, or 30 days after you last used them.',
            'Draft text sent for scoring: we don’t keep it after the check finishes.',
          ],
        },
        'When you delete your account, it’s removed from our database straight away, together with your sessions and check records. It may remain for a short time in our database provider’s automatic backup history before being overwritten.',
      ],
    },
    {
      heading: 'Your choices',
      blocks: [
        {
          list: [
            'Change your display name or password in Settings.',
            'Download or delete the drafts, results and rubrics saved on a device in Settings.',
            'Delete your account in Settings. This removes your account, sessions and check records from our servers, and your saved work from the device you’re using. Work saved on other devices stays there until you delete it on each one.',
            'Ask us what information we hold about you, or ask us to correct or delete it, by emailing {contact}.',
          ],
        },
      ],
    },
    {
      heading: 'Children',
      blocks: [
        'You must be 13 or older to use Rubriqly. It isn’t meant for children under 13, and we don’t knowingly collect their information. If you believe a child under 13 has an account, email {contact} and we’ll delete it. If you’re under 18, please read this page with a parent or guardian.',
      ],
    },
    {
      heading: 'Security',
      blocks: [
        'Connections to Rubriqly are encrypted (HTTPS). Passwords and sign-in codes are stored only as scrambled fingerprints, and access to our systems is limited. No system is perfectly secure, so please use a password you don’t use anywhere else.',
      ],
    },
    {
      heading: 'Where your information is processed',
      blocks: [
        'Rubriqly and its service providers process information in the United States. If you use Rubriqly from another country, your information will be transferred to and processed in the United States.',
      ],
    },
    {
      heading: 'Changes to this policy',
      blocks: [
        'If we change how we handle information, we’ll update this page and the date at the top.',
      ],
    },
    {
      heading: 'Contact',
      blocks: ['Questions or requests about your information: {contact}.'],
    },
  ],
}

export const termsOfUse: LegalDoc = {
  title: 'Terms of use',
  updated: UPDATED,
  intro: [
    'These terms are the agreement between you and Rubriqly (“we”, “us”) for using the Rubriqly website and app. By creating an account or using Rubriqly, you agree to them and to our Privacy Policy.',
  ],
  sections: [
    {
      heading: 'Who can use Rubriqly',
      blocks: [
        'You must be at least 13 years old. If you’re under 18, or under the age of majority where you live, a parent or guardian should review these terms with you and agree to them.',
      ],
    },
    {
      heading: 'What Rubriqly does, and doesn’t do',
      blocks: [
        'Rubriqly estimates how a draft might meet each criterion of a rubric, tags paragraphs and checks a list of requirements, to help you decide what to revise. Results are estimated levels produced by an AI model: an estimate, not a grade.',
        'Results can be wrong. Your teacher or institution decides the grade, and using Rubriqly doesn’t promise any particular result. Rubriqly never writes or rewrites your text; you are responsible for your work.',
      ],
    },
    {
      heading: 'Academic integrity',
      blocks: [
        'Follow your school’s or institution’s rules about using feedback tools. If you’re unsure whether using Rubriqly is allowed for an assignment, ask your teacher.',
      ],
    },
    {
      heading: 'Your account',
      blocks: [
        {
          list: [
            'Give accurate information when you sign up, and use one account per person.',
            'Keep your password private. You’re responsible for what happens in your account.',
            'If you think someone else has used your account, change your password and email {contact}.',
          ],
        },
      ],
    },
    {
      heading: 'Your content',
      blocks: [
        'Your drafts, prompts and rubrics stay yours. You allow us to process the text you submit only to provide the service, which includes sending it to our scoring providers as described in the Privacy Policy. Only submit content you have the right to use.',
      ],
    },
    {
      heading: 'Rubriqly’s code',
      blocks: [
        'Rubriqly’s core source code is published under the MIT License on GitHub. That license covers the code; these terms cover your use of the hosted service on this website.',
      ],
    },
    {
      heading: 'Acceptable use',
      blocks: [
        'Don’t:',
        {
          list: [
            'create accounts automatically or in bulk, or try to get around daily limits;',
            'try to access other people’s accounts or data, or interfere with or overload the service;',
            'use Rubriqly for anything illegal, or to submit content that is harmful or infringes other people’s rights.',
          ],
        },
      ],
    },
    {
      heading: 'Limits and availability',
      blocks: [
        'Rubriqly is currently free, with daily limits on checks and sign-ups that we may change. If we ever introduce paid plans, we’ll tell you before charging you anything. The service may sometimes be slow or unavailable (for example, while its server wakes up), and we may change or stop features.',
      ],
    },
    {
      heading: 'Ending your use',
      blocks: [
        'You can delete your account at any time in Settings. We may suspend or close accounts that break these terms or put the service or other users at risk.',
      ],
    },
    {
      heading: 'No warranties',
      blocks: [
        'Rubriqly is provided “as is” and “as available”. To the extent the law allows, we make no warranties, express or implied, including that the service or its results will be accurate, reliable, uninterrupted or fit for a particular purpose.',
      ],
    },
    {
      heading: 'Limitation of liability',
      blocks: [
        'To the extent the law allows, Rubriqly won’t be liable for indirect, incidental or consequential losses, or for any academic decision based on its results. Nothing in these terms limits rights you have under law that can’t be limited.',
      ],
    },
    {
      heading: 'Governing law',
      blocks: [
        'These terms are governed by the laws of the United States and of the U.S. state in which Rubriqly is operated, without regard to conflict-of-law rules.',
      ],
    },
    {
      heading: 'Changes to these terms',
      blocks: [
        'We may update these terms. We’ll change the date at the top when we do. If you keep using Rubriqly after an update, the new terms apply.',
      ],
    },
    {
      heading: 'Contact',
      blocks: ['Questions about these terms: {contact}.'],
    },
  ],
}
