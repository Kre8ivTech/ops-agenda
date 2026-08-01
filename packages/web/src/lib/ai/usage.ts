/**
 * lib/ai/usage.ts — Token usage logging for AI requests.
 */

import { createDb } from '@/lib/db';
import { aiUsageLog } from '@/lib/db/schema';
import { env } from '@/lib/env';
import type { AiCompletionResponse } from './client';

export interface UsageContext {
  accountId?: string;
  userId?: string;
}

/**
 * Log an AI request's token usage. Fire-and-forget — errors are swallowed
 * so that a logging failure never breaks the user's request.
 */
export async function logUsage(
  response: AiCompletionResponse,
  context: UsageContext = {},
  extra: { success?: boolean; errorCode?: string } = {},
): Promise<void> {
  try {
    const db = createDb(env.DATABASE_URL);
    await db.insert(aiUsageLog).values({
      accountId: context.accountId ?? null,
      userId: context.userId ?? null,
      agentId: response.agentDbId ?? null,
      modelId: response.modelDbId ?? null,
      inputTokens: String(response.inputTokens),
      outputTokens: String(response.outputTokens),
      costUsd: estimateCost(response.inputTokens, response.outputTokens),
      latencyMs: String(response.latencyMs),
      success: extra.success ?? true,
      errorCode: extra.errorCode ?? null,
    });
  } catch {
    // Swallow — usage logging must never break the request
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ai/usage] Failed to log usage');
    }
  }
}

/** Rough cost estimate — uses default Sonnet pricing as fallback. */
function estimateCost(inputTokens: number, outputTokens: number): string {
  // Default to Claude Sonnet 4 pricing
  const inputCostPer1k = 0.003;
  const outputCostPer1k = 0.015;
  const cost = (inputTokens / 1000) * inputCostPer1k + (outputTokens / 1000) * outputCostPer1k;
  return cost.toFixed(6);
}
