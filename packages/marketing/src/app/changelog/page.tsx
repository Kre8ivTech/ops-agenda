import type { Metadata } from 'next';

import { BottomCta } from '@/components/bottom-cta';
import { PHASES } from '@/lib/marketing-content';
import { pageMetadata } from '@/lib/seo';
import { ACCENT_TONE, PILL_TONE } from '@/lib/tone';

export const metadata: Metadata = pageMetadata({
  title: 'Build status',
  description:
    'No customers yet, no testimonials, nothing shipped to production. The honest state of each build phase, updated as it changes.',
  path: '/changelog',
});

export default function ChangelogPage() {
  return (
    <>
      <section className="mx-auto max-w-[1120px] px-[clamp(20px,4vw,44px)] pt-[84px] pb-14">
        <p className="text-signal font-mono m-0 mb-[18px] text-[0.74rem] leading-none font-bold tracking-[0.12em] uppercase">
          Build status
        </p>
        <h1 className="m-0 mb-5 max-w-[22ch] text-[clamp(2.15rem,6.4vw,3.3rem)] leading-[1.03] tracking-[-0.032em] text-balance">
          Where this actually is.
        </h1>
        <p className="text-text-secondary m-0 max-w-[60ch] text-[clamp(1rem,2.1vw,1.15rem)] leading-[1.5]">
          No customers yet, no testimonials to show you, and nothing shipped to production. Here is
          the honest state of each phase, updated as it changes.
        </p>
      </section>

      <section className="mx-auto grid max-w-[1120px] gap-[14px] px-[clamp(20px,4vw,44px)] pb-24">
        {PHASES.map((phase) => (
          <div
            key={phase.num}
            className={`border-border grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 rounded-[12px] border border-l-[3px] bg-white px-[clamp(22px,3.2vw,30px)] py-6 ${ACCENT_TONE[phase.tone]}`}
          >
            <div className="grid min-w-0 gap-2">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-text-secondary font-mono text-[0.74rem] leading-none font-bold">
                  {phase.num}
                </span>
                <span className="text-[1.1rem] font-extrabold tracking-[-0.015em]">
                  {phase.title}
                </span>
              </div>
              <p className="text-text-secondary m-0 max-w-[70ch] text-[0.93rem] leading-[1.55]">
                {phase.body}
              </p>
            </div>
            <span
              className={`font-mono rounded-full px-2.5 py-[5px] text-[0.7rem] leading-none font-extrabold whitespace-nowrap ${PILL_TONE[phase.tone]}`}
            >
              {phase.status}
            </span>
          </div>
        ))}
      </section>

      <BottomCta />
    </>
  );
}
