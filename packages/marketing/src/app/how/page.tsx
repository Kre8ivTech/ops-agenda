import type { Metadata } from 'next';

import { BottomCta } from '@/components/bottom-cta';
import { PageHeader } from '@/components/page-header';
import { InkGrid, InkGridCell } from '@/components/panel';
import { AI_LIMITS, HOW_STEPS } from '@/lib/marketing-content';

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'Ops Agenda reads the systems you already use, ranks your day by what is genuinely at risk, and waits for you to approve. Three things happen while you sleep.',
};

export default function HowPage() {
  return (
    <>
      <PageHeader
        eyebrow="How it works"
        title="Three things happen while you sleep."
        lede="Nothing to maintain, nothing to migrate, and nothing new to keep up to date. Ops Agenda works from the systems you are already in."
        ledeMaxCh="58ch"
      />

      <section className="mx-auto grid max-w-[1400px] gap-4 px-[clamp(20px,4vw,44px)] pb-24">
        {HOW_STEPS.map((step) => (
          <div
            key={step.num}
            className="border-border grid grid-cols-[auto_minmax(0,1fr)] items-start gap-[clamp(18px,3vw,28px)] rounded-[14px] border bg-white px-[clamp(24px,3.6vw,38px)] py-[clamp(26px,3.6vw,34px)]"
          >
            <span className="text-border font-mono text-[1.5rem] leading-none font-extrabold">
              {step.num}
            </span>
            <div className="grid min-w-0 gap-2.5">
              <h2 className="m-0 text-[clamp(1.25rem,3vw,1.5rem)] tracking-[-0.02em]">
                {step.title}
              </h2>
              <p className="text-text-secondary m-0 max-w-[64ch] text-base leading-[1.55]">
                {step.body}
              </p>
              <p className="text-signal font-mono m-0 mt-1 text-[0.8rem] leading-[1.5] font-semibold">
                {step.detail}
              </p>
            </div>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-[1400px] px-[clamp(20px,4vw,44px)] pb-24">
        <div className="border-border bg-ink rounded-[14px] border p-[clamp(30px,4.4vw,48px)]">
          <p className="text-signal-on-ink font-mono m-0 mb-4 text-[0.74rem] leading-none font-bold tracking-[0.1em] uppercase">
            Where the line is
          </p>
          <h2 className="m-0 mb-4 max-w-[30ch] text-[clamp(1.5rem,3.6vw,1.9rem)] leading-[1.12] tracking-[-0.025em] text-[var(--paper)] text-balance">
            It proposes. You approve. Always.
          </h2>
          <p className="m-0 mb-[30px] max-w-[62ch] text-base leading-[1.55] text-[rgba(247,247,242,0.72)]">
            Ops Agenda ranks, drafts and explains. It does not send, schedule, pay, file or delete.
            Every side effect passes through a decision you make, which means even a perfectly wrong
            ranking costs you a moment&rsquo;s attention rather than money.
          </p>
          <InkGrid>
            {AI_LIMITS.map((limit) => (
              <InkGridCell key={limit.label} label={limit.label} body={limit.body} />
            ))}
          </InkGrid>
        </div>
      </section>

      <BottomCta />
    </>
  );
}
