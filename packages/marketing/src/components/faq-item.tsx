export function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="border-border group rounded-[8px] border bg-white p-4 open:pb-4">
      <summary className="text-ink flex cursor-pointer list-none items-center justify-between gap-3 text-[0.95rem] font-bold">
        {question}
        <span className="text-text-secondary shrink-0 text-[0.8rem] group-open:hidden">+</span>
        <span className="text-text-secondary hidden shrink-0 text-[0.8rem] group-open:inline">
          −
        </span>
      </summary>
      <p className="text-text-secondary m-0 mt-3 max-w-[64ch] text-[0.9rem] leading-[1.55]">
        {answer}
      </p>
    </details>
  );
}
