/**
 * lib/ai/ask.ts — Conversational Q&A service for the /ask page.
 *
 * Accepts a user question, assembles relevant context (tasks, etc.),
 * and returns an AI-generated answer scoped to the user's account.
 */

import { isNull } from 'drizzle-orm';
import { createDb, withTenant } from '@/lib/db';
import { task } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { complete } from './client';
import { logUsage } from './usage';

export interface AskResult {
  answer: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

/**
 * Answer a user question with full tenant-scoped context.
 */
export async function ask(input: {
  question: string;
  tenant: { accountId: string; userId: string };
  /** Previous messages for multi-turn conversation. */
  history?: { role: 'user' | 'assistant'; content: string }[];
}): Promise<AskResult> {
  const db = createDb(env.DATABASE_URL);

  // Assemble context: load user's tasks
  const tasks = await withTenant(db, input.tenant, async (tx) => {
    return tx.query.task.findMany({
      where: (row) => isNull(row.deletedAt),
      orderBy: (row) => [row.createdAt],
      limit: 30,
    });
  });

  const taskContext = tasks
    .map((t) => {
      const due = t.dueOn ? t.dueOn.toISOString().split('T')[0] : 'no deadline';
      const status = t.handledAt ? 'handled' : t.status;
      return `- [${t.priority.toUpperCase()}] "${t.title}" | Status: ${status} | Due: ${due} | Flag: ${t.flagState}`;
    })
    .join('\n');

  const contextBlock = `The user has ${tasks.length} tasks in their account:
${taskContext || '(no tasks)'}

Current date: ${new Date().toISOString().split('T')[0]}`;

  // Build messages
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];

  // Context as a system-level injection (the agent system prompt is loaded by the client)
  messages.push({
    role: 'user',
    content: `[CONTEXT — DO NOT REPEAT THIS TO THE USER]\n${contextBlock}\n[END CONTEXT]`,
  });
  messages.push({
    role: 'assistant',
    content: 'I have your current task data. How can I help?',
  });

  // Include history
  if (input.history?.length) {
    for (const msg of input.history.slice(-10)) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  // Current question
  messages.push({ role: 'user', content: input.question });

  const response = await complete({
    agentSlug: 'ask-responder',
    messages,
    guardrails: ['data-privacy-guardrail', 'output-safety-guardrail'],
    temperature: 0.5,
    maxTokens: 2048,
  });

  // Log usage
  logUsage(response, { accountId: input.tenant.accountId, userId: input.tenant.userId });

  return {
    answer: response.content,
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
    latencyMs: response.latencyMs,
  };
}
