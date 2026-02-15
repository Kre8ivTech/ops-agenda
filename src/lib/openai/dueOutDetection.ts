/**
 * Due-Out Detection — OpenAI GPT-4o-mini
 * 
 * Detects deadlines and action items from email snippets.
 * Uses JSON structured output with schema validation.
 */

import { z } from "zod";
import { callOpenAI } from "./client";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

// Response schema
const DueOutDetectionSchema = z.object({
  due_outs: z.array(
    z.object({
      email_id: z.string().uuid(),
      task_description: z.string(),
      due_date: z.string().datetime(),
      requester: z.string(),
      confidence: z.number().min(0).max(1),
    })
  ),
});

type DueOutDetectionResponse = z.infer<typeof DueOutDetectionSchema>;

interface EmailForDueOut {
  id: string;
  subject: string;
  from_email: string;
  from_name: string | null;
  snippet: string;
  received_at: string;
}

/**
 * Detect due-outs from a batch of emails
 */
export async function detectDueOuts(userId: string, emails: EmailForDueOut[]): Promise<number> {
  if (emails.length === 0) {
    return 0;
  }

  try {
    const currentDate = new Date().toISOString();

    const systemPrompt = `You are a deadline detection assistant. Extract actionable deadlines from emails.

**What to detect:**
- Explicit deadlines: "due by Friday", "need by EOD", "deadline is March 15"
- Implicit deadlines: "before the meeting", "by end of week", "ASAP"
- Action items with timeframes: "submit report by Monday", "respond today"

**Deadline phrases:**
- "due by", "due date", "deadline", "by [date/time]"
- "need by", "submit by", "complete by", "finish by"
- "before [event]", "prior to [date]"
- "EOD", "COB", "EOW", "end of [day/week/month]"
- "tomorrow", "today", "this week", "next [day]"

**What to ignore:**
- Past deadlines
- Meeting times (unless requesting prep/materials)
- Historical references
- Vague mentions without clear deadlines

**Return confidence based on:**
- Clarity of deadline (explicit date/time = higher confidence)
- Action clarity (specific task = higher confidence)
- Context completeness

Convert relative dates to absolute ISO 8601 format based on current date: ${currentDate}

Always return valid JSON matching the schema.`;

    const emailList = emails
      .map(
        (email, idx) =>
          `${idx + 1}. ID: ${email.id}
Subject: ${email.subject}
From: ${email.from_name || email.from_email}
Received: ${email.received_at}
Snippet: ${email.snippet}`
      )
      .join("\n\n");

    const userPrompt = `Current date: ${currentDate}

Analyze these ${emails.length} emails for deadlines:

${emailList}

Return JSON with this exact structure:
{
  "due_outs": [
    {
      "email_id": "uuid",
      "task_description": "Clear description of what's due",
      "due_date": "2026-02-20T17:00:00Z",
      "requester": "sender name or email",
      "confidence": 0.9
    }
  ]
}

If no deadlines found, return empty array: {"due_outs": []}`;

    const result = await callOpenAI<DueOutDetectionResponse>({
      model: "BULK",
      systemPrompt,
      userPrompt,
      responseSchema: DueOutDetectionSchema,
      temperature: 0.2,
    });

    // Store due-outs
    let stored = 0;
    for (const dueOut of result.due_outs) {
      try {
        // Get email details
        const { data: email } = await supabaseAdmin
          .from("emails_metadata")
          .select("from_email, from_name")
          .eq("id", dueOut.email_id)
          .single();

        await supabaseAdmin.from("due_outs").insert({
          user_id: userId,
          email_id: dueOut.email_id,
          task_description: dueOut.task_description,
          due_date: dueOut.due_date,
          requester_email: email?.from_email || dueOut.requester,
          requester_name: email?.from_name,
          confidence: dueOut.confidence,
          is_completed: false,
        });
        stored++;
      } catch (error) {
        logger.error("Failed to store due-out", error, {
          emailId: dueOut.email_id,
        });
      }
    }

    logger.info("Due-outs detected", {
      userId,
      emails_analyzed: emails.length,
      due_outs_found: result.due_outs.length,
      stored,
    });

    return stored;
  } catch (error) {
    logger.error("Due-out detection failed", error, { userId, batch_size: emails.length });
    return 0;
  }
}

/**
 * Get emails without due-out analysis
 */
export async function getEmailsForDueOutAnalysis(
  userId: string,
  limit: number = 100
): Promise<EmailForDueOut[]> {
  const { data, error } = await supabaseAdmin
    .from("emails_metadata")
    .select("id, subject, from_email, from_name, snippet, received_at")
    .eq("user_id", userId)
    .not(
      "id",
      "in",
      supabaseAdmin.from("due_outs").select("email_id").eq("user_id", userId)
    )
    .order("received_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.error("Failed to fetch emails for due-out analysis", error, { userId });
    return [];
  }

  return data || [];
}
