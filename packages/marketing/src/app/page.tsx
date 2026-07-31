import { BriefPreview } from '@/components/brief-preview';
import { ButtonLink } from '@/components/button';
import { FaqItem } from '@/components/faq-item';
import { FeatureCard } from '@/components/feature-card';
import { Lockup } from '@/components/lockup';
import { PricingCard } from '@/components/pricing-card';
import { SIGNIN_URL, SIGNUP_URL } from '@/lib/app-links';

const FEATURES = [
  {
    eyebrow: 'Daily Ops Brief',
    title: 'One page, every morning',
    description:
      'A single ranked view of what needs you today, built from your open work, not a generic to-do list.',
  },
  {
    eyebrow: 'Priority Inbox',
    title: 'Email sorted by consequence',
    description:
      'Messages ranked P1 through FYSA by what happens if you ignore them — not by sender or subject line.',
  },
  {
    eyebrow: 'Due-Out Detection',
    title: 'What you owe someone else',
    description:
      'Commitments you made in email or meetings, tracked until they are handled, then dropped from the brief.',
  },
  {
    eyebrow: 'Calendar Intelligence',
    title: 'Meetings with the context attached',
    description: 'Conflicts, prep gaps, and back-to-back load surfaced before the day starts.',
  },
  {
    eyebrow: 'Draft Reply',
    title: 'A starting point, not a sent message',
    description: 'Ask drafts a reply from the thread. It waits in your outbox until you send it.',
  },
  {
    eyebrow: 'Weekly Outlook',
    title: 'Capacity before commitments',
    description: 'A horizon view of the week so new work gets weighed against what is already there.',
  },
];

const FAQS = [
  {
    question: 'Does Ops Agenda send anything on my behalf?',
    answer:
      'No. Drafts, filings, and payments all wait for your approval. The product proposes; you decide what happens.',
  },
  {
    question: 'What does it actually read?',
    answer:
      'Mail and calendar metadata through the minimum Microsoft Graph scopes — Mail.Read and Calendars.Read. Message bodies are not stored; only the metadata and summaries needed to rank and brief.',
  },
  {
    question: 'Can it move money or store credentials?',
    answer:
      'No. Finance connections are read-only for visibility and flagging. Ops Agenda never initiates a transfer and never stores account credentials.',
  },
  {
    question: 'What happens if I turn a module off?',
    answer:
      'It disappears from navigation immediately. Its data is retained for 30 days in case you turn it back on, then permanently deleted.',
  },
  {
    question: 'Can I use it for more than one business?',
    answer:
      'Yes — entities separate personal and business data under one account. Personal includes one entity; Professional and Operator support more.',
  },
];

