import type { Metadata } from 'next';
import Link from 'next/link';

import { BottomCta } from '@/components/bottom-cta';
import { PageHeader } from '@/components/page-header';
import { MODULES } from '@/lib/marketing-content';
import { pageMetadata } from '@/lib/seo';
import { PILL_TONE } from '@/lib/tone';

export const metadata: Metadata = pageMetadata({
  title: 'Modules',
  description:
    'Eight modules covering plan, productivity, finances, business, health, life, research and social. Turn on what you need — what you switch off is absent, not disabled.',
  path: '/modules',
});

export default function ModulesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Modules"
        title="Eight modules. Sixty-three screens. Turn on what you need."
        lede="Each module is a domain of your life or business, with its own screens and its own constraints. What you switch off is absent — not disabled, not empty, not retained."
        titleMaxCh="24ch"
      />

      <section className="mx-auto grid max-w-[1400px] gap-4 px-[clamp(20px,4vw,44px)] pb-24">
        {MODULES.map((module) => (
          <Link
            key={module.key}
            href={`/modules/${module.key}`}
            className="border-border hover:border-ink grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 rounded-[14px] border bg-white px-[clamp(22px,3.4vw,34px)] py-[clamp(24px,3.4vw,30px)] transition-colors"
          >
            <div className="grid min-w-0 gap-[9px]">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-[1.3rem] font-extrabold tracking-[-0.02em]">
                  {module.name}
                </span>
                <span className="text-text-secondary font-mono text-[0.72rem] leading-none font-bold">
                  {module.screens.length} screens
                </span>
                <span
                  className={`font-mono rounded-full px-2 py-1 text-[0.68rem] leading-none font-extrabold ${
                    module.status === 'Post-launch' ? PILL_TONE.risk : PILL_TONE.signal
                  }`}
                >
                  {module.status}
                </span>
              </div>
              <p className="text-text-secondary m-0 max-w-[70ch] text-[0.95rem] leading-[1.5]">
                {module.lede}
              </p>
              <p className="text-text-secondary m-0 text-[0.84rem] leading-[1.5]">
                {module.screens.join(' · ')}
              </p>
            </div>
            <span className="text-signal text-[1.1rem] font-extrabold">→</span>
          </Link>
        ))}
      </section>

      <BottomCta />
    </>
  );
}
