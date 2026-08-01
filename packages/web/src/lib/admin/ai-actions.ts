'use server';

import { revalidatePath } from 'next/cache';
import { desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requirePlatformAdmin } from '@/lib/auth/platform-admin';
import { createDb } from '@/lib/db';
import { aiAgent, aiModel, aiPrompt, aiUsageLog } from '@/lib/db/schema';
import { env } from '@/lib/env';

function getDb() {
  return createDb(env.DATABASE_URL);
}

// ===========================================================================
// AI Prompts
// ===========================================================================

export type AiPromptRow = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  content: string;
  version: string;
  enabled: boolean;
  modelId: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
};

export async function listAiPrompts(): Promise<AiPromptRow[]> {
  await requirePlatformAdmin();
  const db = getDb();
  return db.select().from(aiPrompt).orderBy(desc(aiPrompt.updatedAt));
}

const createPromptSchema = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  kind: z.enum(['system', 'template', 'guardrail', 'few_shot']),
  content: z.string().min(1),
  version: z.string().max(20).default('1.0.0'),
  modelId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function createAiPrompt(input: z.input<typeof createPromptSchema>) {
  await requirePlatformAdmin();
  const data = createPromptSchema.parse(input);
  const db = getDb();
  const [created] = await db.insert(aiPrompt).values(data).returning();
  revalidatePath('/admin/ai/prompts');
  return created;
}

const updatePromptSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  kind: z.enum(['system', 'template', 'guardrail', 'few_shot']).optional(),
  version: z.string().max(20).optional(),
  enabled: z.boolean().optional(),
  modelId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function updateAiPrompt(input: z.input<typeof updatePromptSchema>) {
  await requirePlatformAdmin();
  const { id, ...updates } = updatePromptSchema.parse(input);
  const db = getDb();
  await db.update(aiPrompt).set({ ...updates, updatedAt: new Date() }).where(eq(aiPrompt.id, id));
  revalidatePath('/admin/ai/prompts');
}

export async function deleteAiPrompt(input: { id: string }) {
  await requirePlatformAdmin();
  const db = getDb();
  await db.delete(aiPrompt).where(eq(aiPrompt.id, input.id));
  revalidatePath('/admin/ai/prompts');
}

// ===========================================================================
// AI Models
// ===========================================================================

export type AiModelRow = {
  id: string;
  provider: string;
  modelId: string;
  displayName: string;
  contextWindow: string | null;
  maxOutput: string | null;
  costPer1kInput: string | null;
  costPer1kOutput: string | null;
  credentialId: string | null;
  capabilities: unknown;
  enabled: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function listAiModels(): Promise<AiModelRow[]> {
  await requirePlatformAdmin();
  const db = getDb();
  return db.select().from(aiModel).orderBy(aiModel.provider, aiModel.displayName);
}

const createModelSchema = z.object({
  provider: z.enum(['anthropic', 'openai', 'aws_bedrock', 'google', 'azure', 'local']),
  modelId: z.string().min(1).max(255),
  displayName: z.string().min(1).max(255),
  contextWindow: z.string().max(20).optional(),
  maxOutput: z.string().max(20).optional(),
  costPer1kInput: z.string().max(20).optional(),
  costPer1kOutput: z.string().max(20).optional(),
  credentialId: z.string().uuid().optional(),
  capabilities: z.record(z.unknown()).optional(),
  isDefault: z.boolean().default(false),
});

export async function createAiModel(input: z.input<typeof createModelSchema>) {
  await requirePlatformAdmin();
  const data = createModelSchema.parse(input);
  const db = getDb();
  const [created] = await db.insert(aiModel).values(data).returning();
  revalidatePath('/admin/ai/models');
  return created;
}

const updateModelSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(1).max(255).optional(),
  contextWindow: z.string().max(20).optional(),
  maxOutput: z.string().max(20).optional(),
  costPer1kInput: z.string().max(20).optional(),
  costPer1kOutput: z.string().max(20).optional(),
  credentialId: z.string().uuid().nullable().optional(),
  capabilities: z.record(z.unknown()).optional(),
  enabled: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export async function updateAiModel(input: z.input<typeof updateModelSchema>) {
  await requirePlatformAdmin();
  const { id, ...updates } = updateModelSchema.parse(input);
  const db = getDb();
  await db.update(aiModel).set({ ...updates, updatedAt: new Date() }).where(eq(aiModel.id, id));
  revalidatePath('/admin/ai/models');
}

export async function deleteAiModel(input: { id: string }) {
  await requirePlatformAdmin();
  const db = getDb();
  await db.delete(aiModel).where(eq(aiModel.id, input.id));
  revalidatePath('/admin/ai/models');
}

// ===========================================================================
// AI Agents
// ===========================================================================

export type AiAgentRow = {
  id: string;
  slug: string;
  name: string;
  type: string;
  description: string | null;
  systemPromptId: string | null;
  modelId: string | null;
  config: unknown;
  parentAgentId: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function listAiAgents(): Promise<AiAgentRow[]> {
  await requirePlatformAdmin();
  const db = getDb();
  return db.select().from(aiAgent).orderBy(aiAgent.type, aiAgent.name);
}

const createAgentSchema = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  type: z.enum(['agent', 'subagent', 'skill']),
  description: z.string().optional(),
  systemPromptId: z.string().uuid().optional(),
  modelId: z.string().uuid().optional(),
  config: z.record(z.unknown()).optional(),
  parentAgentId: z.string().uuid().optional(),
});

