import Link from 'next/link';

import { CTA_LABEL_TEXT } from '@/lib/site-config';

/** The closing CTA band. Shown on every page except the waitlist itself. */
export function BottomCta() {
  return (
    <section className="mx-auto max-w-[1400px] px-[clamp(20px,4vw,44px)] pb-24">
      <div className="border-border flex flex-wrap items-center justify-between gap-8 rounded-[14px] border bg-white px-[clamp(24px,4vw,48px)] py-[clamp(34px,5vw,52px)]">
        <div className="min-w-0">
          <h2 className="m-0 mb-3 max-w-[26ch] text-[clamp(1.6rem,3.8vw,2rem)] leading-[1.1] tracking-[-0.026em] text-balance">
            One agenda, every morning, from what you already have.
          </h2>
          <p className="text-text-secondary m-0 max-w-[56ch] text-base leading-[1.55]">
            Early access opens module by module. Join the list and we will write once when it is
            your turn.
          </p>
        </div>
        <Link
          href="/waitlist"
          className="bg-ink hover:bg-signal inline-flex h-[52px] items-center rounded-[8px] px-[26px] font-extrabold whitespace-nowrap text-[var(--paper)] transition-colors"
        >
          {CTA_LABEL_TEXT}
        </Link>
      </div>
    </section>
  );
}
