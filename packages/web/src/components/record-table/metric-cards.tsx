export interface MetricCardData {
  label: string;
  value: string;
  tone?: 'default' | 'risk' | 'info' | 'signal';
  note?: string;
}

const TONE_CLASS: Record<NonNullable<MetricCardData['tone']>, string> = {
  default: 'text-ink',
  risk: 'text-risk',
  info: 'text-info',
  signal: 'text-signal',
};

/** ST-02: four metric cards above the table, values coloured by state. */
export function MetricCards({ items }: { items: MetricCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="border-border rounded-[8px] border bg-white p-3.5">
          <p className="text-text-secondary m-0 mb-1.5 text-[0.74rem] font-extrabold uppercase">
            {item.label}
          </p>
          <p
            className={`m-0 text-[1.35rem] font-extrabold tracking-[-0.02em] ${TONE_CLASS[item.tone ?? 'default']}`}
          >
            {item.value}
          </p>
          {item.note ? (
            <p className="text-text-secondary m-0 mt-1 text-[0.78rem]">{item.note}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
