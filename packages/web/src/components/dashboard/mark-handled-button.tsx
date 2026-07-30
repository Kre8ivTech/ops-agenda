'use client';

import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { markHandledAction, reopenAction } from '@/lib/dashboard/actions';

function SubmitLabel({ idle, pending }: { idle: string; pending: string }) {
  const { pending: isPending } = useFormStatus();
  return <>{isPending ? pending : idle}</>;
}

export function MarkHandledButton({
  tenant,
  taskId,
}: {
  tenant: { accountId: string; userId: string };
  taskId: string;
}) {
  return (
    <form action={markHandledAction}>
      <input type="hidden" name="accountId" value={tenant.accountId} />
      <input type="hidden" name="userId" value={tenant.userId} />
      <input type="hidden" name="id" value={taskId} />
      <Button type="submit" size="small">
        <SubmitLabel idle="Mark handled" pending="Saving…" />
      </Button>
    </form>
  );
}

/** Checkbox-sized control for dense due-out rows. */
export function MarkHandledCheck({
  tenant,
  taskId,
  title,
}: {
  tenant: { accountId: string; userId: string };
  taskId: string;
  title: string;
}) {
  return (
    <form action={markHandledAction}>
      <input type="hidden" name="accountId" value={tenant.accountId} />
      <input type="hidden" name="userId" value={tenant.userId} />
      <input type="hidden" name="id" value={taskId} />
      <button
        type="submit"
        title={`Mark handled: ${title}`}
        aria-label={`Mark handled: ${title}`}
        className="border-border hover:border-signal hover:bg-wash-green focus-visible:outline-signal size-4 shrink-0 rounded-[5px] border-[1.5px] bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      />
    </form>
  );
}

export function ReopenButton({
  tenant,
  taskId,
}: {
  tenant: { accountId: string; userId: string };
  taskId: string;
}) {
  return (
    <form action={reopenAction}>
      <input type="hidden" name="accountId" value={tenant.accountId} />
      <input type="hidden" name="userId" value={tenant.userId} />
      <input type="hidden" name="id" value={taskId} />
      <Button type="submit" variant="quiet" size="small">
        <SubmitLabel idle="Reopen" pending="Saving…" />
      </Button>
    </form>
  );
}
