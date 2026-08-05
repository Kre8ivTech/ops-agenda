import type { Metadata } from 'next';

import { BottomCta } from '@/components/bottom-cta';
import { PageHeader } from '@/components/page-header';
import { InkGrid, InkGridCell, Panel, PanelHeading } from '@/components/panel';
import { COMPLIANCE_CHIPS, NEVER_LIST, PROMISES, SECURITY_ROWS } from '@/lib/marketing-content';
import { pageMetadata } from '@/lib/seo';
import { DOT_TONE } from '@/lib/tone';

export const metadata: Metadata = pageMetadata({
  title: 'Security & privacy',
  description:
    'Encryption, tenant isolation, audit logging and the list of things Ops Agenda will never build. Designed on the assumption that we are part of the threat model.',
  path: '/security',
});

export default function SecurityPage() {
  return (
    <>
      <PageHeader
        eyebrow="Security & privacy"
        title="Built so that we cannot read the sensitive parts."
        lede="One database holding your health logs, your financial position, your filings and your estate papers is only acceptable if the design assumes we are part of the threat model. It does."
        ledeMaxCh="62ch"
      />

      <section className="mx-auto grid max-w-[1400px] grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 px-[clamp(20px,4vw,44px)] pb-11">
        {PROMISES.map((promise) => (
          <div
            key={promise.title}
            className="border-border grid content-start gap-[9px] rounded-[12px] border bg-white px-[clamp(22px,3vw,28px)] py-6"
          >
            <p className="m-0 text-[1.02rem] font-extrabold tracking-[-0.015em]">{promise.title}</p>
            <p className="text-text-secondary m-0 text-[0.9rem] leading-[1.5]">{promise.body}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-[1400px] px-[clamp(20px,4vw,44px)] pb-11">
        <Panel>
          <PanelHeading>How your data is held</PanelHeading>
          {SECURITY_ROWS.map((row) => (
            <div key={row.label} className="border-border flex flex-wrap gap-6 border-b px-6 py-5">
              <span className="basis-[210px] text-[0.92rem] font-extrabold tracking-[-0.01em]">
                {row.label}
              </span>
              <span className="text-text-secondary min-w-0 flex-[1_1_320px] text-[0.91rem] leading-[1.5]">
                {row.body}
              </span>
            </div>
          ))}
        </Panel>
      </section>

      <section id="never" className="mx-auto max-w-[1400px] px-[clamp(20px,4vw,44px)] pb-11">
        <div className="border-border bg-ink rounded-[14px] border px-[clamp(24px,4vw,48px)] py-[clamp(32px,4.4vw,44px)]">
          <p className="text-signal-on-ink font-mono m-0 mb-4 text-[0.74rem] leading-none font-bold tracking-[0.1em] uppercase">
            What we will not build
          </p>
          <h2 className="m-0 mb-7 max-w-[28ch] text-[clamp(1.5rem,3.6vw,1.9rem)] leading-[1.12] tracking-[-0.025em] text-[var(--paper)] text-balance">
            A shorter list than the features, and more important.
          </h2>
          <InkGrid>
            {NEVER_LIST.map((item) => (
              <InkGridCell key={item.title} label={item.title} body={item.body} variant="title" />
            ))}
          </InkGrid>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-[clamp(20px,4vw,44px)] pb-24">
        <div className="border-border rounded-[14px] border bg-white px-[clamp(24px,3.6vw,38px)] py-[clamp(26px,3.6vw,36px)]">
          <p className="text-signal font-mono m-0 mb-[14px] text-[0.72rem] leading-none font-bold tracking-[0.08em] uppercase">
            Compliance, honestly stated
          </p>
          <p className="text-text-secondary m-0 mb-[18px] max-w-[74ch] text-[0.97rem] leading-[1.6]">
            We are pre-launch. Rather than claim certifications we do not yet hold, here is exactly
            where we are: the platform is being engineered to HIPAA Security Rule standards, SOC 2
            Type II evidence collection starts with the first production code, and a third-party
            penetration test is a launch gate we will not waive. When an audit completes, we will
            publish the report — not a badge.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {COMPLIANCE_CHIPS.map((chip) => (
              <span
                key={chip.label}
                className="border-border bg-paper text-text-secondary font-mono inline-flex items-center gap-[9px] rounded-full border px-[13px] py-[9px] text-[0.8rem] leading-none font-semibold"
              >
                <span className={`h-[7px] w-[7px] rounded-full ${DOT_TONE[chip.tone]}`} />
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <BottomCta />
    </>
  );
}
