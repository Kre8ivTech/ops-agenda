'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/button';

interface AskState {
  answer: string | null;
  error: string | null;
  latencyMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
}

const initial: AskState = { answer: null, error: null, latencyMs: null, inputTokens: null, outputTokens: null };

export function AskForm({ askAction }: { askAction: (prev: AskState, formData: FormData) => Promise<AskState> }) {
  const [state, action, pending] = useActionState(askAction, initial);
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

  return (
    <div className="flex flex-col gap-5">
      {/* Conversation history */}
      {history.length > 0 || state.answer ? (
        <div className="border-border max-h-[60vh] space-y-3 overflow-y-auto rounded-[8px] border bg-white p-5">
          {history.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-[8px] px-4 py-2.5 text-[0.9rem] leading-[1.5] ${
                  msg.role === 'user'
                    ? 'bg-ink text-white'
                    : 'bg-wash text-ink'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {state.answer && !history.find((h) => h.content === state.answer) ? (
            <div className="flex justify-start">
              <div className="bg-wash text-ink max-w-[80%] rounded-[8px] px-4 py-2.5 text-[0.9rem] leading-[1.5] whitespace-pre-wrap">
                {state.answer}
              </div>
            </div>
          ) : null}
          {pending ? (
            <div className="flex justify-start">
              <div className="bg-wash text-text-secondary rounded-[8px] px-4 py-2.5 text-[0.85rem]">
                <span className="animate-pulse">Thinking…</span>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Error */}
      {state.error ? (
        <div className="border-border bg-risk-wash text-ink rounded-[8px] border px-4 py-3 text-[0.85rem]">
          {state.error}
        </div>
      ) : null}

      {/* Stats */}
      {state.latencyMs && !pending ? (
        <div className="text-text-secondary flex gap-4 text-[0.75rem]">
          <span>{state.latencyMs}ms</span>
          <span>{state.inputTokens} in / {state.outputTokens} out tokens</span>
        </div>
      ) : null}

      {/* Input form */}
      <form
        action={(formData) => {
          const question = formData.get('question') as string;
          if (question.trim()) {
            // Add to history before submitting
            setHistory((prev) => {
              const updated = [...prev];
              if (state.answer) {
                // Add previous answer to history
                const lastQ = prev[prev.length - 1];
                if (!lastQ || lastQ.role !== 'assistant') {
                  updated.push({ role: 'assistant', content: state.answer! });
                }
              }
              updated.push({ role: 'user', content: question });
              return updated;
            });
          }
          action(formData);
        }}
        className="flex gap-3"
      >
        <input
          type="text"
          name="question"
          placeholder="Ask about your tasks, schedule, or workload…"
          required
          disabled={pending}
          autoComplete="off"
          className="text-ink placeholder:text-text-secondary/55 focus:border-signal h-[46px] min-w-0 flex-1 rounded-[8px] border border-border bg-white px-[13px] outline-none transition-[border-color,box-shadow] focus:shadow-[0_0_0_3px_var(--wash-green)] disabled:opacity-55"
          data-testid="ask-input"
        />
        <Button type="submit" size="large" disabled={pending} data-testid="ask-submit">
          {pending ? 'Thinking…' : 'Ask'}
        </Button>
      </form>
    </div>
  );
}
