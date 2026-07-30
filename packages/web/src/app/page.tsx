import { PriorityBadge } from '@/components/priority-badge';
import { sortByPriority, type Classification } from '@/lib/priority';

// Static placeholder until the M365 sync and AI pipeline land. Deliberately not
// fetching anything: the PRD requires graceful degradation to raw data, so the
// shell must render before any integration exists.
const SAMPLE: (Classification & { subject: string })[] = [
  { subject: 'Contract redline due to legal', priority: 'P1', confidence: 0.94, rationale: '' },
  { subject: 'Q3 headcount plan review', priority: 'P2', confidence: 0.81, rationale: '' },
  { subject: 'Vendor renewal quote', priority: 'P3', confidence: 0.66, rationale: '' },
  { subject: 'All-hands recording posted', priority: 'FYSA', confidence: 0.99, rationale: '' },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Daily Ops Brief
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Placeholder shell. Microsoft 365 sync and the AI pipeline are not wired up yet.
      </p>
      <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        {sortByPriority(SAMPLE).map((item) => (
          <li key={item.subject} className="flex items-center justify-between gap-4 py-3">
            <span className="text-sm text-zinc-900 dark:text-zinc-100">{item.subject}</span>
            <PriorityBadge priority={item.priority} confidence={item.confidence} />
          </li>
        ))}
      </ul>
    </main>
  );
}
