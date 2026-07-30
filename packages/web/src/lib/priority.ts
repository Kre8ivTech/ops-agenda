import { z } from 'zod';

/**
 * Priority taxonomy from the PRD. The AI pipeline returns JSON only, and every
 * response is schema-validated before it reaches the UI — an unparseable or
 * out-of-taxonomy classification must fail loudly, not render as garbage.
 */
export const PRIORITIES = ['P1', 'P2', 'P3', 'FYSA'] as const;

export const prioritySchema = z.enum(PRIORITIES);
export type Priority = z.infer<typeof prioritySchema>;

export const classificationSchema = z.object({
  priority: prioritySchema,
  /** The PRD requires a confidence score on every classification. */
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1).max(500),
});
export type Classification = z.infer<typeof classificationSchema>;

const PRIORITY_RANK: Record<Priority, number> = { P1: 0, P2: 1, P3: 2, FYSA: 3 };

/** Sorts most urgent first; ties broken by descending confidence. */
export function sortByPriority<T extends Classification>(items: readonly T[]): T[] {
  return [...items].sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.confidence - a.confidence,
  );
}

/**
 * Parses a raw AI response. Returns a discriminated result instead of throwing
 * so callers can degrade gracefully to raw data, per the PRD requirement.
 */
export function parseClassification(
  raw: unknown,
): { ok: true; value: Classification } | { ok: false; error: string } {
  const result = classificationSchema.safeParse(raw);
  return result.success
    ? { ok: true, value: result.data }
    : {
        ok: false,
        error: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      };
}
