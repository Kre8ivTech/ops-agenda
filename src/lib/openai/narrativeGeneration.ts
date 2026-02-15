/**
 * Daily Narrative Generation — OpenAI GPT-4o
 * 
 * Generates a personalized narrative summary of the day ahead.
 * Uses GPT-4o for higher quality, more coherent summaries.
 */

import { z } from "zod";
import { callOpenAI } from "./client";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

// Response schema
const NarrativeGenerationSchema = z.object({
  narrative: z.string(),
  tone: z.enum(["focused", "busy", "calm", "challenging"]).optional(),
  key_themes: z.array(z.string()).optional(),
});

type NarrativeGenerationResponse = z.infer<typeof NarrativeGenerationSchema>;

interface DayContext {
  user_name: string;
  date: string; // YYYY-MM-DD
  total_meetings: number;
  meeting_hours: number;
  priority_emails: {
    p1_count: number;
    p2_count: number;
  };
  due_outs: Array<{
    task: string;
    due_date: string;
  }>;
  focus_blocks: Array<{
    start: string;
    duration_minutes: number;
  }>;
}

/**
 * Generate daily narrative summary
 */
export async function generateDailyNarrative(
  userId: string,
  context: DayContext
): Promise<string> {
  try {
    const systemPrompt = `You are an executive assistant crafting a personalized daily briefing narrative.

**Tone:** Professional but conversational, supportive and action-oriented.

**Structure:**
1. Opening: Set the day's tone based on workload
2. Meetings: Summarize meeting load and themes
3. Priorities: Highlight urgent emails and deadlines
4. Focus Time: Identify opportunities for deep work
5. Closing: Brief motivational or strategic note

**Guidelines:**
- 2-3 short paragraphs (150-250 words total)
- Use second person ("you have", "your day")
- Be specific but concise
- Highlight the most important items
- Suggest strategic approach to the day
- Positive, empowering tone

**Example good opening:**
"Your Tuesday is meeting-heavy with 4 back-to-back sessions in the afternoon, but you have a solid 2-hour focus block this morning to tackle priorities."

**Example bad opening:**
"You have meetings today." (too vague)
"Today will be extremely challenging and overwhelming." (too negative)

Always return valid JSON with 'narrative' field.`;

    // Build context summary
    const meetingSummary =
      context.total_meetings > 0
        ? `${context.total_meetings} meeting${context.total_meetings > 1 ? "s" : ""} (${context.meeting_hours.toFixed(1)} hours)`
        : "No meetings scheduled";

    const prioritySummary = `${context.priority_emails.p1_count} urgent ${context.priority_emails.p1_count === 1 ? "email" : "emails"}${context.priority_emails.p2_count > 0 ? `, ${context.priority_emails.p2_count} important` : ""}`;

    const deadlineSummary =
      context.due_outs.length > 0
        ? context.due_outs.map((d) => `- ${d.task} (due ${formatDueDate(d.due_date)})`).join("\n")
        : "No deadlines today";

    const focusSummary =
      context.focus_blocks.length > 0
        ? context.focus_blocks
            .map((f) => `${Math.floor(f.duration_minutes / 60)}h${f.duration_minutes % 60 > 0 ? ` ${f.duration_minutes % 60}m` : ""} block`)
            .join(", ")
        : "No focus time available";

    const userPrompt = `Generate a daily narrative for ${context.user_name} on ${formatDate(context.date)}:

**Day Overview:**
- Meetings: ${meetingSummary}
- Priority Emails: ${prioritySummary}
- Deadlines:
${deadlineSummary}
- Focus Blocks: ${focusSummary}

Return JSON:
{
  "narrative": "Your personalized narrative here (2-3 paragraphs)",
  "tone": "focused|busy|calm|challenging",
  "key_themes": ["meetings", "deadlines", "focus_time"]
}`;

    const result = await callOpenAI<NarrativeGenerationResponse>({
      model: "QUALITY",
      systemPrompt,
      userPrompt,
      responseSchema: NarrativeGenerationSchema,
      temperature: 0.7, // Higher temperature for more natural, varied language
    });

    logger.info("Daily narrative generated", {
      userId,
      date: context.date,
      tone: result.tone,
    });

    return result.narrative;
  } catch (error) {
    logger.error("Narrative generation failed", error, { userId, date: context.date });
    
    // Fallback to template-based narrative
    return generateFallbackNarrative(context);
  }
}

/**
 * Fallback narrative if AI fails
 */
function generateFallbackNarrative(context: DayContext): string {
  const parts: string[] = [];

  // Meeting summary
  if (context.total_meetings > 0) {
    parts.push(
      `You have ${context.total_meetings} meeting${context.total_meetings > 1 ? "s" : ""} scheduled today (${context.meeting_hours.toFixed(1)} hours).`
    );
  } else {
    parts.push("You have no meetings scheduled today — a great day for focused work.");
  }

  // Priority summary
  if (context.priority_emails.p1_count > 0) {
    parts.push(
      `${context.priority_emails.p1_count} urgent email${context.priority_emails.p1_count > 1 ? "s" : ""} require${context.priority_emails.p1_count === 1 ? "s" : ""} your immediate attention.`
    );
  }

  // Deadline summary
  if (context.due_outs.length > 0) {
    parts.push(`You have ${context.due_outs.length} deadline${context.due_outs.length > 1 ? "s" : ""} today.`);
  }

  // Focus time
  if (context.focus_blocks.length > 0) {
    const totalFocusMinutes = context.focus_blocks.reduce((sum, block) => sum + block.duration_minutes, 0);
    const focusHours = Math.floor(totalFocusMinutes / 60);
    parts.push(
      `You have ${focusHours}+ hour${focusHours !== 1 ? "s" : ""} of focus time available for deep work.`
    );
  }

  return parts.join(" ");
}

/**
 * Format date for human reading
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Format due date relative to today
 */
function formatDueDate(dateStr: string): string {
  const due = new Date(dateStr);
  const today = new Date();
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays === -1) return "yesterday";
  if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays <= 7) return `in ${diffDays} days`;

  return due.toLocaleDateString();
}
