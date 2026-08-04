import Link from 'next/link';

import type { Plan } from '@/lib/marketing-content';
import { CTA_LABEL_TEXT, SHOW_PRICING_AMOUNTS } from '@/lib/site-config';
import { PILL_TONE } from '@/lib/tone';

export function PricingCard({ plan }: { plan: Plan }) {
  return (
    <article
      className={`grid content-start gap-[18px] rounded-[14px] border bg-white px-[clamp(24px,3.2vw,30px)] py-[clamp(26px,3.4vw,32px)] ${
        plan.featured ? 'border-ink' : 'border-border'
      }`}
    >
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[1.2rem] font-extrabold tracking-[-0.02em]">{plan.name}</span>
          <span
            className={`rounded-full px-2 py-1 font-mono text-[0.68rem] font-extrabold leading-none ${PILL_TONE[plan.tagTone]}`}
          >
            {plan.tag}
          </span>
        </div>
        <span
          className={`text-[1.7rem] font-extrabold tracking-[-0.025em] ${
            SHOW_PRICING_AMOUNTS ? 'text-ink' : 'text-text-secondary'
          }`}
        >
          {SHOW_PRICING_AMOUNTS ? plan.price : 'Pricing at launch'}
        </span>
        <p className="text-text-secondary m-0 text-[0.89rem] leading-[1.45]">{plan.who}</p>
      </div>

      <div className="border-border grid gap-[9px] border-t pt-4">
        {plan.lines.map((line) => (
          <div key={line} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2.5">
            <span className="bg-signal mt-[7px] h-[5px] w-[5px] rounded-full" />
            <span className="text-text-secondary text-[0.89rem] leading-[1.45]">{line}</span>
          </div>
        ))}
      </div>

      <Link
        href="/waitlist"
        className={`inline-flex h-11 items-center justify-center rounded-[8px] border text-[0.88rem] font-extrabold transition-colors ${
          plan.featured
            ? 'bg-ink border-ink hover:bg-signal hover:border-signal text-[var(--paper)]'
            : 'border-border text-ink hover:border-ink bg-white'
        }`}
      >
        {CTA_LABEL_TEXT}
      </Link>
    </article>
  );
}
