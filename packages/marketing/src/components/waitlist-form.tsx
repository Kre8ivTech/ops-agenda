'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

import { CTA_LABEL_TEXT, WAITLIST_ENDPOINT } from '@/lib/site-config';

type Status = 'idle' | 'submitting' | 'joined' | 'error';

export interface WaitlistFormProps {
  /** `inline` sits beside the hero copy; `stacked` fills the waitlist page column. */
  layout?: 'inline' | 'stacked';
  /** Success copy differs slightly between the hero and the waitlist page. */
  successBody?: string;
  /** Fine print rendered under a stacked form. */
  note?: string;
}

export function WaitlistForm({
  layout = 'inline',
  successBody = 'We will write when there is something real to show you.',
  note,
}: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!WAITLIST_ENDPOINT) {
      // No intake endpoint is deployed yet — say so rather than showing a
      // success state we cannot honour.
      setStatus('error');
      return;
    }

    setStatus('submitting');

    try {
      const response = await fetch(WAITLIST_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus(response.ok ? 'joined' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'joined') {
    return (
      <div className="border-border bg-wash-green flex max-w-[520px] items-start gap-[11px] rounded-[10px] border px-[18px] py-4">
        <span className="bg-signal mt-[7px] h-[7px] w-[7px] shrink-0 rounded-full" />
        <p className="text-ink m-0 text-[0.93rem] leading-[1.5]">
          <strong className="font-extrabold">You&rsquo;re on the list.</strong> {successBody}
        </p>
      </div>
    );
  }

  const input = (
    <input
      type="email"
      required
      value={email}
      onChange={(event) => setEmail(event.target.value)}
      placeholder="dana@yourcompany.com"
      aria-label="Email address"
      className="border-border text-ink focus:border-signal h-[52px] w-full rounded-[8px] border bg-white px-4 outline-none"
    />
  );

  const submit = (
    <button
      type="submit"
      disabled={status === 'submitting'}
      className="bg-ink hover:bg-signal inline-flex h-[52px] items-center justify-center rounded-[8px] px-6 font-extrabold text-[var(--paper)] transition-colors disabled:opacity-70"
    >
      {status === 'submitting' ? 'Joining…' : CTA_LABEL_TEXT}
    </button>
  );

  const error =
    status === 'error' ? (
      <p className="text-risk m-0 text-[0.84rem] leading-[1.5]">
        Waitlist signups are not open yet. Write to{' '}
        <a href="mailto:info@kre8ivtech.com" className="underline">
          info@kre8ivtech.com
        </a>{' '}
        and we will add you by hand.
      </p>
    ) : null;

  if (layout === 'stacked') {
    return (
      <form onSubmit={handleSubmit} className="grid max-w-[440px] gap-3">
        {input}
        {submit}
        {error}
        {note ? (
          <p className="text-text-secondary m-0 text-[0.83rem] leading-[1.5]">{note}</p>
        ) : null}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full max-w-[320px] min-w-[220px]">{input}</div>
        {submit}
      </div>
      {error}
    </form>
  );
}
