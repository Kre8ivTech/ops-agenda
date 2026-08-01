import { getSystemHealth } from '@/lib/admin/actions';

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default async function AdminSystemPage() {
  const health = await getSystemHealth();

  const cards = [
    {
      label: 'Database',
      value: health.database.ok ? `${health.database.latencyMs}ms` : 'DOWN',
      status: health.database.ok ? 'ok' : 'error',
      note: health.database.ok ? 'Connected (SSL)' : health.database.error,
    },
    {
      label: 'Uptime',
      value: formatUptime(health.uptime),
      status: 'ok',
      note: 'Current process',
    },
    {
      label: 'Accounts',
      value: String(health.accountCount),
      status: 'ok',
      note: 'Total tenant accounts',
    },
    {
      label: 'Users',
      value: String(health.userCount),
      status: 'ok',
      note: 'Total users',
    },
    {
      label: 'Connections',
      value: String(health.connectionCount),
      status: 'ok',
      note: 'Total data connections',
    },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">System</p>
        <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">
          System health
        </h1>
        <p className="text-text-secondary m-0 mt-2 text-[0.9rem]">
          Runtime diagnostics and infrastructure status.
        </p>
      </div>

      {/* Health cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="border-border rounded-[8px] border bg-white p-5"
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`size-2.5 rounded-full ${
                  card.status === 'ok' ? 'bg-signal' : 'bg-[#dc3545]'
                }`}
              />
              <p className="text-text-secondary m-0 text-[0.74rem] font-extrabold uppercase">
                {card.label}
              </p>
            </div>
            <strong className="text-ink text-[1.5rem] tracking-[-0.02em]">
              {card.value}
            </strong>
            <p className="text-text-secondary m-0 mt-1 text-[0.8rem]">{card.note}</p>
          </div>
        ))}
      </div>

      {/* Environment details */}
      <section className="border-border rounded-[8px] border bg-white p-5">
        <h2 className="text-ink m-0 mb-4 text-[0.95rem] font-extrabold">
          Environment
        </h2>
        <dl className="grid grid-cols-1 gap-3 text-[0.85rem] sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-text-secondary font-bold">Node.js</dt>
            <dd className="text-ink m-0 font-mono">{health.nodeVersion}</dd>
          </div>
          <div>
            <dt className="text-text-secondary font-bold">Next.js</dt>
            <dd className="text-ink m-0 font-mono">{health.nextVersion}</dd>
          </div>
          <div>
            <dt className="text-text-secondary font-bold">Environment</dt>
            <dd className="text-ink m-0 font-mono">{health.env}</dd>
          </div>
          <div>
            <dt className="text-text-secondary font-bold">Region</dt>
            <dd className="text-ink m-0 font-mono">{health.region}</dd>
          </div>
        </dl>
      </section>

      {/* Database detail */}
      <section className="border-border rounded-[8px] border bg-white p-5">
        <h2 className="text-ink m-0 mb-4 text-[0.95rem] font-extrabold">
          Database
        </h2>
        <dl className="grid grid-cols-1 gap-3 text-[0.85rem] sm:grid-cols-3">
          <div>
            <dt className="text-text-secondary font-bold">Status</dt>
            <dd className="m-0">
              <span
                className={`rounded-full px-2.5 py-1 text-[0.75rem] font-extrabold ${
                  health.database.ok ? 'bg-wash-green text-signal' : 'bg-risk-wash text-ink'
                }`}
              >
                {health.database.ok ? 'Connected' : 'Unreachable'}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary font-bold">Latency</dt>
            <dd className="text-ink m-0 font-mono">
              {health.database.latencyMs !== null ? `${health.database.latencyMs}ms` : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary font-bold">Engine</dt>
            <dd className="text-ink m-0 font-mono">PostgreSQL 16 (RDS)</dd>
          </div>
        </dl>
        {health.database.error ? (
          <pre className="bg-risk-wash text-ink mt-3 overflow-auto rounded p-3 text-[0.78rem]">
            {health.database.error}
          </pre>
        ) : null}
      </section>
    </div>
  );
}
