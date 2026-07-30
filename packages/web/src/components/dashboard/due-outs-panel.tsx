import { MarkHandledCheck } from '@/components/dashboard/mark-handled-button';
import { formatDueLabel, type DashboardTask } from '@/lib/dashboard/brief';

export function DueOutsPanel({ items, now }: { items: DashboardTask[]; now: Date }) {
  return (
    <section className="border-border bg-white/88 rounded-[8px] border p-[18px] shadow-[var(--shadow-panel)]">
      <div className="mb-3 flex items-start justify-between gap-[18px]">
        <div>
          <p className="text-signal m-0 mb-1.5 text-[0.76rem] font-extrabold uppercase">Due-outs</p>
          <h2 className="text-ink m-0 text-[1.15rem] font-extrabold leading-[1.1] tracking-[-0.01em]">
            Owed by you
          </h2>
        </div>
        <span className="text-text-secondary text-[0.86rem] font-extrabold">
          {items.length} open
        </span>
      </div>

      {items.length === 0 ? (
        <p className="border-border text-text-secondary m-0 border-t pt-3 text-[0.88rem]">
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
                className="border-border grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[11px] border-t py-[11px]"
              >
                <MarkHandledCheck taskId={item.id} title={item.title} />
                <span className="grid min-w-0 gap-0.5">
                  <strong className="text-ink truncate text-[0.88rem] font-bold">
                    {item.title}
                  </strong>
                  <span className="text-text-secondary truncate text-[0.78rem]">
                    {item.priority.toUpperCase()}
                  </span>
                </span>
                <span
                  className={`whitespace-nowrap rounded-full px-2 py-1 font-mono text-[0.72rem] font-bold leading-[1.4] ${
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
