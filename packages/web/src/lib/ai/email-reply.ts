/**
 * lib/ai/email-reply.ts — AI reply draft generation.
 * NEVER sends automatically. All drafts require explicit human approval.
 */

import { eq } from 'drizzle-orm';
import { createDb, withTenant } from '@/lib/db';
import { emailThread, emailExtraction, emailDraft } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { complete } from './client';
import { logUsage } from './usage';

/**
 * Generate a reply draft for an email thread.
 * Returns the draft content and persists it in email_draft table.
 */
export async function generateReplyDraft(
  tenant: { accountId: string; userId: string },
  threadId: string,
): Promise<{ id: string; content: string } | null> {
  const db = createDb(env.DATABASE_URL);

  const [thread] = await withTenant(db, tenant, async (tx) =>
    tx.select().from(emailThread).where(eq(emailThread.id, threadId)),
  );
  if (!thread) return null;

  // Load extractions for context
  const extractions = await withTenant(db, tenant, async (tx) =>
    tx.select().from(emailExtraction).where(eq(emailExtraction.threadId, threadId)),
  );

  const extractionContext = extractions.length > 0
    ? `\nExtracted commitments:\n${extractions.map((e) => `- [${e.kind}] ${e.title} (deadline: ${e.deadline?.toISOString().split('T')[0] ?? 'none'}, owner: ${e.owner ?? '?'})`).join('\n')}`
    : '';

  const userMessage = `Generate a reply draft for this email thread:

Subject: "${thread.subject}"
Participants: ${thread.participants ?? 'unknown'}
Messages in thread: ${thread.messageCount}
Last activity: ${thread.lastMessageAt.toISOString().split('T')[0]}
Days since your reply: ${thread.daysSinceReply ?? 'unknown'}
Priority: ${thread.priority ?? 'unknown'}
Signal: ${thread.signalTag ?? 'none'}
${extractionContext}

Generate a professional, concise reply that addresses the most recent ask. 2-4 sentences. No greeting formula, no sign-off.
If you cannot generate a useful reply from this metadata alone, respond with exactly: "Insufficient context for a meaningful draft"`;

  try {
    const response = await complete({
      agentSlug: 'reply-drafter',
      messages: [{ role: 'user', content: userMessage }],
      guardrails: ['email-reply-guardrail', 'email-content-guardrail'],
      temperature: 0.6,
      maxTokens: 1024,
    });

    logUsage(response, { accountId: tenant.accountId, userId: tenant.userId });

    const content = response.content.trim();
    if (!content || content === 'Insufficient context for a meaningful draft') return null;

    // Persist draft
    const [draft] = await withTenant(db, tenant, async (tx) =>
      tx.insert(emailDraft).values({
        accountId: tenant.accountId,
        threadId,
        content,
        status: 'pending_review',
        sourceContext: `Thread: ${thread.subject} | ${thread.participants}`,
        modelId: response.modelId,
        attempt: '1',
      }).returning(),
    );

    return { id: draft.id, content: draft.content };
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ai/email-reply]', err instanceof Error ? err.message : err);
    }
    return null;
  }
}

/**
 * Regenerate a draft (creates a new attempt).
 */
export async function regenerateReplyDraft(
  tenant: { accountId: string; userId: string },
  threadId: string,
  previousAttempt: number,
): Promise<{ id: string; content: string } | null> {
  const db = createDb(env.DATABASE_URL);

  // Mark previous as discarded
  await withTenant(db, tenant, async (tx) => {
    await tx.update(emailDraft)
      .set({ status: 'discarded', updatedAt: new Date() })
      .where(eq(emailDraft.threadId, threadId));
  });

  // Generate new
  const result = await generateReplyDraft(tenant, threadId);
  if (result) {
    // Update attempt number
    await withTenant(db, tenant, async (tx) => {
      await tx.update(emailDraft)
        .set({ attempt: String(previousAttempt + 1) })
        .where(eq(emailDraft.id, result.id));
    });
  }
  return result;
}
