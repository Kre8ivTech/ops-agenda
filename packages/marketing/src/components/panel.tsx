import type { ReactNode } from 'react';

/** A bordered white card — the workhorse container across the site. */
export function Panel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-border overflow-hidden rounded-[14px] border bg-white ${className}`}>
      {children}
    </div>
  );
}

/** The wash-filled caption strip at the top of a listing panel. */
export function PanelHeading({ children }: { children: ReactNode }) {
  return (
    <div className="border-border bg-wash text-text-secondary font-mono border-b px-6 py-[14px] text-[0.72rem] leading-none font-extrabold tracking-[0.1em] uppercase">
      {children}
    </div>
  );
}

/**
 * The dark editorial band used for cross-flows, AI limits, "what we will not
 * build" and the clinical disclaimer. Cells are separated by a hairline that
 * shows the ink ground through the gap.
 */
export function InkGrid({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-px overflow-hidden rounded-[12px] border border-[rgba(247,247,242,0.16)] bg-[rgba(247,247,242,0.16)]">
      {children}
    </div>
  );
}

/**
 * `eyebrow` cells lead with a green mono label (cross-flows, AI limits);
 * `title` cells lead with a bold paper heading over dimmed body text
 * ("what we will not build", the clinical disclaimer).
 */
export function InkGridCell({
  label,
  body,
  variant = 'eyebrow',
  basis = '270px',
  className = '',
}: {
  label: string;
  body: string;
  variant?: 'eyebrow' | 'title';
  basis?: string;
  className?: string;
}) {
  const isEyebrow = variant === 'eyebrow';

  return (
    <div
      className={`bg-ink min-w-0 grow px-6 py-[22px] ${className}`}
      style={{ flexBasis: basis }}
    >
      <p
        className={
          isEyebrow
            ? 'text-signal-on-ink font-mono m-0 mb-[7px] text-[0.72rem] leading-none font-bold tracking-[0.08em] uppercase'
            : 'm-0 mb-[7px] text-[0.96rem] font-extrabold text-[var(--paper)]'
        }
      >
        {label}
      </p>
      <p
        className={
          isEyebrow
            ? 'm-0 text-[0.95rem] leading-[1.5] text-[var(--paper)]'
            : 'm-0 text-[0.88rem] leading-[1.5] text-[rgba(247,247,242,0.66)]'
        }
      >
        {body}
      </p>
    </div>
  );
}
