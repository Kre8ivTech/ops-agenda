export default function AskPage() {
  return (
    <div className="max-w-2xl">
      <p className="mb-1.5 text-[0.76rem] font-extrabold uppercase text-signal">Ask</p>
      <h1 className="m-0 text-[1.7rem] font-extrabold tracking-[-0.02em] text-ink">
        Ask over your own data
      </h1>
      <p className="mt-3 m-0 max-w-[62ch] text-[0.95rem] leading-[1.5] text-text-secondary">
        Conversational Ask streams answers scoped to your tenant and enabled modules. It may draft
        and navigate — it never sends, schedules, pays, or files. Lands in Phase 2/3 with Bedrock.
      </p>
    </div>
  );
}
