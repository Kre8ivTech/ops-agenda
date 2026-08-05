import type { Metadata } from 'next';

import { BottomCta } from '@/components/bottom-cta';
import { PageHeader } from '@/components/page-header';
import { Panel, PanelHeading } from '@/components/panel';
import { LEGAL_LAST_UPDATED, TERMS_SECTIONS } from '@/lib/legal-content';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Terms of service',
  description:
    'Terms for the pre-launch marketing site and waitlist form. Full product terms are published separately before general availability.',
  path: '/legal/terms',
});

export default function TermsOfServicePage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms of service"
        lede={`Last updated ${LEGAL_LAST_UPDATED}. There is no live product yet, so there is no service agreement yet — just terms for this site and its waitlist.`}
        ledeMaxCh="62ch"
      />

      <section className="mx-auto max-w-[1400px] px-[clamp(20px,4vw,44px)] pb-24">
        <Panel>
          <PanelHeading>Pre-launch terms</PanelHeading>
          {TERMS_SECTIONS.map((section) => (
            <div key={section.heading} className="border-border flex flex-wrap gap-6 border-b px-6 py-5">
              <span className="basis-[210px] text-[0.92rem] font-extrabold tracking-[-0.01em]">
                {section.heading}
              </span>
              <span className="text-text-secondary min-w-0 flex-[1_1_320px] text-[0.91rem] leading-[1.5]">
                {section.body}
              </span>
            </div>
          ))}
        </Panel>
      </section>

      <BottomCta />
    </>
  );
}
