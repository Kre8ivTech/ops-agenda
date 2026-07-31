const ROWS = [
  {
    priority: 'P1',
    pill: 'bg-wash-green text-signal',
    title: 'Send Q3 board update',
    meta: 'Finance numbers still missing',
    status: 'At risk',
    statusClass: 'bg-risk-wash text-risk',
  },
  {
    priority: 'P2',
    pill: 'bg-info-wash text-info',
    title: 'Renew payroll processor contract',
    meta: 'Auto-renews in 5 days',
    status: 'Needs attention',
    statusClass: 'bg-info-wash text-info',
  },
  {
    priority: 'P3',
    pill: 'bg-wash text-text-secondary',
    title: 'Review vendor W-9 for Acme Corp',
    meta: 'No blocking due date',
    status: 'Open',
    statusClass: 'bg-wash text-text-secondary',
  },
];

/**
 * Illustrative mock of the Daily Ops Brief — not a live screenshot. Built from
 * the same tokens as the product so it reads as the real thing without
 * claiming to be a literal capture.
 */
export function BriefPreview() {
  return (
    <div className="border-border w-full max-w-md rounded-[12px] border bg-white/95 p-5 shadow-[var(--shadow-panel)]">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-signal m-0 font-mono text-[0.72rem] font-extrabold uppercase tracking-[0.02em]">
          Today
        </p>
        <span className="bg-wash-green text-signal rounded-full px-2.5 py-1 text-[0.76rem] font-extrabold">
          3 open priorities
        </span>
      </div>
      <div className="grid gap-2.5">
        {ROWS.map((row) => (
          <div key={row.title} className="border-border grid gap-1.5 rounded-[8px] border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-[3px] font-mono text-[0.68rem] font-extrabold ${row.pill}`}
              >
                {row.priority}
              </span>
              <span
                className={`rounded-full px-2 py-[3px] text-[0.7rem] font-extrabold ${row.statusClass}`}
              >
                {row.status}
              </span>
            </div>
            <p className="text-ink m-0 text-[0.88rem] font-bold leading-[1.3]">{row.title}</p>
            <p className="text-text-secondary m-0 text-[0.78rem]">{row.meta}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
