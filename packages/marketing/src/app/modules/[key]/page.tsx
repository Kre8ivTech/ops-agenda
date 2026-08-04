import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BottomCta } from '@/components/bottom-cta';
import { PageHeader } from '@/components/page-header';
import { MODULES } from '@/lib/marketing-content';

interface ModulePageProps {
  params: Promise<{ key: string }>;
}

export function generateStaticParams() {
  return MODULES.map((entry) => ({ key: entry.key }));
}

export async function generateMetadata({ params }: ModulePageProps): Promise<Metadata> {
  const { key } = await params;
  const found = MODULES.find((entry) => entry.key === key);

  if (!found) return {};

  return { title: found.name, description: found.lede };
}

export default async function ModuleDetailPage({ params }: ModulePageProps) {
  const { key } = await params;
  const found = MODULES.find((entry) => entry.key === key);

  if (!found) notFound();

  const moduleEntry = found;

  return (
    <>
      <PageHeader
        eyebrow={`Module · ${moduleEntry.screens.length} screens`}
        title={moduleEntry.name}
        lede={moduleEntry.lede}
        titleMaxCh="none"
      >
        <Link
          href="/modules"
          className="text-signal font-mono mb-[22px] inline-block text-[0.8rem] leading-none font-bold"
        >
          ← All modules
        </Link>
      </PageHeader>

      <section className="mx-auto grid max-w-[1400px] grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 px-[clamp(20px,4vw,44px)] pb-11">
        {moduleEntry.covers.map((cover) => (
          <div
            key={cover.title}
            className="border-border grid content-start gap-[9px] rounded-[12px] border bg-white px-[clamp(22px,3vw,28px)] py-6"
          >
            <p className="m-0 text-[1.02rem] font-extrabold tracking-[-0.015em]">{cover.title}</p>
            <p className="text-text-secondary m-0 text-[0.9rem] leading-[1.5]">{cover.body}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto grid max-w-[1400px] grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] items-start gap-4 px-[clamp(20px,4vw,44px)] pb-24">
        <div className="border-border rounded-[12px] border bg-white px-[clamp(24px,3.2vw,30px)] py-[26px]">
          <p className="text-signal font-mono m-0 mb-4 text-[0.72rem] leading-none font-bold tracking-[0.08em] uppercase">
            Screens
          </p>
          <div className="flex flex-wrap gap-2">
            {moduleEntry.screens.map((screen) => (
              <span
                key={screen}
                className="border-border bg-paper text-ink inline-flex h-8 items-center rounded-full border px-3 text-[0.83rem] font-semibold"
              >
                {screen}
              </span>
            ))}
          </div>
        </div>

        <div className="border-border bg-wash grid content-start gap-2.5 rounded-[12px] border px-[clamp(24px,3.2vw,30px)] py-[26px]">
          <p className="text-signal font-mono m-0 text-[0.72rem] leading-none font-bold tracking-[0.08em] uppercase">
            The constraint
          </p>
          <p className="text-ink m-0 text-base leading-[1.55] font-semibold">{moduleEntry.constraint}</p>
          <p className="text-text-secondary m-0 text-[0.89rem] leading-[1.5]">
            {moduleEntry.constraintWhy}
          </p>
        </div>
      </section>

      <BottomCta />
    </>
  );
}
