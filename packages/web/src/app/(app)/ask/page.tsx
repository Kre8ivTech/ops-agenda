import { getSession } from '@/lib/auth';
import { ask } from '@/lib/ai/ask';
import { AskForm } from '@/components/ask-form';

interface AskState {
  answer: string | null;
  error: string | null;
  latencyMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
}

export default async function AskPage() {
  const session = await getSession();
  const hasTenant = !!(session?.accountId && session?.userId);

  async function askAction(_prev: AskState, formData: FormData): Promise<AskState> {
    'use server';

    const question = (formData.get('question') as string)?.trim();
    if (!question) {
      return { answer: null, error: 'Please enter a question.', latencyMs: null, inputTokens: null, outputTokens: null };
    }

    const sess = await getSession();
    if (!sess?.accountId || !sess?.userId) {
      return { answer: null, error: 'You must be signed in with a workspace to use Ask.', latencyMs: null, inputTokens: null, outputTokens: null };
    }

    try {
      const result = await ask({
        question,
        tenant: { accountId: sess.accountId, userId: sess.userId },
      });

      return {
        answer: result.answer,
        error: null,
        latencyMs: result.latencyMs,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      return { answer: null, error: message, latencyMs: null, inputTokens: null, outputTokens: null };
    }
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">Ask</p>
        <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">
          Ask about your data
        </h1>
        <p className="text-text-secondary m-0 mt-2 max-w-[62ch] text-[0.92rem] leading-[1.5]">
          Ask questions about your tasks, workload, priorities, and schedule.
          Answers are scoped to your account — AI can read but never modify your data.
        </p>
      </div>

      {hasTenant ? (
        <AskForm askAction={askAction} />
      ) : (
        <div className="border-border bg-info-wash rounded-[8px] border px-4 py-3 text-[0.85rem]">
          Complete onboarding to start using Ask.
        </div>
      )}
    </div>
  );
}