export async function createAiAgent(input: z.input<typeof createAgentSchema>) {
  await requirePlatformAdmin();
  const data = createAgentSchema.parse(input);
  const db = getDb();
  const [created] = await db.insert(aiAgent).values(data).returning();
  revalidatePath('/admin/ai/agents');
  return created;
}

const updateAgentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  systemPromptId: z.string().uuid().nullable().optional(),
  modelId: z.string().uuid().nullable().optional(),
  config: z.record(z.unknown()).optional(),
  parentAgentId: z.string().uuid().nullable().optional(),
  enabled: z.boolean().optional(),
});

export async function updateAiAgent(input: z.input<typeof updateAgentSchema>) {
  await requirePlatformAdmin();
  const { id, ...updates } = updateAgentSchema.parse(input);
  const db = getDb();
  await db.update(aiAgent).set({ ...updates, updatedAt: new Date() }).where(eq(aiAgent.id, id));
  revalidatePath('/admin/ai/agents');
}

export async function deleteAiAgent(input: { id: string }) {
  await requirePlatformAdmin();
  const db = getDb();
  await db.delete(aiAgent).where(eq(aiAgent.id, input.id));
  revalidatePath('/admin/ai/agents');
}

// ===========================================================================
// AI Usage Stats
// ===========================================================================

export interface AiUsageSummary {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  successRate: number;
  avgLatencyMs: number;
  byModel: { modelId: string | null; displayName: string; requests: number; tokens: number; cost: number }[];
  byAgent: { agentId: string | null; agentName: string; requests: number; tokens: number }[];
  recentLogs: {
    id: string;
    agentId: string | null;
    modelId: string | null;
    inputTokens: string;
    outputTokens: string;
    costUsd: string | null;
    latencyMs: string | null;
    success: boolean;
    createdAt: Date;
  }[];
}

export async function getAiUsageSummary(): Promise<AiUsageSummary> {
  await requirePlatformAdmin();
  const db = getDb();

  // Aggregate stats
  const [stats] = await db
    .select({
      totalRequests: sql<number>`count(*)::int`,
      totalInputTokens: sql<number>`coalesce(sum(${aiUsageLog.inputTokens}::bigint), 0)::int`,
      totalOutputTokens: sql<number>`coalesce(sum(${aiUsageLog.outputTokens}::bigint), 0)::int`,
      totalCostUsd: sql<number>`coalesce(sum(${aiUsageLog.costUsd}::numeric), 0)::float`,
      successCount: sql<number>`count(*) filter (where ${aiUsageLog.success} = true)::int`,
      avgLatencyMs: sql<number>`coalesce(avg(${aiUsageLog.latencyMs}::numeric), 0)::float`,
    })
    .from(aiUsageLog);

  const successRate = stats.totalRequests > 0 ? stats.successCount / stats.totalRequests : 1;

  // By model
  const byModelRaw = await db
    .select({
      modelId: aiUsageLog.modelId,
      displayName: sql<string>`coalesce(${aiModel.displayName}, 'unknown')`,
      requests: sql<number>`count(*)::int`,
      tokens: sql<number>`(coalesce(sum(${aiUsageLog.inputTokens}::bigint), 0) + coalesce(sum(${aiUsageLog.outputTokens}::bigint), 0))::int`,
      cost: sql<number>`coalesce(sum(${aiUsageLog.costUsd}::numeric), 0)::float`,
    })
    .from(aiUsageLog)
    .leftJoin(aiModel, eq(aiModel.id, aiUsageLog.modelId))
    .groupBy(aiUsageLog.modelId, aiModel.displayName)
    .orderBy(sql`count(*) desc`);

  // By agent
  const byAgentRaw = await db
    .select({
      agentId: aiUsageLog.agentId,
      agentName: sql<string>`coalesce(${aiAgent.name}, 'unknown')`,
      requests: sql<number>`count(*)::int`,
      tokens: sql<number>`(coalesce(sum(${aiUsageLog.inputTokens}::bigint), 0) + coalesce(sum(${aiUsageLog.outputTokens}::bigint), 0))::int`,
    })
    .from(aiUsageLog)
    .leftJoin(aiAgent, eq(aiAgent.id, aiUsageLog.agentId))
    .groupBy(aiUsageLog.agentId, aiAgent.name)
    .orderBy(sql`count(*) desc`);

  // Recent logs
  const recentLogs = await db
    .select({
      id: aiUsageLog.id,
      agentId: aiUsageLog.agentId,
      modelId: aiUsageLog.modelId,
      inputTokens: aiUsageLog.inputTokens,
      outputTokens: aiUsageLog.outputTokens,
      costUsd: aiUsageLog.costUsd,
      latencyMs: aiUsageLog.latencyMs,
      success: aiUsageLog.success,
      createdAt: aiUsageLog.createdAt,
    })
    .from(aiUsageLog)
    .orderBy(desc(aiUsageLog.createdAt))
    .limit(50);

  return {
    totalRequests: stats.totalRequests,
    totalInputTokens: stats.totalInputTokens,
    totalOutputTokens: stats.totalOutputTokens,
    totalCostUsd: stats.totalCostUsd,
    successRate,
    avgLatencyMs: stats.avgLatencyMs,
    byModel: byModelRaw,
    byAgent: byAgentRaw,
    recentLogs,
  };
}
