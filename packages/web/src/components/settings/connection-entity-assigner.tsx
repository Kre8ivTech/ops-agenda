'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { assignConnectionEntity } from '@/lib/entities/actions';
import type { EntityOption } from '@/lib/entities/queries';

export function ConnectionEntityAssigner({
  connectionId,
  accountLabel,
  entityId,
  entities,
}: {
  connectionId: string;
  accountLabel: string;
  entityId: string | null;
  entities: EntityOption[];
}) {
  const router = useRouter();
  const [selection, setSelection] = useState(entityId ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <select
          name="entityId"
          value={selection}
          disabled={isPending}
          aria-label={`Entity for ${accountLabel}`}
          aria-describedby={error ? `connection-entity-error-${connectionId}` : undefined}
          className="border-border text-ink focus:border-signal h-9 min-w-36 rounded-[8px] border bg-white px-2.5 text-[0.78rem] font-bold outline-none focus:shadow-[0_0_0_3px_var(--wash-green)] disabled:cursor-wait disabled:opacity-60"
          onChange={(event) => {
            setSelection(event.target.value);
            setSaved(false);
            setError(null);
          }}
        >
          <option value="" disabled>
            Unassigned
          </option>
          {entities.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="secondary"
          size="small"
          disabled={isPending || !selection || selection === (entityId ?? '')}
          onClick={() => {
            setError(null);
            setSaved(false);
            startTransition(async () => {
              try {
                await assignConnectionEntity({ connectionId, entityId: selection });
                setSaved(true);
                router.refresh();
              } catch {
                setError('Could not save entity. Try again.');
              }
            });
          }}
        >
          {isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
      {error ? (
        <span
          id={`connection-entity-error-${connectionId}`}
          className="text-risk text-[0.7rem]"
          role="alert"
        >
          {error}
        </span>
      ) : saved ? (
        <span className="text-signal text-[0.7rem] font-bold" role="status">
          Saved
        </span>
      ) : null}
    </div>
  );
}
