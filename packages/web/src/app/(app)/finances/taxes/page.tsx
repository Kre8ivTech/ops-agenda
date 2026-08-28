export default function TaxesPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Finances</p>
        <h1 className="text-ink m-0 text-[1.55rem] font-extrabold tracking-[-0.02em]">Taxes</h1>
        <p className="text-text-secondary m-0 mt-2 max-w-[62ch] text-[0.92rem] leading-[1.5]">Tax obligations, set-asides, filing deadlines, and estimated payments.</p>
      </div>
      <div className="rounded-[8px] border border-dashed border-border px-6 py-12 text-center">
        <p className="text-text-secondary m-0 text-[0.88rem]">Coming soon.</p>
      </div>
    </div>
  );
}
