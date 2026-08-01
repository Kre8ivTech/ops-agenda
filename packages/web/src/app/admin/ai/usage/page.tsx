import { getAiUsageSummary } from '@/lib/admin/ai-actions';

export default async function AdminAiUsagePage() {
  const summary = await getAiUsageSummary();

  const totalTokens = summary.totalInputTokens + summary.totalOutputTokens;

  const cards = [
    {
      label: 'Total Requests',
      value: summary.totalRequests.toLocaleString(),
      note: 'All-time AI requests',
    },
    {
      label: 'Total Tokens',
      value: totalTokens.toLocaleString(),
      note: `${summary.totalInputTokens.toLocaleString()} in / ${summary.totalOutputTokens.toLocaleString()} out`,
    },
    {
      label: 'Total Cost',
      value: `$${summary.totalCostUsd.toFixed(2)}`,
      note: 'USD spent',
    },
    {
      label: 'Success Rate',
      value: `${(summary.successRate * 100).toFixed(1)}%`,
      note: 'Requests completed successfully',
    },
    {
      label: 'Avg Latency',
      value: `${summary.avgLatencyMs.toFixed(0)}ms`,
      note: 'Mean response time',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <p className="text-signal mb-1.5 text-[0.76rem] font-extrabold uppercase">AI</p>
        <h1 className="text-ink m-0 text-[1.7rem] font-extrabold tracking-[-0.02em]">
          Usage &amp; Observability
        </h1>
        <p className="text-text-secondary m-0 mt-2 text-[0.9rem]">
          AI request volume, token consumption, cost, and performance metrics.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="border-border rounded-[8px] border bg-white p-5"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-signal" />
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

      {/* By Model */}
      <section className="border-border rounded-[8px] border bg-white p-5">
        <h2 className="text-ink m-0 mb-4 text-[0.95rem] font-extrabold">By Model</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.85rem]">
            <thead>
              <tr className="border-border border-b">
                <th className="text-text-secondary pb-2 pr-4 font-bold">Model</th>
                <th className="text-text-secondary pb-2 pr-4 text-right font-bold">Requests</th>
                <th className="text-text-secondary pb-2 pr-4 text-right font-bold">Tokens</th>
                <th className="text-text-secondary pb-2 text-right font-bold">Cost</th>
              </tr>
            </thead>
            <tbody>
              {summary.byModel.map((row) => (
                <tr key={row.modelId ?? 'unknown'} className="border-border border-b last:border-0">
                  <td className="text-ink py-2 pr-4 font-mono">{row.displayName}</td>
                  <td className="text-ink py-2 pr-4 text-right">{row.requests.toLocaleString()}</td>
                  <td className="text-ink py-2 pr-4 text-right">{row.tokens.toLocaleString()}</td>
                  <td className="text-ink py-2 text-right">${row.cost.toFixed(2)}</td>
                </tr>
              ))}
              {summary.byModel.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-text-secondary py-4 text-center">
                    No usage data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* By Agent */}
      <section className="border-border rounded-[8px] border bg-white p-5">
        <h2 className="text-ink m-0 mb-4 text-[0.95rem] font-extrabold">By Agent</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.85rem]">
            <thead>
              <tr className="border-border border-b">
                <th className="text-text-secondary pb-2 pr-4 font-bold">Agent</th>
                <th className="text-text-secondary pb-2 pr-4 text-right font-bold">Requests</th>
                <th className="text-text-secondary pb-2 text-right font-bold">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {summary.byAgent.map((row) => (
                <tr key={row.agentId ?? 'unknown'} className="border-border border-b last:border-0">
                  <td className="text-ink py-2 pr-4 font-mono">{row.agentName}</td>
                  <td className="text-ink py-2 pr-4 text-right">{row.requests.toLocaleString()}</td>
                  <td className="text-ink py-2 text-right">{row.tokens.toLocaleString()}</td>
                </tr>
              ))}
              {summary.byAgent.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-text-secondary py-4 text-center">
                    No usage data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Requests */}
      <section className="border-border rounded-[8px] border bg-white p-5">
        <h2 className="text-ink m-0 mb-4 text-[0.95rem] font-extrabold">Recent Requests</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.85rem]">
            <thead>
              <tr className="border-border border-b">
                <th className="text-text-secondary pb-2 pr-4 font-bold">Time</th>
                <th className="text-text-secondary pb-2 pr-4 font-bold">Model</th>
                <th className="text-text-secondary pb-2 pr-4 font-bold">Agent</th>
                <th className="text-text-secondary pb-2 pr-4 text-right font-bold">Input</th>
                <th className="text-text-secondary pb-2 pr-4 text-right font-bold">Output</th>
                <th className="text-text-secondary pb-2 pr-4 text-right font-bold">Cost</th>
                <th className="text-text-secondary pb-2 pr-4 text-right font-bold">Latency</th>
                <th className="text-text-secondary pb-2 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {summary.recentLogs.map((log) => (
                <tr key={log.id} className="border-border border-b last:border-0">
                  <td className="text-ink whitespace-nowrap py-2 pr-4 font-mono text-[0.78rem]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="text-ink py-2 pr-4">{log.modelId ?? '—'}</td>
                  <td className="text-ink py-2 pr-4">{log.agentId ?? '—'}</td>
                  <td className="text-ink py-2 pr-4 text-right">
                    {Number(log.inputTokens).toLocaleString()}
                  </td>
                  <td className="text-ink py-2 pr-4 text-right">
                    {Number(log.outputTokens).toLocaleString()}
                  </td>
                  <td className="text-ink py-2 pr-4 text-right">
                    {log.costUsd != null ? `$${Number(log.costUsd).toFixed(2)}` : '—'}
                  </td>
                  <td className="text-ink py-2 pr-4 text-right">
                    {log.latencyMs != null ? `${Number(log.latencyMs).toFixed(0)}ms` : '—'}
                  </td>
                  <td className="py-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[0.72rem] font-extrabold ${
                        log.success
                          ? 'bg-wash-green text-signal'
                          : 'bg-risk-wash text-[#dc3545]'
                      }`}
                    >
                      {log.success ? 'OK' : 'FAIL'}
                    </span>
                  </td>
                </tr>
              ))}
              {summary.recentLogs.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-text-secondary py-4 text-center">
                    No requests logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
