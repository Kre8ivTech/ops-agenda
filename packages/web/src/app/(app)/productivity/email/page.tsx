import Link from 'next/link';
import { desc, eq, and, isNull, isNotNull, sql } from 'drizzle-orm';

import { Button } from '@/components/ui/button';
import { getSession } from '@/lib/auth';
import { createDb, withTenant } from '@/lib/db';
import { emailThread, emailExtraction, emailDraft, emailMessage } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { syncEmails } from '@/lib/connectors/sync';
import { extractCommitments } from '@/lib/ai/email-extract';
import { generateReplyDraft } from '@/lib/ai/email-reply';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Thread = typeof emailThread.$inferSelect;
type Extraction = typeof emailExtraction.$inferSelect;
type Draft = typeof emailDraft.$inferSelect;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PRIORITY_BADGE: Record<string, string> = {
  p1: 'bg-red-100 text-red-800 border-red-200',
  p2: 'bg-amber-50 text-amber-800 border-amber-200',
  p3: 'bg-white text-ink border-border',
  fysa: 'bg-wash text-text-secondary border-border',
};

function priorityLabel(p: string | null): string {
  if (p === 'p1') return 'P1';
  if (p === 'p2') return 'P2';
  if (p === 'p3') return 'P3';
  return 'FYSA';
}

