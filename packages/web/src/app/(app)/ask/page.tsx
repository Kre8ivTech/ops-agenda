export default function AskPage() {
  return (
    <div className="max-w-2xl">
      <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Ask</p>
      <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">
        Ask over your own data
      </h1>
      <p className="text-text-secondary m-0 mt-3 max-w-[62ch] text-[0.95rem] leading-[1.5]">
        Conversational Ask streams answers scoped to your tenant and enabled modules. It may draft
        and navigate — it never sends, schedules, pays, or files. Lands in Phase 2/3 with Bedrock.
      </p>
    </div>
  );
}
