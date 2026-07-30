import { MarkHandledCheck } from '@/components/dashboard/mark-handled-button';
import { formatDueLabel, type DashboardTask } from '@/lib/dashboard/brief';

export function DueOutsPanel({
  items,
  tenant,
  now,
}: {
  items: DashboardTask[];
  tenant: { accountId: string; userId: string };
  now: Date;
}) {
  return (
    <section className="rounded-[8px] border border-border bg-white/88 p-[18px] shadow-[var(--shadow-panel)]">
      <div className="mb-3 flex items-start justify-between gap-[18px]">
        <div>
          <p className="m-0 mb-1.5 text-[0.76rem] font-extrabold uppercase text-signal">Due-outs</p>
          <h2 className="m-0 text-[1.15rem] leading-[1.1] font-extrabold tracking-[-0.01em] text-ink">
            Owed by you
          </h2>
        </div>
        <span className="text-[0.86rem] font-extrabold text-text-secondary">
          {items.length} open
        </span>
      </div>

      {items.length === 0 ? (
        <p className="m-0 border-t border-border pt-3 text-[0.88rem] text-text-secondary">
          No dated due-outs. Add a due date on a task to see it here.
        </p>
      ) : (
        <div className="grid">
          {items.map((item) => {
            const when = formatDueLabel(item, now);
            const hot = when === 'At risk' || when === 'Overdue';
            return (
              <div
                key={item.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[11px] border-t border-border py-[11px]"
              >
                <MarkHandledCheck tenant={tenant} taskId={item.id} title={item.title} />
                <span className="grid min-w-0 gap-0.5">
                  <strong className="truncate text-[0.88rem] font-bold text-ink">{item.title}</strong>
                  <span className="truncate text-[0.78rem] text-text-secondary">
                    {item.priority.toUpperCase()}
                  </span>
                </span>
                <span
                  className={`whitespace-nowrap rounded-full px-2 py-1 font-mono text-[0.72rem] leading-[1.4] font-bold ${
                    hot ? 'bg-risk-wash text-risk' : 'bg-wash text-text-secondary'
                  }`}
                >
                  {when}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
