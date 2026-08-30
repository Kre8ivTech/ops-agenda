import { Button } from '@/components/ui/button';
import { approveExtractedAction, dismissExtractedAction } from '@/lib/dashboard/actions';

export interface ExtractionBannerProps {
  count: number;
}

export function ExtractionBanner({ count }: ExtractionBannerProps) {
  if (count === 0) return null;

  return (
    <div className="border-border flex items-center justify-between rounded-[8px] border bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="bg-signal inline-flex h-[24px] items-center rounded-[4px] px-2 text-[0.68rem] font-extrabold uppercase text-white">
          New
        </span>
        <p className="text-ink m-0 text-[0.88rem]">
          <strong className="font-extrabold">
            {count} commitment{count !== 1 ? 's' : ''}
          </strong>{' '}
          {count === 1 ? 'was' : 'were'} extracted from mail overnight. Approve{' '}
          {count === 1 ? 'it' : 'them'} to add to the board.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <form action={approveExtractedAction}>
          <Button type="submit" variant="primary" size="medium">
            Approve all
          </Button>
        </form>
        <form action={dismissExtractedAction}>
          <Button type="submit" variant="ghost" size="medium">
            Dismiss
          </Button>
        </form>
      </div>
    </div>
  );
}
