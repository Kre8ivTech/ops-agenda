import { describe, expect, it } from 'vitest';

import {
  buildAdminOverview,
  buildAttentionItems,
  summarizeConnectionHealth,
  summarizeIntegrations,
  summarizeModuleAdoption,
} from './overview';

const now = new Date('2026-08-27T12:00:00Z').getTime();

describe('summarizeConnectionHealth', () => {
  it('counts statuses and flags errors and stale syncs', () => {
    const summary = summarizeConnectionHealth(
      [
        { id: '1', accountId: 'a', accountName: 'Acme', provider: 'plaid', status: 'healthy', lastErrorCode: null, lastSyncAt: new Date(now - 48 * 60 * 60 * 1000) },
        { id: '2', accountId: 'a', accountName: 'Acme', provider: 'm365', status: 'degraded', lastErrorCode: 'token_expired', lastSyncAt: new Date(now) },
        { id: '3', accountId: 'b', accountName: 'Beta', provider: 'imap', status: 'pending', lastErrorCode: null, lastSyncAt: null },
        { id: '4', accountId: 'b', accountName: 'Beta', provider: 'google', status: 'revoked', lastErrorCode: null, lastSyncAt: null },
      ],
      now,
    );

    expect(summary).toEqual({
      total: 4,
      healthy: 1,
      degraded: 1,
      pending: 1,
      revoked: 1,
      withErrors: 1,
      staleSync: 1,
    });
  });
});

describe('summarizeModuleAdoption', () => {
  it('aggregates enabled counts by module', () => {
    const summary = summarizeModuleAdoption([
      { module: 'finances', enabled: true },
      { module: 'finances', enabled: false },
      { module: 'productivity', enabled: true },
    ]);

    expect(summary.totalRows).toBe(3);
    expect(summary.enabled).toBe(2);
    expect(summary.disabled).toBe(1);
    expect(summary.byModule).toEqual([
      { module: 'finances', enabled: 1, total: 2 },
      { module: 'productivity', enabled: 1, total: 1 },
    ]);
  });
});

describe('summarizeIntegrations', () => {
  it('tracks enabled state and test outcomes', () => {
    const summary = summarizeIntegrations([
      { id: '1', provider: 'stripe', label: 'Stripe prod', enabled: true, lastTestResult: 'ok', lastTestedAt: new Date(now) },
      { id: '2', provider: 'plaid', label: 'Plaid sandbox', enabled: true, lastTestResult: 'decrypt_failed', lastTestedAt: new Date(now) },
      { id: '3', provider: 'openai', label: 'OpenAI', enabled: false, lastTestResult: null, lastTestedAt: null },
    ]);

    expect(summary).toEqual({
      total: 3,
      enabled: 2,
      disabled: 1,
      testOk: 1,
      testFailed: 1,
      untested: 1,
    });
  });
});

describe('buildAttentionItems', () => {
  it('prioritizes database, suspended accounts, bad connections, and failed integrations', () => {
    const items = buildAttentionItems({
      databaseOk: false,
      accounts: [{ id: 'acc-1', name: 'Frozen Co', status: 'suspended' }],
      connections: [
        {
          id: 'c1',
          accountId: 'acc-1',
          accountName: 'Frozen Co',
          provider: 'plaid',
          status: 'degraded',
          lastErrorCode: 'sync_failed',
          lastSyncAt: null,
        },
      ],
      integrations: [
        {
          id: 'i1',
          provider: 'stripe',
          label: 'Stripe',
          enabled: true,
          lastTestResult: null,
          lastTestedAt: null,
        },
      ],
    });

    expect(items.map((item) => item.label)).toEqual([
      'Database unreachable',
      'Suspended account: Frozen Co',
      'Frozen Co · plaid degraded',
      'Stripe (stripe) not tested',
    ]);
  });
});

describe('buildAdminOverview', () => {
  it('assembles all overview sections from raw inputs', () => {
    const overview = buildAdminOverview({
      now,
      accounts: [{ id: 'acc-1', name: 'Acme', status: 'active' }],
      users: [{ status: 'active' }, { status: 'suspended' }],
      connections: [],
      modules: [{ module: 'plan', enabled: true }],
      integrations: [],
      auditEvents: [
        {
          id: 'evt-1',
          accountId: 'acc-1',
          accountName: 'Acme',
          action: 'user.login',
          targetType: 'user',
          targetId: 'user-1',
          at: new Date(now),
          actorUserId: 'user-1',
          actorPlatformAdminId: null,
        },
      ],
      ai: { totalRequests: 42, successRate: 0.95, avgLatencyMs: 820 },
      database: { ok: true, latencyMs: 12 },
    });

    expect(overview.accounts.total).toBe(1);
    expect(overview.users.suspended).toBe(1);
    expect(overview.modules.enabled).toBe(1);
    expect(overview.ai.totalRequests).toBe(42);
    expect(overview.auditEvents).toHaveLength(1);
    expect(overview.attention).toHaveLength(0);
  });
});