export default function MarketingHome() {
  return (
    <>
      <header className="border-border bg-paper/90 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Lockup />
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#product" className="text-ink text-[0.88rem] font-bold hover:text-signal">
              Product
            </a>
            <a href="#pricing" className="text-ink text-[0.88rem] font-bold hover:text-signal">
              Pricing
            </a>
            <a href="#faq" className="text-ink text-[0.88rem] font-bold hover:text-signal">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2.5">
            <ButtonLink href={SIGNIN_URL} variant="quiet" size="medium">
              Sign in
            </ButtonLink>
            <ButtonLink href={SIGNUP_URL} size="medium">
              Get started
            </ButtonLink>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] md:items-center md:py-24">
          <div>
            <p className="text-signal m-0 mb-3 font-mono text-[0.76rem] font-extrabold uppercase tracking-[0.02em]">
              AI ops platform
            </p>
            <h1 className="text-ink m-0 mb-5 text-pretty text-[2.4rem] font-extrabold leading-[1.06] tracking-[-0.02em] md:text-[3.1rem]">
              One loop, closed every morning.
            </h1>
            <p className="text-text-secondary m-0 mb-7 max-w-[52ch] text-[1.05rem] leading-[1.55]">
              Ops Agenda reads your email and calendar and ranks what actually needs you today
              into a single brief. Every action it proposes waits for your approval — nothing is
              sent, filed, or paid without you.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={SIGNUP_URL}>Get started</ButtonLink>
              <ButtonLink href="#how-it-works" variant="secondary">
                See how it works
              </ButtonLink>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <BriefPreview />
          </div>
        </section>

        <section className="border-border border-y bg-white">
          <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 sm:grid-cols-3">
            <p className="text-ink m-0 text-[0.95rem] font-bold leading-[1.4]">
              AI proposes. You approve.
            </p>
            <p className="text-ink m-0 text-[0.95rem] font-bold leading-[1.4]">
              Read-mostly access to mail and calendar.
            </p>
            <p className="text-ink m-0 text-[0.95rem] font-bold leading-[1.4]">
              No autonomous sending, filing, or paying.
            </p>
          </div>
        </section>

        <section id="product" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="mb-10 max-w-[62ch]">
            <p className="text-signal m-0 mb-2 font-mono text-[0.76rem] font-extrabold uppercase tracking-[0.02em]">
              What it does
            </p>
            <h2 className="text-ink m-0 mb-3 text-[1.9rem] font-extrabold tracking-[-0.02em]">
              Six ways it keeps the day honest
            </h2>
            <p className="text-text-secondary m-0 text-[1rem] leading-[1.6]">
              Each one is a narrow, specific job — not a chatbot that tries to do everything.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.eyebrow} {...feature} />
            ))}
          </div>
        </section>

        <section id="how-it-works" className="border-border border-y bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
            <p className="text-signal m-0 mb-2 font-mono text-[0.76rem] font-extrabold uppercase tracking-[0.02em]">
              How it works
            </p>
            <h2 className="text-ink m-0 mb-10 text-[1.9rem] font-extrabold tracking-[-0.02em]">
              Three steps, repeated every morning
            </h2>
            <div className="grid gap-8 sm:grid-cols-3">
              {[
                {
                  step: '01',
                  title: 'Connect, read-only',
                  body: 'Mail and calendar connect with Mail.Read and Calendars.Read only. No send access, no credential storage.',
                },
                {
                  step: '02',
                  title: 'AI ranks and drafts',
                  body: 'Everything open gets a priority — P1 through FYSA — with the reason stated in one sentence.',
                },
                {
                  step: '03',
                  title: 'You approve',
                  body: 'One brief, every morning. Mark it handled or act on it — nothing moves without you.',
                },
              ].map((item) => (
                <div key={item.step}>
                  <p className="text-border m-0 mb-2 font-mono text-[2rem] font-extrabold leading-none">
                    {item.step}
                  </p>
                  <h3 className="text-ink m-0 mb-2 text-[1.1rem] font-extrabold">{item.title}</h3>
                  <p className="text-text-secondary m-0 max-w-[36ch] text-[0.9rem] leading-[1.55]">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="mb-10 max-w-[62ch]">
            <p className="text-signal m-0 mb-2 font-mono text-[0.76rem] font-extrabold uppercase tracking-[0.02em]">
              Pricing
            </p>
            <h2 className="text-ink m-0 mb-3 text-[1.9rem] font-extrabold tracking-[-0.02em]">
              One price per plan. No usage surprises.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <PricingCard
              name="Personal"
              price="$19"
              entities="1 entity"
              modules="Plan + Productivity"
            />
            <PricingCard
              name="Professional"
              price="$39"
              entities="Up to 3 entities"
              modules="+ Finances, Research"
              featured
            />
            <PricingCard
              name="Operator"
              price="$79"
              entities="Unlimited entities"
              modules="All 8 modules"
            />
          </div>
        </section>

        <section id="faq" className="border-border border-y bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
            <p className="text-signal m-0 mb-2 font-mono text-[0.76rem] font-extrabold uppercase tracking-[0.02em]">
              Questions
            </p>
            <h2 className="text-ink m-0 mb-10 text-[1.9rem] font-extrabold tracking-[-0.02em]">
              Before you connect an account
            </h2>
            <div className="grid max-w-3xl gap-3">
              {FAQS.map((faq) => (
                <FaqItem key={faq.question} {...faq} />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16 text-center md:py-24">
          <h2 className="text-ink m-0 mb-5 text-pretty text-[1.9rem] font-extrabold tracking-[-0.02em] md:text-[2.3rem]">
            Read the brief before the day reads you.
          </h2>
          <ButtonLink href={SIGNUP_URL}>Get started</ButtonLink>
        </section>
      </main>

      <footer className="border-border border-t bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <Lockup mark="ink" />
          <div className="text-text-secondary flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.85rem]">
            <a href={SIGNIN_URL} className="hover:text-ink">
              Sign in
            </a>
            <a href="mailto:info@kre8ivtech.com" className="hover:text-ink">
              info@kre8ivtech.com
            </a>
            <span>© {new Date().getFullYear()} Kre8ivTech. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
