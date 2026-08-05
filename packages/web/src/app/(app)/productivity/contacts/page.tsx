import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { getSession } from '@/lib/auth';
import { listContacts, getContactMetrics, addContact } from '@/lib/contacts/actions';
import type { ContactFilter, ContactRow } from '@/lib/contacts/actions';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(date: Date | null): string {
  if (!date) return '—';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATE_BADGE: Record<string, { label: string; className: string }> = {
  awaiting_you: {
    label: 'Awaiting you',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  current: {
    label: 'Current',
    className: 'bg-green-50 text-green-800 border-green-200',
  },
  gone_quiet: {
    label: 'Gone quiet',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  archived: {
    label: 'Archived',
    className: 'bg-gray-50 text-gray-500 border-gray-200',
  },
};

function contactInitials(name: string): string {
  const parts = name.trim().split(/[\s._-]+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();

  if (!session?.accountId || !session?.userId) {
    return (
      <div className="border-border bg-risk-wash rounded-[8px] border p-4">
        <p className="text-ink font-bold">Complete onboarding to access Contacts.</p>
      </div>
    );
  }

  const filter: ContactFilter =
    params.filter === 'needs_attention' || params.filter === 'settled'
      ? params.filter
      : 'all';
  const search = params.q?.trim() || undefined;

  let rows: ContactRow[] = [];
  let counts = { all: 0, needsAttention: 0, settled: 0 };
  let metrics = { total: 0, awaitingReply: 0, goneQuiet: 0, keyRelationships: 0 };
  let unavailable = false;

  try {
    const result = await listContacts({ filter, search });
    rows = result.rows;
    counts = result.counts;
    metrics = await getContactMetrics();
  } catch {
    unavailable = true;
  }

  // Stale key relationships (gone quiet + key relationship)
  const staleKeyRelationships = rows.filter(
    (c) => c.isKeyRelationship && (c.state === 'gone_quiet' || c.state === 'awaiting_you'),
  );

  return (
    <div className="flex gap-6">
      {/* Main content */}
      <div className="min-w-0 flex-1">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-signal mb-1 text-[0.76rem] font-extrabold uppercase">
              Productivity
            </p>
            <h1 className="text-ink m-0 text-[1.55rem] font-extrabold tracking-[-0.02em]">
              Contacts
            </h1>
            <p className="text-text-secondary m-0 mt-1 text-[0.88rem]">
              Track relationships, follow-ups, and keep key contacts warm.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search input */}
            <form method="GET" action="/productivity/contacts" className="relative">
              <input type="hidden" name="filter" value={filter} />
              <input
                type="text"
                name="q"
                placeholder="Search contacts…"
                defaultValue={search ?? ''}
                className="border-border text-ink placeholder:text-text-secondary h-9 w-56 rounded-[8px] border bg-white px-3 text-[0.82rem] outline-none focus:border-ink"
              />
            </form>
            <Button variant="primary" size="medium">
              Add contact
            </Button>
          </div>
        </header>

        {/* Add contact form (inline) */}
        <form
          action={async (formData: FormData) => {
            'use server';
            await addContact({
              name: formData.get('name') as string,
              organisation: (formData.get('organisation') as string) || undefined,
              email: (formData.get('email') as string) || undefined,
              phone: (formData.get('phone') as string) || undefined,
              isKeyRelationship: formData.get('isKey') === 'on',
            });
          }}
          className="mb-6 grid grid-cols-2 gap-3 rounded-[8px] border border-border bg-white p-4 sm:grid-cols-5"
        >
          <TextField label="Name" name="name" required placeholder="Full name" />
          <TextField label="Organisation" name="organisation" placeholder="Company" />
          <TextField label="Email" name="email" type="email" placeholder="email@..." />
          <TextField label="Phone" name="phone" placeholder="+1..." />
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-1.5 text-[0.78rem] text-text-secondary">
              <input type="checkbox" name="isKey" className="rounded" />
              Key
            </label>
            <Button type="submit" variant="primary" size="medium">Add</Button>
          </div>
        </form>

        {unavailable ? (
          <div className="border-border rounded-[8px] border bg-white p-6 text-center">
            <p className="text-text-secondary text-[0.88rem]">
              Contacts data is temporarily unavailable.
            </p>
          </div>
        ) : (
          <>
            {/* Metric cards */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: 'Contacts', value: metrics.total },
                { label: 'Awaiting Reply', value: metrics.awaitingReply },
                { label: 'Gone Quiet', value: metrics.goneQuiet },
                { label: 'Key Relationships', value: metrics.keyRelationships },
              ].map((card) => (
                <div
                  key={card.label}
                  className="border-border rounded-[8px] border bg-white px-4 py-3"
                >
                  <p className="text-text-secondary m-0 text-[0.72rem] font-extrabold uppercase tracking-wider">
                    {card.label}
                  </p>
                  <p className="text-ink m-0 mt-1 text-[1.5rem] font-extrabold">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Filter chips + section header */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="text-text-secondary text-[0.72rem] font-extrabold uppercase tracking-wider">
                {filter === 'needs_attention'
                  ? 'NEEDS ATTENTION'
                  : filter === 'settled'
                    ? 'SETTLED'
                    : 'ALL CONTACTS'}
              </span>
              <div className="flex gap-2">
                {(
                  [
                    { key: 'all', label: 'All', count: counts.all },
                    { key: 'needs_attention', label: 'Needs attention', count: counts.needsAttention },
                    { key: 'settled', label: 'Settled', count: counts.settled },
                  ] as const
                ).map((chip) => (
                  <Link
                    key={chip.key}
                    href={`/productivity/contacts?filter=${chip.key}${search ? `&q=${encodeURIComponent(search)}` : ''}`}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.82rem] font-bold transition-colors ${
                      filter === chip.key
                        ? 'border-ink bg-ink text-white'
                        : 'border-border bg-white text-ink hover:border-ink'
                    }`}
                  >
                    {chip.label}
                    <span
                      className={`text-[0.72rem] ${filter === chip.key ? 'text-white/70' : 'text-text-secondary'}`}
                    >
                      {chip.count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="border-border overflow-hidden rounded-[8px] border bg-white">
              <table className="w-full text-left text-[0.82rem]">
                <thead>
                  <tr className="border-border border-b bg-wash">
                    <th className="text-text-secondary px-4 py-2.5 text-[0.72rem] font-extrabold uppercase tracking-wider">
                      Person
                    </th>
                    <th className="text-text-secondary px-4 py-2.5 text-[0.72rem] font-extrabold uppercase tracking-wider">
                      Organisation
                    </th>
                    <th className="text-text-secondary px-4 py-2.5 text-[0.72rem] font-extrabold uppercase tracking-wider">
                      Last Touch
                    </th>
                    <th className="text-text-secondary px-4 py-2.5 text-[0.72rem] font-extrabold uppercase tracking-wider">
                      Open Threads
                    </th>
                    <th className="text-text-secondary px-4 py-2.5 text-[0.72rem] font-extrabold uppercase tracking-wider">
                      State
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center">
                        <p className="text-text-secondary text-[0.88rem]">
                          {search
                            ? 'No contacts match your search.'
                            : 'No contacts yet. Connect your email to auto-discover contacts.'}
                        </p>
                      </td>
                    </tr>
                  ) : null}
                  {rows.map((row) => {
                    const badge = STATE_BADGE[row.state] ?? STATE_BADGE.current;
                    return (
                      <tr
                        key={row.id}
                        className="border-border hover:bg-wash/50 border-b last:border-b-0"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-wash text-text-secondary flex size-8 shrink-0 items-center justify-center rounded-full text-[0.68rem] font-extrabold">
                              {contactInitials(row.name)}
                            </div>
                            <div>
                              <p className="text-ink m-0 font-bold">
                                {row.name}
                                {row.isKeyRelationship ? (
                                  <span className="ml-1.5 text-amber-500" title="Key relationship">
                                    ★
                                  </span>
                                ) : null}
                              </p>
                              {row.email ? (
                                <p className="text-text-secondary m-0 text-[0.76rem]">
                                  {row.email}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="text-ink px-4 py-3">{row.organisation ?? '—'}</td>
                        <td className="text-text-secondary px-4 py-3">
                          {timeAgo(row.lastTouchAt)}
                        </td>
                        <td className="px-4 py-3">
                          {row.openThreads && row.openThreads !== '0' ? (
                            <span className="text-ink font-bold">
                              {row.openThreads}
                              {row.openThreadContext ? (
                                <span className="text-text-secondary ml-1.5 font-normal">
                                  — {row.openThreadContext}
                                </span>
                              ) : null}
                            </span>
                          ) : (
                            <span className="text-text-secondary">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full border px-2 py-0.5 text-[0.72rem] font-bold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Right sidebar */}
      <aside className="hidden w-72 shrink-0 lg:block">
        {/* Nudges */}
        <div className="border-border mb-4 rounded-[8px] border bg-white">
          <div className="border-border border-b px-4 py-2.5">
            <p className="text-text-secondary m-0 text-[0.72rem] font-extrabold uppercase tracking-wider">
              Nudges
            </p>
          </div>
          <div className="px-4 py-3">
            {staleKeyRelationships.length > 0 ? (
              <ul className="m-0 list-none space-y-2 p-0">
                {staleKeyRelationships.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex items-center gap-2">
                    <span className="text-amber-500">★</span>
                    <span className="text-ink text-[0.82rem] font-bold">{c.name}</span>
                    <span className="text-text-secondary text-[0.72rem]">
                      — {timeAgo(c.lastTouchAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text-secondary m-0 text-[0.82rem]">
                No stale key relationships.
              </p>
            )}
          </div>
        </div>

        {/* Sources */}
        <div className="border-border rounded-[8px] border bg-white">
          <div className="border-border border-b px-4 py-2.5">
            <p className="text-text-secondary m-0 text-[0.72rem] font-extrabold uppercase tracking-wider">
              Sources
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-text-secondary m-0 text-[0.82rem]">
              Contacts are discovered from connected mailboxes.
            </p>
            <Link
              href="/settings/connections"
              className="text-signal mt-2 inline-block text-[0.82rem] font-bold"
            >
              Manage connections →
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
