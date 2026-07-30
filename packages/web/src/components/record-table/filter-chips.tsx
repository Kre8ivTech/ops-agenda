import Link from 'next/link';

export interface FilterChipData {
  key: string;
  label: string;
  count: number;
  href: string;
  active: boolean;
}

/**
 * ST-03: filter chips with live counts. Per `05-design-system.md`, the
 * selected chip fills with `wash` and gets an `ink` border — never signal
 * green, since green means state, not selection.
 */
export function FilterChips({ chips }: { chips: FilterChipData[] }) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Filter tasks">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.href}
          aria-current={chip.active ? 'true' : undefined}
          className={`focus-visible:outline-signal inline-flex h-[34px] items-center gap-1.5 rounded-full border px-3.5 text-[0.82rem] font-extrabold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
            chip.active
              ? 'border-ink bg-wash text-ink'
              : 'border-border text-text-secondary hover:border-ink bg-white'
          }`}
        >
          {chip.label}
          <span className="font-mono text-[0.76rem] font-bold opacity-70">{chip.count}</span>
        </Link>
      ))}
    </div>
  );
}
