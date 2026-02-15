/**
 * OpenAI Client
 * 
 * Configured client for OpenAI API with structured JSON output.
 */

import OpenAI from "openai";
import { env } from "@/lib/env";
import { logger } from "@/lib/utils/logger";

export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

/**
 * Model selection based on use case
 */
export const AI_MODELS = {
  // GPT-4o for complex reasoning (narrative generation, meeting prep)
  QUALITY: "gpt-4o-2024-08-06",
  
  // GPT-4o-mini for bulk processing (classification, due-outs)
  BULK: "gpt-4o-mini-2024-07-18",
} as const;

/**
 * Call OpenAI with JSON structured output and schema validation
 */
export async function callOpenAI<T>({
  model,
  systemPrompt,
  userPrompt,
  responseSchema,
  temperature = 0.3,
}: {
  model: keyof typeof AI_MODELS;
  systemPrompt: string;
  userPrompt: string;
  responseSchema: any; // Zod schema
  temperature?: number;
}): Promise<T> {
  try {
    const response = await openai.chat.completions.create({
      model: AI_MODELS[model],
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    const parsed = JSON.parse(content);
    const validated = responseSchema.parse(parsed);

    logger.info("OpenAI API call successful", {
      model: AI_MODELS[model],
      usage: response.usage,
    });

    return validated as T;
  } catch (error) {
    logger.error("OpenAI API call failed", error);
    throw error;
  }
}
