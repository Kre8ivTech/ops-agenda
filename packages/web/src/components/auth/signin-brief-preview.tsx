const BRIEF_ITEMS = [
  {
    priority: 'P1',
    priorityClass: 'bg-wash-green text-signal',
    title: 'Finalize executive readout',
    meta: '4:00 PM',
    metaClass: 'text-text-secondary',
  },
  {
    priority: 'P1',
    priorityClass: 'bg-risk-wash text-risk',
    title: 'Resolve procurement follow-up',
    meta: 'At risk',
    metaClass: 'font-bold text-risk',
  },
  {
    priority: 'P2',
    priorityClass: 'bg-info-wash text-info',
    title: 'Review revised launch checklist',
    meta: 'Friday',
    metaClass: 'text-text-secondary',
  },
] as const;

const STATS = [
  { value: '17', label: 'commitments pulled from email' },
  { value: '31.5h', label: 'available across 10 workdays' },
  { value: '<2s', label: 'brief loads, cached each morning' },
] as const;

export function SignInBriefPreview() {
  return (
    <div className="bg-ink relative flex flex-col justify-center gap-7 overflow-hidden px-8 py-14 lg:px-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_100%_0%,rgba(37,114,77,0.55),transparent_60%),radial-gradient(100%_80%_at_0%_100%,rgba(49,93,143,0.42),transparent_62%)]"
      />

      <div className="relative z-10 flex max-w-[46ch] flex-col gap-3">
        <p className="text-signal-on-ink m-0 text-[0.76rem] font-extrabold uppercase">
          Daily Ops Brief
        </p>
        <h2 className="m-0 text-pretty text-[1.9rem] font-extrabold leading-[1.14] tracking-[-0.02em] text-white">
          Every morning at 6:00, scattered inboxes become one ranked agenda.
        </h2>
      </div>

      <div className="border-white/14 relative z-10 overflow-hidden rounded-[10px] border bg-white/[0.96] shadow-[0_30px_70px_rgba(0,0,0,0.35)]">
        <div className="border-border bg-wash flex items-center justify-between gap-3 border-b px-[18px] py-[13px]">
          <span className="text-ink text-[0.8rem] font-extrabold">Thursday, 30 July</span>
          <span className="text-text-secondary font-mono text-[11px] font-semibold">
            generated 6:02 AM
          </span>
        </div>
        <div className="p-[18px]">
          <p className="text-ink mb-4 text-pretty text-[1.02rem] font-semibold leading-[1.45]">
            Three moves protect the deadline slate. Procurement is the only thing at risk before
            noon.
          </p>
          <div className="grid gap-[9px]">
            {BRIEF_ITEMS.map((item) => (
              <div
                key={item.title}
                className="border-border grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[11px] rounded-[8px] border bg-white px-[13px] py-3"
              >
                <span
                  className={`rounded-full px-[7px] py-1 font-mono text-[0.7rem] font-extrabold leading-none ${item.priorityClass}`}
                >
                  {item.priority}
                </span>
                <span className="text-ink truncate text-[0.88rem] font-semibold">{item.title}</span>
                <span className={`whitespace-nowrap text-[0.8rem] ${item.metaClass}`}>
                  {item.meta}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {STATS.map((stat) => (
          <div key={stat.label} className="grid gap-[5px]">
            <strong className="text-[1.5rem] tracking-[-0.02em] text-white">{stat.value}</strong>
            <span className="text-white/62 text-[0.82rem] leading-[1.35]">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
