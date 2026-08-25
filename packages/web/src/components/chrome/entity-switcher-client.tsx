'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { setSelectedEntity } from '@/lib/entities/actions';
import type { EntityOption } from '@/lib/entities/queries';

export function EntitySwitcherClient({
  entities,
  selectedEntityId,
}: {
  entities: EntityOption[];
  selectedEntityId: string | 'all';
}) {
  const router = useRouter();
  const [selection, setSelection] = useState(selectedEntityId);
  const [isPending, startTransition] = useTransition();

  return (
    <label className="text-text-secondary inline-flex items-center gap-2 text-[0.82rem]">
      <span className="text-ink font-extrabold">Entity</span>
      <select
        className="border-border text-ink focus:border-signal h-9 min-w-36 rounded-[8px] border bg-white px-3 text-[0.83rem] font-extrabold outline-none focus:shadow-[0_0_0_3px_var(--wash-green)] disabled:opacity-60"
        value={selection}
        disabled={isPending}
        aria-label="Entity switcher"
        onChange={(event) => {
          const nextSelection = event.target.value;
          setSelection(nextSelection);
          startTransition(async () => {
            await setSelectedEntity(nextSelection);
            router.refresh();
          });
        }}
      >
        <option value="all">All entities</option>
        {entities.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}
