/**
 * lib/ai/email-extract.ts — AI commitment extraction from email threads.
 * Detects due-outs, deadlines, and ownership assignments.
 */

import { eq } from 'drizzle-orm';
import { createDb, withTenant } from '@/lib/db';
import { emailThread, emailExtraction } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { complete } from './client';
import { logUsage } from './usage';

export interface ExtractionResult {
  kind: string;
  title: string;
  deadline: string | null;
  owner: string;
  confidence: number;
  reasoning: string;
}

/**
 * Extract commitments from a single email thread and persist them.
 */
export async function extractCommitments(
  tenant: { accountId: string; userId: string },
  threadId: string,
): Promise<ExtractionResult[]> {
  const db = createDb(env.DATABASE_URL);

  const [thread] = await withTenant(db, tenant, async (tx) =>
    tx.select().from(emailThread).where(eq(emailThread.id, threadId)),
  );

  if (!thread) return [];

  const userMessage = `Extract commitments from this email thread:

Subject: "${thread.subject}"
Participants: ${thread.participants ?? 'unknown'}
Messages: ${thread.messageCount}
Last activity: ${thread.lastMessageAt.toISOString().split('T')[0]}
Days since your reply: ${thread.daysSinceReply ?? 'unknown'}
Signal: ${thread.signalTag ?? 'none'}

Respond with JSON:
{
  "commitments": [
    {
      "kind": "due_out" | "commitment" | "question" | "decision_needed",
      "title": "concise action (max 80 chars)",
      "deadline": "YYYY-MM-DD" or null,
      "owner": "you" | "them" | "name",
      "confidence": 0-100,
      "reasoning": "one sentence"
    }
  ]
}

If no commitments, return: { "commitments": [] }`;

  try {
    const response = await complete({
      agentSlug: 'commitment-extractor',
      messages: [{ role: 'user', content: userMessage }],
      guardrails: ['email-content-guardrail', 'output-safety-guardrail'],
      temperature: 0.1,
      maxTokens: 1024,
    });

    logUsage(response, { accountId: tenant.accountId, userId: tenant.userId });

    const text = response.content.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    const commitments: ExtractionResult[] = parsed.commitments ?? [];

    // Persist extractions
    await withTenant(db, tenant, async (tx) => {
      for (const c of commitments.slice(0, 3)) {
        await tx.insert(emailExtraction).values({
          accountId: tenant.accountId,
          threadId,
          kind: c.kind,
          title: c.title.slice(0, 500),
          deadline: c.deadline ? new Date(c.deadline) : null,
          owner: c.owner ?? null,
          confidence: String(Math.min(100, Math.max(0, c.confidence))),
          reasoning: c.reasoning?.slice(0, 1000) ?? null,
          status: 'pending',
        });
      }
    });

    return commitments;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ai/email-extract]', err instanceof Error ? err.message : err);
    }
    return [];
  }
}
