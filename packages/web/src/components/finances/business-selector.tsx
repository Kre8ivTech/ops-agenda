'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { setSelectedEntity } from '@/lib/entities/actions';

export interface BusinessSelectorOption {
  id: string;
  name: string;
}

export function BusinessSelector({
  businesses,
  selectedBusinessId,
}: {
  businesses: BusinessSelectorOption[];
  selectedBusinessId: string | 'all';
}) {
  const router = useRouter();
  const [selection, setSelection] = useState(selectedBusinessId);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="grid min-w-[14rem] gap-1.5">
      <label className="grid gap-1.5">
        <span className="text-text-secondary text-[0.7rem] font-extrabold uppercase tracking-[0.08em]">
          Business
        </span>
        <span className="relative">
          <select
            className="border-border text-ink focus:border-signal h-10 w-full appearance-none rounded-[8px] border bg-white py-0 pl-3 pr-10 text-[0.84rem] font-extrabold outline-none transition-colors focus:shadow-[0_0_0_3px_var(--wash-green)] disabled:cursor-wait disabled:opacity-60"
            value={selection}
            disabled={isPending}
            aria-label="Choose a business"
            aria-describedby={error ? 'business-selector-error' : undefined}
            onChange={(event) => {
              const previousSelection = selection;
              const nextSelection = event.target.value;
              setSelection(nextSelection);
              setError(null);
              startTransition(async () => {
                try {
                  await setSelectedEntity(nextSelection);
                  router.refresh();
                } catch {
                  setSelection(previousSelection);
                  setError('Could not change business. Try again.');
                }
              });
            }}
          >
            <option value="all">All businesses</option>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
          <span
            className="text-text-secondary pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[0.7rem]"
            aria-hidden="true"
          >
            {isPending ? '…' : '▾'}
          </span>
        </span>
      </label>
      {error ? (
        <span id="business-selector-error" className="text-risk text-[0.7rem]" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
