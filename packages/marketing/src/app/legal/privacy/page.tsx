import type { Metadata } from 'next';

import { BottomCta } from '@/components/bottom-cta';
import { PageHeader } from '@/components/page-header';
import { Panel, PanelHeading } from '@/components/panel';
import { LEGAL_LAST_UPDATED, PRIVACY_SECTIONS } from '@/lib/legal-content';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Privacy policy',
  description:
    'What this pre-launch site collects (just a waitlist email), how it is used and stored, and how to have it removed.',
  path: '/legal/privacy',
});

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy policy"
        lede={`Last updated ${LEGAL_LAST_UPDATED}. This covers the pre-launch marketing site and its waitlist form — nothing else exists yet to have a policy about.`}
        ledeMaxCh="62ch"
      />

      <section className="mx-auto max-w-[1400px] px-[clamp(20px,4vw,44px)] pb-24">
        <Panel>
          <PanelHeading>What&rsquo;s actually true today</PanelHeading>
          {PRIVACY_SECTIONS.map((section) => (
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
