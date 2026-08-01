/**
 * lib/ai/index.ts — Public API for the AI module.
 *
 * All AI capabilities are accessible through this barrel:
 * - complete(): Raw LLM calls with agent/model resolution
 * - classifyTask(): Single task classification
 * - classifyAndUpdateTask(): Classify and persist (fire-and-forget)
 * - generateBrief(): Daily ops brief narrative
 * - ask(): Conversational Q&A
 * - logUsage(): Token usage logging
 */

export { complete } from './client';
export type { AiCompletionRequest, AiCompletionResponse, AiMessage } from './client';

export { classifyTask, classifyAndUpdateTask, classifyBatch } from './classify';
export type { ClassificationResult } from './classify';

export { generateBrief } from './brief';
export type { AiBriefResult } from './brief';

export { ask } from './ask';
export type { AskResult } from './ask';

export { logUsage } from './usage';
