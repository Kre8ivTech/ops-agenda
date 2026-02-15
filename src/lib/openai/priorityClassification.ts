/**
 * Priority Classification — OpenAI GPT-4o-mini
 * 
 * Classifies emails into P1/P2/P3/FYSA with confidence scores.
 * Uses JSON structured output with schema validation.
 */

import { z } from "zod";
import { callOpenAI } from "./client";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type { Priority } from "@/types";

// Response schema
const PriorityClassificationSchema = z.object({
  classifications: z.array(
    z.object({
      email_id: z.string().uuid(),
      priority: z.enum(["P1", "P2", "P3", "FYSA"]),
      confidence: z.number().min(0).max(1),
      reasoning: z.string(),
    })
  ),
});

type PriorityClassificationResponse = z.infer<typeof PriorityClassificationSchema>;

interface EmailForClassification {
  id: string;
  subject: string;
  from_email: string;
  from_name: string | null;
  snippet: string;
  importance: string;
}

/**
 * Classify a batch of emails (max 50 per call for cost optimization)
 */
export async function classifyEmails(
  userId: string,
  emails: EmailForClassification[]
): Promise<number> {
  if (emails.length === 0) {
    return 0;
  }

  // Batch in chunks of 50
  const BATCH_SIZE = 50;
  let totalClassified = 0;

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    const classified = await classifyEmailBatch(userId, batch);
    totalClassified += classified;
  }

  return totalClassified;
}

/**
 * Classify a single batch of emails
 */
async function classifyEmailBatch(
  userId: string,
  emails: EmailForClassification[]
): Promise<number> {
  try {
    const systemPrompt = `You are an email priority classification assistant. Classify emails into these categories:

**P1 (Urgent)**: Requires immediate action within hours. Examples:
- Direct requests from executives/clients with tight deadlines
- Critical system alerts or incidents
- Meeting invites for today/tomorrow
- Time-sensitive approvals or decisions

**P2 (Important)**: Requires action within 1-2 days. Examples:
- Project updates requiring response
- Scheduled meeting prep
- Important but not time-critical requests
- Follow-ups on ongoing work

**P3 (Normal)**: Standard emails requiring eventual action. Examples:
- General updates and announcements
- Non-urgent requests
- Discussion threads
- Routine communications

**FYSA (For Your Situational Awareness)**: Informational only, no action required. Examples:
- CC'd on discussions not requiring your input
- Newsletter and automated reports
- General announcements
- Notifications and confirmations

Return confidence score (0.0-1.0) based on:
- How clearly the email fits the category
- Presence of deadline indicators
- Sender authority/relationship
- Content urgency signals

Always return valid JSON matching the schema.`;

    const emailList = emails
      .map(
        (email, idx) =>
          `${idx + 1}. ID: ${email.id}
Subject: ${email.subject}
From: ${email.from_name || email.from_email}
Snippet: ${email.snippet}
Importance: ${email.importance}`
      )
      .join("\n\n");

    const userPrompt = `Classify these ${emails.length} emails:

${emailList}

Return JSON with this exact structure:
{
  "classifications": [
    {
      "email_id": "uuid",
      "priority": "P1|P2|P3|FYSA",
      "confidence": 0.85,
      "reasoning": "Brief explanation"
    }
  ]
}`;

    const result = await callOpenAI<PriorityClassificationResponse>({
      model: "BULK",
      systemPrompt,
      userPrompt,
      responseSchema: PriorityClassificationSchema,
      temperature: 0.3,
    });

    // Store classifications
    let stored = 0;
    for (const classification of result.classifications) {
      try {
        await supabaseAdmin.from("ai_classifications").upsert(
          {
            email_id: classification.email_id,
            user_id: userId,
            priority: classification.priority,
            confidence: classification.confidence,
            reasoning: classification.reasoning,
            user_corrected: false,
          },
          {
            onConflict: "email_id",
          }
        );
        stored++;
      } catch (error) {
        logger.error("Failed to store classification", error, {
          emailId: classification.email_id,
        });
      }
    }

    logger.info("Email batch classified", {
      userId,
      batch_size: emails.length,
      stored,
    });

    return stored;
  } catch (error) {
    logger.error("Email classification failed", error, { userId, batch_size: emails.length });
    return 0;
  }
}

/**
 * Get unclassified emails for a user
 */
export async function getUnclassifiedEmails(
  userId: string,
  limit: number = 200
): Promise<EmailForClassification[]> {
  const { data, error } = await supabaseAdmin
    .from("emails_metadata")
    .select("id, subject, from_email, from_name, snippet, importance")
    .eq("user_id", userId)
    .not(
      "id",
      "in",
      supabaseAdmin
        .from("ai_classifications")
        .select("email_id")
        .eq("user_id", userId)
    )
    .order("received_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.error("Failed to fetch unclassified emails", error, { userId });
    return [];
  }

  return data || [];
}
