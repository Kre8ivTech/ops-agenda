export default function AlertsPage() {
  return (
    <div className="max-w-2xl">
      <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Alerts</p>
      <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">
        Cross-module inbox
      </h1>
      <p className="text-text-secondary m-0 mt-3 max-w-[62ch] text-[0.95rem] leading-[1.5]">
        Everything flagged across modules lands here and in the morning agenda. No alerts yet — mark
        tasks handled from the dashboard to clear pressure.
      </p>
      <div className="border-border text-text-secondary mt-6 rounded-[8px] border bg-white px-4 py-8 text-center text-[0.88rem]">
        No open alerts.
      </div>
    </div>
  );
}
