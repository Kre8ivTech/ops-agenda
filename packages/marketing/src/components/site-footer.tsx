import Link from 'next/link';

import { Lockup } from '@/components/lockup';
import { FOOTER_COLUMNS } from '@/lib/site-config';

export function SiteFooter() {
  return (
    <footer className="border-border mt-auto border-t bg-white">
      <div className="mx-auto grid max-w-[1400px] grid-cols-[repeat(auto-fit,minmax(min(100%,190px),1fr))] gap-8 px-[clamp(20px,4vw,44px)] py-11">
        <div className="min-w-0">
          <Lockup size={30} className="mb-[14px]" />
          <p className="text-text-secondary m-0 max-w-[36ch] text-[0.86rem] leading-[1.55]">
            One prioritised agenda every morning, from the systems you already use. Read-only by
            design.
          </p>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title} className="grid min-w-0 content-start gap-2.5">
            <p className="text-text-secondary m-0 font-mono text-[0.72rem] font-bold uppercase tracking-[0.08em]">
              {column.title}
            </p>
            {column.links.map((link) => (
              <Link
                key={`${column.title}-${link.label}`}
                href={link.href}
                className="text-ink hover:text-signal text-[0.87rem] font-semibold transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className="border-border border-t">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-5 px-[clamp(20px,4vw,44px)] py-5">
          <span className="text-text-secondary font-mono text-[0.8rem] font-semibold">
            © 2026 Ops Agenda · Pre-launch
          </span>
          <span className="text-text-secondary text-[0.83rem]">
            No trackers on this site either.
          </span>
        </div>
      </div>
    </footer>
  );
}
