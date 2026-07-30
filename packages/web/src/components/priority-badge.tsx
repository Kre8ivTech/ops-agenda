import type { Priority } from '@/lib/priority';

const STYLES: Record<Priority, string> = {
  P1: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200',
  P2: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  P3: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
  FYSA: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
};

const LABELS: Record<Priority, string> = {
  P1: 'Priority 1 — act now',
  P2: 'Priority 2 — act today',
  P3: 'Priority 3 — act this week',
  FYSA: 'For your situational awareness',
};

export interface PriorityBadgeProps {
  priority: Priority;
  /** 0..1 from the AI classifier. Shown so users can judge the suggestion. */
  confidence?: number;
}

export function PriorityBadge({ priority, confidence }: PriorityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[priority]}`}
      title={LABELS[priority]}
      aria-label={LABELS[priority]}
    >
      {priority}
      {confidence !== undefined && (
        <span className="font-normal opacity-70">{Math.round(confidence * 100)}%</span>
      )}
    </span>
  );
}
