/**
 * lib/ai/email-rank.ts — AI-powered email thread ranking.
 * Assigns P1-FYSA priority and signal tags to email threads.
 */

import { eq } from 'drizzle-orm';
import { createDb, withTenant } from '@/lib/db';
import { emailThread } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { complete } from './client';
import { logUsage } from './usage';

export interface RankResult {
  priority: string;
  signalTag: string | null;
  rankScore: number;
  reasoning: string;
}

/**
 * Rank a batch of email threads. Updates the DB directly.
 */
export async function rankEmailThreads(
  tenant: { accountId: string; userId: string },
  threadIds: string[],
): Promise<void> {
  if (threadIds.length === 0) return;

  const db = createDb(env.DATABASE_URL);
  const threads = await withTenant(db, tenant, async (tx) =>
    tx.select().from(emailThread).where(eq(emailThread.accountId, tenant.accountId)),
  );

  const toRank = threads.filter((t) => threadIds.includes(t.id));
  if (toRank.length === 0) return;

  // Build context for ranking
  const threadDescriptions = toRank.map((t, i) => {
    const daysSince = t.daysSinceReply ?? '?';
    return `${i + 1}. Subject: "${t.subject}" | Participants: ${t.participants ?? 'unknown'} | Messages: ${t.messageCount} | Last: ${t.lastMessageAt.toISOString().split('T')[0]} | Days since your reply: ${daysSince}`;
  }).join('\n');

  const userMessage = `Rank these ${toRank.length} email threads. For EACH thread, provide a JSON object on its own line:

${threadDescriptions}

Respond with a JSON array — one object per thread, in order:
[
  { "priority": "p1"|"p2"|"p3"|"fysa", "signal_tag": "Due-out · ..." | "Blocking N" | "Waiting on you" | "At risk · N days unanswered" | null, "rank_score": 1-100, "reasoning": "..." },
  ...
]`;

  try {
    const response = await complete({
      agentSlug: 'email-ranker',
      messages: [{ role: 'user', content: userMessage }],
      guardrails: ['email-content-guardrail'],
      temperature: 0.1,
      maxTokens: 2048,
    });

    logUsage(response, { accountId: tenant.accountId, userId: tenant.userId });

    // Parse response
    const text = response.content.trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return;

    const rankings: RankResult[] = JSON.parse(jsonMatch[0]);

    // Update each thread
    await withTenant(db, tenant, async (tx) => {
      for (let i = 0; i < Math.min(rankings.length, toRank.length); i++) {
        const r = rankings[i];
        const t = toRank[i];
        await tx.update(emailThread).set({
          priority: r.priority,
          signalTag: r.signalTag,
          rankScore: String(r.rankScore),
          updatedAt: new Date(),
        }).where(eq(emailThread.id, t.id));
      }
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ai/email-rank]', err instanceof Error ? err.message : err);
    }
  }
}
