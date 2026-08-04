import type { Metadata } from 'next';

import { BottomCta } from '@/components/bottom-cta';
import { InkGrid, InkGridCell, Panel, PanelHeading } from '@/components/panel';
import { ABOUT_PARAGRAPHS, EF_CARDS, NOT_CARE, PRINCIPLES } from '@/lib/marketing-content';

export const metadata: Metadata = {
  title: 'About',
  description:
    'The person this was built for has ADHD. Everything about how Ops Agenda works follows from that, including most of what it refuses to do.',
};

export default function AboutPage() {
  return (
    <>
      <section className="px-[clamp(20px,4vw,44px)] pt-[84px] pb-14">
        <p className="text-signal font-mono m-0 mb-[18px] text-[0.74rem] leading-none font-bold tracking-[0.12em] uppercase">
          About
        </p>
        <h1 className="m-0 mb-[22px] max-w-[26ch] text-[clamp(2.1rem,7vw,4rem)] leading-[1.02] tracking-[-0.034em] text-balance">
          Made for a brain that loses the thread.
        </h1>
        <p className="text-text-secondary m-0 max-w-[56ch] text-[clamp(1.02rem,2.3vw,1.24rem)] leading-[1.5]">
          The person this was built for has ADHD. Everything about how it works follows from that,
          including most of what it refuses to do.
        </p>
      </section>

      <section className="px-[clamp(20px,4vw,44px)] pb-[76px]">
        <div className="border-border [column-gap:clamp(32px,4.5vw,64px)] border-t pt-11 [column-width:33rem]">
          {ABOUT_PARAGRAPHS.map((paragraph) => (
            <p
              key={paragraph.slice(0, 48)}
              className="text-text-secondary m-0 mb-5 text-[clamp(0.99rem,1.9vw,1.09rem)] leading-[1.65]"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section className="px-[clamp(20px,4vw,44px)] pb-[76px]">
        <div className="border-border mb-[26px] flex flex-wrap items-baseline gap-4 border-b pb-[18px]">
          <span className="text-signal font-mono text-[0.74rem] leading-none font-bold tracking-[0.1em]">
            Executive function
          </span>
          <h2 className="m-0 text-[clamp(1.5rem,3.6vw,1.9rem)] tracking-[-0.025em]">
            What it costs, and what we do about it
          </h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4">
          {EF_CARDS.map((card) => (
            <div
              key={card.label}
              className="border-border grid content-start gap-[11px] rounded-[12px] border bg-white px-7 py-[26px]"
            >
              <p className="text-signal font-mono m-0 text-[0.72rem] leading-none font-bold tracking-[0.08em] uppercase">
                {card.label}
              </p>
              <p className="m-0 text-[1.02rem] leading-[1.3] font-extrabold tracking-[-0.015em]">
                {card.problem}
              </p>
              <p className="text-text-secondary m-0 text-[0.9rem] leading-[1.5]">{card.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink mb-[76px] px-[clamp(20px,4vw,44px)] py-[clamp(48px,6vw,76px)]">
        <p className="text-signal-on-ink font-mono m-0 mb-[18px] text-[0.74rem] leading-none font-bold tracking-[0.12em] uppercase">
          Being clear about it
        </p>
        <h2 className="m-0 mb-5 max-w-[30ch] text-[clamp(1.65rem,4vw,2.1rem)] leading-[1.1] tracking-[-0.026em] text-[var(--paper)] text-balance">
          This is software, not care.
        </h2>
        <p className="m-0 mb-9 max-w-[62ch] text-[clamp(0.98rem,2vw,1.06rem)] leading-[1.55] text-[rgba(247,247,242,0.72)]">
          ADHD is why this product exists. That does not make it a clinical tool, and we are not
          going to imply otherwise.
        </p>
        <InkGrid>
          {NOT_CARE.map((item) => (
            <InkGridCell
              key={item.title}
              label={item.title}
              body={item.body}
              variant="title"
              basis="280px"
            />
          ))}
        </InkGrid>
      </section>

      <section className="px-[clamp(20px,4vw,44px)] pb-24">
        <Panel>
          <PanelHeading>Principles we build against</PanelHeading>
          {PRINCIPLES.map((principle) => (
            <div
              key={principle.num}
              className="border-border grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 border-b px-[26px] py-[22px]"
            >
              <span className="text-border font-mono text-[0.8rem] leading-[1.4] font-extrabold">
                {principle.num}
              </span>
              <div className="grid min-w-0 gap-1.5">
                <p className="m-0 text-[0.99rem] font-extrabold tracking-[-0.01em]">
                  {principle.title}
                </p>
                <p className="text-text-secondary m-0 max-w-[70ch] text-[0.92rem] leading-[1.55]">
                  {principle.body}
                </p>
              </div>
            </div>
          ))}
        </Panel>
      </section>

      <BottomCta />
    </>
  );
}
