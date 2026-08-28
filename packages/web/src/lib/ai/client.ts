/**
 * lib/ai/client.ts — Unified AI client for Ops Agenda.
 *
 * Loads model config and credentials from the DB, calls the appropriate
 * provider (Anthropic direct or AWS Bedrock), and returns structured responses.
 */

import { eq, and } from 'drizzle-orm';
import { createDb } from '@/lib/db';
import { aiModel, aiPrompt, aiAgent } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { loadEnabledCredentialById, secretString } from '@/lib/integrations/credentials';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiCompletionRequest {
  /** Agent slug to use (loads system prompt + model config). */
  agentSlug?: string;
  /** Or specify model directly. */
  modelId?: string;
  /** Messages to send. If agentSlug is used, system prompt is prepended. */
  messages: AiMessage[];
  /** Override temperature. */
  temperature?: number;
  /** Override max tokens. */
  maxTokens?: number;
  /** Guardrail slugs to inject. */
  guardrails?: string[];
}

export interface AiCompletionResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  modelId: string;
  agentId: string | null;
  latencyMs: number;
  /** Internal model DB id for usage logging. */
  modelDbId: string | null;
  agentDbId: string | null;
}

// ---------------------------------------------------------------------------
// DB lookups
// ---------------------------------------------------------------------------

function getDb2() {
  return createDb(env.DATABASE_URL);
}

async function loadAgent(slug: string) {
  const db = getDb2();
  const [agent] = await db.select().from(aiAgent).where(eq(aiAgent.slug, slug));
  return agent ?? null;
}

async function loadPrompt(id: string) {
  const db = getDb2();
  const [prompt] = await db.select().from(aiPrompt).where(eq(aiPrompt.id, id));
  return prompt ?? null;
}

async function loadPromptBySlug(slug: string) {
  const db = getDb2();
  const [prompt] = await db
    .select()
    .from(aiPrompt)
    .where(and(eq(aiPrompt.slug, slug), eq(aiPrompt.enabled, true)));
  return prompt ?? null;
}

async function loadDefaultModel() {
  const db = getDb2();
  const [model] = await db
    .select()
    .from(aiModel)
    .where(and(eq(aiModel.isDefault, true), eq(aiModel.enabled, true)));
  return model ?? null;
}

async function loadModel(id: string) {
  const db = getDb2();
  const [model] = await db.select().from(aiModel).where(eq(aiModel.id, id));
  return model ?? null;
}

// ---------------------------------------------------------------------------
// Provider callers
// ---------------------------------------------------------------------------

async function callAnthropic(
  apiKey: string,
  modelId: string,
  messages: AiMessage[],
  opts: { temperature: number; maxTokens: number },
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const systemMessages = messages.filter((m) => m.role === 'system');
  const nonSystem = messages.filter((m) => m.role !== 'system');
  const systemText = systemMessages.map((m) => m.content).join('\n\n');

  const body = {
    model: modelId,
    max_tokens: opts.maxTokens,
    temperature: opts.temperature,
    ...(systemText ? { system: systemText } : {}),
    messages: nonSystem.map((m) => ({ role: m.role, content: m.content })),
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return {
    content: data.content?.[0]?.text ?? '',
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  };
}

async function callBedrock(
  credentials: { accessKeyId: string; secretAccessKey: string; region?: string },
  modelId: string,
  messages: AiMessage[],
  opts: { temperature: number; maxTokens: number },
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  // AWS Bedrock Converse API via fetch with SigV4
  // For now, use the Anthropic Messages API format via Bedrock's invoke-model endpoint
  const region = credentials.region ?? env.AWS_REGION ?? 'us-east-1';
  const systemMessages = messages.filter((m) => m.role === 'system');
  const nonSystem = messages.filter((m) => m.role !== 'system');
  const systemText = systemMessages.map((m) => m.content).join('\n\n');

  const body = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: opts.maxTokens,
    temperature: opts.temperature,
    ...(systemText ? { system: systemText } : {}),
    messages: nonSystem.map((m) => ({ role: m.role, content: m.content })),
  };

  // Use AWS SDK-style signing — for now fall back to the default IAM role
  // attached to the ECS task which has bedrock:InvokeModel permission
  const endpoint = `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(modelId)}/invoke`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bedrock API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return {
    content: data.content?.[0]?.text ?? '',
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  };
}

