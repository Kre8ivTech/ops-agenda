import type { Tone } from '@/lib/marketing-content';

/** Pill / tag colouring. Class strings are literal so Tailwind can see them. */
export const PILL_TONE: Record<Tone, string> = {
  signal: 'bg-wash-green text-signal',
  risk: 'bg-risk-wash text-risk',
  info: 'bg-info-wash text-info',
  muted: 'bg-wash text-text-secondary',
};

/** Small status dots. */
export const DOT_TONE: Record<Tone, string> = {
  signal: 'bg-signal',
  risk: 'bg-risk',
  info: 'bg-info',
  muted: 'bg-text-secondary',
};

/** Left rule on brief rows and changelog phases. */
export const ACCENT_TONE: Record<Tone | 'border', string> = {
  signal: 'border-l-signal',
  risk: 'border-l-risk',
  info: 'border-l-info',
  muted: 'border-l-border',
  border: 'border-l-border',
};
