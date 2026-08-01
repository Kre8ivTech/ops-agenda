/**
 * lib/ai/classify.ts — AI-powered task classification.
 *
 * Called automatically on task create (non-blocking) and on-demand for re-ranking.
 */

import { eq } from 'drizzle-orm';
import { createDb, withTenant } from '@/lib/db';
import { task } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { complete } from './client';
import { logUsage } from './usage';

export interface ClassificationResult {
  priority: 'p1' | 'p2' | 'p3' | 'fysa';
  confidence: number;
  reasoning: string;
}

/**
 * Classify a single task using the task-prioritizer agent.
 * Returns the classification or null if AI is unavailable.
 */
export async function classifyTask(taskData: {
  id: string;
  title: string;
  description?: string | null;
  dueOn?: Date | null;
  createdAt: Date;
}): Promise<ClassificationResult | null> {
  try {
    const now = new Date().toISOString().split('T')[0];
    const dueStr = taskData.dueOn ? taskData.dueOn.toISOString().split('T')[0] : 'none';

    const userMessage = `Classify the following task. Consider the title, description, due date, and current date.

Task:
- Title: ${taskData.title}
- Description: ${taskData.description ?? 'none'}
- Due: ${dueStr}
- Created: ${taskData.createdAt.toISOString().split('T')[0]}
- Current date: ${now}

Respond with JSON only:
{
  "priority": "p1" | "p2" | "p3" | "fysa",
  "confidence": 0.0-1.0,
  "reasoning": "one sentence explanation"
}`;

    const response = await complete({
      agentSlug: 'task-prioritizer',
      messages: [{ role: 'user', content: userMessage }],
      guardrails: ['output-safety-guardrail'],
      temperature: 0.1,
      maxTokens: 256,
    });

    // Log usage (fire-and-forget)
    logUsage(response);

    // Parse the JSON response
    const text = response.content.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    const priority = parsed.priority?.toLowerCase();
    if (!['p1', 'p2', 'p3', 'fysa'].includes(priority)) return null;

    const confidence = Number(parsed.confidence);
    if (isNaN(confidence) || confidence < 0 || confidence > 1) return null;

    return {
      priority: priority as ClassificationResult['priority'],
      confidence,
      reasoning: String(parsed.reasoning ?? '').slice(0, 500),
    };
  } catch (err) {
    // AI classification should never break task creation
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ai/classify] Classification failed:', err instanceof Error ? err.message : err);
    }
    return null;
  }
}

/**
 * Classify a task and persist the result to the database.
 * Designed to be called as a fire-and-forget background operation.
 */
export async function classifyAndUpdateTask(
  tenant: { accountId: string; userId: string },
  taskId: string,
): Promise<void> {
  const db = createDb(env.DATABASE_URL);

  // Load the task
  const [taskRow] = await db.select().from(task).where(eq(task.id, taskId));
  if (!taskRow) return;

  // Only auto-classify if priority is the default (p3) — don't override manual choices
  if (taskRow.priority !== 'p3') return;

  const result = await classifyTask({
    id: taskRow.id,
    title: taskRow.title,
    description: taskRow.description,
    dueOn: taskRow.dueOn,
    createdAt: taskRow.createdAt,
  });

  if (!result) return;

  // Only apply if confidence is above threshold
  if (result.confidence < 0.7) return;

  // Update the task with AI-classified priority
  await withTenant(db, tenant, async (tx) => {
    await tx
      .update(task)
      .set({
        priority: result.priority,
        flagReasonCode: 'ai_classified',
        flagReasonText: `${result.reasoning} (confidence: ${(result.confidence * 100).toFixed(0)}%)`,
        updatedAt: new Date(),
      })
      .where(eq(task.id, taskId));
  });
}

/**
 * Batch classify multiple tasks (for daily re-ranking).
 */
export async function classifyBatch(
  tenant: { accountId: string; userId: string },
  taskIds: string[],
): Promise<Map<string, ClassificationResult>> {
  const results = new Map<string, ClassificationResult>();
  // Process sequentially to avoid rate limits — could be parallelized with throttling
  for (const id of taskIds) {
    await classifyAndUpdateTask(tenant, id);
  }
  return results;
}
