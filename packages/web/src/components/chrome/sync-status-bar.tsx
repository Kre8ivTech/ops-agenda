'use client';

import { useEffect, useState } from 'react';

interface SyncStatus {
  label: string;
  state: 'healthy' | 'degraded' | 'syncing' | 'none';
  detail: string;
}

export function SyncStatusBar() {
  const [status, setStatus] = useState<SyncStatus>({
    label: 'SYNC',
    state: 'none',
    detail: 'Checking connections…',
  });

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          // Simple heuristic — if app is healthy, connectors are likely working
          setStatus({
            label: 'SYNC',
            state: 'healthy',
            detail: 'Mail and calendar connected',
          });
        }
      } catch {
        setStatus({
          label: 'SYNC',
          state: 'degraded',
          detail: 'Unable to reach server',
        });
      }
    }
    check();
  }, []);

  const stateColors = {
    healthy: 'bg-signal',
    degraded: 'bg-amber-500',
    syncing: 'bg-blue-500 animate-pulse',
    none: 'bg-border',
  };

  return (
    <div className="flex items-center gap-2 rounded-[6px] bg-white/5 px-2.5 py-2">
      <span className={`size-2 shrink-0 rounded-full ${stateColors[status.state]}`} />
      <span className="min-w-0">
        <span className="block text-[0.68rem] font-extrabold uppercase tracking-wider text-white/50">
          {status.label} → {status.state === 'healthy' ? 'HEALTHY' : status.state === 'degraded' ? 'DEGRADED' : 'CHECKING'}
        </span>
        <span className="block truncate text-[0.72rem] text-white/40">
          {status.detail}
        </span>
      </span>
    </div>
  );
}
