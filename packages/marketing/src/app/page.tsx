import type { Metadata } from 'next';
import Link from 'next/link';

import { BottomCta } from '@/components/bottom-cta';
import { BriefPreview } from '@/components/brief-preview';
import { InkGrid, InkGridCell } from '@/components/panel';
import { WaitlistForm } from '@/components/waitlist-form';
import { BRIEF_NOTES, CROSS_FLOWS, MODULES, PROMISES, TRUST_STRIP } from '@/lib/marketing-content';
import { pageMetadata } from '@/lib/seo';
import { HERO_EYEBROW } from '@/lib/site-config';

export const metadata: Metadata = pageMetadata({
  // No `title` here — the layout's `title.default` already is this exact
  // string, and setting it again would run it through `title.template` and
  // duplicate the " — Ops Agenda" suffix.
  ogTitle: "Ops Agenda — It watches the things you'd only notice too late.",
  description:
    'Ops Agenda reads the systems you already use, ranks your entire day by what is genuinely at risk, and hands you one agenda at 6:00 each morning. Read-only by design: it can see and flag, never move or file.',
  path: '/',
});

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-[1400px] px-[clamp(20px,4vw,44px)] pt-24 pb-[72px]">
        <p className="text-signal font-mono m-0 mb-5 text-[0.74rem] leading-none font-bold tracking-[0.12em] uppercase">
          {HERO_EYEBROW}
        </p>
        <h1 className="m-0 mb-[22px] max-w-[19ch] text-[clamp(2.4rem,7.4vw,4.1rem)] leading-none tracking-[-0.035em] text-balance">
          It watches the things you&rsquo;d only notice too late.
        </h1>
        <p className="text-text-secondary m-0 mb-[34px] max-w-[58ch] text-[clamp(1.02rem,2.3vw,1.22rem)] leading-[1.5]">
          Ops Agenda reads the systems you already use, ranks your entire day by what is genuinely
          at risk, and hands you one agenda at 6:00 each morning. Read-only by design: it can see
          and flag, never move or file.
        </p>

        <div className="mb-[22px]">
          <WaitlistForm successBody="We'll write when there is something real to show you — not before, and not weekly." />
        </div>
        <p className="text-text-secondary m-0 mb-14 text-[0.84rem]">
          No launch-day spam. One email when early access opens.
        </p>

        <div className="border-border bg-border grid grid-cols-1 gap-px overflow-hidden rounded-[12px] border sm:grid-cols-2 xl:grid-cols-4">
          {TRUST_STRIP.map((item) => (
            <div key={item.label} className="bg-white px-[22px] py-5">
              <p className="text-signal font-mono m-0 mb-[5px] text-[0.72rem] leading-none font-bold tracking-[0.08em] uppercase">
                {item.label}
              </p>
              <p className="text-text-secondary m-0 text-[0.87rem] leading-[1.45]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-[clamp(20px,4vw,44px)] pb-24">
        <div className="border-border rounded-[14px] border bg-white px-[clamp(24px,4.4vw,52px)] py-[clamp(34px,5vw,56px)]">
          <p className="text-signal font-mono m-0 mb-[18px] text-[0.74rem] leading-none font-bold tracking-[0.1em] uppercase">
            Why things slip
          </p>
          <h2 className="m-0 mb-5 max-w-[34ch] text-[clamp(1.65rem,4vw,2.1rem)] leading-[1.1] tracking-[-0.025em] text-balance">
            Nothing that goes wrong is a productivity problem.
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[26px]">
            <p className="text-text-secondary m-0 text-base leading-[1.55]">
              The annual report was due in eleven days and nobody was looking at that particular
              calendar. The vendor replied twice and the thread had no owner. The certification
              lapses in August and the renewal takes six weeks.
            </p>
            <p className="text-text-secondary m-0 text-base leading-[1.55]">
              Each one is small. Each one is expensive. And none of them were on a to-do list,
              because you would have had to already know about them to put them there.
            </p>
            <p className="text-ink m-0 text-base leading-[1.55] font-semibold">
              That is the actual job: noticing. Not another place to type what you already remember.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-[clamp(20px,4vw,44px)] pb-24">
        <div className="border-border mb-[30px] flex items-baseline gap-4 border-b pb-[18px]">
          <span className="text-signal font-mono text-[0.74rem] leading-none font-bold tracking-[0.1em]">
            06:00
          </span>
          <h2 className="m-0 text-[clamp(1.5rem,3.6vw,1.9rem)] tracking-[-0.025em]">
            What lands every morning
          </h2>
        </div>

        <div className="flex flex-wrap items-start gap-[30px]">
          <BriefPreview />

          <div className="grid min-w-0 flex-[1_1_320px] gap-[14px]">
            {BRIEF_NOTES.map((note) => (
              <div
                key={note.label}
                className="border-border rounded-[12px] border bg-white px-6 py-[22px]"
              >
                <p className="text-signal font-mono m-0 mb-1.5 text-[0.72rem] leading-none font-bold tracking-[0.08em] uppercase">
                  {note.label}
                </p>
                <p className="text-text-secondary m-0 text-[0.92rem] leading-[1.5]">{note.body}</p>
              </div>
            ))}
            <div className="border-border bg-wash rounded-[12px] border px-6 py-[22px]">
              <p className="text-ink m-0 text-[0.95rem] leading-[1.5] font-semibold">
                It proposes. You approve. Nothing in Ops Agenda takes an action on your behalf.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ink mb-24 px-[clamp(20px,4vw,44px)] py-[76px]">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-signal-on-ink font-mono m-0 mb-[18px] text-[0.74rem] leading-none font-bold tracking-[0.12em] uppercase">
            The difference
          </p>
          <h2 className="m-0 mb-5 max-w-[30ch] text-[clamp(1.75rem,4.4vw,2.3rem)] leading-[1.08] tracking-[-0.028em] text-[var(--paper)] text-balance">
            Your life and your companies are the same day.
          </h2>
          <p className="m-0 mb-10 max-w-[60ch] text-[1.06rem] leading-[1.55] text-[rgba(247,247,242,0.72)]">
            Most tools handle one column of your life and pretend the others don&rsquo;t exist. The
            value is in the connections — and the connections are where things fall through.
          </p>
          <InkGrid>
            {CROSS_FLOWS.map((flow) => (
              <InkGridCell key={flow.from} label={flow.from} body={flow.body} />
            ))}
          </InkGrid>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-[clamp(20px,4vw,44px)] pb-24">
        <div className="border-border mb-[30px] flex flex-wrap items-baseline justify-between gap-5 border-b pb-[18px]">
          <div className="flex items-baseline gap-4">
            <span className="text-signal font-mono text-[0.74rem] leading-none font-bold tracking-[0.1em]">
              Eight modules
            </span>
            <h2 className="m-0 text-[clamp(1.5rem,3.6vw,1.9rem)] tracking-[-0.025em]">
              Turn on only what you need
            </h2>
          </div>
          <Link href="/modules" className="text-signal text-[0.88rem] font-bold">
            All modules →
          </Link>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(258px,1fr))] gap-4">
          {MODULES.map((module) => (
            <Link
              key={module.key}
              href={`/modules/${module.key}`}
              className="border-border hover:border-ink grid content-start gap-[9px] rounded-[12px] border bg-white px-6 py-[22px] transition-colors"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[1.05rem] font-extrabold tracking-[-0.015em]">
                  {module.name}
                </span>
                <span className="text-text-secondary font-mono text-[0.72rem] leading-none font-bold">
                  {module.screens.length} screens
                </span>
              </div>
              <p className="text-text-secondary m-0 text-[0.88rem] leading-[1.45]">{module.lede}</p>
            </Link>
          ))}
        </div>

        <p className="text-text-secondary m-0 mt-[22px] max-w-[64ch] text-[0.9rem] leading-[1.5]">
          Anything switched off is hidden completely — no empty sections, no greyed-out menu items,
          no data kept past thirty days.
        </p>
      </section>

      <section className="mx-auto max-w-[1400px] px-[clamp(20px,4vw,44px)] pb-24">
        <div className="border-border overflow-hidden rounded-[14px] border bg-white">
          <div className="border-border border-b px-[clamp(24px,4vw,48px)] pt-[clamp(32px,4.4vw,44px)] pb-[clamp(26px,3.4vw,34px)]">
            <p className="text-signal font-mono m-0 mb-4 text-[0.74rem] leading-none font-bold tracking-[0.1em] uppercase">
              Four promises
            </p>
            <h2 className="m-0 mb-[14px] max-w-[32ch] text-[clamp(1.65rem,4vw,2.1rem)] leading-[1.1] tracking-[-0.025em] text-balance">
              The constraints are the product.
            </h2>
            <p className="text-text-secondary m-0 max-w-[62ch] text-base leading-[1.55]">
              A tool that can see your entire financial and medical life should be able to do less,
              not more. Each of these is a limit we designed in, and each one is written into the
              interface where it applies.
            </p>
          </div>

          <div className="border-border bg-border flex flex-wrap gap-px overflow-hidden border-t">
            {PROMISES.map((promise) => (
              <div
                key={promise.title}
                className="grid min-w-0 grow basis-[290px] content-start gap-2 bg-white px-[clamp(22px,3vw,28px)] py-6"
              >
                <p className="m-0 text-base font-extrabold tracking-[-0.01em]">{promise.title}</p>
                <p className="text-text-secondary m-0 text-[0.89rem] leading-[1.5]">
                  {promise.body}
                </p>
              </div>
            ))}
          </div>

          <div className="border-border bg-wash flex flex-wrap items-center justify-between gap-5 border-t px-[clamp(24px,4vw,48px)] py-[22px]">
            <p className="text-ink m-0 text-[0.93rem] font-semibold">
              Encryption, audit, compliance posture and what we will never build.
            </p>
            <Link
              href="/security"
              className="text-signal text-[0.9rem] font-extrabold whitespace-nowrap"
            >
              Read security &amp; privacy →
            </Link>
          </div>
        </div>
      </section>

      <BottomCta />
    </>
  );
}
