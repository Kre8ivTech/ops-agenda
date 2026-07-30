export default function AlertsPage() {
  return (
    <div className="max-w-2xl">
      <p className="mb-1.5 text-[0.76rem] font-extrabold uppercase text-signal">Alerts</p>
      <h1 className="m-0 text-[1.7rem] font-extrabold tracking-[-0.02em] text-ink">
        Cross-module inbox
      </h1>
      <p className="mt-3 m-0 max-w-[62ch] text-[0.95rem] leading-[1.5] text-text-secondary">
        Everything flagged across modules lands here and in the morning agenda. No alerts yet —
        mark tasks handled from the dashboard to clear pressure.
      </p>
      <div className="mt-6 rounded-[8px] border border-border bg-white px-4 py-8 text-center text-[0.88rem] text-text-secondary">
        No open alerts.
      </div>
    </div>
  );
}
