import type { Metadata } from 'next';

import { Panel, PanelHeading } from '@/components/panel';
import { WaitlistForm } from '@/components/waitlist-form';
import { WAITLIST_FACTS } from '@/lib/marketing-content';

export const metadata: Metadata = {
  title: 'Early access',
  description:
    'Early access opens module by module, starting with Productivity and the 6:00 brief. One email when it is your turn — no newsletter, no countdown.',
};

export default function WaitlistPage() {
  return (
    <section className="mx-auto flex max-w-[1400px] flex-wrap items-start gap-[clamp(32px,5vw,56px)] px-[clamp(20px,4vw,44px)] pt-[104px] pb-24">
      <div className="min-w-0 flex-[1.1_1_360px]">
        <p className="text-signal font-mono m-0 mb-[18px] text-[0.74rem] leading-none font-bold tracking-[0.12em] uppercase">
          Early access
        </p>
        <h1 className="m-0 mb-5 max-w-[20ch] text-[clamp(2.2rem,6.6vw,3.4rem)] leading-[1.02] tracking-[-0.034em] text-balance">
          Get the first brief when it&rsquo;s real.
        </h1>
        <p className="text-text-secondary m-0 mb-8 max-w-[52ch] text-[clamp(1rem,2.1vw,1.14rem)] leading-[1.5]">
          Early access opens module by module, starting with Productivity and the 6:00 brief. We
          will write once when it is your turn, and not otherwise.
        </p>

        <WaitlistForm
          layout="stacked"
          note="One email when early access opens. No newsletter, no launch countdown, no sharing your address with anyone."
        />
      </div>

      <div className="min-w-0 flex-[1_1_320px]">
        <Panel>
          <PanelHeading>What you are joining</PanelHeading>
          {WAITLIST_FACTS.map((fact) => (
            <div key={fact.title} className="border-border grid gap-[5px] border-b px-[22px] py-5">
              <p className="m-0 text-[0.93rem] font-extrabold tracking-[-0.01em]">{fact.title}</p>
              <p className="text-text-secondary m-0 text-[0.88rem] leading-[1.5]">{fact.body}</p>
            </div>
          ))}
        </Panel>
      </div>
    </section>
  );
}
