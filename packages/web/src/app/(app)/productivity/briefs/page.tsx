import { ButtonLink } from '@/components/ui/button';

export default function BriefsPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Productivity</p>
        <h1 className="text-ink m-0 text-[1.55rem] font-extrabold tracking-[-0.02em]">Briefs</h1>
        <p className="text-text-secondary m-0 mt-2 max-w-[62ch] text-[0.92rem] leading-[1.5]">
          Your daily operational brief — delivered at 6:00 AM. A narrative summary of priorities, due-outs, and schedule.
        </p>
      </div>

      <div className="rounded-[8px] border border-dashed border-border px-6 py-12 text-center">
        <p className="text-ink m-0 text-[1rem] font-bold">No briefs generated yet</p>
        <p className="text-text-secondary m-0 mt-2 text-[0.88rem]">
          Once email and calendar are synced, the daily brief will be generated automatically each morning.
        </p>
        <ButtonLink href="/productivity/email" className="mt-4" size="medium">
          Check email sync
        </ButtonLink>
      </div>
    </div>
  );
}
