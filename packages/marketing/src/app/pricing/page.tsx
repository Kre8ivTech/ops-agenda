import type { Metadata } from 'next';

import { BottomCta } from '@/components/bottom-cta';
import { PageHeader } from '@/components/page-header';
import { Panel, PanelHeading } from '@/components/panel';
import { PricingCard } from '@/components/pricing-card';
import { PLANS, PRICING_FAQ } from '@/lib/marketing-content';
import { pageMetadata } from '@/lib/seo';
import { SHOW_PRICING_AMOUNTS } from '@/lib/site-config';

export const metadata: Metadata = pageMetadata({
  title: 'Pricing',
  description:
    'Three plans, billed monthly, cancel any time. Your plan sets how many modules and entities you can use — nothing is metered by usage.',
  path: '/pricing',
});

const PRICING_LEDE = SHOW_PRICING_AMOUNTS
  ? 'Billed monthly, cancel any time. Your plan sets how many modules and entities you can use — nothing is metered by usage.'
  : 'Final pricing lands with early access. Three tiers, billed monthly, cancel any time — your plan sets how many modules and entities you can use, and nothing is metered by usage.';

const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: PRICING_FAQ.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <PageHeader
        eyebrow="Pricing"
        title="Three plans. Your plan decides which modules you can turn on."
        lede={PRICING_LEDE}
        ledeMaxCh="58ch"
      />

      <section className="mx-auto grid max-w-[1400px] grid-cols-[repeat(auto-fit,minmax(290px,1fr))] items-start gap-4 px-[clamp(20px,4vw,44px)] pb-11">
        {PLANS.map((plan) => (
          <PricingCard key={plan.name} plan={plan} />
        ))}
      </section>

      <section className="mx-auto max-w-[1400px] px-[clamp(20px,4vw,44px)] pb-24">
        <Panel>
          <PanelHeading>Questions we would ask too</PanelHeading>
          {PRICING_FAQ.map((item) => (
            <div key={item.question} className="border-border border-b px-[26px] py-[22px]">
              <p className="m-0 mb-1.5 text-[0.97rem] font-extrabold tracking-[-0.01em]">
                {item.question}
              </p>
              <p className="text-text-secondary m-0 max-w-[76ch] text-[0.92rem] leading-[1.55]">
                {item.answer}
              </p>
            </div>
          ))}
        </Panel>
      </section>

      <BottomCta />
    </>
  );
}