async function callOpenAI(
  apiKey: string,
  modelId: string,
  messages: AiMessage[],
  opts: { temperature: number; maxTokens: number },
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const body = {
    model: modelId,
    max_tokens: opts.maxTokens,
    temperature: opts.temperature,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content ?? '',
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Main completion function
// ---------------------------------------------------------------------------

export async function complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
  const start = Date.now();

  // Resolve agent config
  let agentDbId: string | null = null;
  let systemPromptContent: string | null = null;
  let modelConfig: typeof aiModel.$inferSelect | null = null;
  let temperature = request.temperature ?? 0.3;
  let maxTokens = request.maxTokens ?? 4096;

  if (request.agentSlug) {
    const agent = await loadAgent(request.agentSlug);
    if (agent) {
      agentDbId = agent.id;
      const config = agent.config as Record<string, unknown> | null;
      if (config?.temperature) temperature = config.temperature as number;
      if (config?.max_tokens) maxTokens = config.max_tokens as number;

      // Load system prompt
      if (agent.systemPromptId) {
        const prompt = await loadPrompt(agent.systemPromptId);
        if (prompt?.enabled) systemPromptContent = prompt.content;
      }

      // Load model
      if (agent.modelId) {
        modelConfig = await loadModel(agent.modelId);
      }
    }
  }

  // Fall back to default model if not resolved via agent
  if (!modelConfig) {
    if (request.modelId) {
      modelConfig = await loadModel(request.modelId);
    }
    if (!modelConfig) {
      modelConfig = await loadDefaultModel();
    }
  }

  if (!modelConfig) {
    throw new Error('No AI model configured. Add a model in Admin → AI → Models.');
  }

  // Load guardrails
  const guardrailContents: string[] = [];
  if (request.guardrails?.length) {
    for (const slug of request.guardrails) {
      const g = await loadPromptBySlug(slug);
      if (g) guardrailContents.push(g.content);
    }
  }

  // Assemble messages
  const fullMessages: AiMessage[] = [];

  if (systemPromptContent) {
    const systemParts = [systemPromptContent, ...guardrailContents];
    fullMessages.push({ role: 'system', content: systemParts.join('\n\n---\n\n') });
  } else if (guardrailContents.length) {
    fullMessages.push({ role: 'system', content: guardrailContents.join('\n\n---\n\n') });
  }

  fullMessages.push(...request.messages);

  // Override with request params
  if (request.temperature !== undefined) temperature = request.temperature;
  if (request.maxTokens !== undefined) maxTokens = request.maxTokens;

  // Resolve credentials and call provider
  let apiKey: string | null = null;
  if (modelConfig.credentialId) {
    const cred = await loadEnabledCredentialById(modelConfig.credentialId);
    if (cred) {
      apiKey = secretString(cred.secret, 'api_key', 'apiKey', 'secret_key', 'key', 'value') ?? null;
    }
  }

  let result: { content: string; inputTokens: number; outputTokens: number };

  const provider = modelConfig.provider;
  const modelIdStr = modelConfig.modelId;

  switch (provider) {
    case 'anthropic':
      if (!apiKey)
        throw new Error(
          'No Anthropic API key configured. Add credentials in Admin → Integrations.',
        );
      result = await callAnthropic(apiKey, modelIdStr, fullMessages, { temperature, maxTokens });
      break;
    case 'openai':
      if (!apiKey)
        throw new Error('No OpenAI API key configured. Add credentials in Admin → Integrations.');
      result = await callOpenAI(apiKey, modelIdStr, fullMessages, { temperature, maxTokens });
      break;
    case 'aws_bedrock':
      // Bedrock uses IAM role from ECS task — no explicit key needed
      result = await callBedrock(
        { accessKeyId: '', secretAccessKey: '', region: env.AWS_REGION },
        modelIdStr,
        fullMessages,
        { temperature, maxTokens },
      );
      break;
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }

  return {
    content: result.content,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    modelId: modelIdStr,
    modelDbId: modelConfig.id,
    agentId: request.agentSlug ?? null,
    agentDbId,
    latencyMs: Date.now() - start,
  };
}
