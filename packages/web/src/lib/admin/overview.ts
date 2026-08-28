export interface ConnectionHealthInput {
  id: string;
  accountId: string;
  accountName: string;
  provider: string;
  status: string;
  lastErrorCode: string | null;
  lastSyncAt: Date | null;
}

export interface ConnectionHealthSummary {
  total: number;
  healthy: number;
  degraded: number;
  pending: number;
  revoked: number;
  withErrors: number;
  staleSync: number;
}

export interface ModuleStateInput {
  module: string;
  enabled: boolean;
}

export interface ModuleAdoptionSummary {
  totalRows: number;
  enabled: number;
  disabled: number;
  uniqueModules: number;
  byModule: { module: string; enabled: number; total: number }[];
}

export interface IntegrationInput {
  id: string;
  provider: string;
  label: string;
  enabled: boolean;
  lastTestResult: string | null;
  lastTestedAt: Date | null;
}

export interface IntegrationSummary {
  total: number;
  enabled: number;
  disabled: number;
  testOk: number;
  testFailed: number;
  untested: number;
}

export interface AccountInput {
  id: string;
  name: string;
  status: string;
}

export interface UserInput {
  status: string;
}

export interface AuditEventInput {
  id: string;
  accountId: string;
  accountName: string;
  action: string;
  targetType: string;
  targetId: string;
  at: Date;
  actorUserId: string | null;
  actorPlatformAdminId: string | null;
}

export type AttentionSeverity = 'warning' | 'error';

export interface AttentionItem {
  severity: AttentionSeverity;
  label: string;
  detail: string;
  href: string;
}

export interface AdminOverviewData {
  accounts: { total: number; active: number; suspended: number };
  users: { total: number; active: number; suspended: number };
  connections: ConnectionHealthSummary;
  modules: ModuleAdoptionSummary;
  integrations: IntegrationSummary;
  ai: { totalRequests: number; successRate: number; avgLatencyMs: number };
  auditEvents: AuditEventInput[];
  attention: AttentionItem[];
  database: { ok: boolean; latencyMs: number | null };
}

const STALE_SYNC_MS = 24 * 60 * 60 * 1000;

export function summarizeAccounts(accounts: AccountInput[]) {
  const active = accounts.filter((a) => a.status === 'active').length;
  return {
    total: accounts.length,
    active,
    suspended: accounts.length - active,
  };
}

export function summarizeUsers(users: UserInput[]) {
  const active = users.filter((u) => u.status === 'active').length;
  return {
    total: users.length,
    active,
    suspended: users.length - active,
  };
}

export function summarizeConnectionHealth(
  connections: ConnectionHealthInput[],
  now = Date.now(),
): ConnectionHealthSummary {
  const counts = { healthy: 0, degraded: 0, pending: 0, revoked: 0 };
  let withErrors = 0;
  let staleSync = 0;

  for (const conn of connections) {
    if (conn.status in counts) {
      counts[conn.status as keyof typeof counts] += 1;
    }
    if (conn.lastErrorCode) withErrors += 1;
    if (
      conn.status === 'healthy' &&
      conn.lastSyncAt &&
      now - conn.lastSyncAt.getTime() > STALE_SYNC_MS
    ) {
      staleSync += 1;
    }
  }

  return {
    total: connections.length,
    ...counts,
    withErrors,
    staleSync,
  };
}

export function summarizeModuleAdoption(rows: ModuleStateInput[]): ModuleAdoptionSummary {
  const byModule = new Map<string, { enabled: number; total: number }>();
  let enabled = 0;

  for (const row of rows) {
    const entry = byModule.get(row.module) ?? { enabled: 0, total: 0 };
    entry.total += 1;
    if (row.enabled) {
      entry.enabled += 1;
      enabled += 1;
    }
    byModule.set(row.module, entry);
  }

  return {
    totalRows: rows.length,
    enabled,
    disabled: rows.length - enabled,
    uniqueModules: byModule.size,
    byModule: [...byModule.entries()]
      .map(([module, stats]) => ({ module, ...stats }))
      .sort((a, b) => b.enabled - a.enabled || a.module.localeCompare(b.module)),
  };
}

export function summarizeIntegrations(rows: IntegrationInput[]): IntegrationSummary {
  let enabled = 0;
  let testOk = 0;
  let testFailed = 0;
  let untested = 0;

  for (const row of rows) {
    if (row.enabled) enabled += 1;
    if (row.lastTestResult === 'ok') testOk += 1;
    else if (row.lastTestResult) testFailed += 1;
    else untested += 1;
  }

  return {
    total: rows.length,
    enabled,
    disabled: rows.length - enabled,
    testOk,
    testFailed,
    untested,
  };
}

export function buildAttentionItems(input: {
  accounts: AccountInput[];
  connections: ConnectionHealthInput[];
  integrations: IntegrationInput[];
  databaseOk: boolean;
}): AttentionItem[] {
  const items: AttentionItem[] = [];

  if (!input.databaseOk) {
    items.push({
      severity: 'error',
      label: 'Database unreachable',
      detail: 'Platform cannot reach PostgreSQL — check RDS and networking.',
      href: '/admin/system',
    });
  }

  for (const account of input.accounts) {
    if (account.status === 'suspended') {
      items.push({
        severity: 'warning',
        label: `Suspended account: ${account.name}`,
        detail: 'Tenant access is blocked until reactivated.',
        href: `/admin/accounts/${account.id}`,
      });
    }
  }

  for (const conn of input.connections) {
    if (conn.status === 'degraded') {
      items.push({
        severity: 'error',
        label: `${conn.accountName} · ${conn.provider} degraded`,
        detail: conn.lastErrorCode ?? 'Connection sync is failing.',
        href: '/admin/connections',
      });
    } else if (conn.lastErrorCode) {
      items.push({
        severity: 'warning',
        label: `${conn.accountName} · ${conn.provider} error`,
        detail: conn.lastErrorCode,
        href: '/admin/connections',
      });
    }
  }

  for (const cred of input.integrations) {
    if (cred.lastTestResult && cred.lastTestResult !== 'ok') {
      items.push({
        severity: 'error',
        label: `${cred.label} (${cred.provider}) test failed`,
        detail: cred.lastTestResult,
        href: '/admin/integrations',
      });
    } else if (cred.enabled && !cred.lastTestedAt) {
      items.push({
        severity: 'warning',
        label: `${cred.label} (${cred.provider}) not tested`,
        detail: 'Enabled credential has never been validated.',
        href: '/admin/integrations',
      });
    }
  }

  return items.slice(0, 12);
}

export function buildAdminOverview(input: {
  accounts: AccountInput[];
  users: UserInput[];
  connections: ConnectionHealthInput[];
  modules: ModuleStateInput[];
  integrations: IntegrationInput[];
  auditEvents: AuditEventInput[];
  ai: { totalRequests: number; successRate: number; avgLatencyMs: number };
  database: { ok: boolean; latencyMs: number | null };
  now?: number;
}): AdminOverviewData {
  return {
    accounts: summarizeAccounts(input.accounts),
    users: summarizeUsers(input.users),
    connections: summarizeConnectionHealth(input.connections, input.now),
    modules: summarizeModuleAdoption(input.modules),
    integrations: summarizeIntegrations(input.integrations),
    ai: input.ai,
    auditEvents: input.auditEvents,
    attention: buildAttentionItems({
      accounts: input.accounts,
      connections: input.connections,
      integrations: input.integrations,
      databaseOk: input.database.ok,
    }),
    database: input.database,
  };
}
