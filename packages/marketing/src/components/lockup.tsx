type MarkVariant = 'signal' | 'ink' | 'paper';

const MARK_SRC: Record<MarkVariant, string> = {
  signal: '/brand/ops-agenda-mark-signal.svg',
  ink: '/brand/ops-agenda-mark-ink.svg',
  paper: '/brand/ops-agenda-mark-paper.svg',
};

export interface LockupProps {
  /** Mark colour variant — signal on light, paper on ink. */
  mark?: MarkVariant;
  /** Wordmark colour class. Defaults to ink. */
  className?: string;
  /** Mark width in px (height scales). */
  size?: number;
}

export function Lockup({ mark = 'signal', className = '', size = 32 }: LockupProps) {
  const height = Math.round((size * 80) / 99);

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={MARK_SRC[mark]}
        alt=""
        width={size}
        height={height}
        className="shrink-0"
        decoding="async"
      />
      <span className="font-lockup text-[0.94rem] font-extrabold uppercase tracking-[0.02em]">
        Ops Agenda
      </span>
    </span>
  );
}
