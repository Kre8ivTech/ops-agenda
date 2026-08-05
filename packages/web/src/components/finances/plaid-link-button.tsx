'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';

type PlaidLinkState = 'idle' | 'loading' | 'open' | 'success' | 'error';

export function PlaidLinkButton() {
  const [state, setState] = useState<PlaidLinkState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    setState('loading');
    setError(null);

    try {
      // 1. Get link token from our API
      const tokenRes = await fetch('/api/finances/plaid/link-token', { method: 'POST' });
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || tokenData.error) {
        setError(tokenData.error ?? 'Failed to initialize Plaid');
        setState('error');
        return;
      }

      // 2. Load Plaid Link script if not already loaded
      await loadPlaidScript();

      // 3. Open Plaid Link
      setState('open');
      const Plaid = (window as unknown as { Plaid: PlaidFactory }).Plaid;

      const handler = Plaid.create({
        token: tokenData.linkToken,
        onSuccess: async (publicToken: string, metadata: PlaidMetadata) => {
          setState('loading');
          try {
            // 4. Exchange the public token
            const exchangeRes = await fetch('/api/finances/plaid/exchange', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                publicToken,
                institutionName: metadata?.institution?.name ?? 'Bank',
                institutionId: metadata?.institution?.institution_id ?? '',
              }),
            });
            const exchangeData = await exchangeRes.json();

            if (!exchangeRes.ok || exchangeData.error) {
              setError(exchangeData.error ?? 'Failed to connect account');
              setState('error');
              return;
            }

            setSuccessMessage(`Connected ${metadata?.institution?.name ?? 'account'} successfully!`);
            setState('success');

            // Refresh the page after a short delay
            setTimeout(() => window.location.reload(), 1500);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Connection failed');
            setState('error');
          }
        },
        onExit: (err: unknown) => {
          if (err) {
            setError('Connection was cancelled or failed');
            setState('error');
          } else {
            setState('idle');
          }
        },
        onEvent: () => { /* optional: track events */ },
      });

      handler.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
      setState('error');
    }
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="primary"
        size="medium"
        onClick={handleConnect}
        disabled={state === 'loading' || state === 'open'}
      >
        {state === 'loading' ? 'Connecting...' : state === 'open' ? 'Plaid is open...' : 'Connect with Plaid'}
      </Button>

      {error && (
        <p className="m-0 text-[0.82rem] text-risk">{error}</p>
      )}

      {successMessage && (
        <p className="m-0 text-[0.82rem] font-bold text-signal">{successMessage}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Plaid script loader
// ---------------------------------------------------------------------------

let scriptLoaded = false;

function loadPlaidScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="plaid.com/link"]');
    if (existing) {
      scriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Plaid script'));
    document.head.appendChild(script);
  });
}

// ---------------------------------------------------------------------------
// Plaid types (minimal)
// ---------------------------------------------------------------------------

interface PlaidMetadata {
  institution?: { name: string; institution_id: string };
  accounts?: { id: string; name: string; mask: string; type: string }[];
}

interface PlaidHandler {
  open: () => void;
  exit: () => void;
}

interface PlaidFactory {
  create: (config: {
    token: string;
    onSuccess: (publicToken: string, metadata: PlaidMetadata) => void;
    onExit: (err: unknown) => void;
    onEvent: (event: string) => void;
  }) => PlaidHandler;
}
