export function FeatureCard({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <article className="border-border rounded-[8px] border bg-white p-5">
      <p className="text-signal m-0 mb-2 font-mono text-[0.72rem] font-extrabold uppercase tracking-[0.02em]">
        {eyebrow}
      </p>
      <h3 className="text-ink m-0 mb-2 text-[1.05rem] font-extrabold leading-[1.2]">{title}</h3>
      <p className="text-text-secondary m-0 max-w-[44ch] text-[0.9rem] leading-[1.55]">
        {description}
      </p>
    </article>
  );
}