function senderInitials(name: string | null, email: string): string {
  if (name && name.length >= 2) {
    const parts = name.trim().split(/[\s._-]+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function deadlineLabel(d: Date | null): string {
  if (!d) return 'None';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return `Today, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function EmailPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string; filter?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();

  if (!session?.accountId || !session?.userId) {
    return (
      <div className="border-border bg-risk-wash rounded-[8px] border p-4">
        <p className="text-ink font-bold">Complete onboarding to access Email.</p>
      </div>
    );
  }

  const tenant = { accountId: session.accountId, userId: session.userId };
  const db = createDb(env.DATABASE_URL);

  // Load threads
  let threads: Thread[] = [];
  try {
    threads = await withTenant(db, tenant, async (tx) =>
      tx.select().from(emailThread)
        .where(and(isNull(emailThread.handledAt), eq(emailThread.accountId, tenant.accountId)))
        .orderBy(emailThread.rankScore, desc(emailThread.lastMessageAt)),
    );

    // Auto-sync on first visit if threads are empty but connections exist
    if (threads.length === 0) {
      try {
        await syncEmails();
        // Re-fetch after sync
        threads = await withTenant(db, tenant, async (tx) =>
          tx.select().from(emailThread)
            .where(and(isNull(emailThread.handledAt), eq(emailThread.accountId, tenant.accountId)))
            .orderBy(emailThread.rankScore, desc(emailThread.lastMessageAt)),
        );
      } catch { /* sync failed silently */ }
    }
  } catch { /* DB unavailable */ }

  // Filter
  const filter = params.filter ?? 'all';
  const filteredThreads = filter === 'all'
    ? threads
    : threads.filter((t) => t.priority === filter);

  // Counts
  const counts = {
    all: threads.length,
    p1: threads.filter((t) => t.priority === 'p1').length,
    p2: threads.filter((t) => t.priority === 'p2').length,
    dueOuts: threads.filter((t) => t.signalTag?.startsWith('Due-out')).length,
    fysa: threads.filter((t) => t.priority === 'fysa').length,
  };

  // Commitments count
  let commitmentCount = 0;
  try {
    const [result] = await withTenant(db, tenant, async (tx) =>
      tx.select({ count: sql<number>`count(*)::int` }).from(emailExtraction)
        .where(and(eq(emailExtraction.accountId, tenant.accountId), eq(emailExtraction.status, 'pending'))),
    );
    commitmentCount = result?.count ?? 0;
  } catch { /* */ }

  // Selected thread detail
  const selectedId = params.thread ?? filteredThreads[0]?.id;
  let selectedThread: Thread | null = null;
  let extractions: Extraction[] = [];
  let draft: Draft | null = null;
  let threadMessages: { id: string; fromAddress: string; fromName: string | null; subject: string; receivedAt: Date; isRead: boolean }[] = [];

  if (selectedId) {
    try {
      const [t] = await withTenant(db, tenant, async (tx) =>
        tx.select().from(emailThread).where(eq(emailThread.id, selectedId)),
      );
      selectedThread = t ?? null;

      if (selectedThread) {
        extractions = await withTenant(db, tenant, async (tx) =>
          tx.select().from(emailExtraction).where(eq(emailExtraction.threadId, selectedId)),
        );
        const [d] = await withTenant(db, tenant, async (tx) =>
          tx.select().from(emailDraft)
            .where(and(eq(emailDraft.threadId, selectedId), eq(emailDraft.status, 'pending_review')))
            .orderBy(desc(emailDraft.createdAt))
            .limit(1),
        );
        draft = d ?? null;

        // Load individual messages for this thread (matched by subject similarity or connection)
        if (selectedThread.externalThreadId) {
          threadMessages = await withTenant(db, tenant, async (tx) =>
            tx.select({
              id: emailMessage.id,
              fromAddress: emailMessage.fromAddress,
              fromName: emailMessage.fromName,
              subject: emailMessage.subject,
              receivedAt: emailMessage.receivedAt,
              isRead: emailMessage.isRead,
            }).from(emailMessage)
              .where(eq(emailMessage.accountId, tenant.accountId))
              .orderBy(desc(emailMessage.receivedAt))
              .limit(20),
          );
          // Filter messages that match this thread's subject (conversation grouping)
          const threadSubject = selectedThread.subject.replace(/^(Re:|Fwd?:)\s*/i, '').trim().toLowerCase();
          threadMessages = threadMessages.filter((m) =>
            m.subject.replace(/^(Re:|Fwd?:)\s*/i, '').trim().toLowerCase().includes(threadSubject.slice(0, 30)) ||
            threadSubject.includes(m.subject.replace(/^(Re:|Fwd?:)\s*/i, '').trim().toLowerCase().slice(0, 30))
          );
        }
      }
    } catch { /* */ }
  }

  // Server actions
  async function handleSync() {
    'use server';
    await syncEmails();
  }

  async function handleExtract(formData: FormData) {
    'use server';
    const threadId = formData.get('threadId') as string;
    const sess = await getSession();
    if (!sess?.accountId || !sess?.userId) return;
    await extractCommitments({ accountId: sess.accountId, userId: sess.userId }, threadId);
  }

  async function handleGenerateDraft(formData: FormData) {
    'use server';
    const threadId = formData.get('threadId') as string;
    const sess = await getSession();
    if (!sess?.accountId || !sess?.userId) return;
    await generateReplyDraft({ accountId: sess.accountId, userId: sess.userId }, threadId);
  }

  return (
    <div className="flex h-[calc(100dvh-120px)] flex-col gap-0">
      {/* Top bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div>
          <p className="text-signal mb-1 text-[0.76rem] font-extrabold uppercase">Productivity</p>
          <h1 className="text-ink m-0 text-[1.55rem] font-extrabold tracking-[-0.02em]">
            Email — {commitmentCount} commitment{commitmentCount !== 1 ? 's' : ''} found
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <form action={handleSync}>
            <Button type="submit" variant="secondary" size="medium">Re-scan</Button>
          </form>
        </div>
      </header>

      {/* Filter chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All', count: counts.all },
          { key: 'p1', label: 'P1', count: counts.p1 },
          { key: 'p2', label: 'P2', count: counts.p2 },
          { key: 'due_outs', label: 'Due-outs', count: counts.dueOuts },
          { key: 'fysa', label: 'FYSA', count: counts.fysa },
        ].map((chip) => (
          <Link
            key={chip.key}
            href={`/productivity/email?filter=${chip.key}${selectedId ? `&thread=${selectedId}` : ''}`}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.82rem] font-bold transition-colors ${
              filter === chip.key
                ? 'border-ink bg-ink text-white'
                : 'border-border bg-white text-ink hover:border-ink'
            }`}
          >
            {chip.label}
            <span className={`text-[0.72rem] ${filter === chip.key ? 'text-white/70' : 'text-text-secondary'}`}>
              {chip.count}
            </span>
          </Link>
        ))}
      </div>

      {/* Split pane */}
      <div className="border-border flex min-h-0 flex-1 overflow-hidden rounded-[8px] border bg-white">
        {/* Left panel — thread list */}
        <div className="border-border w-full max-w-[480px] shrink-0 overflow-y-auto border-r">
          <div className="border-border border-b px-4 py-2">
            <p className="text-text-secondary m-0 text-[0.72rem] font-extrabold uppercase tracking-wider">
              Ranked by Ops Agenda
            </p>
            <p className="text-text-secondary m-0 text-[0.72rem]">{filteredThreads.length} shown</p>
          </div>

          {filteredThreads.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-text-secondary text-[0.88rem]">No emails synced yet.</p>
              <p className="text-text-secondary mt-1 text-[0.82rem]">
                Connect an account in{' '}
                <Link href="/settings/connections" className="text-signal font-bold">Settings → Connections</Link>
                {' '}then click Re-scan.
              </p>
            </div>
          ) : null}

          {filteredThreads.map((t) => (
            <Link
              key={t.id}
              href={`/productivity/email?filter=${filter}&thread=${t.id}`}
              className={`flex gap-3 border-b border-border/50 px-4 py-3 transition-colors ${
                selectedId === t.id ? 'bg-wash' : 'hover:bg-wash/50'
              }`}
            >
              {/* Avatar */}
              <div className="bg-wash text-text-secondary flex size-9 shrink-0 items-center justify-center rounded-full text-[0.72rem] font-extrabold">
                {senderInitials(null, t.participants?.split(',')[0] ?? '')}
              </div>
              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-ink truncate text-[0.85rem] font-bold">
                    {t.participants?.split(',')[0]?.split('@')[0] ?? 'Unknown'}
                  </span>
                  <span className="text-text-secondary shrink-0 text-[0.72rem]">
                    {timeAgo(t.lastMessageAt)}
                  </span>
                </div>
                <p className="text-ink m-0 truncate text-[0.82rem] font-semibold">{t.subject}</p>
                {/* Signal tag */}
                <div className="mt-1 flex items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[0.68rem] font-extrabold ${PRIORITY_BADGE[t.priority ?? 'fysa']}`}>
                    {priorityLabel(t.priority)}
                  </span>
                  {t.signalTag ? (
                    <span className="text-[0.72rem] font-bold text-red-700">{t.signalTag}</span>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Right panel — detail */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          {selectedThread ? (
            <div className="flex flex-col gap-5 p-6">
              {/* Thread header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[0.72rem] font-extrabold ${PRIORITY_BADGE[selectedThread.priority ?? 'fysa']}`}>
                      {priorityLabel(selectedThread.priority)}
                    </span>
                    {selectedThread.signalTag ? (
                      <span className="text-[0.78rem] font-bold text-red-700">{selectedThread.signalTag}</span>
                    ) : null}
                  </div>
                  <h2 className="text-ink m-0 text-[1.25rem] font-extrabold leading-tight">
                    {selectedThread.subject}
                  </h2>
                  <p className="text-text-secondary m-0 mt-1.5 text-[0.82rem]">
                    {selectedThread.participants?.split(',')[0] ?? 'Unknown'} · {selectedThread.messageCount} messages · last reply {timeAgo(selectedThread.lastMessageAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedThread.webLink ? (
                    <a href={selectedThread.webLink} target="_blank" rel="noopener" className="border-border inline-flex h-9 items-center rounded-[8px] border bg-white px-4 text-[0.82rem] font-bold text-ink hover:border-ink">
                      Open in Outlook
                    </a>
                  ) : null}
                </div>
              </div>

              {/* Extraction card */}
              {extractions.length > 0 ? (
                <div className="border-border rounded-[8px] border bg-[#f8faf8]">
                  <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
                    <span className="text-[0.76rem] font-extrabold uppercase text-signal">
                      Extracted from this thread
                    </span>
                    <span className="text-text-secondary text-[0.72rem] font-mono">
                      {extractions[0]?.confidence}% confidence
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-px bg-border/30">
                    {extractions.slice(0, 1).map((ext) => (
                      <>
                        <div key={`${ext.id}-dueout`} className="bg-white px-4 py-3">
                          <p className="text-text-secondary m-0 text-[0.68rem] font-extrabold uppercase">Due-out</p>
                          <p className="text-ink m-0 mt-0.5 text-[0.88rem] font-bold">{ext.title}</p>
                        </div>
                        <div key={`${ext.id}-deadline`} className="bg-white px-4 py-3">
                          <p className="text-text-secondary m-0 text-[0.68rem] font-extrabold uppercase">Deadline</p>
                          <p className={`m-0 mt-0.5 text-[0.88rem] font-bold ${ext.deadline && ext.deadline <= new Date() ? 'text-red-700' : 'text-ink'}`}>
                            {deadlineLabel(ext.deadline)}
                          </p>
                        </div>
                        <div key={`${ext.id}-owner`} className="bg-white px-4 py-3">
                          <p className="text-text-secondary m-0 text-[0.68rem] font-extrabold uppercase">Owner</p>
                          <p className="text-ink m-0 mt-0.5 text-[0.88rem] font-bold capitalize">{ext.owner ?? '—'}</p>
                        </div>
                      </>
                    ))}
                  </div>
                  {extractions[0]?.reasoning ? (
                    <p className="text-text-secondary m-0 border-t border-border/50 px-4 py-2.5 text-[0.8rem] leading-[1.4]">
                      {extractions[0].reasoning}
                    </p>
                  ) : null}
                  <div className="flex gap-2 border-t border-border/50 px-4 py-3">
                    <Button variant="primary" size="small">Add to due-outs</Button>
                    <Button variant="secondary" size="small">Edit extraction</Button>
                    <Button variant="ghost" size="small">Not a commitment</Button>
                  </div>
                </div>
              ) : (
                <form action={handleExtract}>
                  <input type="hidden" name="threadId" value={selectedThread.id} />
                  <Button type="submit" variant="quiet" size="medium">
                    Scan for commitments
                  </Button>
                </form>
              )}

              {/* Thread messages */}
              {threadMessages.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-text-secondary m-0 text-[0.72rem] font-extrabold uppercase">Messages in this thread</p>
                  {threadMessages.map((msg) => (
                    <div key={msg.id} className="border-border rounded-[8px] border px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="bg-wash text-text-secondary grid size-8 place-items-center rounded-full text-[0.68rem] font-extrabold">
                            {senderInitials(msg.fromName, msg.fromAddress)}
                          </span>
                          <div>
                            <p className="text-ink m-0 text-[0.85rem] font-bold">{msg.fromName || msg.fromAddress.split('@')[0]}</p>
                            <p className="text-text-secondary m-0 text-[0.72rem]">{msg.fromAddress}</p>
                          </div>
                        </div>
                        <span className="text-text-secondary shrink-0 font-mono text-[0.72rem]">
                          {timeAgo(msg.receivedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <p className="text-text-secondary m-0 mt-1 text-[0.74rem]">
                    Metadata only — message bodies are not stored.
                  </p>
                </div>
              ) : (
                <div className="border-border rounded-[8px] border px-4 py-3">
                  <p className="text-text-secondary m-0 text-[0.8rem]">
                    {parseInt(selectedThread.messageCount) - 1} earlier messages · metadata only, bodies are not stored
                  </p>
                </div>
              )}

              {/* Suggested reply */}
              {draft ? (
                <div className="border-border rounded-[8px] border">
                  <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
                    <span className="text-[0.76rem] font-extrabold uppercase text-signal">
                      Suggested Reply
                    </span>
                    <span className="text-text-secondary text-[0.72rem]">
                      Nothing sends without your approval
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-ink m-0 text-[0.88rem] leading-[1.5]">{draft.content}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="primary" size="small">Review and send</Button>
                      <Button variant="secondary" size="small">Edit draft</Button>
                      <form action={handleGenerateDraft} className="inline">
                        <input type="hidden" name="threadId" value={selectedThread.id} />
                        <Button type="submit" variant="ghost" size="small">Regenerate</Button>
                      </form>
                    </div>
                    <span className="text-text-secondary text-[0.72rem]">
                      Drafted from thread metadata
                    </span>
                  </div>
                </div>
              ) : (
                <form action={handleGenerateDraft}>
                  <input type="hidden" name="threadId" value={selectedThread.id} />
                  <Button type="submit" variant="quiet" size="medium">
                    Generate reply draft
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-text-secondary text-[0.9rem]">Select a thread to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
